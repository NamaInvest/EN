import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialPeriodStatus } from '@prisma/client';
import { initPeriodCloseTasks, completeTask, executeSoftClose, executeHardClose } from '@/lib/period-close-engine';
import { PeriodCloseEngine } from '@/lib/period-close';
import { mockPrisma, createTenantContext } from '../../helpers/test-harness';

// Mock standard prisma dependency used in closing engines
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    fiscalPeriod: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    periodCloseTaskTemplate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    periodCloseChecklist: {
      count: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
    periodLockLog: {
      create: vi.fn(),
    },
    financialPeriod: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    financialPeriodModuleLock: {
      upsert: vi.fn(),
    },
    salesInvoice: {
      count: vi.fn(),
    },
    goodsReceiptNote: {
      count: vi.fn(),
    },
    bankStatementLine: {
      count: vi.fn(),
    },
    fixedAsset: {
      count: vi.fn(),
    },
    assetDepreciationLog: {
      count: vi.fn(),
    },
    employee: {
      count: vi.fn(),
    },
    payrollRun: {
      count: vi.fn(),
    },
    journalLine: {
      aggregate: vi.fn(),
    }
  },
  resolveTenant: () => 'test_tenant_period_close',
  withTenant: (tenant: string, callback: any) => callback(),
}));

import { prisma } from '@/lib/prisma';

describe('GL-03 Period Close Checklist & 16-Step Validations Integration', () => {
    const ctx = createTenantContext('test_tenant_period_close');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize 16 standard steps successfully when none exist', async () => {
        (prisma.periodCloseChecklist.count as any).mockResolvedValue(0);
        (prisma.periodCloseTaskTemplate.findFirst as any).mockResolvedValue({ id: 1 });
        (prisma.periodCloseChecklist.createMany as any).mockResolvedValue({ count: 16 });

        const count = await initPeriodCloseTasks(prisma as any, 123, ctx.tenantId);
        expect(count).toBe(16);
        expect(prisma.periodCloseChecklist.createMany).toHaveBeenCalled();
    });

    it('should enforce CUTOFF validation and fail if there are draft invoices', async () => {
        (prisma.fiscalPeriod.findUnique as any).mockResolvedValue({
            id: 123,
            year: 2026,
            month: 5,
            tenantId: ctx.tenantId
        });
        // Mock 1 draft invoice found
        (prisma.salesInvoice.count as any).mockResolvedValue(1);

        const result = await completeTask(prisma as any, 123, 'CUTOFF', 'user_admin', 'some note', ctx.tenantId);
        expect(result.success).toBe(false);
        expect(result.error).toContain('فواتير مبيعات مسودة');
    });

    it('should allow completing CUTOFF if there are no draft invoices', async () => {
        (prisma.fiscalPeriod.findUnique as any).mockResolvedValue({
            id: 123,
            year: 2026,
            month: 5,
            tenantId: ctx.tenantId
        });
        (prisma.salesInvoice.count as any).mockResolvedValue(0);
        (prisma.periodCloseChecklist.updateMany as any).mockResolvedValue({ count: 1 });

        const result = await completeTask(prisma as any, 123, 'CUTOFF', 'user_admin', 'some note', ctx.tenantId);
        expect(result.success).toBe(true);
    });

    it('should synchronize executeSoftClose with standard FinancialPeriod and modules', async () => {
        (prisma.fiscalPeriod.findUnique as any).mockResolvedValue({
            id: 123,
            year: 2026,
            month: 5,
            tenantId: ctx.tenantId,
            periodCloseChecklists: [] // zero pending tasks
        });
        
        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            return callback(prisma);
        });

        const result = await executeSoftClose(prisma as any, 123, 'user_admin');
        expect(result.success).toBe(true);
        expect(prisma.financialPeriod.upsert).toHaveBeenCalledWith({
            where: { tenantId_period: { tenantId: ctx.tenantId, period: '2026-05' } },
            create: expect.objectContaining({ status: 'SOFT_LOCKED' }),
            update: expect.objectContaining({ status: 'SOFT_LOCKED' })
        });
        expect(prisma.financialPeriodModuleLock.upsert).toHaveBeenCalled();
    });

    it('should synchronize executeHardClose and transition periods to HARD_LOCKED', async () => {
        (prisma.fiscalPeriod.findUnique as any).mockResolvedValue({
            id: 123,
            year: 2026,
            month: 5,
            tenantId: ctx.tenantId
        });

        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            return callback(prisma);
        });

        const result = await executeHardClose(prisma as any, 123, 'user_admin');
        expect(result.success).toBe(true);
        expect(prisma.financialPeriod.upsert).toHaveBeenCalledWith({
            where: { tenantId_period: { tenantId: ctx.tenantId, period: '2026-05' } },
            create: expect.objectContaining({ status: 'HARD_LOCKED' }),
            update: expect.objectContaining({ status: 'HARD_LOCKED' })
        });
    });
});
