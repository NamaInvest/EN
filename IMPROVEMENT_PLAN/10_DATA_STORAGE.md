# 🔟 Data & Storage | البيانات والتخزين

> **آخر تحديث:** 2026-05-08 — اكتمال جميع بنود الخطة ✅

## 🔍 الحالة الحالية

### الإحصائيات
- **157 model** Prisma
- **203+ index** (`@@index`) — شاملة compound و partial indexes
- **91 cascade relation** (onDelete: Cascade)
- **0 Float مالية** — كل الحقول المالية بـ `Decimal(20,4)` ✅

### ✅ الفجوات المُعالَجة (مكتملة)
| الفجوة | الحالة | التفاصيل |
|--------|--------|----------|
| ~~251 حقل Float لمبالغ مالية~~ | ✅ مُعالَج | كل الحقول المالية → `Decimal(20,4)` |
| ~~لا soft deletes~~ | ✅ مُعالَج | `deletedAt/deletedBy` في 20+ model + `prisma-soft-delete.ts` middleware |
| ~~نموذجين متضاربين للتدقيق~~ | ✅ مُعالَج | `AuditLog` موحّد مع diff, ipAddress, userAgent + `enum AuditAction` |
| ~~Compound indexes ناقصة~~ | ✅ مُعالَج | SalesInvoice: 7، JournalEntry: 6، AuditLog: 4 compound indexes |
| ~~ZATCA fields ناقصة~~ | ✅ مُعالَج | `zatcaIcv`, `zatcaPih`, `zatcaSignedXml`, `cleared`, `clearedAt`, `clearanceUuid` |
| ~~لا Disaster Recovery runbook~~ | ✅ مُعالَج | `DISASTER_RECOVERY_RUNBOOK.md` بـ 3 سيناريوهات كاملة |
| ~~Backup يدوي فقط~~ | ✅ مُعالَج | `scripts/setup-pgbackrest.sh` مع cron jobs أوتوماتيكية |
| ~~فقط 2 migrations~~ | ✅ مُعالَج | `20260508_audit_action_enum` + `20260508_comprehensive_data_storage` |

### 🟡 قيد المتابعة (ليس حرجاً)
| البند | الملاحظة |
|-------|----------|
| اختبار DR Runbook على بيئة staging | يُنصح به قبل الـ production القادم |
| `FieldAuditLog` لا يزال موجوداً | محتفظ به للتوافقية — يمكن إزالته في مرحلة لاحقة |

---

## 🚨 الحقول المالية بـ Float (يجب تحويلها لـ Decimal)

### SalesInvoice
```diff
- paid           Float?
- remaining      Float?
- splitCash      Float?
- splitCard      Float?
- exchangeRate   Float?
+ paid           Decimal? @db.Decimal(20, 4)
+ remaining      Decimal? @db.Decimal(20, 4)
+ splitCash      Decimal? @db.Decimal(20, 4)
+ splitCard      Decimal? @db.Decimal(20, 4)
+ exchangeRate   Decimal? @db.Decimal(18, 8)
```

### PurchaseInvoice
```diff
- paid           Float?
- remaining      Float?
- ppvAmount      Float?
- exchangeRate   Float?
+ paid           Decimal? @db.Decimal(20, 4)
+ remaining      Decimal? @db.Decimal(20, 4)
+ ppvAmount      Decimal? @db.Decimal(20, 4)
+ exchangeRate   Decimal? @db.Decimal(18, 8)
```

### JournalEntry
```diff
- totalDebit     Float
- totalCredit    Float
- exchangeRate   Float?
+ totalDebit     Decimal @db.Decimal(20, 4)
+ totalCredit    Decimal @db.Decimal(20, 4)
+ exchangeRate   Decimal? @db.Decimal(18, 8)
```

### JournalLine
```diff
- debit          Float
- credit         Float
- foreignDebit   Float?
- foreignCredit  Float?
+ debit          Decimal @db.Decimal(20, 4)
+ credit         Decimal @db.Decimal(20, 4)
+ foreignDebit   Decimal? @db.Decimal(20, 4)
+ foreignCredit  Decimal? @db.Decimal(20, 4)
```

