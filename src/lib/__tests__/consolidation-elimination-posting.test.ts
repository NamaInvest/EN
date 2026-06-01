// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';
import { ConsolidationEliminationPostingService } from '../consolidation-elimination-posting';
import { FinancialConsolidationEngine } from '../financial-consolidation-engine';
import { assertPeriodWritable } from '../governance/period-lock';
import { AccountingJournalService } from '../services/accounting-journal.service';
import { lockIdempotencyKey } from '../idempotency';
import crypto from 'crypto';

// Hash helper identical to service
function generateHash(data: unknown): string {
  const str = JSON.stringify(data || '');
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Global mocks
const mockPrisma = {
  consolidationEliminationRequest: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  consolidationEliminationPosting: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

jest.mock('../prisma', () => ({
  getPrisma: jest.fn(() => mockPrisma),
}));

jest.mock('../financial-consolidation-engine', () => {
  return {
    FinancialConsolidationEngine: jest.fn().mockImplementation(() => {
      return {
        dryRunEliminations: jest.fn(),
      };
    }),
  };
});

jest.mock('../governance/period-lock', () => ({
  assertPeriodWritable: jest.fn(),
}));

jest.mock('../services/accounting-journal.service', () => ({
  AccountingJournalService: {
    createEntry: jest.fn(),
  },
}));

jest.mock('../idempotency', () => ({
  lockIdempotencyKey: jest.fn(),
  completeIdempotencyKey: jest.fn(),
  unlockIdempotencyKey: jest.fn(),
}));

describe('ConsolidationEliminationPostingService Local Tests', () => {
  const tenantId = 'tenant-xyz';
  const requestId = 'req-abc';
  const actorIdMaker = 'user-maker-1';
  const actorIdCfo = 'user-cfo-2';
  const actorIdMaster = 'user-master-3';
  const idempotencyKey = 'unique-idemp-key';

  const baseSnap = [
    {
      description: 'Intercompany Elimination 1',
      reference: 'ELIM_101_2026-05_0',
      entryDate: '2026-05-31',
      autoReverseDate: '2026-06-01',
      lines: [
        { accountCode: '1100', accountName: 'Receivable', debit: 1000, credit: 0, description: 'Debit Line' },
        { accountCode: '2100', accountName: 'Payable', debit: 0, credit: 1000, description: 'Credit Line' },
      ],
    },
  ];

  const makeBaseRequest = (overrides = {}) => ({
    id: requestId,
    tenantId,
    groupId: 101,
    periodFrom: new Date('2026-05-01'),
    periodTo: new Date('2026-05-31'),
    periodKey: '2026-05',
    status: 'POSTING_READY',
    previewHash: generateHash(baseSnap),
    snapshotJson: baseSnap,
    totalDebit: new Decimal(1000),
    totalCredit: new Decimal(1000),
    autoReverseDate: new Date('2026-06-01'),
    createdBy: actorIdMaker,
    cfoApprovedBy: actorIdCfo,
    masterApprovedBy: actorIdMaster,
    ...overrides,
  });

  const mockEngineInstance = {
    dryRunEliminations: jest.fn().mockResolvedValue({
      proposedEntries: baseSnap,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);
    (assertPeriodWritable as any).mockResolvedValue('ALLOWED');
  });

  it('validateApprovedRequestForPosting succeeds with MASTER_APPROVED / POSTING_READY request', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    
    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateApprovedRequestForPosting fails if no CFO approval exists', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest({ cfoApprovedBy: null }));
    
    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('موافقة المدير المالي (CFO approval) غير موجودة');
  });

  it('validateApprovedRequestForPosting fails if no Master Admin approval exists', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest({ masterApprovedBy: null }));
    
    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('اعتماد المسؤول الرئيسي (Master Admin approval) غير موجود');
  });

  it('validateApprovedRequestForPosting fails if actorId matches createdBy (segregation of duties)', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    
    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, actorIdMaker, 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('يمنع ترحيل القيود بواسطة نفس المحاسب الذي أنشأ الطلب (Maker != Poster)');
  });

  it('validateApprovedRequestForPosting fails if totalDebit != totalCredit', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest({ totalCredit: new Decimal(900) }));
    
    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('الطلب غير متوازن حسابياً (إجمالي المدين لا يساوي إجمالي الدائن)');
  });

  it('validateApprovedRequestForPosting fails if previewHash has drifted', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    
    // Simulate drift: dryRun returns modified proposed lines
    const mockDriftEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        proposedEntries: [{ entryChanged: true }],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockDriftEngineInstance);

    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('تغيرت أرصدة الحسابات البينية في النظام منذ اعتماد الطلب، يرجى تقديم طلب جديد وإعادة اعتماده');
  });

  it('validateApprovedRequestForPosting fails if posting period is locked', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    (assertPeriodWritable as any).mockRejectedValue(new Error('الفترة المحاسبية مقفلة'));

    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('فترة ترحيل الاستبعاد مقفلة');
  });

  it('validateApprovedRequestForPosting fails if reversal period is locked', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    // Resolve posting period lock but reject reversal period lock
    (assertPeriodWritable as any)
      .mockResolvedValueOnce('ALLOWED')
      .mockRejectedValueOnce(new Error('فترة العكس مقفلة'));

    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('فترة ترحيل قيد العكس مقفلة');
  });

  it('validateApprovedRequestForPosting fails if duplicate posting reference exists', async () => {
    // First query inside validation finds the request to post
    mockPrisma.consolidationEliminationRequest.findFirst
      .mockResolvedValueOnce(makeBaseRequest())
      // Second query for duplicates finds an already posted request for same group and period
      .mockResolvedValueOnce(makeBaseRequest({ id: 'different-requestId', status: 'POSTED' }));

    const service = new ConsolidationEliminationPostingService();
    const result = await service.validateApprovedRequestForPosting(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('تم ترحيل استبعاد آخر بالفعل لهذه المجموعة ولهذه الفترة المحاسبية');
  });

  it('postApprovedElimination creates elimination + reversal inside atomic transaction', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    (lockIdempotencyKey as any).mockResolvedValue(true);
    
    // Mock AccountingJournalService.createEntry
    (AccountingJournalService.createEntry as any)
      .mockResolvedValueOnce({ id: 5001 }) // Elimination JE
      .mockResolvedValueOnce({ id: 5002 }); // Reversal JE

    mockPrisma.consolidationEliminationRequest.update.mockResolvedValue(
      makeBaseRequest({ status: 'POSTED', journalEntryId: 5001, reversalJournalEntryId: 5002 })
    );

    const service = new ConsolidationEliminationPostingService();
    const result = await service.postApprovedElimination(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN', idempotencyKey);

    expect(result).toBeDefined();
    expect(result.status).toBe('POSTED');
    expect(result.journalEntryId).toBe(5001);
    expect(result.reversalJournalEntryId).toBe(5002);
    
    // Assert both journals were created
    expect(AccountingJournalService.createEntry).toHaveBeenCalledTimes(2);
    // Assert audit logs were written
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('failure in createReversalJournal triggers transaction rollback and unlock idempotency key', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    (lockIdempotencyKey as any).mockResolvedValue(true);

    (AccountingJournalService.createEntry as any)
      .mockResolvedValueOnce({ id: 5001 }) // Elimination succeeds
      .mockRejectedValueOnce(new Error('فترة العكس مغلقة أو معطلة')); // Reversal fails

    const service = new ConsolidationEliminationPostingService();
    
    await expect(
      service.postApprovedElimination(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN', idempotencyKey)
    ).rejects.toThrow('فترة العكس مغلقة أو معطلة');

    // Verify key was unlocked
    expect(require('../idempotency').unlockIdempotencyKey).toHaveBeenCalled();
  });

  it('buildPostingPreview does not execute database writes', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    
    const service = new ConsolidationEliminationPostingService();
    const preview = await service.buildPostingPreview(tenantId, requestId);

    expect(preview.canPost).toBe(true);
    expect(preview.journalPreview).toBeDefined();
    expect(preview.reversalPreview).toBeDefined();
    expect(preview.postingReference).toBe('ELIM_POST_101_2026-05');
    
    // Confirm no DB updates were done
    expect(mockPrisma.consolidationEliminationRequest.update).not.toHaveBeenCalled();
  });

  it('idempotency locks prevent double bookings', async () => {
    mockPrisma.consolidationEliminationRequest.findFirst.mockResolvedValue(makeBaseRequest());
    // First call secures lock, second call is rejected
    (lockIdempotencyKey as any).mockResolvedValueOnce(false);

    const service = new ConsolidationEliminationPostingService();
    
    await expect(
      service.postApprovedElimination(tenantId, requestId, 'user-poster-4', 'MASTER_ADMIN', idempotencyKey)
    ).rejects.toThrow('طلب مكرر قيد المعالجة أو تم الانتهاء منه بالفعل');
  });
});
