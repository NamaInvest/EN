import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rate-limit' });

/**
 * Rate Limiter Utility
 * ─────────────────────────────────────────────────────────────
 * Sliding window rate limiter for Next.js Middleware and APIs.
 * Prevents bursts and supports in-memory execution in Edge runtimes.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit';
 *   const result = await rateLimit(req, { max: 10, windowMs: 60_000 });
 *   if (!result.allowed) return new Response('Too many requests', { status: 429 });
 */

// In-memory sliding window store (timestamps array per identifier)
const store = new Map<string, number[]>();

// Cleanup old timestamps and empty keys every 5 minutes to prevent leaks
if (typeof setInterval !== 'undefined') {
    const cleanup = setInterval(() => {
        const now = Date.now();
        const cutoff = now - 300_000; // remove data older than 5 minutes
        for (const [key, timestamps] of store.entries()) {
            const filtered = timestamps.filter(t => t > cutoff);
            if (filtered.length === 0) {
                store.delete(key);
            } else {
                store.set(key, filtered);
            }
        }
    }, 300_000);
    if (cleanup.unref) cleanup.unref();
}

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
    const timestamps = store.get(key) || [];

    // Filter out timestamps outside the sliding window
    const filtered = timestamps.filter(t => now - t < windowMs);

    if (filtered.length >= max) {
        const oldest = filtered[0] || now;
        const resetAt = oldest + windowMs;
        store.set(key, filtered);
        log.warn(`Rate limit exceeded for key: ${key}. Count: ${filtered.length}/${max}`);
        return { allowed: false, remaining: 0, resetAt };
    }

    filtered.push(now);
    store.set(key, filtered);

    const remaining = Math.max(0, max - filtered.length);
    const oldest = filtered[0] || now;
    const resetAt = oldest + windowMs;

    return { allowed: true, remaining, resetAt };
}

/** Convenience: returns a NextResponse 429 or null */
export async function rateLimitOrReject(
    req: Request,
    options?: RateLimitOptions
): Promise<Response | null> {
    const result = await rateLimit(req, options);
    if (!result.allowed) {
        const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                message: 'تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
                retryAfter,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(options?.max || 10),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(result.resetAt),
                },
            }
        );
    }
    return null;
}

