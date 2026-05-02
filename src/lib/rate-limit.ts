// Simple In-Memory Rate Limiter (For production, use Redis)
const rateLimitCache = new Map<string, { count: number, resetAt: number }>();

export class RateLimiter {
    /**
     * Check if a request should be rate-limited
     * @param identifier IP address, API Key, or User ID
     * @param limit Maximum requests allowed
     * @param windowMs Time window in milliseconds
     */
    static checkLimit(identifier: string, limit: number = 100, windowMs: number = 60000): { allowed: boolean, remaining: number } {
        const now = Date.now();
        const record = rateLimitCache.get(identifier);

        if (!record || now > record.resetAt) {
            // New window
            rateLimitCache.set(identifier, {
                count: 1,
                resetAt: now + windowMs
            });
            return { allowed: true, remaining: limit - 1 };
        }

        if (record.count >= limit) {
            return { allowed: false, remaining: 0 };
        }

        record.count++;
        return { allowed: true, remaining: limit - record.count };
    }

    /**
     * Cleanup expired cache entries (Call this periodically if using Map)
     */
    static cleanup() {
        const now = Date.now();
        for (const [key, value] of rateLimitCache.entries()) {
            if (now > value.resetAt) {
                rateLimitCache.delete(key);
            }
        }
    }
}
