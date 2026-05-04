# النقص #6: Payment Runs مع SARIE/SEPA/SWIFT — مواصفات تفصيلية

> **المرجعيات:** SAP F110 / S4 Payment Medium Workbench、Oracle Payment Process Request、NetSuite Bill Pay、Bottomline Technologies、Tipalti
> **معايير:** ISO 20022 (pain.001/008/002)、SWIFT MT103/202、NACHA ACH、SARIE (KSA)、SAMA Cybersecurity Framework

---

## 1. البرومنت الكامل

```
ابني نظام Payment Runs بمستوى SAP F110 + ملفات بنكية متعددة:

ملفات موجودة:
- src/lib/payment-run-engine.ts (basic proposal + JE)
- prisma: PaymentRun, PaymentRunLine

المتطلبات:

A) Schema Extensions (انظر القسم 4):
   - PaymentRun: extended workflow states + bank files + approvals
   - PaymentRunLine: vendor details + IBAN + SWIFT + status
   - PaymentRunBankFile: generated files registry
   - PaymentRunApproval: multi-level approval chain
   - VendorBankAccount: vendor's bank details (multiple per vendor)
   - PaymentMethod: payment methods per company
   - DiscountOpportunity: pre-calculated discount windows
   - PaymentBlock: vendor/invoice blocks

B) Engine Extensions:
   1. Smart Proposal:
      - calculate due dates + discount windows
      - prioritize cash discount opportunities
      - group by vendor (single transfer for multiple invoices)
      - currency aggregation
      - exclude blocked vendors/invoices
      - respect cash position (don't propose more than available)
   
   2. Approval Workflow:
      - tiered: per amount + per currency
      - amount > 100K → CFO
      - amount > 1M → CEO + Board
      - parallel approval
      - escalation on timeout
   
   3. File Generators (separate modules):
      - SARIE: CSV/Excel for KSA banks
      - SEPA pain.001.001.09: XML for EU
      - NACHA: ACH for US
      - SWIFT MT103: international wires
      - SWIFT MT202: bank-to-bank
      - Generic CSV: configurable
      - PDF check printing: physical checks
      - Bank-specific overrides (Al Rajhi, NCB, SAB, SAMBA each have quirks)
   
   4. Bank Confirmation Parser:
      - parses confirmation files (success/failed per transaction)
      - updates PaymentRunLine.status
      - generates JE for successful (DR AP / CR Bank)
      - reverses failed
      - handles partial confirmations
   
   5. Reconciliation Integration:
      - when payment appears in bank statement → auto-mark
      - link to BankStatementLine
   
   6. Discount Optimization:
      - identify invoices with cash discount terms
      - calculate effective annualized return on early payment
      - suggest payment dates to maximize discounts
      - track discount captured vs forfeited

C) APIs (28 endpoints): انظر قسم 7

D) UI (12 pages): انظر قسم 5-7

E) Tests: 40+ unit, 15 integration, 6 E2E
```

---

## 2. السيناريوهات (8)

### A — Weekly Payment Run
```
يوم الخميس 8 ص:
1. AP Manager: /accounting/payment-runs → [+ Run جديد]
2. Wizard:
   - Due until: 2026-05-15 (الأسبوع القادم)
   - Currency: SAR
   - Vendors: All (ما عدا blocked)
   - Include discount window opportunities: ✓
3. النظام يحضر:
   - 250 فاتورة عادية (1.7M SAR)
   - 80 فاتورة بـ 2/10 Net 30 → savings 18K
   - groups: 78 vendors
4. يستثني 5 فواتير (مشاكل جودة)
5. Total: 1.85M SAR
6. [إرسال للاعتماد] → Finance Manager → CFO
7. كلاهما يوافق
8. [توليد ملفات]:
   - 70 vendors محليين → SARIE Excel للراجحي
   - 6 vendors EU → SEPA XML
   - 2 vendors international → 2 SWIFT MT103
9. AP يرفع الملفات على portal بنكه
10. بعد ساعتين: confirmation file → 243 ✓ + 2 ✗
11. [معالجة الـ confirmation] → JE تلقائي
12. الفاشلتان → email للمحاسب + إعادة في run قادم
```