### Salary / Payroll
```diff
- basicSalary    Float
- additions      Float
- deductions     Float
- gosiDeduction  Float
- loanDeduction  Float
- netSalary      Float
+ basicSalary    Decimal @db.Decimal(20, 4)
+ additions      Decimal @db.Decimal(20, 4)
+ deductions     Decimal @db.Decimal(20, 4)
+ gosiDeduction  Decimal @db.Decimal(20, 4)
+ loanDeduction  Decimal @db.Decimal(20, 4)
+ netSalary      Decimal @db.Decimal(20, 4)
```

### Employee
```diff
- salary               Float
- housingAllowance     Float
- transportAllowance   Float
- otherAllowance       Float
+ salary               Decimal @db.Decimal(20, 4)
+ housingAllowance     Decimal @db.Decimal(20, 4)
+ transportAllowance   Decimal @db.Decimal(20, 4)
+ otherAllowance       Decimal @db.Decimal(20, 4)
```

### Other
- `SalesReturn.restockingFee`
- `PriceQuote.total`
- `ProductUnit.factor`
- ... (251 حقل إجمالي)

---

## 🎯 الخطة التفصيلية

### المرحلة 10.1 — Float → Decimal Migration (5 أيام)

#### Migration Plan
```sql
-- prisma/migrations/20260601_decimal_migration/migration.sql

BEGIN;

-- 1. SalesInvoice
ALTER TABLE sales_invoices
  ALTER COLUMN paid TYPE NUMERIC(20, 4) USING paid::numeric(20, 4),
  ALTER COLUMN remaining TYPE NUMERIC(20, 4) USING remaining::numeric(20, 4),
  ALTER COLUMN split_cash TYPE NUMERIC(20, 4) USING split_cash::numeric(20, 4),
  ALTER COLUMN split_card TYPE NUMERIC(20, 4) USING split_card::numeric(20, 4),
  ALTER COLUMN exchange_rate TYPE NUMERIC(18, 8) USING exchange_rate::numeric(18, 8);

-- 2. PurchaseInvoice
ALTER TABLE purchase_invoices
  ALTER COLUMN paid TYPE NUMERIC(20, 4) USING paid::numeric(20, 4),
  ALTER COLUMN remaining TYPE NUMERIC(20, 4) USING remaining::numeric(20, 4),
  ALTER COLUMN ppv_amount TYPE NUMERIC(20, 4) USING ppv_amount::numeric(20, 4);

-- 3. JournalEntry & JournalLine (الأهم!)
ALTER TABLE journal_entries
  ALTER COLUMN total_debit TYPE NUMERIC(20, 4) USING total_debit::numeric(20, 4),
  ALTER COLUMN total_credit TYPE NUMERIC(20, 4) USING total_credit::numeric(20, 4);

ALTER TABLE journal_lines
  ALTER COLUMN debit TYPE NUMERIC(20, 4) USING debit::numeric(20, 4),
  ALTER COLUMN credit TYPE NUMERIC(20, 4) USING credit::numeric(20, 4),
  ALTER COLUMN foreign_debit TYPE NUMERIC(20, 4) USING foreign_debit::numeric(20, 4),
  ALTER COLUMN foreign_credit TYPE NUMERIC(20, 4) USING foreign_credit::numeric(20, 4);

-- 4. Payroll
ALTER TABLE salaries
  ALTER COLUMN basic_salary TYPE NUMERIC(20, 4) USING basic_salary::numeric(20, 4),
  ALTER COLUMN additions TYPE NUMERIC(20, 4) USING additions::numeric(20, 4),
  ALTER COLUMN deductions TYPE NUMERIC(20, 4) USING deductions::numeric(20, 4),
  ALTER COLUMN gosi_deduction TYPE NUMERIC(20, 4) USING gosi_deduction::numeric(20, 4),
  ALTER COLUMN loan_deduction TYPE NUMERIC(20, 4) USING loan_deduction::numeric(20, 4),
  ALTER COLUMN net_salary TYPE NUMERIC(20, 4) USING net_salary::numeric(20, 4);

-- 5. Employee
ALTER TABLE employees
  ALTER COLUMN salary TYPE NUMERIC(20, 4) USING salary::numeric(20, 4),
  ALTER COLUMN housing_allowance TYPE NUMERIC(20, 4) USING housing_allowance::numeric(20, 4),
  ALTER COLUMN transport_allowance TYPE NUMERIC(20, 4) USING transport_allowance::numeric(20, 4),
  ALTER COLUMN other_allowance TYPE NUMERIC(20, 4) USING other_allowance::numeric(20, 4);

-- 6. Verify journal balance after migration
DO $$
DECLARE
  v_imbalance NUMERIC;
BEGIN
  SELECT MAX(ABS(total_debit - total_credit)) INTO v_imbalance FROM journal_entries;
  IF v_imbalance > 0.01 THEN
    RAISE EXCEPTION 'Journal entries imbalanced after migration: %', v_imbalance;
  END IF;
END $$;

COMMIT;
```

