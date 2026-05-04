# النقص #2: Year-End Close + Retained Earnings — مواصفات تفصيلية

> **المرجعيات العالمية:** SAP S/4HANA F.13/F.05/FAGLF101، Oracle Fusion Period Close، NetSuite Period Close Checklist، BlackLine، Workiva، FloQast
> **معايير:** IFRS، US GAAP ASC 205-10、SOCPA、SOX 404、COSO Framework

---

## 1. البرومنت الكامل للنسخ

```
[انسخ المحتوى التالي للصق في session جديد]

أنشئ نظام Year-End Close كامل في Namasoft ERP يعادل SAP S/4HANA Period Closing.

ملفات مرجع موجودة:
- src/lib/period-close.ts (basic soft/hard close)
- src/lib/auto-journal.ts (محرك القيود)
- prisma/schema.prisma (FiscalYear, FiscalPeriod, JournalEntry)

الإلزاميات (Hard Rules):
1. لا يكتب على حسابات Control يدوياً
2. كل قيد إقفال = balanced (Decimal 0.01 tolerance)
3. SERIALIZABLE transactions للعمليات الحرجة
4. كل خطوة → AuditLog مع before/after
5. كل عملية تتطلب confirmation token (HMAC، 5 min TTL)
6. لا يقفل سنة قبل اكتمال الـ checklist 100%
7. القيود المُولّدة تاريخها = آخر يوم في السنة المالية

الـ Engine الجديد src/lib/year-end-close.ts:

A) validateYearReadiness(fiscalYearId): ValidationResult
   تحقق من:
   - جميع الفترات الشهرية HARD_CLOSED
   - لا توجد JE بحالة DRAFT
   - كل bank reconciliations COMPLETED للسنة
   - كل depreciation runs مكتملة لـ 12 شهر
   - كل lease amortization runs مكتملة
   - كل revenue recognition schedules مكتملة
   - كل FX revaluation مكتمل
   - كل WIP cleared أو explicitly accepted
   - كل suspense accounts = 0
   - كل intercompany reconciled (لو multi-entity)
   - Trial Balance balanced
   - لا توجد negative inventory
   - لا توجد tasks في approval queues عمرها > 30 يوم
   ارجع: { ready: bool, blockers: [{code, severity, message, link}], warnings: [...] }

B) generateChecklist(fiscalYearId): YearEndChecklist
   28 مهمة في 7 categories:
   
   Category 1 - Pre-Close (5 tasks):
     1. Bank reconciliations all months
     2. AR/AP aging review
     3. Inventory cycle count complete
     4. Fixed asset additions reviewed
     5. Lease contracts reviewed for modifications
   
   Category 2 - Adjustments (6 tasks):
     6. FX revaluation
     7. Depreciation run
     8. Lease amortization run
     9. Revenue recognition catch-up
     10. Accrued expenses
     11. Prepaid expenses amortization
   
   Category 3 - Provisions (4 tasks):
     12. Bad debt provision (per IFRS 9 ECL)
     13. Inventory obsolescence (NRV test)
     14. Warranty provision
     15. Legal contingencies review
   
   Category 4 - Tax (3 tasks):
     16. VAT reconciliation
     17. WHT reconciliation
     18. Zakat estimate (Saudi-specific)
   
   Category 5 - Inter-period (3 tasks):
     19. Intercompany eliminations
     20. Multi-book reconciliation
     21. Group consolidation prep
   
   Category 6 - Closing Entries (4 tasks):
     22. Income statement closing (P&L → Retained Earnings)
     23. Year-end balance verification
     24. Opening balances rollover
     25. Lock fiscal year
   
   Category 7 - Reporting (3 tasks):
     26. Final Trial Balance snapshot
     27. Statutory reports generation
     28. External auditor package
   
   كل task: { code, name, category, status, assigneeUserId, autoExecutable, dependencies[], estimatedMinutes, evidenceRequired }

C) executeTask(runId, taskCode, params): TaskResult
   - autoExecutable tasks: ينفّذها مباشرة (depreciation, FX reval, etc.)
   - manual tasks: يتطلب رفع evidence + user confirmation
   - كل task: pre-conditions check → execute → post-validation → log

D) closeIncomeStatement(fiscalYearId, retainedEarningsAccountId, options): JournalEntry
   1. اجلب كل أرصدة accounts.type IN (REVENUE, EXPENSE)
   2. احسب net P&L
   3. أنشئ JE واحد:
      - DR Revenue accounts (بأرصدتها الدائنة)
      - CR Expense accounts (بأرصدتها المدينة)
      - DR/CR Retained Earnings (الفرق)
   4. أضف dimension: { type: 'YEAR_END_CLOSING', fiscalYearId }
   5. تاريخ القيد = آخر يوم في السنة
   6. POSTED مباشرة (لا DRAFT)

E) rolloverOpeningBalances(fromFY, toFY): { rolledAccounts: number, journalId: number }
   1. لكل account.type IN (ASSET, LIABILITY, EQUITY):
      - احسب closing balance من fromFY
      - أنشئ OpeningBalance record لـ toFY
   2. حسابات Revenue/Expense → opening = 0
   3. أنشئ JE: DR/CR كل حساب بقيمة opening
      - dimension: { type: 'OPENING_BALANCE_BROUGHT_FORWARD' }
   4. تاريخ = أول يوم في toFY

F) lockFiscalYear(fiscalYearId, confirmationToken): void
   - update FiscalYear.status = LOCKED
   - update FiscalYear.closedAt = now()
   - update FiscalYear.closedByUserId
   - يمنع أي JE بـ date IN [yearStart, yearEnd] في المستقبل
   - فقط SUPER_ADMIN يستطيع unlock

G) generateImmutableReports(fiscalYearId): ReportSnapshot[]
   5 تقارير:
   - Trial Balance (Final)
   - Income Statement
   - Balance Sheet
   - Cash Flow Statement (Direct + Indirect)
   - Statement of Changes in Equity
   كل تقرير:
   - يُحسب ويُجمّد في ImmutableReport
   - يُولّد PDF + يُرفع لـ S3
   - hash SHA-256 للتحقق من عدم التعديل
   - signed by accountant + manager (digital signature)

H) APIs (16 endpoints):
   انظر القسم 7

I) UI: Wizard 8 steps
   انظر القسم 5

J) Tests:
   - 35+ unit tests
   - 12 integration tests
   - 4 E2E tests (full year close cycle)

اتبع نمط الكود الموجود. كل عملية → Prisma transaction (SERIALIZABLE).
```

