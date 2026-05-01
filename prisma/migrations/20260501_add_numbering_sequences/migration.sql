-- Migration: Add Numbering Sequences Engine (Foundation 0.1)
-- Date: 2026-05-01
-- Type: Idempotent — safe to re-run on any tenant DB
--
-- Notes on NULL handling:
--   PostgreSQL <15 treats NULLs as distinct in UNIQUE indexes by default.
--   To make (code, branch_id=NULL, fiscal_year=NULL, fiscal_month=NULL) unique,
--   we use an expression-based unique index with COALESCE(*, -1).

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

-- Drop legacy plain unique index if it exists (had NULL-distinct bug)
DROP INDEX IF EXISTS "uq_numbering_seq";

-- Expression-based unique index — treats NULLs as equal via COALESCE(*, -1)
CREATE UNIQUE INDEX IF NOT EXISTS "uq_numbering_seq"
    ON "numbering_sequences" (
        "code",
        COALESCE("branch_id",    -1),
        COALESCE("fiscal_year",  -1),
        COALESCE("fiscal_month", -1)
    );

-- Lookup index
CREATE INDEX IF NOT EXISTS "numbering_sequences_code_is_active_idx"
    ON "numbering_sequences" ("code", "is_active");

-- Dedupe in case prior runs created duplicates (older buggy index)
DELETE FROM "numbering_sequences" a
USING "numbering_sequences" b
WHERE a.id > b.id
  AND a.code = b.code
  AND a.branch_id    IS NOT DISTINCT FROM b.branch_id
  AND a.fiscal_year  IS NOT DISTINCT FROM b.fiscal_year
  AND a.fiscal_month IS NOT DISTINCT FROM b.fiscal_month;

-- Seed default sequence templates — uses WHERE NOT EXISTS to bypass NULL conflict semantics
DO $$
DECLARE
    seq_data RECORD;
BEGIN
    FOR seq_data IN
        SELECT * FROM (VALUES
            ('JE',  'قيد يومية',         'JE-',  6, 'yearly'),
            ('INV', 'فاتورة مبيعات',     'INV-', 6, 'yearly'),
            ('PO',  'أمر شراء',          'PO-',  6, 'yearly'),
            ('PR',  'طلب شراء',          'PR-',  6, 'yearly'),
            ('GRN', 'إذن استلام',        'GRN-', 6, 'yearly'),
            ('RFQ', 'طلب عرض سعر',       'RFQ-', 6, 'yearly'),
            ('SO',  'أمر بيع',           'SO-',  6, 'yearly'),
            ('DN',  'إذن تسليم',         'DN-',  6, 'yearly'),
            ('WO',  'أمر تشغيل',         'WO-',  6, 'yearly'),
            ('FA',  'أصل ثابت',          'FA-',  6, 'never'),
            ('EMP', 'موظف',              'EMP-', 5, 'never'),
            ('SAL', 'مسير راتب',         'SAL-', 6, 'monthly'),
            ('EXP', 'مصروف',             'EXP-', 6, 'yearly'),
            ('PV',  'سند صرف',           'PV-',  6, 'yearly'),
            ('RV',  'سند قبض',           'RV-',  6, 'yearly'),
            ('CHK', 'شيك',               'CHK-', 6, 'yearly'),
            ('SR',  'مرتجع مبيعات',      'SR-',  6, 'yearly'),
            ('PRT', 'مرتجع مشتريات',     'PRT-', 6, 'yearly'),
            ('ADJ', 'تسوية مخزون',       'ADJ-', 6, 'yearly'),
            ('TRN', 'تحويل مخزون',       'TRN-', 6, 'yearly')
        ) AS t(code, name, prefix, pad_length, reset_frequency)
    LOOP
        INSERT INTO "numbering_sequences"
            ("code", "name", "prefix", "pad_length", "reset_frequency", "current", "is_active")
        SELECT seq_data.code, seq_data.name, seq_data.prefix, seq_data.pad_length, seq_data.reset_frequency, 0, true
        WHERE NOT EXISTS (
            SELECT 1 FROM "numbering_sequences"
            WHERE "code" = seq_data.code
              AND "branch_id"    IS NULL
              AND "fiscal_year"  IS NULL
              AND "fiscal_month" IS NULL
        );
    END LOOP;
END $$;
