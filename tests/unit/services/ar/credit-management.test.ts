/**
 * Unit Tests — Credit Management Service (AR 21.1)
 * Vitest-based unit tests for the credit scoring and aging algorithms.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock BaseService dependencies ────────────────────────────────────────────
vi.mock('@/services/shared/event-bus.service', () => ({
  eventBus: { afterCommit: vi.fn() },
  BusinessContext: {},
}));

// Import after mocks
import { CreditManagementService } from '@/services/ar/credit-management.service';

// ─── Test Fixtures ────────────────────────────────────────────────────────────
const mockCtx = {
  tenant: { id: 'tenant-001' },
  user:   { id: 'user-001' },
  requirePermission: vi.fn(),
  fiscal: { isClosed: false },
} as any;

const buildPrisma = (overrides: any = {}) => ({
  customer: {
    findFirstOrThrow: vi.fn().mockResolvedValue({
      id: 'cust-001', name: 'شركة التجارة', creditLimit: 50000, tenantId: 'tenant-001',
      ...overrides.customer,
    }),
    findFirst: vi.fn().mockResolvedValue({
      id: 'cust-001', creditLimit: 50000,
      ...overrides.customer,
    }),
  },
  salesInvoice: {
    findMany: vi.fn().mockResolvedValue(overrides.invoices ?? []),
    aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
  },
  $transaction: vi.fn(),
  ...overrides.prisma,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreditManagementService — checkCreditLimit', () => {
  it('approves when exposure + amount ≤ credit limit', async () => {
    const prisma = buildPrisma({
      invoices: [{ totalAmount: 20000, paidAmount: 0 }], // 20k outstanding
    });
    const svc = new CreditManagementService(prisma as any, mockCtx);

    const result = await svc.checkCreditLimit('cust-001', 10000); // 20k + 10k = 30k ≤ 50k

    expect(result.approved).toBe(true);
    expect(result.currentExposure).toBe(20000);
    expect(result.availableCredit).toBe(30000);
  });

  it('rejects when exposure + amount > credit limit', async () => {
    const prisma = buildPrisma({
      invoices: [{ totalAmount: 45000, paidAmount: 0 }], // 45k outstanding
    });
    const svc = new CreditManagementService(prisma as any, mockCtx);

    const result = await svc.checkCreditLimit('cust-001', 10000); // 45k + 10k = 55k > 50k

    expect(result.approved).toBe(false);
    expect(result.availableCredit).toBe(5000);
  });

  it('approves with no credit limit set (unlimited)', async () => {
    const prisma = buildPrisma({
      customer: { creditLimit: 0 },
      invoices: [],
    });
    const svc = new CreditManagementService(prisma as any, mockCtx);

    const result = await svc.checkCreditLimit('cust-001', 999999);

    expect(result.approved).toBe(true);
    expect(result.reason).toContain('لا يوجد حد ائتماني');
  });
});

describe('CreditManagementService — generateAgingReport', () => {
  it('groups invoices into correct aging buckets', async () => {
    const today = new Date();
    const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

    const prisma = {
      ...buildPrisma(),
      salesInvoice: {
        findMany: vi.fn().mockResolvedValue([
          // 0-30 days: 15 days ago
          { customerId: 'c1', totalAmount: 1000, paidAmount: 0, dueDate: daysAgo(15), customer: { id: 'c1', name: 'A', creditLimit: 10000 }, status: 'posted' },
          // 31-60: 45 days ago
          { customerId: 'c1', totalAmount: 2000, paidAmount: 0, dueDate: daysAgo(45), customer: { id: 'c1', name: 'A', creditLimit: 10000 }, status: 'posted' },
          // 120+: 150 days ago
          { customerId: 'c1', totalAmount: 3000, paidAmount: 0, dueDate: daysAgo(150), customer: { id: 'c1', name: 'A', creditLimit: 10000 }, status: 'posted' },
        ]),
        aggregate: vi.fn().mockResolvedValue({ _sum: { credit: 0, debit: 0 } }),
      },
      customer: { findFirst: vi.fn().mockResolvedValue({ id: 'c1', creditLimit: 10000 }) },
      journalLine: { aggregate: vi.fn().mockResolvedValue({ _sum: { credit: 0, debit: 0 } }) },
    };

    const svc = new CreditManagementService(prisma as any, mockCtx);
    const report = await svc.generateAgingReport();

    expect(report).toHaveLength(1);
    const c1 = report[0];
    expect(c1.buckets['0-30']).toBe(1000);
    expect(c1.buckets['31-60']).toBe(2000);
    expect(c1.buckets['120+']).toBe(3000);
    expect(c1.totalOutstanding).toBe(6000);
  });
});