---

## 2. السيناريوهات (6)

### A — Happy Path (Year close ناجح)
```
31 ديسمبر، CFO يبدأ:
1. /accounting/year-end-close → "بدء إقفال 2026"
2. النظام يفحص → "الجاهزية: 95%، 2 issues"
3. يحل الـ issues (close last bank recon + 1 draft JE)
4. يضغط "بدء" → wizard 8 steps يبدأ
5. Step 1: Validation ✓
6. Step 2: Checklist 28 task — يضغط "Auto-run all" للقابلة (15)
7. النظام ينفذ في 12 دقيقة (FX reval, depreciation, leases, revenue rec)
8. الـ13 المتبقية manual:
   - يفوّض tasks لفريقه
   - team members يرفعون evidence + complete
   - بعد 3 أيام: 100% done
9. Step 3: Preview closing JE — 250 سطر، balanced ✓
10. Step 4: يضغط "Post" → confirmation modal
   - "اكتب: I CONFIRM YEAR END CLOSE 2026"
   - يكتب → posted
11. Step 5: Rollover balances → 380 حساب → JE 2027-01-01
12. Step 6: Lock fiscal year → status = LOCKED
13. Step 7: Generate 5 reports → PDFs تنزّل
14. Step 8: Send to auditor (email package)
```

### B — Validation Fails بشدة
```
1. CFO يبدأ في 5 يناير (متأخر)
2. validation → 18 blockers + 7 warnings:
   - 3 شهور بنوك غير reconciled
   - 12 JE في DRAFT
   - 5 fixed assets بدون depreciation حالية
   - inventory سالب في 3 منتجات
3. يضغط "تحميل قائمة الإصلاحات"
4. النظام يولّد PDF بكل المشاكل + الحلول المقترحة + المسؤولين
5. يوزّع على الفريق
6. بعد أسبوع: validation pass
```

