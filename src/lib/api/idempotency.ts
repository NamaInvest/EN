/**
 * Idempotency Keys Middleware — P2.7
 * ─────────────────────────────────────────────────────────────────────────────
 * Prevents duplicate financial operations by caching responses keyed on
 * X-Idempotency-Key header (UUID v4).
 *
 * Usage in route handler:
 *   import { withIdempotency } from '@/lib/api/idempotency';
 *   export const POST = withRoute(withIdempotency(handler), { rateLimit: 'DEFAULT' });
 *
 * Flow:
 *   1. Client sends X-Idempotency-Key: <uuid>
 *   2. If key seen before → return cached response (200)
 *   3. If new key → execute handler, cache result for 24h
 *   4. If key missing on non-critical routes → proceed normally
 *
 * Storage: In-memory Map (upgrade to Redis in production)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { RouteContext } from '@/lib/api/with-route';

const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours (kept for compat)

// ── In-memory store (swap for Redis in prod) ──────────────────────────────────
interface CachedResponse {
  status:   number;
  body:     unknown;
  cachedAt: number;
  expiresAt: number;
}

const idempotencyCache = new Map<string, CachedResponse>();
const TTL_MS = IDEMPOTENCY_TTL * 1000;

// Cleanup expired entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now > entry.expiresAt) idempotencyCache.delete(key);
  }
}, 30 * 60 * 1000);

// ── Constants ─────────────────────────────────────────────────────────────────
const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Legacy NextRequest API (for simple use) ───────────────────────────────────
export async function withIdempotency<T>(
  req: NextRequest,
  handler: () => Promise<T | NextResponse>
): Promise<T | NextResponse> {
  const key = req.headers.get(IDEMPOTENCY_HEADER) ?? req.headers.get('Idempotency-Key');

  if (!key) {
    return await handler();
  }

  if (!UUID_REGEX.test(key)) {
    return NextResponse.json({ error: `${IDEMPOTENCY_HEADER} must be a valid UUID v4` }, { status: 400 });
  }

  const cacheKey = `idempotency:${key}`;

  const cached = idempotencyCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: {
        'X-Idempotent-Replay': 'true',
        'X-Idempotency-Key': key,
        'X-Idempotency-Cached-At': new Date(cached.cachedAt).toISOString(),
      },
    }) as unknown as T;
  }

  const result = await handler();
  const response = result instanceof NextResponse ? result : NextResponse.json(result);

  // Cache 2xx responses
  if (response.status >= 200 && response.status < 300) {
    try {
      const body = await response.clone().json();
      idempotencyCache.set(cacheKey, {
        status: response.status,
        body,
        cachedAt: Date.now(),
        expiresAt: Date.now() + TTL_MS,
      });
    } catch { /* non-JSON, skip */ }
  }

  return response as unknown as T;
}

// ── RouteContext wrapper (for withRoute integration) ──────────────────────────
export type RouteHandler = (ctx: RouteContext, context?: any) => Promise<Response | NextResponse>;

export function withIdempotencyMiddleware(handler: RouteHandler, options?: {
  required?: boolean;
  ttl?: number;
}): RouteHandler {
  const ttl = options?.ttl ?? TTL_MS;
  const required = options?.required ?? false;

  return async (ctx: RouteContext, context?: any): Promise<Response | NextResponse> => {
    const key = ctx.req.headers.get(IDEMPOTENCY_HEADER);

    if (key) {
      if (!UUID_REGEX.test(key)) {
        return NextResponse.json({ error: `${IDEMPOTENCY_HEADER} must be a valid UUID v4` }, { status: 400 });
      }

      const tenantId = ctx.auth?.tenantId ?? 'global';
      const cacheKey = `${tenantId}:${key}`;

      const cached = idempotencyCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        const response = NextResponse.json(cached.body, { status: cached.status });
        response.headers.set('X-Idempotency-Replayed', 'true');
        response.headers.set('X-Idempotency-Cached-At', new Date(cached.cachedAt).toISOString());
        return response;
      }

      const result = await handler(ctx, context);
      if (result.status >= 200 && result.status < 300) {
        try {
          const body = await result.clone().json();
          idempotencyCache.set(cacheKey, {
            status: result.status, body,
            cachedAt: Date.now(), expiresAt: Date.now() + ttl,
          });
        } catch { /* non-JSON */ }
      }

      return result;
    }

    if (required) {
      return NextResponse.json(
        { error: `${IDEMPOTENCY_HEADER} header is required for this operation` },
        { status: 400 }
      );
    }

    return handler(ctx, context);
  };
}

// ── Stats helper (for monitoring) ────────────────────────────────────────────
export function getIdempotencyCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  for (const entry of idempotencyCache.values()) {
    if (now < entry.expiresAt) active++;
    else expired++;
  }
  return { total: idempotencyCache.size, active, expired };
}