### B — Discount Opportunity Alert
```
- Cron يومي 6 ص يفحص:
  - فواتير في discount window خلال 7 أيام
  - calculate annualized return: (discount / (100-discount)) × (365/(net_days - discount_days))
- 35 فاتورة → potential savings 25K SAR
- alert في dashboard + email لـ CFO:
  "Today: take advantage of 25K SAR discounts. Click to create payment run."
```

### C — Cross-currency Payment
```
- شركة سعودية تدفع لمورد أوروبي 50,000 EUR
- Bank account: USD-denominated
- النظام:
  - calculate cross-rate: SAR → USD → EUR
  - or: SAR → EUR direct
  - apply spread (bank fee ~0.5%)
  - generate SWIFT MT103 mit:
    - :32A: 260515EUR50000,00
    - :71A: SHA (shared charges)
- على confirmation:
  - JE: DR Vendor 197,500 SAR (50K EUR @ 3.95)
       DR Bank Charges 250 SAR
       CR Bank USD-account (USD equivalent)
       DR/CR FX Difference
```

### D — Failed Payment Recovery
```
- Run أرسل 245 دفعة، 3 فشلت بأسباب مختلفة:
  - 1: IBAN خاطئ
  - 1: insufficient funds في حساب الـ source
  - 1: vendor account blocked by bank
- النظام:
  - 3 PaymentRunLine.status = FAILED + reasons
  - reverses JE for these (DR Bank / CR AP)
  - sends email to AP clerk for each
  - creates "payment retry" tasks
- AP clerk يصحح الـ IBAN لـ vendor 1 → reschedules
- Vendor 2: ينتظر funds → reschedules next week
- Vendor 3: يتصل بالبنك للتأكد ثم retry
```

### E — Emergency Single Payment
```
- urgent payment 500K SAR لمورد (deadline اليوم)
- AP Manager: [+ Single Payment] (bypass weekly run)
- form: vendor, amount, urgent reason, manager approval inline
- generates SARIE file بسرعة
- يرسل للبنك
- CFO يحصل على alert خاص
```

### F — Discount Capture Run
```
- Cron يفحص وجود discount opportunities > threshold
- يقترح run خاص فقط لهذه الفواتير
- AP يوافق → run سريع
- savings tracked في report
```

### G — Vendor Bank Account Verification
```
- vendor جديد، AP يدخل IBAN
- النظام:
  - validates checksum (mod 97)
  - validates country prefix
  - lookup BIC/SWIFT
  - sends test penny payment (1 SAR) لـ verification
  - vendor confirms receipt → mark verified
  - now eligible for full payments
```

### H — Audit & Compliance Review
```
- مراجع داخلي يطلب: كل runs > 1M في 2026
- /accounting/payment-runs → filter → export
- يحصل على Excel + كل الـ files المرفقة
- يحصل على approval chain لكل run
- يفحص segregation of duties (proposer ≠ approver ≠ executor)
```

---

## 3. تدفق البيانات

