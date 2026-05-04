# النقص #7: Bank Statement Importers (CAMT.053/OFX/Bank-specific) — مواصفات تفصيلية

> **المرجعيات:** SAP FF.5 (Electronic Bank Statement)، Oracle Bank Statement Import، NetSuite Auto Bank Imports، Plaid، Yodlee، Tink، Lean Technologies (KSA Open Banking)
> **معايير:** ISO 20022 CAMT.053/052/054、SWIFT MT940/942、OFX 2.x、BAI2、SAMA Open Banking Framework

---

## 1. البرومنت الكامل

```
ابني نظام Bank Statement Import شامل مع 8 parsers مختلفة + PDF OCR:

ملفات موجودة:
- src/lib/bank-statement-importer.ts (basic MT940 + CSV)

المتطلبات:

A) Parsers (src/lib/bank-statement-parsers/):
   1. mt940.ts — SWIFT MT940 (full tag support)
   2. mt942.ts — SWIFT MT942 (intra-day)
   3. camt053.ts — ISO 20022 CAMT.053 (XML, end-of-day)
   4. camt052.ts — ISO 20022 CAMT.052 (XML, intra-day)
   5. camt054.ts — ISO 20022 CAMT.054 (XML, debit/credit notification)
   6. ofx.ts — OFX 2.x (SGML/XML, US banks + QuickBooks)
   7. bai2.ts — BAI2 (US legacy)
   8. csv-generic.ts — configurable column mapping
   9. excel-generic.ts — Excel import with mapping
   10. alrajhi-csv.ts — Saudi Al Rajhi specific
   11. ncb-excel.ts — Saudi NCB specific
   12. sab-csv.ts — SAB specific
   13. samba-csv.ts — Samba specific
   14. anb-csv.ts — Arab National Bank
   15. bsf-csv.ts — Banque Saudi Fransi
   16. pdf-ocr.ts — PDF OCR via Gemini Vision
   17. open-banking-api.ts — Lean/Tarabut API integration

B) Each parser returns standardized format:
   {
     statementId,
     bankCode,
     accountNumber,
     iban,
     currency,
     openingBalance,
     openingDate,
     closingBalance,
     closingDate,
     statementSequence,
     transactions: [{
       transactionDate, valueDate, amount, currency,
       type: 'DEBIT' | 'CREDIT',
       description, reference, externalReference,
       counterpartyName, counterpartyIBAN, counterpartyBank,
       category, // auto-classified
       rawData
     }],
     metadata: { source, parseConfidence, parsedAt }
   }

C) Engine src/lib/bank-statement-engine.ts:
   1. Auto-detection: parseAuto(file, fileName, hint?)
   2. Validation: opening + sum(txns) = closing
   3. Duplicate detection: hash per transaction
   4. Multi-account file splitting
   5. PDF OCR with confidence scoring + manual review queue
   6. Auto-categorization (AI-assisted)
   7. Trigger reconciliation engine
   8. Notification on import

D) Open Banking Integration (Saudi):
   - Lean Technologies API
   - Tarabut Gateway API
   - daily auto-fetch (no manual upload)
   - SAMA-compliant consent management

E) APIs (15 endpoints): انظر القسم 7

F) UI (8 pages): انظر قسم 5-7

G) Tests: 50+ unit (per format), 15 integration, 5 E2E
```

---

## 2. السيناريوهات (8)

### A — Manual Upload (Al Rajhi CSV)
```
1. AP clerk: /banks/statements → [استيراد كشف]
2. Modal:
   - bank account: الراجحي - الحساب الرئيسي
   - file: drag-drop alrajhi_oct.csv
   - النظام يكتشف auto: "alrajhi-csv" ✓
3. Parser يقرأ:
   - 1,250 معاملة
   - opening 5,000,000
   - closing 4,234,500
4. Validation:
   - opening - sum(debits) + sum(credits) = closing? ✓
5. Duplicate check:
   - 50 معاملة مكررة (مرفوعة سابقاً) → skip
6. Insert:
   - BankStatement created
   - 1,200 BankStatementLine inserted
7. Result:
   "✓ تم استيراد 1,200 معاملة جديدة + 50 مكررة تم تخطيها"
8. Auto-trigger reconciliation engine
```

