// src/lib/rag/citations/tracker.ts
// Extracts [المصدر N] / [Source N] references from LLM answers
// and maps them back to retrieved chunks for verifiable citations.

export interface Citation {
  sourceNumber: number;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  excerpt?: string;
  metadata?: Record<string, unknown>;
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export class CitationTracker {
  private static readonly CITATION_REGEX =
    /\[(?:المصدر|Source)\s+(\d+)\]/g;

  /** Extract citations from an LLM answer and map back to retrieved chunks. */
  extract(answer: string, chunks: RetrievedChunk[]): Citation[] {
    const matches = Array.from(answer.matchAll(CitationTracker.CITATION_REGEX));
    const cited = new Set<number>();
    matches.forEach((m) => cited.add(parseInt(m[1], 10) - 1));

    return Array.from(cited)
      .filter((idx) => idx >= 0 && idx < chunks.length)
      .map((idx) => ({
        sourceNumber: idx + 1,
        documentId: chunks[idx].documentId,
        chunkIndex: chunks[idx].chunkIndex,
        content: chunks[idx].content,
        score: chunks[idx].score,
        excerpt: chunks[idx].content.slice(0, 200),
        metadata: chunks[idx].metadata,
      }));
  }

  /** Format citations as a markdown references section. */
  format(citations: Citation[]): string {
    if (citations.length === 0) return '';

    return (
      '\n\n## المراجع:\n' +
      citations
        .map(
          (c) =>
            `${c.sourceNumber}. **${c.metadata?.title ?? 'مصدر ' + c.sourceNumber}**` +
            (c.metadata?.page ? ` (صفحة ${c.metadata.page})` : '') +
            (c.metadata?.url ? ` — [رابط](${c.metadata.url})` : '') +
            ` (تطابق: ${(c.score * 100).toFixed(0)}%)`
        )
        .join('\n')
    );
  }
}
