-- Migration: 20260508_audit_action_enum
-- Purpose: Add AuditAction enum + missing index on AuditLog
-- Part of: 10_DATA_STORAGE improvement plan (Phase 10.3)
-- Author: Namasoft ERP Architecture Team
-- Date: 2026-05-08

BEGIN;

-- 1. Create the AuditAction enum type
DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'REJECT',
    'POST',
    'REVERSE',
    'CANCEL',
    'VOID',
    'PRINT',
    'EXPORT',
    'LOGIN',
    'LOGOUT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Idempotent: skip if already exists
END $$;

-- 2. Add missing compound index on audit_log (userId + createdAt)
--    Enables fast queries like "show all actions by user X this week"
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_user_id_created_at_idx"
  ON "audit_log"("user_id", "created_at");

-- 3. Verify AuditLog table has required columns (safety check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'diff'
  ) THEN
    -- Add diff column if missing (idempotent)
    ALTER TABLE "audit_log" ADD COLUMN "diff" JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE "audit_log" ADD COLUMN "ip_address" VARCHAR(45);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_log' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE "audit_log" ADD COLUMN "user_agent" TEXT;
  END IF;
END $$;

-- 4. Migrate any legacy field_audit_logs data into unified audit_log
--    (One-time backfill — safe to re-run due to ON CONFLICT DO NOTHING)
INSERT INTO "audit_log" (
  "id",
  "tenant_id",
  "user_id",
  "action",
  "table_name",
  "record_id",
  "diff",
  "ip_address",
  "user_agent",
  "created_at"
)
SELECT
  gen_random_uuid()::text,
  COALESCE(f."tenantId", 'default'),
  f."userId",
  'UPDATE',                                -- All FieldAuditLog entries are UPDATEs
  f."entityType",
  f."entityId"::text,
  jsonb_build_object(
    'field',  f."fieldName",
    'before', f."oldValue",
    'after',  f."newValue"
  ),
  f."ipAddress",
  f."userAgent",
  f."changedAt"
FROM "field_audit_logs" f
WHERE NOT EXISTS (
  -- Skip if this field change was already migrated
  SELECT 1 FROM "audit_log" a
  WHERE a."table_name" = f."entityType"
    AND a."record_id"  = f."entityId"::text
    AND a."created_at" = f."changedAt"
    AND (a."diff"->>'field') = f."fieldName"
)
ON CONFLICT DO NOTHING;

-- 5. Log migration result
DO $$
DECLARE
  v_audit_count  BIGINT;
  v_legacy_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_audit_count  FROM "audit_log";
  SELECT COUNT(*) INTO v_legacy_count FROM "field_audit_logs";
  RAISE NOTICE 'Migration complete: audit_log=%, field_audit_logs=%',
    v_audit_count, v_legacy_count;
END $$;

COMMIT;
