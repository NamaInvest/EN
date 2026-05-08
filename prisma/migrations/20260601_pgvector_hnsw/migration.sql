-- 1. Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. تأكد من type
ALTER TABLE knowledge_documents
  ALTER COLUMN embedding TYPE vector(768);  -- text-embedding-004 = 768 dim

-- 3. HNSW index (fast approximate search)
CREATE INDEX IF NOT EXISTS knowledge_docs_embedding_hnsw_idx
  ON knowledge_documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Compound index for tenant filtering
CREATE INDEX IF NOT EXISTS knowledge_docs_tenant_active_idx
  ON knowledge_documents (tenant_id, is_active)
  WHERE is_active = true;

-- 5. Full-text search (للـ hybrid)
ALTER TABLE knowledge_documents
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS knowledge_docs_tsv_idx
  ON knowledge_documents USING gin (content_tsv);
