import { EmbeddingCache } from './cache';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vector.embedding.gemini.embedder' });

export class GeminiEmbedder {
  constructor(
    private cache: EmbeddingCache
  ) {}

  async embed(text: string): Promise<number[]> {
    const cached = await this.cache.get(text, 'text-embedding-004');
    if (cached) return cached;

    // Stub Gemini embedder
    const embedding = [0.1, 0.2, 0.3];
    await this.cache.set(text, 'text-embedding-004', embedding);

    return embedding;
  }

  async embedBatch(texts: string[], options: { batchSize?: number } = {}): Promise<number[][]> {
    const batchSize = options.batchSize || 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const embeddings = batch.map(() => [0.1, 0.2, 0.3]);
      results.push(...embeddings);
    }

    return results;
  }
}