### B — Multi-account CAMT.053
```
- البنك يرسل XML CAMT.053 يحوي 3 حسابات
- Parser يقرأ:
  - 3 <Stmt> elements
  - يفصلها لـ 3 BankStatement records
  - يربطها بـ BankAccount.iban
- لو حساب غير معروف → exception + manual mapping
```

### C — PDF OCR (no CSV available)
```
- البنك الصغير يرسل فقط PDF
- AP clerk: "استيراد كشف" → اختار "PDF"
- يرفع statement.pdf
- Gemini Vision API:
  - prompt: "Extract bank statement transactions..."
  - response: structured JSON
  - confidence per field
- النظام:
  - 80 معاملة، confidence > 90% → auto-import
  - 5 معاملات confidence 70-90% → manual review queue
  - 2 معاملات confidence < 70% → flagged for human entry
- AP clerk يفتح review queue → يصحح/يؤكد
```

### D — Open Banking Auto-fetch (Lean)
```
- الشركة عندها حساب Al Rajhi مرتبط بـ Lean API
- Cron يومي 6 ص:
  - يجلب transactions من Lean API لكل حساب
  - يستخدم last_fetch timestamp لتحديد range
  - يحوّل لـ standard format
  - يحفظ كـ BankStatement
- لا حاجة لرفع يدوي
```

### E — Balance Mismatch
```
- Parser قرأ:
  - opening 1,000,000
  - sum(transactions) = -200,000
  - expected closing: 800,000
  - reported closing: 850,000
- Validation FAIL: difference = 50,000
- النظام:
  - reject import
  - عرض difference + suggest causes
  - allow override "import anyway" (with reason)
```

### F — Duplicate Detection
```
- نفس الـ statement رُفع مرتين (خطأ)
- الـ parser يكتشف:
  - hash(date+amount+ref+counterparty) match
  - skip insertion
  - report: "هذا الـ statement مرفوع سابقاً في date X"
```

### G — Bank-specific Quirk Handling
```
- Al Rajhi CSV لها:
  - Date format: dd/MM/yyyy (مع slash)
  - Amount with Arabic numerals optional
  - "Particulars" column = description
  - "Reference" قد يكون فارغ
- NCB Excel:
  - Date format: yyyy-MM-dd
  - Multi-line description (newline within cell)
- SAB:
  - Pipe-delimited CSV
  - Encoding: ISO-8859-1
- كل parser يتعامل مع quirks
```

### H — Real-time CAMT.052 (Intra-day)
```
- Bank يرسل CAMT.052 كل ساعة (intraday balance)
- Webhook: /webhooks/bank-statements/camt052
- النظام:
  - يحفظ كـ "intraday snapshot"
  - يحدّث dashboard cash position live
  - لا يربطه بـ reconciliation (only end-of-day CAMT.053)
```

---

## 3. تدفق البيانات

