import Module from 'module';

// 1. Mock auth user session
let activeUser = {
  id: 123,
  userId: 123,
  role: 'CFO',
  tenantId: 'tenant_mock_456',
  email: 'cfo@namainvist.com',
  username: 'cfo@namainvist.com',
};

// Intercept Node's require for dynamic CJS require('@/lib/auth') calls
const originalRequire = Module.prototype.require;
Module.prototype.require = function (this: any, id: string) {
  if (id === '@/lib/auth') {
    return {
      getUserFromRequest: () => activeUser,
      getAuthSession: async () => activeUser,
      requireAuth: async () => activeUser,
    };
  }
  return originalRequire.call(this, id);
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PeriodLockViolation } from '@/lib/governance/period-lock';

// 2. Mock Prisma client
const mockPrisma = {
  $transaction: vi.fn(async (cb) => cb(mockPrisma)),
  user: {
    findUnique: vi.fn(),
  },
  journalEntry: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  journalLine: {
    deleteMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  account: {
    findMany: vi.fn(async () => []),
  },
  approvalRule: {
    findMany: vi.fn(async () => []),
  }
};

vi.mock('@/lib/prisma', () => ({
  getPrisma: vi.fn(() => mockPrisma),
  resolveTenantContext: vi.fn(() => ({
    tenantSlug: 'tenant_mock_456',
    tenantId: 'tenant_mock_456',
    name: 'Mock Company',
    status: 'ACTIVE'
  })),
  currentRequestStore: {
    run: vi.fn((tenant, cb) => cb()),
  }
}));

// Mock static auth
vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn(() => activeUser),
  getAuthSession: vi.fn(async () => activeUser),
  requireAuth: vi.fn(async () => activeUser),
}));

// Mock auto-journal helpers
vi.mock('@/lib/auto-journal', () => ({
  createJournalEntry: vi.fn(async () => ({ success: true, entryId: 999 })),
  ACCOUNTS: {
    RECEIVABLES: '120101',
    PAYABLES: '210101',
    INVENTORY: '130101',
    WIP: '130201',
    FINISHED_GOODS: '130301',
    VAT_INPUT: '140101',
    VAT_OUTPUT: '240101',
  }
}));

// Mock governance overrides
vi.mock('@/lib/governance/override-context', () => ({
  buildOverrideContextFromRequest: vi.fn(() => ({})),
}));

// Mock Period Lock library
let mockPeriodLockError: Error | null = null;
vi.mock('@/lib/governance/period-lock', () => {
  class MockPeriodLockViolation extends Error {
    code = 'LOCKED';
    constructor(msg: string) {
      super(msg);
      this.name = 'PeriodLockViolation';
    }
  }
  return {
    PeriodLockViolation: MockPeriodLockViolation,
    assertPeriodWritable: vi.fn(async () => {
      if (mockPeriodLockError) {
        throw mockPeriodLockError;
      }
      return true;
    }),
  };
});

// Import target routes under test
import { POST as createJournal } from '@/app/api/accounting/journal/route';
import { PUT as updateJournal } from '@/app/api/accounting/journal/[id]/route';

describe('Accounting Governance API Contracts (SCN-FIN-001, SCN-FIN-002, SCN-FIN-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPeriodLockError = null;
    activeUser = {
      id: 123,
      userId: 123,
      role: 'CFO',
      tenantId: 'tenant_mock_456',
      email: 'cfo@namainvist.com',
      username: 'cfo@namainvist.com',
    };
  });

  // 1. SCN-FIN-001: Unbalanced Journal Entry Prevention
  it('should block creation of an unbalanced journal entry with 400 Bad Request', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: []
    });

    const req = new NextRequest('http://localhost/api/accounting/journal', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        description: 'Unbalanced Journal',
        date: '2026-06-07',
        lines: [
          { accountCode: '110101', debit: 1000, credit: 0 },
          { accountCode: '110102', debit: 0, credit: 990 } // diff 10 SAR
        ]
      })
    });

    const response = await createJournal(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('القيد غير متوازن');
  });

  // 2. SCN-FIN-002: Posted Record Immutability Verification
  it('should deny updates to posted journal entries with 500 error', async () => {
    // Return a posted journal entry
    mockPrisma.journalEntry.findFirst.mockResolvedValue({
      id: 777,
      status: 'posted',
      entryDate: '2026-06-07',
      tenantId: 'tenant_mock_456'
    });

    const req = new NextRequest('http://localhost/api/accounting/journal/777', {
      method: 'PUT',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        description: 'Attempt to update posted journal',
        lines: [
          { accountId: 1, debit: 500, credit: 0 },
          { accountId: 2, debit: 0, credit: 500 }
        ]
      })
    });

    const context = { params: Promise.resolve({ id: '777' }) };
    const response = await updateJournal(req, context);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('لا يمكن تعديل');
  });

  // 3. SCN-FIN-003: Closed Period Verification
  it('should block manual journal entries posted inside a locked/closed fiscal period with 409 status', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 123,
      role: 'CFO',
      permissions: []
    });

    // Set mock to throw PeriodLockViolation
    mockPeriodLockError = new PeriodLockViolation('الفترة المحاسبية مغلقة ولا يمكن تعديلها أو الحفظ فيها.', 'LOCKED');

    const req = new NextRequest('http://localhost/api/accounting/journal', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'tenant_mock_456',
        'x-tenant': 'tenant_mock_456',
      },
      body: JSON.stringify({
        description: 'Journal in Closed Period',
        date: '2026-01-15', // Closed period
        lines: [
          { accountCode: '110101', debit: 500, credit: 0 },
          { accountCode: '110102', debit: 0, credit: 500 }
        ]
      })
    });

    const response = await createJournal(req);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('LOCKED');
    expect(body.error).toContain('الفترة المحاسبية مغلقة');
  });
});
