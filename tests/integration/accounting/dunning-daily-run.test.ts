/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth module
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrismaObj = {};
    return {
        __esModule: true,
        default: mockPrismaObj,
        prisma: mockPrismaObj,
        getPrisma: vi.fn().mockReturnValue(mockPrismaObj),
        resolveTenant: vi.fn().mockReturnValue('tenant_test'),
    };
});

// Mock withRoute to just execute the handler
vi.mock('@/lib/api/with-route', () => ({
    withRoute: (handler: any) => async (req: any, ctx: any) => {
        const { getUserFromRequest } = await import('@/lib/auth');
        const auth = (getUserFromRequest as any)(req);
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma(req);
        return handler({ req, auth, tenant: auth?.tenantId, prisma }, ctx);
    }
}));

// Mock DunningEngineV2
vi.mock('@/lib/dunning-engine-v2', () => ({
    DunningEngineV2: {
        executeDailyRun: vi.fn(),
    }
}));

import { POST } from '@/app/api/accounting/dunning/daily-run/route';
import { DunningEngineV2 } from '@/lib/dunning-engine-v2';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

describe('Dunning Daily Run POST API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully execute daily run and return results', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'owner' });
        
        const mockResult = {
            processed: 5,
            skippedSnooze: 1,
            skippedPromise: 0,
            letters: 2,
            lateFees: 1,
            blocked: 0,
            errors: []
        };
        (DunningEngineV2.executeDailyRun as any).mockResolvedValue(mockResult);

        const req = new NextRequest('http://localhost/api/accounting/dunning/daily-run', {
            method: 'POST',
            body: JSON.stringify({ date: '2026-06-06' }),
            headers: { 'x-tenant-id': 'tenant_test' }
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.message).toBe('Dunning daily run completed successfully');
        expect(data.result).toEqual(mockResult);

        const mockPrisma = getPrisma(req);
        expect(DunningEngineV2.executeDailyRun).toHaveBeenCalledWith(
            mockPrisma,
            expect.any(Date)
        );
    });

    it('should handle and return error if DunningEngineV2 fails', async () => {
        (getUserFromRequest as any).mockReturnValue({ tenantId: 'tenant_test', userId: 99, role: 'owner' });
        
        (DunningEngineV2.executeDailyRun as any).mockRejectedValue(new Error('Database error'));

        const req = new NextRequest('http://localhost/api/accounting/dunning/daily-run', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'x-tenant-id': 'tenant_test' }
        });

        const res = await POST(req);
        expect(res.status).toBe(500);

        const data = await res.json();
        expect(data.error).toBe('Database error');
    });
});
