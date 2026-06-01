// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';
import { ConsolidationEliminationApprovalService } from '../consolidation-elimination-approval';
import { FinancialConsolidationEngine } from '../financial-consolidation-engine';
import { assertPeriodWritable } from '../governance/period-lock';

// Mocks
jest.mock('../prisma', () => ({
  getPrisma: jest.fn().mockReturnValue({}),
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

describe('ConsolidationEliminationApprovalService Local Tests', () => {
  const tenantId = 'tenant-xyz';
  const groupId = 101;
  const actorIdMaker = 'user-maker-1';
  const actorIdCfo = 'user-cfo-2';
  const actorIdMaster = 'user-master-3';

  beforeEach(() => {
    jest.clearAllMocks();
    ConsolidationEliminationApprovalService.requests.clear();
  });

  it('submit request succeeds when dry-run is balanced', async () => {
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [
          {
            description: 'Proposed 1',
            reference: 'ELIM_1',
            entryDate: '2026-05-31',
            autoReverseDate: '2026-06-01',
            lines: [],
          },
        ],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const service = new ConsolidationEliminationApprovalService();
    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    expect(req).toBeDefined();
    expect(req.status).toBe('SUBMITTED');
    expect(req.totalDebit.toNumber()).toBe(5000);
    expect(req.totalCredit.toNumber()).toBe(5000);
    expect(req.createdBy).toBe(actorIdMaker);
    expect(req.tenantId).toBe(tenantId);
    expect(ConsolidationEliminationApprovalService.requests.size).toBe(1);
  });

  it('submit request fails if dry-run proposed entries are unbalanced', async () => {
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: false,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(4900),
        proposedEntries: [],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const service = new ConsolidationEliminationApprovalService();
    await expect(
      service.submitRequest({
        tenantId,
        groupId,
        from: '2026-05-01',
        to: '2026-05-31',
        actorId: actorIdMaker,
        actorRole: 'ACCOUNTANT',
      })
    ).rejects.toThrow('الطلب غير متوازن');
  });

  it('CFO approval succeeds from an authorized CFO user', async () => {
    // 1. Prepare submitted request
    const service = new ConsolidationEliminationApprovalService();
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [{ lines: [] }],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    // 2. CFO Approve
    const approvedReq = await service.approveByCfo({
      tenantId,
      requestId: req.id,
      actorId: actorIdCfo,
      actorRole: 'CFO',
    });

    expect(approvedReq.status).toBe('CFO_APPROVED');
    expect(approvedReq.cfoApprovedBy).toBe(actorIdCfo);
    expect(approvedReq.cfoApprovedAt).toBeDefined();
  });

  it('CFO approval fails if the approver is the same as the maker (segregation of duties)', async () => {
    const service = new ConsolidationEliminationApprovalService();
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    await expect(
      service.approveByCfo({
        tenantId,
        requestId: req.id,
        actorId: actorIdMaker, // Same user
        actorRole: 'CFO',
      })
    ).rejects.toThrow('يمنع اعتماد الطلب من قبل نفس المحاسب منشئ الطلب');
  });

  it('Master Admin approval succeeds after CFO approval', async () => {
    const service = new ConsolidationEliminationApprovalService();
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    await service.approveByCfo({
      tenantId,
      requestId: req.id,
      actorId: actorIdCfo,
      actorRole: 'CFO',
    });

    (assertPeriodWritable as any).mockResolvedValue('ALLOWED');

    const masterReq = await service.approveByMasterAdmin({
      tenantId,
      requestId: req.id,
      actorId: actorIdMaster,
      actorRole: 'MASTER_ADMIN',
    });

    expect(masterReq.status).toBe('POSTING_READY');
    expect(masterReq.masterApprovedBy).toBe(actorIdMaster);
    expect(assertPeriodWritable).toHaveBeenCalled();
  });

  it('Master Admin approval fails if request is not yet CFO_APPROVED', async () => {
    const service = new ConsolidationEliminationApprovalService();
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    await expect(
      service.approveByMasterAdmin({
        tenantId,
        requestId: req.id,
        actorId: actorIdMaster,
        actorRole: 'MASTER_ADMIN',
      })
    ).rejects.toThrow('يجب اعتماد الطلب من قبل المدير المالي CFO أولاً');
  });

  it('reject request updates request status and saves rejection logs and reasons', async () => {
    const service = new ConsolidationEliminationApprovalService();
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    const rejectedReq = await service.rejectRequest({
      tenantId,
      requestId: req.id,
      actorId: actorIdCfo,
      actorRole: 'CFO',
      reason: 'القيم المحتسبة غير دقيقة في ميزان المراجعة الفرعي للشركة التابعة ب',
    });

    expect(rejectedReq.status).toBe('REJECTED');
    expect(rejectedReq.rejectedBy).toBe(actorIdCfo);
    expect(rejectedReq.rejectionReason).toBe('القيم المحتسبة غير دقيقة في ميزان المراجعة الفرعي للشركة التابعة ب');
  });

  it('validatePostingReadiness returns postingStillBlocked=true and canPost=true when fully approved', async () => {
    const service = new ConsolidationEliminationApprovalService();
    const mockEngineInstance = {
      dryRunEliminations: jest.fn().mockResolvedValue({
        groupId,
        groupName: 'Holding Group',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-31',
        isBalanced: true,
        totalDebit: new Decimal(5000),
        totalCredit: new Decimal(5000),
        proposedEntries: [],
        warnings: [],
      }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    await service.approveByCfo({
      tenantId,
      requestId: req.id,
      actorId: actorIdCfo,
      actorRole: 'CFO',
    });

    (assertPeriodWritable as any).mockResolvedValue('ALLOWED');

    await service.approveByMasterAdmin({
      tenantId,
      requestId: req.id,
      actorId: actorIdMaster,
      actorRole: 'MASTER_ADMIN',
    });

    const readiness = await service.validatePostingReadiness({
      tenantId,
      requestId: req.id,
    });

    expect(readiness.canPost).toBe(true);
    expect(readiness.postingStillBlocked).toBe(true);
    expect(readiness.requiresSeparatePostingPhase).toBe(true);
    expect(readiness.warnings).toHaveLength(0);
  });

  it('validatePostingReadiness blocks readiness if previewHash mismatches due to new subledger balance updates', async () => {
    const service = new ConsolidationEliminationApprovalService();
    
    // First dryRun returns 5000 (at request time)
    const mockEngineInstance = {
      dryRunEliminations: jest.fn()
        .mockResolvedValueOnce({
          groupId,
          groupName: 'Holding Group',
          periodFrom: '2026-05-01',
          periodTo: '2026-05-31',
          isBalanced: true,
          totalDebit: new Decimal(5000),
          totalCredit: new Decimal(5000),
          proposedEntries: [{ entry: 1 }],
          warnings: [],
        })
        // Second dryRun (at CFO approve time) returns 5000 (unchanged)
        .mockResolvedValueOnce({
          groupId,
          groupName: 'Holding Group',
          periodFrom: '2026-05-01',
          periodTo: '2026-05-31',
          isBalanced: true,
          totalDebit: new Decimal(5000),
          totalCredit: new Decimal(5000),
          proposedEntries: [{ entry: 1 }],
          warnings: [],
        })
        // Third dryRun (at Master Admin approve time) returns 5000 (unchanged)
        .mockResolvedValueOnce({
          groupId,
          groupName: 'Holding Group',
          periodFrom: '2026-05-01',
          periodTo: '2026-05-31',
          isBalanced: true,
          totalDebit: new Decimal(5000),
          totalCredit: new Decimal(5000),
          proposedEntries: [{ entry: 1 }],
          warnings: [],
        })
        // Fourth dryRun (at verification time) returns 5200 due to balance updates
        .mockResolvedValueOnce({
          groupId,
          groupName: 'Holding Group',
          periodFrom: '2026-05-01',
          periodTo: '2026-05-31',
          isBalanced: true,
          totalDebit: new Decimal(5200),
          totalCredit: new Decimal(5200),
          proposedEntries: [{ entry: 2 }],
          warnings: [],
        }),
    };
    (FinancialConsolidationEngine as any).mockImplementation(() => mockEngineInstance);

    const req = await service.submitRequest({
      tenantId,
      groupId,
      from: '2026-05-01',
      to: '2026-05-31',
      actorId: actorIdMaker,
      actorRole: 'ACCOUNTANT',
    });

    await service.approveByCfo({
      tenantId,
      requestId: req.id,
      actorId: actorIdCfo,
      actorRole: 'CFO',
    });

    (assertPeriodWritable as any).mockResolvedValue('ALLOWED');

    await service.approveByMasterAdmin({
      tenantId,
      requestId: req.id,
      actorId: actorIdMaster,
      actorRole: 'MASTER_ADMIN',
    });

    const readiness = await service.validatePostingReadiness({
      tenantId,
      requestId: req.id,
    });

    expect(readiness.canPost).toBe(false);
    expect(readiness.warnings[0]).toContain('تغيرت أرصدة الحسابات البينية');
  });
});