### C — Task فشلت أثناء auto-execute
```
1. خلال checklist، FX revaluation فشل (rate غير موجود)
2. النظام:
   - يضع task status = FAILED
   - يعرض error: "FX rate لـ EUR/SAR في 2026-12-31 غير موجود"
   - يقدّم زر [إصلاح] → يفتح FX rates entry
3. CFO يدخل rate → يضغط [إعادة المحاولة]
4. ✓ → continue
```

### D — Reverse a closed period (طارئ)
```
1. بعد إقفال السنة بشهر: اكتشاف قيد خاطئ بقيمة 500K
2. CFO يطلب unlock → يحتاج Super Admin + مراجع خارجي
3. /admin/year-end/unlock-request → form
4. Super Admin يوافق → يتطلب: justification + auditor sign
5. Year unlocks → يدخل JE تصحيحي → re-execute closing flow
6. كل العملية تُسجّل بشكل خاص: "Re-opened year + reason"
7. تنبيه للجهات: مدير عام + مراجع خارجي + ZATCA إذا أثرت على VAT
```

### E — Multi-entity Group Close
```
1. شركة قابضة + 5 شركات تابعة
2. كل شركة تابعة: تُقفل أولاً (subsidiary close)
3. القابضة تنتظر اكتمال الكل
4. ثم: intercompany eliminations + consolidation
5. النظام يولّد JE consolidation (eliminate IC sales/COGS, IC receivables/payables)
6. ينتج Group P&L + Group BS (consolidated)
7. NCI (Non-Controlling Interest) يُحسب
```

### F — Partial close (Hard close فترة معينة)
```
1. CFO يريد قفل Q1 فقط (لإصدار تقارير ربع سنوية)
2. /accounting/period-close → اختر Q1 → "Hard close"
3. أبسط من year-end (لا rollover)
4. لكن نفس checklist (مختصر)
```

---

## 3. تدفق البيانات

```
[Wizard Step 1: Validate]
   POST /year-end/validate { fiscalYearId }
      ↓
   YearEndEngine.validateYearReadiness()
      ↓
   parallel checks:
     - check all periods HARD_CLOSED
     - check no DRAFT JEs
     - check bank recons
     - check depreciation runs
     - check leases
     - check revenue recognition
     - check inventory
     - check trial balance balanced
      ↓
   return { ready: bool, blockers: [...], warnings: [...] }

[Wizard Step 2: Checklist Run]
   POST /year-end/start { fiscalYearId }
      ↓
   create YearEndCloseRun (status=IN_PROGRESS)
   create 28 YearEndCloseTask records
      ↓
   for each autoExecutable task in dependency order:
     POST /year-end/run-task { runId, taskCode }
        ↓
     check dependencies done
        ↓
     execute via specific engine:
       - DEPRECIATION → DepreciationEngine.runForPeriod()
       - FX_REVAL → FxRevaluationEngine.run()
       - LEASE_AMORT → LeaseEngine.runForPeriod()
       - REV_REC → RevenueRecognitionEngine.runForPeriod()
       - ECL → IFRS9ECLEngine.runProvision()
       - VAT_RECON → ZatcaEngine.reconcileVAT()
        ↓
     update task.status = DONE / FAILED
     log evidence + audit

[Wizard Step 3: Preview Closing JE]
   POST /year-end/preview-closing-je { runId }
      ↓
   compute net P&L
   build JE preview (revenue + expense → retained earnings)
   return { lines: [...], totalDebit, totalCredit, retainedEarningsImpact }

[Wizard Step 4: Post]
   POST /year-end/post-closing-je { runId, confirmationToken }
      ↓
   verify token (HMAC + 5min TTL)
      ↓
   begin SERIALIZABLE transaction:
     create JournalEntry (POSTED)
     create JournalLines (one per account)
     update YearEndCloseRun.closingJournalId
     create AuditLog
   commit
      ↓
   trigger Step 5

[Wizard Step 5: Rollover]
   POST /year-end/rollover-balances { runId, confirmationToken }
      ↓
   compute closing balances per account (excluding REV/EXP)
      ↓
   create OpeningBalance records for new FY
   create JE (BROUGHT_FORWARD type)
      ↓
   update YearEndCloseRun.rolloverJournalId

[Wizard Step 6: Lock]
   POST /year-end/lock-year { fiscalYearId, confirmationToken }
      ↓
   FiscalYear.status = LOCKED

[Wizard Step 7: Reports]
   POST /year-end/generate-reports { fiscalYearId }
      ↓
   parallel:
     - TrialBalance.snapshot()
     - IncomeStatement.generate()
     - BalanceSheet.generate()
     - CashFlow.generate()
     - EquityChanges.generate()
      ↓
   each → ImmutableReport + PDF + S3 upload + SHA-256 hash

[Wizard Step 8: Distribute]
   POST /year-end/send-auditor-package
      ↓
   build ZIP (PDFs + raw data exports)
   send email
```

