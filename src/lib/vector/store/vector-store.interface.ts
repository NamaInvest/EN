// src/lib/vector/store/vector-store.interface.ts
// Unified abstraction over pgvector + Qdrant (future).
// All vector operations go through this interface.

export interface VectorDocument {
  id: string;
  tenantId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];          // 768-dim for text-embedding-004
  tokenCount: number;
  embeddingVersion?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  embedding: number[];
  topK: number;
  tenantId: string;
  filters?: VectorFilter;
  minScore?: number;
  efSearch?: number;            // HNSW search quality (default 40)
}

export interface VectorFilter {
  sourceType?: string;
  embeddingVersion?: string;
  dateRange?: { from: Date; to: Date };
  tags?: string[];
}

export interface SearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;                // cosine similarity [0,1]
  metadata?: Record<string, unknown>;
}

export interface VectorStore {
  /** Upsert documents (insert or update by id) */
  upsert(documents: VectorDocument[]): Promise<void>;
  /** Semantic similarity search */
  search(query: SearchQuery): Promise<SearchResult[]>;
  /** Soft-delete chunks by filter */
  delete(tenantId: string, filter: VectorFilter): Promise<number>;
  /** Count active chunks */
  count(tenantId: string): Promise<number>;
}
