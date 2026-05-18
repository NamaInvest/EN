/**
 * Phase 9.2 — Correlation & Context Layer
 * ────────────────────────────────────────
 * Generates and retrieves stable correlationIds that flow through the entire
 * async call chain: API → Service → Outbox → Audit → Logs.
 *
 * The correlation system ensures:
 * - Every log line from a single request shares the same correlationId
 * - Financial traces can be reconstructed end-to-end from the correlationId
 * - Outbox events carry the requestId that triggered them
 */

import crypto from 'crypto';
import { getRequestContext } from './request-context';

/**
 * Returns the correlation ID for the current async context.
 * If no context is active (e.g., background jobs), generates a fresh ID.
 */
export function getCorrelationId(): string {
  const ctx = getRequestContext();
  return ctx?.requestId ?? crypto.randomUUID().slice(0, 8);
}

/**
 * Generates a new unique trace ID for financial operations.
 * Format: trace_<32-char-hex> for easy grep in logs.
 */
export function generateTraceId(): string {
  return `trace_${crypto.randomUUID().replace(/-/g, '')}`;
}

/**
 * Generates a new unique span ID for sub-operations within a trace.
 * Format: span_<16-char-hex>
 */
export function generateSpanId(): string {
  return `span_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Returns a correlation header object suitable for injecting
 * into outbound HTTP calls or event payloads.
 */
export function getCorrelationHeaders(): Record<string, string> {
  const ctx = getRequestContext();
  const headers: Record<string, string> = {
    'x-correlation-id': ctx?.requestId ?? crypto.randomUUID().slice(0, 8),
  };
  if (ctx?.tenantId) headers['x-tenant-id'] = ctx.tenantId;
  return headers;
}

/**
 * Builds a correlation context object for embedding in Outbox event payloads,
 * ensuring that emitted events can be linked back to the originating request.
 */
export function buildCorrelationMeta(): Record<string, string | undefined> {
  const ctx = getRequestContext();
  return {
    requestId: ctx?.requestId,
    tenantId: ctx?.tenantId,
    actorId: ctx?.actorId,
    actorRole: ctx?.actorRole,
    module: ctx?.module,
  };
}
