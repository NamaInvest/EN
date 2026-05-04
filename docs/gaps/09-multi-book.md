# النقص #9: Multi-Book / Multi-GAAP — مواصفات تفصيلية

> **المرجعيات:** SAP S/4HANA Parallel Ledgers، Oracle Fusion Subledger Accounting (SLA)، NetSuite Multi-Book、Workday Multi-Book Accounting
> **معايير:** IFRS، US GAAP、SOCPA、Zakat (KSA)、IND AS、HKFRS、ASPE (Canada)

---

## 1. البرومنت الكامل

```
فعّل Multi-Book Accounting في Namasoft ERP بمستوى SAP Parallel Ledgers:

ملفات موجودة:
- src/lib/multi-book-engine.ts (skeleton with mappings)
- prisma: AccountingBook, AccountMapping (exist but unused)

المتطلبات:

A) Concept:
   - Primary Book (PB): الأساسي، عادة IFRS-SAR
   - Secondary Books: Tax (Zakat)، Management、Group (consolidation)
   - كل JE يُرحّل في PB → ثم يُولَّد replicas في secondary books
   - تقارير منفصلة + reconciliation report

B) Account Mapping Rules:
   - PASS: نسخ السطر كما هو
   - EXCLUDE: تجاهل في هذا الـ book
   - AMOUNT_PCT: تطبيق نسبة (e.g., 50% deductible)
   - SPLIT: تقسيم لـ multiple accounts
   - CUSTOM_FORMULA: حساب مخصص
   - CURRENCY_TRANSLATE: تحويل عملة

C) Schema (extends موجود):
   - AccountingBook: + type, gaap, currency, isPrimary, fiscalYearStart
   - AccountMapping: + rule, ruleParams, effectiveDates
   - JournalEntry: + bookId, replicatedFromId, bookOnly, fxRateUsed
   - AccountMappingTemplate: pre-built (IFRS→US GAAP, IFRS→Zakat, etc.)
   - BookReconciliation: differences between books

D) Engine:
   1. createBook(name, type, gaap, currency, isPrimary)
   2. setMapping(bookId, sourceAccountId, targetAccountId, rule, params)
   3. replicateJournalEntry(jeId, targetBookId)
   4. replicateAllToBook(bookId, fromDate?) — backfill
   5. getBalances(bookId, asOfDate)
   6. compareBooks(bookA, bookB, asOfDate)

E) Use Cases:
   - شركة سعودية: PB=IFRS-SAR, Tax book=Zakat-SAR
   - شركة سعودية مع شركة أم US: PB=IFRS-SAR, Group=US GAAP-USD
   - شركة طبية: PB=IFRS-SAR, Statutory=MOH-specific
   - شركة بنكية: PB=IFRS-SAR, Regulatory=SAMA-specific

F) APIs (15 endpoints): انظر القسم 7

G) UI (8 pages): انظر قسم 5-7

H) Tests: 30+ unit, 12 integration, 4 E2E
```

---

## 2. السيناريوهات (8)

### A — Setup Multi-Book
```
1. CFO: /accounting/books → [+ Book جديد]
2. Wizard:
   - name: "Tax Book - Zakat"
   - type: TAX
   - gaap: ZAKAT
   - currency: SAR
   - isPrimary: false
   - fiscalYearStart: 1/1
3. النظام يفعّل + يقترح template mapping
4. CFO يقبل template → 50 mapping تُنشأ تلقائياً
5. CFO يعدل بعض mappings (مثلاً Entertainment expenses 50% deductible)
6. [Backfill] → النظام يُولّد replicas لكل قيود السنة الحالية
```

### B — Auto Replication
```
1. محاسب يدخل JE في PB:
   DR Entertainment 10,000
   CR Cash 10,000
2. عند POST:
   - النظام يبحث عن secondary books active
   - لكل book: يطبق mappings
   - Tax Book mapping: Entertainment → 50% deductible + 50% non-deductible
   - يُنشئ JE في Tax Book:
     DR Allowable Entertainment 5,000
     DR Non-Deductible Expense 5,000
     CR Cash 10,000
   - يربط بـ replicatedFromId
```

