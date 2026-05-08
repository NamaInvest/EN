import { NextRequest, NextResponse } from 'next/server';
import IORedis from 'ioredis';

// Shared Redis connection for idempotency
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new IORedis(redisUrl, {
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours

export async function withIdempotency<T>(
  req: NextRequest,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const key = req.headers.get('Idempotency-Key');

  if (!key) {
    // If no key is provided, we just process the request normally.
    return await handler();
  }

  const cacheKey = `idempotency:${key}`;

  // Check if already processed
  const cached = await redis.get(cacheKey);
  if (cached) {
    const { status, body } = JSON.parse(cached);
    return NextResponse.json(body, { status, headers: { 'X-Idempotent-Replay': 'true' } });
  }

  // Lock (prevent concurrent duplicate requests)
  const lockKey = `${cacheKey}:lock`;
  // SET NX (Not exists) EX (Expiry 30s)
  const acquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  
  if (!acquired) {
    return NextResponse.json({ error: 'IDEMPOTENCY_IN_PROGRESS' }, { status: 409 });
  }

  try {
    const result = await handler();
    
    // Check if the result is already a NextResponse
    const response = result instanceof NextResponse ? result : NextResponse.json(result);
    const status = response.status;
    
    // We clone the response to read its body without consuming the original
    let body;
    try {
        body = await response.clone().json();
    } catch {
        // Fallback for non-JSON bodies (or if body is empty)
        body = {};
    }

    // Cache the result
    await redis.set(cacheKey, JSON.stringify({ status, body }), 'EX', IDEMPOTENCY_TTL);

    return response;
  } finally {
    // Release the lock
    await redis.del(lockKey);
  }
}
