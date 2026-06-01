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

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn((...args: any[]) => console.error('LOGGED PURCHASES ERROR:', ...args)),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any),
  },
}));

// Mock Auth logic
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
  hasPermission: jest.fn().mockImplementation(() => Promise.resolve(true)),
}));

// Mock idempotency
jest.mock('@/lib/idempotency', () => ({
  lockIdempotencyKey: jest.fn().mockImplementation(() => Promise.resolve(true)),
  completeIdempotencyKey: jest.fn().mockImplementation(() => Promise.resolve(true)),
  unlockIdempotencyKey: jest.fn().mockImplementation(() => Promise.resolve(true)),
  withIdempotency: jest.fn((req: any, key: string, cb: any) => cb()),
}));

// Mock auto-journal
jest.mock('@/lib/auto-journal', () => ({
  postPurchaseInvoice: jest.fn().mockImplementation(() => Promise.resolve({ success: true, entryId: 99 })),
  postPurchasePayment: jest.fn().mockImplementation(() => Promise.resolve({ success: true, entryId: 100 })),
  reverseJournalByReference: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
  postGRN: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
}));

// Mock global prisma client
const mockPrismaClient: any = {
  user: {
    findUnique: jest.fn(() => Promise.resolve({
      id: 42,
      role: 'admin',
      permissions: [] as any[],
    })),
    findFirst: jest.fn(),
  },
  purchaseInvoice: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(() => Promise.resolve({
      id: 999,
      invoiceNo: 12345,
      date: new Date(),
      subtotal: 10.0,
      taxValue: 1.5,
      total: 11.5,
      paymentType: 'cash',
      userId: 42,
      branchId: 1,
      stockId: 1,
      paid: 11.5,
      remaining: 0,
      status: 'completed',
    })),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  purchaseInvoiceDetail: {
    create: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  productStock: {
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
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
  fiscalPeriod: {
    findUnique: jest.fn(),
  },
  setting: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn().mockImplementation(() => Promise.resolve({ value: 'true' })),
  },
  treasury: {
    deleteMany: jest.fn(),
  },
  journalEntry: {
    findMany: jest.fn(),
  },
  threeWayMatch: {
    create: jest.fn(),
  },
  stock: {
    findUnique: jest.fn().mockImplementation(() => Promise.resolve({ id: 1, branchId: 1 })),
  },
  $queryRawUnsafe: jest.fn().mockImplementation(() => Promise.resolve([{
    id: 1,
    code: 'PI',
    prefix: 'PI-',
    nextValue: 12345,
    digits: 5,
    current: 12345,
    formatted: 'PI-12345',
  }])),
  $executeRawUnsafe: jest.fn().mockImplementation(() => Promise.resolve(1)),
};

jest.mock('@/lib/prisma', () => {
  const store = {
    run: (tenant: string, cb: () => any) => cb(),
  };

  return {
    __esModule: true,
    get default() { return mockPrismaClient; },
    get prisma() { return mockPrismaClient; },
    getPrisma: jest.fn().mockReturnValue(mockPrismaClient),
    resolveTenant: jest.fn().mockReturnValue('tenant-A'),
    resolveTenantContext: jest.fn().mockReturnValue({
      tenantSlug: 'tenant-A',
      tenantId: 'tenant-A',
      mode: 'request',
    }),
    currentRequestStore: store,
  };
});

// Mock tenant-guard
jest.mock('@/lib/governance/tenant-guard', () => ({
  assertTenantContextMatch: jest.fn(),
  TENANT_ISOLATION_ERROR: 'Tenant isolation violation',
  requireTenantId: jest.fn().mockReturnValue('tenant-A'),
}));

jest.mock('@/lib/tenant/tenant-guard', () => ({
  requireTenantId: jest.fn().mockReturnValue('tenant-A'),
}));

// Mock transaction
jest.mock('@/lib/db/transaction', () => ({
  withTransaction: jest.fn((prisma: any, cb: any) => cb(prisma?.default || prisma)),
  runFinancialTx: jest.fn((prisma: any, cb: any) => cb(prisma?.default || prisma)),
}));

// Mock override-context
jest.mock('@/lib/governance/override-context', () => {
  return {
    buildOverrideContextFromRequest: jest.fn().mockImplementation((req: any, context: any) => {
      const reason = req.headers.get('X-Soft-Lock-Override-Reason');
      const confirmationCode = req.headers.get('X-Soft-Lock-Confirmation');
      if (reason && confirmationCode) {
        return {
          tenantId: context.tenantId,
          actorId: context.actorId,
          actorRole: context.actorRole,
          reason,
          confirmationCode,
          operationType: 'COLLECT_PURCHASE_PAYMENT',
          module: 'purchases',
          postingDate: new Date(),
          requestId: 'test-req-id',
        };
      }
      return undefined;
    }),
  };
});

// Mock treasury-posting
jest.mock('@/lib/services/treasury-posting.service', () => ({
  TreasuryPostingService: {
    createTreasuryEntry: jest.fn().mockImplementation(() => Promise.resolve({ id: 123 })),
  },
}));

// Import routing functions and other utilities
const { POST: purchasesPOST, PUT: purchasesPUT, DELETE: purchasesDELETE } = require('../app/api/purchases/route') as any;
import { getUserFromRequest } from '@/lib/auth';

describe('Purchases / AP Module Period Lock Integration Tests (GL-02D2B)', () => {
  const tenantA = 'tenant-A';
  const tenantB = 'tenant-B';

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'MASTER_ADMIN',
      username: 'cfo-user',
    });
  });

  // 1. Purchases module OPEN allows financial write.
  it('1. Purchases module OPEN allows create, payment write, and single delete', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: '2026-05',
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue(null); // defaults to OPEN
    
    mockPrismaClient.purchaseInvoice.findFirst.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      remaining: 50.0,
      paid: 0.0,
      total: 50.0,
      status: 'pending',
      date: new Date('2026-05-10'),
      details: [],
      stockId: 1,
      branchId: 1
    });
    mockPrismaClient.purchaseInvoice.update.mockResolvedValue({ id: 101 });
    mockPrismaClient.setting.findFirst.mockResolvedValue({ value: 'false' });

    // A. POST (Create)
    const reqPOST = new NextRequest('http://localhost/api/purchases', {
      method: 'POST',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-post-1',
      },
      body: JSON.stringify({
        supplierId: 1,
        stockId: 1,
        items: [
          { productId: 10, productName: 'Screws', quantity: 100, price: 0.1, discountRate: 0 }
        ],
        userId: 42,
      }),
    });
    const resPOST = await purchasesPOST(reqPOST);
    expect(resPOST.status).toBe(201);

    // B. PUT (Payment Payout)
    const reqPUT = new NextRequest('http://localhost/api/purchases', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-put-1',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 42,
      }),
    });
    const resPUT = await purchasesPUT(reqPUT);
    expect(resPUT.status).toBe(200);

    // C. DELETE (Single deletion)
    const reqDELETE = new NextRequest('http://localhost/api/purchases?id=101', {
      method: 'DELETE',
      headers: { 'x-tenant': tenantA },
    });
    mockPrismaClient.journalEntry.findMany.mockResolvedValue([]);

    const resDELETE = await purchasesDELETE(reqDELETE);
    expect(resDELETE.status).toBe(200);
  });

  // 2. Purchases module SOFT_LOCKED blocks normal user.
  it('2. Purchases module SOFT_LOCKED blocks normal user from paying supplier', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 10,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      module: 'purchases',
      status: FinancialPeriodStatus.SOFT_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 77,
      role: 'USER',
      username: 'normal-user',
    });

    const reqPUT = new NextRequest('http://localhost/api/purchases', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-put-2',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 77,
      }),
    });

    const resPUT = await purchasesPUT(reqPUT);
    expect(resPUT.status).toBe(422); // SOFT_LOCK rejection requires override
    const data = await resPUT.json();
    expect(data.code).toBe('MASTER_OVERRIDE_REQUIRED');
  });

  // 3. Purchases module SOFT_LOCKED allows valid override.
  it('3. Purchases module SOFT_LOCKED allows payment with valid override context', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 10,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      module: 'purchases',
      status: FinancialPeriodStatus.SOFT_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'MASTER_ADMIN',
      username: 'cfo-user',
    });
    mockPrismaClient.purchaseInvoice.findFirst.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      remaining: 50.0,
      paid: 0.0,
      total: 50.0,
      status: 'pending',
    });
    mockPrismaClient.purchaseInvoice.update.mockResolvedValue({ id: 101 });

    const reqPUT = new NextRequest('http://localhost/api/purchases', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-put-3',
        'X-Soft-Lock-Override-Reason': 'Emergency correction for auditing requirements',
        'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 42,
      }),
    });

    const resPUT = await purchasesPUT(reqPUT);
    expect(resPUT.status).toBe(200);
  });

  // 4. Purchases module HARD_LOCKED blocks everyone.
  it('4. Purchases module HARD_LOCKED blocks everyone from deleting a purchase invoice', async () => {
    const invoiceDate = new Date('2026-04-10');
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: '2026-04',
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 11,
      tenantId: tenantA,
      period: '2026-04',
      module: 'purchases',
      status: FinancialPeriodStatus.HARD_LOCKED,
    });
    mockPrismaClient.purchaseInvoice.findFirst.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      status: 'pending',
      date: invoiceDate,
    });

    const reqDELETE = new NextRequest('http://localhost/api/purchases?id=101', {
      method: 'DELETE',
      headers: {
        'x-tenant': tenantA,
        'X-Soft-Lock-Override-Reason': 'Emergency correction for auditing requirements',
        'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
      },
    });

    const resDELETE = await purchasesDELETE(reqDELETE);
    expect(resDELETE.status).toBe(409); // HARD_LOCKED absolutely blocks
    const data = await resDELETE.json();
    expect(data.code).toBe('LOCKED');
  });

  // 5. Tenant isolation: lock on tenant A does not block tenant B.
  it('5. Tenant isolation works: locked period on tenant A does not block tenant B', async () => {
    // For Tenant A: Period is HARD_LOCKED
    mockPrismaClient.financialPeriod.findUnique.mockImplementation(({ where }: any) => {
      if (where.tenantId_period.tenantId === tenantA) {
        return Promise.resolve({
          id: 1,
          tenantId: tenantA,
          period: '2026-05',
          status: FinancialPeriodStatus.HARD_LOCKED,
        });
      }
      // For Tenant B: Period is OPEN
      return Promise.resolve({
        id: 2,
        tenantId: tenantB,
        period: '2026-05',
        status: FinancialPeriodStatus.OPEN,
      });
    });

    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue(null);

    mockPrismaClient.purchaseInvoice.findFirst.mockImplementation(({ where }: any) => {
      const isTenantB = where.tenantId === tenantB;
      return Promise.resolve({
        id: 101,
        tenantId: isTenantB ? tenantB : tenantA,
        invoiceNo: 202,
        remaining: 50.0,
        paid: 0.0,
        total: 50.0,
        status: 'pending',
        date: new Date('2026-05-10'),
        stockId: 1,
        branchId: 1
      });
    });

    // Call Purchases PUT for Tenant A -> blocks
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'SUPER_ADMIN',
    });

    const reqPUT_A = new NextRequest('http://localhost/api/purchases', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'put-idem-A',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 42,
      }),
    });

    const resPUT_A = await purchasesPUT(reqPUT_A);
    expect(resPUT_A.status).toBe(409);

    // Call Purchases PUT for Tenant B -> allows
    (require('@/lib/governance/tenant-guard').requireTenantId as any).mockReturnValue(tenantB);
    (require('@/lib/prisma').resolveTenant as any).mockReturnValue(tenantB);

    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantB,
      userId: 42,
      role: 'SUPER_ADMIN',
    });

    const reqPUT_B = new NextRequest('http://localhost/api/purchases', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantB,
        'x-idempotency-key': 'put-idem-B',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 42,
      }),
    });

    const resPUT_B = await purchasesPUT(reqPUT_B);
    expect(resPUT_B.status).toBe(200);
  });
});