```
[Wizard Step 1: Propose]
POST /payment-runs/propose
   { dueDateUntil, currency, vendorIds?, includeDiscountWindow, paymentMethod }
   ↓
   query open AP items WHERE
     dueDate <= dueDateUntil AND
     status IN ('OPEN', 'PARTIAL') AND
     vendor.paymentBlock = false AND
     openAmount > 0 AND
     currency = filter
   ↓
   for each vendor:
     fetch bank details
     check if eligible for discount (paymentTerms)
     calculate discount amount if applicable
     group invoices into single PaymentRunLine
   ↓
   create PaymentRun (status=PROPOSED)
   create PaymentRunLines (status=PENDING)
   ↓
   return { runId, lines: [...], totalAmount, currency, estimatedSavings }

[Step 2: Review & Adjust]
PUT /payment-runs/:id/lines
   { excludeIds: [...], includeIds: [...], discountOverrides: {...} }

[Step 3: Submit for Approval]
POST /payment-runs/:id/submit-for-approval
   ↓
   determine approval chain based on amount + currency
   ↓
   for each approver:
     create PaymentRunApproval (status=PENDING)
     send notification
   ↓
   PaymentRun.status = PENDING_APPROVAL

[Step 4: Approval Decision]
POST /payment-runs/:id/approve
   { decision: APPROVE|REJECT, comments }
   ↓
   PaymentRunApproval.status = APPROVED/REJECTED
   ↓
   if all approved → PaymentRun.status = APPROVED
   if any rejected → PaymentRun.status = REJECTED

[Step 5: Generate Files]
POST /payment-runs/:id/generate-files
   { format: 'SARIE'|'SEPA'|'NACHA'|'SWIFT_MT103'|'CHECK_PRINT' }
   ↓
   group lines by bank/format
   ↓
   for each group:
     call appropriate generator:
       - SARIE → buildSarieExcel(lines)
       - SEPA → buildSepaXml(lines)
       - NACHA → buildNachaFile(lines)
       - SWIFT MT103 → buildMt103(lines)
       - CHECK_PRINT → buildPdf(lines)
     hash + upload to S3
     create PaymentRunBankFile
   ↓
   PaymentRun.status = FILE_GENERATED

[Step 6: User uploads to bank manually OR API integration]

[Step 7: Confirmation Upload]
POST /payment-runs/:id/upload-confirmation
   { file: confirmation.csv }
   ↓
   parse confirmation file (per format)
   ↓
   for each entry:
     find PaymentRunLine by reference
     update status = SENT/CONFIRMED/FAILED
     save externalReference + bank fees
   ↓
   PaymentRun.status = CONFIRMED

[Step 8: Post Journal]
POST /payment-runs/:id/post-journal
   ↓
   for successful lines:
     JE: DR AP (each invoice) / CR Bank
     DR Sales Discount (if discount taken)
     DR Bank Charges (if any)
     DR/CR FX Difference (if cross-currency)
   ↓
   for failed lines:
     no JE (or reversal if previously posted optimistically)
   ↓
   PaymentRun.status = POSTED
   PaymentRun.journalEntryId = newJe.id
```

---

## 4. Prisma Schema

