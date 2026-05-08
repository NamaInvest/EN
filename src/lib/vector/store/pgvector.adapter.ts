// src/lib/vector/store/pgvector.adapter.ts
// Production pgvector adapter using PostgreSQL HNSW index.
// Replaces the legacy brute-force JS cosine similarity fallback.

import { PrismaClient, Prisma } from '@prisma/client';
import type {
  VectorStore,
  VectorDocument,
  SearchQuery,
  SearchResult,
  VectorFilter,
} from './vector-store.interface';

export class PgvectorStore implements VectorStore {
  constructor(private prisma: PrismaClient) {}

  /**
   * Upsert chunks into knowledge_chunks using raw SQL for vector type.
   * Uses ON CONFLICT to update existing chunks.
   */
  async upsert(documents: VectorDocument[]): Promise<void> {
    if (documents.length === 0) return;

    // Build VALUES clause for batch insert
    const values = documents.map((doc) => {
      const embeddingLiteral = `[${doc.embedding.join(',')}]`;
      return Prisma.sql`(
        ${doc.id},
        ${doc.tenantId},
        ${doc.documentId},
        ${doc.chunkIndex},
        ${doc.content},
        ${embeddingLiteral}::vector,
        ${doc.tokenCount},
        ${doc.embeddingVersion ?? 'text-embedding-004'},
        ${doc.metadata ? JSON.stringify(doc.metadata) : null}::jsonb,
        NOW()
      )`;
    });

    await this.prisma.$executeRaw`
      INSERT INTO knowledge_chunks
        (id, tenant_id, document_id, chunk_index, content, embedding_vec,
         token_count, embedding_version, metadata, created_at)
      VALUES ${Prisma.join(values)}
      ON CONFLICT (id) DO UPDATE SET
        content           = EXCLUDED.content,
        embedding_vec     = EXCLUDED.embedding_vec,
        token_count       = EXCLUDED.token_count,
        embedding_version = EXCLUDED.embedding_version,
        metadata          = EXCLUDED.metadata
    `;
  }

  /**
   * Semantic search using HNSW index.
   * Sets hnsw.ef_search for quality control per-request.
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const {
      embedding,
      topK,
      tenantId,
      filters = {},
      minScore = 0.5,
      efSearch = 40,
    } = query;

    const embeddingLiteral = `[${embedding.join(',')}]`;

    // Set HNSW search quality (LOCAL = only this transaction)
    await this.prisma.$executeRaw`SET LOCAL hnsw.ef_search = ${efSearch}`;

    // Set tenant context for RLS
    await this.prisma.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;

    type RawResult = {
      id: string;
      document_id: string;
      chunk_index: number;
      content: string;
      score: number;
      metadata: Record<string, unknown> | null;
    };

    const sourceTypeFilter = filters.sourceType
      ? Prisma.sql`AND kd.source_type = ${filters.sourceType}`
      : Prisma.empty;

    const versionFilter = filters.embeddingVersion
      ? Prisma.sql`AND kc.embedding_version = ${filters.embeddingVersion}`
      : Prisma.empty;

    const results = await this.prisma.$queryRaw<RawResult[]>`
      SELECT
        kc.id,
        kc.document_id,
        kc.chunk_index,
        kc.content,
        kc.metadata,
        1 - (kc.embedding_vec <=> ${embeddingLiteral}::vector) AS score
      FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kd.id = kc.document_id
      WHERE kc.tenant_id  = ${tenantId}
        AND kc.is_active  = true
        AND kd.is_active  = true
        ${sourceTypeFilter}
        ${versionFilter}
      ORDER BY kc.embedding_vec <=> ${embeddingLiteral}::vector
      LIMIT ${topK * 2}
    `;

    return results
      .filter((r) => r.score >= minScore)
      .slice(0, topK)
      .map((r) => ({
        id: r.id,
        documentId: r.document_id,
        chunkIndex: r.chunk_index,
        content: r.content,
        score: r.score,
        metadata: r.metadata ?? undefined,
      }));
  }

  async delete(tenantId: string, filter: VectorFilter): Promise<number> {
    // Use raw SQL until `prisma generate` picks up the new is_active column
    type CountResult = [{ count: bigint }];
    if (filter.sourceType) {
      const rows = await this.prisma.$queryRaw<CountResult>`
        WITH updated AS (
          UPDATE knowledge_chunks kc
          SET is_active = false
          FROM knowledge_documents kd
          WHERE kc.document_id = kd.id
            AND kc.tenant_id   = ${tenantId}
            AND kd.source_type = ${filter.sourceType}
          RETURNING kc.id
        ) SELECT COUNT(*) FROM updated
      `;
      return Number(rows[0]?.count ?? 0);
    }
    const rows = await this.prisma.$queryRaw<CountResult>`
      WITH updated AS (
        UPDATE knowledge_chunks
        SET is_active = false
        WHERE tenant_id = ${tenantId}
        RETURNING id
      ) SELECT COUNT(*) FROM updated
    `;
    return Number(rows[0]?.count ?? 0);
  }

  async count(tenantId: string): Promise<number> {
    // Raw SQL until is_active lands in generated Prisma client
    type CountResult = [{ count: bigint }];
    const rows = await this.prisma.$queryRaw<CountResult>`
      SELECT COUNT(*) FROM knowledge_chunks
      WHERE tenant_id = ${tenantId} AND is_active = true
    `;
    return Number(rows[0]?.count ?? 0);
  }
}