---

## 4. Prisma Schema

```prisma
model FiscalYear {
  id                    Int                @id @default(autoincrement())
  yearNumber            Int                @unique
  startDate             DateTime
  endDate               DateTime
  status                FiscalYearStatus   @default(OPEN)
  closingJournalId      Int?
  rolloverJournalId     Int?
  closedAt              DateTime?
  closedByUserId        String?
  reopenedAt            DateTime?
  reopenedByUserId      String?
  reopenedReason        String?
  periods               FiscalPeriod[]
  closeRuns             YearEndCloseRun[]
  openingBalances       OpeningBalance[]
  immutableReports      ImmutableReport[]
}

enum FiscalYearStatus {
  OPEN
  CLOSING_IN_PROGRESS
  LOCKED
  REOPENED
}

model YearEndCloseRun {
  id                    Int                @id @default(autoincrement())
  fiscalYearId          Int
  fiscalYear            FiscalYear         @relation(fields: [fiscalYearId], references: [id])
  status                String             // 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK'
  startedAt             DateTime           @default(now())
  startedByUserId       String
  completedAt           DateTime?
  closingJournalId      Int?
  rolloverJournalId     Int?
  reportsGeneratedAt    DateTime?
  errors                Json?
  metadata              Json?              // {totalRevenue, totalExpenses, netPL, ...}
  tasks                 YearEndCloseTask[]
  
  @@index([fiscalYearId, status])
}

model YearEndCloseTask {
  id                    Int                @id @default(autoincrement())
  runId                 Int
  run                   YearEndCloseRun    @relation(fields: [runId], references: [id], onDelete: Cascade)
  taskCode              String             // unique code per type
  taskName              String
  taskNameAr            String
  category              String             // 'PRE_CLOSE' | 'ADJUSTMENTS' | 'PROVISIONS' | 'TAX' | 'INTER_PERIOD' | 'CLOSING' | 'REPORTING'
  sequenceNumber        Int                // execution order within category
  autoExecutable        Boolean            @default(false)
  status                String             // 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'FAILED' | 'BLOCKED'
  dependencies          String[]           // taskCodes that must be done first
  assigneeUserId        String?
  estimatedMinutes      Int?
  startedAt             DateTime?
  completedAt           DateTime?
  completedByUserId     String?
  evidenceFileId        Int?
  evidenceRequired      Boolean            @default(false)
  notes                 String?
  result                Json?              // task-specific output
  errorMessage          String?
  retryCount            Int                @default(0)
  
  @@unique([runId, taskCode])
  @@index([runId, status])
  @@index([assigneeUserId, status])
}

model OpeningBalance {
  id                    Int                @id @default(autoincrement())
  fiscalYearId          Int
  fiscalYear            FiscalYear         @relation(fields: [fiscalYearId], references: [id])
  accountId             Int
  account               Account            @relation(fields: [accountId], references: [id])
  amountDebit           Decimal            @db.Decimal(20,4)
  amountCredit          Decimal            @db.Decimal(20,4)
  currency              String             @default("SAR")
  costCenterId          Int?
  branchId              Int?
  projectId             Int?
  bookId                Int                @default(1)
  sourceJournalId       Int                // Brought forward JE
  createdAt             DateTime           @default(now())
  
  @@unique([fiscalYearId, accountId, costCenterId, branchId, projectId, bookId])
  @@index([fiscalYearId, accountId])
}

model ImmutableReport {
  id                    Int                @id @default(autoincrement())
  fiscalYearId          Int?
  fiscalYear            FiscalYear?        @relation(fields: [fiscalYearId], references: [id])
  reportType            String             // 'TRIAL_BALANCE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'EQUITY_CHANGES' | 'NOTES_TO_FS'
  asOfDate              DateTime
  generatedAt           DateTime           @default(now())
  generatedByUserId     String
  payload               Json               // full report data
  pdfFileUrl            String?
  excelFileUrl          String?
  jsonFileUrl           String?
  hash                  String             // SHA-256 of payload
  signedAt              DateTime?
  signedByUserId        String?
  signature             String?            // digital signature (base64)
  bookId                Int?
  language              String             @default("ar")
  
  @@index([fiscalYearId, reportType])
  @@index([generatedAt])
}

model FiscalYearReopenRequest {
  id                    Int                @id @default(autoincrement())
  fiscalYearId          Int
  requestedAt           DateTime           @default(now())
  requestedByUserId     String
  reason                String
  justification         String             @db.Text
  externalAuditorEmail  String?
  externalAuditorSignature String?
  status                String             @default("PENDING")  // PENDING | APPROVED | REJECTED
  reviewedByUserId      String?
  reviewedAt            DateTime?
  reviewNotes           String?
  approvalChain         Json               // [{userId, approvedAt, role}]
  
  @@index([fiscalYearId, status])
}
```