### C — Group Reporting (Currency Translation)
```
- شركة سعودية، Group book في US GAAP-USD
- JE في PB (SAR @ rate 0.267 USD/SAR):
  DR Inventory 100,000 SAR
  CR Cash 100,000 SAR
- في Group book:
  DR Inventory 26,700 USD
  CR Cash 26,700 USD
- mapping uses CURRENCY_TRANSLATE rule
- FX rate fetched from ExchangeRate table
- Period-end revaluation handled separately
```

### D — Book-only Adjustments
```
- Tax adjustments not in PB:
  - depreciation method differs (Tax: accelerated, Book: SL)
  - WIP capitalization differs
- محاسب: [+ Book-only JE] في Tax book
- JE marked: bookOnly = true, bookId = TaxBookId
- لا يظهر في PB
- يظهر فقط في Tax reports
```

### E — Book Reconciliation Report
```
- CFO: "أين الفرق بين IFRS و Zakat؟"
- /accounting/books/reconcile?bookA=PB&bookB=TaxBook&asOf=31/12/2026
- Report:
  - Account by account comparison
  - Differences explained:
    - Account 5050 Entertainment: PB 100K, Tax 50K (50% disallowed)
    - Account 5060 Depreciation: PB 200K, Tax 250K (accelerated)
  - Total Net Income difference: 50K
- Drill-down to see exact JEs causing difference
```

### F — Switching Reports between Books
```
- محاسب: /reports/trial-balance
- dropdown "Book": PB / Tax / Management / Group
- يختار Tax → trial balance reflects Tax book balances
- All amounts in Tax book's base currency
```

### G — Mapping Template Marketplace
```
- CFO يحتاج Tax book لكن لا يعرف من أين يبدأ
- /accounting/books/templates → marketplace
- templates available:
  - "IFRS to US GAAP" (50 mappings)
  - "IFRS to Zakat (KSA)" (35 mappings)
  - "IFRS to IND AS" (45 mappings)
- يختار "IFRS to Zakat" → import → النظام ينشئ mappings تلقائياً
- يخصصها حسب الحاجة
```

### H — Multi-currency Multi-book
```
- شركة سعودية بـ subsidiary في US:
- PB-SAUDI: IFRS-SAR
- PB-US-SUB: US GAAP-USD
- GROUP: IFRS-USD (consolidated)
- كل قيد في PB-SAUDI → replicated في GROUP بـ FX
- كل قيد في PB-US-SUB → replicated في GROUP بـ FX
- GROUP report يجمع الاثنين بـ USD
```

---

## 3. تدفق البيانات

```
[JE Posted in PB]
   ↓
JournalEntry created (POSTED, bookId = PB.id)
   ↓
trigger MultiBookEngine.replicateToSecondaryBooks(jeId)
   ↓
   for each active secondary book:
     ↓
     fetch all mappings for this book
     ↓
     for each line in source JE:
       findMapping(line.accountId, book.id, line.date)
         ↓
       apply rule:
         - PASS → copy line
         - EXCLUDE → skip
         - AMOUNT_PCT → adjust amount
         - SPLIT → create multiple lines
         - CURRENCY_TRANSLATE → fetch FX, convert
         - CUSTOM_FORMULA → execute formula
       ↓
     validate: balanced
     ↓
     create JournalEntry (bookId = book.id, replicatedFromId = source.id)
     ↓
     log AuditLog

[Manual Book-only JE]
POST /accounting/journal-entries
   { bookId: TaxBookId, bookOnly: true, lines: [...] }
   ↓
   validate book exists
   validate user has permission for this book
   ↓
   create JE (bookOnly = true, no replication)

[Reports per Book]
GET /reports/trial-balance?bookId=X&asOfDate=Y
   ↓
   if bookId == PB.id → query JEs WHERE bookId = PB.id
   else → query JEs WHERE bookId = X
     (includes both replicated AND bookOnly)
   ↓
   compute balances + return

[Book Comparison]
GET /accounting/books/compare?bookA=1&bookB=2&asOfDate=Y
   ↓
   getBalances(bookA, asOfDate)
   getBalances(bookB, asOfDate)
   ↓
   for each account:
     diff = bookA.balance - bookB.balance
     if diff != 0:
       fetch JEs causing difference
       categorize by mapping rule
   ↓
   return { differences: [...], totalDifference, explanations }
```

