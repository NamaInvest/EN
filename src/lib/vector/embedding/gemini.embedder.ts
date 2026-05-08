// src/lib/vector/embedding/gemini.embedder.ts
// Google text-embedding-004 embedder with Redis caching and batch support.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingCache } from './cache';

const MODEL = 'text-embedding-004';
const BATCH_SIZE = 100;

export class GeminiEmbedder {
  private genAI: GoogleGenerativeAI;

  constructor(
    apiKey: string,
    private cache: EmbeddingCache
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /** Embed a single text with caching. */
  async embed(text: string): Promise<number[]> {
    const cached = await this.cache.get(text, MODEL);
    if (cached) return cached;

    const model = this.genAI.getGenerativeModel({ model: MODEL });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    await this.cache.set(text, MODEL, embedding);
    return embedding;
  }

  /** Embed multiple texts efficiently with batching and cache lookup. */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = new Array(texts.length);

    // Check cache for all
    const cached = await Promise.all(texts.map((t) => this.cache.get(t, MODEL)));

    // Collect missing indices
    const missing: { idx: number; text: string }[] = [];
    cached.forEach((c, i) => {
      if (c !== null) {
        results[i] = c;
      } else {
        missing.push({ idx: i, text: texts[i] });
      }
    });

    // Process in batches
    for (let b = 0; b < missing.length; b += BATCH_SIZE) {
      const batch = missing.slice(b, b + BATCH_SIZE);
      const model = this.genAI.getGenerativeModel({ model: MODEL });

      const batchResult = await model.batchEmbedContents({
        requests: batch.map((m) => ({
          content: { parts: [{ text: m.text }], role: 'user' },
        })),
      });

      const newEmbeddings = batchResult.embeddings.map((e) => e.values);

      await Promise.all(
        batch.map((m, bIdx) => this.cache.set(m.text, MODEL, newEmbeddings[bIdx]))
      );

      batch.forEach((m, bIdx) => {
        results[m.idx] = newEmbeddings[bIdx];
      });
    }

    return results;
  }

  /** Re-embed all chunks with a different model version. */
  async reembedBatch(texts: string[], forceModel?: string): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: forceModel ?? MODEL });
    const result = await model.batchEmbedContents({
      requests: texts.map((t) => ({
        content: { parts: [{ text: t }], role: 'user' },
      })),
    });
    return result.embeddings.map((e) => e.values);
  }
}
