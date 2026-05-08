// src/lib/vector/embedding/cache.ts
// Redis-based embedding cache — 7-day TTL, keyed by SHA-256(model:text).
// Prevents duplicate API calls for the same text chunks.

import { createHash } from 'crypto';

export interface EmbeddingCacheBackend {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
}

export class EmbeddingCache {
  private readonly TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(private redis: EmbeddingCacheBackend) {}

  async get(text: string, model: string): Promise<number[] | null> {
    const key = this.buildKey(text, model);
    const cached = await this.redis.get(key);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as number[];
    } catch {
      return null;
    }
  }

  async set(text: string, model: string, embedding: number[]): Promise<void> {
    const key = this.buildKey(text, model);
    await this.redis.setex(key, this.TTL, JSON.stringify(embedding));
  }

  private buildKey(text: string, model: string): string {
    const hash = createHash('sha256').update(`${model}:${text}`).digest('hex');
    return `embed:${model}:${hash}`;
  }
}