```
[Manual Upload]
POST /banks/statements/upload (multipart)
   { file, bankAccountId, formatHint? }
      ↓
   if formatHint provided → use that parser
   else → parseAuto():
     - check file extension (.xml, .csv, .ofx, .pdf, .txt)
     - sniff content first 1KB
     - try parsers in order of likelihood
   ↓
   parser.parse(buffer) → Statement object
   ↓
   validate:
     - balance check
     - currency check
     - account match
   ↓
   for each transaction:
     - compute hash
     - check duplicate
     - if not duplicate → queue for insert
   ↓
   begin TX:
     INSERT BankStatement
     INSERT BankStatementLine[] (bulk)
   commit
   ↓
   return { statementId, txnsImported, duplicatesSkipped, lowConfidenceCount }
   ↓
   trigger ReconciliationEngine.matchStatement(statementId)

[PDF OCR]
POST /banks/statements/upload-pdf-ocr
   ↓
   call Gemini Vision API:
     prompt template: "Extract this bank statement..."
     return structured JSON
   ↓
   for each transaction:
     - assign confidence score
     - high (>90%) → auto-import
     - medium (70-90%) → review queue
     - low (<70%) → manual entry
   ↓
   import + queue
   ↓
   return { autoImported, reviewQueue, manualNeeded }

[Open Banking Cron]
Cron daily 6 AM:
   for each linked bank account:
     last_fetch = bankAccount.lastApiFetch
     call OpenBankingProvider.fetchTransactions(account, from=last_fetch, to=now)
        ↓
     standardize format
     dedupe
     insert as BankStatement
     update bankAccount.lastApiFetch = now
   ↓
   notify if errors

[Webhook CAMT.052]
POST /webhooks/bank-statements/camt052
   verify signature (HMAC)
      ↓
   parse XML
   save as IntraDayBalance
   update dashboard cache
```

---

## 4. Prisma Schema

