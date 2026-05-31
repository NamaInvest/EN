import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() }
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn().mockReturnValue({ userId: 99, role: 'USER', tenantId: 'default' })
}));

// Mock tenant-guard
vi.mock('@/lib/security/tenant-guard', () => ({
    assertTenant: vi.fn().mockReturnValue('default'),
    requireTenantFilter: vi.fn().mockReturnValue({ tenantId: 'default' })
}));

// Mock transaction
vi.mock('@/lib/db/transaction', () => ({
    runFinancialTx: vi.fn((prisma, cb) => cb(prisma))
}));

// Mock numbering
vi.mock('@/lib/numbering', () => ({
    getNextNumber: vi.fn().mockResolvedValue({ current: 100, formatted: 'JE-000100' })
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        fixedAsset: {
            findFirst: vi.fn().mockResolvedValue({
                id: 1,
                name: 'Test Machinery',
                status: 'ACTIVE',
                currentBookValue: 100000,
                salvageValue: 10000,
                acquisitionCost: 110000,
                usefulLifeYears: 10,
                depreciationMethod: 'STRAIGHT_LINE',
                accumulatedDepreciation: 0
            }),
            update: vi.fn().mockResolvedValue({})
        },
        setting: {
            findFirst: vi.fn().mockResolvedValue({ value: '1101' }),
            findUnique: vi.fn().mockResolvedValue({ value: 'true' })
        },
        account: {
            findFirst: vi.fn().mockResolvedValue({ id: 101, code: '1101' })
        },
        journalEntry: {
            create: vi.fn().mockResolvedValue({ id: 99 })
        },
        assetDepreciationLog: {
            create: vi.fn().mockResolvedValue({})
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
        const { getUserFromRequest } = await import('@/lib/auth');
        const auth = getUserFromRequest(req);
        return handler({ req, auth, prisma: {} }, ctx);
    }
}));

import { POST } from '@/app/api/fixed-assets/[id]/depreciate/route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

describe('Fixed Assets Module Period Lock Integration Tests (GL-02 Phase D6)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.setting.findUnique as any).mockResolvedValue({ value: 'true' });
        (mockPrisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue(null);
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'USER', tenantId: 'default' });
    });

    it('should ALLOW individual asset depreciation in an open period', async () => {
        const req = new NextRequest('http://localhost/api/fixed-assets/1/depreciate', {
            method: 'POST',
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
    });

    it('should BLOCK depreciation run with HTTP 409 when fixed_assets module is HARD_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

        const req = new NextRequest('http://localhost/api/fixed-assets/1/depreciate', {
            method: 'POST',
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.code).toBe('LOCKED');
    });

    it('should BLOCK depreciation run with HTTP 422 when fixed_assets module is SOFT_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

        const req = new NextRequest('http://localhost/api/fixed-assets/1/depreciate', {
            method: 'POST',
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.code).toBe('MASTER_OVERRIDE_REQUIRED');
    });

    it('should ALLOW depreciation run with valid Master Override when fixed_assets module is SOFT_LOCKED', async () => {
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'MASTER_ADMIN', tenantId: 'default' });
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

        const req = new NextRequest('http://localhost/api/fixed-assets/1/depreciate', {
            method: 'POST',
            headers: {
                'x-tenant-id': 'default',
                'X-Soft-Lock-Override-Reason': 'Authorized monthly adjustment run for audited corrections',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE'
            }
        });

        const res = await POST(req, { params: Promise.resolve({ id: '1' }) });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
    });
});