---

## 4. Prisma Schema

```prisma
model AccountingBook {
  id                  Int               @id @default(autoincrement())
  code                String            @unique
  name                String
  nameAr              String?
  description         String?
  
  type                String            // 'PRIMARY' | 'TAX' | 'MANAGEMENT' | 'GROUP' | 'STATUTORY' | 'REGULATORY'
  gaapStandard        String            // 'IFRS' | 'SOCPA' | 'US_GAAP' | 'IND_AS' | 'ZAKAT' | 'HKFRS' | 'ASPE' | 'CUSTOM'
  baseCurrency        String            @default("SAR")
  
  isPrimary           Boolean           @default(false)
  isActive            Boolean           @default(true)
  
  fiscalYearStart     String            @default("01-01")  // MM-DD
  
  // Source book (for replication)
  sourceBookId        Int?
  sourceBook          AccountingBook?   @relation("BookReplication", fields: [sourceBookId], references: [id])
  derivedBooks        AccountingBook[]  @relation("BookReplication")
  
  // Replication settings
  autoReplicate       Boolean           @default(true)
  replicateOnPost     Boolean           @default(true)
  
  // Currency
  exchangeRateSource  String            @default("ECB")  // 'ECB' | 'SAMA' | 'CUSTOM' | 'MANUAL'
  exchangeRateMethod  String            @default("AVERAGE")  // 'AVERAGE' | 'CLOSING' | 'HISTORICAL' | 'TRANSACTION'
  
  // Audit
  createdByUserId     String
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  
  // Relations
  mappings            AccountMapping[]
  journalEntries      JournalEntry[]
  
  @@index([type, isActive])
}

model AccountMapping {
  id                  Int               @id @default(autoincrement())
  bookId              Int
  book                AccountingBook    @relation(fields: [bookId], references: [id], onDelete: Cascade)
  
  sourceAccountId     Int
  sourceAccount       Account           @relation("MappingSource", fields: [sourceAccountId], references: [id])
  targetAccountId     Int?
  targetAccount       Account?          @relation("MappingTarget", fields: [targetAccountId], references: [id])
  
  rule                String            // 'PASS' | 'EXCLUDE' | 'AMOUNT_PCT' | 'SPLIT' | 'CURRENCY_TRANSLATE' | 'CUSTOM_FORMULA'
  ruleParams          Json?             // {pct: 50, splitTo: [{accountId, pct}], formula: 'amount * 0.85', etc.}
  
  effectiveFrom       DateTime          @default(now())
  effectiveTo         DateTime?
  
  notes               String?
  
  createdByUserId     String?
  createdAt           DateTime          @default(now())
  
  @@unique([bookId, sourceAccountId, effectiveFrom])
  @@index([bookId, sourceAccountId])
}

model AccountMappingTemplate {
  id                  Int               @id @default(autoincrement())
  code                String            @unique
  name                String
  description         String?
  fromGaap            String            // 'IFRS'
  toGaap              String            // 'ZAKAT'
  countryCode         String?
  industry            String?
  mappings            Json              // [{sourceAccountCode, targetAccountCode, rule, params}]
  isOfficial          Boolean           @default(false)
  popularity          Int               @default(0)
  rating              Decimal?          @db.Decimal(3,2)
}

model JournalEntry {
  // ... existing
  bookId              Int               @default(1)
  book                AccountingBook    @relation(fields: [bookId], references: [id])
  
  replicatedFromId    Int?
  replicatedFrom      JournalEntry?     @relation("Replications", fields: [replicatedFromId], references: [id])
  replications        JournalEntry[]    @relation("Replications")
  
  bookOnly            Boolean           @default(false)
  
  fxRateUsed          Decimal?          @db.Decimal(20,8)
  fxRateDate          DateTime?
  fxRateSource        String?
  
  @@index([bookId, postedAt])
  @@index([replicatedFromId])
}

model BookReconciliation {
  id                  Int               @id @default(autoincrement())
  bookAId             Int
  bookA               AccountingBook    @relation("BookReconA", fields: [bookAId], references: [id])
  bookBId             Int
  bookB               AccountingBook    @relation("BookReconB", fields: [bookBId], references: [id])
  
  asOfDate            DateTime
  
  totalDifference     Decimal           @db.Decimal(20,4)
  differencesDetailed Json              // [{accountCode, balanceA, balanceB, diff, explanation, mappingId?}]
  explanationsCount   Int               @default(0)
  unexplainedCount    Int               @default(0)
  
  generatedAt         DateTime          @default(now())
  generatedByUserId   String
  
  pdfUrl              String?
  
  @@index([bookAId, bookBId, asOfDate])
}

model BookOnlyJournalCategory {
  id                  Int               @id @default(autoincrement())
  bookId              Int
  code                String
  name                String
  description         String?
  defaultAccounts     Int[]
  requiresApproval    Boolean           @default(false)
  
  @@unique([bookId, code])
}
```

