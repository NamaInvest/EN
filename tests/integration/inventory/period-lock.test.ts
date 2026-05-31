import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() }
}));

// Mock auto-journal
vi.mock('@/lib/auto-journal', () => ({
    postInventoryAdjustment: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock tenant-guard
vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn().mockReturnValue('tenant_test')
}));

// Mock transaction
vi.mock('@/lib/db/transaction', () => ({
    runInventoryTx: vi.fn((prisma, cb) => cb(prisma))
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn().mockReturnValue({ userId: 99, role: 'USER', tenantId: 'tenant_test' })
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        product: {
            findFirst: vi.fn().mockResolvedValue({ id: 1, currentStock: 100, buyPrice: 10 }),
            findMany: vi.fn().mockResolvedValue([{ id: 1, name: 'Test Product', currentStock: 100, buyPrice: 10, active: true }]),
            updateMany: vi.fn().mockResolvedValue({ count: 1 })
        },
        productStock: {
            upsert: vi.fn(),
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            updateMany: vi.fn()
        },
        stockMovement: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
            findMany: vi.fn().mockResolvedValue([])
        },
        stocktake: {
            create: vi.fn().mockResolvedValue({ id: 1, items: [] })
        },
        setting: {
            findUnique: vi.fn().mockResolvedValue(null)
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

import { POST as POSTAdjustment } from '@/app/api/stock/adjustments/route';
import { POST as POSTStocktake } from '@/app/api/stocktake/route';
import jwt from 'jsonwebtoken';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

describe('Inventory Module Period Lock Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.setting.findUnique as any).mockResolvedValue({ value: 'true' });
        (mockPrisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue(null);
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'USER', tenantId: 'tenant_test' });
    });

    const buildAdjustmentBody = () => ({
        productId: 1,
        actualQuantity: 110,
        reason: 'Manually adjusting stock',
        stockId: 1
    });

    const buildStocktakeBody = () => ({
        items: [{ productId: 1, actualQty: 110 }],
        notes: 'Annual stock count',
        applyAdjustment: true
    });

    describe('1. Stock Adjustments API', () => {
        it('should ALLOW adjustment in an open period', async () => {
            (jwt.verify as any).mockReturnValue({ userId: 99, role: 'USER' });

            const req = new NextRequest('http://localhost/api/stock/adjustments', {
                method: 'POST',
                body: JSON.stringify(buildAdjustmentBody()),
                headers: {
                    'Authorization': 'Bearer test_token',
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTAdjustment(req);
            expect(res.status).toBe(200);
        });

        it('should BLOCK adjustment with HTTP 409 when inventory module is HARD_LOCKED', async () => {
            (jwt.verify as any).mockReturnValue({ userId: 99, role: 'USER' });
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

            const req = new NextRequest('http://localhost/api/stock/adjustments', {
                method: 'POST',
                body: JSON.stringify(buildAdjustmentBody()),
                headers: {
                    'Authorization': 'Bearer test_token',
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTAdjustment(req);
            expect(res.status).toBe(409);
            const data = await res.json();
            expect(data.error).toContain('مغلقة');
        });

        it('should BLOCK adjustment with HTTP 422 when inventory module is SOFT_LOCKED and no override is present', async () => {
            (jwt.verify as any).mockReturnValue({ userId: 99, role: 'USER' });
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

            const req = new NextRequest('http://localhost/api/stock/adjustments', {
                method: 'POST',
                body: JSON.stringify(buildAdjustmentBody()),
                headers: {
                    'Authorization': 'Bearer test_token',
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTAdjustment(req);
            expect(res.status).toBe(422);
            const data = await res.json();
            expect(data.code).toBe('MASTER_OVERRIDE_REQUIRED');
        });

        it('should ALLOW adjustment with HTTP 200 when inventory module is SOFT_LOCKED but valid override context is passed', async () => {
            (jwt.verify as any).mockReturnValue({ userId: 99, role: 'MASTER_ADMIN' });
            (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'MASTER_ADMIN', tenantId: 'tenant_test' });
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

            const req = new NextRequest('http://localhost/api/stock/adjustments', {
                method: 'POST',
                body: JSON.stringify(buildAdjustmentBody()),
                headers: {
                    'Authorization': 'Bearer test_token',
                    'x-tenant': 'tenant_test',
                    'X-Soft-Lock-Override-Reason': 'Legitimate physical adjustment justification for testing',
                    'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
                }
            });

            const res = await POSTAdjustment(req);
            expect(res.status).toBe(200);
        });
    });

    describe('2. Stocktake API', () => {
        it('should ALLOW stocktake in an open period', async () => {
            const req = new NextRequest('http://localhost/api/stocktake', {
                method: 'POST',
                body: JSON.stringify(buildStocktakeBody()),
                headers: {
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTStocktake(req);
            expect(res.status).toBe(201);
        });

        it('should BLOCK stocktake with HTTP 409 when inventory module is HARD_LOCKED', async () => {
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

            const req = new NextRequest('http://localhost/api/stocktake', {
                method: 'POST',
                body: JSON.stringify(buildStocktakeBody()),
                headers: {
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTStocktake(req);
            expect(res.status).toBe(409);
            const data = await res.json();
            expect(data.error).toContain('مغلقة');
        });
    });
});
