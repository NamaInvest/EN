-- =============================================================================
-- Migration: 20260508_pgvector_hnsw
-- Purpose:   Enable pgvector, migrate embeddings to vector(768),
--            create HNSW index, Row-Level Security for multi-tenant isolation.
--
-- Prerequisites: PostgreSQL 14+ with pgvector extension available
-- Safe: Uses IF NOT EXISTS / DO $$ guards throughout.
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- A. EXTENSION
-- ═══════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════════════════
-- B. Schema updates for KnowledgeDocument
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "knowledge_documents"
  ADD COLUMN IF NOT EXISTS "source_type"       TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "source_url"        TEXT,
  ADD COLUMN IF NOT EXISTS "source_ref"        TEXT,
  ADD COLUMN IF NOT EXISTS "embedding_version" TEXT NOT NULL DEFAULT 'text-embedding-004',
  ADD COLUMN IF NOT EXISTS "chunk_count"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_active"         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "deleted_at"        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ═══════════════════════════════════════════════════════════════════════════
-- C. Rename knowledge_chunk → knowledge_chunks + add new columns
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'knowledge_chunk') THEN
    ALTER TABLE "knowledge_chunk" RENAME TO "knowledge_chunks";
  END IF;
END $$;

ALTER TABLE "knowledge_chunks"
  ADD COLUMN IF NOT EXISTS "embedding_version" TEXT NOT NULL DEFAULT 'text-embedding-004',
  ADD COLUMN IF NOT EXISTS "metadata"          JSONB,
  ADD COLUMN IF NOT EXISTS "is_active"         BOOLEAN NOT NULL DEFAULT TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- D. Migrate embedding column: Float[] → vector(768)
--    NOTE: Drop old embedding column (was stored as JSON or float array in DB)
--    and add proper pgvector column.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Check if column is already vector type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_chunks'
      AND column_name = 'embedding'
      AND udt_name = 'vector'
  ) THEN
    -- Add new vector column alongside old one
    ALTER TABLE "knowledge_chunks" ADD COLUMN IF NOT EXISTS "embedding_vec" vector(768);
    RAISE NOTICE 'Added embedding_vec column (vector type). Run backfill script to populate.';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- E. HNSW Index on embedding_vec
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX CONCURRENTLY IF NOT EXISTS "knowledge_chunks_embedding_hnsw_idx"
  ON "knowledge_chunks"
  USING hnsw (embedding_vec vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Supporting indexes for multi-tenant filtered search
CREATE INDEX CONCURRENTLY IF NOT EXISTS "knowledge_chunks_tenant_active_idx"
  ON "knowledge_chunks"("tenant_id", "is_active")
  WHERE "is_active" = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "knowledge_chunks_tenant_version_idx"
  ON "knowledge_chunks"("tenant_id", "embedding_version");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "knowledge_docs_tenant_source_idx"
  ON "knowledge_documents"("tenant_id", "source_type", "is_active");

-- ═══════════════════════════════════════════════════════════════════════════
-- F. Row-Level Security (Multi-tenant isolation)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "knowledge_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_documents" ENABLE ROW LEVEL SECURITY;

-- Drop if exists first (idempotent)
DROP POLICY IF EXISTS "tenant_isolation_chunks" ON "knowledge_chunks";
DROP POLICY IF EXISTS "tenant_isolation_docs" ON "knowledge_documents";

-- Policy: rows visible only when tenant matches session variable
CREATE POLICY "tenant_isolation_chunks" ON "knowledge_chunks"
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "tenant_isolation_docs" ON "knowledge_documents"
  USING (tenant_id = current_setting('app.tenant_id', true));

-- Superuser / service role bypass (needed for migrations and admin tasks)
-- Run this manually per service role: ALTER ROLE namasoft_service BYPASSRLS;

-- ═══════════════════════════════════════════════════════════════════════════
-- G. Verification
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_ext     INTEGER;
  v_hnsw    INTEGER;
  v_rls_c   BOOLEAN;
  v_rls_d   BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_ext FROM pg_extension WHERE extname = 'vector';
  SELECT COUNT(*) INTO v_hnsw FROM pg_indexes WHERE indexname = 'knowledge_chunks_embedding_hnsw_idx';
  SELECT relrowsecurity INTO v_rls_c FROM pg_class WHERE relname = 'knowledge_chunks';
  SELECT relrowsecurity INTO v_rls_d FROM pg_class WHERE relname = 'knowledge_documents';

  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE 'Migration: 20260508_pgvector_hnsw';
  RAISE NOTICE '  pgvector extension:  %', CASE WHEN v_ext > 0 THEN 'ENABLED' ELSE 'MISSING' END;
  RAISE NOTICE '  HNSW index:          %', CASE WHEN v_hnsw > 0 THEN 'CREATED' ELSE 'PENDING' END;
  RAISE NOTICE '  RLS (chunks):        %', v_rls_c;
  RAISE NOTICE '  RLS (documents):     %', v_rls_d;
  RAISE NOTICE '══════════════════════════════════════════════';
END $$;

COMMIT;
