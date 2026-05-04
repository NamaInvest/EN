# النقص #24: Accounting Core (GL/COA/JE/Fiscal Periods/Recurring) — مواصفات تفصيلية

> **المرجعيات:** SAP FI、Oracle GL Cloud、NetSuite Financials、SAP S/4HANA Universal Journal、Workday Financials

---

## 1. البرومنت

```
وسّع GL Core لمستوى enterprise:

موجود: Account, JournalEntry, JournalLine, FiscalYear, FiscalPeriod, Currency, ExchangeRate, recurring-journal-runner

النواقص:
A) Chart of Accounts:
   - Multi-level hierarchy (4-7 levels)
   - Account types (5 main + 20+ sub)
   - Account categories (Current/Non-current/Operating)
   - Cash flow tag per account
   - Tax group tag
   - Default currency per account
   - Statistical accounts
   - Reconciliation accounts
   - Control accounts (cannot direct post)
   - Account templates per industry/country
   - Multi-language names

B) Journal Entries:
   - Manual JE with full dimensions (cost center, project, branch, currency)
   - Multi-currency JE with FX line
   - Recurring templates with formulas
   - Reversing entries (auto-reverse next period)
   - Adjusting entries (period-end)
   - Reclassification entries
   - Inter-company eliminations
   - Drill-down to source documents

C) Fiscal Calendar:
   - Multiple fiscal years
   - 12 months / 13 periods / 4-4-5 weekly
   - Period status: Open/Soft Closed/Hard Closed/Locked
   - Year-end close procedure

D) Sub-Ledger Integration:
   - Auto-journal from sales/purchases/inventory/HR
   - Reconciliation control accounts vs sub-ledger
   - Period close before GL close

E) Multi-Currency:
   - Functional + reporting currency
   - Daily exchange rates
   - Period-end revaluation
   - Realized vs unrealized FX

APIs (50+), UI (20 pages), Tests 70+
```

---

## 2. السيناريوهات (8)

### A — Manual JE Creation
```
1. /accounting/journal → [+ JE]
2. Date, description, reference
3. Lines:
   - DR Cash 5,000 / CR Customer Advance 5,000
   - cost center: Sales-RYD
   - project: Q1-Campaign
4. Validate balanced ✓
5. Save as DRAFT or POST
```

### B — Recurring JE (Monthly)
```
- Rent expense 10K SAR/month
- Template: DR Rent 10000 / CR Cash 10000
- Schedule: 1st of every month
- Auto-creates JE on schedule
- Sends notification
```

### C — Reversing Entry
```
- Year-end accrual: DR Expense 5K / CR Accrued 5K
- Mark as auto-reverse next period
- 1st Jan auto-reverse: DR Accrued 5K / CR Expense 5K
- Original invoice arrives → DR Expense 5K / CR AP 5K (no double-count)
```

### D — Inter-company Elimination
```
- Subsidiary A sells to Subsidiary B for 100K (intercompany)
- A: DR IC Receivable / CR Sales
- B: DR Inventory / CR IC Payable
- Group consolidation: eliminate
- DR Sales 100K / CR Inventory 100K
```

### E — FX Revaluation Period-end
```
- USD AR balance: 100K USD (originally 375K SAR @ 3.75)
- Period-end rate: 3.78
- New SAR value: 378K
- Unrealized FX gain: 3K
- JE: DR USD AR 3K / CR Unrealized FX Gain 3K
- Reverses next period → realizes on settlement
```

### F — Period Close Workflow
```
1. Sub-ledger close: AR, AP, Inventory cleared
2. Bank recon completed
3. Depreciation run
4. FX revaluation
5. Accruals + reclassifications
6. Trial balance review
7. Soft close → can reverse
8. Hard close → locked except super admin
```

### G — Drill-down from GL
```
- View GL: Sales account 1,000,000
- Click → list of JEs
- Click JE → source document (invoice)
- Click invoice → customer + lines
- Full traceability
```

### H — Multi-Currency JE
```
- Pay vendor 5K USD (rate 3.78)
- Functional SAR
- JE:
  - DR AP-Vendor 5,000 USD (18,750 SAR)
  - CR Bank 5,000 USD (18,900 SAR @ different rate)
  - DR FX Loss 150 SAR
- Both views available (USD + SAR)
```

---

