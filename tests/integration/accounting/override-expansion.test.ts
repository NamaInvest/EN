import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as POST_TREASURY } from '@/app/api/treasury/route';
import { POST as POST_SALES } from '@/app/api/sales/route';
import { POST as POST_PURCHASES } from '@/app/api/purchases/route';

const mockTreasuryService = vi.fn();
const mockSalesJournal = vi.fn();
const mockPurchaseJournal = vi.fn();
const mockPurchasePayment = vi.fn();
const mockGRN = vi.fn();

vi.mock('@/lib/prisma', () => {
    const mockPrismaObj = {
        salesInvoice: { findFirst: vi.fn(), create: vi.fn(() => ({ id: 1, stockId: 1 })), update: vi.fn() },
        purchaseInvoice: { findFirst: vi.fn(), create: vi.fn(() => ({ id: 1, stockId: 1 })), update: vi.fn() },
        auditLog: { create: vi.fn() },
        user: { findUnique: vi.fn() },
        setting: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        account: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        stock: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        customer: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        supplier: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        branch: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        stockItem: { update: vi.fn(), upsert: vi.fn(), create: vi.fn(), findUnique: vi.fn(() => ({ quantity: 100 })), findMany: vi.fn(() => []) },
        product: { update: vi.fn(), upsert: vi.fn(), findUnique: vi.fn(() => ({ currentStock: 100, isService: false, name: 'Test Product' })), findMany: vi.fn(() => []) },
        productStock: { update: vi.fn(), upsert: vi.fn(), findUnique: vi.fn(() => ({ currentStock: 100 })), findMany: vi.fn(() => []) },
        tax: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
        payment: { findMany: vi.fn(() => []), create: vi.fn() },
        stockMovement: { create: vi.fn(), findMany: vi.fn(() => []) },
        salesInvoiceItem: { create: vi.fn(), findMany: vi.fn(() => []) },
        purchaseInvoiceItem: { create: vi.fn(), findMany: vi.fn(() => []) },
        productUnit: { findMany: vi.fn(() => []) },
        recipe: { findFirst: vi.fn(() => null) },
        journalEntry: { findMany: vi.fn(() => []), create: vi.fn() },
        $transaction: vi.fn(async (cb) => cb(mockPrismaObj)),
        $executeRaw: vi.fn()
    };
    return {
        __esModule: true,
        default: mockPrismaObj,
        getPrisma: vi.fn(() => mockPrismaObj),
        prisma: mockPrismaObj,
        resolveTenant: vi.fn(() => 'tenant-1'),
        withTenant: vi.fn(async (t, fn) => fn())
    };
});

vi.mock('@/lib/getDefaults', () => ({
    resolveStockAndBranch: vi.fn(async () => ({ stockId: 1, branchId: 1 }))
}));

vi.mock('@/lib/quotaGuard', () => ({
    checkQuota: vi.fn(() => ({ allowed: true }))
}));

vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(() => ({ userId: 1, role: 'MASTER_ADMIN', tenantId: 'tenant-1' })),
    hasPermission: vi.fn(() => true)
}));

vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn(() => 'tenant-1'),
    requireTenantContext: vi.fn((req) => ({ tenantId: 'tenant-1', isTenantIsolated: true }))
}));

vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => handler({ req, ctx })
}));

vi.mock('@/lib/idempotency', () => ({
    lockIdempotencyKey: vi.fn(() => true),
    completeIdempotencyKey: vi.fn(() => true),
    unlockIdempotencyKey: vi.fn(() => true),
    withIdempotency: vi.fn(async (req, action, fn) => fn())
}));

vi.mock('@/lib/zatca', () => ({
    generateZatcaQRContent: vi.fn(() => 'mock-qr')
}));

vi.mock('@/lib/db/transaction', () => ({
    withTransaction: vi.fn(async (prisma, fn) => fn(prisma)),
    runFinancialTx: vi.fn(async (prisma, fn) => fn(prisma))
}));

vi.mock('@/lib/services/treasury-posting.service', () => ({
    TreasuryPostingService: {
        createTreasuryEntry: (...args: any[]) => { mockTreasuryService(...args); return { id: 1 }; }
    }
}));

