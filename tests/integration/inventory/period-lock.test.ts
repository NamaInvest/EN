import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() }
}));

// Mock auto-journal
vi.mock('@/lib/auto-journal', () => ({
    postInventoryAdjustment: vi.fn().mockResolvedValue({ success: true }),
    postStockTransfer: vi.fn().mockResolvedValue({ success: true })
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

// Mock numbering
vi.mock('@/lib/numbering', () => ({
    getNextNumber: vi.fn().mockResolvedValue({ current: 100, formatted: '100' })
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        product: {
            findFirst: vi.fn().mockResolvedValue({ id: 1, currentStock: 100, buyPrice: 10 }),
            findUnique: vi.fn().mockResolvedValue({ id: 1, currentStock: 100, buyPrice: 10, name: 'Test Product' }),
            findMany: vi.fn().mockResolvedValue([{ id: 1, name: 'Test Product', currentStock: 100, buyPrice: 10, active: true }]),
            updateMany: vi.fn().mockResolvedValue({ count: 1 })
        },
        productStock: {
            upsert: vi.fn(),
            findFirst: vi.fn().mockResolvedValue({ id: 1, quantity: 100 }),
            create: vi.fn(),
            update: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({ count: 1 })
        },
        stockMovement: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
            findUnique: vi.fn().mockResolvedValue({ id: 1, type: 'transit_out', notes: '{"status":"pending","receiverStockId":2,"transferRef":"TRX-1"}' }),
            update: vi.fn().mockResolvedValue({}),
            findMany: vi.fn().mockResolvedValue([])
        },
        stockTransfer: {
            create: vi.fn().mockResolvedValue({ id: 1, details: [] }),
            findFirst: vi.fn().mockResolvedValue(null)
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

// Mock idempotency
vi.mock('@/lib/idempotency', () => ({
    lockIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    unlockIdempotencyKey: vi.fn().mockResolvedValue(true)
}));

import { POST as POSTAdjustment } from '@/app/api/stock/adjustments/route';
import { POST as POSTStocktake } from '@/app/api/stocktake/route';
import { POST as POSTTransfer } from '@/app/api/stock-transfers/route';
import { POST as POSTSmartDispatch, PUT as PUTSmartReceive } from '@/app/api/smart-transfers/route';
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

    const buildTransferBody = () => ({
        fromStockId: 1,
        toStockId: 2,
        items: [{ productId: 1, quantity: 10, productName: 'Test Product' }],
        notes: 'Transfer notes'
    });

    const buildSmartDispatchBody = () => ({
        productId: 1,
        senderStockId: 1,
        receiverStockId: 2,
        quantity: 10
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

    describe('3. Direct Stock Transfers API', () => {
        it('should ALLOW transfer in an open period', async () => {
            const req = new NextRequest('http://localhost/api/stock-transfers', {
                method: 'POST',
                body: JSON.stringify(buildTransferBody()),
                headers: {
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTTransfer(req);
            expect(res.status).toBe(201);
        });

        it('should BLOCK transfer with HTTP 409 when inventory module is HARD_LOCKED', async () => {
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

            const req = new NextRequest('http://localhost/api/stock-transfers', {
                method: 'POST',
                body: JSON.stringify(buildTransferBody()),
                headers: {
                    'x-tenant': 'tenant_test'
                }
            });

            const res = await POSTTransfer(req);
            expect(res.status).toBe(409);
            const data = await res.json();
            expect(data.error).toContain('مغلقة');
        });
    });

    describe('4. Smart Transfers API (Dispatch & Receive)', () => {
        it('should ALLOW smart dispatch in an open period', async () => {
            const req = new NextRequest('http://localhost/api/smart-transfers', {
                method: 'POST',
                body: JSON.stringify(buildSmartDispatchBody()),
                headers: {
                    'x-tenant': 'tenant_test',
                    'x-idempotency-key': 'smart-key-1'
                }
            });

            const res = await POSTSmartDispatch(req);
            expect(res.status).toBe(200);
        });

        it('should BLOCK smart dispatch with HTTP 409 when inventory module is HARD_LOCKED', async () => {
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

            const req = new NextRequest('http://localhost/api/smart-transfers', {
                method: 'POST',
                body: JSON.stringify(buildSmartDispatchBody()),
                headers: {
                    'x-tenant': 'tenant_test',
                    'x-idempotency-key': 'smart-key-2'
                }
            });

            const res = await POSTSmartDispatch(req);
            expect(res.status).toBe(409);
            const data = await res.json();
            expect(data.error).toContain('مغلقة');
        });

        it('should ALLOW smart receipt in an open period', async () => {
            const req = new NextRequest('http://localhost/api/smart-transfers', {
                method: 'PUT',
                body: JSON.stringify({ movementId: 1 }),
                headers: {
                    'x-tenant': 'tenant_test',
                    'x-idempotency-key': 'smart-key-3'
                }
            });

            const res = await PUTSmartReceive(req);
            expect(res.status).toBe(200);
        });

        it('should BLOCK smart receipt with HTTP 409 when inventory module is HARD_LOCKED', async () => {
            const mockPrisma = getPrisma({} as any);
            (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

            const req = new NextRequest('http://localhost/api/smart-transfers', {
                method: 'PUT',
                body: JSON.stringify({ movementId: 1 }),
                headers: {
                    'x-tenant': 'tenant_test',
                    'x-idempotency-key': 'smart-key-4'
                }
            });

            const res = await PUTSmartReceive(req);
            expect(res.status).toBe(409);
            const data = await res.json();
            expect(data.error).toContain('مغلقة');
        });
    });
});
