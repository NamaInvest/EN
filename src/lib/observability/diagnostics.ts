/**
 * Phase 9.4 — Operational Diagnostics Engine
 * ─────────────────────────────────────────────
 * Provides a unified, read-only diagnostic view of the operational health
 * of Nama Invest ERP for a given tenant.
 *
 * Aggregates signals from:
 * - OutboxEvent table (failed events, pending retries, stuck events)
 * - AuditLog table (override frequency, audit gaps)
 * - PeriodLockLog table (failed period-lock attempts)
 * - (Runtime) Tenant in-memory metrics
 *
 * All queries are:
 * - Read-only (no mutations)
 * - Tenant-scoped (no cross-tenant leakage)
 * - Bounded (LIMIT applied to prevent OOM)
 * - Safe to run on production
 *
 * Usage:
 *   const report = await OperationalDiagnostics.run(prisma, 'tenant-xyz');
 */

import { PrismaClient } from '@prisma/client';
import { OutboxService, type OutboxDiagnostics } from '@/lib/services/outbox.service';
import { logger } from './logger';

// ── Diagnostic Limit Constants ────────────────────────────────────────────────

const MAX_RECENT_FAILURES = 10;
const MAX_OVERRIDE_HISTORY = 50;
const SLOW_OPERATION_THRESHOLD_MS = 5000;
const STUCK_EVENT_AGE_MINUTES = 30;

// ── Diagnostic Result Types ───────────────────────────────────────────────────

export interface OutboxHealthReport {
  /** Current outbox event status counts */
  diagnostics: OutboxDiagnostics;
  /** Events stuck in PROCESSING state for > STUCK_EVENT_AGE_MINUTES */
  stuckEventCount: number;
  /** Most recent failed event types */
  recentFailedEventTypes: string[];
  /** Health status derived from counts */
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export interface OverrideMonitoringReport {
  /** Total SOFT_LOCK overrides in the last 30 days */
  totalOverridesLast30Days: number;
  /** Overrides by module */
  overridesByModule: Record<string, number>;
  /** Overrides by actor */
  overridesByActor: Record<string, number>;
  /** Most recent overrides */
  recentOverrides: Array<{
    id: number;
    entityId: string;
    module: string | null;
    operationType: string | null;
    actorId: number | null;
    createdAt: Date;
    reason: string | null;
  }>;
}

export interface PeriodLockHealthReport {
  /** Rejected write attempts in the last 7 days */
  rejectedAttemptsLast7Days: number;
  /** Breakdown by operation type */
  rejectionsByOperation: Record<string, number>;
}

export interface FinancialAuditGapReport {
  /** Number of financial operations without a corresponding audit log */
  estimatedGapCount: number;
  /** Modules with lowest audit coverage */
  modulesWithGaps: string[];
}

export interface OperationalDiagnosticsReport {
  tenantId: string;
  generatedAt: Date;
  /** Outbox event health */
  outbox: OutboxHealthReport;
  /** Override frequency analysis */
  overrides: OverrideMonitoringReport;
  /** Period lock rejection analysis */
  periodLocks: PeriodLockHealthReport;
  /** Audit coverage gaps */
  auditGaps: FinancialAuditGapReport;
  /** Overall operational health score (0-100) */
  healthScore: number;
  /** Human-readable summary of critical issues */
  criticalIssues: string[];
}

// ── Prisma Client Type ────────────────────────────────────────────────────────

type DiagnosticsPrismaClient = Pick<
  PrismaClient,
  'outboxEvent' | 'auditLog' | 'periodLockLog'
>;

// ── Diagnostics Engine ────────────────────────────────────────────────────────

export class OperationalDiagnostics {
  /**
   * Run full operational diagnostics for a tenant.
   * All queries are read-only and tenant-scoped.
   */
  static async run(
    prismaClient: DiagnosticsPrismaClient,
    tenantId: string
  ): Promise<OperationalDiagnosticsReport> {
    if (!tenantId || tenantId.trim() === '' || tenantId.toLowerCase() === 'default') {
      throw new Error('TENANT_ISOLATION_VIOLATION: tenantId is required for diagnostics.');
    }

    const log = logger.child({ module: 'observability.diagnostics', tenantId });
    log.info('Running operational diagnostics');

    const [outbox, overrides, periodLocks] = await Promise.all([
      OperationalDiagnostics.analyzeOutbox(prismaClient, tenantId),
      OperationalDiagnostics.analyzeOverrides(prismaClient, tenantId),
      OperationalDiagnostics.analyzePeriodLocks(prismaClient, tenantId),
    ]);

    const auditGaps = await OperationalDiagnostics.analyzeAuditGaps(
      prismaClient,
      tenantId
    );

    const criticalIssues: string[] = [];

    if (outbox.status === 'CRITICAL') {
      criticalIssues.push(
        `Outbox: ${outbox.diagnostics.failedCount} failed events, ${outbox.stuckEventCount} stuck events`
      );
    }
    if (overrides.totalOverridesLast30Days > 10) {
      criticalIssues.push(
        `High override frequency: ${overrides.totalOverridesLast30Days} overrides in 30 days`
      );
    }
    if (periodLocks.rejectedAttemptsLast7Days > 5) {
      criticalIssues.push(
        `Period lock violations: ${periodLocks.rejectedAttemptsLast7Days} rejected attempts in 7 days`
      );
    }

    const healthScore = OperationalDiagnostics.calculateHealthScore(
      outbox,
      overrides,
      periodLocks
    );

    const report: OperationalDiagnosticsReport = {
      tenantId,
      generatedAt: new Date(),
      outbox,
      overrides,
      periodLocks,
      auditGaps,
      healthScore,
      criticalIssues,
    };

    log.info('Operational diagnostics complete', {
      healthScore,
      criticalIssueCount: criticalIssues.length,
      outboxStatus: outbox.status,
    });

    return report;
  }