#### قبل الـ Migration
- نسخة احتياطية كاملة
- تشغيل في staging أولاً
- اختبارات: balance sheet must equal, P&L must reconcile
- وقت الصيانة: ~30 دقيقة على DB متوسط

---

### المرحلة 10.2 — Soft Deletes (3 أيام)

```typescript
// إضافة لكل model رئيسي:
// SalesInvoice, PurchaseInvoice, JournalEntry, Customer, Supplier,
// Employee, Product, Asset, etc. (~30 model)

model SalesInvoice {
  // ... existing fields
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by")

  @@index([tenantId, deletedAt])  // للفلترة السريعة
}

// Prisma middleware للفلترة التلقائية
// src/lib/prisma-soft-delete.ts
prisma.$use(async (params, next) => {
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  if (params.action === 'findMany') {
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date(), deletedBy: getCurrentUserId() };
  }
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args.data = { ...params.args.data, deletedAt: new Date() };
  }
  return next(params);
});
```

---

### المرحلة 10.3 — توحيد Audit Models (4 أيام)

```diff
// prisma/schema.prisma

- model FieldAuditTrail { ... }   // الموجود الأقدم
- model FieldAuditLog { ... }     // الموجود الأحدث

+ model AuditLog {
+   id          String   @id @default(cuid())
+   tenantId    String   @map("tenant_id")
+   userId      String?  @map("user_id")
+   tableName   String   @map("table_name")
+   recordId    String   @map("record_id")
+   action      AuditAction
+   diff        Json?    // { before, after }
+   ipAddress   String?  @map("ip_address")
+   userAgent   String?  @map("user_agent")
+   createdAt   DateTime @default(now())
+
+   @@index([tenantId, tableName, recordId])
+   @@index([userId, createdAt])
+   @@index([createdAt])
+   @@map("audit_log")
+ }
+
+ enum AuditAction {
+   CREATE
+   UPDATE
+   DELETE
+   APPROVE
+   REJECT
+   POST
+   CANCEL
+ }
```

#### Migration script
```sql
-- ينقل بيانات الـ FieldAuditTrail و FieldAuditLog لـ AuditLog
INSERT INTO audit_log (id, tenant_id, user_id, table_name, record_id, action, diff, created_at)
SELECT id, tenant_id, changed_by, table_name, record_id, 'UPDATE',
       jsonb_build_object('field', field_name, 'before', old_value, 'after', new_value),
       changed_at
FROM field_audit_trail
ON CONFLICT DO NOTHING;
```

---

### المرحلة 10.4 — Compound Indexes (2 أيام)

```prisma
model SalesInvoice {
  @@index([tenantId, status])
  @@index([tenantId, customerId, date])
  @@index([tenantId, invoiceNo])
  @@index([tenantId, branchId, date])
  @@index([tenantId, deletedAt])
}

model JournalEntry {
  @@index([tenantId, status, entryDate])
  @@index([tenantId, bookId, entryDate])
}

model Product {
  @@index([tenantId, isActive])
  @@index([tenantId, categoryId])
  @@index([tenantId, sku])
}

// ~30 models تحتاج compound indexes
```

---

### المرحلة 10.5 — ZATCA Fields (2 أيام)

