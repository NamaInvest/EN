/**
 * Idempotency Key Engine
 * ──────────────────────────────────────────────────────────
 * Prevents duplicate financial operations (payments, invoices, journal entries).
 * Each request with an `X-Idempotency-Key` header will be cached for 24h.
 * If the same key is sent again, the cached response is returned.
 *
 * Usage in API routes:
 *   import { idempotency } from '@/lib/idempotency';
 *
 *   export const POST = withApiHandler(async (req, ctx) => {
 *     const cached = await idempotency.check(req);
 *     if (cached) return cached;
 *     // ... do work ...
 *     await idempotency.save(req, response);
 *     return response;
 *   });
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'Idempotency' });

interface StoredResponse {
  status: number;
  body: unknown;
  createdAt: number;
}

const STORE = new Map<string, StoredResponse>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired entries every 30 minutes
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of STORE.entries()) {
    if (now - entry.createdAt > TTL) STORE.delete(key);
  }
}, 30 * 60 * 1000);
if (cleanup.unref) cleanup.unref();

function extractKey(req: Request): string | null {
  return req.headers.get('x-idempotency-key') || req.headers.get('idempotency-key');
}

export const idempotency = {
  /**
   * Check if this request was already processed.
   * Returns the cached Response if found, null if new.
   */
  check(req: Request): Response | null {
    const key = extractKey(req);
    if (!key) return null;

    const existing = STORE.get(key);
    if (!existing) return null;

    // Check TTL
    if (Date.now() - existing.createdAt > TTL) {
      STORE.delete(key);
      return null;
    }

    log.info(`Idempotency hit: ${key}`);
    return new Response(JSON.stringify(existing.body), {
      status: existing.status,
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Replayed': 'true',
      },
    });
  },

  /**
   * Save a response for this idempotency key.
   * Call after successfully processing the request.
   */
  save(req: Request, status: number, body: unknown): void {
    const key = extractKey(req);
    if (!key) return;

    STORE.set(key, {
      status,
      body,
      createdAt: Date.now(),
    });

    log.info(`Idempotency saved: ${key}`);
  },

  /** Check if key exists without returning response */
  has(req: Request): boolean {
    const key = extractKey(req);
    return key ? STORE.has(key) : false;
  },

  /** Stats */
  stats(): { size: number; ttlHours: number } {
    return { size: STORE.size, ttlHours: TTL / 3600000 };
  },
};
