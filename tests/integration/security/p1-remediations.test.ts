import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Let-bindings starting with 'mock' are hoisted-safe in Vitest
let mockUserInstance: any = null;

// Mock getPrisma to return a mock client
vi.mock('@/lib/prisma', async (importOriginal) => {
  const actual: any = await importOriginal();
  const mockClient = {
    mfaRecoveryRequest: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 999) return Promise.resolve(null);
        return Promise.resolve({
          id: where.id || 1,
          tenantId: where.tenantId || 'n11',
          userId: 10,
          status: where.status || 'PENDING',
          reviewedByUserId: null,
        });
      }),
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 1, ...args.data })),
      update: vi.fn().mockImplementation((args) => Promise.resolve({ id: 1, ...args.data })),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 10, tenantId: 'n11', role: 'user' }),
      findUnique: vi.fn().mockResolvedValue({ id: 2, role: 'admin', permissions: [] }),
      update: vi.fn().mockResolvedValue({ id: 2 }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
  };
  return {
    ...actual,
    getPrisma: vi.fn().mockImplementation(() => mockClient),
    default: mockClient,
    prisma: mockClient,
  };
});

// Mock getUserFromRequest and authentication
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getUserFromRequest: vi.fn().mockImplementation(() => mockUserInstance),
  };
});

// Mock MfaEngine
vi.mock('@/lib/mfa-engine', () => {
  return {
    MfaEngine: {
      disable: vi.fn().mockResolvedValue({ success: true })
    }
  };
});

// Mock period lock module check to throw error on backdated
vi.mock('@/lib/governance/period-lock', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    assertPeriodWritable: vi.fn().mockImplementation(({ postingDate }) => {
      if (postingDate && postingDate.getFullYear() < 2026) {
        const { PeriodLockViolation } = actual;
        throw new PeriodLockViolation('الفترة المحاسبية 2025-01 مغلقة نهائياً (CLOSED).', 'LOCKED');
      }
      return Promise.resolve('ALLOWED');
    })
  };
});

// Mock jwt verify
vi.mock('jsonwebtoken', () => {
  return {
    default: {
      verify: vi.fn().mockReturnValue({ userId: 2, role: 'admin' })
    }
  };
});

describe('P1 Audit Remediation Tests', () => {
  let originalDesktopMode: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInstance = null;
    originalDesktopMode = process.env.DESKTOP_MODE;
    process.env.DESKTOP_MODE = 'false';
  });

  afterEach(() => {
    process.env.DESKTOP_MODE = originalDesktopMode;
  });

  // ── ISS-01: Cron Jobs Tenant Isolation ──────────────────────────────────────
  describe('ISS-01: Cron Jobs Tenant Isolation', () => {
    it('rejects cron requests without auth', async () => {
      const { POST } = await import('@/app/api/cron/daily-audit/route');
      const req = new NextRequest('http://localhost/api/cron/daily-audit?tenantId=tenantA', {
        method: 'POST'
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('rejects cron requests without tenantId', async () => {
      const { POST } = await import('@/app/api/cron/daily-audit/route');
      const req = new NextRequest('http://localhost/api/cron/daily-audit', {
        method: 'POST',
        headers: { 'x-cron-secret': process.env.CRON_SECRET || 'local-dev' }
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('tenantId required');
    });
  });

  // ── ISS-02: MFA Recovery Dual-Officer Approval ──────────────────────────────
  describe('ISS-02: MFA Recovery Dual-Officer Approval', () => {
    it('requires admin or owner auth for recovery requests', async () => {
      const { POST } = await import('@/app/api/auth/mfa/recovery/route');
      mockUserInstance = { id: 3, userId: 3, role: 'user', tenantId: 'n11' };

      const req = new NextRequest('http://localhost/api/auth/mfa/recovery', {
        method: 'POST',
        headers: { 'x-tenant': 'n11' },
        body: JSON.stringify({ action: 'CREATE', targetUserId: 10, reason: 'Broken phone' })
      });

      const res = await POST(req);
      expect(res.status).toBe(403); // Forbidden because role is 'user'
    });

    it('prevents user from self-recovery', async () => {
      const { POST } = await import('@/app/api/auth/mfa/recovery/route');
      mockUserInstance = { id: 2, userId: 2, role: 'admin', tenantId: 'n11' };

      const req = new NextRequest('http://localhost/api/auth/mfa/recovery', {
        method: 'POST',
        headers: { 'x-tenant': 'n11' },
        body: JSON.stringify({ action: 'CREATE', targetUserId: 2, reason: 'Broken phone' })
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('cannot request recovery for themselves');
    });
  });

  // ── ISS-03: Inventory Retroactive Fiscal Period Enforcement ─────────────────
  describe('ISS-03: Inventory Retroactive Fiscal Period Enforcement', () => {
    it('rejects inventory adjustments in locked periods', async () => {
      const { POST } = await import('@/app/api/stock/adjustments/route');
      mockUserInstance = { id: 2, userId: 2, role: 'admin', tenantId: 'n11' };

      // Try retro-active date (e.g. 2025-01-01)
      const req = new NextRequest('http://localhost/api/stock/adjustments', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer mock-token',
          'x-tenant': 'n11'
        },
        body: JSON.stringify({
          productId: 1,
          actualQuantity: 200,
          date: '2025-01-01'
        })
      });

      const res = await POST(req);
      // LOCKED returns status 409
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('الفترة المحاسبية 2025-01 مغلقة نهائياً (CLOSED).');
    });
  });
});