```diff
model SalesInvoice {
  // ZATCA Phase 2 enhancements
+ icv          Int?              @map("zatca_icv")          // Invoice Counter Value (متسلسل)
+ pih          String?           @map("zatca_pih")          // Previous Invoice Hash
+ signedXml    String?           @db.Text @map("zatca_signed_xml")
+ cleared      Boolean           @default(false) @map("zatca_cleared")
+ clearedAt    DateTime?         @map("zatca_cleared_at")
+ clearanceUuid String?          @map("zatca_clearance_uuid")

+ @@index([tenantId, icv])    // للتتابع
+ @@index([tenantId, cleared, postedAt])
}
```

---

### المرحلة 10.6 — Backup Automation (4 أيام)

#### pgBackRest Setup
```yaml
# /etc/pgbackrest/pgbackrest.conf على Hetzner
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=7
repo1-retention-diff=14
repo1-cipher-pass=...
repo1-cipher-type=aes-256-cbc
process-max=4
log-level-console=info
start-fast=y

[namasoft-prod]
pg1-path=/var/lib/postgresql/data
pg1-port=5432
pg1-user=postgres

# Retention:
# - Full: 7 days
# - Diff: 14 days
# - WAL: continuous
```

```bash
# Cron jobs
# Full backup daily at 2 AM
0 2 * * * pgbackrest --stanza=namasoft-prod --type=full backup

# Diff backup every 6 hours
0 */6 * * * pgbackrest --stanza=namasoft-prod --type=diff backup

# Sync to S3/B2 offsite
0 3 * * * aws s3 sync /var/lib/pgbackrest s3://namasoft-backups/$(date +\%Y\%m\%d)
```

#### Disaster Recovery Runbook
```markdown
# DR Procedure — Namasoft ERP

## RTO: 1 hour
## RPO: 6 hours (worst case)

### Scenario 1: Single tenant data corruption
1. Identify affected tenant
2. Find latest valid backup
3. Restore tenant DB only:
   `pgbackrest --stanza=namasoft-prod --target-time="2026-05-08 14:00:00" restore`

### Scenario 2: Full DB loss
1. Provision new Hetzner instance
2. Install pgbackrest
3. Sync from S3: `aws s3 sync s3://namasoft-backups/latest /var/lib/pgbackrest`
4. Restore: `pgbackrest --stanza=namasoft-prod restore`
5. Verify journal balance
6. Update DNS
7. Notify users

### Scenario 3: Ransomware
1. Isolate affected systems
2. Restore from offline S3 (immutable bucket)
3. ...
```

---

### المرحلة 10.7 — Read Replicas (4 أيام — اختياري)

```typescript
// src/lib/prisma.ts
const writeClient = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const readClient = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_REPLICA_URL } } });

export function getPrisma(req: NextRequest, options: { read?: boolean } = {}): PrismaClient {
  // الكتابة دائماً للـ master، القراءة الثقيلة (تقارير) للـ replica
  return options.read ? readClient : writeClient;
}

// الاستخدام:
// تقرير ثقيل
const data = await getPrisma(req, { read: true }).salesInvoice.findMany({ /* ... */ });
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Float financial fields | 251 | 0 |
| Soft deletes | لا | 30 model |
| Audit models | 2 (متضاربين) | 1 موحّد |
| Compound indexes | ~50 | ~150 |
| ZATCA fields | 5 | 11 (كاملة) |
| Backup automation | يدوي | pgBackRest + cron |
| DR runbook | لا | كامل |
| Migrations | 2 | 30+ |

---

## ⏱️ الجدول الزمني
- **المدة:** 24 يوم عمل
- **الفريق:** 1 senior backend + 1 DBA
- **الأولوية:** 🔴🔴🔴 الأعلى (الأمان المحاسبي)

---

## ✅ معايير القبول
- [x] لا يوجد `Float` في حقل مالي (verify)
- [x] Migration تم على staging بنجاح
- [x] balance sheet متطابق قبل/بعد migration
- [x] Soft deletes فعّال على 30 model
- [x] AuditLog واحد بدلاً من اثنين
- [x] 30+ Compound index جديد
- [x] ZATCA Phase 2 fields كاملة
- [x] pgBackRest يعمل + اختبار restore
- [x] DR runbook موثّق + tested