## 3. تدفق البيانات

```
[Manual JE]
POST /accounting/journal { date, lines, dimensions }
   ↓ validate balanced (per currency)
   ↓ validate accounts not control
   ↓ validate period open
   ↓ create JE (DRAFT)
   ↓ if POST → auto-validate + save POSTED
   ↓ trigger sub-ledger update (if applicable)

[Recurring Cron]
On scheduled date:
   ↓ for each active template:
     compute amounts (formulas if any)
     create JE
     update template.lastRun + nextRun

[Period Close]
POST /accounting/periods/:id/close { type: SOFT|HARD }
   ↓ validate prerequisites (sub-ledger closed)
   ↓ run period-end procedures
   ↓ update period status
```

---

## 4. Schema (إضافات)

```prisma
model Account {
  // ... existing
  code                String    @unique
  nameAr              String
  nameEn              String
  description         String?
  
  type                String    // 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'STATISTICAL'
  subType             String?   // 'CURRENT_ASSET' | 'FIXED_ASSET' | 'CURRENT_LIABILITY' | etc.
  category            String?   // 'OPERATING' | 'FINANCING' | 'INVESTING'
  
  // Hierarchy
  parentAccountId     Int?
  parentAccount       Account?  @relation("AccountHierarchy", fields: [parentAccountId], references: [id])
  childAccounts       Account[] @relation("AccountHierarchy")
  level               Int       @default(0)
  isLeaf              Boolean   @default(true)
  
  // Properties
  isControl           Boolean   @default(false)
  isReconciliation    Boolean   @default(false)
  isStatistical       Boolean   @default(false)
  reconciliationModule String?  // 'AR' | 'AP' | 'INVENTORY' | 'FA' | 'BANK'
  
  // Cash flow tagging
  cashFlowSection     String?   // 'OPERATING' | 'INVESTING' | 'FINANCING'
  
  // Tax
  taxGroupId          Int?
  
  // Currency
  defaultCurrency     String?   // null = any
  
  // Status
  active              Boolean   @default(true)
  archivedAt          DateTime?
  
  // Cost center / project required
  requiresCostCenter  Boolean   @default(false)
  requiresProject     Boolean   @default(false)
  
  // Default for sub-ledger
  isDefaultForRevenue Boolean   @default(false)
  isDefaultForCogs    Boolean   @default(false)
  isDefaultForCash    Boolean   @default(false)
}

model AccountTemplate {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  countryCode     String?
  industry        String?
  standard        String    // 'IFRS' | 'SOCPA' | 'US_GAAP' | 'ZAKAT'
  accounts        Json      // structured tree
}

model JournalEntry {
  // ... existing
  entryNumber     String    @unique
  date            DateTime
  postingDate     DateTime?
  
  description     String
  reference       String?
  
  source          String    // 'MANUAL' | 'AUTO_INVOICE' | 'AUTO_PAYMENT' | 'AUTO_DEPRECIATION' | 'AUTO_PAYROLL' | 'RECURRING' | 'YEAR_END' | 'REVAL' | 'OPENING'
  sourceDocumentType String?
  sourceDocumentId Int?
  
  status          String    @default("DRAFT")  // DRAFT | POSTED | REVERSED | VOID
  
  reverseAtPeriod Boolean   @default(false)
  reversedJournalId Int?
  
  fiscalYearId    Int
  fiscalPeriodId  Int
  
  totalDebit      Decimal   @db.Decimal(20,4)
  totalCredit     Decimal   @db.Decimal(20,4)
  currency        String    @default("SAR")
  fxRate          Decimal?  @db.Decimal(20,8)
  
  postedAt        DateTime?
  postedByUserId  String?
  reversedAt      DateTime?
  reversedByUserId String?
  reversalReason  String?
  
  // Multi-book
  bookId          Int       @default(1)
  
  // Inter-company
  isIntercompany  Boolean   @default(false)
  icPartnerEntityId Int?
  
  lines           JournalLine[]
  
  @@index([fiscalPeriodId, source, status])
  @@index([sourceDocumentType, sourceDocumentId])
}

model JournalLine {
  // ... existing
  lineNumber      Int
  accountId       Int
  
  description     String?
  
  debit           Decimal   @default(0) @db.Decimal(20,4)
  credit          Decimal   @default(0) @db.Decimal(20,4)
  
  // Original currency (if different from JE currency)
  origCurrency    String?
  origDebit       Decimal?  @db.Decimal(20,4)
  origCredit      Decimal?  @db.Decimal(20,4)
  origFxRate      Decimal?  @db.Decimal(20,8)
  
  // Dimensions
  costCenterId    Int?
  projectId       Int?
  branchId        Int?
  departmentId    Int?
  productId       Int?
  customerId      Int?
  vendorId        Int?
  employeeId      Int?
  
  // Memo
  memo            String?
}

model FiscalYear {
  // ... existing
  yearNumber      Int       @unique
  startDate       DateTime
  endDate         DateTime
  status          String    @default("OPEN")  // OPEN | CLOSING | LOCKED
  fiscalCalendarType String @default("CALENDAR")  // CALENDAR | 4_4_5 | 13_PERIOD | CUSTOM
  periods         FiscalPeriod[]
}

model FiscalPeriod {
  // ... existing
  fiscalYearId    Int
  periodNumber    Int
  startDate       DateTime
  endDate         DateTime
  status          String    @default("OPEN")  // OPEN | SOFT_CLOSED | HARD_CLOSED | LOCKED
  closedAt        DateTime?
  closedByUserId  String?
}

model RecurringJournalTemplate {
  id              Int       @id @default(autoincrement())
  templateNumber  String    @unique
  name            String
  description     String?
  
  frequency       String    // 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM_CRON'
  cronExpression  String?
  dayOfMonth      Int?
  
  startDate       DateTime
  endDate         DateTime?
  occurrencesLimit Int?
  occurrencesGenerated Int  @default(0)
  
  lines           Json      // [{accountId, debit, credit, formula?, dimensions}]
  
  active          Boolean   @default(true)
  pausedUntil     DateTime?
  
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  
  createdByUserId String
}

model ReversingEntry {
  id                Int       @id @default(autoincrement())
  originalJournalId Int       @unique
  reverseDate       DateTime
  reversalJournalId Int?
  reversedAt        DateTime?
  status            String    @default("PENDING")  // PENDING | REVERSED | CANCELLED
}

model ExchangeRate {
  // ... existing
  fromCurrency    String
  toCurrency      String
  rate            Decimal   @db.Decimal(20,8)
  rateDate        DateTime
  rateType        String    @default("DAILY")  // DAILY | AVERAGE | CLOSING | HISTORICAL | TRANSACTION
  source          String?   @default("SAMA")  // SAMA | ECB | XE | MANUAL | OPENEXCHANGE
  
  @@unique([fromCurrency, toCurrency, rateDate, rateType])
}
```

