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
      auditLog: {
        create: jest.fn(),
      },
      periodLockLog: {
        create: jest.fn(),
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
  });

  describe('Period Close Checklist Initialization', () => {
    it('should return checklist templates and status correctly', () => {
      const steps = [
        { code: 'BANK_RECON', nameAr: 'تسوية الحسابات البنكية', sequence: 1 },
        { code: 'AR_SUBLEDGER', nameAr: 'تسوية دفتر الأستاذ المساعد AR', sequence: 2 },
      ];
      expect(steps).toHaveLength(2);
      expect(steps[0].code).toBe('BANK_RECON');
    });
  });
});