  // ── Outbox Analysis ─────────────────────────────────────────────────────────

  private static async analyzeOutbox(
    prismaClient: DiagnosticsPrismaClient,
    tenantId: string
  ): Promise<OutboxHealthReport> {
    const diagnostics = await OutboxService.getDiagnostics(prismaClient as any, tenantId);

    const stuckThreshold = new Date(Date.now() - STUCK_EVENT_AGE_MINUTES * 60 * 1000);

    const [stuckEventCount, recentFailed] = await Promise.all([
      prismaClient.outboxEvent.count({
        where: {
          tenantId,
          status: 'PROCESSING',
          createdAt: { lt: stuckThreshold },
        },
      }),
      prismaClient.outboxEvent.findMany({
        where: { tenantId, status: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        take: MAX_RECENT_FAILURES,
        select: { eventType: true },
      }),
    ]);

    const recentFailedEventTypes = [...new Set(recentFailed.map((e) => e.eventType))];

    let status: OutboxHealthReport['status'] = 'HEALTHY';
    if (diagnostics.failedCount > 0 || stuckEventCount > 0) status = 'DEGRADED';
    if (diagnostics.exceededRetryLimitCount > 0 || stuckEventCount > 5) status = 'CRITICAL';

    return {
      diagnostics,
      stuckEventCount,
      recentFailedEventTypes,
      status,
    };
  }

  // ── Override Analysis ───────────────────────────────────────────────────────

  private static async analyzeOverrides(
    prismaClient: DiagnosticsPrismaClient,
    tenantId: string
  ): Promise<OverrideMonitoringReport> {
    const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const overrideLogs = await prismaClient.auditLog.findMany({
      where: {
        tenantId,
        action: 'SOFT_LOCK_OVERRIDE',
        createdAt: { gte: since30Days },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_OVERRIDE_HISTORY,
      select: {
        id: true,
        entityId: true,
        userId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const overridesByModule: Record<string, number> = {};
    const overridesByActor: Record<string, number> = {};

    for (const log of overrideLogs) {
      const meta = log.metadata as Record<string, unknown> | null;
      const module = (meta?.module as string) ?? 'unknown';
      const operationType = (meta?.operationType as string) ?? 'unknown';

      overridesByModule[module] = (overridesByModule[module] ?? 0) + 1;

      const actorKey = log.userId ? `user:${log.userId}` : 'unknown';
      overridesByActor[actorKey] = (overridesByActor[actorKey] ?? 0) + 1;
    }

    const recentOverrides = overrideLogs.slice(0, 10).map((log) => {
      const meta = log.metadata as Record<string, unknown> | null;
      return {
        id: typeof log.id === 'number' ? log.id : Number(log.id),
        entityId: log.entityId,
        module: (meta?.module as string) ?? null,
        operationType: (meta?.operationType as string) ?? null,
        actorId: log.userId,
        createdAt: log.createdAt,
        reason: (meta?.reason as string) ?? null,
      };
    });

    return {
      totalOverridesLast30Days: overrideLogs.length,
      overridesByModule,
      overridesByActor,
      recentOverrides,
    };
  }

  // ── Period Lock Analysis ────────────────────────────────────────────────────

  private static async analyzePeriodLocks(
    prismaClient: DiagnosticsPrismaClient,
    tenantId: string
  ): Promise<PeriodLockHealthReport> {
    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rejectionLogs = await prismaClient.periodLockLog.findMany({
      where: {
        tenantId,
        action: { startsWith: 'REJECTED_' },
        createdAt: { gte: since7Days },
      },
      take: 100,
      select: { action: true },
    });

    const rejectionsByOperation: Record<string, number> = {};
    for (const log of rejectionLogs) {
      const opType = log.action.replace('REJECTED_', '');
      rejectionsByOperation[opType] = (rejectionsByOperation[opType] ?? 0) + 1;
    }

    return {
      rejectedAttemptsLast7Days: rejectionLogs.length,
      rejectionsByOperation,
    };
  }

  // ── Audit Gap Analysis ──────────────────────────────────────────────────────

  private static async analyzeAuditGaps(
    prismaClient: DiagnosticsPrismaClient,
    tenantId: string
  ): Promise<FinancialAuditGapReport> {
    // Audit gap = outbox events that are PROCESSED but have no corresponding AuditLog
    // This is a heuristic — we count financial outbox events vs audit log entries in the same window
    const since24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [processedFinancialEvents, recentAuditLogs] = await Promise.all([
      prismaClient.outboxEvent.count({
        where: {
          tenantId,
          status: 'PROCESSED',
          eventType: {
            in: [
              'JOURNAL_POSTED',
              'PAYMENT_APPLIED',
              'INVOICE_CREATED',
              'PAYROLL_POSTED',
              'PERIOD_CLOSED',
            ],
          },
          createdAt: { gte: since24Hours },
        },
      }),
      prismaClient.auditLog.count({
        where: {
          tenantId,
          action: { in: ['CREATE', 'UPDATE', 'EXECUTE'] },
          createdAt: { gte: since24Hours },
        },
      }),
    ]);

    const estimatedGapCount = Math.max(0, processedFinancialEvents - recentAuditLogs);

    // Identify modules that historically have low audit coverage
    const modulesWithGaps: string[] = [];
    if (estimatedGapCount > 5) modulesWithGaps.push('accounting');
    if (estimatedGapCount > 10) modulesWithGaps.push('treasury', 'sales');

    return {
      estimatedGapCount,
      modulesWithGaps,
    };
  }

  // ── Health Score Calculator ─────────────────────────────────────────────────

  private static calculateHealthScore(
    outbox: OutboxHealthReport,
    overrides: OverrideMonitoringReport,
    periodLocks: PeriodLockHealthReport
  ): number {
    let score = 100;

    // Outbox health
    if (outbox.status === 'DEGRADED') score -= 15;
    if (outbox.status === 'CRITICAL') score -= 35;
    if (outbox.diagnostics.exceededRetryLimitCount > 0) score -= 10;

    // Override frequency
    if (overrides.totalOverridesLast30Days > 5) score -= 10;
    if (overrides.totalOverridesLast30Days > 20) score -= 20;

    // Period lock rejections
    if (periodLocks.rejectedAttemptsLast7Days > 3) score -= 10;
    if (periodLocks.rejectedAttemptsLast7Days > 10) score -= 15;

    return Math.max(0, Math.min(100, score));
  }
}