```prisma
model PaymentRun {
  id                          Int         @id @default(autoincrement())
  runNumber                   String      @unique
  description                 String?
  
  // Workflow
  status                      String      @default("DRAFT")
  // DRAFT | PROPOSED | PENDING_APPROVAL | APPROVED | REJECTED | FILE_GENERATED | SENT_TO_BANK | CONFIRMED | POSTED | FAILED | CANCELLED
  
  // Filters used
  dueDateUntil                DateTime
  currency                    String
  paymentMethod               String      // 'BANK_TRANSFER' | 'CHECK' | 'WIRE' | 'CASH' | 'BNPL'
  bankAccountId               Int         // source account
  
  // Totals
  totalAmount                 Decimal     @db.Decimal(20,4)
  totalCount                  Int         @default(0)
  successCount                Int         @default(0)
  failedCount                 Int         @default(0)
  estimatedSavings            Decimal?    @db.Decimal(20,4)
  actualSavings               Decimal?    @db.Decimal(20,4)
  bankCharges                 Decimal?    @db.Decimal(20,4)
  
  // Workflow timestamps
  proposedAt                  DateTime?
  proposedByUserId            String?
  submittedForApprovalAt      DateTime?
  approvedAt                  DateTime?
  filesGeneratedAt            DateTime?
  sentToBankAt                DateTime?
  sentToBankByUserId          String?
  confirmedAt                 DateTime?
  confirmedByUserId           String?
  postedAt                    DateTime?
  postedByUserId              String?
  cancelledAt                 DateTime?
  cancelledByUserId           String?
  cancellationReason          String?
  
  // Journal
  journalEntryId              Int?
  reversalJournalId           Int?
  
  // Approval
  approvalRequiredCount       Int         @default(1)
  approvalReceivedCount       Int         @default(0)
  
  // Relations
  lines                       PaymentRunLine[]
  bankFiles                   PaymentRunBankFile[]
  approvals                   PaymentRunApproval[]
  
  createdAt                   DateTime    @default(now())
  
  @@index([status, createdAt])
  @@index([currency, dueDateUntil])
}

model PaymentRunLine {
  id                          Int         @id @default(autoincrement())
  runId                       Int
  run                         PaymentRun  @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  // Vendor
  vendorId                    Int
  vendor                      Vendor      @relation(fields: [vendorId], references: [id])
  
  // Invoice(s) being paid
  openItemIds                 Int[]
  invoiceCount                Int         @default(1)
  
  // Amount
  amount                      Decimal     @db.Decimal(20,4)
  currency                    String
  exchangeRate                Decimal     @default(1) @db.Decimal(20,8)
  amountFunctional            Decimal     @db.Decimal(20,4)  // converted to base currency
  
  // Discount
  discountAmount              Decimal?    @db.Decimal(20,4)
  discountTaken               Boolean     @default(false)
  discountWindowEnds          DateTime?
  
  // Bank details snapshot
  beneficiaryName             String
  beneficiaryIBAN             String?
  beneficiarySwift            String?
  beneficiaryBankName         String?
  beneficiaryBankAddress      String?
  beneficiaryCountry          String?
  beneficiaryAccountNumber    String?     // when no IBAN (US)
  beneficiaryRoutingNumber    String?     // ABA for US
  
  // Payment method
  paymentMethod               String
  paymentReference            String?     // for vendor's reference
  paymentPurpose              String?     // for compliance
  
  // Status
  status                      String      // 'PENDING' | 'EXCLUDED' | 'GENERATED' | 'SENT' | 'CONFIRMED' | 'FAILED' | 'RETURNED' | 'CANCELLED'
  failureReason               String?
  failureCode                 String?
  externalReference           String?     // bank's reference
  bankConfirmedAt             DateTime?
  bankFees                    Decimal?    @db.Decimal(20,4)
  
  // Exclusion
  excludedAt                  DateTime?
  excludedReason              String?
  excludedByUserId            String?
  
  createdAt                   DateTime    @default(now())
  updatedAt                   DateTime    @updatedAt
  
  @@index([runId, status])
  @@index([vendorId])
  @@index([currency, status])
}

model PaymentRunBankFile {
  id                          Int         @id @default(autoincrement())
  runId                       Int
  run                         PaymentRun  @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  fileFormat                  String      // 'SARIE' | 'SEPA_PAIN001' | 'NACHA' | 'SWIFT_MT103' | 'SWIFT_MT202' | 'CSV_GENERIC' | 'CHECK_PRINT_PDF'
  bankCode                    String?     // ALRAJHI, NCB, SAB, SAMBA, etc.
  bankAccountId               Int         // source
  
  fileUrl                     String
  fileName                    String
  fileHash                    String      // SHA-256
  fileSizeBytes               Int
  
  generatedAt                 DateTime    @default(now())
  generatedByUserId           String
  
  txnCount                    Int
  totalAmount                 Decimal     @db.Decimal(20,4)
  currency                    String
  
  // Confirmation
  uploadedToBankAt            DateTime?
  uploadedByUserId            String?
  uploadConfirmationRef       String?
  
  confirmationFileUrl         String?
  confirmationParsedAt        DateTime?
  successCount                Int?
  failedCount                 Int?
  
  // Encryption (optional)
  encrypted                   Boolean     @default(false)
  encryptionKeyId             String?
  
  @@index([runId])
  @@index([fileFormat, generatedAt])
}

model PaymentRunApproval {
  id                          Int         @id @default(autoincrement())
  runId                       Int
  run                         PaymentRun  @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  approverUserId              String
  approverRole                String      // 'AP_MANAGER' | 'FINANCE_MANAGER' | 'CFO' | 'CEO' | 'BOARD'
  level                       Int         // 1, 2, 3
  isParallel                  Boolean     @default(false)
  
  status                      String      // 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'EXPIRED'
  decisionAt                  DateTime?
  comments                    String?
  
  delegatedToUserId           String?
  delegationReason            String?
  
  reminderSentAt              DateTime?
  expiresAt                   DateTime?
  
  @@index([runId, level])
  @@index([approverUserId, status])
}

model VendorBankAccount {
  id                          Int         @id @default(autoincrement())
  vendorId                    Int
  vendor                      Vendor      @relation(fields: [vendorId], references: [id])
  
  isDefault                   Boolean     @default(false)
  isActive                    Boolean     @default(true)
  isVerified                  Boolean     @default(false)
  verificationDate            DateTime?
  verificationMethod          String?     // 'PENNY_TEST' | 'DOCUMENT' | 'PHONE_CONFIRM'
  
  beneficiaryName             String      // may differ from vendor name
  iban                        String?
  swift                        String?
  bankName                    String
  bankAddress                 String?
  countryCode                 String
  currency                    String
  
  accountNumber               String?     // for non-IBAN countries
  routingNumber               String?     // ABA for US
  branchCode                  String?
  
  intermediaryBankSwift       String?     // for international transfers
  intermediaryBankAccount     String?
  
  notes                       String?
  
  createdAt                   DateTime    @default(now())
  createdByUserId             String
  lastUsedAt                  DateTime?
  
  @@index([vendorId, isActive])
  @@unique([vendorId, iban])
}

model PaymentBlock {
  id                          Int         @id @default(autoincrement())
  type                        String      // 'VENDOR' | 'INVOICE'
  vendorId                    Int?
  invoiceId                   Int?
  
  reason                      String      // 'COMPLIANCE_CHECK' | 'DISPUTE' | 'QUALITY_HOLD' | 'OTHER'
  description                 String?
  
  blockedAt                   DateTime    @default(now())
  blockedByUserId             String
  approvedReleaseRoles        String[]    // who can release
  
  releasedAt                  DateTime?
  releasedByUserId            String?
  releaseReason               String?
  
  active                      Boolean     @default(true)
  
  @@index([type, vendorId, active])
  @@index([type, invoiceId, active])
}

model DiscountOpportunity {
  id                          Int         @id @default(autoincrement())
  invoiceId                   Int
  vendorId                    Int
  
  invoiceAmount               Decimal     @db.Decimal(20,4)
  discountPercent             Decimal     @db.Decimal(5,2)
  discountAmount              Decimal     @db.Decimal(20,4)
  
  discountWindowEnds          DateTime
  netDueDate                  DateTime
  
  annualizedReturn            Decimal     @db.Decimal(8,4)  // implied APR if discount taken
  
  status                      String      @default("AVAILABLE")  // 'AVAILABLE' | 'TAKEN' | 'FORFEITED' | 'EXPIRED'
  takenInRunId                Int?
  
  calculatedAt                DateTime    @default(now())
  
  @@index([status, discountWindowEnds])
  @@index([vendorId, status])
}
```

