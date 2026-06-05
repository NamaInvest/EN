import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { n } from '@/lib/decimal-utils';

let mockUserInstance: any = null;
let mockUsersList: any[] = [];
let mockInvoicesList: any[] = [];
let mockPaymentsList: any[] = [];
let mockReturnsList: any[] = [];
let mockProductsList: any[] = [];
let mockSalesDetailsList: any[] = [];

// Mock Prisma and tenant isolation
vi.mock('@/lib/prisma', async (importOriginal) => {
  const actual: any = await importOriginal();
  const mockClient = {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => Promise.resolve({ id: where.id, role: 'admin', branchId: 1 })),
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve(mockUsersList.slice(skip, skip + take));
      }),
    },
    salesInvoice: {
      findMany: vi.fn().mockImplementation((args) => {
        if (args.take && args.skip !== undefined) {
          return Promise.resolve(mockInvoicesList.slice(args.skip, args.skip + args.take));
        }
        return Promise.resolve(mockInvoicesList);
      }),
      aggregate: vi.fn().mockResolvedValue({ _sum: { total: 0, taxValue: 0 } }),
    },
    purchaseInvoice: {
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve([]);
      }),
      aggregate: vi.fn().mockResolvedValue({ _sum: { total: 0 } }),
    },
    expense: {
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve([]);
      }),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    },
    treasury: {
      findMany: vi.fn().mockImplementation((args) => {
        if (args.take && args.skip !== undefined) {
          return Promise.resolve(mockPaymentsList.slice(args.skip, args.skip + args.take));
        }
        return Promise.resolve(mockPaymentsList);
      }),
    },
    salesReturn: {
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve(mockReturnsList.slice(skip, skip + take));
      }),
    },
    purchaseReturn: {
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve([]);
      }),
    },
    product: {
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve(mockProductsList.slice(skip, skip + take));
      }),
    },
    salesInvoiceDetail: {
      findMany: vi.fn().mockImplementation((args) => {
        return Promise.resolve(mockSalesDetailsList);
      }),
    },
    stock: {
      findMany: vi.fn().mockImplementation(() => Promise.resolve([{ id: 1, name: 'مخزن الدمام' }])),
    },
    customer: {
      findUnique: vi.fn().mockImplementation(({ where }) => Promise.resolve({ id: where.id, name: 'عميل تجريبي' })),
      findMany: vi.fn().mockImplementation((args) => {
        const skip = args.skip || 0;
        const take = args.take || 10;
        return Promise.resolve([]);
      }),
    },
  };
  return {
    ...actual,
    getPrisma: vi.fn().mockImplementation(() => mockClient),
    default: mockClient,
    prisma: mockClient,
  };
});

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getUserFromRequest: vi.fn().mockImplementation(() => mockUserInstance),
  };
});

describe('Report Pagination Wave P2-A Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInstance = { userId: 1, role: 'admin', tenantId: 'local' };
    
    // Seed mock data
    mockUsersList = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      fullName: `User ${i + 1}`,
      role: 'cashier',
      active: true
    }));

    mockInvoicesList = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      invoiceNo: `INV-${1000 + i}`,
      date: new Date(`2026-06-05T10:00:0${i}Z`),
      total: 100 + i * 10,
      taxValue: 15,
      status: 'completed',
      customerId: 1
    }));

    mockPaymentsList = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      date: new Date(`2026-06-05T11:00:0${i}Z`),
      amount: 50 + i * 5,
      description: `Payment ${i + 1}`,
      referenceType: 'CUSTOMER',
      referenceId: 1,
      type: 'in'
    }));

    mockReturnsList = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      returnNo: `RET-${2000 + i}`,
      date: new Date(`2026-06-05T12:00:0${i}Z`),
      total: 30,
      restockingFee: 5,
      customerId: 1,
      destinationStockId: 1,
      zatcaStatus: 'reported',
      details: []
    }));

    mockProductsList = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      currentStock: 50,
      buyPrice: 10,
      active: true
    }));

    mockSalesDetailsList = [
      { productId: 1, quantity: 5 },
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 10 },
    ];
  });

  it('paginates users-list correctly returning a plain Array', async () => {
    const { GET } = await import('@/app/api/reports/[type]/route');
    const req = new NextRequest('http://localhost/api/reports/users-list?page=2&limit=5');
    const res = await GET(req, { params: Promise.resolve({ type: 'users-list' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(5);
    expect(data[0].id).toBe(6);
  });

  it('paginates daily-report subqueries with limit/page parameters', async () => {
    const { GET } = await import('@/app/api/reports/[type]/route');
    const req = new NextRequest('http://localhost/api/reports/daily-report?page=1&limit=5');
    const res = await GET(req, { params: Promise.resolve({ type: 'daily-report' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sales.length).toBe(5);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
  });

  it('paginates least-selling products correctly with custom limits', async () => {
    const { GET } = await import('@/app/api/reports/[type]/route');
    const req = new NextRequest('http://localhost/api/reports/least-selling?page=1&limit=3');
    const res = await GET(req, { params: Promise.resolve({ type: 'least-selling' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.length).toBe(3);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(3);
    expect(data.pagination.hasMore).toBe(true);
  });

  it('paginates sales returns list correctly returning plain Array', async () => {
    const { GET } = await import('@/app/api/reports/returns/route');
    const req = new NextRequest('http://localhost/api/reports/returns?page=2&limit=4');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(4);
    expect(data[0].id).toBe(5);
  });

  it('calculates customer statement running balance mathematically correct before slicing pages', async () => {
    const { GET } = await import('@/app/api/reports/customer-statement/route');
    // Page 2, limit 5
    const req = new NextRequest('http://localhost/api/reports/customer-statement?customerId=1&page=2&limit=5');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    
    // Total combined transactions (15 invoices, 10 payments = 25 total)
    expect(data.pagination.total).toBe(25);
    expect(data.transactions.length).toBe(5);
    
    // Check that balances are calculated chronologically.
    const allSorted = [
      ...mockInvoicesList.map(inv => ({
        type: 'INVOICE',
        ref: 'INV-' + inv.invoiceNo,
        date: inv.date,
        debit: n(inv.total),
        credit: 0
      })),
      ...mockPaymentsList.map(pay => ({
        type: 'PAYMENT',
        ref: 'PAY-' + pay.id,
        date: pay.date,
        debit: 0,
        credit: n(pay.amount)
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Re-calculating expected running balances
    let balance = 0;
    const expectedBalances = allSorted.map(t => {
      balance += (n(t.debit) - n(t.credit));
      return balance;
    });

    // Check transaction balance matching for page 2 (skip = 5)
    for (let i = 0; i < 5; i++) {
      expect(data.transactions[i].balance).toBe(expectedBalances[5 + i]);
    }
  });
});
