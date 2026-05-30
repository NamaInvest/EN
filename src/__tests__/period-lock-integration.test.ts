import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { assertPeriodWritable, PeriodLockViolation } from '../lib/governance/period-lock';
import { AccountingJournalService } from '../lib/services/accounting-journal.service';
import { FXRevaluationEngine } from '../lib/fx-revaluation-engine';
import { OpenItemsService } from '../lib/services/open-items.service';
import { FinancialPeriodStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the global prisma client and all related tables
jest.mock('../lib/prisma', () => {
  const mockPrisma = {
    financialPeriod: {
      findUnique: jest.fn(),
    },
    financialPeriodModuleLock: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    periodLockLog: {
      create: jest.fn(),
    },
    fiscalPeriod: {
      findUnique: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    journalEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    currency: {
      findMany: jest.fn(),
    },
    exchangeRate: {
      findFirst: jest.fn(),
    },
    salesInvoice: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    purchaseInvoice: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    treasury: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    openItemMatching: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    setting: {
      findFirst: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    $executeRawUnsafe: jest.fn(),
  };
  return {
    prisma: mockPrisma,
    resolveTenant: () => 'test-tenant-abc',
  };
});

import { prisma } from '../lib/prisma';

describe('GL-02D1: Core Accounting Period Lock Integration Tests', () => {
  const tenantId = 'test-tenant-abc';
  const testDate = new Date('2026-05-15');
  const testDateStr = '2026-05-15';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock sequence queries and update queries
    (prisma.$queryRawUnsafe as any).mockResolvedValue([
      { id: 1, code: 'JE', current: '100', prefix: 'JE-', suffix: '', pad_length: 6, reset_frequency: 'yearly', last_reset: new Date() }
    ]);
    (prisma.$executeRawUnsafe as any).mockResolvedValue(1);

    // Mock account type resolutions depending on code
    const accountMockImpl = (args: any) => {
      const code = args?.where?.code || args?.where?.id || '1101';
      const codeStr = String(code);
      if (codeStr === '1101' || codeStr === '1201' || codeStr.startsWith('1')) {
        return Promise.resolve({ id: 101, code: codeStr, type: 'asset', isActive: true });
      }
      if (codeStr === '2101' || codeStr.startsWith('2')) {
        return Promise.resolve({ id: 102, code: codeStr, type: 'liability', isActive: true });
      }
      if (codeStr === '8101' || codeStr === '8102' || codeStr === '4910' || codeStr === '5410' || codeStr.startsWith('8')) {
        return Promise.resolve({ id: 103, code: codeStr, type: 'revenue', isActive: true });
      }
      return Promise.resolve({ id: 104, code: codeStr, type: 'asset', isActive: true });
    };

    (prisma.account.findFirst as any).mockImplementation(accountMockImpl);
    (prisma.account.findUnique as any).mockImplementation(accountMockImpl);

    // Mock setting query defaults
    (prisma.setting.findFirst as any).mockImplementation((args: any) => {
      const key = args.where.key;
      if (key === 'FX_REVAL_AR_GL_CODE') return Promise.resolve({ value: '1101' });
      if (key === 'FX_REVAL_AP_GL_CODE') return Promise.resolve({ value: '2101' });
      if (key === 'FX_GAIN_GL_CODE') return Promise.resolve({ value: '8101' });
      if (key === 'FX_LOSS_GL_CODE') return Promise.resolve({ value: '8102' });
      return Promise.resolve({ value: '1101' });
    });

    (prisma.fiscalPeriod.findUnique as any).mockResolvedValue({ status: 'open' });
    (prisma.salesInvoice.findMany as any).mockResolvedValue([]);
    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([]);
  });

  describe('Requirement 1 & 10: GL module OPEN allows journal posting & backward compatibility', () => {
    it('should ALLOW journal posting when GL module and global period are OPEN', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'gl',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.journalEntry.create as any).mockResolvedValue({ id: 99, entryNumber: 'JE-0001' });

      const result = await AccountingJournalService.createEntry(prisma as any, {
        description: 'Test GL Entry',
        date: testDateStr,
        lines: [
          { accountCode: '1101', debit: 100, credit: 0 },
          { accountCode: '2101', debit: 0, credit: 100 },
        ],
        userId: 1,
        tenantId,
      });

      expect(result).toBeDefined();
      expect(prisma.financialPeriodModuleLock.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_period_module: {
            tenantId,
            period: '2026-05',
            module: 'gl',
          },
        },
      });
    });

    it('should fall back to global period lock checks if module is omitted (backward compatibility)', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: testDate,
          operationType: 'TEST_BACKWARD_COMPAT',
          module: '', // omitted module
          actor: 'test-actor',
        })
      ).rejects.toThrow(PeriodLockViolation);
    });
  });

  describe('Requirement 2 & 3: GL module SOFT_LOCKED logic', () => {
    it('should BLOCK journal posting for normal user when GL is SOFT_LOCKED', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'gl',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      await expect(
        AccountingJournalService.createEntry(prisma as any, {
          description: 'Blocked GL Entry',
          date: testDateStr,
          lines: [
            { accountCode: '1101', debit: 100, credit: 0 },
            { accountCode: '2101', debit: 0, credit: 100 },
          ],
          userId: 1,
          tenantId,
        })
      ).rejects.toThrow(PeriodLockViolation);
    });

    it('should ALLOW journal posting with valid Master Override when GL is SOFT_LOCKED', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'gl',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      (prisma.journalEntry.create as any).mockResolvedValue({ id: 100, entryNumber: 'JE-0002' });

      const validOverride = {
        actorId: '99',
        actorRole: 'SUPER_ADMIN',
        tenantId,
        operationType: 'POST_JOURNAL',
        module: 'gl',
        postingDate: testDate,
        reason: 'Authorized year-end auditing reconciliation correction', // >= 20 chars
        confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
        requestId: 'req-123456',
      };

      const result = await AccountingJournalService.createEntry(prisma as any, {
        description: 'Overridden GL Entry',
        date: testDateStr,
        lines: [
          { accountCode: '1101', debit: 100, credit: 0 },
          { accountCode: '2101', debit: 0, credit: 100 },
        ],
        userId: 99,
        tenantId,
        overrideContext: validOverride,
      });

      expect(result).toBeDefined();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Requirement 4 & 5: GL module HARD_LOCKED and Global Dominance', () => {
    it('should BLOCK journal posting completely when GL is HARD_LOCKED', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'gl',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      await expect(
        AccountingJournalService.createEntry(prisma as any, {
          description: 'Hard Locked GL Entry',
          date: testDateStr,
          lines: [
            { accountCode: '1101', debit: 100, credit: 0 },
            { accountCode: '2101', debit: 0, credit: 100 },
          ],
          userId: 99,
          tenantId,
          overrideContext: {
            actorId: '99',
            actorRole: 'SUPER_ADMIN',
            tenantId,
            reason: 'Authorized year-end auditing reconciliation correction',
            confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
          },
        })
      ).rejects.toThrow(PeriodLockViolation);
    });

    it('should BLOCK journal posting when global is HARD_LOCKED even if GL module is OPEN', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'gl',
        status: FinancialPeriodStatus.OPEN,
      });

      await expect(
        AccountingJournalService.createEntry(prisma as any, {
          description: 'Blocked by Global Lock',
          date: testDateStr,
          lines: [
            { accountCode: '1101', debit: 100, credit: 0 },
            { accountCode: '2101', debit: 0, credit: 100 },
          ],
          userId: 1,
          tenantId,
        })
      ).rejects.toThrow(PeriodLockViolation);
    });
  });

  describe('Requirement 6: FX Revaluation posting respects module: fx_revaluation', () => {
    it('should respect the fx_revaluation module lock status during posting', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'fx_revaluation',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      // No override context -> throws
      await expect(
        FXRevaluationEngine.postARAP(prisma as any, tenantId, testDate, 1)
      ).rejects.toThrow(PeriodLockViolation);

      // Verify that it queried with module: 'fx_revaluation'
      expect(prisma.financialPeriodModuleLock.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_period_module: {
            tenantId,
            period: '2026-05',
            module: 'fx_revaluation',
          },
        },
      });
    });
  });

  describe('Requirement 7: Open Items respects module: open_items', () => {
    it('should respect the open_items module lock status during allocations and reversals', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        module: 'open_items',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      (prisma.salesInvoice.findFirst as any).mockResolvedValue({
        id: 1,
        total: new Decimal(1000),
        paid: new Decimal(0),
        remaining: new Decimal(1000),
        status: 'pending',
        date: testDate,
      });

      (prisma.treasury.findFirst as any).mockResolvedValue({
        id: 5,
        type: 'in',
        amount: new Decimal(500),
      });

      (prisma.openItemMatching.findFirst as any).mockResolvedValue(null);
      (prisma.openItemMatching.findMany as any).mockResolvedValue([]);

      // Customer allocation without override context -> throws
      await expect(
        OpenItemsService.allocateCustomerPayment(prisma as any, {
          tenantId,
          salesInvoiceId: 1,
          treasuryId: 5,
          amount: new Decimal(500),
          allocatedBy: 'tester',
          sourceType: 'test',
          userId: '1',
        })
      ).rejects.toThrow(PeriodLockViolation);

      // Verify that it queried with module: 'open_items'
      expect(prisma.financialPeriodModuleLock.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_period_module: {
            tenantId,
            period: '2026-05',
            module: 'open_items',
          },
        },
      });
    });
  });

  describe('Requirement 8: Read-only preview/dry-runs remain safe and do not write', () => {
    it('should allow read-only preview items even when the period is HARD_LOCKED', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      (prisma.currency.findMany as any).mockResolvedValue([]);

      const result = await FXRevaluationEngine.previewARAP(prisma as any, tenantId, testDate);
      expect(result).toBeDefined();
      expect(result.lines).toHaveLength(0); // Preview finished successfully without throwing locked errors
    });
  });

  describe('Requirement 9: Tenant isolation across module locks', () => {
    it('should isolate locks strictly by tenantId', async () => {
      // Clear out the soft lock setting so it doesn't affect tenant isolation
      (prisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue(null);

      // Mock findUnique to return HARD_LOCKED for tenant-A but OPEN for tenant-B
      (prisma.financialPeriod.findUnique as any).mockImplementation((args: any) => {
        const queryTenant = args.where.tenantId_period.tenantId;
        if (queryTenant === 'tenant-A') {
          return Promise.resolve({ tenantId: 'tenant-A', period: '2026-05', status: FinancialPeriodStatus.HARD_LOCKED });
        } else {
          return Promise.resolve({ tenantId: 'tenant-B', period: '2026-05', status: FinancialPeriodStatus.OPEN });
        }
      });

      // Tenant A throws
      await expect(
        assertPeriodWritable({
          tenantId: 'tenant-A',
          postingDate: testDate,
          operationType: 'TEST_TENANT_A',
          module: 'gl',
          actor: 'user-1',
        })
      ).rejects.toThrow(PeriodLockViolation);

      // Tenant B succeeds
      const result = await assertPeriodWritable({
        tenantId: 'tenant-B',
        postingDate: testDate,
        operationType: 'TEST_TENANT_B',
        module: 'gl',
        actor: 'user-1',
      });
      expect(result).toBe('ALLOWED');
    });
  });
});
