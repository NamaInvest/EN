import IORedis from 'ioredis';

// Use Redis for rate limiting to survive process restarts and scale across pods
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new IORedis(redisUrl);

export class RateLimiter {
    /**
     * Check if a request should be rate-limited using Redis
     * @param identifier IP address, API Key, or User ID
     * @param limit Maximum requests allowed
     * @param windowMs Time window in milliseconds
     */
    static async checkLimit(identifier: string, limit: number = 100, windowMs: number = 60000): Promise<{ allowed: boolean, remaining: number }> {
        const key = `rate_limit:${identifier}`;
        
        try {
            // Using Redis MULTI to ensure atomicity
            const multi = redis.multi();
            multi.incr(key);
            multi.pttl(key);
            
            const results = await multi.exec();
            if (!results) return { allowed: true, remaining: limit - 1 };

            const count = results[0][1] as number;
            const ttl = results[1][1] as number;

            // If it's the first request (ttl === -1), set the expiration
            if (count === 1 || ttl === -1) {
                await redis.pexpire(key, windowMs);
                return { allowed: true, remaining: limit - 1 };
            }

            if (count > limit) {
                return { allowed: false, remaining: 0 };
            }

            return { allowed: true, remaining: limit - count };
        } catch (error) {
            console.error('Redis Rate Limiter Error:', error);
            // Fail open if Redis is down
            return { allowed: true, remaining: 1 };
        }
    }

    /**
     * Cleanup is handled automatically by Redis TTL expiration.
     */
    static cleanup() {
        // No-op for Redis
    }
}