vi.mock('@/lib/auto-journal', () => ({
    postSalesInvoice: (...args: any[]) => { mockSalesJournal(...args); return { success: true }; },
    postSalesPayment: (...args: any[]) => { return { success: true }; },
    postPurchaseInvoice: (...args: any[]) => { mockPurchaseJournal(...args); return { success: true }; },
    postGRN: (...args: any[]) => { mockGRN(...args); return { success: true }; },
    postPurchasePayment: (...args: any[]) => { mockPurchasePayment(...args); return { success: true }; }
}));

vi.mock('@/lib/api-handler', () => ({
    handleApiError: vi.fn((err) => {
        console.error('API ERROR:', err);
        return new Response(JSON.stringify({ error: err.message || 'Error' }), { status: 500 });
    })
}));

describe('Phase 7.4 - Controlled Override API Wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (url: string, body: any, headers: Record<string, string> = {}) => {
        return new NextRequest(`http://localhost${url}`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: new Headers({
                'x-tenant': 'tenant-1',
                'x-idempotency-key': body.idempotencyKey || 'test-key',
                ...headers
            })
        });
    };

    it('Treasury POST should pass OverrideContext to TreasuryPostingService', async () => {
        const req = createRequest('/api/treasury', {
            type: 'in', amount: 500, referenceType: 'manual', treasuryAccountId: 1
        }, {
            'X-Soft-Lock-Override-Reason': 'Urgent treasury override',
            'X-Soft-Lock-Confirmation': 'CONFIRM_OVERRIDE'
        });
        
        await POST_TREASURY(req as any, {} as any);
        
        expect(mockTreasuryService).toHaveBeenCalled();
        const callArgs = mockTreasuryService.mock.calls[0];
        // param[4] is overrideContext in createTreasuryEntry
        expect(callArgs[4]).toMatchObject({
            reason: 'Urgent treasury override',
            confirmationCode: 'CONFIRM_OVERRIDE',
            actorRole: 'MASTER_ADMIN'
        });
    });

    it('Sales POST should pass OverrideContext to postSalesInvoice', async () => {
        const req = createRequest('/api/sales', {
            customerId: 1, items: [{ productId: 1, quantity: 1, price: 100 }], paymentType: 'cash', manualDate: '2026-05-15'
        }, {
            'X-Soft-Lock-Override-Reason': 'Urgent sales override',
            'X-Soft-Lock-Confirmation': 'CONFIRM_OVERRIDE'
        });
        const res = await POST_SALES(req as any, {} as any);
        const data = await res.json();
        console.log("SALES ERROR:", data);
        expect(res.status).toBe(201); // this will fail and show us the real error
        
        expect(mockSalesJournal).toHaveBeenCalled();
        const args = mockSalesJournal.mock.calls[0][0];
        expect(args.overrideContext).toMatchObject({
            reason: 'Urgent sales override',
            confirmationCode: 'CONFIRM_OVERRIDE'
        });
    });

    it('Purchases POST should pass OverrideContext to postPurchaseInvoice and postGRN', async () => {
        const req = createRequest('/api/purchases', {
            supplierId: 1, items: [{ productId: 1, quantity: 1, price: 100 }], paymentType: 'cash', receiptStatus: 'received', manualDate: '2026-05-15'
        }, {
            'X-Soft-Lock-Override-Reason': 'Urgent purchase override',
            'X-Soft-Lock-Confirmation': 'CONFIRM_OVERRIDE'
        });
        
        const res = await POST_PURCHASES(req as any, {} as any);
        const data = await res.json();
        console.log("PURCHASES ERROR:", data);
        expect(res.status).toBe(201);
        
        expect(mockPurchaseJournal).toHaveBeenCalled();
        expect(mockPurchaseJournal.mock.calls[0][0].overrideContext).toMatchObject({
            reason: 'Urgent purchase override'
        });
        
        expect(mockGRN).toHaveBeenCalled();
        expect(mockGRN.mock.calls[0][0].overrideContext).toMatchObject({
            reason: 'Urgent purchase override'
        });
    });
});