---

## 5. Forms & Fields

### Form A: Validation Display (Step 1)
| Field | Type | Description |
|-------|------|-------------|
| readinessGauge | radial gauge | overall % |
| blockersTable | table | severity, code, message, link to fix |
| warningsTable | table | non-blocking issues |
| recommendationsList | list | suggested actions |

### Form B: Task Assignment Modal
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| assigneeUserId | user picker | ✓ | active user only |
| dueDate | datepicker | ✗ | >= today |
| priority | dropdown | ✗ | LOW/MEDIUM/HIGH/URGENT |
| notes | textarea | ✗ | max 500 |

### Form C: Manual Task Completion
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| evidenceFile | file upload | ✓ if required | PDF/JPG/Excel, max 10MB |
| notes | textarea | ✗ | — |
| confirmedDone | checkbox | ✓ | "أؤكد إتمام المهمة" |

### Form D: Closing JE Confirmation
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| retainedEarningsAccountId | account picker | ✓ | type=EQUITY |
| confirmationPhrase | text | ✓ | exact match: "I CONFIRM YEAR END CLOSE {YEAR}" |
| ackEffects | checkbox group | ✓ | 4 checkboxes (will lock, will rollover, etc.) |
| password | password | ✓ | re-auth |
| mfaCode | text 6 digits | ✓ | step-up |

### Form E: Reopen Request
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| reason | dropdown | ✓ | enum (Audit Adjustment, Material Error, Tax Reassessment, Other) |
| justification | textarea | ✓ | min 200 chars |
| externalAuditorEmail | email | conditional | required if reason=Audit |
| supportingDocs | file upload (multiple) | ✓ | PDF, max 50MB total |

---

## 6. Tables & Columns

### Table A: Year-End Close Runs (`/accounting/year-end-close`)
| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|-----------|-------|
| Fiscal Year | text | ✓ desc | dropdown | 100px |
| Started At | datetime | ✓ | date range | 150px |
| Started By | user link | ✓ | search | 150px |
| Status | badge | ✓ | dropdown | 130px |
| Progress | progress bar | ✓ | range | 150px |
| Tasks Done | x/28 | — | — | 100px |
| Estimated End | datetime | ✓ | — | 150px |
| Closing JE | link | — | — | 100px |
| Reports | icons | — | — | 120px |
| Actions | buttons | — | — | 150px |

### Table B: Checklist Tasks (Step 2)
| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|-----------|-------|
| # | sequence | ✓ | — | 50px |
| Category | badge | ✓ | dropdown | 130px |
| Task | text | ✓ | search | 250px |
| Auto/Manual | icon | — | toggle | 80px |
| Dependencies | tooltip count | — | — | 100px |
| Assignee | user avatar | ✓ | dropdown | 150px |
| Status | badge | ✓ | dropdown | 130px |
| Started | datetime | ✓ | — | 130px |
| Completed | datetime | ✓ | — | 130px |
| Duration | minutes | ✓ | — | 100px |
| Evidence | file link | — | — | 100px |
| Actions | buttons | — | — | 200px |

### Table C: Closing JE Preview (Step 3)
| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|-----------|-------|
| Account Code | text | ✓ | search | 120px |
| Account Name | text | ✓ | search | 250px |
| Account Type | badge | ✓ | dropdown | 100px |
| Current Balance | money | ✓ | range | 150px |
| Debit | money | ✓ | — | 150px |
| Credit | money | ✓ | — | 150px |
| New Balance | money | ✓ | — | 150px |
| Cost Center | text | ✓ | dropdown | 130px |
| Branch | text | ✓ | dropdown | 130px |