---

## 5. Forms & Fields

### Form A: Create Book
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| code | text | ✓ | uppercase, 3-10 chars, unique |
| name (En) | text | ✓ | — |
| nameAr | text | ✓ | — |
| description | textarea | ✗ | — |
| type | dropdown | ✓ | PRIMARY/TAX/MANAGEMENT/GROUP/STATUTORY/REGULATORY |
| gaapStandard | dropdown | ✓ | IFRS/SOCPA/US_GAAP/etc |
| baseCurrency | dropdown | ✓ | ISO 4217 |
| isPrimary | toggle | ✓ | only 1 PB allowed |
| sourceBookId | dropdown | conditional | required if not isPrimary |
| autoReplicate | toggle | ✓ | default true |
| fiscalYearStart | text | ✓ | MM-DD format |
| exchangeRateMethod | dropdown | ✓ | AVERAGE/CLOSING/HISTORICAL/TRANSACTION |

### Form B: Account Mapping
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| bookId | hidden | ✓ | — |
| sourceAccountId | account picker | ✓ | from PB chart |
| targetAccountId | account picker | conditional | required unless EXCLUDE |
| rule | dropdown | ✓ | PASS/EXCLUDE/AMOUNT_PCT/SPLIT/CURRENCY_TRANSLATE/CUSTOM_FORMULA |
| ruleParams.pct | number | conditional | if AMOUNT_PCT, 0-100 |
| ruleParams.splitTo | dynamic table | conditional | if SPLIT, sum=100% |
| ruleParams.formula | textarea | conditional | if CUSTOM_FORMULA |
| effectiveFrom | datepicker | ✓ | — |
| effectiveTo | datepicker | ✗ | > effectiveFrom |
| notes | textarea | ✗ | — |

### Form C: Bulk Mapping Import
| Field | Type | Required |
|-------|------|----------|
| bookId | hidden | ✓ |
| templateId | dropdown | conditional (or file) |
| file | file upload (CSV) | conditional |
| mode | radio | ✓ (Replace All / Add New / Update Existing) |

### Form D: Book-only JE
| Field | Type | Required |
|-------|------|----------|
| bookId | dropdown | ✓ secondary books only |
| date | datepicker | ✓ |
| description | textarea | ✓ min 30 |
| reason | dropdown | ✓ from BookOnlyJournalCategory |
| lines | dynamic table | ✓ min 2 + balanced |
| supportingDocs | file upload | ✗ |

### Form E: Book Comparison
| Field | Type | Required |
|-------|------|----------|
| bookA | dropdown | ✓ |
| bookB | dropdown | ✓ ≠ bookA |
| asOfDate | datepicker | ✓ |
| accountFilter | multi-select | ✗ |
| onlyDifferences | toggle | ✗ |

