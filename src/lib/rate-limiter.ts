import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.rate-limiter' });

/**
 * Rate Limiter
 * ──────────────────────────────────────────────────────────
 * Token bucket rate limiter for API routes.
 * Prevents abuse and protects financial endpoints.
 *
 * Usage:
 *   import { rateLimiter } from '@/lib/rate-limiter';
 *   const result = rateLimiter.check(clientIp, 'api', 60, 60); // 60 req/min
 *   if (!result.allowed) return Response.json({ error: 'Rate limited' }, { status: 429 });
 */

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, BucketEntry>();

// Cleanup every 5 minutes
const cleanup = setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, entry] of buckets.entries()) {
    if (entry.lastRefill < cutoff) buckets.delete(key);
  }
}, 5 * 60 * 1000);
if (cleanup.unref) cleanup.unref();

export const rateLimiter = {
  /**
   * Check if request is allowed.
   * @param identifier - Client IP or user ID
   * @param scope - Rate limit scope (e.g., 'api', 'auth', 'financial')
   * @param maxTokens - Max requests per window
   * @param windowSeconds - Time window in seconds
   */
  check(identifier: string, scope: string = 'api', maxTokens: number = 60, windowSeconds: number = 60): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
  } {
    const key = `${scope}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let entry = buckets.get(key);

    if (!entry) {
      entry = { tokens: maxTokens - 1, lastRefill: now };
      buckets.set(key, entry);
      return { allowed: true, remaining: entry.tokens, resetMs: windowMs };
    }

    // Refill tokens based on elapsed time
    const elapsed = now - entry.lastRefill;
    const refillRate = maxTokens / windowMs;
    const refill = Math.floor(elapsed * refillRate);

    if (refill > 0) {
      entry.tokens = Math.min(maxTokens, entry.tokens + refill);
      entry.lastRefill = now;
    }

    if (entry.tokens > 0) {
      entry.tokens--;
      return { allowed: true, remaining: entry.tokens, resetMs: Math.ceil((1 / refillRate)) };
    }

    const resetMs = Math.ceil((1 - entry.tokens) / refillRate);
    return { allowed: false, remaining: 0, resetMs };
  },

  /** Reset limiter for an identifier */
  reset(identifier: string, scope: string = 'api'): void {
    buckets.delete(`${scope}:${identifier}`);
  },

  /** Stats */
  stats(): { activeBuckets: number } {
    return { activeBuckets: buckets.size };
  },
};

// ── Pre-configured limiters ──
export const RATE_LIMITS = {
  auth: { maxTokens: 5, windowSeconds: 300 },      // 5 login attempts per 5 min
  api: { maxTokens: 120, windowSeconds: 60 },       // 120 req/min
  financial: { maxTokens: 30, windowSeconds: 60 },  // 30 financial ops/min
  export: { maxTokens: 5, windowSeconds: 300 },     // 5 exports per 5 min
  ai: { maxTokens: 10, windowSeconds: 60 },         // 10 AI calls/min
} as const;
