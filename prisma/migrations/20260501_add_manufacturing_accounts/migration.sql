-- Migration: Add manufacturing-specific accounts to chart of accounts
-- Date: 2026-05-01
-- Type: Idempotent (uses WHERE NOT EXISTS)
-- Purpose: Required by postManufacturingCompletion + postMaterialIssueToWIP in auto-journal

-- 1310 - Goods in Transit
INSERT INTO "accounts" ("code", "name", "name_en", "type", "parent_id", "level", "is_active", "balance")
SELECT '1310', 'بضاعة بالطريق', 'Goods in Transit', 'asset', 0, 3, true, 0
WHERE NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = '1310');

-- 1330 - Work-in-Process (WIP) inventory
INSERT INTO "accounts" ("code", "name", "name_en", "type", "parent_id", "level", "is_active", "balance")
SELECT '1330', 'مخزون تحت التشغيل', 'Work-in-Process (WIP)', 'asset', 0, 3, true, 0
WHERE NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = '1330');

-- 1340 - Finished Goods inventory
INSERT INTO "accounts" ("code", "name", "name_en", "type", "parent_id", "level", "is_active", "balance")
SELECT '1340', 'مخزون البضاعة التامة', 'Finished Goods', 'asset', 0, 3, true, 0
WHERE NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = '1340');

-- 5120 - Inventory Shrinkage expense
INSERT INTO "accounts" ("code", "name", "name_en", "type", "parent_id", "level", "is_active", "balance")
SELECT '5120', 'مصروف عجز وتسوية مخزون', 'Inventory Shrinkage', 'expense', 0, 1, true, 0
WHERE NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = '5120');

-- 5130 - Manufacturing Variance expense
INSERT INTO "accounts" ("code", "name", "name_en", "type", "parent_id", "level", "is_active", "balance")
SELECT '5130', 'انحرافات تكاليف الإنتاج', 'Manufacturing Variance', 'expense', 0, 1, true, 0
WHERE NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = '5130');
