import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rate-limit' });

/**
 * Rate Limiter Utility
 * ─────────────────────────────────────────────────────────────
 * In-memory rate limiter for sensitive API routes (auth, MFA, etc.)
 * Uses sliding window algorithm.
 *
 * Usage in route.ts:
 *   import { rateLimit } from '@/lib/rate-limit';
 *   const allowed = await rateLimit(req, { max: 5, windowMs: 60_000 });
 *   if (!allowed) return new Response('Too many requests', { status: 429 });
 */

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

// In-memory store (resets on server restart — OK for edge/serverless)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart > 300_000) {
            store.delete(key);
        }
    }
}, 300_000);

interface RateLimitOptions {
    max?: number;        // max requests per window (default: 10)
    windowMs?: number;   // window in ms (default: 60_000 = 1 minute)
    keyFn?: (req: Request) => string;  // custom key function
}

export async function rateLimit(
    req: Request,
    options: RateLimitOptions = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const { max = 10, windowMs = 60_000, keyFn } = options;

    // Build rate limit key from IP + path
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
    const path = new URL(req.url).pathname;
    const key = keyFn ? keyFn(req) : `${ip}:${path}`;

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        // Start new window
        store.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
    }

    entry.count++;
    const remaining = Math.max(0, max - entry.count);
    const resetAt = entry.windowStart + windowMs;

    if (entry.count > max) {
        return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining, resetAt };
}

/** Convenience: returns a NextResponse 429 or null */
export async function rateLimitOrReject(
    req: Request,
    options?: RateLimitOptions
): Promise<Response | null> {
    const result = await rateLimit(req, options);
    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                    'X-RateLimit-Limit': String(options?.max || 10),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(result.resetAt),
                },
            }
        );
    }
    return null;
}
