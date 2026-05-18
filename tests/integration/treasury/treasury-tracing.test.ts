/**
 * Phase 10 — Financial Tracing Integration Tests (Treasury)
 * ───────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runWithContext } from '@/lib/observability/request-context';

type FinancialCallArgs = [level: string, msg: string, payload: Record<string, unknown>];

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockTx = {
  treasury: {
    create: vi.fn().mockResolvedValue({ id: 501 }),
  },
  account: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/auto-journal', () => ({
  createJournalEntry: vi.fn().mockResolvedValue({ success: true, entryId: 9901 }),
}));

// ── Helper ─────────────────────────────────────────────────────────────────────

function makeBody(type: 'in' | 'out', extra: Record<string, unknown> = {}) {
  return {
    tenantId: 'tenant-treasury',
    type,
    amount: 5000,
    referenceType: 'auto',
    treasuryAccountId: 1,
    counterpartyAccountId: 2,
    ...extra,
  };
}

function resetAccountMock() {
  mockTx.account.findUnique
    .mockResolvedValueOnce({ code: '1110' })
    .mockResolvedValueOnce({ code: '1200' });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Phase 10 — Treasury Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.treasury.create.mockResolvedValue({ id: 501 });
    resetAccountMock();
  });

  it('TC-TREASURY-001: TREASURY_RECEIPT emits correct operationType', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    await runWithContext({ requestId: 'req-t-001', tenantId: 'tenant-treasury' }, async () => {
      await TreasuryPostingService.createTreasuryEntry(mockTx as any, makeBody('in'), 42, null);
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const startedCall = calls.find(([, msg]) => msg.includes('started'));
    expect(startedCall).toBeDefined();
    expect(startedCall![2]?.operationType).toBe('TREASURY_RECEIPT');
    expect(startedCall![2]?.module).toBe('treasury');
    spy.mockRestore();
  });

  it('TC-TREASURY-002: TREASURY_PAYMENT emits correct operationType', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    resetAccountMock();
    await runWithContext({ requestId: 'req-t-002', tenantId: 'tenant-treasury' }, async () => {
      await TreasuryPostingService.createTreasuryEntry(mockTx as any, makeBody('out'), 5, null);
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const startedCall = calls.find(([, msg]) => msg.includes('started'));
    expect(startedCall![2]?.operationType).toBe('TREASURY_PAYMENT');
    spy.mockRestore();
  });

  it('TC-TREASURY-003: SUCCESS logged after treasury creation', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    resetAccountMock();
    await runWithContext({ requestId: 'req-t-003', tenantId: 'tenant-treasury' }, async () => {
      await TreasuryPostingService.createTreasuryEntry(mockTx as any, makeBody('in'), 7, null);
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const completedCall = calls.find(([, msg]) => msg.includes('completed'));
    expect(completedCall).toBeDefined();
    expect(completedCall![2]?.status).toBe('SUCCESS');
    expect(typeof completedCall![2]?.durationMs).toBe('number');
    spy.mockRestore();
  });

  it('TC-TREASURY-004: correlationId from context propagates to trace', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    resetAccountMock();
    await runWithContext({ requestId: 'req-t-corr', tenantId: 'tenant-treasury' }, async () => {
      await TreasuryPostingService.createTreasuryEntry(mockTx as any, makeBody('in'), 3, null);
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const allPayloads = calls.map(([, , p]) => p);
    const hasCorrelation = allPayloads.some((p) => p?.correlationId === 'req-t-corr');
    expect(hasCorrelation).toBe(true);
    spy.mockRestore();
  });

  it('TC-TREASURY-005: No PII in treasury trace payload', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    resetAccountMock();
    await runWithContext({ requestId: 'req-t-pii', tenantId: 'tenant-treasury' }, async () => {
      await TreasuryPostingService.createTreasuryEntry(
        mockTx as any,
        makeBody('in', { description: 'Customer Ahmed Ali payment' }),
        1,
        null
      );
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const combined = calls.map(([, , p]) => JSON.stringify(p ?? {})).join('');

    expect(combined).not.toContain('Ahmed Ali');
    expect(combined).not.toContain('"amount":5000');
    expect(combined).not.toContain('customerName');
    expect(combined).not.toContain('nationalId');
    spy.mockRestore();
  });

  it('TC-TREASURY-006: FAILED trace on treasury.create error', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    mockTx.treasury.create.mockRejectedValueOnce(new Error('DB timeout'));

    await runWithContext({ requestId: 'req-t-fail', tenantId: 'tenant-treasury' }, async () => {
      await expect(
        TreasuryPostingService.createTreasuryEntry(mockTx as any, makeBody('in'), 1, null)
      ).rejects.toThrow('DB timeout');
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const failedCall = calls.find(([level]) => level === 'error');
    expect(failedCall).toBeDefined();
    expect(failedCall![2]?.status).toBe('FAILED');
    expect(failedCall![2]?.operationType).toBe('TREASURY_RECEIPT');
    spy.mockRestore();
  });

  it('TC-TREASURY-007: overrideUsed: true when overrideContext passed', async () => {
    const { logger } = await import('@/lib/observability/logger');
    const spy = vi.spyOn(logger, 'financial');
    const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');

    resetAccountMock();
    await runWithContext({ requestId: 'req-t-ov', tenantId: 'tenant-treasury' }, async () => {
      await TreasuryPostingService.createTreasuryEntry(
        mockTx as any,
        makeBody('out'),
        9,
        null,
        {
          actorId: '9',
          actorRole: 'MASTER_ADMIN',
          tenantId: 'tenant-treasury',
          reason: 'Emergency Q4 payment approved by board unanimously',
          confirmationCode: 'CONFIRM-SOFT-LOCK-OVERRIDE',
          requestId: 'req-t-ov',
        }
      );
    });

    const calls = spy.mock.calls as FinancialCallArgs[];
    const startedCall = calls.find(([, msg]) => msg.includes('started'));
    expect(startedCall![2]?.overrideUsed).toBe(true);
    spy.mockRestore();
  });
});
