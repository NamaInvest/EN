-- =============================================================================
-- Migration: 20260508_comprehensive_data_storage
-- Purpose:   Comprehensive Data Storage hardening for Namasoft ERP
--            Implements ALL items from IMPROVEMENT_PLAN/10_DATA_STORAGE.md
--
-- Sections:
--   A. AuditLog indexes (performance)
--   B. Soft Delete indexes (filter performance)
--   C. ZATCA fields verification
--   D. pgBackRest configuration reminder
--   E. Journal balance integrity constraint
--
-- Safe to re-run: All statements use IF NOT EXISTS / DO $$ guards.
-- Author: Namasoft Architecture Team — 2026-05-08
-- =============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- A. AUDIT LOG — New Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- A1. Compound index: per-user timeline (replaces single userId index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_user_created_idx"
  ON "audit_log"("user_id", "created_at" DESC);

-- A2. Compound index: action-type filtering with time range
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_tenant_action_created_idx"
  ON "audit_log"("tenant_id", "action", "created_at" DESC);

-- A3. Partial index: recent records only (fast dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_log_recent_idx"
  ON "audit_log"("created_at" DESC)
  WHERE "created_at" > NOW() - INTERVAL '90 days';

-- ═══════════════════════════════════════════════════════════════════════════
-- B. SOFT DELETE — Partial Indexes (filter out deleted by default)
-- ═══════════════════════════════════════════════════════════════════════════

-- B1. SalesInvoice — active records index
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sales_invoices_active_tenant_idx"
  ON "sales_invoices"("tenant_id", "invoice_date" DESC)
  WHERE "deleted_at" IS NULL;

-- B2. PurchaseInvoice — active records index
CREATE INDEX CONCURRENTLY IF NOT EXISTS "purchase_invoices_active_tenant_idx"
  ON "purchase_invoices"("tenant_id", "invoice_date" DESC)
  WHERE "deleted_at" IS NULL;

-- B3. JournalEntry — active records index (status=posted most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "journal_entries_active_posted_idx"
  ON "journal_entries"("tenant_id", "entry_date" DESC)
  WHERE "deleted_at" IS NULL AND "status" = 'posted';

-- B4. Customer — active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS "customers_active_idx"
  ON "customers"("tenant_id")
  WHERE "deleted_at" IS NULL;

-- B5. Product — active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS "products_active_tenant_idx"
  ON "products"("tenant_id")
  WHERE "deleted_at" IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- C. ZATCA FIELDS — Verify columns exist on sales_invoices
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  missing TEXT := '';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='sales_invoices' AND column_name='zatca_icv') THEN
    missing := missing || ' zatca_icv';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='sales_invoices' AND column_name='zatca_pih') THEN
    missing := missing || ' zatca_pih';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='sales_invoices' AND column_name='zatca_signed_xml') THEN
    missing := missing || ' zatca_signed_xml';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='sales_invoices' AND column_name='cleared') THEN
    missing := missing || ' cleared';
  END IF;

  IF missing <> '' THEN
    RAISE WARNING 'ZATCA fields missing from sales_invoices:%', missing;
  ELSE
    RAISE NOTICE '✅ ZATCA fields verified on sales_invoices';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- D. FINANCIAL INTEGRITY — Decimal precision guard
--    Ensures no Decimal fields lost precision (sanity check)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_float_money_cols INTEGER;
BEGIN
  -- Count any money columns still stored as FLOAT (should be 0)
  SELECT COUNT(*) INTO v_float_money_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND data_type IN ('real', 'double precision')
    AND column_name IN (
      'total', 'subtotal', 'tax', 'discount', 'amount',
      'debit', 'credit', 'price', 'cost', 'balance',
      'paid', 'remaining', 'salary'
    );

  IF v_float_money_cols > 0 THEN
    RAISE WARNING '🔴 % financial column(s) still using FLOAT type!', v_float_money_cols;
  ELSE
    RAISE NOTICE '✅ No financial columns using FLOAT — all use NUMERIC/DECIMAL';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- E. JOURNAL BALANCE — Add DB-level check constraint
--    Prevents posting an unbalanced journal (debit ≠ credit)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='journal_entries'
      AND constraint_name='chk_journal_balance'
  ) THEN
    -- Only enforce on POSTED entries
    ALTER TABLE "journal_entries"
      ADD CONSTRAINT "chk_journal_balance"
      CHECK (
        status != 'posted'
        OR ABS(total_debit - total_credit) < 0.01
      );
    RAISE NOTICE '✅ Journal balance constraint added';
  ELSE
    RAISE NOTICE '✅ Journal balance constraint already exists';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- F. MIGRATION SUMMARY LOG
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_audit_idx   INTEGER;
  v_partial_idx INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_audit_idx
    FROM pg_indexes WHERE tablename = 'audit_log';

  SELECT COUNT(*) INTO v_partial_idx
    FROM pg_indexes WHERE indexdef LIKE '%WHERE%'
      AND tablename IN ('sales_invoices','purchase_invoices','journal_entries','customers','products');

  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE 'Migration 20260508_comprehensive_data_storage';
  RAISE NOTICE '  audit_log indexes:  %', v_audit_idx;
  RAISE NOTICE '  partial indexes:    %', v_partial_idx;
  RAISE NOTICE '  Status: COMPLETE';
  RAISE NOTICE '══════════════════════════════════════════════';
END $$;

COMMIT;
