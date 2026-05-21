# G2 — Migration Scripts

## الحالة الحالية
- `docs/MASTER_PACK/20-migration/` (1 ملف فقط)
- `prisma/migrations/` (schema migrations فقط)
- لا scripts من أنظمة خارجية

## الفجوة (مقابل SAP Migration Cockpit / QuickBooks Migration Tool)
- صفر paths من أنظمة المنافسين
- لا data validation tooling
- لا mapping templates (Excel→ERP)

## 🎯 Ready Prompt

```
المهمة: نظام Migration shamel من أنظمة أخرى.

السياق:
- منافسون: QuickBooks, SAP Business One, Oracle NetSuite, Onyx Pro
- محلياً (السعودية): Wafeq, Daftra, Zoho Books
- شامل: Excel/CSV (الأكثر شيوعاً)
- 607 Prisma model — أهم 20: Customer, Product, Account, Employee, Invoice, JE

المخرجات:
1) Per-source migration packs:
   scripts/migration/<source>/
   ├── 00-config.ts          (source-specific settings)
   ├── 01-extract-coa.ts     (extract chart of accounts)
   ├── 02-map-to-socpa.ts    (mapping table source COA → SOCPA)
   ├── 03-import-customers.ts
   ├── 04-import-suppliers.ts
   ├── 05-import-products.ts
   ├── 06-import-employees.ts
   ├── 07-import-open-balances.ts
   ├── 08-import-historical-invoices.ts  (12-24 months)
   ├── 09-import-historical-jes.ts
   └── validate.ts           (post-migration checks)

   Sources to support:
   ├── quickbooks/   (QBO export — JSON)
   ├── sap-b1/       (SAP B1 → SQL Server export)
   ├── oracle/       (Oracle EBS dump)
   ├── netsuite/     (NetSuite CSV export)
   ├── wafeq/        (Wafeq API)
   ├── daftra/       (Daftra API)
   ├── zoho-books/   (Zoho API)
   ├── onyx-pro/     (Onyx Pro custom DB)
   ├── tally/        (Tally XML)
   └── excel/        (generic CSV/XLSX templates)

2) Mapping templates:
   docs/MASTER_PACK/20-migration/templates/
   ├── coa-mapping-quickbooks.xlsx
   ├── coa-mapping-wafeq.xlsx
   ├── customers-template.xlsx (for manual entry)
   ├── products-template.xlsx
   └── opening-balances-template.xlsx

3) Migration runner UI:
   src/app/(dashboard)/admin/migration/page.tsx:
   - Select source
   - Upload export file
   - Preview mapping (show first 10 rows)
   - Adjust mappings if needed
   - "Start Migration" → progress bar
   - View MigrationRun history

4) MigrationRun audit:
   prisma model:
   ```
   model MigrationRun {
     id Int @id @default(autoincrement())
     tenantId String
     source String   // 'quickbooks', 'wafeq', etc.
     fileName String
     status String   // 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
     startedAt DateTime
     completedAt DateTime?
     stats Json      // { customers: 50, products: 100, errors: 2 }
     errors Json[]   // detailed error log
     dryRun Boolean  // true = preview, false = actual
   }
   ```
   Every migration logs progress here

5) Validation post-migration:
   scripts/migration/validate.ts:
   - TB balanced (debit == credit ± 0.01)
   - No orphan FKs (Customer → SalesInvoice)
   - All required fields populated
   - VAT numbers valid format
   - Open balances reconcile with historical txns
   ↓
   Output: detailed validation report
   - If issues → block "go live" until fixed

6) Dry-run mode:
   Every migration runs first in dry-run:
   - Validates inputs
   - Counts records
   - Identifies mapping issues
   - DOESN'T write to DB
   - User reviews → click "Actually Run" → migration writes

7) Rollback capability:
   Each MigrationRun has rollback:
   - Find all records created in this run (by createdAt + migrationRunId tag)
   - Soft-delete them
   - Available within 7 days of completion

القيود:
- لا data loss (always dry-run first)
- progress visible في real-time
- batch size = 100 rows (don't lock DB)
- audit every action
- tenant isolation strict
```

