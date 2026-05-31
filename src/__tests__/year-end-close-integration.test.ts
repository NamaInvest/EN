import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

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

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any),
  },
}));

// Mock Auth logic
jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
}));

// Mock global prisma client
const mockPrismaClient: any = {
  fiscalPeriod: {
    findMany: jest.fn(),
  },
  journalEntry: {
    count: jest.fn(),
    create: jest.fn(() => Promise.resolve({ id: 888 })),
  },
  journalLine: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(() => Promise.resolve({ id: 'mock-audit-id' })),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrismaClient)),
};

jest.mock('@/lib/prisma', () => {
  return {
    __esModule: true,
    get default() { return mockPrismaClient; },
    get prisma() { return mockPrismaClient; },
    getPrisma: jest.fn().mockReturnValue(mockPrismaClient),
  };
});

// Import routing functions
const { GET: closeGET, POST: closePOST } = require('../app/api/accounting/year-end-close/route') as any;
import { getUserFromRequest } from '@/lib/auth';

describe('Year-End Close & Retained Earnings Rollover Integration Tests', () => {
  const tenantA = 'tenant-A';
  const tenantB = 'tenant-B';

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserFromRequest as any).mockReturnValue({
      tenantId: tenantA,
      userId: 99,
      role: 'MASTER_ADMIN',
    });
  });

  // 1. Validate year closing readiness
  it('1. Validate year readiness correctly reports blockers and warnings', async () => {
    // Mock 12 closed months
    mockPrismaClient.fiscalPeriod.findMany.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        tenantId: tenantA,
        year: 2026,
        month: i + 1,
        status: 'closed',
      }))
    );
    mockPrismaClient.journalEntry.count.mockResolvedValue(0); // 0 drafts

    const req = new NextRequest('http://localhost/api/accounting/year-end-close?fiscalYear=2026', {
      method: 'GET',
    });
    const res = await closeGET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.canClose).toBe(true);
    expect(data.blockers.length).toBe(0);
  });

  // 2. Blockers reporting if periods are not closed
  it('2. Blocks year-end close if some monthly periods are still open', async () => {
    // Only 10 months closed, 2 months open or missing
    mockPrismaClient.fiscalPeriod.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        tenantId: tenantA,
        year: 2026,
        month: i + 1,
        status: 'closed',
      }))
    );
    mockPrismaClient.journalEntry.count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/accounting/year-end-close?fiscalYear=2026', {
      method: 'GET',
    });
    const res = await closeGET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.canClose).toBe(false);
    expect(data.blockers[0]).toContain('يجب إغلاق كافة الفترات الشهرية الـ 12');
  });

  // 3. Post closing JEs successfully
  it('3. Generates and posts a balanced closing journal entry for income statement accounts', async () => {
    mockPrismaClient.fiscalPeriod.findMany.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        tenantId: tenantA,
        year: 2026,
        status: 'closed',
      }))
    );
    mockPrismaClient.journalEntry.count.mockResolvedValue(0);

    // Mock journal lines for revenue and expenses
    mockPrismaClient.journalLine.findMany.mockResolvedValue([
      {
        accountId: 10,
        debit: 0,
        credit: 5000.0, // Revenue 5000
        account: { code: '4001', name: 'Sales Revenue' },
      },
      {
        accountId: 20,
        debit: 3500.0, // Expense 3500
        credit: 0,
        account: { code: '5001', name: 'Rent Expense' },
      },
    ]);

    const req = new NextRequest('http://localhost/api/accounting/year-end-close', {
      method: 'POST',
      body: JSON.stringify({
        fiscalYear: '2026',
        retainedEarningsAccountId: 30,
        action: 'POST_CLOSING_JE',
      }),
    });

    const res = await closePOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.netIncome).toBe('1500'); // 5000 - 3500
    expect(mockPrismaClient.journalEntry.create).toHaveBeenCalled();
  });

  // 4. Balances rollover successfully
  it('4. Rollover balances creates opening balances for the new fiscal year', async () => {
    // Balance sheet lines (Asset 1000, Liability 400)
    mockPrismaClient.journalLine.findMany.mockResolvedValue([
      {
        accountId: 100,
        debit: 1000.0,
        credit: 0,
        account: { code: '1001', name: 'Cash' },
      },
      {
        accountId: 200,
        debit: 0,
        credit: 400.0,
        account: { code: '2001', name: 'Accounts Payable' },
      },
    ]);

    const req = new NextRequest('http://localhost/api/accounting/year-end-close', {
      method: 'POST',
      body: JSON.stringify({
        fiscalYear: '2026',
        action: 'ROLLOVER_BALANCES',
      }),
    });

    const res = await closePOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.openingBalancesCount).toBe(2);
  });
});
