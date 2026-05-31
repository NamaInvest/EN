import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() }
}));

// Mock tenant-guard
vi.mock('@/lib/governance/tenant-guard', () => ({
    requireTenantId: vi.fn().mockReturnValue('default')
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
    getUserFromRequest: vi.fn().mockReturnValue({ userId: 99, role: 'USER', tenantId: 'default' })
}));

// Mock validate-request
vi.mock('@/lib/api/validate-request', () => ({
    validateRequest: vi.fn().mockImplementation(async (req, schema) => {
        const body = await req.json();
        return { data: body, error: null };
    })
}));

// Mock saudiCompliance
vi.mock('@/lib/saudi-compliance', () => ({
    saudiCompliance: () => ({
        gosi: {
            runMonthlyBatch: async () => ({ success: true, count: 10 })
        },
        nitaqat: {
            getStatus: async () => ({ status: 'green' })
        }
    })
}));

// Mock PayrollService
vi.mock('@/services/hr/payroll.service', () => {
    return {
        PayrollService: class {
            runPayroll = async () => ({ payslips: [], totalGross: 10000, totalNet: 9000, errors: [] });
            calculatePayslip = async () => ({});
            createLoan = async () => ({});
            generateWPSFile = () => '';
        }
    };
});

// Mock prisma
vi.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        setting: {
            findUnique: vi.fn().mockResolvedValue({ value: 'true' })
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

import { POST } from '@/app/api/payroll/route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

describe('Payroll Module Period Lock Integration Tests (GL-02 Phase D6)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.setting.findUnique as any).mockResolvedValue({ value: 'true' });
        (mockPrisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue(null);
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'USER', tenantId: 'default' });
    });

    it('should ALLOW payroll run in an open period', async () => {
        const req = new NextRequest('http://localhost/api/payroll?action=run', {
            method: 'POST',
            body: JSON.stringify({ period: '2026-05' }),
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.totalGross).toBe(10000);
    });

    it('should BLOCK payroll run with HTTP 409 when payroll module is HARD_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

        const req = new NextRequest('http://localhost/api/payroll?action=run', {
            method: 'POST',
            body: JSON.stringify({ period: '2026-05' }),
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.code).toBe('LOCKED');
    });

    it('should BLOCK payroll run with HTTP 422 when payroll module is SOFT_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

        const req = new NextRequest('http://localhost/api/payroll?action=run', {
            method: 'POST',
            body: JSON.stringify({ period: '2026-05' }),
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.code).toBe('MASTER_OVERRIDE_REQUIRED');
    });

    it('should ALLOW payroll run with valid Master Override when payroll module is SOFT_LOCKED', async () => {
        (getUserFromRequest as any).mockReturnValue({ userId: 99, role: 'MASTER_ADMIN', tenantId: 'default' });
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'SOFT_LOCKED' });

        const req = new NextRequest('http://localhost/api/payroll?action=run', {
            method: 'POST',
            body: JSON.stringify({ period: '2026-05' }),
            headers: {
                'x-tenant-id': 'default',
                'X-Soft-Lock-Override-Reason': 'Authorized monthly adjustment run for audited corrections',
                'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.totalGross).toBe(10000);
    });

    it('should BLOCK GOSI monthly run with HTTP 409 when payroll module is HARD_LOCKED', async () => {
        const mockPrisma = getPrisma({} as any);
        (mockPrisma.financialPeriodModuleLock.findUnique as any).mockResolvedValue({ status: 'HARD_LOCKED' });

        const req = new NextRequest('http://localhost/api/payroll?action=gosi', {
            method: 'POST',
            body: JSON.stringify({ year: 2026, month: 5 }),
            headers: {
                'x-tenant-id': 'default'
            }
        });

        const res = await POST(req);
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.code).toBe('LOCKED');
    });
});
