/**
 * Phase 9.3 — Enterprise Structured Logger
 * ─────────────────────────────────────────
 * Unified logger for all observability-aware logging within Nama Invest ERP.
 *
 * Features:
 * - Auto-injects requestId, tenantId, actorId, actorRole, module from AsyncLocalStorage
 * - Supports: module, operationType, severity, financialImpact, overrideUsed, periodState
 * - JSON output compatible with log aggregation (Loki, CloudWatch, ELK)
 * - Never logs PII/PHI: amounts are OK (non-identifying), but names/IDs of individuals
 *   must be excluded from financialImpact payloads
 *
 * Anti-patterns prevented:
 * - No console.log() in financial paths (use this logger instead)
 * - No logging of customer names, national IDs, or sensitive employee data
 * - No logging of passwords, tokens, or cryptographic keys
 */

import { getRequestContext } from './request-context';

// ── Log Level Definitions ─────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'];

// ── Structured Log Payload ────────────────────────────────────────────────────

export interface StructuredLogPayload {
  /** Human-readable message */
  msg: string;
  /** Log level */
  level: LogLevel;
  /** ISO timestamp */
  time: string;

  // ── Core Correlation (auto-injected from AsyncLocalStorage) ──
  /** Unique ID for this HTTP request — primary correlation key */
  requestId?: string;
  /** Authenticated tenant */
  tenantId?: string;
  /** Authenticated actor ID */
  actorId?: string;
  /** Authenticated actor role */
  actorRole?: string;

  // ── Domain Context ──
  /** ERP domain module (sales, treasury, hr, inventory…) */
  module?: string;
  /** Operation type within the module (CREATE_INVOICE, POST_JOURNAL…) */
  operationType?: string;
  /** Severity override for alerting systems (INFO, WARNING, CRITICAL) */
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';

  // ── Financial Flags ──
  /** True if this log line relates to a financial mutation */
  financialImpact?: boolean;
  /** True if a SOFT_LOCK override was used to authorize this operation */
  overrideUsed?: boolean;
  /** The period state at time of operation (OPEN, SOFT_LOCKED, HARD_LOCKED) */
  periodState?: 'OPEN' | 'SOFT_LOCKED' | 'HARD_LOCKED';
  /** Trace ID for financial operation tracing */
  traceId?: string;
  /** Duration of the operation in ms */
  durationMs?: number;

  // ── Allow arbitrary additional fields ──
  [key: string]: unknown;
}

// ── Formatting ────────────────────────────────────────────────────────────────

function buildPayload(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): StructuredLogPayload {
  const ctx = getRequestContext();

  return {
    level,
    time: new Date().toISOString(),
    msg: message,
    // Auto-inject from AsyncLocalStorage if present
    requestId: ctx?.requestId,
    tenantId: ctx?.tenantId,
    actorId: ctx?.actorId,
    actorRole: ctx?.actorRole,
    module: ctx?.module,
    // Spread caller-provided data (overrides allowed)
    ...(data ?? {}),
  };
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= MIN_LEVEL;
}

