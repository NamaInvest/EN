import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialPeriodStatus } from '@prisma/client';
import { POST } from '@/app/api/fiscal-periods/route';
import { assertPeriodWritable } from '@/lib/governance/period-lock';

const mockPrismaInstance = vi.hoisted(() => ({
  fiscalPeriod: { upsert: vi.fn() },
  auditLog: { create: vi.fn() },
  financialPeriod: { findUnique: vi.fn() },
  periodLockLog: { create: vi.fn() }
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaInstance,
  default: mockPrismaInstance,
  getPrisma: vi.fn().mockReturnValue(mockPrismaInstance),
  resolveTenantContext: vi.fn().mockReturnValue({ tenantSlug: 'tenant-A', tenantId: 'tenant-A' }),
  currentRequestStore: {
    run: vi.fn((_tenant, cb) => cb())
  }
}));

import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn(),
}));

import { getUserFromRequest } from '@/lib/auth';

describe('Fiscal Period Governance & API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getHeaders = () => new Headers({ 'Content-Type': 'application/json', 'x-tenant-id': 'tenant-A' });

  // 1) non-admin cannot close/open fiscal period
  it('rejects POST if user is not admin', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 1, role: 'user', tenantId: 'tenant-A' } as any);
    const req = new Request('http://localhost/api/fiscal-periods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ year: 2026, month: 5, action: 'close' })
    });
    const res = await POST(req as any, {});
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/صلاحية المدير مطلوبة/);
  });

  // 2) admin can close/open fiscal period
  it('allows POST if user is admin', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 99, role: 'admin', tenantId: 'tenant-A' } as any);
    
    vi.mocked(mockPrismaInstance.fiscalPeriod.upsert as any).mockResolvedValue({ id: 1, year: 2026, month: 5, status: 'closed' });
    vi.mocked(mockPrismaInstance.auditLog.create as any).mockResolvedValue({});

    const req = new Request('http://localhost/api/fiscal-periods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ year: 2026, month: 5, action: 'close' })
    });
    const res = await POST(req as any, {});
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockPrismaInstance.fiscalPeriod.upsert).toHaveBeenCalled();
  });

  // 6) invalid payload rejected by Zod/API validation
  it('rejects invalid payload', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 99, role: 'admin', tenantId: 'tenant-A' } as any);
    const req = new Request('http://localhost/api/fiscal-periods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'close' }) // missing year and month
    });
    const res = await POST(req as any, {});
    expect(res.status).toBe(400); 
    const json = await res.json();
    expect(json.error).toMatch(/مطلوبان|Invalid request body/);
  });

  // 4) auditLog records period status change
  it('records auditLog on status change', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 99, role: 'admin', tenantId: 'tenant-A' } as any);
    vi.mocked(mockPrismaInstance.auditLog.create as any).mockResolvedValue({});
    vi.mocked(mockPrismaInstance.fiscalPeriod.upsert as any).mockResolvedValue({ id: 10 });

    const req = new Request('http://localhost/api/fiscal-periods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ year: 2026, month: 6, action: 'reopen' })
    });
    await POST(req as any, {});
    
    expect(mockPrismaInstance.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'PERIOD_REOPEN',
        tableName: 'fiscal_periods',
        recordId: 10
      })
    }));
  });

  // 3) locked/closed period prevents financial posting
  it('prevents posting if period is HARD_LOCKED', async () => {
    vi.mocked(mockPrismaInstance.financialPeriod.findUnique as any).mockResolvedValue({
      tenantId: 'tenant-A',
      period: '2026-05',
      status: FinancialPeriodStatus.HARD_LOCKED
    });
    
    await expect(assertPeriodWritable({
      tenantId: 'tenant-A',
      postingDate: new Date('2026-05-15'),
      operationType: 'JOURNAL_ENTRY',
      module: 'ACCOUNTING',
      actor: '1'
    })).rejects.toThrow(/مغلقة نهائياً/);
  });

  // 5) tenant A cannot affect tenant B period
  it('enforces tenant isolation (Tenant A cannot close Tenant B period)', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 99, role: 'admin', tenantId: 'tenant-A' } as any);
    
    const mockUpsert = vi.mocked(mockPrismaInstance.fiscalPeriod.upsert as any).mockResolvedValue({ id: 1, year: 2026, month: 5, status: 'closed' });
    vi.mocked(mockPrismaInstance.auditLog.create as any).mockResolvedValue({});
    
    const req = new Request('http://localhost/api/fiscal-periods', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ year: 2026, month: 5, action: 'close' })
    });
    await POST(req as any, {});
    
    const upsertCallArgs = mockUpsert.mock.calls[0]?.[0];
    
    expect(upsertCallArgs).toBeDefined();
    const hasTenantInWhere = !!(upsertCallArgs?.where?.tenantId_year_month?.tenantId || upsertCallArgs?.where?.tenantId);
    
    if (!hasTenantInWhere) {
      throw new Error(`[SECURITY GAP] Tenant Isolation Missing in API: expected tenantId in where clause, got: ${JSON.stringify(upsertCallArgs?.where)}`);
    }
  });
});