```prisma
model BankStatement {
  id                          Int               @id @default(autoincrement())
  bankAccountId               Int
  bankAccount                 BankAccount       @relation(fields: [bankAccountId], references: [id])
  statementNumber             String?
  sequenceNumber              Int?
  
  fileFormat                  String            // 'MT940' | 'MT942' | 'CAMT053' | 'CAMT052' | 'CAMT054' | 'OFX' | 'BAI2' | 'CSV' | 'EXCEL' | 'PDF_OCR' | 'API_OPEN_BANKING'
  fileUrl                     String?
  fileName                    String?
  fileHash                    String?
  fileSizeBytes               Int?
  
  importedAt                  DateTime          @default(now())
  importedByUserId            String?
  importMethod                String            // 'MANUAL' | 'API' | 'OCR' | 'WEBHOOK' | 'CRON_AUTO'
  
  currency                    String
  openingBalance              Decimal           @db.Decimal(20,4)
  openingDate                 DateTime
  closingBalance              Decimal           @db.Decimal(20,4)
  closingDate                 DateTime
  
  validationStatus            String            @default("PENDING")  // 'PENDING' | 'VALID' | 'BALANCE_MISMATCH' | 'DUPLICATE' | 'INVALID_FORMAT'
  validationDifference        Decimal?          @db.Decimal(20,4)
  validationOverridden        Boolean           @default(false)
  validationOverrideReason    String?
  
  duplicatesCount             Int               @default(0)
  lowConfidenceCount          Int               @default(0)
  totalTransactions           Int               @default(0)
  
  parseConfidence             Decimal?          @db.Decimal(5,2)  // for OCR
  
  reconStatus                 String            @default("NOT_STARTED")  // NOT_STARTED | IN_PROGRESS | COMPLETED | PARTIAL
  reconciliationId            Int?
  
  lines                       BankStatementLine[]
  intraDay                    Boolean           @default(false)
  
  @@index([bankAccountId, openingDate])
  @@index([fileFormat, importedAt])
  @@index([reconStatus])
}

model BankStatementLine {
  id                          Int               @id @default(autoincrement())
  statementId                 Int
  statement                   BankStatement     @relation(fields: [statementId], references: [id], onDelete: Cascade)
  
  transactionDate             DateTime
  valueDate                   DateTime?
  postingDate                 DateTime?
  
  amount                      Decimal           @db.Decimal(20,4)
  currency                    String
  type                        String            // 'DEBIT' | 'CREDIT'
  
  description                 String            @db.Text
  reference                   String?
  externalReference           String?           // bank's internal ref
  
  counterpartyName            String?
  counterpartyIBAN            String?
  counterpartyBank            String?
  counterpartyCountry         String?
  
  category                    String?           // auto-classified: 'TRANSFER' | 'FEE' | 'INTEREST' | 'CHECK' | 'CARD' | 'CASH' | 'STANDING_ORDER' | 'DIRECT_DEBIT' | 'FX' | 'OTHER'
  categoryConfidence          Decimal?          @db.Decimal(5,2)
  
  ocrConfidence               Decimal?          @db.Decimal(5,2)  // for PDF OCR per-field
  needsReview                 Boolean           @default(false)
  reviewedAt                  DateTime?
  reviewedByUserId            String?
  
  isDuplicate                 Boolean           @default(false)
  duplicateOfLineId           Int?
  
  hash                        String            // SHA-256 of (date+amount+ref+counterparty)
  rawData                     Json?
  
  matchStatus                 String            @default("UNMATCHED")  // 'UNMATCHED' | 'AUTO_MATCHED' | 'MANUAL_MATCHED' | 'EXCEPTION' | 'IGNORED'
  matchedToType               String?           // 'JE' | 'PAYMENT' | 'CHECK' | 'CASH_RECEIPT'
  matchedToId                 Int?
  matchedAt                   DateTime?
  matchedByUserId             String?
  matchConfidence             Decimal?          @db.Decimal(5,2)
  matchStrategy               String?           // 'EXACT' | 'FUZZY' | 'AI' | 'RULE'
  
  @@index([hash])
  @@index([statementId, type])
  @@index([transactionDate])
  @@index([matchStatus])
  @@index([needsReview])
}

model BankAccount {
  // ... existing
  bankCode                    String?           // 'ALRAJHI' | 'NCB' | 'SAB' | 'SAMBA' | 'ANB' | 'BSF'
  preferredFileFormat         String?
  fileEncoding                String            @default("utf-8")
  fileColumnMapping           Json?             // for csv-generic
  
  // Open Banking
  openBankingProvider         String?           // 'LEAN' | 'TARABUT' | 'NONE'
  openBankingAccountId        String?           // provider's account ID
  openBankingConsentExpiresAt DateTime?
  openBankingLastFetchAt      DateTime?
  openBankingFetchEnabled     Boolean           @default(false)
  openBankingFetchFrequency   String            @default("DAILY")  // 'HOURLY' | 'DAILY' | 'WEEKLY'
  
  intraDayBalance             Decimal?          @db.Decimal(20,4)
  intraDayBalanceUpdatedAt    DateTime?
  
  statements                  BankStatement[]
  intraDayBalances            IntraDayBalance[]
}

model IntraDayBalance {
  id                          Int               @id @default(autoincrement())
  bankAccountId               Int
  bankAccount                 BankAccount       @relation(fields: [bankAccountId], references: [id])
  asOfTimestamp               DateTime
  balance                     Decimal           @db.Decimal(20,4)
  currency                    String
  source                      String            // 'CAMT052' | 'API' | 'WEBSITE_SCRAPE'
  receivedAt                  DateTime          @default(now())
  
  @@index([bankAccountId, asOfTimestamp])
}

model BankImportError {
  id                          Int               @id @default(autoincrement())
  bankAccountId               Int?
  fileName                    String?
  errorType                   String            // 'PARSE_ERROR' | 'BALANCE_MISMATCH' | 'DUPLICATE' | 'UNKNOWN_FORMAT' | 'UNKNOWN_ACCOUNT'
  errorMessage                String            @db.Text
  fileSnippet                 String?           @db.Text
  occurredAt                  DateTime          @default(now())
  resolvedAt                  DateTime?
  resolvedByUserId            String?
  resolution                  String?
  
  @@index([bankAccountId, occurredAt])
}

model BankStatementReviewItem {
  id                          Int               @id @default(autoincrement())
  lineId                      Int               @unique
  line                        BankStatementLine @relation(fields: [lineId], references: [id], onDelete: Cascade)
  fieldsToReview              String[]          // ['amount', 'date', 'description']
  ocrSnippet                  String?           // image cropped of the field
  suggestedValues             Json?
  reviewerNotes               String?
  reviewedAt                  DateTime?
  reviewedByUserId            String?
}
```

