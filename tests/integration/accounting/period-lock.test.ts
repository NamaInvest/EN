import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialPeriodStatus } from '@prisma/client';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';
import { mockPrisma, createTenantContext } from '../../helpers/test-harness';

// Mock the real prisma instance used by governance module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    financialPeriod: {
      findUnique: vi.fn(),
    },
    periodLockLog: {
      create: vi.fn(),
    }
  }
}));

import { prisma } from '@/lib/prisma';

describe('Financial Period Lock Enforcement (Phase 7)', () => {
    const ctx = createTenantContext('period_test_tenant');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow mutation when period is explicitly OPEN', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.OPEN
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER'
            })
        ).resolves.not.toThrow();
        expect(prisma.financialPeriod.findUnique).toHaveBeenCalled();
    });

    it('should allow mutation when period does not exist (implicitly OPEN)', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER'
            })
        ).resolves.not.toThrow();
    });

    it('should block mutation when period is SOFT_LOCKED', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.SOFT_LOCKED
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER'
            })
        ).rejects.toThrowError(PeriodLockViolation);

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER'
            })
        ).rejects.toHaveProperty('code', 'MASTER_OVERRIDE_REQUIRED');
        
        // Ensure audit log attempt is triggered
        expect(prisma.periodLockLog.create).toHaveBeenCalled();
    });

    it('should absolutely block mutation when period is HARD_LOCKED (CLOSED)', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.HARD_LOCKED
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER'
            })
        ).rejects.toHaveProperty('code', 'LOCKED');
    });

    it('should properly format period based on postingDate', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

        await assertPeriodWritable({
            tenantId: ctx.tenantId,
            postingDate: new Date('2026-09-05'),
            operationType: 'TEST_MUTATION',
            module: 'Accounting',
            actor: 'TEST_USER'
        });

        expect(prisma.financialPeriod.findUnique).toHaveBeenCalledWith({
            where: {
                tenantId_period: {
                    tenantId: ctx.tenantId,
                    period: '2026-09'
                }
            }
        });
    });

    it('should reject SOFT_LOCKED override without a valid reason', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.SOFT_LOCKED
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER',
                overrideContext: {
                    actorId: '1',
                    actorRole: 'MASTER_ADMIN',
                    tenantId: ctx.tenantId,
                    operationType: 'TEST_MUTATION',
                    module: 'Accounting',
                    postingDate: new Date('2026-05-18'),
                    reason: 'too short', // < 20 chars
                    confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
                    requestId: 'req_123'
                }
            })
        ).rejects.toHaveProperty('code', 'MASTER_OVERRIDE_REQUIRED');
    });

    it('should reject SOFT_LOCKED override with wrong confirmation code', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.SOFT_LOCKED
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER',
                overrideContext: {
                    actorId: '1',
                    actorRole: 'MASTER_ADMIN',
                    tenantId: ctx.tenantId,
                    operationType: 'TEST_MUTATION',
                    module: 'Accounting',
                    postingDate: new Date('2026-05-18'),
                    reason: 'Valid reason to bypass soft lock constraints for testing',
                    confirmationCode: 'WRONG-CODE',
                    requestId: 'req_123'
                }
            })
        ).rejects.toHaveProperty('code', 'MASTER_OVERRIDE_REQUIRED');
    });

    it('should reject SOFT_LOCKED override from non-admin role', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.SOFT_LOCKED
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER',
                overrideContext: {
                    actorId: '1',
                    actorRole: 'ACCOUNTANT', // Not MASTER_ADMIN
                    tenantId: ctx.tenantId,
                    operationType: 'TEST_MUTATION',
                    module: 'Accounting',
                    postingDate: new Date('2026-05-18'),
                    reason: 'Valid reason to bypass soft lock constraints for testing',
                    confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
                    requestId: 'req_123'
                }
            })
        ).rejects.toHaveProperty('code', 'MASTER_OVERRIDE_REQUIRED');
    });

    it('should ACCEPT SOFT_LOCKED override from MASTER_ADMIN with valid context and write to AuditLog', async () => {
        // Prepare mock for AuditLog creation
        vi.mocked(prisma as any).auditLog = { create: vi.fn() };
        
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.SOFT_LOCKED,
            id: 99
        });

        const result = await assertPeriodWritable({
            tenantId: ctx.tenantId,
            postingDate: new Date('2026-05-18'),
            operationType: 'TEST_MUTATION',
            module: 'Accounting',
            actor: 'TEST_USER',
            overrideContext: {
                actorId: '1',
                actorRole: 'MASTER_ADMIN',
                tenantId: ctx.tenantId,
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                postingDate: new Date('2026-05-18'),
                reason: 'Valid reason to bypass soft lock constraints for testing',
                confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
                requestId: 'req_123'
            }
        });

        expect(result).toBe('ALLOWED_WITH_OVERRIDE');
        expect((prisma as any).auditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'SOFT_LOCK_OVERRIDE',
                    entityType: 'FinancialPeriod',
                    tenantId: ctx.tenantId
                })
            })
        );
    });

    it('should NEVER bypass HARD_LOCKED even with valid Master Override', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({
            tenantId: ctx.tenantId,
            period: '2026-05',
            status: FinancialPeriodStatus.HARD_LOCKED
        });

        await expect(
            assertPeriodWritable({
                tenantId: ctx.tenantId,
                postingDate: new Date('2026-05-18'),
                operationType: 'TEST_MUTATION',
                module: 'Accounting',
                actor: 'TEST_USER',
                overrideContext: {
                    actorId: '1',
                    actorRole: 'MASTER_ADMIN',
                    tenantId: ctx.tenantId,
                    operationType: 'TEST_MUTATION',
                    module: 'Accounting',
                    postingDate: new Date('2026-05-18'),
                    reason: 'Valid reason to bypass soft lock constraints for testing',
                    confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
                    requestId: 'req_123'
                }
            })
        ).rejects.toHaveProperty('code', 'LOCKED');
    });
});
