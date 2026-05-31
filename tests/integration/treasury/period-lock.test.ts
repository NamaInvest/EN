import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() }
}));

// Mock auto-journal
vi.mock('@/lib/auto-journal', () => ({
    createJournalEntry: vi.fn().mockResolvedValue({ success: true })
}));

// Mock tenant-guard
vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn().mockReturnValue('default')
}));

// Mock transaction
vi.mock('@/lib/db/transaction', () => ({
    runFinancialTx: vi.fn((prisma, cb) => cb(prisma))
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn().mockReturnValue({ userId: 99, role: 'USER', tenantId: 'default' })
}));

// Mock numbering
vi.mock('@/lib/numbering', () => ({
    getNextNumber: vi.fn().mockResolvedValue({ current: 100, formatted: '100' })
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        user: {
            findUnique: vi.fn().mockResolvedValue({ id: 99, role: 'USER', branchId: 1 })
        },
        treasury: {
            create: vi.fn().mockResolvedValue({ id: 1, amount: 100, type: 'in' }),
            findFirst: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([])
        },
        account: {
            findUnique: vi.fn().mockResolvedValue({ id: 101, code: '1101' }),
            findFirst: vi.fn().mockResolvedValue({ id: 101, code: '1101' })
        },
        setting: {
            findUnique: vi.fn().mockResolvedValue({ value: 'true' })
        },
        financialPeriod: {
            findUnique: vi.fn().mockResolvedValue({ status: 'OPEN' })
        },
        financialPeriodModuleLock: {
            findUnique: vi.fn().mockResolvedValue(null)
        },
        auditLog: {
            create: vi.fn()
        },
        periodLockLog: {
            create: vi.fn()
        }
    };
    return {
        getPrisma: vi.fn().mockReturnValue(mockPrisma),
        prisma: mockPrisma
    };
});

// Mock withRoute
vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        return handler({ req, prisma: {} }, ctx);
    }
}));

// Mock idempotency
vi.mock('@/lib/idempotency', () => ({
    lockIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    unlockIdempotencyKey: vi.fn().mockResolvedValue(true)
}));

import { POST } from '@/app/api/treasury/route';
import jwt from 'jsonwebtoken';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

describe('Treasury Module Period Lock Integration Tests (GL-02 Phase D5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.setting.findUnique as any).mockResolvedValue({ value: 'true' });
        (mockPrisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue(null);
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'USER', tenantId: 'default' });
    });

    const buildTreasuryBody = () => ({
        tenantId: 'default',
        type: 'in',
        amount: 1500,
        description: 'Mock payment receipt entry',
        referenceType: 'manual',
        treasuryAccountId: 101,
        counterpartyAccountId: 102,
        date: '2026-05-20',
        userId: '99',
        branchId: '1'
    });

    it('should ALLOW treasury posting in an open period', async () => {
        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildTreasuryBody()),
            headers: {
                'x-tenant': 'default',
                'x-idempotency-key': 'treasury-key-open-1'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.id).toBe(1);
    });

    it('should BLOCK treasury posting with HTTP 409 when treasury module is HARD_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildTreasuryBody()),
            headers: {
                'x-tenant': 'default',
                'x-idempotency-key': 'treasury-key-locked-1'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.code).toBe('LOCKED');
    });

    it('should BLOCK treasury posting with HTTP 422 when treasury module is SOFT_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildTreasuryBody()),
            headers: {
                'x-tenant': 'default',
                'x-idempotency-key': 'treasury-key-soft-1'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.code).toBe('MASTER_OVERRIDE_REQUIRED');
    });

    it('should ALLOW treasury posting with valid Master Override when treasury module is SOFT_LOCKED', async () => {
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'MASTER_ADMIN', tenantId: 'default' });
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildTreasuryBody()),
            headers: {
                'x-tenant': 'default',
                'x-idempotency-key': 'treasury-key-soft-override-1',
                'X-Soft-Lock-Override-Reason': 'Authorized year-end cash adjustment validation corrections',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.id).toBe(1);
    });

    it('should BLOCK posting when global is HARD_LOCKED even if treasury module is OPEN', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'OPEN' });

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildTreasuryBody()),
            headers: {
                'x-tenant': 'default',
                'x-idempotency-key': 'treasury-key-global-hard-1'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.code).toBe('LOCKED');
    });
});
