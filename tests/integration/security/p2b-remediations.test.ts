import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// متغير لتخزين المستخدم المصادق عليه افتراضياً في الاختبارات
let mockUserInstance: any = null;
let mockActiveSession: any = null;

// محاكاة قاعدة بيانات Prisma وعمليات عزل المستأجرين
vi.mock('@/lib/prisma', async (importOriginal) => {
  const actual: any = await importOriginal();
  const mockClient = {
    posSession: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        // التحقق من وجود الجلسة ومطابقتها للمستخدم الحالي والمستأجر
        if (mockActiveSession && where.userId === mockActiveSession.userId && where.tenantId === mockActiveSession.tenantId) {
          return Promise.resolve(mockActiveSession);
        }
        return Promise.resolve(null);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (mockActiveSession && where.id === mockActiveSession.id) {
          return Promise.resolve(mockActiveSession);
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 1, ...args.data })),
      update: vi.fn().mockImplementation((args) => Promise.resolve({ id: mockActiveSession?.id || 1, ...args.data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    posSessionMovement: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 101, ...args.data })),
    },
    salesInvoice: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 1001, date: new Date(), ...args.data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    salesInvoiceDetail: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 5001, ...args.data })),
    },
    product: {
      findFirst: vi.fn().mockResolvedValue({ id: 1, name: 'Sugar', buyPrice: 5 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    customer: {
      findFirst: vi.fn().mockResolvedValue({ id: 1, name: 'General Customer', active: true, balance: 0, creditLimit: 1000 }),
    },
    setting: {
      findMany: vi.fn().mockResolvedValue([
        { key: 'company_name', value: 'Nama Soft' },
        { key: 'tax_number', value: '123456789012345' }
      ]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.key === 'ALLOWED_TAX_RATES') {
          return Promise.resolve({ key: 'ALLOWED_TAX_RATES', value: '0,15' });
        }
        if (where.key === 'loyalty_earn_rate') {
          return Promise.resolve({ key: 'loyalty_earn_rate', value: '10' });
        }
        return Promise.resolve(null);
      }),
    },
    paymentTransaction: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    },
    journalEntry: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 201, ...args.data })),
    },
    journalLine: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 301, ...args.data })),
    },
  };
  return {
    ...actual,
    getPrisma: vi.fn().mockImplementation(() => mockClient),
    default: mockClient,
    prisma: mockClient,
  };
});

// محاكاة سياق المصادقة لاستخراج المستخدم المسجل
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getUserFromRequest: vi.fn().mockImplementation(() => mockUserInstance),
  };
});

// محاكاة نظام الترقيم المتسلسل لتفادي الأخطاء في الاستعلامات المباشرة لتسلسل الفحوص
vi.mock('@/lib/numbering', () => {
  return {
    getNextNumber: vi.fn().mockResolvedValue({ current: 100, formatted: 'INV-100' })
  };
});

// محاكاة نظام المعاملات والعمليات لتجنب كسر تسلسل Prisma المفتعل
vi.mock('@/lib/db/transaction', () => {
  return {
    runFinancialTx: vi.fn().mockImplementation((prisma, cb) => cb(prisma)),
    withTransaction: vi.fn().mockImplementation((prisma, cb) => cb(prisma)),
  };
});

// محاكاة asserts الفترة المحاسبية لتفادي قفل الأيام التاريخية
vi.mock('@/lib/governance/period-lock', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    assertPeriodWritable: vi.fn().mockResolvedValue('ALLOWED'),
  };
});

