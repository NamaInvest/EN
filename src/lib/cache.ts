import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cache' });

/**
 * In-Memory Cache Engine
 * ──────────────────────────────────────────────────────────
 * LRU-like cache with TTL expiration for frequently-queried data.
 * No external dependencies (Redis-free). Ideal for:
 * - Account chart lookups
 * - Product/category lists
 * - Settings/config reads
 * - Dashboard aggregate queries
 *
 * Usage:
 *   import { cache } from '@/lib/cache';
 *
 *   // Simple get/set
 *   const accounts = await cache.getOrSet('accounts:all', 120, async () => {
 *     return prisma.account.findMany();
 *   });
 *
 *   // Invalidate
 *   cache.invalidate('accounts:*'); // wildcard support
 *   cache.invalidatePrefix('products'); // prefix-based
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
  hits: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private maxSize: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    // Cleanup expired entries every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 120_000);
    // Don't block Node.js from exiting
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  /**
   * Get a cached value, or compute & cache it if missing/expired
   * @param key - Cache key (e.g., 'accounts:all', 'products:tenant:n11')
   * @param ttlSeconds - Time-to-live in seconds (default: 60)
   * @param factory - Async function to compute the value on cache miss
   */
  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const existing = this.store.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      existing.hits++;
      return existing.data as T;
    }

    // Cache miss — compute
    const data = await factory();

    // Evict oldest if at capacity
    if (this.store.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      hits: 1,
    });

    return data;
  }

  /** Get without computing */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) this.store.delete(key);
      return undefined;
    }
    entry.hits++;
    return entry.data as T;
  }

  /** Set directly */
  set<T>(key: string, data: T, ttlSeconds = 60): void {
    if (this.store.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      hits: 1,
    });
  }

  /** Invalidate a single key */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix (e.g., 'accounts') */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Invalidate with wildcard pattern (e.g., 'accounts:*') */
  invalidate(pattern: string): number {
    if (!pattern.includes('*')) {
      return this.delete(pattern) ? 1 : 0;
    }
    const prefix = pattern.split('*')[0];
    return this.invalidatePrefix(prefix);
  }

  /** Clear entire cache */
  clear(): void {
    this.store.clear();
  }

  /** Get cache stats */
  stats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      keys: [...this.store.keys()],
    };
  }

  // ── Internal ──

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private evictLeastUsed(): void {
    let minHits = Infinity;
    let evictKey = '';
    for (const [key, entry] of this.store.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        evictKey = key;
      }
    }
    if (evictKey) this.store.delete(evictKey);
  }
}

// ── Singleton ──
const globalForCache = globalThis as unknown as { __cache?: MemoryCache };
export const cache = globalForCache.__cache || new MemoryCache(500);
if (process.env.NODE_ENV !== 'production') globalForCache.__cache = cache;