---

## 5. Forms & Fields

### Form A: Propose Run (Wizard Step 1)
| Field | Type | Required | Default |
|-------|------|----------|---------|
| dueDateUntil | datepicker | ✓ | today + 7 |
| currency | dropdown | ✓ | SAR |
| paymentMethod | dropdown | ✓ | BANK_TRANSFER |
| sourceBankAccountId | dropdown | ✓ | primary |
| vendorIds | multi-select | ✗ | all |
| vendorSegments | multi | ✗ | — |
| includeDiscountWindow | toggle | ✗ | true |
| includeDueWithinDays | number | ✗ | 7 |
| minAmount | money | ✗ | — |
| maxAmount | money | ✗ | — |
| excludeBlocked | toggle | ✓ | true |
| respectCashPosition | toggle | ✓ | true |

### Form B: Adjust Lines (Step 2)
- Per row: Include checkbox / Exclude / Override discount / Override beneficiary bank
- Bulk: Exclude selected / Include all / Reset

### Form C: Submit for Approval
| Field | Type | Required |
|-------|------|----------|
| approvalNotes | textarea | ✗ |
| urgencyLevel | dropdown | ✓ NORMAL/HIGH/URGENT |
| customApprovers | multi-select | ✗ (override default chain) |

### Form D: Approve/Reject
| Field | Type | Required |
|-------|------|----------|
| decision | radio | ✓ APPROVE/REJECT |
| comments | textarea | conditional (required if REJECT) |
| delegate | user picker | ✗ |

### Form E: Generate Files
| Field | Type | Required |
|-------|------|----------|
| formats | checkboxes | ✓ min 1 (SARIE, SEPA, etc.) |
| groupByBank | toggle | ✓ default true |
| encryptFiles | toggle | ✗ |
| recipientEmail | email | ✗ (auto-send) |

### Form F: Upload Confirmation
| Field | Type | Required |
|-------|------|----------|
| confirmationFile | file upload | ✓ |
| fileFormat | dropdown | ✓ (auto-detect) |
| postJournalImmediately | toggle | ✗ |

### Form G: Vendor Bank Account
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| vendorId | hidden | ✓ | — |
| isDefault | toggle | ✗ | — |
| beneficiaryName | text | ✓ | matches vendor or authorized |
| countryCode | dropdown | ✓ | ISO 3166-1 |
| currency | dropdown | ✓ | ISO 4217 |
| iban | text | conditional | mod-97, country prefix |
| swift | text | conditional | 8 or 11 chars |
| accountNumber | text | conditional | required if no IBAN |
| routingNumber | text | conditional | required for US |
| bankName | text | ✓ | — |
| bankAddress | textarea | ✗ | — |
| intermediaryBankSwift | text | ✗ | — |