---

## 5. Forms (8)

A: Account Master (with hierarchy + properties)
B: Manual JE (with dimensions + multi-currency)
C: Recurring Template
D: Reversing Entry Setup
E: Period Close Wizard
F: FX Rate Entry
G: Account Template Import
H: Inter-company JE

---

## 6. Tables (8)

A: Chart of Accounts (tree)
B: Journal Entries
C: Trial Balance (live)
D: Fiscal Periods
E: Recurring Templates
F: Pending Reversals
G: FX Rates History
H: Sub-ledger Reconciliation Status

---

## 7. Buttons (35+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-account-create | + حساب | 🟢 cfo |
| btn-account-import-template | استيراد قالب | ⬜ cfo |
| btn-account-archive | أرشفة | 🔴 cfo |
| btn-account-mark-control | تحديد رقابي | 🟡 cfo |
| btn-je-create | + قيد | 🟢 accountant |
| btn-je-import | استيراد قيود | ⬜ controller |
| btn-je-post | ترحيل | 🟦 accountant |
| btn-je-reverse | عكس قيد | 🔴 accountant + reason |
| btn-je-clone | استنساخ | ⬜ accountant |
| btn-recurring-create | + متكرر | 🟢 controller |
| btn-recurring-pause | إيقاف مؤقت | 🟡 controller |
| btn-recurring-run-now | تشغيل الآن | 🟦 controller |
| btn-recurring-end | إنهاء | 🔴 controller |
| btn-reversing-mark | علم لعكس تلقائي | 🟦 accountant |
| btn-period-close-soft | إقفال مرن | 🟡 cfo |
| btn-period-close-hard | إقفال صارم | 🔴 cfo |
| btn-period-reopen | إعادة فتح | 🔴 super admin |
| btn-fx-rate-add | + سعر صرف | 🟦 cfo |
| btn-fx-rate-import | استيراد | ⬜ cfo |
| btn-fx-revaluate | إعادة تقييم العملة | 🔴 cfo |
| btn-trial-balance-export | تصدير ميزان | ⬜ accountant |
| btn-ledger-drilldown | تفصيل الحساب | ⬜ viewer |
| btn-ic-eliminate | إلغاء IC | 🟦 controller |
| btn-allocation-run | تشغيل التوزيع | 🟦 controller |
| btn-adjust-entry | قيد تسوية | 🟡 controller |
| btn-reclass | إعادة تصنيف | 🟡 controller |
| btn-source-drill | الانتقال للمستند | ⬜ viewer |
| btn-print-je | طباعة | ⬜ viewer |
| btn-export-je-excel | Excel | ⬜ viewer |
| btn-bulk-post | ترحيل جماعي | 🔴 controller |
| btn-bulk-reverse | عكس جماعي | 🔴 cfo + reason |
| btn-fiscal-year-create | + سنة مالية | 🟢 super admin |
| btn-fiscal-year-lock | قفل السنة | 🔴 cfo |