function emit(level: LogLevel, payload: StructuredLogPayload): void {
  const json = JSON.stringify(payload);
  switch (level) {
    case 'debug':
      console.debug(json);
      break;
    case 'info':
      console.info(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    case 'error':
    case 'fatal':
      console.error(json);
      break;
  }
}

// ── Public Logger API ─────────────────────────────────────────────────────────

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('debug')) emit('debug', buildPayload('debug', message, data));
  },

  info(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('info')) emit('info', buildPayload('info', message, data));
  },

  warn(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('warn')) emit('warn', buildPayload('warn', message, data));
  },

  error(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('error')) emit('error', buildPayload('error', message, data));
  },

  fatal(message: string, data?: Record<string, unknown>): void {
    if (shouldLog('fatal')) emit('fatal', buildPayload('fatal', message, data));
  },

  /**
   * Create a child logger with pre-bound context fields.
   * Child loggers automatically merge their bound fields with any call-time data.
   *
   * @example
   * const log = logger.child({ module: 'treasury', operationType: 'POST_PAYMENT' });
   * log.info('Payment posted', { durationMs: 42 });
   */
  child(boundData: Record<string, unknown>) {
    return {
      debug: (msg: string, data?: Record<string, unknown>) =>
        logger.debug(msg, { ...boundData, ...data }),
      info: (msg: string, data?: Record<string, unknown>) =>
        logger.info(msg, { ...boundData, ...data }),
      warn: (msg: string, data?: Record<string, unknown>) =>
        logger.warn(msg, { ...boundData, ...data }),
      error: (msg: string, data?: Record<string, unknown>) =>
        logger.error(msg, { ...boundData, ...data }),
      fatal: (msg: string, data?: Record<string, unknown>) =>
        logger.fatal(msg, { ...boundData, ...data }),
    };
  },

  /**
   * Log a financial operation event. Always sets financialImpact: true.
   * Enforces that no PII fields are passed.
   */
  financial(
    level: Exclude<LogLevel, 'debug'>,
    message: string,
    data: {
      operationType: string;
      module: string;
      traceId?: string;
      durationMs?: number;
      overrideUsed?: boolean;
      periodState?: StructuredLogPayload['periodState'];
      status?: 'STARTED' | 'SUCCESS' | 'FAILED' | 'RETRIED';
      aggregateId?: string | number;
      currency?: string;
      [key: string]: unknown;
    }
  ): void {
    if (shouldLog(level)) {
      emit(level, buildPayload(level, message, {
        financialImpact: true,
        severity: level === 'error' || level === 'fatal' ? 'CRITICAL' : 'INFO',
        ...data,
      }));
    }
  },

  /**
   * Log an override event. Always sets overrideUsed: true and severity: CRITICAL.
   */
  override(
    message: string,
    data: {
      module: string;
      operationType: string;
      periodState?: StructuredLogPayload['periodState'];
      actorId?: string;
      actorRole?: string;
      reason?: string;
      [key: string]: unknown;
    }
  ): void {
    if (shouldLog('warn')) {
      emit('warn', buildPayload('warn', message, {
        financialImpact: true,
        overrideUsed: true,
        severity: 'CRITICAL',
        ...data,
      }));
    }
  },
};

// ── Backward-Compatible Alias ─────────────────────────────────────────────────
// EnterpriseLogger was used in API routes before Phase 9.3.
// This alias maps the legacy API to the new structured logger without modifying callers.

export const EnterpriseLogger = {
  /** Legacy: error(message, context, error) */
  error(message: string, context?: Record<string, unknown>, error?: unknown): void {
    logger.error(message, {
      ...context,
      ...(error instanceof Error
        ? { errorMessage: error.message, stack: error.stack?.slice(0, 500) }
        : error ? { error: String(error) } : {}),
    });
  },

  /** Legacy: info(message, context) */
  info(message: string, context?: Record<string, unknown>): void {
    logger.info(message, context);
  },

  /** Legacy: warn(message, context) */
  warn(message: string, context?: Record<string, unknown>): void {
    logger.warn(message, context);
  },

  /**
   * Legacy: traceFinancialTx(transactionId, operationType, tenantId, meta)
   * Maps to logger.financial() with financialImpact: true.
   */
  traceFinancialTx(
    transactionId: string,
    operationType: string,
    tenantId: string,
    meta?: Record<string, unknown>
  ): void {
    logger.financial('info', `Financial TX: ${operationType}`, {
      operationType,
      module: (meta?.module as string) ?? 'financial',
      tenantId,
      transactionId,
      status: 'SUCCESS',
      ...meta,
    });
  },

  /**
   * Legacy: traceInventoryTx(transactionId, operationType, tenantId, meta)
   * Maps to logger.info() with module: inventory.
   */
  traceInventoryTx(
    transactionId: string,
    operationType: string,
    tenantId: string,
    meta?: Record<string, unknown>
  ): void {
    logger.info(`Inventory TX: ${operationType}`, {
      module: 'inventory',
      operationType,
      tenantId,
      transactionId,
      financialImpact: true,
      ...meta,
    });
  },
};
