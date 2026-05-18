import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() }
}));

// Mock auto-journal
vi.mock('@/lib/auto-journal', () => ({
    postGRN: vi.fn(),
}));

// Mock numbering
vi.mock('@/lib/numbering', () => ({
    getNextNumber: vi.fn().mockResolvedValue({ current: 100, formatted: '100' })
}));

// Mock tenant-guard
vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn().mockReturnValue('tenant_test')
}));

// Mock transaction
vi.mock('@/lib/db/transaction', () => ({
    withTransaction: vi.fn((prisma, cb) => cb(prisma)),
    runFinancialTx: vi.fn((prisma, cb) => cb(prisma))
}));

// Mock idempotency
vi.mock('@/lib/idempotency', () => ({
    lockIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    unlockIdempotencyKey: vi.fn().mockResolvedValue(true)
}));

// Mock audit-trail
vi.mock('@/lib/audit-trail', () => ({
    logAuditEvent: vi.fn()
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        customer: { findUnique: vi.fn().mockResolvedValue({ name: 'Test Supplier' }) },
        goodsReceiptNote: { create: vi.fn().mockResolvedValue({ id: 1, grnNo: 100, supplierId: 1 }) },
        goodsReceiptNoteDetail: { create: vi.fn() },
        product: { findUnique: vi.fn().mockResolvedValue({ currentStock: 100, buyPrice: 10, minStock: 10 }), update: vi.fn() },
        stockMovement: { create: vi.fn() },
        qualityInspection: { create: vi.fn().mockResolvedValue({}) },
        systemAlert: { create: vi.fn().mockResolvedValue({}) },
        auditLog: { create: vi.fn() },
        productBatch: { create: vi.fn() },
        user: { findUnique: vi.fn().mockResolvedValue({ branchId: 1 }) },
        setting: { findUnique: vi.fn().mockResolvedValue(null) },
        treasury: { create: vi.fn() }
    };
    mockPrisma.$transaction = vi.fn(async (cb: any) => typeof cb === 'function' ? cb(mockPrisma) : cb);
    return {
        getPrisma: vi.fn().mockReturnValue(mockPrisma)
    };
});

// Mock withRoute
vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        return handler({ req, prisma: {} }, ctx);
    }
}));

import { POST } from '@/app/api/purchases/grn/route';
import { postGRN } from '@/lib/auto-journal';
import jwt from 'jsonwebtoken';

describe('GRN POST API - Override Context Wiring (Phase 7.4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (postGRN as any).mockResolvedValue({ success: true, entryId: 1 });
    });

    const buildValidBody = () => ({
        supplierId: 1,
        items: [{ productId: 1, quantity: 10, acceptedQty: 10, rejectedQty: 0 }],
        stockId: 1,
    });

    it('should NOT pass overrideContext if no headers are present', async () => {
        (jwt.verify as any).mockReturnValue({ userId: 99, role: 'USER' });

        const req = new NextRequest('http://localhost/api/purchases/grn', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: { 
                'Authorization': 'Bearer test_token', 
                'x-tenant': 'tenant_test', 
                'x-idempotency-key': 'key1' 
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(200); // the endpoint returns 200 via NextResponse.json(grn)
        expect(postGRN).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: undefined
            })
        );
    });

    it('should pass overrideContext when headers are valid', async () => {
        (jwt.verify as any).mockReturnValue({ userId: 99, role: 'MASTER_ADMIN' });

        const req = new NextRequest('http://localhost/api/purchases/grn', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: {
                'Authorization': 'Bearer test_token',
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'key2',
                'X-Soft-Lock-Override-Reason': 'Valid reason to bypass soft lock constraints for testing',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(postGRN).toHaveBeenCalledWith(
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
        (jwt.verify as any).mockReturnValue({ userId: 1, role: 'USER' });

        const maliciousBody = {
            ...buildValidBody(),
            tenantId: 'tenant_malicious',
            role: 'MASTER_ADMIN'
        };

        const req = new NextRequest('http://localhost/api/purchases/grn', {
            method: 'POST',
            body: JSON.stringify(maliciousBody),
            headers: {
                'Authorization': 'Bearer test_token',
                'x-tenant': 'tenant_test', // valid tenant
                'x-idempotency-key': 'key3',
                'X-Soft-Lock-Override-Reason': 'Trying to hack override reason length >= 20',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        
        expect(postGRN).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: expect.objectContaining({
                    actorId: '1',
                    actorRole: 'USER', // Kept from auth
                    tenantId: 'tenant_test', // Kept from headers, not body
                })
            })
        );
    });
});
