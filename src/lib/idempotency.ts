import { redisConnection } from '@/lib/queue';
import { logger } from '@/lib/logger';
import { NextResponse, NextRequest } from 'next/server';

const log = logger.child({ service: 'idempotency' });

/**
 * Checks and sets an idempotency key in Redis.
 * Format: idempotency:{tenantId}:{routeName}:{idempotencyKey}
 * Returns true if the request is unique and can proceed.
 * Returns false if the request is a duplicate (already processing or completed).
 */
export async function lockIdempotencyKey(tenantId: string, routeName: string, idempotencyKey: string, ttlSeconds = 86400): Promise<boolean> {
    const key = `idempotency:${tenantId}:${routeName}:${idempotencyKey}`;
    try {
        // SET NX: Set only if it does NOT exist.
        // EX: Expire after ttlSeconds
        const result = await redisConnection.set(key, 'PROCESSING', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    } catch (err) {
        log.error('[Idempotency] Failed to check key, failing closed', { tenantId, routeName, idempotencyKey, error: (err as Error).message });
        return false; 
    }
}

/**
 * Marks an idempotency key as COMPLETED.
 */
export async function completeIdempotencyKey(tenantId: string, routeName: string, idempotencyKey: string, ttlSeconds = 86400): Promise<void> {
    const key = `idempotency:${tenantId}:${routeName}:${idempotencyKey}`;
    try {
        await redisConnection.set(key, 'COMPLETED', 'EX', ttlSeconds);
    } catch (err) {
        log.error('[Idempotency] Failed to mark key as completed', { tenantId, routeName, idempotencyKey, error: (err as Error).message });
    }
}

/**
 * Deletes an idempotency key on failure to allow retry.
 */
export async function unlockIdempotencyKey(tenantId: string, routeName: string, idempotencyKey: string): Promise<void> {
    const key = `idempotency:${tenantId}:${routeName}:${idempotencyKey}`;
    try {
        await redisConnection.del(key);
    } catch (err) {
        log.error('[Idempotency] Failed to delete key', { tenantId, routeName, idempotencyKey, error: (err as Error).message });
    }
}

/**
 * Higher Order Function to wrap an API route handler with idempotency.
 * Added for backward compatibility with older routes using this pattern.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withIdempotency(
    req: NextRequest | any,
    endpoint: string,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    const tenantId = req.headers.get('x-tenant') || 'default';
    const key = req.headers.get('Idempotency-Key') || req.headers.get('x-idempotency-key');
    
    // If no key is provided, bypass idempotency
    if (!key) {
        return handler();
    }
    
    const isUnique = await lockIdempotencyKey(tenantId, endpoint, key);
    if (!isUnique) {
        return NextResponse.json(
            { success: false, message: 'Duplicate request detected or currently processing.' },
            { status: 409 }
        );
    }
    
    try {
        const response = await handler();
        
        // Only mark as completed if successful
        if (response.status >= 200 && response.status < 400) {
            await completeIdempotencyKey(tenantId, endpoint, key);
        } else {
            await unlockIdempotencyKey(tenantId, endpoint, key);
        }
        
        return response;
    } catch (err) {
        await unlockIdempotencyKey(tenantId, endpoint, key);
        throw err;
    }
}
