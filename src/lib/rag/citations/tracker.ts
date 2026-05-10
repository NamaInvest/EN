import { RetrievedChunk } from '../pipeline';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.rag.citation' });

export interface Citation {
  sourceNumber: number;
  documentId: string;
  title: string;
  url?: string;
  page?: number;
  score: number;
  excerpt?: string;
}

export class CitationTracker {
  extract(answer: string, chunks: RetrievedChunk[]): Citation[] {
    const citationRegex = /\[(?:المصدر|Source)\s+(\d+)\]/g;
    const matches = Array.from(answer.matchAll(citationRegex));

    const cited = new Set<number>();
    matches.forEach(m => cited.add(parseInt(m[1]) - 1));

    return Array.from(cited)
      .filter(idx => idx < chunks.length)
      .map(idx => ({
        sourceNumber: idx + 1,
        documentId: chunks[idx].documentId,
        title: (chunks[idx].metadata?.title as string) || `Document ${chunks[idx].documentId}`,
        url: chunks[idx].metadata?.url as string,
        page: chunks[idx].metadata?.page as number,
        score: chunks[idx].score,
        excerpt: chunks[idx].content.slice(0, 500),
      }));
  }

  format(citations: Citation[]): string {
    if (citations.length === 0) return '';

    return '\n\n## المراجع:\n' + citations
      .map(c =>
        `${c.sourceNumber}. **${c.title}**` +
        (c.page ? ` (صفحة ${c.page})` : '') +
        (c.url ? ` — [رابط](${c.url})` : '') +
        ` (تطابق: ${(c.score * 100).toFixed(0)}%)`
      )
      .join('\n');
  }
}