---

## 6. Tables & Columns

### Grid A: Books
| Column | Width |
|--------|-------|
| Code | 100 |
| Name (Ar) | 200 |
| Name (En) | 200 |
| Type | badge | 130 |
| GAAP | badge | 100 |
| Currency | 80 |
| Primary | toggle | 80 |
| Source Book | 150 |
| Mappings | counter | 100 |
| JEs | counter | 100 |
| Active | toggle | 80 |
| Actions: [Edit] [Mappings] [Replicate Now] [Compare] | 250 |

### Grid B: Account Mappings
| Column | Width |
|--------|-------|
| Source Account | 250 |
| Target Account | 250 |
| Rule | badge | 130 |
| Params (preview) | text | 200 |
| Effective From | date | 130 |
| Effective To | date | 130 |
| Notes | text | 200 |
| Actions: [Edit] [Test] [Deactivate] [Delete] | 200 |

### Grid C: Book Comparison
| Column | Width |
|--------|-------|
| Account Code | 100 |
| Account Name | 250 |
| Book A Balance | money | 150 |
| Book B Balance | money | 150 |
| Difference | money | 150 |
| % | percent | 80 |
| Explanation | text | 250 |
| Mapping | link | 130 |
| Actions: [Drill Down] | 100 |

### Grid D: Book-only JEs
| Column | Width |
|--------|-------|
| JE # | 100 |
| Date | 110 |
| Book | badge | 150 |
| Category | badge | 150 |
| Description | text | 300 |
| Amount | money | 150 |
| Created By | user | 130 |
| Approved By | user | 130 |
| Actions: [View] [Reverse] | 150 |

### Grid E: Replication Log
| Column | Width |
|--------|-------|
| Source JE | link | 130 |
| Target JE | link | 130 |
| Source Book | badge | 150 |
| Target Book | badge | 150 |
| Replicated At | datetime | 150 |
| Status | badge | 110 |
| Differences | text | 200 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-book-create | + Book جديد | books page | 🟢 | role.cfo |
| btn-book-edit | تعديل | book row | ⬜ | role.cfo |
| btn-book-deactivate | تعطيل | book row | 🟡 | role.cfo + reason |
| btn-book-delete | حذف | book row | 🔴 | unused only + super_admin |
| btn-book-set-primary | تعيين كأساسي | book row | 🔴 | super_admin only + warns |
| btn-mapping-create | + mapping | mappings | 🟢 | role.cfo |
| btn-mapping-edit | تعديل | mapping row | ⬜ | role.cfo |
| btn-mapping-test | اختبار | mapping editor | 🟡 | role.cfo |
| btn-mapping-delete | حذف | mapping row | 🔴 | role.cfo |
| btn-mapping-bulk-import | استيراد | mappings | ⬜ | role.cfo |
| btn-mapping-template-apply | تطبيق template | mappings | 🟦 | role.cfo |
| btn-replicate-je | استنساخ يدوي | JE detail | 🟦 | role.cfo |
| btn-replicate-all | استنساخ من PB | book detail | 🟡 | role.cfo + confirm |
| btn-compare-books | قارن | book row | 🟦 | role.cfo |
| btn-export-comparison | تصدير | comparison | ⬜ | role.cfo |
| btn-book-only-je | + قيد book-only | book detail | 🟢 | role.cfo |
| btn-switch-book-report | تبديل book في تقرير | reports | 🟦 | viewer |
| btn-reconcile-books | تسوية بين books | books page | 🟦 | role.cfo |
| btn-template-marketplace | متجر templates | mappings | ⬜ | role.cfo |
| btn-template-rate | تقييم template | template | ⬜ | role.cfo |

---

## 8. Search & Filters

### Books:
- Type, GAAP, Currency, Active, Primary

### Mappings:
- Book, Source account, Target account, Rule type, Effective on date

