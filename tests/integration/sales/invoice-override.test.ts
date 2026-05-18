import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth module
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(),
    hasPermission: vi.fn().mockResolvedValue(true)
}));

// Mock auto-journal
vi.mock('@/lib/auto-journal', () => ({
    postSalesInvoice: vi.fn(),
    postSalesPayment: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        user: { findUnique: vi.fn().mockResolvedValue({ branchId: 1 }) },
        salesInvoice: { create: vi.fn().mockResolvedValue({ id: 1, invoiceNo: 'INV-1', date: new Date() }), findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
        salesInvoiceDetail: { create: vi.fn() },
        customer: { findUnique: vi.fn().mockResolvedValue({ creditLimit: 0, balance: 0, name: 'Test' }) },
        setting: { findUnique: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
        product: { findUnique: vi.fn().mockResolvedValue({ currentStock: 100, buyPrice: 10 }), update: vi.fn() },
        productUnit: { findMany: vi.fn().mockResolvedValue([{ id: 1, factor: 1, unitStock: 100 }]), update: vi.fn() },
        productStock: { upsert: vi.fn() },
        stockMovement: { create: vi.fn() },
        recipe: { findFirst: vi.fn().mockResolvedValue(null) },
        auditLog: { create: vi.fn() },
        outboxEvent: { create: vi.fn() },
        treasury: { create: vi.fn() },
        $executeRaw: vi.fn()
    };
    mockPrisma.$transaction = vi.fn(async (cb: any) => typeof cb === 'function' ? cb(mockPrisma) : cb);
    return {
        getPrisma: vi.fn().mockReturnValue(mockPrisma)
    };
});

// Mock zatca
vi.mock('@/lib/zatca', () => ({
    generateZatcaQRContent: vi.fn().mockReturnValue('QR_CODE')
}));

// Mock defaults
vi.mock('@/lib/getDefaults', () => ({
    resolveStockAndBranch: vi.fn().mockResolvedValue({ stockId: 1, branchId: 1 })
}));

// Mock quotaGuard
vi.mock('@/lib/quotaGuard', () => ({
    checkQuota: vi.fn().mockResolvedValue({ allowed: true })
}));

// Mock transaction
vi.mock('@/lib/db/transaction', () => ({
    withTransaction: vi.fn((prisma, cb) => cb(prisma)),
    runFinancialTx: vi.fn((prisma, cb) => cb(prisma))
}));

// Mock getIdempotency
vi.mock('@/lib/idempotency', () => ({
    lockIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    unlockIdempotencyKey: vi.fn().mockResolvedValue(true)
}));

// Mock tenant-guard
vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn().mockReturnValue('tenant_test')
}));

vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        const { getUserFromRequest } = await import('@/lib/auth');
        const auth = (getUserFromRequest as any)(req);
        return handler({ req, auth, tenant: auth?.tenantId, prisma: {} }, ctx);
    }
}));

import { _POST } from '@/app/api/sales/route';
import { postSalesInvoice } from '@/lib/auto-journal';
import { getUserFromRequest } from '@/lib/auth';

describe('Sales POST API - Override Context Wiring (Phase 7.4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (postSalesInvoice as any).mockResolvedValue({ success: true, entryId: 1 });
    });

    const buildValidBody = () => ({
        items: [{ productId: 1, quantity: 1, price: 100 }],
        paymentType: 'cash',
        paid: 115,
        taxRate: 15,
        customerId: 1,
    });

    it('should NOT pass overrideContext if no headers are present', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'USER' });

        const req = new NextRequest('http://localhost/api/sales', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: { 'x-tenant': 'tenant_test', 'x-idempotency-key': 'key1' }
        });

        const res = await _POST(req as any);
        expect(res.status).toBe(201);
        expect(postSalesInvoice).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: undefined
            })
        );
    });

    it('should pass overrideContext when headers are valid', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'MASTER_ADMIN' });

        const req = new NextRequest('http://localhost/api/sales', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'key2',
                'X-Soft-Lock-Override-Reason': 'Valid reason to bypass soft lock constraints for testing',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await _POST(req as any);
        expect(res.status).toBe(201);
        expect(postSalesInvoice).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: expect.objectContaining({
                    actorId: '99',
                    actorRole: 'MASTER_ADMIN',
                    tenantId: 'tenant_test',
                    reason: 'Valid reason to bypass soft lock constraints for testing',
                    confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE'
                })
            })
        );
    });

    it('should NEVER take tenantId or actorRole from body for overrideContext', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_auth', userId: 1, role: 'USER' });

        const maliciousBody = {
            ...buildValidBody(),
            tenantId: 'tenant_malicious',
            role: 'MASTER_ADMIN'
        };

        const req = new NextRequest('http://localhost/api/sales', {
            method: 'POST',
            body: JSON.stringify(maliciousBody),
            headers: {
                'x-tenant': 'tenant_auth',
                'x-idempotency-key': 'key3',
                'X-Soft-Lock-Override-Reason': 'Trying to hack override reason length >= 20',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await _POST(req as any);
        expect(res.status).toBe(201);
        
        expect(postSalesInvoice).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: expect.objectContaining({
                    actorId: '1',
                    actorRole: 'USER', // Kept from auth
                    tenantId: 'tenant_test', // Kept from tenant-guard
                })
            })
        );
    });
});
