import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.vector.embed' });

export class EmbeddingCache {
  async get(text: string, model: string): Promise<number[] | null> {
    // Stub cache hit
    return null;
  }

  async set(text: string, model: string, embedding: number[]): Promise<void> {
    // Stub cache set
  }
}
