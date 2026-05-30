import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
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
      error: jest.fn((...args: any[]) => console.error('LOGGED POS ERROR:', ...args)),
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
}));

// Mock auto-journal
jest.mock('@/lib/auto-journal', () => ({
  postSalesInvoice: jest.fn().mockImplementation(() => Promise.resolve({ success: true, entryId: 99 })),
  postSalesPayment: jest.fn().mockImplementation(() => Promise.resolve({ success: true, entryId: 100 })),
  reverseJournalByReference: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
}));

// Mock global prisma client
const mockPrismaClient: any = {
  user: {
    findUnique: jest.fn(() => Promise.resolve({
      id: 42,
      role: 'admin',
      permissions: [] as any[],
    })),
  },
  salesInvoice: {
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
    })),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  salesInvoiceDetail: {
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
  },
  zATCARecord: {
    create: jest.fn(),
  },
  treasury: {
    deleteMany: jest.fn(),
  },
  journalEntry: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => {
  const store = {
    run: (tenant: string, cb: () => any) => cb(),
  };

  return {
    default: mockPrismaClient,
    prisma: mockPrismaClient,
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
          operationType: 'COLLECT_SALES_PAYMENT',
          module: 'sales',
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
import { PUT as salesPUT, DELETE as salesDELETE } from '../app/api/sales/route';
import { POST as posPOST } from '../app/api/pos/route';
import { getUserFromRequest } from '@/lib/auth';

describe('Sales / AR & POS Module Period Lock Integration Tests (GL-02D2A)', () => {
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

  // 1. Sales module OPEN allows financial write.
  it('1. Sales module OPEN allows payment write and single delete', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: '2026-05',
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue(null); // defaults to OPEN
    mockPrismaClient.salesInvoice.findUnique.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      remaining: 50.0,
      paid: 0.0,
      total: 50.0,
      status: 'pending',
      date: new Date('2026-05-10'),
      details: [],
      stockId: 1
    });
    mockPrismaClient.salesInvoice.update.mockResolvedValue({ id: 101 });

    const reqPUT = new NextRequest('http://localhost/api/sales', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-1',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 42,
      }),
    });

    const resPUT = await salesPUT(reqPUT);
    expect(resPUT.status).toBe(200);

    const reqDELETE = new NextRequest('http://localhost/api/sales?id=101', {
      method: 'DELETE',
      headers: { 'x-tenant': tenantA },
    });
    mockPrismaClient.journalEntry.findMany.mockResolvedValue([]);

    const resDELETE = await salesDELETE(reqDELETE);
    expect(resDELETE.status).toBe(200);
  });

  // 2. Sales module SOFT_LOCKED blocks normal user.
  it('2. Sales module SOFT_LOCKED blocks normal user from collecting payment', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7), // current period
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 10,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      module: 'sales',
      status: FinancialPeriodStatus.SOFT_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 77,
      role: 'USER',
      username: 'normal-user',
    });

    const reqPUT = new NextRequest('http://localhost/api/sales', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-2',
      },
      body: JSON.stringify({
        invoiceId: 101,
        amount: 20.0,
        paymentType: 'cash',
        userId: 77,
      }),
    });

    const resPUT = await salesPUT(reqPUT);
    expect(resPUT.status).toBe(422); // SOFT_LOCK rejection requires override
    const data = await resPUT.json();
    expect(data.code).toBe('MASTER_OVERRIDE_REQUIRED');
  });

  // 3. Sales module SOFT_LOCKED allows valid override.
  it('3. Sales module SOFT_LOCKED allows payment with valid override context', async () => {
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
      module: 'sales',
      status: FinancialPeriodStatus.SOFT_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'MASTER_ADMIN',
      username: 'cfo-user',
    });
    mockPrismaClient.salesInvoice.findUnique.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      remaining: 50.0,
      paid: 0.0,
      total: 50.0,
      status: 'pending',
    });
    mockPrismaClient.salesInvoice.update.mockResolvedValue({ id: 101 });

    const reqPUT = new NextRequest('http://localhost/api/sales', {
      method: 'PUT',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'idem-key-3',
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

    const resPUT = await salesPUT(reqPUT);
    expect(resPUT.status).toBe(200);
  });

  // 4. Sales module HARD_LOCKED blocks everyone.
  it('4. Sales module HARD_LOCKED blocks everyone from deleting an invoice', async () => {
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
      module: 'sales',
      status: FinancialPeriodStatus.HARD_LOCKED,
    });
    mockPrismaClient.salesInvoice.findUnique.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      status: 'pending',
      date: invoiceDate,
    });

    const reqDELETE = new NextRequest('http://localhost/api/sales?id=101', {
      method: 'DELETE',
      headers: {
        'x-tenant': tenantA,
        'X-Soft-Lock-Override-Reason': 'Emergency correction for auditing requirements',
        'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
      },
    });

    const resDELETE = await salesDELETE(reqDELETE);
    expect(resDELETE.status).toBe(409); // HARD_LOCKED absolutely blocks
    const data = await resDELETE.json();
    expect(data.code).toBe('LOCKED');
  });

  // 5. Global HARD_LOCKED dominates sales module OPEN.
  it('5. Global HARD_LOCKED dominates sales module OPEN', async () => {
    const invoiceDate = new Date('2026-04-10');
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: '2026-04',
      status: FinancialPeriodStatus.HARD_LOCKED,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 11,
      tenantId: tenantA,
      period: '2026-04',
      module: 'sales',
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.salesInvoice.findUnique.mockResolvedValue({
      id: 101,
      tenantId: tenantA,
      invoiceNo: 202,
      status: 'pending',
      date: invoiceDate,
    });

    const reqDELETE = new NextRequest('http://localhost/api/sales?id=101', {
      method: 'DELETE',
      headers: { 'x-tenant': tenantA },
    });

    const resDELETE = await salesDELETE(reqDELETE);
    expect(resDELETE.status).toBe(409);
  });

  // 6. POS module OPEN allows checkout/posting.
  it('6. POS module OPEN allows checkout', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue(null);
    mockPrismaClient.salesInvoice.create.mockResolvedValue({
      id: 999,
      invoiceNo: 12345,
      date: new Date(),
      subtotal: 10.0,
      taxValue: 1.5,
      total: 11.5,
      paymentType: 'cash',
      userId: 42,
    });
    mockPrismaClient.setting.findMany.mockResolvedValue([]);

    const reqPOS = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'pos-idem-1',
      },
      body: JSON.stringify({
        customerId: 1,
        stockId: 1,
        paymentType: 'cash',
        details: [
          { productId: 10, productName: 'Apple', quantity: 2, price: 5.0, total: 10.0, taxValue: 1.5 },
        ],
      }),
    });

    const resPOS = await posPOST(reqPOS);
    expect(resPOS.status).toBe(201);
  });

  // 7. POS module SOFT_LOCKED blocks normal user.
  it('7. POS module SOFT_LOCKED blocks normal user', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 12,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      module: 'pos',
      status: FinancialPeriodStatus.SOFT_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 77,
      role: 'USER',
      username: 'normal-user',
    });

    const reqPOS = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'pos-idem-2',
      },
      body: JSON.stringify({
        customerId: 1,
        stockId: 1,
        paymentType: 'cash',
        details: [
          { productId: 10, productName: 'Apple', quantity: 2, price: 5.0, total: 10.0, taxValue: 1.5 },
        ],
      }),
    });

    const resPOS = await posPOST(reqPOS);
    expect(resPOS.status).toBe(422);
    const data = await resPOS.json();
    expect(data.error).toContain('الفترة المحاسبية');
  });

  // 8. POS module SOFT_LOCKED allows valid override if supported.
  it('8. POS module SOFT_LOCKED allows valid override', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 12,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      module: 'pos',
      status: FinancialPeriodStatus.SOFT_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'SUPER_ADMIN',
      username: 'admin-user',
    });
    mockPrismaClient.salesInvoice.create.mockResolvedValue({
      id: 999,
      invoiceNo: 12345,
      date: new Date(),
      subtotal: 10.0,
      taxValue: 1.5,
      total: 11.5,
      paymentType: 'cash',
      userId: 42,
    });

    const reqPOS = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'pos-idem-3',
        'X-Soft-Lock-Override-Reason': 'Emergency correction for auditing requirements',
        'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
      },
      body: JSON.stringify({
        customerId: 1,
        stockId: 1,
        paymentType: 'cash',
        details: [
          { productId: 10, productName: 'Apple', quantity: 2, price: 5.0, total: 10.0, taxValue: 1.5 },
        ],
      }),
    });

    const resPOS = await posPOST(reqPOS);
    expect(resPOS.status).toBe(201);
  });

  // 9. POS module HARD_LOCKED blocks everyone.
  it('9. POS module HARD_LOCKED blocks everyone', async () => {
    mockPrismaClient.financialPeriod.findUnique.mockResolvedValue({
      id: 1,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      status: FinancialPeriodStatus.OPEN,
    });
    mockPrismaClient.financialPeriodModuleLock.findUnique.mockResolvedValue({
      id: 12,
      tenantId: tenantA,
      period: new Date().toISOString().slice(0, 7),
      module: 'pos',
      status: FinancialPeriodStatus.HARD_LOCKED,
    });
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'SUPER_ADMIN',
      username: 'admin-user',
    });

    const reqPOS = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'pos-idem-4',
        'X-Soft-Lock-Override-Reason': 'Emergency correction for auditing requirements',
        'X-Soft-Lock-Confirmation': 'CONFIRM-SOFT-LOCK-OVERRIDE',
      },
      body: JSON.stringify({
        customerId: 1,
        stockId: 1,
        paymentType: 'cash',
        details: [
          { productId: 10, productName: 'Apple', quantity: 2, price: 5.0, total: 10.0, taxValue: 1.5 },
        ],
      }),
    });

    const resPOS = await posPOST(reqPOS);
    expect(resPOS.status).toBe(409);
  });

  // 10. Tenant isolation: lock from tenant A does not block tenant B.
  it('10. Tenant isolation works: locked period on tenant A does not block tenant B', async () => {
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

    // Call POS POST for Tenant A -> blocks
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 42,
      role: 'SUPER_ADMIN',
    });

    const reqPOS_A = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'x-tenant': tenantA,
        'x-idempotency-key': 'pos-idem-A',
      },
      body: JSON.stringify({
        customerId: 1,
        stockId: 1,
        paymentType: 'cash',
        details: [
          { productId: 10, productName: 'Apple', quantity: 2, price: 5.0, total: 10.0, taxValue: 1.5 },
        ],
      }),
    });

    const resPOS_A = await posPOST(reqPOS_A);
    expect(resPOS_A.status).toBe(409);

    // Call POS POST for Tenant B -> allows
    (require('@/lib/tenant/tenant-guard').requireTenantId as any).mockReturnValue(tenantB);
    (require('@/lib/prisma').resolveTenant as any).mockReturnValue(tenantB);

    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantB,
      userId: 42,
      role: 'SUPER_ADMIN',
    });

    const reqPOS_B = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'x-tenant': tenantB,
        'x-idempotency-key': 'pos-idem-B',
      },
      body: JSON.stringify({
        customerId: 1,
        stockId: 1,
        paymentType: 'cash',
        details: [
          { productId: 10, productName: 'Apple', quantity: 2, price: 5.0, total: 10.0, taxValue: 1.5 },
        ],
      }),
    });

    const resPOS_B = await posPOST(reqPOS_B);
    expect(resPOS_B.status).toBe(201);
  });
});
