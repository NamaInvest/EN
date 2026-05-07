/**
 * AI-12 — Redis-compatible Rate Limiter
 * In-memory sliding window implementation. Replace Map with Redis for multi-instance.
 */

interface RateLimitEntry {
    tokens: number;
    windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
    // AI endpoints (stricter)
    'ai:free':       { maxRequests: 10, windowMs: 60_000 },      // 10/min
    'ai:pro':        { maxRequests: 50, windowMs: 60_000 },      // 50/min
    'ai:enterprise': { maxRequests: 200, windowMs: 60_000 },     // 200/min

    // General API
    'api:free':       { maxRequests: 100, windowMs: 60_000 },    // 100/min
    'api:pro':        { maxRequests: 500, windowMs: 60_000 },    // 500/min
    'api:enterprise': { maxRequests: 2000, windowMs: 60_000 },   // 2000/min

    // Per-IP (unauthenticated)
    'ip:default':     { maxRequests: 30, windowMs: 60_000 },     // 30/min
};

/**
 * Check and consume a rate limit token.
 * Returns { allowed, remaining, retryAfterMs }.
 */
export function checkRateLimit(
    key: string, // e.g. "ai:free:tenant123" or "ip:default:192.168.1.1"
    tier: string = 'api:free'
): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const config = TIER_LIMITS[tier] || TIER_LIMITS['api:free'];
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now - entry.windowStart > config.windowMs) {
        // New window
        entry = { tokens: config.maxRequests - 1, windowStart: now };
        store.set(key, entry);
        return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
    }

    if (entry.tokens > 0) {
        entry.tokens--;
        return { allowed: true, remaining: entry.tokens, retryAfterMs: 0 };
    }

    // Rate limited
    const retryAfterMs = config.windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
}

/**
 * Get rate limit headers for HTTP response.
 */
export function getRateLimitHeaders(key: string, tier: string = 'api:free'): Record<string, string> {
    const config = TIER_LIMITS[tier] || TIER_LIMITS['api:free'];
    const entry = store.get(key);
    const remaining = entry?.tokens ?? config.maxRequests;

    return {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil((entry?.windowStart || Date.now()) / 1000 + config.windowMs / 1000)),
    };
}

/**
 * Cleanup expired entries (call periodically).
 */
export function cleanupRateLimits(): number {
    const now = Date.now();
    let cleaned = 0;
    store.forEach((entry, key) => {
        if (now - entry.windowStart > 300_000) { // 5 min stale
            store.delete(key);
            cleaned++;
        }
    });
    return cleaned;
}