### Form H: Single Emergency Payment
| Field | Type | Required |
|-------|------|----------|
| vendorId | autocomplete | ✓ |
| amount | money | ✓ |
| currency | dropdown | ✓ |
| invoiceId | dropdown | conditional (or "advance") |
| urgentReason | textarea | ✓ min 50 |
| immediateApproval | password | ✓ (CFO password) |

---

## 6. Tables & Columns

### Grid A: Payment Runs Dashboard
| Column | Width |
|--------|-------|
| Run # | 130 |
| Description | 200 |
| Currency | 80 |
| Total Amount | 150 |
| Lines Count | 100 |
| Successful | 100 |
| Failed | 100 |
| Status | badge | 130 |
| Stage | step indicator | 200 |
| Started | datetime | 150 |
| Last Activity | datetime | 150 |
| Owner | 130 |
| Actions: [View] [Resume] [Cancel] | 200 |

### Grid B: Run Lines
| Column | Width |
|--------|-------|
| Line # | 80 |
| Vendor | 200 |
| Invoices | counter + tooltip | 100 |
| Amount | money | 130 |
| Currency | 80 |
| Discount | money | 100 |
| IBAN/Account | text | 200 |
| Bank | 150 |
| Country | 100 |
| Status | badge | 130 |
| Failure Reason | text | 200 |
| Actions: [Exclude] [View Invoices] [Override Bank] | 200 |

### Grid C: Bank Files
| Column | Width |
|--------|-------|
| File | filename + icon | 200 |
| Format | badge | 130 |
| Bank | 130 |
| Txns | number | 80 |
| Amount | money | 130 |
| Currency | 80 |
| Generated | datetime | 150 |
| Uploaded | datetime | 150 |
| Confirmed | datetime | 150 |
| Success/Fail | x/y | 100 |
| Actions: [Download] [Upload Confirmation] [Re-generate] | 250 |

### Grid D: Approval Chain
| Column | Width |
|--------|-------|
| Level | 80 |
| Approver | 200 |
| Role | 130 |
| Status | badge | 130 |
| Decided At | datetime | 150 |
| Comments | text | 250 |
| Actions: [Remind] [Reassign] | 150 |

### Grid E: Discount Opportunities
| Column | Width |
|--------|-------|
| Vendor | 200 |
| Invoice | 130 |
| Invoice Amount | money | 130 |
| Discount % | percent | 100 |
| Discount Amount | money | 130 |
| Window Ends | datetime | 150 |
| Days to Decide | number | 100 |
| Annualized Return | percent | 130 |
| Status | badge | 110 |
| Actions: [Take in Next Run] [Forfeit] | 200 |