---

## 5. Forms & Fields

### Form A: Upload Statement
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| bankAccountId | dropdown | ✓ | active accounts |
| file | file upload | ✓ | <50MB |
| formatHint | dropdown | ✗ | auto-detect by default |
| dateRangeFrom | datepicker | ✗ | for partial files |
| dateRangeTo | datepicker | ✗ | — |
| triggerReconciliation | toggle | ✓ | default true |
| skipDuplicates | toggle | ✓ | default true |

### Form B: Generic CSV Mapping
| Field | Type | Required |
|-------|------|----------|
| sampleFile | file upload | ✓ |
| delimiter | dropdown | ✓ comma/semicolon/tab/pipe |
| encoding | dropdown | ✓ |
| hasHeader | toggle | ✓ |
| dateColumn | column picker | ✓ |
| dateFormat | text | ✓ (e.g. dd/MM/yyyy) |
| amountColumn | column picker | ✓ |
| amountFormat | dropdown | ✓ separate dr/cr or single |
| descriptionColumn | column picker | ✓ |
| referenceColumn | column picker | ✗ |
| counterpartyColumn | column picker | ✗ |

### Form C: PDF OCR Review
| Field | Type | Required |
|-------|------|----------|
| transactionDate | datepicker | ✓ |
| amount | money | ✓ |
| type | radio | ✓ |
| description | text | ✓ |
| reference | text | ✗ |
| counterpartyName | text | ✗ |
| confirmCorrect | checkbox | ✓ |

### Form D: Open Banking Setup
| Field | Type | Required |
|-------|------|----------|
| provider | dropdown | ✓ LEAN/TARABUT |
| consentRedirectUrl | display | — |
| consentDuration | dropdown | ✓ 30d/60d/90d/180d |
| autoFetchEnabled | toggle | ✓ |
| fetchFrequency | dropdown | ✓ |

### Form E: Override Validation
| Field | Type | Required |
|-------|------|----------|
| reason | textarea | ✓ min 100 |
| approvedByPassword | password | ✓ |

---

## 6. Tables & Columns

### Grid A: Statements List
| Column | Width |
|--------|-------|
| Bank Account | 200 |
| Format | badge | 100 |
| Period | dates | 200 |
| Opening Bal | money | 130 |
| Closing Bal | money | 130 |
| Txns | counter | 80 |
| Recon Status | badge | 130 |
| Validation | badge | 110 |
| Imported By | user | 130 |
| Imported At | datetime | 150 |
| Actions: [View] [Re-recon] [Delete] | 200 |

### Grid B: Statement Lines
| Column | Width |
|--------|-------|
| Line # | 60 |
| Date | 110 |
| Value Date | 110 |
| Type | badge D/C | 70 |
| Amount | money | 130 |
| Currency | 80 |
| Description | text (truncate) | 250 |
| Reference | text | 130 |
| Counterparty | text | 200 |
| Category | badge | 110 |
| Match Status | badge | 130 |
| Match Confidence | progress | 100 |
| Matched To | link | 150 |
| Actions: [Match] [Create JE] [Ignore] | 200 |

### Grid C: Review Queue (low confidence)
| Column | Width |
|--------|-------|
| File | 200 |
| Page | 60 |
| Field | 130 |
| OCR Value | text | 200 |
| Confidence | progress | 100 |
| Suggested | text | 200 |
| Actions: [Edit] [Confirm] [Skip] | 180 |

### Grid D: Import Errors
| Column | Width |
|--------|-------|
| Bank Account | 200 |
| File | 200 |
| Error Type | badge | 150 |
| Message | text | 300 |
| Occurred | datetime | 150 |
| Resolved | toggle | 100 |
| Actions: [View] [Resolve] [Retry] | 200 |

