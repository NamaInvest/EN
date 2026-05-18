/**
 * Phase 9.2 — Financial Operation Tracer
 * ─────────────────────────────────────────
 * Provides end-to-end tracing for all financial mutations in Nama Invest ERP.
 *
 * Every traced operation emits:
 * 1. A "started" log with traceId + correlationId
 * 2. A "completed" or "failed" log with duration
 * 3. The traceId is returned so it can be stored in AuditLog metadata
 *
 * Usage:
 *   const result = await traceFinancialOperation(
 *     { operationType: 'POST_JOURNAL', module: 'accounting', aggregateId: '123' },
 *     async (traceId) => {
 *       // ... do financial mutation
 *       return result;
 *     }
 *   );
 *
 * Security constraints:
 * - Never log monetary amounts in plaintext
 * - Never log customer names or employee IDs as part of trace
 * - aggregateId may be a document ID (invoice #, journal #) — non-sensitive
 */

import { getCorrelationId, generateTraceId } from './correlation';
import { logger } from './logger';

export interface FinancialTraceContext {
  /** Type of financial operation (POST_JOURNAL, APPLY_PAYMENT, CLOSE_PERIOD…) */
  operationType: string;
  /** ERP domain module (accounting, treasury, sales, hr…) */
  module: string;
  /** Document or aggregate ID being operated on (invoice #, journal #…) */
  aggregateId?: string | number;
  /** ISO 4217 currency code — non-sensitive, useful for FX tracing */
  currency?: string;
  /** True if a SOFT_LOCK override was required */
  overrideUsed?: boolean;
  /** Period state at time of operation */
  periodState?: 'OPEN' | 'SOFT_LOCKED' | 'HARD_LOCKED';
  /** Actor ID (user ID) — non-sensitive for override traces */
  actorId?: string;
  /** Actor role — for override authorization tracing */
  actorRole?: string;
  /** Tenant ID — for cross-tenant violation detection */
  tenantId?: string;
  /** Override reason summary (truncated, max 200 chars) */
  reason?: string;
}

export interface FinancialTraceResult {
  traceId: string;
  correlationId: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
}

/**
 * Wraps a financial operation with full observability tracing.
 * Returns the operation result; throws if the operation fails (after logging).
 */
export async function traceFinancialOperation<T>(
  context: FinancialTraceContext,
  operation: (traceId: string) => Promise<T>
): Promise<T> {
  const traceId = generateTraceId();
  const correlationId = getCorrelationId();
  const startTime = Date.now();

  logger.financial('info', 'Financial operation started', {
    traceId,
    correlationId,
    status: 'STARTED',
    ...context,
  });

  try {
    const result = await operation(traceId);
    const durationMs = Date.now() - startTime;

    logger.financial('info', 'Financial operation completed', {
      traceId,
      correlationId,
      durationMs,
      status: 'SUCCESS',
      ...context,
    });

    return result;
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.financial('error', 'Financial operation failed', {
      traceId,
      correlationId,
      durationMs,
      status: 'FAILED',
      error: errorMessage,
      ...context,
    });

    throw error;
  }
}

/**
 * Logs an override event within a financial operation.
 * Should be called before assertPeriodWritable() when override context is present.
 */
export function traceOverrideUsed(
  context: FinancialTraceContext & { traceId?: string; reason?: string }
): void {
  logger.override('SOFT_LOCK override authorized for financial operation', {
    ...context,
    overrideUsed: true,
  });
}

/**
 * Logs a period lock violation (rejected operation).
 * Call this when PeriodLockViolation is caught.
 */
export function tracePeriodLockRejection(
  context: FinancialTraceContext & {
    rejectionCode: 'LOCKED' | 'MASTER_OVERRIDE_REQUIRED';
    period: string;
  }
): void {
  logger.financial('warn', 'Financial operation rejected — period locked', {
    severity: 'CRITICAL',
    ...context,
  });
}
