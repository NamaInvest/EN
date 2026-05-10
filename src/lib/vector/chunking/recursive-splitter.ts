import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vector.chunking.recursive-splitter' });

export interface Chunk {
  text: string;
  length: number;
}

export class RecursiveCharacterSplitter {
  constructor(
    private chunkSize: number = 1000,
    private chunkOverlap: number = 200,
    private separators: string[] = ['\n\n', '\n', '. ', ' ', '']
  ) {}

  split(text: string): Chunk[] {
    return this.splitRecursive(text, this.separators);
  }

  private splitRecursive(text: string, separators: string[]): Chunk[] {
    if (text.length <= this.chunkSize) {
      return [{ text, length: text.length }];
    }

    const [separator, ...rest] = separators;
    const parts = text.split(separator);
    const chunks: Chunk[] = [];
    let currentChunk = '';

    for (const part of parts) {
      const candidate = currentChunk ? `${currentChunk}${separator}${part}` : part;

      if (candidate.length > this.chunkSize) {
        if (currentChunk) {
          chunks.push({ text: currentChunk, length: currentChunk.length });
        }

        if (part.length > this.chunkSize && rest.length > 0) {
          const sub = this.splitRecursive(part, rest);
          chunks.push(...sub);
          currentChunk = '';
        } else {
          currentChunk = part;
        }
      } else {
        currentChunk = candidate;
      }
    }

    if (currentChunk) chunks.push({ text: currentChunk, length: currentChunk.length });

    return this.applyOverlap(chunks);
  }

  private applyOverlap(chunks: Chunk[]): Chunk[] {
    if (chunks.length <= 1 || this.chunkOverlap === 0) return chunks;

    return chunks.map((chunk, i) => {
      if (i === 0) return chunk;
      const prev = chunks[i - 1];
      const overlap = prev.text.slice(-this.chunkOverlap);
      return { text: `${overlap}${chunk.text}`, length: overlap.length + chunk.length };
    });
  }
}
