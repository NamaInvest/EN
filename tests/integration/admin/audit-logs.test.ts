import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/audit-logs/route';

vi.mock('@/lib/prisma', () => {
    const mockPrismaObj = {
        auditLog: {
            count: vi.fn(() => 2),
            findMany: vi.fn(() => [
                { id: 1, action: 'SOFT_LOCK_OVERRIDE', tenantId: 'tenant-1' },
                { id: 2, action: 'CREATE', tenantId: 'tenant-1' }
            ])
        }
    };
    return {
        getPrisma: vi.fn(() => mockPrismaObj),
    };
});

let mockRole = 'MASTER_ADMIN';

vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn(() => ({ userId: 1, role: mockRole, tenantId: 'tenant-1' }))
}));

describe('Admin Audit Logs API', () => {
    
    beforeEach(() => {
        mockRole = 'MASTER_ADMIN';
    });

    const createRequest = (url: string) => {
        return new NextRequest(`http://localhost${url}`, {
            method: 'GET',
            headers: new Headers({
                'x-tenant': 'tenant-1',
            })
        });
    };

    it('should return 403 for non-admin roles', async () => {
        mockRole = 'USER';
        const req = createRequest('/api/admin/audit-logs');
        const res = await GET(req as any);
        expect(res.status).toBe(403);
    });

    it('should return 200 and audit logs for MASTER_ADMIN', async () => {
        mockRole = 'MASTER_ADMIN';
        const req = createRequest('/api/admin/audit-logs?action=SOFT_LOCK_OVERRIDE');
        const res = await GET(req as any);
        expect(res.status).toBe(200);
        
        const data = await res.json();
        expect(data.ok).toBe(true);
        expect(data.data.length).toBe(2);
        expect(data.pagination.total).toBe(2);
    });
});
