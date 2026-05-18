import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth module
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(),
}));

// Mock TreasuryPostingService
vi.mock('@/lib/services/treasury-posting.service', () => ({
    TreasuryPostingService: {
        createTreasuryEntry: vi.fn(),
    }
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    getPrisma: vi.fn().mockReturnValue({
        $transaction: vi.fn(async (cb) => typeof cb === 'function' ? cb({}) : cb),
        user: { findUnique: vi.fn().mockResolvedValue({ branchId: 1 }) },
        treasury: { create: vi.fn() },
    })
}));

vi.mock('@/lib/idempotency', () => ({
    withIdempotency: vi.fn((req, name, cb) => cb()),
    lockIdempotencyKey: vi.fn().mockResolvedValue(true),
    completeIdempotencyKey: vi.fn().mockResolvedValue(true),
    unlockIdempotencyKey: vi.fn().mockResolvedValue(true)
}));

// Mock withRoute
vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        const { getUserFromRequest } = await import('@/lib/auth');
        const auth = (getUserFromRequest as any)(req);
        return handler({ req, auth, tenant: auth?.tenantId, prisma: {} }, ctx);
    }
}));

import { POST } from '@/app/api/treasury/route';
import { TreasuryPostingService } from '@/lib/services/treasury-posting.service';
import { getUserFromRequest } from '@/lib/auth';

describe('Treasury POST API - Override Context Wiring (Phase 7.4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (TreasuryPostingService.createTreasuryEntry as any).mockResolvedValue({ id: 1, amount: 100 });
    });

    const buildValidBody = () => ({
        type: 'in',
        amount: 100,
        description: 'Test Treasury Receipt',
        paymentType: 'cash',
        date: '2026-05-18',
    });

    it('should NOT pass overrideContext if no headers are present', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'USER' });

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: { 'x-tenant': 'tenant_test', 'x-idempotency-key': 'key1' }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        expect(TreasuryPostingService.createTreasuryEntry).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object),
            null,
            null,
            undefined
        );
    });

    it('should pass overrideContext when headers are valid', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'MASTER_ADMIN' });

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: {
                'x-tenant': 'tenant_test',
                'x-idempotency-key': 'key2',
                'X-Soft-Lock-Override-Reason': 'Valid reason to bypass soft lock constraints for testing',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        expect(TreasuryPostingService.createTreasuryEntry).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object),
            null,
            null,
            expect.objectContaining({
                actorId: '99',
                actorRole: 'MASTER_ADMIN',
                tenantId: 'tenant_test',
                reason: 'Valid reason to bypass soft lock constraints for testing',
                confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE'
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

        const req = new NextRequest('http://localhost/api/treasury', {
            method: 'POST',
            body: JSON.stringify(maliciousBody),
            headers: {
                'x-tenant': 'tenant_auth',
                'x-idempotency-key': 'key3',
                'X-Soft-Lock-Override-Reason': 'Trying to hack override reason length >= 20',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        
        expect(TreasuryPostingService.createTreasuryEntry).toHaveBeenCalledWith(
            expect.any(Object), // tx
            expect.any(Object), // body
            null, // userId
            null, // branchId
            expect.objectContaining({
                actorId: '1',
                actorRole: 'USER', // Kept from auth
                tenantId: 'tenant_auth', // Kept from auth
            })
        );
    });
});