### Grid E: Open Banking Connections
| Column | Width |
|--------|-------|
| Account | 200 |
| Provider | badge | 100 |
| Consent Status | badge | 130 |
| Consent Expires | date | 130 |
| Last Fetch | datetime | 150 |
| Auto Fetch | toggle | 100 |
| Frequency | badge | 100 |
| Actions: [Renew] [Disconnect] [Fetch Now] | 250 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-import-statement | + استيراد كشف | statements | 🟢 | role.ar OR role.ap |
| btn-import-pdf-ocr | استيراد PDF OCR | statements | 🟡 | role.ar OR role.ap |
| btn-import-bulk | استيراد متعدد | statements | 🟦 | role.ar_supervisor |
| btn-statement-view | عرض | statement row | 🟦 | viewer |
| btn-statement-recon | تشغيل المطابقة | statement row | 🟦 | role.ar |
| btn-statement-delete | حذف | statement row | 🔴 | unmatched only + role.admin |
| btn-statement-revalidate | إعادة التحقق | statement row | ⬜ | role.ar |
| btn-override-validation | تجاوز التحقق | mismatch alert | 🟡 | role.cfo + reason |
| btn-line-match | مطابقة | line row | 🟦 | role.ar |
| btn-line-create-je | إنشاء قيد | line row | 🟢 | role.ar |
| btn-line-ignore | تجاهل | line row | 🔴 | role.ar + reason |
| btn-line-categorize | تصنيف | line row | ⬜ | role.ar |
| btn-bulk-categorize | تصنيف مجموعة | lines | ⬜ | role.ar |
| btn-review-confirm | تأكيد | review queue | 🟢 | role.ar |
| btn-review-edit | تعديل | review queue | ⬜ | role.ar |
| btn-review-skip | تخطي | review queue | 🔴 | role.ar |
| btn-error-resolve | حل الخطأ | error row | 🟢 | role.ar_supervisor |
| btn-error-retry | إعادة المحاولة | error row | 🟡 | role.ar |
| btn-csv-mapping-create | + قالب CSV | settings | 🟢 | role.admin |
| btn-csv-mapping-test | اختبار | mapping | 🟡 | role.admin |
| btn-ob-connect | ربط Open Banking | bank account | 🟦 | role.ap_manager |
| btn-ob-disconnect | فصل | OB connection | 🔴 | role.ap_manager |
| btn-ob-renew-consent | تجديد الموافقة | OB connection | 🟢 | role.ap_manager |
| btn-ob-fetch-now | جلب الآن | OB connection | 🟦 | role.ap |
| btn-export-statement | تصدير | statement | ⬜ | viewer |

---

## 8. Search & Filters

### Statements:
- Bank account, Format, Date range, Recon status, Validation status, Importer

### Lines:
- Statement, Date range, Type (D/C), Amount range, Category, Match status, Counterparty search

### Errors:
- Type, Resolved, Date range, Bank account

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Import History | per period |
| Format Distribution | which formats most used |
| Error Analysis | error types + frequency |
| Auto-match Effectiveness | % auto vs manual |
| Open Banking Performance | API success rate |
| Duplicate Detection Stats | duplicates found |
| OCR Accuracy | confidence distribution |
| Untransformed Lines | lines never matched |

---

## 10. Dashboards & Widgets

- KPIs: Last Import / Pending Review / Errors / Open Banking Health
- Charts: Imports per day (line), Format mix (pie), Match rate trend
- Lists: Recent imports, Errors needing attention, Review queue

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Import successful | in-app | importer |
| Import failed | email + in-app | importer |
| Balance mismatch | email | AR/AP team |
| Duplicates found | in-app | importer |
| OCR review needed | in-app | AR clerk |
| Open Banking consent expiring | email | AP manager |
| Open Banking fetch failed | email + Slack | IT + AP |
| New format detected | in-app | admin |

