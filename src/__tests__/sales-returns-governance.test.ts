import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { FinancialPeriodStatus } from '@prisma/client';

// ── Mock Dependencies ────────────────────────────────────────────────────────

// Mock Redis to prevent real connection attempts during tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      incr: jest.fn().mockImplementation(() => Promise.resolve(1)),
      pexpire: jest.fn().mockImplementation(() => Promise.resolve(true)),
    };
  });
});

// Mock Next.js metrics and instrumentation
jest.mock('@/lib/instrumentation/metrics', () => ({
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
}));

// Mock logger to print errors to console
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn((...args: any[]) => console.error('LOGGED ERROR:', ...args)),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any),
  },
}));

// Mock Auth logic
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
}));

// Mock idempotency
jest.mock('@/lib/idempotency', () => ({
  withIdempotency: jest.fn().mockImplementation((req: any, key: any, cb: any) => cb()),
}));

// Mock auto-journal
jest.mock('@/lib/auto-journal', () => ({
  postSalesReturn: jest.fn().mockImplementation(() => Promise.resolve({ success: true, entryId: 99 })),
}));

// Mock global prisma client
jest.mock('@/lib/prisma', () => {
  const store = {
    run: (tenant: string, cb: () => any) => cb(),
  };

  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(() => Promise.resolve({
        id: 42,
        role: 'admin',
        permissions: [] as any[],
      })),
    },
    salesReturn: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    salesInvoice: {
      findFirst: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    productStock: {
      upsert: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    financialPeriod: {
      findUnique: jest.fn(),
    },
    financialPeriodModuleLock: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(() => Promise.resolve({ id: 'mock-audit-id' })),
    },
    periodLockLog: {
      create: jest.fn(() => Promise.resolve({ id: 'mock-lock-log-id' })),
    },
  };

  return {
    prisma: mockPrismaClient, // export the mocked prisma variable!
    getPrisma: jest.fn().mockReturnValue(mockPrismaClient),
    resolveTenantContext: jest.fn().mockReturnValue({
      tenantSlug: 'test-tenant',
      tenantId: 'test-tenant-id',
      mode: 'request',
    }),
    currentRequestStore: store,
  };
});

// Mock tenant-guard
jest.mock('@/lib/governance/tenant-guard', () => ({
  assertTenantContextMatch: jest.fn(),
  TENANT_ISOLATION_ERROR: 'Tenant isolation violation',
  requireTenantId: jest.fn().mockReturnValue('test-tenant'),
}));

// Mock transaction
jest.mock('@/lib/db/transaction', () => ({
  withTransaction: jest.fn((prisma: any, cb: any) => cb(prisma)),
  runFinancialTx: jest.fn((prisma: any, cb: any) => cb(prisma)),
}));

// Mock tax-validation
jest.mock('@/lib/tax-validation', () => ({
  validateTaxRate: jest.fn().mockImplementation(() => Promise.resolve({ valid: true })),
}));

// Mock treasury-posting
jest.mock('@/lib/services/treasury-posting.service', () => ({
  TreasuryPostingService: {
    createTreasuryEntry: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
  },
}));

// Mock override-context
jest.mock('@/lib/governance/override-context', () => ({
  buildOverrideContextFromRequest: jest.fn().mockReturnValue(undefined),
}));

// Import prisma to manipulate mocks
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { POST, GET } from '../app/api/sales-returns/route';