### Table D: Opening Balances (Step 5 result)
| Column | Type | Width |
|--------|------|-------|
| Account | link | 250px |
| Type | badge | 100px |
| Currency | code | 80px |
| Debit | money | 150px |
| Credit | money | 150px |
| Cost Center | text | 130px |
| Branch | text | 130px |
| New FY | text | 100px |

### Table E: Immutable Reports
| Column | Width |
|--------|-------|
| Report Type | 200px |
| As Of | 130px |
| Generated | 150px |
| Generated By | 150px |
| Hash (truncated) | 150px |
| Signed By | 150px |
| Actions: [PDF] [Excel] [Verify Hash] | 250px |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Confirmation | الصلاحية | Audit |
|----|------|--------|-------|--------------|----------|-------|
| btn-yec-start | بدء إقفال السنة | dashboard | 🟦 | ✗ | role.cfo OR role.controller | "yec.started" |
| btn-yec-cancel | إلغاء العملية | wizard | 🔴 | ⚠ "ستفقد التقدم" | starter | "yec.cancelled" |
| btn-validate-rerun | إعادة الفحص | step 1 | ⬜ | ✗ | starter | "yec.validate" |
| btn-fix-blocker | إصلاح | blocker row | 🟦 | ✗ | starter | navigate |
| btn-task-auto-run | تشغيل تلقائي | task row | 🟢 | ✗ if not destructive | starter | "yec.task.auto_run" |
| btn-task-auto-run-all | تشغيل الكل تلقائياً | step 2 | 🟢 | ⚠ "X مهمة" | starter | "yec.tasks.bulk_run" |
| btn-task-assign | تعيين | task row | ⬜ | ✗ | starter | "yec.task.assigned" |
| btn-task-complete | إكمال يدوي | task row | 🟢 | requires evidence | assignee or starter | "yec.task.completed" |
| btn-task-skip | تخطّي | task row | 🟡 | ⚠ + reason | role.cfo | "yec.task.skipped" |
| btn-task-retry | إعادة المحاولة | failed task | 🟡 | ✗ | starter | "yec.task.retried" |
| btn-task-view-evidence | عرض المستند | task row | ⬜ | — | task viewer | — |
| btn-task-delegate | تفويض | task row | ⬜ | ✗ | assignee | "yec.task.delegated" |
| btn-preview-closing-je | معاينة قيد الإقفال | step 3 | 🟦 | ✗ | starter | "yec.je.preview" |
| btn-export-preview | تصدير المعاينة | step 3 | ⬜ | ✗ | starter | "yec.je.exported" |
| btn-post-closing-je | ترحيل قيد الإقفال | step 4 | 🔴 | confirmation phrase + MFA | role.cfo | "yec.je.posted" |
| btn-preview-rollover | معاينة الترحيل | step 5 | 🟦 | ✗ | starter | "yec.rollover.preview" |
| btn-execute-rollover | تنفيذ الترحيل | step 5 | 🔴 | phrase + MFA | role.cfo | "yec.rollover.executed" |
| btn-lock-year | قفل السنة | step 6 | 🔴 | phrase + MFA | role.cfo | "yec.year.locked" |
| btn-generate-reports | توليد التقارير | step 7 | 🟦 | ✗ | starter | "yec.reports.generated" |
| btn-sign-report | توقيع | report row | 🟢 | password | role.cfo OR role.audit | "yec.report.signed" |
| btn-verify-hash | تحقق من الـ hash | report row | ⬜ | ✗ | viewer | "yec.report.verified" |
| btn-send-auditor | إرسال للمراجع | step 8 | 🟦 | ⚠ confirm recipients | role.cfo | "yec.auditor.sent" |
| btn-download-package | تنزيل الحزمة | step 8 | ⬜ | ✗ | viewer | "yec.package.downloaded" |
| btn-request-reopen | طلب إعادة فتح | locked year | 🟡 | + form | role.cfo | "yec.reopen.requested" |
| btn-approve-reopen | موافقة | reopen request | 🟢 | + MFA | role.super_admin | "yec.reopen.approved" |
| btn-reject-reopen | رفض | reopen request | 🔴 | + reason | role.super_admin | "yec.reopen.rejected" |
| btn-execute-unlock | تنفيذ الفتح | approved request | 🔴 | phrase + MFA | role.super_admin | "yec.year.unlocked" |
| btn-print-checklist | طباعة الـ checklist | step 2 | ⬜ | ✗ | viewer | — |
| btn-export-runs | تصدير سجل العمليات | dashboard | ⬜ | ✗ | viewer | "yec.runs.exported" |

