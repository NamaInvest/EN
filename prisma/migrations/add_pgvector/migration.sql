-- G11: pgvector Extension Migration
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds persistent vector storage to replace in-memory embedding recomputation.
-- Run: psql $DATABASE_URL -f prisma/migrations/add_pgvector/migration.sql
-- OR:  npx prisma db execute --file prisma/migrations/add_pgvector/migration.sql
--
-- Requires PostgreSQL 15+ with pgvector extension installed.
-- Install: apt-get install postgresql-15-pgvector  OR  use pgvector/pgvector Docker image

-- 1. Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector column to KnowledgeChunk (the main RAG table)
ALTER TABLE "KnowledgeChunk"
  ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- 3. Create IVFFlat index for fast ANN search
--    lists = sqrt(total_rows), probe = 10 for recall/speed balance
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_ivfflat_idx"
  ON "KnowledgeChunk"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

-- 4. Also add to KnowledgeDocument for document-level similarity
ALTER TABLE "KnowledgeDocument"
  ADD COLUMN IF NOT EXISTS "embedding" vector(768);

CREATE INDEX IF NOT EXISTS "KnowledgeDocument_embedding_ivfflat_idx"
  ON "KnowledgeDocument"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 50);

-- 5. Helper function: cosine similarity search on KnowledgeChunk
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(768),
  tenant_id       text,
  limit_count     int DEFAULT 10,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE(
  id            text,
  "documentId"  text,
  "chunkText"   text,
  metadata      jsonb,
  similarity    float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc."documentId",
    kc."chunkText",
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM "KnowledgeChunk" kc
  WHERE
    kc."tenantId" = tenant_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant permissions (adjust role names for your setup)
-- GRANT EXECUTE ON FUNCTION search_knowledge_chunks TO namaapp;
