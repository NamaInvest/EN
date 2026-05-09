/**
 * Rate Limiter — In-process sliding window (Edge + Node.js compatible)
 *
 * Usage:
 *   import { rateLimit } from '@/lib/api/rate-limit';
 *   const { success, remaining, retryAfter } = rateLimit('ip:1.2.3.4', { limit: 60, windowMs: 60_000 });
 *   if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 *
 * Presets:
 *   RATE_LIMIT_AUTH      — 5 requests / 15 min  (brute-force protection)
 *   RATE_LIMIT_AI        — 20 requests / 1 min   (LLM cost protection)
 *   RATE_LIMIT_FINANCIAL — 30 requests / 1 min   (financial write protection)
 *   RATE_LIMIT_DEFAULT   — 120 requests / 1 min  (general API)
 */

interface RateLimitEntry {
  count:      number;
  windowStart: number;
}

interface RateLimitOptions {
  limit:    number;  // max requests
  windowMs: number;  // window in ms
}

interface RateLimitResult {
  success:    boolean;
  remaining:  number;
  retryAfter: number;  // seconds until reset
  limit:      number;
}

// ── In-memory store (shared across requests in same process) ──────────────────
// In production with multiple replicas, replace with Redis via ioredis
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (run every 5 minutes)
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 3_600_000) { // 1 hour TTL
        store.delete(key);
      }
    }
  }, 300_000); // 5 minutes
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  scheduleCleanup();

  const { limit, windowMs } = options;
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { success: true, remaining: limit - 1, retryAfter: 0, limit };
  }

  if (entry.count >= limit) {
    const resetAt    = entry.windowStart + windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    return { success: false, remaining: 0, retryAfter, limit };
  }

  entry.count++;
  return {
    success:    true,
    remaining:  limit - entry.count,
    retryAfter: 0,
    limit,
  };
}

// ── Helper to extract best client IP ─────────────────────────────────────────
export function getClientIp(req: { headers: { get: (key: string) => string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||  // Cloudflare
    'unknown'
  );
}

// ── Named presets ─────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
  AUTH:      { limit: 5,   windowMs: 15 * 60_000 },  // 5 req / 15 min
  AI:        { limit: 20,  windowMs: 60_000 },         // 20 req / 1 min
  FINANCIAL: { limit: 30,  windowMs: 60_000 },         // 30 req / 1 min
  SENSITIVE: { limit: 5,   windowMs: 60_000 },         // 5 req / 1 min (PII/medical)
  UPLOAD:    { limit: 10,  windowMs: 60_000 },         // 10 req / 1 min
  DEFAULT:   { limit: 120, windowMs: 60_000 },         // 120 req / 1 min
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMITS;

/**
 * Quick helper — returns 429 Response or null (no block)
 * Usage: const block = checkRateLimit(req, 'AUTH'); if (block) return block;
 */
export function checkRateLimit(
  req: { headers: { get: (key: string) => string | null }; nextUrl?: { pathname: string } },
  preset: RateLimitPreset = 'DEFAULT',
  customKey?: string,
): Response | null {
  const ip      = getClientIp(req);
  const path    = (req as any).nextUrl?.pathname ?? 'unknown';
  const key     = customKey ?? `${preset}:${ip}:${path}`;
  const options = RATE_LIMITS[preset];
  const result  = rateLimit(key, options);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.', retryAfter: result.retryAfter }),
      {
        status:  429,
        headers: {
          'Content-Type':      'application/json',
          'Retry-After':       String(result.retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}