**عدد الأزرار:** 29

---

## 8. Search & Filters

### Year-End Runs:
- Status: All / In Progress / Completed / Failed / Rolled Back
- Year range: 2020 → current
- Started by: user search
- Has reports: yes/no

### Checklist:
- Category: 7 categories (multi-select)
- Status: 6 statuses (multi-select)
- Auto/Manual: toggle
- Assignee: user search
- Has dependencies: yes/no
- Overdue: toggle (if estimatedMinutes exceeded)

### Reports:
- Report type: 6 types
- Date range
- Signed: yes/no
- Has issues: yes/no (hash mismatch)

---

## 9. Reports & Exports

| التقرير | الحقول | تنسيقات | اللغة |
|---------|--------|----------|-------|
| Final Trial Balance | account, opening, debits, credits, closing | PDF/Excel/CSV | AR/EN |
| Income Statement | revenues, COGS, operating exp, other inc/exp, tax, net income | PDF/Excel | AR/EN |
| Balance Sheet | assets (current/non-current), liabilities, equity | PDF/Excel | AR/EN |
| Cash Flow Statement (Direct) | operating, investing, financing | PDF/Excel | AR/EN |
| Cash Flow Statement (Indirect) | net income + adjustments | PDF/Excel | AR/EN |
| Statement of Changes in Equity | opening, additions, distributions, closing | PDF/Excel | AR/EN |
| Notes to Financial Statements | structured disclosures | PDF | AR/EN |
| Closing JE Detail | full posting | PDF/Excel | AR/EN |
| Opening Balances Listing | per account | Excel | AR/EN |
| Year-End Audit Trail | all tasks + evidence | PDF (zip) | AR/EN |
| Auditor Package | all reports + raw data | ZIP | AR/EN |
| Comparison Report | this year vs previous year | PDF/Excel | AR/EN |
| Tax Reconciliation | book vs tax differences | Excel | AR/EN |

---

## 10. Dashboards & Widgets

### `/accounting/year-end-close/dashboard`

**Widget 1: Year Status**
- Big card: current FY + status badge + days until year-end
- Color: green if on track, yellow if behind

**Widget 2: Readiness Gauge**
- Radial gauge: % validation pass
- Sub-text: blockers count

**Widget 3: Checklist Progress**
- Stacked bar: pending/in-progress/done/failed/skipped
- Click → filter table

**Widget 4: Critical Tasks**
- List top 5 by priority + days overdue
- Action: [Run Now]

**Widget 5: P&L Snapshot (Live)**
- Revenue, Expenses, Net Income (estimated)
- Chart vs prior year

**Widget 6: Closing Timeline**
- Gantt chart of past close runs duration

**Widget 7: Auditor Status**
- Whether auditor package sent
- Whether external sign received

---

## 11. Notifications & Alerts

| Event | Channel | Recipient | When |
|-------|---------|-----------|------|
| YE close started | email + in-app | finance team | immediate |
| Task assigned | email + in-app | assignee | immediate |
| Task overdue | email + in-app | assignee + manager | daily |
| Task failed | email + Slack | starter + IT | immediate |
| Closing JE preview ready | in-app | starter | immediate |
| JE posted (closing) | email | finance team + auditor | immediate |
| Year locked | email + in-app | all finance | immediate |
| Reports generated | email + in-app | CFO + auditor | immediate |
| Reopen requested | email + Slack | super admin | immediate |
| Reopen approved/rejected | email | requester | immediate |
| Hash verification failed | email + Slack | security team | immediate |
| Days until YE | in-app banner | finance team | 30/15/7 days before |

---

## 12. Permissions Matrix

