import { rateLimit } from '@/lib/rate-limit';

describe('API Rate Limiter - Sliding Window Tests', () => {
    beforeEach(() => {
        // Clear modules cache or ensure clean store.
        // Since store is in-memory inside the module, we can use distinct keys for each test.
    });

    it('should allow requests within the limit and update remaining count', async () => {
        const req = new Request('http://localhost/api/test-route', {
            headers: {
                'x-forwarded-for': '1.2.3.4',
            },
        });

        // First request: count=1, limit=3
        const res1 = await rateLimit(req, { max: 3, windowMs: 10_000, keyFn: () => 'test-key-1' });
        expect(res1.allowed).toBe(true);
        expect(res1.remaining).toBe(2);

        // Second request: count=2, limit=3
        const res2 = await rateLimit(req, { max: 3, windowMs: 10_000, keyFn: () => 'test-key-1' });
        expect(res2.allowed).toBe(true);
        expect(res2.remaining).toBe(1);
    });

    it('should block requests that exceed the limit', async () => {
        const req = new Request('http://localhost/api/test-route', {
            headers: {
                'x-forwarded-for': '1.2.3.5',
            },
        });

        const opts = { max: 2, windowMs: 10_000, keyFn: () => 'test-key-2' };

        // 1st request
        await rateLimit(req, opts);
        // 2nd request
        await rateLimit(req, opts);
        // 3rd request (should be blocked)
        const res3 = await rateLimit(req, opts);
        expect(res3.allowed).toBe(false);
        expect(res3.remaining).toBe(0);
        expect(res3.resetAt).toBeGreaterThan(Date.now());
    });

    it('should allow requests again after the sliding window has elapsed', async () => {
        const req = new Request('http://localhost/api/test-route', {
            headers: {
                'x-forwarded-for': '1.2.3.6',
            },
        });

        // 1st request with a short window (500ms)
        const res1 = await rateLimit(req, { max: 1, windowMs: 500, keyFn: () => 'test-key-3' });
        expect(res1.allowed).toBe(true);

        // 2nd request immediately (should be blocked)
        const res2 = await rateLimit(req, { max: 1, windowMs: 500, keyFn: () => 'test-key-3' });
        expect(res2.allowed).toBe(false);

        // Wait for 600ms
        await new Promise(resolve => setTimeout(resolve, 600));

        // 3rd request (should be allowed now)
        const res3 = await rateLimit(req, { max: 1, windowMs: 500, keyFn: () => 'test-key-3' });
        expect(res3.allowed).toBe(true);
    });
});
