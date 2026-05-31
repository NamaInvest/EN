/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FXRevaluationEngine } from '@/lib/fx-revaluation-engine';
import { createTenantContext } from '../../helpers/test-harness';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    bankAccount: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    setting: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
    currency: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    exchangeRate: {
      findFirst: vi.fn(),
    },
    journalLine: {
      findMany: vi.fn(),
    },
    journalEntry: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    financialPeriod: {
      findUnique: vi.fn(),
    },
  },
  resolveTenant: () => 'test_tenant_fx_reval',
  withTenant: (tenant: string, callback: any) => callback(),
}));

vi.mock('@/lib/services/accounting-journal.service', () => ({
  AccountingJournalService: {
    createEntry: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { AccountingJournalService } from '@/lib/services/accounting-journal.service';

describe('Phase FX-02: Bank FX Revaluation & Reversals Integration Flow', () => {
    const ctx = createTenantContext('test_tenant_fx_reval');

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Recursive promise resolver helper so .catch() works seamlessly on all mocked calls
        const mockPromiseResolvers = (obj: any) => {
            for (const key of Object.keys(obj)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    mockPromiseResolvers(obj[key]);
                } else if (typeof obj[key] === 'function' && vi.isMockFunction(obj[key])) {
                    obj[key].mockResolvedValue({});
                }
            }
        };
        mockPromiseResolvers(prisma);
        mockPromiseResolvers(AccountingJournalService);

        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            return callback(prisma);
        });
    });

    it('should preview bank fx revaluation correctly, showing carrying variance and projected lines', async () => {
        // Mocking bank account
        (prisma.bankAccount.findMany as any).mockResolvedValue([
            {
                id: 5,
                bankName: 'AlRajhi Bank',
                accountName: 'USD Account',
                accountNumber: 'SA8000000123456789',
                currency: 'USD',
                currentBalance: 10000,
                isActive: true,
            }
        ]);

        // Mock settings for mapping and fallback gain/loss
        (prisma.setting.findFirst as any)
            .mockResolvedValueOnce({ value: '8101' })   // FX_GAIN_GL_CODE
            .mockResolvedValueOnce({ value: '8102' })   // FX_LOSS_GL_CODE
            .mockResolvedValueOnce({ value: '110201' }); // Mapping GL_BANK_MAPPING_5

        // Mock GL Account
        (prisma.account.findFirst as any).mockResolvedValue({
            id: 88,
            code: '110201',
            isActive: true,
        });

        // Mock JournalLine history for balance calculations
        (prisma.journalLine.findMany as any).mockResolvedValue([
            {
                foreignDebit: 10000,
                foreignCredit: 0,
                debit: 37500,
                credit: 0,
            }
        ]);

        // Mock active currency and exchange rate (Spot Rate = 3.7550)
        (prisma.currency.findFirst as any).mockResolvedValue({ id: 2, code: 'USD', isActive: true });
        (prisma.exchangeRate.findFirst as any).mockResolvedValue({ rate: 3.7550 });

        const result = await FXRevaluationEngine.previewBank(prisma as any, ctx.tenantId, new Date('2026-05-31'));

        expect(result.totalUnrealized).toBe(50); // Carrying: 10000 * 3.7550 (37550) - 37500 = 50
        expect(result.lines.length).toBe(1);
        expect(result.lines[0].glAccountCode).toBe('110201');
        expect(result.projectedJournalLines.length).toBe(2);
    });

    it('should post bank fx revaluation and auto-reversals inside a transaction', async () => {
        // Mock financial period as open
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });

        // Mock bank account
        (prisma.bankAccount.findMany as any).mockResolvedValue([
            {
                id: 5,
                bankName: 'AlRajhi Bank',
                accountName: 'USD Account',
                accountNumber: 'SA8000000123456789',
                currency: 'USD',
                currentBalance: 10000,
                isActive: true,
            }
        ]);

        // Mock journalEntry.findFirst to null to pass duplicate check
        (prisma.journalEntry.findFirst as any).mockResolvedValue(null);

        // Mock Settings mapping and fallback gain/loss
        (prisma.setting.findFirst as any)
            .mockResolvedValueOnce({ value: '8101' })   // FX_GAIN_GL_CODE
            .mockResolvedValueOnce({ value: '8102' })   // FX_LOSS_GL_CODE
            .mockResolvedValueOnce({ value: '110201' }); // Mapping GL_BANK_MAPPING_5

        // Mock GL Account
        (prisma.account.findFirst as any).mockResolvedValue({
            id: 88,
            code: '110201',
            isActive: true,
        });

        // Mock active currency and exchange rate (Spot Rate = 3.7550)
        (prisma.currency.findFirst as any).mockResolvedValue({ id: 2, code: 'USD', isActive: true });
        (prisma.exchangeRate.findFirst as any).mockResolvedValue({ rate: 3.7550 });

        // Mock JournalLine history for balance calculations
        (prisma.journalLine.findMany as any).mockResolvedValue([
            {
                foreignDebit: 10000,
                foreignCredit: 0,
                debit: 37500,
                credit: 0,
            }
        ]);

        // Mock createEntry
        (AccountingJournalService.createEntry as any)
            .mockResolvedValueOnce({ id: 5001, entryNumber: 'JE-5001' }) // Primary
            .mockResolvedValueOnce({ id: 5002, entryNumber: 'JE-5002' }); // Reversal

        const runs = await FXRevaluationEngine.postBank(prisma as any, ctx.tenantId, new Date('2026-05-31'), 1);

        expect(runs.length).toBe(1);
        expect(runs[0].unrealized).toBe(50);
        expect(runs[0].revalEntryId).toBe(5001);
        expect(runs[0].reversalEntryId).toBe(5002);
        expect(AccountingJournalService.createEntry).toHaveBeenCalledTimes(2);
    });

    it('should reject double-posting for the same bank account in the same period', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });

        (prisma.bankAccount.findMany as any).mockResolvedValue([
            {
                id: 5,
                bankName: 'AlRajhi Bank',
                currency: 'USD',
                isActive: true,
            }
        ]);

        // Mock settings to return duplicate posted entry found
        (prisma.setting.findFirst as any)
            .mockResolvedValueOnce({ value: '8101' })   // FX_GAIN_GL_CODE
            .mockResolvedValueOnce({ value: '8102' });  // FX_LOSS_GL_CODE

        (prisma.journalEntry.findFirst as any).mockResolvedValue({ id: 5001 }); // Duplicate journal entry exists!

        await expect(
            FXRevaluationEngine.postBank(prisma as any, ctx.tenantId, new Date('2026-05-31'), 1)
        ).rejects.toThrow('Bank FX Revaluation for bank account ID 5 in period 2026-05 has already been posted.');
    });

    it('should throw error and rollback if target period or reversal period is closed', async () => {
        // Mock financial period as locked/closed
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

        await expect(
            FXRevaluationEngine.postBank(prisma as any, ctx.tenantId, new Date('2026-05-31'), 1)
        ).rejects.toThrow('مغلقة');
    });
});