### Comparison:
- Only differences, Threshold (e.g., > 100), Account category

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Book Reconciliation Report | bookA vs bookB |
| Trial Balance per Book | each book separate |
| Income Statement per Book | — |
| Balance Sheet per Book | — |
| Book-only Adjustments | summary of bookOnly JEs |
| Replication Audit | what was replicated when |
| Mapping Inventory | all mappings active |
| Book Health | unmapped accounts |
| Multi-currency Report | per book per currency |
| Consolidation-ready Report | for group reporting |

---

## 10. Dashboards & Widgets

- KPIs: Total Books / Mappings Count / Last Replication / Outstanding Differences
- Charts: P&L per book comparison, Equity differences
- Lists: Unmapped accounts, Recent book-only JEs, Mapping changes

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Book created | email | CFO |
| Book deactivated | email | CFO |
| Mapping changed | in-app | mapping owner |
| Replication failed | email + Slack | controller |
| Book-only JE posted | in-app | CFO |
| Major difference detected | email | CFO |
| FX rate missing | in-app | controller |

---

## 12. Permissions Matrix

| Action | Accountant | Senior | Controller | CFO | Super Admin |
|--------|-----------|--------|-----------|-----|-------------|
| View books | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create book | ✗ | ✗ | ✗ | ✓ | ✓ |
| Set primary | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create mapping | ✗ | ✗ | ✓ | ✓ | ✓ |
| Edit mapping | ✗ | ✗ | ✓ | ✓ | ✓ |
| Replicate manually | ✗ | ✗ | ✓ | ✓ | ✓ |
| Book-only JE | ✗ | ✗ | ✓ | ✓ | ✓ |
| Compare books | ✗ | ✓ | ✓ | ✓ | ✓ |
| Switch book in reports | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| ExchangeRate API | live FX rates |
| SAMA rates | KSA central bank rates |
| BullMQ | background replication |
| Group reporting tools | export consolidated data |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Switch book in reports |
| `Ctrl+M` | Open mappings |
| `Ctrl+Shift+R` | Run replication |

---

## 15. Mobile / Print

- Mobile: book switcher in reports
- Print: book comparison report (audit-ready)

---

## 16. Audit & Logging

- Mapping changes → FieldAuditLog
- Replication runs → ReplicationLog
- Book-only JEs → flagged in audit
- Book deactivations → require approval + log

---

## 17. Test Cases

```typescript
describe('Replication', () => {
  test('PASS rule copies line as-is')
  test('EXCLUDE skips line')
  test('AMOUNT_PCT adjusts amount')
  test('SPLIT creates multiple lines')
  test('CURRENCY_TRANSLATE converts')
  test('CUSTOM_FORMULA executes')
  test('replicated JE balanced')
  test('respects effectiveFrom/To')
  test('handles missing mapping (default behavior)')
})

describe('Book-only JE', () => {
  test('does not propagate to PB')
  test('only visible in target book reports')
  test('cannot reference PB JE')
})

describe('Comparison', () => {
  test('detects all differences')
  test('explains via mapping rules')
  test('drill-down to JEs')
})

describe('Templates', () => {
  test('IFRS to Zakat applies correctly')
  test('IFRS to US GAAP correct')
})

describe('Currency Translation', () => {
  test('uses correct FX rate per date')
  test('uses correct method (AVG/CLOSING/HISTORICAL)')
  test('handles cross-rate (SAR→USD via EUR)')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Source account has no mapping | use default (PASS) |
| Target account doesn't exist | error + alert |
| Mapping changes mid-period | apply by JE date |
| FX rate missing | use last known + warn |
| Replicated JE deleted | undo source replication |
| Source JE reversed | reverse all replications |
| Book deactivated mid-year | freeze + reports still available |
| Multiple PB attempted | reject (only 1 allowed) |
| Mapping creates unbalanced JE | reject + show error |
| Custom formula throws | log + use 0 + alert |
| Period closed in source, open in target | replicate but warn |
| Bulk mapping import with errors | rollback all |

---

**نهاية مواصفات النقص #9**

> 8 سيناريوهات • 6 جداول schema • 5 forms • 5 grids • 20 button • 8 widgets • 7 notifications • 10 reports