### Grid F: Vendor Bank Accounts
| Column | Width |
|--------|-------|
| Beneficiary Name | 200 |
| Country | 100 |
| Currency | 80 |
| IBAN | 200 |
| Bank | 150 |
| Default | toggle | 80 |
| Verified | badge | 100 |
| Last Used | datetime | 150 |
| Actions: [Edit] [Set Default] [Verify] [Delete] | 200 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Confirmation | Permission |
|----|------|--------|-------|--------------|------------|
| btn-run-create | + Run جديد | dashboard | 🟢 | ✗ | role.ap |
| btn-run-emergency | دفع طارئ | dashboard | 🟡 | + form | role.ap_manager |
| btn-propose | جلب اقتراحات | wizard 1 | 🟦 | ✗ | role.ap |
| btn-line-exclude | استبعاد | line row | 🔴 | + reason | role.ap |
| btn-line-include | تضمين | line row | 🟢 | ✗ | role.ap |
| btn-line-override-bank | تغيير حساب البنك | line row | 🟡 | + new account | role.ap |
| btn-bulk-exclude | استبعاد المحدد | lines list | 🔴 | + reason | role.ap |
| btn-bulk-include | تضمين المحدد | lines list | 🟢 | ✗ | role.ap |
| btn-discount-toggle | تفعيل/تعطيل الخصم | line row | 🟡 | ✗ | role.ap |
| btn-submit-approval | إرسال للاعتماد | wizard 3 | 🟦 | review summary | role.ap |
| btn-approve | موافق | approval card | 🟢 | + comments | approver |
| btn-reject | رفض | approval card | 🔴 | + reason | approver |
| btn-delegate | تفويض | approval card | 🟡 | + delegate user | approver |
| btn-remind-approver | تذكير | approval row | ⬜ | ✗ | starter |
| btn-generate-files | توليد ملفات | wizard 5 | 🟦 | + format selector | role.ap |
| btn-download-file | تنزيل | bank file row | 🟢 | ✗ | role.ap |
| btn-mark-sent | تم الإرسال للبنك | bank file row | 🟦 | + bank ref | role.ap |
| btn-upload-confirmation | رفع التأكيد | bank file row | 🟦 | + file | role.ap |
| btn-regenerate-file | إعادة التوليد | bank file row | 🟡 | confirm overwrite | role.ap_manager |
| btn-post-journal | ترحيل القيد | run detail | 🔴 | + MFA | role.ap_manager |
| btn-cancel-run | إلغاء Run | run detail | 🔴 | + reason + MFA | role.ap_manager |
| btn-line-retry | إعادة المحاولة | failed line | 🟡 | + new run | role.ap |
| btn-vendor-bank-add | + حساب بنكي | vendor card | 🟢 | ✗ | role.ap |
| btn-vendor-bank-verify | تأكيد الحساب | vendor bank row | 🟡 | + method | role.ap |
| btn-vendor-bank-set-default | تعيين كافتراضي | vendor bank row | 🟦 | ✗ | role.ap |
| btn-vendor-bank-delete | حذف | vendor bank row | 🔴 | unused only | role.ap_manager |
| btn-payment-block-vendor | حظر مورد | vendor card | 🔴 | + reason + role | role.ap_manager OR compliance |
| btn-payment-unblock | رفع الحظر | block list | 🟢 | + reason | role.ap_manager |
| btn-discount-take-now | اغتنم الآن | opportunity row | 🟢 | creates run | role.ap |
| btn-discount-forfeit | تجاهل | opportunity row | 🔴 | + reason | role.ap |
| btn-export-runs | تصدير | dashboard | ⬜ | format | role.ap |
| btn-audit-trail | سجل التدقيق | run detail | ⬜ | ✗ | role.ap OR audit |

---

## 8. Search & Filters

### Runs:
- Status, Currency, Date range, Owner, Bank, Total range

### Lines:
- Vendor, Status, Currency, Country, Has discount, Failed

### Bank Files:
- Format, Bank, Date, Confirmed status

### Discount Opportunities:
- Window ends within X days, Min annualized return, Vendor

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Payment Run Summary | per run |
| Cash Disbursement Forecast | future runs estimated |
| Discount Captured vs Forfeited | savings analysis |
| Vendor Payment History | per vendor |
| Failed Payments | reasons + recovery |
| Approval Aging | how long approvals take |
| Bank File Audit | all files generated + their status |
| Currency Exposure | per currency outflow |
| FX Impact on Payments | gain/loss from cross-currency |
| Payment Method Distribution | bank transfer vs check vs wire |

---

## 10. Dashboards & Widgets

- KPIs: This Week's Run / Pending Approval / Discount Available / Failed Last 7d / Average Days to Approve
- Charts: Cash outflow trend, Currency mix, Discount captured vs forfeited
- Lists: Approvals waiting on me, Discount opportunities expiring, Failed payments needing retry

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Run proposed | in-app | proposer |
| Run submitted for approval | email + in-app | approvers |
| Approval reminder | email | approver |
| Run approved | email | proposer |
| Run rejected | email | proposer |
| Files generated | in-app | proposer |
| Payment failed | email + in-app | AP clerk |
| Discount expiring 24h | in-app | AP team |
| Cash position low for run | email | CFO + AP manager |
| Vendor bank not verified | in-app | AP clerk |
| Large run pending (>1M) | email + Slack | CFO + Board |

---

## 12. Permissions Matrix