## السيناريو

عميل سعودي يترك Wafeq وينتقل لـ Namasoft:

**يوم 1 — Discovery**:
1. عميل يصدّر بياناته من Wafeq (CSV)
2. Sales rep يفتح `/admin/migration`
3. Select source: "Wafeq"
4. Upload CSV
5. Preview shows: 250 customers, 1200 invoices, 80 products

**يوم 2 — Mapping**:
6. System shows mapping suggestions:
   - Wafeq "Account 1000" → SOCPA "1100 - Cash"
   - 5 accounts unmapped → require manual mapping
7. عميل يفتح Excel template (`coa-mapping-wafeq.xlsx`)
8. يكمل الـ 5 mappings → upload back
9. Click "Dry Run"

**يوم 3 — Validation**:
10. Dry-run completes:
    - 250 customers ready
    - 80 products ready
    - 1200 invoices: **15 errors** (missing customer IDs)
11. عميل يصلح الـ 15 في Wafeq → re-export
12. Re-upload → dry-run ✓ clean

**يوم 4 — Go Live**:
13. Click "Actually Migrate"
14. Migration runs 20 minutes
15. Validation post-run: ✅ TB balanced
16. عميل يبدأ يستخدم Namasoft فوراً
17. لو ظهرت مشكلة خلال 7 أيام → rollback متاح

## Data Flow

```
[Dry-run flow]
User uploads Wafeq export CSV
   ↓
POST /api/migration/start
   { source: 'wafeq', dryRun: true, file: ... }
   ↓
Create MigrationRun record (status: PENDING)
   ↓
BullMQ enqueues job
   ↓
Worker picks up:
   ↓
For each script 01..09:
   ├→ Parse source data
   ├→ Apply mappings (from mapping table)
   ├→ Validate against Prisma schema
   ├→ Count + log errors
   └→ DON'T write to DB (dryRun=true)
   ↓
Update MigrationRun.stats
   ↓
Notify user via WebSocket
   ↓
User reviews stats + errors

[Actual migration flow]
User clicks "Actually Migrate"
   ↓
POST /api/migration/:id/execute
   ↓
Worker re-runs all scripts but dryRun=false
   ↓
For each script:
   ├→ Same parsing/validation
   └→ Insert to DB in batches of 100
      Each batch is a transaction
      On error: rollback batch, continue
   ↓
After all scripts:
   ↓
Run scripts/migration/validate.ts
   ├→ TB balanced?
   ├→ Orphan FKs?
   ├→ All required fields?
   ↓
If validation ✓ → MigrationRun.status = COMPLETED
If validation fails → log errors, status = COMPLETED_WITH_WARNINGS
   ↓
Notify user

[Rollback flow]
User notices issue 3 days post-migration
   ↓
Click "Rollback" in /admin/migration/<id>
   ↓
Confirm dialog
   ↓
POST /api/migration/:id/rollback
   ↓
Find all records with migrationRunId = X
   ↓
Soft-delete in reverse order (FK constraints)
   ↓
Audit log
   ↓
MigrationRun.status = ROLLED_BACK
```

## ملفات المُنتَج

- `scripts/migration/<source>/01-09.ts` × 10 sources × 9 = 90 files
- `scripts/migration/validate.ts`
- `docs/MASTER_PACK/20-migration/templates/*.xlsx` × 5
- `docs/MASTER_PACK/20-migration/USER_GUIDE.md`
- `src/app/(dashboard)/admin/migration/page.tsx`
- `src/app/api/migration/start/route.ts`
- `src/app/api/migration/[id]/execute/route.ts`
- `src/app/api/migration/[id]/rollback/route.ts`
- `prisma/schema.prisma` — MigrationRun model (new)