---

## 12. Permissions Matrix

| Action | Clerk | Supervisor | Manager | Admin |
|--------|-------|-----------|---------|-------|
| Manual import | ✓ | ✓ | ✓ | ✓ |
| Bulk import | ✗ | ✓ | ✓ | ✓ |
| PDF OCR | ✓ | ✓ | ✓ | ✓ |
| Override validation | ✗ | ✗ | ✗ | ✓ + CFO |
| Delete statement | ✗ | ✗ | ✓ | ✓ |
| OB connect | ✗ | ✗ | ✓ | ✓ |
| Configure CSV mapping | ✗ | ✗ | ✗ | ✓ |
| View errors | ✓ | ✓ | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Lean Technologies | KSA Open Banking |
| Tarabut Gateway | KSA Open Banking |
| Plaid (US/EU) | global open banking |
| Yodlee | financial data aggregation |
| Google Gemini Vision | PDF OCR |
| AWS Textract | alternative OCR |
| BullMQ | background imports |
| Bank SFTP servers | scheduled file pickup |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+I` | Import statement |
| `Ctrl+Shift+O` | OCR import |
| `R` | Run reconciliation |
| `M` | Match selected line |

---

## 15. Mobile / Print

- Mobile: take photo of statement → OCR
- Print: import audit report

---

## 16. Audit & Logging

- Every import → log with file hash
- Override validation → audit + reason
- OCR confidence stored
- Duplicate detections logged

---

## 17. Test Cases

```typescript
describe('MT940 Parser', () => {
  test('parses :60F: opening balance')
  test('parses :61: transactions (multiple)')
  test('parses :62F: closing balance')
  test('parses :86: description')
  test('handles continuation lines')
  test('handles forex rates')
})

describe('CAMT.053 Parser', () => {
  test('valid XML schema')
  test('extracts Stmt sections')
  test('handles multi-account file')
  test('parses BkTxCd categories')
})

describe('OFX Parser', () => {
  test('SGML format')
  test('XML 2.x format')
  test('handles BANKTRANLIST')
})

describe('Al Rajhi CSV', () => {
  test('handles Arabic descriptions')
  test('date format dd/MM/yyyy')
  test('separate Dr/Cr columns')
})

describe('Generic CSV', () => {
  test('configurable delimiter')
  test('configurable encoding')
  test('column mapping applied')
  test('date format conversion')
})

describe('PDF OCR', () => {
  test('Gemini Vision integration')
  test('confidence scoring')
  test('manual review queue')
})

describe('Duplicate Detection', () => {
  test('hash matches identical txn')
  test('hash differs for similar but different')
  test('skips duplicates on import')
})

describe('Validation', () => {
  test('opening + sum = closing')
  test('flags mismatch')
  test('allows override with audit')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| ملف فارغ | reject with clear message |
| ملف مشفّر/PGP | decrypt first |
| تواريخ مستقبلية | reject + warn |
| amounts عشرية أكثر من 4 خانات | round + warn |
| transactions مع 0 amount | skip |
| description طول > 4000 char | truncate |
| Arabic + English mixed | preserve both |
| account number not in our system | exception + manual mapping |
| الكشف يغطي فترة سابقة كاملة | accept (historical import) |
| نفس الـ transaction في نفس اليوم مرتين (legitimate) | use external ref to differentiate |
| OCR completely failed | fallback to manual entry |
| Open Banking API down | retry + fallback to manual |
| consent expired أثناء fetch | alert + pause |
| غير مدعوم العملة | reject |
| داخل الكشف عملات متعددة | split by currency |

---

**نهاية مواصفات النقص #7**

> 8 سيناريوهات • 6 جداول schema • 5 forms • 5 grids • 25 button • 8 widgets • 8 notifications • 16 parsers