| Action | Accountant | Senior Acct | Controller | CFO | Super Admin | External Auditor |
|--------|-----------|-------------|-----------|-----|-------------|------------------|
| Start YE | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| Run validation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ R |
| Execute auto task | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Complete manual task | ✓ if assigned | ✓ | ✓ | ✓ | ✓ | ✗ |
| Skip task | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| Preview closing JE | ✓ R | ✓ R | ✓ | ✓ | ✓ | ✓ R |
| Post closing JE | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Execute rollover | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Lock year | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Generate reports | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sign reports | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Send to auditor | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| Request reopen | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approve reopen | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Execute unlock | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| View audit log | ✗ | ✓ R | ✓ R | ✓ R | ✓ R | ✓ R |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| BlackLine / FloQast | sync checklist بـ external tool |
| External auditor portal | upload reports + receive sign-off |
| ZATCA Fatoora | submit final VAT return |
| GAZT (Zakat) | submit Zakat declaration |
| BullMQ | run heavy tasks in background |
| AWS S3 / Azure Blob | store immutable reports |
| DocuSign / SignNow | digital signature on reports |
| SAP / Oracle (if integrated) | sync trial balance for group reporting |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Y` | Open YE wizard |
| `→` / `←` | Next/Previous step |
| `Space` | Toggle task selection |
| `R` | Run selected tasks |
| `A` | Assign selected tasks |
| `?` | Show shortcuts |
| `Esc` | Close modal |

---

## 15. Mobile / Print

### Mobile:
- Wizard becomes vertical accordion
- Charts → simplified card stack
- Closing JE preview not editable on mobile (view only)
- Manual task completion: photo upload from camera

### Print:
- Checklist printable (with check boxes)
- All reports print-optimized (A4 portrait)
- Auditor package: TOC + page numbers + signatures pages

---

## 16. Audit & Logging

كل خطوة → AuditLog مع:
- before/after state
- user, timestamp, IP, session
- HMAC signature for tamper detection

كل JE مولّد:
- linked to YearEndCloseRun
- cannot be deleted (only reverse)
- shows in JE search with badge "YEAR_END"

كل ImmutableReport:
- SHA-256 stored
- daily verification cron
- alert on mismatch

---

## 17. Test Cases

```typescript
describe('YearEndCloseEngine', () => {
  // Validation
  test('validates all periods closed')
  test('detects draft JEs')
  test('detects open bank recons')
  test('detects unbalanced trial balance')
  test('warns about negative inventory')
  
  // Checklist
  test('generates 28 tasks in correct categories')
  test('respects dependencies')
  test('blocks dependent tasks until prereqs done')
  test('auto-executes in correct order')
  test('handles task failures gracefully')
  
  // Closing JE
  test('balances debits and credits')
  test('posts net P&L to retained earnings')
  test('handles negative P&L (loss)')
  test('respects multi-book')
  test('respects multi-currency')
  test('uses last day of FY as date')
  
  // Rollover
  test('rolls forward all asset/liability/equity accounts')
  test('zeros revenue/expense in new FY')
  test('preserves dimensions (cost center, branch)')
  test('handles intercompany balances')
  
  // Lock
  test('prevents new JEs in locked year')
  test('only super admin can unlock')
  test('logs unlock with full justification')
  
  // Reports
  test('generates trial balance correctly')
  test('income statement matches closing JE')
  test('balance sheet balanced')
  test('cash flow statement (direct method)')
  test('hash matches payload')
  test('signed reports immutable')
})

describe('Integration', () => {
  test('full happy path year close')
  test('reopen and re-close')
  test('multi-entity consolidation')
  test('failed task retry')
  test('cancellation mid-flow')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| FY = 13 months (transitional) | support extended period |
| Mid-year company acquisition | partial-year consolidation |
| Currency redenomination during year | use weighted FX |
| Account deleted mid-year | use historical at deletion |
| Cost center merger | sum balances |
| Mass JE reversal needed before close | new YE run mandatory after |
| Power outage mid-rollover | resume from last committed task |
| Disk full when generating reports | retry + alert |
| Two users start YE simultaneously | lock + reject second |
| Auditor signs but then needs change | second sign chain |
| FY skipped (no transactions) | still must close formally |
| Subsidiary in different fiscal calendar | handle independently |
| Late VAT adjustment after close | correction in next period |

---

**نهاية مواصفات النقص #2**

> 6 سيناريوهات • 5 جداول schema • 5 forms • 5 grids • 29 button • 7 widgets • 12 notifications • 28 task templates • 13 reports
