/**
 * Phase 9.5 — Operational Diagnostics Tests
 * ────────────────────────────────────────────
 * Tests for:
 * 1. Outbox health analysis (HEALTHY / DEGRADED / CRITICAL)
 * 2. Override monitoring aggregation
 * 3. Period lock rejection counting
 * 4. Tenant isolation enforcement (no cross-tenant queries)
 * 5. Health score calculation
 * 6. Empty tenant rejection
 */

import { OperationalDiagnostics } from '@/lib/observability/diagnostics';

// ── Mock Prisma Client ───────────────────────────────────────────────────────

function createMockPrismaClient(overrides: {
  outboxEvent?: Partial<{
    count: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  }>;
  auditLog?: Partial<{
    count: jest.Mock;
    findMany: jest.Mock;
  }>;
  periodLockLog?: Partial<{
    count: jest.Mock;
    findMany: jest.Mock;
  }>;
} = {}) {
  return {
    outboxEvent: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      ...overrides.outboxEvent,
    },
    auditLog: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      ...overrides.auditLog,
    },
    periodLockLog: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      ...overrides.periodLockLog,
    },
  } as any;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('OperationalDiagnostics — Tenant Isolation', () => {
  it('rejects empty tenantId before any query', async () => {
    const prisma = createMockPrismaClient();
    await expect(OperationalDiagnostics.run(prisma, '')).rejects.toThrow(
      'TENANT_ISOLATION_VIOLATION'
    );
    expect(prisma.outboxEvent.count).not.toHaveBeenCalled();
    expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
  });

  it('rejects "default" tenantId before any query', async () => {
    const prisma = createMockPrismaClient();
    await expect(OperationalDiagnostics.run(prisma, 'default')).rejects.toThrow(
      'TENANT_ISOLATION_VIOLATION'
    );
  });

  it('scopes all outbox queries to the correct tenant', async () => {
    const prisma = createMockPrismaClient({
      outboxEvent: {
        count: jest.fn()
          .mockResolvedValueOnce(0)   // PENDING
          .mockResolvedValueOnce(0)   // PROCESSING
          .mockResolvedValueOnce(5)   // PROCESSED
          .mockResolvedValueOnce(0)   // FAILED
          .mockResolvedValueOnce(0)   // exceeded retry
          .mockResolvedValueOnce(0),  // stuck events
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    await OperationalDiagnostics.run(prisma, 'tenant-scoped');

    // Verify every count call includes tenantId
    const allCountCalls = prisma.outboxEvent.count.mock.calls;
    for (const [args] of allCountCalls) {
      expect(args.where.tenantId).toBe('tenant-scoped');
    }
  });
});

describe('OperationalDiagnostics — Outbox Health', () => {
  it('reports HEALTHY when all counts are zero', async () => {
    const prisma = createMockPrismaClient({
      outboxEvent: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-healthy');
    expect(report.outbox.status).toBe('HEALTHY');
    expect(report.outbox.diagnostics.failedCount).toBe(0);
  });

  it('reports DEGRADED when there are failed events', async () => {
    const prisma = createMockPrismaClient({
      outboxEvent: {
        count: jest.fn()
          .mockResolvedValueOnce(0)   // PENDING
          .mockResolvedValueOnce(0)   // PROCESSING
          .mockResolvedValueOnce(10)  // PROCESSED
          .mockResolvedValueOnce(2)   // FAILED
          .mockResolvedValueOnce(0)   // exceeded retry
          .mockResolvedValueOnce(0),  // stuck
        findMany: jest.fn().mockResolvedValue([
          { eventType: 'ZATCA_REPORT_JOB' },
          { eventType: 'JOURNAL_POSTED' },
        ]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-degraded');
    expect(report.outbox.status).toBe('DEGRADED');
    expect(report.outbox.recentFailedEventTypes).toContain('ZATCA_REPORT_JOB');
  });

  it('reports CRITICAL when exceeded retry limit > 0', async () => {
    const prisma = createMockPrismaClient({
      outboxEvent: {
        count: jest.fn()
          .mockResolvedValueOnce(0)   // PENDING
          .mockResolvedValueOnce(0)   // PROCESSING
          .mockResolvedValueOnce(20)  // PROCESSED
          .mockResolvedValueOnce(5)   // FAILED
          .mockResolvedValueOnce(3)   // exceeded retry — triggers CRITICAL
          .mockResolvedValueOnce(0),  // stuck
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-critical');
    expect(report.outbox.status).toBe('CRITICAL');
    expect(report.criticalIssues.length).toBeGreaterThan(0);
    expect(report.criticalIssues[0]).toContain('failed events');
  });
});

describe('OperationalDiagnostics — Override Monitoring', () => {
  it('counts zero overrides when AuditLog has no SOFT_LOCK_OVERRIDE entries', async () => {
    const prisma = createMockPrismaClient({
      auditLog: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-no-overrides');
    expect(report.overrides.totalOverridesLast30Days).toBe(0);
    expect(report.overrides.overridesByModule).toEqual({});
  });

  it('aggregates overrides by module from audit log metadata', async () => {
    const mockOverrides = [
      {
        id: 1,
        entityId: 'period-2026-01',
        userId: 5,
        metadata: { module: 'accounting', operationType: 'POST_JOURNAL', reason: 'Emergency fix' },
        createdAt: new Date(),
      },
      {
        id: 2,
        entityId: 'period-2026-01',
        userId: 5,
        metadata: { module: 'treasury', operationType: 'APPLY_PAYMENT', reason: 'Adjustment' },
        createdAt: new Date(),
      },
      {
        id: 3,
        entityId: 'period-2026-01',
        userId: 7,
        metadata: { module: 'accounting', operationType: 'POST_JOURNAL', reason: 'Q1 close' },
        createdAt: new Date(),
      },
    ];

    const prisma = createMockPrismaClient({
      auditLog: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue(mockOverrides),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-with-overrides');
    expect(report.overrides.totalOverridesLast30Days).toBe(3);
    expect(report.overrides.overridesByModule['accounting']).toBe(2);
    expect(report.overrides.overridesByModule['treasury']).toBe(1);
  });
});

describe('OperationalDiagnostics — Health Score', () => {
  it('returns 100 for a perfectly healthy system', async () => {
    const prisma = createMockPrismaClient({
      outboxEvent: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-perfect');
    expect(report.healthScore).toBe(100);
    expect(report.criticalIssues).toHaveLength(0);
  });

  it('deducts points for CRITICAL outbox status', async () => {
    const prisma = createMockPrismaClient({
      outboxEvent: {
        count: jest.fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(5)   // FAILED
          .mockResolvedValueOnce(3)   // exceeded retry
          .mockResolvedValueOnce(0),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    const report = await OperationalDiagnostics.run(prisma, 'tenant-bad-outbox');
    expect(report.healthScore).toBeLessThan(100);
    expect(report.outbox.status).toBe('CRITICAL');
  });
});
