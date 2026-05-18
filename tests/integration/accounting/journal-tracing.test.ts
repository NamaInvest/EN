/**
 * Phase 10 — Financial Tracing Integration Tests (Accounting)
 * ─────────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runWithContext } from '@/lib/observability/request-context';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    financialPeriod: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    periodLockLog: { create: vi.fn() },
    $transaction: vi.fn((fn: (tx: any) => any) => fn({
      account: {
        findFirst: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({ id: 1, type: 'asset' }),
        update: vi.fn(),
      },
      journalEntry: { create: vi.fn().mockResolvedValue({ id: 9901 }) },
    })),
  },
  resolveTenant: vi.fn(() => 'tenant-test-001'),
  withTenant: vi.fn((_tenant: string, fn: () => any) => fn()),
}));

vi.mock('@/lib/numbering', () => ({
  getNextNumber: vi.fn().mockResolvedValue({ formatted: 'JE-0001' }),
}));

vi.mock('@/lib/services/accounting-journal.service', () => ({
  AccountingJournalService: {
    createEntry: vi.fn().mockResolvedValue({ id: 9901 }),
  },
}));

// ── Helper ─────────────────────────────────────────────────────────────────────

function makeBaseParams(overrides: Record<string, unknown> = {}) {
  return {
    description: 'Test Journal',
    reference: 'SALE-777',
    lines: [
      { accountCode: '1100', debit: 1000, credit: 0 },
      { accountCode: '4100', debit: 0, credit: 1000 },
    ],
    userId: 42,
    date: '2026-05-01',
    ...overrides,
  };
}

type FinancialCallArgs = [level: string, msg: string, payload: Record<string, unknown>];

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Phase 10 — Journal Tracing: STARTED + SUCCESS outcomes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('TC-TRACE-001: emits STARTED log before posting', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    await runWithContext({ requestId: 'req-trace-001', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      await (createJournalEntry as any)(makeBaseParams());
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const startedCall = calls.find(([, msg]) => msg.includes('started'));
    expect(startedCall).toBeDefined();
    expect(startedCall![2]?.status).toBe('STARTED');
    expect(startedCall![2]?.operationType).toBeTruthy();
    spy.mockRestore();
  });

  it('TC-TRACE-002: emits SUCCESS log after posting', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    await runWithContext({ requestId: 'req-trace-002', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      await (createJournalEntry as any)(makeBaseParams());
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const successCall = calls.find(([, msg]) => msg.includes('completed'));
    expect(successCall).toBeDefined();
    expect(successCall![2]?.status).toBe('SUCCESS');
    expect(typeof successCall![2]?.durationMs).toBe('number');
    spy.mockRestore();
  });

  it('TC-TRACE-003: correlationId from AsyncLocalStorage propagates to trace', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    await runWithContext({ requestId: 'req-corr-trace', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      await (createJournalEntry as any)(makeBaseParams());
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const allPayloads = calls.map(([, , p]) => p);
    const hasCorrelation = allPayloads.some((p) => p?.correlationId === 'req-corr-trace');
    expect(hasCorrelation).toBe(true);
    spy.mockRestore();
  });

  it('TC-TRACE-004: aggregateId contains reference (non-PII)', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    await runWithContext({ requestId: 'req-ref', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      await (createJournalEntry as any)(makeBaseParams({ reference: 'PUR-888' }));
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const startedCall = calls.find(([, msg]) => msg.includes('started'));
    expect(startedCall![2]?.aggregateId).toBe('PUR-888');
    spy.mockRestore();
  });

  it('TC-TRACE-005: No PII in trace — no customerName, nationalId, amount', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    await runWithContext({ requestId: 'req-pii', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      await (createJournalEntry as any)(makeBaseParams());
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const allPayloadStr = calls.map(([, , p]) => JSON.stringify(p ?? {})).join('');

    expect(allPayloadStr).not.toContain('customerName');
    expect(allPayloadStr).not.toContain('nationalId');
    expect(allPayloadStr).not.toContain('employeeName');
    expect(allPayloadStr).not.toContain('"amount"');
    // description is never part of financial trace context
    expect(allPayloadStr).not.toContain('"description":"Test Journal"');
    spy.mockRestore();
  });

  it('TC-TRACE-006: overrideUsed: true when overrideContext set', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    await runWithContext({ requestId: 'req-ov', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      await (createJournalEntry as any)(makeBaseParams({
        overrideContext: {
          actorId: '5',
          actorRole: 'MASTER_ADMIN',
          tenantId: 'tenant-test-001',
          reason: 'Emergency Q4 correction authorized by CFO board',
          confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
          requestId: 'req-ov',
        },
      }));
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const startedCall = calls.find(([, msg]) => msg.includes('started'));
    expect(startedCall![2]?.overrideUsed).toBe(true);
    spy.mockRestore();
  });
});

describe('Phase 10 — Journal Tracing: REJECTED on PeriodLockViolation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('TC-TRACE-007: SOFT_LOCKED period triggers rejection trace', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');

    const { FinancialPeriodStatus } = await import('@prisma/client');
    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue({
      id: 1,
      status: FinancialPeriodStatus.SOFT_LOCKED,
      tenantId: 'tenant-test-001',
      period: '2026-05',
    });
    (prisma.periodLockLog.create as any).mockResolvedValue({});

    await runWithContext({ requestId: 'req-period-lock', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      const result = await (createJournalEntry as any)(makeBaseParams({ overrideContext: undefined }));
      // Returns { success: false } — does not throw
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const rejectionTrace = calls.find(([level, msg]) =>
      level === 'warn' && msg.includes('rejected')
    );
    expect(rejectionTrace).toBeDefined();
    expect(rejectionTrace![2]?.periodState).toBe('SOFT_LOCKED');
    spy.mockRestore();
  });
});

describe('Phase 10 — Journal Tracing: error handling', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('TC-TRACE-008: AccountingJournalService error returns success:false with error message', async () => {
    // createJournalEntry internally catches all errors and returns { success: false, error }
    // This means traceFinancialOperation outer wrapper sees SUCCESS (callback did not throw)
    // The actual failure is surfaced via { success: false, error: message }
    const { prisma } = await import('@/lib/prisma');
    (prisma.financialPeriod.findUnique as any).mockResolvedValue(null);

    const { AccountingJournalService } = await import('@/lib/services/accounting-journal.service');
    (AccountingJournalService.createEntry as any).mockRejectedValueOnce(new Error('DB connection lost'));

    await runWithContext({ requestId: 'req-fail', tenantId: 'tenant-test-001' }, async () => {
      const { createJournalEntry } = await import('@/lib/auto-journal');
      const result = await (createJournalEntry as any)(makeBaseParams());
      // The error is caught internally — no throw, failure surfaced in return value
      expect(result.success).toBe(false);
      expect(result.error).toContain('DB connection lost');
    });
  });
});
