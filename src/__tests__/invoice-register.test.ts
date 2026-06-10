import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock Dependencies ────────────────────────────────────────────────────────

// Mock Redis to prevent real connection attempts during tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      incr: jest.fn(() => Promise.resolve(1)),
      pexpire: jest.fn(() => Promise.resolve(true)),
    };
  });
});

// Mock Next.js metrics and instrumentation
jest.mock('@/lib/instrumentation/metrics', () => ({
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    }),
  },
}));

// Mock Prisma client and context
const mockPrisma: any = {
  salesInvoice: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn(() => Promise.resolve({ id: 'audit-log-id' })),
  }
};

jest.mock('@/lib/prisma', () => ({
  getPrisma: jest.fn().mockReturnValue(mockPrisma),
  resolveTenantContext: jest.fn().mockReturnValue({
    tenantSlug: 'n11',
    tenantId: 'n11-id',
    mode: 'request',
  }),
  currentRequestStore: {
    run: (tenant: string, callback: () => any) => callback(),
  }
}));

jest.mock('@/lib/governance/tenant-guard', () => ({
  assertTenantContextMatch: jest.fn(),
  requireTenantId: jest.fn().mockReturnValue('n11'),
  TENANT_ISOLATION_ERROR: 'Tenant isolation violation',
}));

// Mock Auth logic
const mockGetUserFromRequest = jest.fn();
jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth') as any;
  return {
    ...actual,
    getUserFromRequest: mockGetUserFromRequest,
    verifyToken: jest.fn(),
    getTokenFromRequest: jest.fn(),
  };
});

// ── Imports ──────────────────────────────────────────────────────────────────
import { hasPermission } from '@/lib/auth';
import { GET } from '@/app/api/sales/invoice-register/route';
import { NextRequest } from 'next/server';

// Helper to wrap Decimal mocking
class MockDecimal {
  constructor(private val: number) {}
  toNumber() {
    return this.val;
  }
}

describe('Invoice Register Backend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserFromRequest.mockReturnValue({
      userId: 101,
      role: 'accountant',
      tenantId: 'n11',
      username: 'test_accountant',
    });
    // Set default mock response for dbUser permissions resolution
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 101,
      role: 'accountant',
      permissions: [
        {
          module: 'sales',
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
          canPrint: true,
        }
      ]
    });
  });

  describe('Permissions fallback translation', () => {
    it('should grant access to sales.invoice_register.view if user has parent sales view permission', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 101,
        role: 'accountant',
        permissions: [
          {
            module: 'sales',
            canView: true,
            canAdd: true,
            canEdit: false,
            canDelete: false,
            canPrint: true,
          }
        ]
      });

      const canView = await hasPermission(101, 'sales.invoice_register.view', mockPrisma);
      expect(canView).toBe(true);

      const canPrint = await hasPermission(101, 'sales.invoice_register.print', mockPrisma);
      expect(canPrint).toBe(true);

      const canVoid = await hasPermission(101, 'sales.invoice_register.void', mockPrisma);
      expect(canVoid).toBe(false); // canDelete is false
    });

    it('should grant action based on fallback to explicit invoice_register module record', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 101,
        role: 'accountant',
        permissions: [
          {
            module: 'invoice_register',
            canView: true,
            canAdd: false,
            canEdit: true,
            canDelete: true,
            canPrint: false,
          }
        ]
      });

      const canView = await hasPermission(101, 'sales.invoice_register.view', mockPrisma);
      expect(canView).toBe(true);

      const canVoid = await hasPermission(101, 'sales.invoice_register.void', mockPrisma);
      expect(canVoid).toBe(true); // canDelete is true
    });
  });

  describe('API Endpoint filtering & isolation', () => {
    it('should enforce strict tenant isolation on database query', async () => {
      mockPrisma.salesInvoice.findMany.mockResolvedValue([]);
      mockPrisma.salesInvoice.count.mockResolvedValue(0);
      mockPrisma.salesInvoice.aggregate.mockResolvedValue({
        _sum: {
          subtotal: null,
          taxValue: null,
          total: null,
          paid: null,
          remaining: null,
        }
      });

      const req = new NextRequest('http://localhost/api/sales/invoice-register');
      req.headers.set('x-tenant', 'n11');
      req.headers.set('x-tenant-id', 'n11');

      const res = await GET(req);
      expect(res.status).toBe(200);

      // Verify tenantId is isolated in DB query
      expect(mockPrisma.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'n11',
            deletedAt: null
          })
        })
      );
    });

    it('should apply paymentStatus filter conditions correctly', async () => {
      mockPrisma.salesInvoice.findMany.mockResolvedValue([]);
      mockPrisma.salesInvoice.count.mockResolvedValue(0);
      mockPrisma.salesInvoice.aggregate.mockResolvedValue({
        _sum: { subtotal: null, taxValue: null, total: null, paid: null, remaining: null }
      });

      const req = new NextRequest('http://localhost/api/sales/invoice-register?paymentStatus=unpaid');
      req.headers.set('x-tenant', 'n11');
      req.headers.set('x-tenant-id', 'n11');

      await GET(req);

      expect(mockPrisma.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paid: 0,
            tenantId: 'n11'
          })
        })
      );
    });

    it('should compute and return correct aggregates to the response body', async () => {
      mockPrisma.salesInvoice.findMany.mockResolvedValue([
        {
          id: 1,
          invoiceNo: 5543,
          date: new Date('2026-06-01T10:00:00.000Z'),
          subtotal: new MockDecimal(100),
          taxValue: new MockDecimal(15),
          total: new MockDecimal(115),
          paid: new MockDecimal(115),
          remaining: new MockDecimal(0),
          paymentType: 'cash',
          status: 'completed',
          zatcaStatus: 'cleared',
          docType: 'invoice',
          customer: { name: 'العميل المميز', taxNumber: '123456' },
          branch: { name: 'فرع الرياض' },
          user: { fullName: 'أحمد المحاسب' },
          salesQuotation: null
        }
      ]);
      mockPrisma.salesInvoice.count.mockResolvedValue(1);
      mockPrisma.salesInvoice.aggregate.mockResolvedValue({
        _sum: {
          subtotal: new MockDecimal(100),
          taxValue: new MockDecimal(15),
          total: new MockDecimal(115),
          paid: new MockDecimal(115),
          remaining: new MockDecimal(0),
        }
      });

      const req = new NextRequest('http://localhost/api/sales/invoice-register');
      req.headers.set('x-tenant', 'n11');
      req.headers.set('x-tenant-id', 'n11');

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.totals.totalSum).toBe(115);
      expect(body.totals.paidSum).toBe(115);
      expect(body.totals.balanceSum).toBe(0);
      expect(body.data[0].customerName).toBe('العميل المميز');
    });
  });
});