---

## 8. Search & Filters

- Accounts: type, parent, control, active, hierarchy level
- JEs: source, status, period, account, dimensions, amount range
- Periods: status, year
- FX rates: currency pair, date range

---

## 9. Reports

- Trial Balance
- General Ledger (per account)
- Income Statement
- Balance Sheet
- Cash Flow Statement
- Statement of Equity
- Working Trial Balance (for audit)
- JE Listing
- Period-Close Checklist
- Sub-ledger Recon
- Multi-currency Position
- Account Hierarchy

---

## 10. Dashboards

- KPIs: Open Periods / Pending JEs / Out-of-balance / Multi-currency Exposure
- Charts: Trial balance trend, Account hierarchy view
- Lists: Drafts pending post, Recurring upcoming

---

## 11. Notifications

- JE pending approval
- JE posted
- Recurring run completed
- Period closed
- FX rate missing
- Sub-ledger out of sync
- Reversal due

---

## 12. Permissions

| Action | Accountant | Senior | Controller | CFO | Super |
|--------|-----------|--------|-----------|-----|-------|
| Create JE | ✓ | ✓ | ✓ | ✓ | ✓ |
| Post JE | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reverse | ✗ | ✓ | ✓ | ✓ | ✓ |
| Edit account | ✗ | ✗ | ✗ | ✓ | ✓ |
| Soft close | ✗ | ✗ | ✓ | ✓ | ✓ |
| Hard close | ✗ | ✗ | ✗ | ✓ | ✓ |
| Reopen | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create FY | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 13. Integrations

- Bank statements
- Sub-ledgers (AR/AP/Inventory/HR)
- Tax authorities (ZATCA/Zakat)
- BI tools
- External auditors (data export)

---

## 14. Shortcuts

- `Ctrl+J` New JE
- `Ctrl+T` Trial balance
- `Ctrl+L` Ledger
- `Ctrl+P` Post current

---

## 15. Mobile / Print

- Mobile: JE approve
- Print: JE form, GL detail, trial balance

---

## 16. Audit

- Every JE → audit trail
- Reversals link to original
- Period closes audited
- Account changes → field audit

---

## 17. Tests

```typescript
describe('JE Validation', () => { /* balanced, control accounts, period open */ })
describe('Recurring', () => { /* schedule, formulas */ })
describe('Reversing', () => { /* auto-reverse next period */ })
describe('FX Reval', () => { /* unrealized to realized */ })
describe('Period Close', () => { /* prerequisites, lockdown */ })
describe('Drill-down', () => { /* GL → JE → source doc */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| JE dated in closed period | reject |
| Control account direct post | reject |
| Multi-currency unbalanced | reject |
| FX rate missing | use last + warn |
| Recurring template with deleted account | error + alert |
| Period reopen during sub-ledger close | block |
| JE with 0 amount line | reject |
| Same-day FX rate change | use posting time |

---

**نهاية #24** • 8 سيناريوهات • 9 جداول • 8 forms • 8 grids • 33 button • 12 reports