| Action | AP Clerk | AP Mgr | Finance Mgr | CFO | CEO |
|--------|----------|--------|-------------|-----|-----|
| Create run | ✓ | ✓ | ✓ | ✓ | ✗ |
| Emergency payment | ✗ | ✓ | ✓ | ✓ | ✗ |
| Submit for approval | ✓ | ✓ | ✓ | ✗ | ✗ |
| Approve <100K | ✗ | ✓ | ✓ | ✓ | ✓ |
| Approve <1M | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approve >1M | ✗ | ✗ | ✗ | ✓ | ✓ |
| Generate files | ✓ | ✓ | ✓ | ✗ | ✗ |
| Upload confirmation | ✓ | ✓ | ✓ | ✗ | ✗ |
| Post journal | ✗ | ✓ | ✓ | ✓ | ✗ |
| Cancel run | ✗ | ✓ | ✓ | ✓ | ✗ |
| Block vendor | ✗ | ✓ | ✓ | ✓ | ✗ |
| Add vendor bank | ✓ | ✓ | ✓ | ✓ | ✗ |
| Verify bank | ✓ | ✓ | ✓ | ✓ | ✗ |
| Override approval chain | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Saudi Banks (Al Rajhi, NCB, SAB, SAMBA) | direct API for SARIE upload |
| SWIFT | international wires |
| ISO 20022 | SEPA standard |
| Tipalti / Stripe Treasury | global payments |
| BullMQ | background tasks |
| AWS KMS | file encryption |
| BankID validation services (e.g. SWIFTRef) | IBAN/SWIFT verification |
| OFAC / EU Sanctions list | compliance check |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | New run |
| `Ctrl+Shift+P` | Emergency payment |
| `A` | Approve current |
| `R` | Reject current |
| `D` | Toggle discount |
| `Esc` | Close wizard |

---

## 15. Mobile / Print

- Mobile: approval flow optimized for mobile (CFO approves on phone)
- Print: payment vouchers + checks (physical)
- Accessibility: voice commands for approval ("approve run 123")

---

## 16. Audit & Logging

- Every action → AuditLog
- File generation: hash stored
- Approval chain: full record
- Bank confirmations: archived 7 years
- Cancelled runs: full history
- Vendor bank changes: FieldAuditLog

---

## 17. Test Cases

```typescript
describe('Proposal Engine', () => {
  test('groups multiple invoices per vendor')
  test('respects discount window')
  test('excludes blocked vendors')
  test('respects cash position')
  test('handles cross-currency')
})

describe('SARIE File Generator', () => {
  test('valid IBAN format')
  test('correct column order')
  test('UTF-8 encoding')
  test('handles Arabic vendor names')
  test('matches Al Rajhi format spec')
})

describe('SEPA pain.001', () => {
  test('valid XML schema')
  test('correct GroupHeader')
  test('correct sum')
  test('handles 100+ transactions')
})

describe('SWIFT MT103', () => {
  test('correct field tags')
  test('handles intermediary bank')
  test('charges code BEN/SHA/OUR')
})

describe('Approval Workflow', () => {
  test('determines correct chain by amount')
  test('parallel approvals')
  test('escalation on timeout')
  test('delegation works')
  test('rejection cancels run')
})

describe('Confirmation Parser', () => {
  test('parses bank confirmation correctly')
  test('updates line statuses')
  test('handles partial')
  test('detects unknown references')
})

describe('Discount Optimization', () => {
  test('calculates annualized return correctly')
  test('only suggests within window')
  test('tracks taken vs forfeited')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Two runs مع نفس الفاتورة في نفس الوقت | lock invoice → second run skips |
| Vendor bank changed بعد proposal | re-validate before generation |
| Currency rate changed بين propose و post | recalculate + warn |
| Bank file rejected by bank | full reversal + alert |
| Partial confirmation (some success, some fail) | split JE |
| Approver out of office | auto-escalate via delegation rule |
| File too large (>5000 transactions) | split into multiple files |
| Vendor IBAN corrupted | reject + flag for verification |
| Sanctioned vendor | block + alert compliance |
| Same approver in chain twice | skip second instance |
| Network failure during file generation | resume from checkpoint |
| Bank confirmation file in unexpected format | parser fallback + manual review |
| Vendor refund (negative payment) | special handling |
| Holiday/weekend run | schedule for next business day |
| Insufficient funds in source account | abort + alert |
| Cancelled run after files sent | requires bank coordination + special procedure |

---

**نهاية مواصفات النقص #6**

> 8 سيناريوهات • 7 جداول schema • 8 forms • 6 grids • 32 button • 9 widgets • 11 notifications • 10 reports
