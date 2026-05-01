-- Migration: Add Numbering Sequences Engine (Foundation 0.1)
-- Date: 2026-05-01
-- Author: ERP Foundation Layer
-- Type: Additive only (CREATE TABLE) — safe to apply on any tenant DB
-- Idempotent: uses IF NOT EXISTS so re-runs are safe

CREATE TABLE IF NOT EXISTS "numbering_sequences" (
    "id"              SERIAL          PRIMARY KEY,
    "code"            TEXT            NOT NULL,
    "name"            TEXT,
    "prefix"          TEXT            NOT NULL DEFAULT '',
    "suffix"          TEXT            NOT NULL DEFAULT '',
    "pad_length"      INTEGER         NOT NULL DEFAULT 6,
    "current"         BIGINT          NOT NULL DEFAULT 0,
    "reset_frequency" TEXT            NOT NULL DEFAULT 'never',
    "branch_id"       INTEGER,
    "fiscal_year"     INTEGER,
    "fiscal_month"    INTEGER,
    "last_reset"      TIMESTAMP(3),
    "is_active"       BOOLEAN         NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique per (code, branch, fiscal period) — ensures atomicity of generateNextNumber
CREATE UNIQUE INDEX IF NOT EXISTS "uq_numbering_seq"
    ON "numbering_sequences" ("code", "branch_id", "fiscal_year", "fiscal_month");

-- Lookup index
CREATE INDEX IF NOT EXISTS "numbering_sequences_code_is_active_idx"
    ON "numbering_sequences" ("code", "is_active");

-- Seed default sequence templates (idempotent via ON CONFLICT)
INSERT INTO "numbering_sequences" ("code", "name", "prefix", "pad_length", "reset_frequency", "current", "is_active") VALUES
    ('JE',  'قيد يومية',         'JE-',  6, 'yearly',  0, true),
    ('INV', 'فاتورة مبيعات',     'INV-', 6, 'yearly',  0, true),
    ('PO',  'أمر شراء',          'PO-',  6, 'yearly',  0, true),
    ('PR',  'طلب شراء',          'PR-',  6, 'yearly',  0, true),
    ('GRN', 'إذن استلام',        'GRN-', 6, 'yearly',  0, true),
    ('RFQ', 'طلب عرض سعر',       'RFQ-', 6, 'yearly',  0, true),
    ('SO',  'أمر بيع',           'SO-',  6, 'yearly',  0, true),
    ('DN',  'إذن تسليم',         'DN-',  6, 'yearly',  0, true),
    ('WO',  'أمر تشغيل',         'WO-',  6, 'yearly',  0, true),
    ('FA',  'أصل ثابت',          'FA-',  6, 'never',   0, true),
    ('EMP', 'موظف',              'EMP-', 5, 'never',   0, true),
    ('SAL', 'مسير راتب',         'SAL-', 6, 'monthly', 0, true),
    ('EXP', 'مصروف',             'EXP-', 6, 'yearly',  0, true),
    ('PV',  'سند صرف',           'PV-',  6, 'yearly',  0, true),
    ('RV',  'سند قبض',           'RV-',  6, 'yearly',  0, true),
    ('CHK', 'شيك',               'CHK-', 6, 'yearly',  0, true),
    ('SR',  'مرتجع مبيعات',      'SR-',  6, 'yearly',  0, true),
    ('PRT', 'مرتجع مشتريات',     'PRT-', 6, 'yearly',  0, true),
    ('ADJ', 'تسوية مخزون',       'ADJ-', 6, 'yearly',  0, true),
    ('TRN', 'تحويل مخزون',       'TRN-', 6, 'yearly',  0, true)
ON CONFLICT ("code", "branch_id", "fiscal_year", "fiscal_month") DO NOTHING;
