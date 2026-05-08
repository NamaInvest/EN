/**
 * Test Factories & Utilities
 * ──────────────────────────────────────────────────────────
 * Reusable factories for creating test data in unit/integration tests.
 *
 * Usage:
 *   import { factory } from '@/tests/factories';
 *   const invoice = factory.salesInvoice({ total: 5000 });
 *   const employee = factory.employee({ name: 'أحمد' });
 */

let idCounter = 1000;
function nextId() { return ++idCounter; }

export const factory = {
  /** Generate a test sales invoice */
  salesInvoice(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      invoiceNo: id,
      date: new Date(),
      customerId: null,
      stockId: 1,
      subtotal: 1000,
      discountRate: 0,
      discountValue: 0,
      taxValue: 150,
      total: 1150,
      paid: 1150,
      remaining: 0,
      paymentType: 'cash',
      status: 'completed',
      userId: 1,
      tenantId: 'test-tenant',
      notes: null,
      ...overrides,
    };
  },

  /** Generate a test employee */
  employee(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      name: `موظف تجريبي ${id}`,
      employeeNo: `EMP-${id}`,
      phone: '0555555555',
      position: 'محاسب',
      salary: 8000,
      housingAllowance: 2000,
      transportAllowance: 500,
      otherAllowance: 0,
      active: true,
      department: 'المحاسبة',
      nationality: 'SAUDI',
      tenantId: 'test-tenant',
      createdAt: new Date(),
      ...overrides,
    };
  },

  /** Generate a test journal entry */
  journalEntry(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      date: new Date(),
      description: `قيد تجريبي ${id}`,
      reference: `TEST-${id}`,
      status: 'posted',
      totalDebit: 1000,
      totalCredit: 1000,
      userId: 1,
      tenantId: 'test-tenant',
      lines: [
        { accountCode: '1100', debit: 1000, credit: 0, description: 'نقدية' },
        { accountCode: '4100', debit: 0, credit: 1000, description: 'إيرادات' },
      ],
      ...overrides,
    };
  },

  /** Generate a test product */
  product(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      name: `منتج تجريبي ${id}`,
      barcode: `TEST${id}`,
      price: 100,
      cost: 60,
      stockQuantity: 50,
      category: 'عام',
      unit: 'قطعة',
      taxRate: 15,
      active: true,
      tenantId: 'test-tenant',
      ...overrides,
    };
  },

  /** Generate a test customer */
  customer(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      name: `عميل تجريبي ${id}`,
      phone: '0500000000',
      email: `test${id}@example.com`,
      vatNumber: null,
      balance: 0,
      creditLimit: 10000,
      tenantId: 'test-tenant',
      ...overrides,
    };
  },

  /** Generate a test salary record */
  salary(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      employeeId: overrides.employeeId || nextId(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: 8000,
      additions: 500,
      deductions: 780,
      gosiDeduction: 780,
      loanDeduction: 0,
      netSalary: 7720,
      paidDate: new Date(),
      tenantId: 'test-tenant',
      ...overrides,
    };
  },

  /** Generate a test user */
  user(overrides: Record<string, unknown> = {}) {
    const id = nextId();
    return {
      id,
      username: `testuser${id}`,
      name: `مستخدم تجريبي ${id}`,
      role: 'user',
      active: true,
      tenantId: 'test-tenant',
      ...overrides,
    };
  },

  /** Generate a batch of records */
  batch<T>(factoryFn: (overrides?: Record<string, unknown>) => T, count: number, overrides: Record<string, unknown> = {}): T[] {
    return Array.from({ length: count }, () => factoryFn(overrides));
  },
};

// ── Test Helpers ──

/** Mock Prisma response */
export function mockPrismaResponse<T>(data: T) {
  return { data, status: 200, ok: true };
}

/** Assert response is valid JSON */
export async function assertJsonResponse(response: Response, expectedStatus = 200) {
  expect(response.status).toBe(expectedStatus);
  const body = await response.json();
  expect(body).toBeDefined();
  return body;
}

/** Generate random Arabic text */
export function randomArabicText(words = 5): string {
  const pool = ['فاتورة', 'مبيعات', 'شراء', 'مخزون', 'حساب', 'قيد', 'راتب', 'موظف', 'عميل', 'مورد', 'تقرير', 'نقدي', 'آجل', 'ضريبة'];
  return Array.from({ length: words }, () => pool[Math.floor(Math.random() * pool.length)]).join(' ');
}

/** Reset ID counter (for test isolation) */
export function resetFactoryIds() { idCounter = 1000; }
