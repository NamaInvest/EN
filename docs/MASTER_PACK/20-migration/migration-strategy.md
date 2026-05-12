---
version: 1.0
last_updated: 2026-05-12
---

# Data Migration Strategy

## التحديات

عميل قادم من SAP B1 / QuickBooks / Tally / Zoho / Excel يحتاج:
- نقل العملاء والموردين
- نقل العناصر والأرصدة الافتتاحية
- نقل الأرصدة المحاسبية (Trial Balance opening)
- نقل المعاملات المفتوحة (open invoices, POs)
- نقل الموظفين والرواتب
- نقل العقود والمستندات
- التحقق من التطابق (reconciliation)

## نموذج الـ ETL

```
Source System ──► Extract (CSV/Excel/API)
                       │
                       ▼
                  Staging Tables (per source)
                       │
                       ▼
              Validate (counts, totals, FK, formats)
                       │
                       ├─► Validation Report → User reviews
                       │
                       ▼
                  Transform (mapping rules)
                       │
                       ▼
                  Dry Run (insert into shadow schema)
                       │
                       ├─► Reconciliation Report → User approves
                       │
                       ▼
                  Execute (insert into production)
                       │
                       ▼
              Post-Migration Validation
                       │
                       ▼
                  Tenant Goes Live
```

## Migration Cockpit (UI)

```
/admin/migration-cockpit
├── Step 1: New Migration Project
├── Step 2: Source System (SAP / QB / Tally / Excel / Other)
├── Step 3: Upload Files (or API credentials)
├── Step 4: Field Mapping (auto-suggestion + manual override)
├── Step 5: Validation (errors + warnings)
├── Step 6: Dry Run (preview impact)
├── Step 7: Approval (CFO + Auditor sign-off)
├── Step 8: Execute (with progress bar)
└── Step 9: Reconciliation Report (source vs target)
```

## Models

```prisma
model MigrationProject {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  source        String   // 'SAP_B1' | 'QB' | 'TALLY' | 'ZOHO' | 'EXCEL' | 'CUSTOM'
  status        String   // 'DRAFT' | 'VALIDATING' | 'DRY_RUN' | 'PENDING_APPROVAL' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK'
  startedAt     DateTime?
  completedAt   DateTime?
  totalRecords  Int      @default(0)
  successCount  Int      @default(0)
  failureCount  Int      @default(0)
  config        Json     // mapping rules, options
  createdById   String
  createdAt     DateTime @default(now())
  mappings      MigrationMapping[]
  batches       MigrationBatch[]
  conflicts     MigrationConflict[]
}

model MigrationMapping {
  id          String   @id @default(cuid())
  projectId   String
  entity      String   // 'Customer' | 'Vendor' | 'Product' | ...
  sourceField String
  targetField String
  transform   String?  // optional JS expression
  required    Boolean  @default(false)
  defaultValue String?
  validationRule String?
  project     MigrationProject @relation(fields: [projectId], references: [id])
}

model MigrationBatch {
  id            String   @id @default(cuid())
  projectId     String
  entity        String
  totalRows     Int
  importedRows  Int
  skippedRows   Int
  failedRows    Int
  startedAt     DateTime
  completedAt   DateTime?
  errorLog      Json?
  project       MigrationProject @relation(fields: [projectId], references: [id])
}

model MigrationConflict {
  id            String   @id @default(cuid())
  projectId     String
  entity        String
  sourceRow     Json
  reason        String
  suggestion    String?
  resolution    String?  // 'SKIP' | 'MERGE' | 'OVERWRITE' | 'MANUAL'
  resolvedById  String?
  resolvedAt    DateTime?
  project       MigrationProject @relation(fields: [projectId], references: [id])
}
```

## Source-Specific Templates

### SAP B1 (XML / XLSX export)

