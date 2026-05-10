import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vector.store.vector-store.interface' });

export interface VectorFilter {
  tenantId: string;
  sourceType?: string;
  dateRange?: { from: Date; to: Date };
  tags?: string[];
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface SearchQuery {
  embedding: number[];
  topK: number;
  filters?: VectorFilter;
  minScore?: number;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface VectorStore {
  upsert(documents: VectorDocument[]): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult[]>;
  delete(filter: VectorFilter): Promise<number>;
  count(filter?: VectorFilter): Promise<number>;
}
