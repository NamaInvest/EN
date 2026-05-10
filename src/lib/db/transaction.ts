/**
 * @fileoverview Prisma Transaction Retry Utility
 *
 * Wraps `prisma.$transaction()` with exponential back-off retry logic
 * to handle transient PostgreSQL serialization failures gracefully.
 *
 * The 53 routes using `$transaction` without retry are vulnerable to:
 * - `P2034`: Transaction conflict (Prisma serialization error)
 * - `40001`: PostgreSQL serialization failure
 * - `40P01`: Deadlock detected
 *
 * @module db/transaction
 */

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'db-transaction' });

/** Options for controlling retry behavior */
export interface TransactionRetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 100) */
  initialDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay cap in ms (default: 2000) */
  maxDelayMs?: number;
  /** Operation name for structured logging */
  operationName?: string;
}

/** PostgreSQL/Prisma error codes that are safe to retry */
const RETRYABLE_CODES = new Set([
  'P2034',   // Transaction conflict (Prisma)
  '40001',   // Serialization failure (PostgreSQL)
  '40P01',   // Deadlock detected (PostgreSQL)
  'P1017',   // Server closed connection (transient)
]);

function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as any;
  // Prisma error code
  if (e.code && RETRYABLE_CODES.has(e.code)) return true;
  // PostgreSQL error in message
  if (typeof e.message === 'string') {
    return (
      e.message.includes('could not serialize access') ||
      e.message.includes('deadlock detected') ||
      e.message.includes('connection was closed')
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a Prisma `$transaction` with automatic exponential-backoff retry.
 *
 * @example
 * ```ts
 * // Instead of:
 * await prisma.$transaction([...])
 *
 * // Use:
 * await withTransaction(prisma, async (tx) => {
 *   await tx.salesInvoice.update({ ... });
 *   await tx.journal.create({ ... });
 * }, { operationName: 'post-invoice', maxRetries: 3 });
 * ```
 *
 * @param prisma - Prisma client instance
 * @param fn - Transaction callback receiving a Prisma transaction client
 * @param options - Retry configuration
 * @returns Result of the transaction callback
 * @throws Re-throws non-retryable errors immediately
 */
export async function withTransaction<T>(
  prisma: any,
  fn: (tx: any) => Promise<T>,
  options: TransactionRetryOptions = {}
): Promise<T> {
  const {
    maxRetries       = 3,
    initialDelayMs   = 100,
    backoffMultiplier = 2,
    maxDelayMs       = 2000,
    operationName    = 'transaction',
  } = options;

  let attempt = 0;
  let delayMs = initialDelayMs;

  while (true) {
    attempt++;
    try {
      const result = await prisma.$transaction(fn);
      if (attempt > 1) {
        log.info(`Transaction '${operationName}' succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error: unknown) {
      if (!isRetryable(error) || attempt >= maxRetries) {
        if (attempt > 1) {
          log.error(`Transaction '${operationName}' failed permanently after ${attempt} attempts`, {
            error: (error as any)?.message,
            code:  (error as any)?.code,
          });
        }
        throw error;
      }

      const actualDelay = Math.min(delayMs, maxDelayMs);
      log.warn(`Transaction '${operationName}' failed (attempt ${attempt}/${maxRetries}), retrying in ${actualDelay}ms`, {
        code:  (error as any)?.code,
        error: (error as any)?.message,
      });

      await sleep(actualDelay);
      delayMs *= backoffMultiplier;
    }
  }
}

/**
 * Simpler wrapper for the common case: run multiple Prisma operations atomically.
 * Uses default retry settings (3 attempts, 100ms initial delay).
 *
 * @example
 * ```ts
 * const result = await atomically(prisma, async (tx) => {
 *   const inv = await tx.salesInvoice.update({ where: { id }, data: { status: 'posted' } });
 *   await tx.journal.create({ data: buildJournalEntry(inv) });
 *   return inv;
 * }, 'post-sales-invoice');
 * ```
 */
export async function atomically<T>(
  prisma: any,
  fn: (tx: any) => Promise<T>,
  operationName?: string
): Promise<T> {
  return withTransaction(prisma, fn, { operationName });
}