describe('Wave P2-B: POS Session Governance Integration Tests', () => {
  let originalDesktopMode: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInstance = null;
    mockActiveSession = null;
    originalDesktopMode = process.env.DESKTOP_MODE;
    process.env.DESKTOP_MODE = 'false';
  });

  afterEach(() => {
    process.env.DESKTOP_MODE = originalDesktopMode;
  });

  // ── 1. Enforcing Active Opened Session check on Checkout ───────────────────
  describe('Quick POS Checkout & General POS API session validation checks', () => {
    it('Quick POS Checkout rejects checkout when no POS session is active', async () => {
      const { POST } = await import('@/app/api/pos/checkout/route');
      mockUserInstance = { id: 10, userId: 10, role: 'cashier', tenantId: 'tenant-1' };
      mockActiveSession = null; // لا توجد وردية صندوق مفتوحة

      const req = new NextRequest('http://localhost/api/pos/checkout', {
        method: 'POST',
        headers: { 'x-tenant': 'tenant-1' },
        body: JSON.stringify({
          cart: [{ id: '1', name: 'Sugar', price: 10, qty: 2, taxRate: 15 }],
          total: 20,
          tax: 3,
          discount: 0,
          paymentMethod: 'cash'
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(400); // 400 Bad Request
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('NO_ACTIVE_POS_SESSION');
      expect(data.error).toContain('لا توجد وردية صندوق كاشير نشطة ومفتوحة حالياً');
    });

    it('Quick POS Checkout succeeds when there is an active opened POS session', async () => {
      const { POST } = await import('@/app/api/pos/checkout/route');
      mockUserInstance = { id: 10, userId: 10, role: 'cashier', tenantId: 'tenant-1' };
      mockActiveSession = { id: 1, userId: 10, terminalId: 5, status: 'OPEN', tenantId: 'tenant-1' };

      const req = new NextRequest('http://localhost/api/pos/checkout', {
        method: 'POST',
        headers: { 'x-tenant': 'tenant-1' },
        body: JSON.stringify({
          cart: [{ id: '1', name: 'Sugar', price: 10, qty: 2, taxRate: 15 }],
          total: 20,
          tax: 3,
          discount: 0,
          paymentMethod: 'cash'
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(200); // Successfully checked out!
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.invoice).toBeDefined();
    });

    it('General POS API route rejects checkout when no session is active', async () => {
      const { POST } = await import('@/app/api/pos/route');
      mockUserInstance = { id: 10, userId: 10, role: 'cashier', tenantId: 'tenant-1' };
      mockActiveSession = null;

      const req = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        headers: { 
          'x-tenant': 'tenant-1',
          'x-idempotency-key': 'uniq-idemp-1'
        },
        body: JSON.stringify({
          details: [{ productId: '1', productName: 'Sugar', price: 10, quantity: 2, taxRate: 15, total: 20, taxValue: 3 }],
          paymentType: 'cash'
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('NO_ACTIVE_POS_SESSION');
    });
  });

  // ── 2. Tenant Isolation Enforcement for Session management APIs ───────────
  describe('Open, Close, and Movement session APIs Tenant Isolation', () => {
    it('open session API checks that cashier management belongs to their own tenant', async () => {
      const { POST } = await import('@/app/api/pos/sessions/open/route');
      mockUserInstance = { id: 10, userId: 10, role: 'cashier', tenantId: 'tenant-1' };

      // محاولة فتح جلسة لمستخدم مستأجر آخر بدون تفويض إداري
      const req = new NextRequest('http://localhost/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'x-tenant': 'tenant-1' },
        body: JSON.stringify({
          userId: 99, // مستخدم آخر
          terminalId: 5,
          openingFloat: 100
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(403); // Forbidden
      const data = await res.json();
      expect(data.error).toContain('غير مصرح بفتح جلسة لمستخدم آخر');
    });

    it('close session API validates session existence within tenant context', async () => {
      const { POST } = await import('@/app/api/pos/sessions/close/route');
      mockUserInstance = { id: 10, userId: 10, role: 'cashier', tenantId: 'tenant-1' };
      // الجلسة تنتمي لمستأجر آخر (tenant-2)
      mockActiveSession = { id: 50, userId: 10, status: 'OPEN', tenantId: 'tenant-2' };

      const req = new NextRequest('http://localhost/api/pos/sessions/close', {
        method: 'POST',
        headers: { 'x-tenant': 'tenant-1' }, // طلب المستأجر الأول
        body: JSON.stringify({
          sessionId: 50,
          actualClosingCash: 120
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(404); // Not Found (Session is isolated under tenant-2)
      const data = await res.json();
      expect(data.error).toContain('لم يتم العثور على الجلسة المطلوبة');
    });
  });
});
