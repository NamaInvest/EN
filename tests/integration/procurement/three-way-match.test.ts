/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// 1. Mock auth module
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(),
    hasPermission: vi.fn().mockResolvedValue(true)
}));

// 2. Mock auto-journal
vi.mock('@/lib/auto-journal', () => ({
    postPurchaseInvoice: vi.fn().mockResolvedValue({ success: true, entryId: 101 }),
    postGRN: vi.fn().mockResolvedValue({ success: true, entryId: 102 }),
    reverseJournalByReference: vi.fn(),
}));

// 3. Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        user: { findUnique: vi.fn().mockResolvedValue({ id: 1, role: 'admin', branchId: 1 }), findFirst: vi.fn().mockResolvedValue({ branchId: 1 }) },
        purchaseOrder: { findFirst: vi.fn(), findUnique: vi.fn() },
        goodsReceiptNote: { findMany: vi.fn() },
        purchaseInvoice: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
        purchaseInvoiceDetail: { create: vi.fn() },
        customer: { findFirst: vi.fn().mockResolvedValue({ id: 2, name: 'Vendor A' }), findUnique: vi.fn().mockResolvedValue({ id: 2, name: 'Vendor A' }) },
        setting: { findMany: vi.fn().mockResolvedValue([]) },
        product: { findFirst: vi.fn().mockResolvedValue({ id: 1, buyPrice: 100 }), updateMany: vi.fn() },
        productStock: { upsert: vi.fn() },
        stockMovement: { create: vi.fn() },
        auditLog: { create: vi.fn() },
        treasury: { create: vi.fn(), deleteMany: vi.fn() },
        threeWayMatch: { create: vi.fn() },
        $executeRaw: vi.fn(),
        $queryRawUnsafe: vi.fn().mockResolvedValue([
            { id: 1, code: 'PI', current: '100', prefix: 'PI-', suffix: '', pad_length: 6, reset_frequency: 'yearly', last_reset: new Date() }
        ]),
        $executeRawUnsafe: vi.fn(),
    };
    mockPrisma.$transaction = vi.fn(async (cb: any) => typeof cb === 'function' ? cb(mockPrisma) : cb);

    return {
        __esModule: true,
        default: mockPrisma,
        prisma: mockPrisma,
        getPrisma: vi.fn().mockReturnValue(mockPrisma),
        resolveTenant: vi.fn().mockReturnValue('tenant_test'),
        withTenant: vi.fn(async (t, fn) => fn())
    };
});

// 4. Mock resolveStockAndBranch
vi.mock('@/lib/getDefaults', () => ({
    resolveStockAndBranch: vi.fn().mockResolvedValue({ stockId: 1, branchId: 1 })
}));

// 5. Mock transaction wrapper
vi.mock('@/lib/db/transaction', () => ({
    withTransaction: vi.fn((prisma, cb) => cb(prisma)),
    runFinancialTx: vi.fn((prisma, cb) => cb(prisma))
}));

// 6. Mock idempotency
vi.mock('@/lib/idempotency', () => ({
    lockIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    unlockIdempotencyKey: vi.fn().mockResolvedValue(true)
}));

// 7. Mock tenant guard
vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn().mockReturnValue('tenant_test')
}));

// 8. Mock period lock
vi.mock('@/lib/governance/period-lock', () => ({
    assertPeriodWritable: vi.fn().mockResolvedValue(true),
    PeriodLockViolation: class extends Error {
        code = 'LOCKED';
    }
}));

// 9. Mock open items
vi.mock('@/lib/open-items', () => ({
    OpenItemsEngine: {
        createOpenItem: vi.fn().mockResolvedValue({ id: 1 })
    }
}));

// 10. Mock treasury posting service
vi.mock('@/lib/services/treasury-posting.service', () => ({
    TreasuryPostingService: {
        createTreasuryEntry: vi.fn().mockResolvedValue({ id: 1 })
    }
}));

