/**
 * Phase 9.2 — Unified Request Context (AsyncLocalStorage)
 * ────────────────────────────────────────────────────────
 * Provides automatic propagation of correlationId, tenantId, actorId,
 * and module throughout the entire async call chain without prop-drilling.
 *
 * Usage (automatically injected by withApiHandler):
 *   const ctx = getRequestContext();
 *   ctx?.requestId   // correlationId for this request
 *   ctx?.tenantId    // authenticated tenant
 *   ctx?.actorId     // authenticated user id
 *   ctx?.actorRole   // authenticated user role
 *   ctx?.module      // ERP domain module (sales, treasury, hr…)
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  /** Unique ID for this HTTP request — the primary correlation key */
  requestId: string;
  /** Authenticated tenant — never client-supplied */
  tenantId?: string;
  /** Authenticated actor ID */
  actorId?: string;
  /** Authenticated actor role */
  actorRole?: string;
  /** ERP domain module inferred from route path */
  module?: string;
  /** ISO timestamp when request was received */
  startedAt?: string;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

/** Get the current request context from AsyncLocalStorage */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStore.getStore();
}

/**
 * Run a function within an explicit request context.
 * Used by withApiHandler. Can also be used in tests to inject context.
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => Promise<T> | T
): Promise<T> | T {
  return requestContextStore.run(context, fn);
}

/**
 * Create a child context that inherits the current context
 * but allows overriding specific fields (e.g., for sub-operations).
 */
export function createChildContext(overrides: Partial<RequestContext>): RequestContext {
  const parent = getRequestContext();
  return {
    ...parent,
    ...overrides,
    // Always preserve the original requestId for correlation
    requestId: parent?.requestId ?? overrides.requestId ?? 'unset',
  };
}
