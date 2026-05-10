import { getPrisma } from '@/lib/prisma';
import { BusinessContext } from '../../context/business-context';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'HybridSearch' });

export interface SearchOptions {
  topK?: number;
  filters?: any;
  rrf_k?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source_doc_id: string;
  metadata: any;
  score: number;
}

export class HybridSearcher {
  async search(query: string, ctx: BusinessContext, options: SearchOptions): Promise<SearchResult[]> {
    const { topK = 20, filters = {}, rrf_k = 60 } = options;

    const [vectorResults, bm25Results] = await Promise.all([
      this.vectorSearch(query, ctx, topK, filters),
      this.bm25Search(query, ctx, topK, filters),
    ]);

    const fused = this.rrf(vectorResults, bm25Results, rrf_k);
    
    // Stub reranking
    const reranked = fused.slice(0, 50);

    return reranked.slice(0, topK);
  }

  private rrf(listA: SearchResult[], listB: SearchResult[], k: number): SearchResult[] {
    const scores = new Map<string, number>();

    [listA, listB].forEach(list => {
      list.forEach((item, rank) => {
        const score = scores.get(item.id) || 0;
        scores.set(item.id, score + 1 / (k + rank + 1));
      });
    });

    const allItems = new Map([...listA, ...listB].map(item => [item.id, item]));

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ ...allItems.get(id)!, score }));
  }

  private async vectorSearch(query: string, ctx: BusinessContext, topK: number, filters: any): Promise<SearchResult[]> {
    // Stub implementation to avoid raw query parsing errors with pgvector if extension not actually present
    log.info(`[HybridSearcher] Running Vector Search for: ${query}`);
    return [];
  }

  private async bm25Search(query: string, ctx: BusinessContext, topK: number, filters: any): Promise<SearchResult[]> {
    // Stub implementation
    log.info(`[HybridSearcher] Running BM25 Search for: ${query}`);
    return [];
  }
}