// Mock withRoute to execute the handler directly
vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        return handler({ req }, ctx);
    }
}));

import { POST } from '@/app/api/purchases/route';
import { postPurchaseInvoice } from '@/lib/auto-journal';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('Procurement F-06 Three-Way Match Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'admin' });
        // Setup successful default prisma creations
        (prisma.purchaseInvoice.create as any).mockResolvedValue({
            id: 10,
            invoiceNo: 200,
            total: 1000,
            paid: 0,
            remaining: 1000,
            status: 'pending',
            receiptStatus: 'received'
        });
    });

    const buildValidBody = (poId: number | null = 101) => ({
        supplierId: 2,
        stockId: 1,
        paymentType: 'credit',
        paid: 0,
        notes: 'Test invoice',
        items: [
            { productId: 1, productName: 'Product 1', quantity: 10, price: 100 }
        ],
        purchaseOrderId: poId,
        isManual: false,
    });

    it('Case 1: Exact match => PASS', async () => {
        // Mock PO details
        (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
            id: 101,
            orderNo: 50,
            total: 1000,
            details: [
                { productId: 1, quantity: 10, price: 100 }
            ]
        });

        // Mock GRN details
        (prisma.goodsReceiptNote.findMany as any).mockResolvedValue([
            {
                id: 301,
                grnNo: 400,
                details: [
                    { productId: 1, quantity: 10, acceptedQty: 10 }
                ]
            }
        ]);

        const req = new NextRequest('http://localhost/api/purchases', {
            method: 'POST',
            body: JSON.stringify(buildValidBody(101)),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'idemp-1'
            }
        });

        const res = await POST(req as any);
        expect(res.status).toBe(201);
        expect(postPurchaseInvoice).toHaveBeenCalled();
        expect(prisma.threeWayMatch.create as any).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    matchStatus: 'MATCHED',
                    isWithinTolerance: true,
                    paymentBlocked: false
                })
            })
        );
    });

    it('Case 2: Price mismatch within tolerance => PASS', async () => {
        // Tolerances are default to 3% or 500 SAR
        // Invoice amount is 1000 (10 * 100), PO amount is 980 (10 * 98) -> diff is 20 SAR (within 500 SAR absolute tolerance)
        (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
            id: 101,
            orderNo: 50,
            total: 980,
            details: [
                { productId: 1, quantity: 10, price: 98 }
            ]
        });

        (prisma.goodsReceiptNote.findMany as any).mockResolvedValue([
            {
                id: 301,
                grnNo: 400,
                details: [
                    { productId: 1, quantity: 10, acceptedQty: 10 }
                ]
            }
        ]);

        const req = new NextRequest('http://localhost/api/purchases', {
            method: 'POST',
            body: JSON.stringify(buildValidBody(101)),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'idemp-2'
            }
        });

        const res = await POST(req as any);
        expect(res.status).toBe(201);
        expect(prisma.threeWayMatch.create as any).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    matchStatus: 'WITHIN_TOLERANCE',
                    isWithinTolerance: true,
                    paymentBlocked: false
                })
            })
        );
    });

    it('Case 3: Price mismatch exceeding tolerance => BLOCK / 422', async () => {
        // Settings: PURCHASE_TOLERANCE_PERCENT = 3% (0.03), PURCHASE_TOLERANCE_AMOUNT = 10 SAR
        (prisma.setting.findMany as any).mockResolvedValue([
            { key: 'PURCHASE_TOLERANCE_PERCENT', value: '0.03' },
            { key: 'PURCHASE_TOLERANCE_AMOUNT', value: '10' }
        ]);

        // Invoice amount is 1000 (10 * 100), PO amount is 950 (10 * 95) -> diff is 50 SAR.
        // Variance pct is 5.26% (>3% tolerance), absolute variance is 50 SAR (>10 SAR flat tolerance).
        // Exceeds both -> BLOCK!
        (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
            id: 101,
            orderNo: 50,
            total: 950,
            details: [
                { productId: 1, quantity: 10, price: 95 }
            ]
        });

        (prisma.goodsReceiptNote.findMany as any).mockResolvedValue([
            {
                id: 301,
                grnNo: 400,
                details: [
                    { productId: 1, quantity: 10, acceptedQty: 10 }
                ]
            }
        ]);

        const req = new NextRequest('http://localhost/api/purchases', {
            method: 'POST',
            body: JSON.stringify(buildValidBody(101)),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'idemp-3'
            }
        });

        const res = await POST(req as any);
        expect(res.status).toBe(422);
        
        const body = await res.json();
        expect(body.error).toContain('فرق المبلغ يتجاوز هامش التسامح');
        expect(body.code).toBe('PRICE_DISCREPANCY');

        // Invoice & Auto-Journal should NOT be created
        expect(prisma.purchaseInvoice.create as any).not.toHaveBeenCalled();
        expect(postPurchaseInvoice).not.toHaveBeenCalled();
    });

    it('Case 4: Quantity mismatch (Invoice > GRN) => BLOCK / 422', async () => {
        (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
            id: 101,
            orderNo: 50,
            total: 1000,
            details: [
                { productId: 1, quantity: 10, price: 100 }
            ]
        });

        // GRN only has 8 accepted items, but invoice requests 10. Exceeds! => QTY_DISCREPANCY block
        (prisma.goodsReceiptNote.findMany as any).mockResolvedValue([
            {
                id: 301,
                grnNo: 400,
                details: [
                    { productId: 1, quantity: 8, acceptedQty: 8 }
                ]
            }
        ]);

        const req = new NextRequest('http://localhost/api/purchases', {
            method: 'POST',
            body: JSON.stringify(buildValidBody(101)),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'idemp-4'
            }
        });

        const res = await POST(req as any);
        expect(res.status).toBe(422);

        const body = await res.json();
        expect(body.error).toContain('كمية الفاتورة (10) أكبر من الكمية المستلمة في إذن الاستلام (8)');
        expect(body.code).toBe('QTY_DISCREPANCY');

        expect(prisma.purchaseInvoice.create as any).not.toHaveBeenCalled();
    });

    it('Case 5: Missing PO associated => BLOCK / 422', async () => {
        (prisma.purchaseOrder.findFirst as any).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/purchases', {
            method: 'POST',
            body: JSON.stringify(buildValidBody(999)),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'idemp-5'
            }
        });

        const res = await POST(req as any);
        expect(res.status).toBe(422);

        const body = await res.json();
        expect(body.error).toContain('أمر الشراء المرتبط غير موجود');
        expect(body.code).toBe('BLOCKED');
    });

    it('Case 6: Override capability with override headers => PASS', async () => {
        (prisma.setting.findMany as any).mockResolvedValue([
            { key: 'PURCHASE_TOLERANCE_PERCENT', value: '0.03' },
            { key: 'PURCHASE_TOLERANCE_AMOUNT', value: '10' }
        ]);

        (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
            id: 101,
            orderNo: 50,
            total: 950,
            details: [
                { productId: 1, quantity: 10, price: 95 }
            ]
        });

        (prisma.goodsReceiptNote.findMany as any).mockResolvedValue([
            {
                id: 301,
                grnNo: 400,
                details: [
                    { productId: 1, quantity: 10, acceptedQty: 10 }
                ]
            }
        ]);

        const req = new NextRequest('http://localhost/api/purchases', {
            method: 'POST',
            body: JSON.stringify(buildValidBody(101)),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'idemp-6',
                'X-Soft-Lock-Override-Reason': 'Approved override by manager for variance'
            }
        });

        const res = await POST(req as any);
        expect(res.status).toBe(201); // Exceeds tolerance but passed due to override header!
    });
});