```typescript
// scripts/migration/sap-b1.ts
export const SAPB1_TEMPLATES = {
  customers: {
    columns: ['CardCode', 'CardName', 'CardForeignName', 'LicTradNum', 'Phone1', 'E_Mail', 'CreditLine'],
    mapping: {
      CardCode: 'code',
      CardName: 'name',
      CardForeignName: 'nameAr',
      LicTradNum: 'vatNumber',
      Phone1: 'mobile',
      E_Mail: 'email',
      CreditLine: 'creditLimit',
    },
  },
  products: {
    columns: ['ItemCode', 'ItemName', 'FrgnName', 'ItmsGrpCod', 'BuyUnitMsr', 'OnHand', 'AvgPrice'],
    mapping: {
      ItemCode: 'code',
      ItemName: 'name',
      FrgnName: 'nameAr',
      ItmsGrpCod: 'categoryCode',
      BuyUnitMsr: 'unit',
      OnHand: 'openingStock',
      AvgPrice: 'openingCost',
    },
  },
  // ... vendors, accounts, transactions
};
```

### QuickBooks Online (API)

```typescript
// scripts/migration/quickbooks.ts
async function migrateFromQB(accessToken: string, realmId: string) {
  const qb = new QuickBooksClient({ accessToken, realmId });
  
  // 1. Pull entities
  const customers = await qb.query('SELECT * FROM Customer');
  const vendors = await qb.query('SELECT * FROM Vendor');
  const items = await qb.query('SELECT * FROM Item');
  const accounts = await qb.query('SELECT * FROM Account');
  
  // 2. Map QB account hierarchy to SOCPA
  const accountMap = await suggestAccountMapping(accounts, SOCPA_COA);
  await prompt(user, 'Review account mapping', accountMap);
  
  // 3. Transform + insert (in staging)
  for (const c of customers) {
    await stagingPrisma.customer.create({
      data: {
        tenantId,
        code: c.Id,
        name: c.DisplayName,
        vatNumber: c.PrimaryTaxIdentifier,
        creditLimit: parseFloat(c.OpenBalance) * 5, // assume 5× current balance as credit
        // ... map all fields
      },
    });
  }
  
  // 4. Trial balance preservation
  const tb = await qb.query('SELECT * FROM TrialBalanceReport');
  const obJE = buildOpeningBalanceJE(tb, accountMap);
  await postJournal(stagingPrisma, obJE);
  
  // 5. Open invoices (positions only — no GL impact)
  const invoices = await qb.query('SELECT * FROM Invoice WHERE Balance != 0');
  for (const inv of invoices) {
    await stagingPrisma.salesInvoice.create({
      data: {
        ...mapInvoice(inv),
        status: 'POSTED',
        skipJournal: true, // already in opening balance
      },
    });
  }
}
```

### Tally (.tally files / API)

```typescript
// scripts/migration/tally.ts
// Tally exports via TDL queries or XML
// Common to import via Tally Connector
```

### Excel (universal)

```typescript
// scripts/migration/excel.ts
import * as XLSX from 'xlsx';

const TEMPLATE = {
  Customers: ['code', 'name', 'nameAr', 'vatNumber', 'crNumber', 'mobile', 'email', 'creditLimit', 'paymentTerms', 'openingBalance'],
  Vendors: ['code', 'name', 'nameAr', 'vatNumber', 'crNumber', 'mobile', 'email', 'paymentTerms', 'openingBalance', 'bankAccount'],
  Products: ['code', 'name', 'nameAr', 'category', 'unit', 'cost', 'price', 'vatRate', 'openingStock'],
  ChartOfAccounts: ['code', 'name', 'nameAr', 'type', 'parent', 'openingDebit', 'openingCredit'],
  TrialBalance: ['accountCode', 'openingDebit', 'openingCredit'],
  OpenInvoicesAR: ['customerCode', 'invoiceNo', 'invoiceDate', 'dueDate', 'amount', 'currency'],
  OpenInvoicesAP: ['vendorCode', 'invoiceNo', 'invoiceDate', 'dueDate', 'amount', 'currency'],
  Employees: ['code', 'name', 'nameAr', 'iqama', 'mobile', 'email', 'hireDate', 'basicSalary', 'allowances', 'GosiYesNo', 'EOSAccrued'],
};

export async function migrateFromExcel(file: Buffer, tenantId: string) {
  const workbook = XLSX.read(file);
  
  // Validate sheets present
  for (const sheet of Object.keys(TEMPLATE)) {
    if (!workbook.SheetNames.includes(sheet)) {
      throw new Error(`Missing sheet: ${sheet}`);
    }
  }
  
  // Parse each sheet
  for (const [sheetName, columns] of Object.entries(TEMPLATE)) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    await stageData(tenantId, sheetName, rows, columns);
  }
  
  // Validate
  await validateStagedData(tenantId);
  
  // Apply (after user approval)
  await applyMigration(tenantId);
}
```

