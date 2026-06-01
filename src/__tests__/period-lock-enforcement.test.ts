import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { assertPeriodWritable, PeriodLockViolation } from '../lib/governance/period-lock';
import { FinancialPeriodStatus } from '@prisma/client';

// Mock the global prisma client
jest.mock('../lib/prisma', () => {
  return {
    prisma: {
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
      periodCloseChecklist: {
        count: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      periodCloseTaskTemplate: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      fiscalPeriod: {
        findUnique: jest.fn(),
      },
      setting: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve({ value: 'true' })),
      },
    },
  };
});

// Import prisma to manipulate mocks
import { prisma } from '../lib/prisma';

describe('Period Lock Enforcement & Interlocking (F-04)', () => {
  const tenantId = 'test-tenant-123';
  const openDate = new Date('2026-05-15');
  const lockedDate = new Date('2026-04-10'); // assume locked period YYYY-MM = 2026-04

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assertPeriodWritable — Core Rejection Logic', () => {
    it('should ALLOW access to implicitly OPEN periods (when database record is absent)', async () => {
      // Mock findUnique to return null (absent)
      (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

      const result = await assertPeriodWritable({
        tenantId,
        postingDate: openDate,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        actor: 'user-1',
      });

      expect(result).toBe('ALLOWED');
      expect(prisma.financialPeriod.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should ALLOW access to explicitly OPEN periods', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 1,
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      const result = await assertPeriodWritable({
        tenantId,
        postingDate: openDate,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        actor: 'user-1',
      });

      expect(result).toBe('ALLOWED');
    });

    it('should REJECT access to HARD_LOCKED periods completely', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 2,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-1',
        })
      ).rejects.toThrow(PeriodLockViolation);

      try {
        await assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-1',
        });
      } catch (err: any) {
        expect(err.code).toBe('LOCKED');
        expect(err.message).toContain('مغلقة نهائياً');
      }
    });

    it('should REJECT access to SOFT_LOCKED periods when no override context is provided', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 3,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-2',
        })
      ).rejects.toThrow(PeriodLockViolation);

      try {
        await assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-2',
        });
      } catch (err: any) {
        expect(err.code).toBe('MASTER_OVERRIDE_REQUIRED');
        expect(err.message).toContain('مقفلة جزئياً');
      }

      // Check that a PeriodLockLog rejection was recorded
      expect(prisma.periodLockLog.create).toHaveBeenCalledTimes(2);
    });

    it('should REJECT access to SOFT_LOCKED periods with invalid override context', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 3,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      const invalidOverride = {
        actorId: 'user-9',
        actorRole: 'USER', // regular user role cannot bypass soft lock
        tenantId,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        postingDate: lockedDate,
        reason: 'Short reason', // less than 20 chars
        confirmationCode: 'BAD-CODE',
        requestId: 'req-111',
      };

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-9',
          overrideContext: invalidOverride,
        })
      ).rejects.toThrow(PeriodLockViolation);
    });

    it('should ALLOW access to SOFT_LOCKED periods with a valid CFO/Admin override context and write AuditLog', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 3,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      const validOverride = {
        actorId: '99',
        actorRole: 'SUPER_ADMIN',
        tenantId,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        postingDate: lockedDate,
        reason: 'Emergency audit correction required for Q2 reporting closing', // >= 20 chars
        confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
        requestId: 'req-valid-123',
      };

      const result = await assertPeriodWritable({
        tenantId,
        postingDate: lockedDate,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        actor: '99',
        overrideContext: validOverride,
      });

      expect(result).toBe('ALLOWED_WITH_OVERRIDE');
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);

      const auditArgs = (prisma.auditLog.create as any).mock.calls[0][0];
      expect(auditArgs.data.action).toBe('SOFT_LOCK_OVERRIDE');
      expect(auditArgs.data.tenantId).toBe(tenantId);
      expect(auditArgs.data.userId).toBe(99);
      expect(auditArgs.data.metadata.reason).toBe(validOverride.reason);
    });

    it('should ALLOW access to module-specific OPEN periods', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 1,
        tenantId,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });

      ((prisma as any).financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        id: 10,
        tenantId,
        period: '2026-05',
        module: 'sales',
        status: FinancialPeriodStatus.OPEN,
      });

      const result = await assertPeriodWritable({
        tenantId,
        postingDate: openDate,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        actor: 'user-1',
      });

      expect(result).toBe('ALLOWED');
    });

    it('should REJECT access to module-specific HARD_LOCKED periods completely', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 1,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.OPEN,
      });

      ((prisma as any).financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        id: 11,
        tenantId,
        period: '2026-04',
        module: 'sales',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-1',
        })
      ).rejects.toThrow(PeriodLockViolation);
    });

    it('should REJECT access to module-specific SOFT_LOCKED periods when no override context is provided', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 1,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.OPEN,
      });

      ((prisma as any).financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        id: 12,
        tenantId,
        period: '2026-04',
        module: 'sales',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-2',
        })
      ).rejects.toThrow(PeriodLockViolation);
    });

    it('should ALLOW access to module-specific SOFT_LOCKED periods with a valid override context', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 1,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.OPEN,
      });

      ((prisma as any).financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        id: 12,
        tenantId,
        period: '2026-04',
        module: 'sales',
        status: FinancialPeriodStatus.SOFT_LOCKED,
      });

      const validOverride = {
        actorId: '99',
        actorRole: 'SUPER_ADMIN',
        tenantId,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        postingDate: lockedDate,
        reason: 'Emergency audit correction required for Q2 reporting closing',
        confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
        requestId: 'req-valid-456',
      };

      const result = await assertPeriodWritable({
        tenantId,
        postingDate: lockedDate,
        operationType: 'CREATE_SALES_INVOICE',
        module: 'sales',
        actor: '99',
        overrideContext: validOverride,
      });

      expect(result).toBe('ALLOWED_WITH_OVERRIDE');
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);

      const auditArgs = (prisma.auditLog.create as any).mock.calls[0][0];
      expect(auditArgs.data.action).toBe('SOFT_LOCK_OVERRIDE');
      expect(auditArgs.data.entityType).toBe('FinancialPeriodModuleLock');
    });

    it('should enforces Global HARD_LOCK dominance over module-specific OPEN status', async () => {
      (prisma.financialPeriod.findUnique as any).mockResolvedValue({
        id: 2,
        tenantId,
        period: '2026-04',
        status: FinancialPeriodStatus.HARD_LOCKED,
      });

      ((prisma as any).financialPeriodModuleLock.findUnique as any).mockResolvedValue({
        id: 13,
        tenantId,
        period: '2026-04',
        module: 'sales',
        status: FinancialPeriodStatus.OPEN,
      });

      await expect(
        assertPeriodWritable({
          tenantId,
          postingDate: lockedDate,
          operationType: 'CREATE_SALES_INVOICE',
          module: 'sales',
          actor: 'user-1',
        })
      ).rejects.toThrow(PeriodLockViolation);
    });
  });

  describe('Period Close Checklist Initialization & Facade (F-04B)', () => {
    const { initPeriodCloseTasks, getPeriodCloseStatus, completeTask } = require('../lib/period-close-engine');

    it('should initialize SOCPA checklist tasks with correct tenantId and without taskCode crashes', async () => {
      (prisma as any).periodCloseChecklist.count.mockResolvedValue(0);
      (prisma as any).periodCloseTaskTemplate.findFirst.mockResolvedValue({ id: 1 });
      (prisma as any).periodCloseChecklist.createMany.mockResolvedValue({ count: 16 });

      const count = await initPeriodCloseTasks(prisma, 12, 'tenant-A');

      expect(count).toBe(16);
      expect((prisma as any).periodCloseChecklist.count).toHaveBeenCalledWith({
        where: { fiscalPeriodId: 12, tenantId: 'tenant-A' }
      });

      const createArgs = (prisma as any).periodCloseChecklist.createMany.mock.calls[0][0];
      expect(createArgs.data).toHaveLength(16);
      expect(createArgs.data[0].tenantId).toBe('tenant-A');
      expect(createArgs.data[0].taskName).toBe('تجميد العمليات التجارية وتجميد الفواتير');
      expect(createArgs.data[0].taskCode).toBeUndefined(); // Verify no taskCode parameter is sent to DB
    });

    it('should dynamically map taskName back to taskCode in getPeriodCloseStatus response for the frontend', async () => {
      (prisma as any).fiscalPeriod.findUnique.mockResolvedValue({ id: 12, year: 2026, month: 5 });
      (prisma as any).periodCloseChecklist.findMany.mockResolvedValue([
        { id: 101, tenantId: 'tenant-A', fiscalPeriodId: 12, taskName: 'تسوية ومطابقة الحسابات البنكية', sequence: 3, status: 'COMPLETED' },
        { id: 102, tenantId: 'tenant-A', fiscalPeriodId: 12, taskName: 'مطابقة دفتر الأستاذ المساعد للعملاء AR', sequence: 4, status: 'PENDING' },
      ]);

      const status = await getPeriodCloseStatus(prisma, 12, 'tenant-A');

      expect(status.tasks).toHaveLength(2);
      expect(status.tasks[0].taskCode).toBe('BANK_RECON');
      expect(status.tasks[1].taskCode).toBe('AR_SUBLEDGER');
      expect(status.progress.completed).toBe(1);
      expect(status.progress.pending).toBe(1);
      expect(status.readyToClose).toBe(false);

      expect((prisma as any).periodCloseChecklist.findMany).toHaveBeenCalledWith({
        where: { fiscalPeriodId: 12, tenantId: 'tenant-A' },
        orderBy: { sequence: 'asc' }
      });
    });

    it('should complete task by looking up the taskName from the provided taskCode and filtering by tenantId', async () => {
      (prisma as any).periodCloseChecklist.updateMany.mockResolvedValue({ count: 1 });

      const result = await completeTask(prisma, 12, 'BANK_RECON', 'user-admin', 'Done reconciling', 'tenant-A');

      expect(result.success).toBe(true);
      expect((prisma as any).periodCloseChecklist.updateMany).toHaveBeenCalledWith({
        where: { fiscalPeriodId: 12, taskName: 'تسوية ومطابقة الحسابات البنكية', tenantId: 'tenant-A' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          owner: 'user-admin',
          notes: 'Done reconciling'
        })
      });
    });
  });
});
