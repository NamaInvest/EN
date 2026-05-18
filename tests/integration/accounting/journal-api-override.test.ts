import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth module
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(),
}));

// Mock auto-journal module
vi.mock('@/lib/auto-journal', () => ({
    createJournalEntry: vi.fn(),
    ACCOUNTS: {
        RECEIVABLES: '1200', PAYABLES: '2100', INVENTORY: '1300',
        WIP: '1330', FINISHED_GOODS: '1340', VAT_INPUT: '1400', VAT_OUTPUT: '2300'
    }
}));

// Mock prisma
vi.mock('@/lib/prisma', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        getPrisma: vi.fn().mockReturnValue({
            journalEntry: { findMany: vi.fn(), create: vi.fn() },
            auditLog: { create: vi.fn() }
        })
    };
});

// Mock withRoute to just execute the handler
vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        // Find the imported getUserFromRequest
        const { getUserFromRequest } = await import('@/lib/auth');
        const auth = (getUserFromRequest as any)(req);
        // Execute handler, skipping middleware, but passing what it needs
        return handler({ req, auth, tenant: auth?.tenantId, prisma: {} }, ctx);
    }
}));

import { POST } from '@/app/api/accounting/journal/route';
import { createJournalEntry } from '@/lib/auto-journal';
import { getUserFromRequest } from '@/lib/auth';

describe('Journal POST API - Override Context Wiring (Phase 7.3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (createJournalEntry as any).mockResolvedValue({ success: true, entryId: 1 });
    });

    const buildValidBody = () => ({
        description: 'Test Override Entry',
        date: '2026-05-18',
        lines: [
            { accountCode: '1110', debit: 100, credit: 0 },
            { accountCode: '4100', debit: 0, credit: 100 }
        ]
    });

    async function checkRes(res: Response) {
        if (res.status !== 201) {
            console.error(`${res.status} Error details:`, await res.json());
        }
    }

    it('should NOT pass overrideContext if no headers are present', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'USER' });

        const req = new NextRequest('http://localhost/api/accounting/journal', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: { 'x-tenant-id': 'tenant_test' }
        });

        const res = await POST(req);
        await checkRes(res);
        expect(res.status).toBe(201);
        expect(createJournalEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: undefined
            })
        );
    });

    it('should pass overrideContext when headers are valid', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'MASTER_ADMIN' });

        const req = new NextRequest('http://localhost/api/accounting/journal', {
            method: 'POST',
            body: JSON.stringify(buildValidBody()),
            headers: {
                'x-tenant-id': 'tenant_test',
                'X-Soft-Lock-Override-Reason': 'Valid reason to bypass soft lock constraints for testing',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await POST(req);
        await checkRes(res);
        expect(res.status).toBe(201);
        expect(createJournalEntry).toHaveBeenCalledWith(
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

        const req = new NextRequest('http://localhost/api/accounting/journal', {
            method: 'POST',
            body: JSON.stringify(maliciousBody),
            headers: {
                'x-tenant-id': 'tenant_auth',
                'X-Soft-Lock-Override-Reason': 'Trying to hack override reason length >= 20',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
            }
        });

        const res = await POST(req);
        await checkRes(res);
        expect(res.status).toBe(201);
        
        // Assert that the overrideContext used the auth values, not the malicious body values
        expect(createJournalEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                overrideContext: expect.objectContaining({
                    actorId: '1',
                    actorRole: 'USER', // Kept from auth
                    tenantId: 'tenant_auth', // Kept from auth
                })
            })
        );
    });
});