## Validation Rules

```typescript
// scripts/migration/validators.ts
export const VALIDATORS = {
  customer: [
    { rule: 'unique', field: 'code', scope: 'tenant' },
    { rule: 'required', field: 'name' },
    { rule: 'pattern', field: 'vatNumber', pattern: /^3\d{14}$/, message: 'Saudi VAT must be 15 digits starting with 3' },
    { rule: 'pattern', field: 'mobile', pattern: /^(\+966|966|0)5\d{8}$/, message: 'Saudi mobile format' },
    { rule: 'positive', field: 'creditLimit' },
  ],
  product: [
    { rule: 'unique', field: 'code', scope: 'tenant' },
    { rule: 'required', field: 'name' },
    { rule: 'foreignKey', field: 'category', references: 'Category.code' },
    { rule: 'positive', field: 'price' },
    { rule: 'between', field: 'vatRate', min: 0, max: 1 },
  ],
  trialBalance: [
    { rule: 'foreignKey', field: 'accountCode', references: 'Account.code' },
    { rule: 'balanced', message: 'Trial balance must balance (debit = credit)' },
    { rule: 'noControlAccount', message: 'Cannot post directly to control accounts' },
  ],
};
```

## Reconciliation Report

After migration, generate:

```
═══════════════════════════════════════════════════════════
   تقرير التطابق - مشروع الترحيل #M-001
═══════════════════════════════════════════════════════════

العملاء:
   المصدر: 1,245 عميل
   المستهدف: 1,243 عميل
   الفرق: 2 (مرفوضون بسبب VAT غير صالح)

الموردون:
   المصدر: 567
   المستهدف: 567 ✓

الأصناف:
   المصدر: 2,890
   المستهدف: 2,890 ✓
   إجمالي قيمة المخزون الافتتاحي:
      المصدر: 4,567,890.50 SAR
      المستهدف: 4,567,890.50 SAR ✓

الأرصدة المحاسبية (Trial Balance):
   إجمالي المدين المصدر: 12,345,678.99 SAR
   إجمالي المدين المستهدف: 12,345,678.99 SAR ✓
   إجمالي الدائن المصدر: 12,345,678.99 SAR
   إجمالي الدائن المستهدف: 12,345,678.99 SAR ✓
   الميزان: 0.00 ✓

الفواتير المفتوحة:
   AR Source: 234 فاتورة بمجموع 890,123.45 SAR
   AR Target: 234 فاتورة بمجموع 890,123.45 SAR ✓
   AP Source: 89 فاتورة بمجموع 234,567.89 SAR
   AP Target: 89 فاتورة بمجموع 234,567.89 SAR ✓

الموظفون:
   المصدر: 67
   المستهدف: 65 (2 مرفوضون: انتهت الإقامة)

═══════════════════════════════════════════════════════════
   النتيجة: نجح الترحيل مع تحذيرات
   التوقيع: __________ (CFO)   التاريخ: __________
═══════════════════════════════════════════════════════════
```

## Rollback Strategy

```typescript
// If migration fails mid-way:
async function rollbackMigration(projectId: string) {
  const project = await prisma.migrationProject.findUnique({ where: { id: projectId } });
  
  if (project.status !== 'EXECUTING') throw new Error('Cannot rollback');
  
  await prisma.$transaction([
    // 1. Delete imported records (use migration tag)
    prisma.salesInvoice.deleteMany({ where: { migrationProjectId: projectId } }),
    prisma.customer.deleteMany({ where: { migrationProjectId: projectId } }),
    // ... etc
    
    // 2. Reverse opening JE
    prisma.journalEntry.deleteMany({ where: { migrationProjectId: projectId } }),
    
    // 3. Mark project
    prisma.migrationProject.update({
      where: { id: projectId },
      data: { status: 'ROLLED_BACK' },
    }),
  ]);
}
```

## Go-Live Checklist

```
☐ Trial migration successful in staging
☐ CFO + Auditor signed off on reconciliation
☐ Source system frozen (no new transactions)
☐ Final delta export prepared
☐ Final import + reconciliation
☐ User access provisioned
☐ Training completed
☐ Cut-over date set
☐ Old system kept in read-only mode for 3 months
☐ Day-1 support team on standby
```