describe('Sales Returns Enterprise Governance (Phase F-04C)', () => {
  const secureTenant = 'test-tenant';
  const prismaMock = getPrisma() as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserFromRequest as any).mockReturnValue({
      tenantId: secureTenant,
      userId: 42,
      role: 'admin',
      username: 'test-user',
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 42,
      role: 'admin',
      permissions: [],
    });
    prismaMock.financialPeriodModuleLock.findUnique.mockResolvedValue(null);
  });

  const buildValidBody = () => ({
    originalInvoiceId: 101,
    details: [
      { productId: 201, quantity: 2, unitPrice: 10.0, stockId: 1 },
    ],
    reason: 'Defective item return',
    taxRate: 0.15,
  });

  it('1. should REJECT client-controlled x-tenant-id header manipulation and use secure tenant', async () => {
    prismaMock.financialPeriod.findUnique.mockResolvedValue(null); // implicit open
    prismaMock.salesInvoice.findFirst.mockResolvedValue({ id: 101, tenantId: secureTenant });
    prismaMock.salesReturn.findFirst.mockResolvedValue(null); // returnNo base
    prismaMock.product.findFirst.mockResolvedValue({ id: 201, tenantId: secureTenant });
    prismaMock.salesReturn.create.mockResolvedValue({ id: 901 });

    const req = new NextRequest('http://localhost/api/sales-returns', {
      method: 'POST',
      body: JSON.stringify(buildValidBody()),
      headers: {
        'x-tenant-id': 'malicious-tenant-xyz', // header manipulation attempt
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify invoice search was forced inside the secure tenant, not the malicious header one
    expect(prismaMock.salesInvoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 101,
          tenantId: secureTenant, // secured!
        }),
      })
    );
  });

  it('2. should REJECT originalInvoiceId belonging to another tenant', async () => {
    // Mock original invoice lookup to return null (meaning not found within this tenant's boundary)
    prismaMock.financialPeriod.findUnique.mockResolvedValue(null);
    prismaMock.salesInvoice.findFirst.mockResolvedValue(null); // cross-tenant invoice

    const req = new NextRequest('http://localhost/api/sales-returns', {
      method: 'POST',
      body: JSON.stringify(buildValidBody()),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('الفاتورة الأصلية غير موجودة');
  });

  it('3. should REJECT productId belonging to another tenant', async () => {
    prismaMock.financialPeriod.findUnique.mockResolvedValue(null);
    prismaMock.salesInvoice.findFirst.mockResolvedValue({ id: 101, tenantId: secureTenant });
    prismaMock.salesReturn.findFirst.mockResolvedValue(null);
    prismaMock.product.findFirst.mockResolvedValue(null); // product not found in tenant boundary

    const req = new NextRequest('http://localhost/api/sales-returns', {
      method: 'POST',
      body: JSON.stringify(buildValidBody()),
    });

    const res = await POST(req);
    expect(res.status).toBe(500); // throws error inside transactional loop and gets caught by withRoute
    const data = await res.json();
    expect(data.error).toBe('Internal Server Error');
  });

  it('4. should REJECT sales return in a HARD_LOCKED period', async () => {
    // Mock period lock to return HARD_LOCKED
    prismaMock.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: secureTenant,
      period: '2026-05',
      status: FinancialPeriodStatus.HARD_LOCKED,
    });

    const req = new NextRequest('http://localhost/api/sales-returns', {
      method: 'POST',
      body: JSON.stringify({
        ...buildValidBody(),
        date: '2026-05-15',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.code).toBe('LOCKED');
  });

  it('5. should ACCEPT valid sales return in an OPEN period', async () => {
    prismaMock.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: secureTenant,
      period: '2026-05',
      status: FinancialPeriodStatus.OPEN,
    });
    prismaMock.salesInvoice.findFirst.mockResolvedValue({ id: 101, tenantId: secureTenant });
    prismaMock.salesReturn.findFirst.mockResolvedValue(null);
    prismaMock.product.findFirst.mockResolvedValue({ id: 201, tenantId: secureTenant });
    prismaMock.salesReturn.create.mockResolvedValue({ id: 901 });

    const req = new NextRequest('http://localhost/api/sales-returns', {
      method: 'POST',
      body: JSON.stringify({
        ...buildValidBody(),
        date: '2026-05-15',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.returnId).toBe(901);
  });

  it('6. should handle invalid page param (NaN) gracefully in GET API', async () => {
    prismaMock.salesReturn.findMany.mockResolvedValue([]);
    prismaMock.salesReturn.count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/sales-returns?page=abc&take=xyz');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(1);
    expect(data.returns).toEqual([]);
  });

  it('7. should handle negative page and take params gracefully in GET API', async () => {
    prismaMock.salesReturn.findMany.mockResolvedValue([]);
    prismaMock.salesReturn.count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/sales-returns?page=-5&take=-10');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(1);
    expect(data.returns).toEqual([]);
  });
});
