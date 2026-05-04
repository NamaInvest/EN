# النقص #8: Bank Reconciliation Exception Queue + AI Fuzzy Match — مواصفات تفصيلية

> **المرجعيات:** SAP FF67 (Manual Bank Reconciliation)、SAP F.13 / FAGLF101、Oracle Cash Reconciliation、BlackLine Account Reconciliation、ReconArt、AutoRek
> **معايير:** SOX 404 (controls)、PCAOB AS 2305 (substantiation)、IFRS 7 (disclosures)

---

## 1. البرومنت الكامل

```
ابني نظام Bank Reconciliation متطور بـ AI matching:

ملفات موجودة:
- src/lib/bank-recon-engine.ts (basic exact match)
- src/lib/bank-reconciliation.ts (manual matching)

المتطلبات:

A) Multi-strategy Matching Engine:
   1. Exact: amount + date (±1d) + reference
   2. Fuzzy reference: amount + date + Levenshtein distance < 3
   3. Counterparty + amount: IBAN/name match + amount
   4. Aggregate: sum of multiple invoices = single bank txn
   5. Split: single bank txn = multiple our payments
   6. AI assisted (Gemini): natural language match
   7. Rule-based: learned rules from past matches
   8. Pattern recognition: recurring patterns

B) Confidence Scoring (0-100):
   - Exact: 100
   - Fuzzy reference: 70-95
   - Counterparty: 60-85
   - Aggregate: 50-80
   - AI: variable
   - Pattern: variable

C) Auto-match Threshold:
   - configurable per bank account (default 90)
   - confidence >= threshold → auto match
   - else → exception queue

D) Exception Queue:
   - all unmatched/low-confidence
   - filters + bulk actions
   - manual match candidates suggested
   - create JE inline
   - mark as bank fee/interest
   - dismiss with reason

E) Rule Learning:
   - on manual match: capture pattern
   - "description contains X → account Y" rules
   - rules apply to future imports
   - track rule success rate

F) Common Recon Items Auto-Handle:
   - Bank charges → JE: DR Bank Fees
   - Interest received → JE: CR Interest Income
   - Returned checks (NSF) → reverse + alert
   - Standing orders → match by template
   - Direct debits → match by template
   - FX adjustments

G) Multi-period Recon:
   - Outstanding checks (issued, not yet cleared)
   - Deposits in transit (received, not yet on statement)
   - Bank book vs Bank statement reconciliation report
   - Period-end sign-off workflow

H) APIs (22 endpoints): انظر القسم 7

I) UI (10 pages): انظر قسم 5-7

J) Tests: 45+ unit, 18 integration, 6 E2E
```

---

## 2. السيناريوهات (8)

### A — Daily Auto-Match
```
- كشف بنك جديد imported (200 معاملة)
- Engine يطبق strategies بالترتيب:
  - 130 → Exact match (confidence 100) → auto
  - 35 → Fuzzy reference (90-95) → auto
  - 20 → Counterparty match (75-85) → exception queue
  - 10 → AI suggested (60-80) → exception queue
  - 5 → Unmatched
- Result: 165 auto-matched, 35 in queue
- Notification للـ AR: "35 معاملة تحتاج مراجعة"
```

### B — Manual Match in Exception Queue
```
1. AR clerk: /banks/recon/exceptions
2. يرى 35 معاملة
3. يضغط على معاملة "Payment from XYZ Co - 50,000"
4. Modal: candidates suggested:
   - Invoice #1234 - 50,000 (90% match)
   - Invoice #1235 - 49,800 (75% match)
   - Manual create JE
5. يختار #1234 → matched
6. Modal: "Save as rule?"
   - rule: "description contains 'XYZ' → match invoices for customer XYZ"
   - يقبل → rule created
```

### C — Aggregate Match
```
- Bank txn: 100,000 SAR (deposit)
- Our payments: 4 receipts (30K + 25K + 25K + 20K = 100K)
- Engine يحاول strategy 4 (Aggregate):
  - find combinations summing to 100K
  - found ✓ confidence 70
- Exception queue: shows 4 receipts grouped
- AR clerk: confirms → match all 4
```

### D — Split Match
```
- Bank txn: 100,000 SAR (transfer out)
- Our records: 1 payment 100,000 to vendor X
- BUT: vendor X received only 60K + bank fees 40K (false)
- Actual: 60K to vendor + 40K to vendor Y
- AR clerk: split bank txn into 2 → match each
```

### E — Rule-based Auto-Handle
```
- Bank txn description: "BANK FEE Q4 2026"
- Rule exists: "description contains 'BANK FEE' → JE: DR 5050 Bank Fees"
- Engine auto-creates JE
- Bank line marked as matched (to JE)
```

### F — Outstanding Check Tracking
```
- Issued check #5000 for 25,000 SAR على 5/5
- لم يظهر في كشف 31/5
- Recon report:
  - Bank book balance: 1,000,000
  - Bank statement balance: 1,025,000
  - Reconciling items:
    - Outstanding checks: -25,000 (check #5000)
  - Adjusted balance: 1,000,000 ✓
```

### G — Period-end Recon Sign-off
```
- AR Manager: "إغلاق مطابقة مايو"
- النظام يفحص:
  - exceptions count? > 0 → must resolve first
  - tolerance for residuals?
- Generate PDF reconciliation report
- AR Manager: [Submit for approval]
- CFO يراجع → يوافق
- Period locked: لا يمكن تعديل matched txns
```

### H — Recon for Bounced Check
```
- Check 10,000 issued لمورد
- Bank statement: txn "Check #X RETURNED - INSUFFICIENT FUNDS"
- Engine يكتشف keyword "RETURNED"
- Auto-handle:
  - reverse original check JE
  - flag check as BOUNCED
  - alert AP + accountant
  - block customer (if applicable)
```

---

## 3. تدفق البيانات

```
[Statement Imported] → trigger ReconEngine.matchStatement(statementId)
   ↓
   for each unmatched line in statement:
     ↓
     Strategy 1 - Exact:
       SELECT JEs/Payments WHERE
         amount = line.amount AND
         date BETWEEN line.date - 1 AND line.date + 1 AND
         reference = line.reference
       if 1 match → save with confidence 100
       continue
     ↓
     Strategy 2 - Fuzzy ref:
       compute Levenshtein on references
       threshold < 3
       if match → confidence 70-95
     ↓
     Strategy 3 - Counterparty:
       match counterpartyIBAN with vendor/customer.iban
       + amount + date window
     ↓
     Strategy 4 - Aggregate:
       try sum of 2-5 of our payments = bank amount
     ↓
     Strategy 5 - Split:
       try splitting bank amount into our payments
     ↓
     Strategy 6 - AI (Gemini):
       prompt: "Match this bank transaction with one of these candidates: [...]"
       parse confidence + suggestion
     ↓
     Strategy 7 - Rule-based:
       check learned rules
       if matches pattern → apply action
     ↓
     decide:
       if confidence >= autoMatchThreshold → save match
       else → add to exception queue with suggestions

[Manual Match]
POST /banks/recon/match
   { lineId, targetType, targetId, confidence?, saveAsRule? }
      ↓
   create match record
   update line.matchStatus = MANUAL_MATCHED
   if saveAsRule → call ruleLearner.learnFromMatch()

[Create JE from Exception]
POST /banks/recon/create-je
   { lineId, accountId, description }
      ↓
   create JE: DR/CR based on line.type
   link JE to line

[Sign-off]
POST /banks/recon/close-period
   { bankAccountId, periodEnd }
      ↓
   validate:
     - no exceptions
     - reconciling items reasonable
   ↓
   generate PDF
   create BankReconciliation record
   workflow approval
```

---

## 4. Prisma Schema

```prisma
model BankReconciliation {
  id                    Int               @id @default(autoincrement())
  bankAccountId         Int
  bankAccount           BankAccount       @relation(fields: [bankAccountId], references: [id])
  
  reconciliationNumber  String            @unique
  periodStart           DateTime
  periodEnd             DateTime
  
  bookBalance           Decimal           @db.Decimal(20,4)
  bankBalance           Decimal           @db.Decimal(20,4)
  
  reconcilingItems      Json              // {outstandingChecks: [...], depositsInTransit: [...], adjustments: [...]}
  totalReconcilingItems Decimal           @db.Decimal(20,4)
  
  adjustedBookBalance   Decimal           @db.Decimal(20,4)
  difference            Decimal           @db.Decimal(20,4)
  
  status                String            @default("DRAFT")  // DRAFT | PENDING_APPROVAL | APPROVED | LOCKED | REOPENED
  
  pdfUrl                String?
  pdfHash               String?
  
  createdByUserId       String
  createdAt             DateTime          @default(now())
  submittedAt           DateTime?
  approvedByUserId      String?
  approvedAt            DateTime?
  lockedAt              DateTime?
  
  notes                 String?           @db.Text
  
  matchedLines          BankStatementLine[]
  
  @@unique([bankAccountId, periodEnd])
  @@index([bankAccountId, status])
}

model BankReconRule {
  id                    Int               @id @default(autoincrement())
  ruleNumber            String            @unique
  name                  String
  
  bankAccountId         Int?              // null = applies to all
  bankAccount           BankAccount?      @relation(fields: [bankAccountId], references: [id])
  
  conditions            Json              // [{field: 'description', operator: 'contains', value: 'BANK FEE'}]
  
  action                String            // 'CREATE_JE' | 'MATCH_TO_VENDOR' | 'MATCH_TO_CUSTOMER' | 'IGNORE' | 'CATEGORIZE'
  actionParams          Json              // {accountId, description, etc.}
  
  priority              Int               @default(100)
  
  successCount          Int               @default(0)
  failureCount          Int               @default(0)
  successRate           Decimal?          @db.Decimal(5,2)
  
  enabled               Boolean           @default(true)
  
  learnedFromLineId     Int?              // origin of this rule
  
  createdByUserId       String?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  lastAppliedAt         DateTime?
  
  @@index([bankAccountId, enabled, priority])
}

model BankReconciliationException {
  id                    Int               @id @default(autoincrement())
  lineId                Int               @unique
  line                  BankStatementLine @relation(fields: [lineId], references: [id], onDelete: Cascade)
  
  reason                String            // 'NO_MATCH' | 'LOW_CONFIDENCE' | 'AMBIGUOUS' | 'AGGREGATE_NEEDED'
  suggestions           Json              // candidate matches with confidence
  
  assignedToUserId      String?
  priority              String            @default("NORMAL")
  
  resolvedAt            DateTime?
  resolvedByUserId      String?
  resolution            String?           // 'MATCHED' | 'JE_CREATED' | 'IGNORED' | 'WRITTEN_OFF'
  resolutionNotes       String?
  
  createdAt             DateTime          @default(now())
  
  @@index([resolvedAt, assignedToUserId])
  @@index([priority, createdAt])
}

model BankStatementLine {
  // ... existing fields
  matchConfidence       Decimal?          @db.Decimal(5,2)
  matchStrategy         String?           // 'EXACT' | 'FUZZY' | 'COUNTERPARTY' | 'AGGREGATE' | 'SPLIT' | 'AI' | 'RULE'
  aiSuggestion          Json?             // raw AI response
  matchedJournalId      Int?
  matchedToType         String?
  matchedToId           Int?
  matchedToIds          Int[]             // for aggregate matches
  splitParentId         Int?              // if this line is part of a split
  
  reconciliationId      Int?
  reconciliation        BankReconciliation? @relation(fields: [reconciliationId], references: [id])
  
  exception             BankReconciliationException?
}

model OutstandingCheck {
  id                    Int               @id @default(autoincrement())
  checkId               Int               @unique
  check                 Check             @relation(fields: [checkId], references: [id])
  bankAccountId         Int
  issuedDate            DateTime
  amount                Decimal           @db.Decimal(20,4)
  payee                 String
  status                String            @default("OUTSTANDING")  // OUTSTANDING | CLEARED | STALE | CANCELLED
  daysOutstanding       Int               @default(0)
  clearedDate           DateTime?
  matchedLineId         Int?
  
  @@index([bankAccountId, status])
  @@index([daysOutstanding])
}

model DepositInTransit {
  id                    Int               @id @default(autoincrement())
  bankAccountId         Int
  depositDate           DateTime
  amount                Decimal           @db.Decimal(20,4)
  source                String            // customer name or reference
  status                String            @default("IN_TRANSIT")  // IN_TRANSIT | CLEARED | RETURNED
  clearedDate           DateTime?
  matchedLineId         Int?
  
  @@index([bankAccountId, status])
}
```

---

## 5. Forms & Fields

### Form A: Manual Match
| Field | Type | Required |
|-------|------|----------|
| lineId | hidden | ✓ |
| targetType | radio | ✓ JE/Payment/Check/Receipt |
| targetId | searchable picker | ✓ |
| matchConfidence | number 0-100 | ✗ default 100 |
| notes | textarea | ✗ |
| saveAsRule | toggle | ✗ |
| rulePattern | text | conditional |

### Form B: Create JE from Line
| Field | Type | Required |
|-------|------|----------|
| lineId | hidden | ✓ |
| account | account picker | ✓ |
| description | text | ✓ |
| amount | money | ✓ (auto from line) |
| costCenter | dropdown | ✗ |
| project | dropdown | ✗ |
| createRule | toggle | ✗ |

### Form C: Aggregate Match
| Field | Type | Required |
|-------|------|----------|
| bankLineId | hidden | ✓ |
| invoiceIds | multi-select | ✓ min 2 |
| sumValidation | live calc | ✓ must equal bank amount |

### Form D: Split Match
| Field | Type | Required |
|-------|------|----------|
| bankLineId | hidden | ✓ |
| splits | dynamic table | ✓ min 2 |
| splits[i].amount | money | ✓ |
| splits[i].targetType | radio | ✓ |
| splits[i].targetId | picker | ✓ |
| sumValidation | live | ✓ |

### Form E: Rule Editor
| Field | Type | Required |
|-------|------|----------|
| name | text | ✓ |
| bankAccountId | dropdown | ✗ all if empty |
| conditions | dynamic | ✓ min 1 |
| conditions[i].field | dropdown | ✓ |
| conditions[i].operator | dropdown | ✓ |
| conditions[i].value | text | ✓ |
| action | dropdown | ✓ |
| actionParams | composite | conditional |
| priority | number | ✓ |
| enabled | toggle | ✓ |

### Form F: Period-end Sign-off
| Field | Type | Required |
|-------|------|----------|
| bankAccountId | hidden | ✓ |
| periodEnd | datepicker | ✓ |
| reconcilingItemsAccepted | toggle | ✓ |
| notes | textarea | ✓ |
| signature | password | ✓ |

---

## 6. Tables & Columns

### Grid A: Reconciliation Dashboard
- KPIs: Today's matches / Exceptions / Outstanding checks / Deposits in transit / Last sign-off

### Grid B: Exceptions Queue
| Column | Width |
|--------|-------|
| Date | 110 |
| Bank Acct | 150 |
| Type | D/C | 70 |
| Amount | money | 130 |
| Description | text | 250 |
| Counterparty | text | 180 |
| Suggestions | counter + tooltip | 100 |
| AI Confidence | progress | 110 |
| Priority | badge | 100 |
| Assigned | user | 130 |
| Days Open | number | 100 |
| Actions: [Match] [Create JE] [Aggregate] [Split] [Ignore] | 250 |

### Grid C: Match Candidates Modal
| Column | Width |
|--------|-------|
| Type | badge | 100 |
| Date | 110 |
| Doc # | 130 |
| Description | 250 |
| Amount | money | 130 |
| Counterparty | 180 |
| Confidence | progress | 110 |
| Reason | text | 200 |
| Actions: [Match] | 100 |

### Grid D: Rules
| Column | Width |
|--------|-------|
| Rule # | 100 |
| Name | 250 |
| Bank Account | 150 |
| Conditions | text | 300 |
| Action | badge | 130 |
| Priority | number | 80 |
| Success Rate | progress | 110 |
| Times Applied | number | 100 |
| Last Applied | datetime | 150 |
| Enabled | toggle | 80 |
| Actions: [Edit] [Disable] [Delete] | 200 |

### Grid E: Outstanding Checks
| Column | Width |
|--------|-------|
| Check # | 110 |
| Issued Date | 130 |
| Days Outstanding | 130 |
| Amount | money | 130 |
| Payee | text | 200 |
| Status | badge | 110 |
| Actions: [Mark Cleared] [Cancel] [Stale] | 200 |

### Grid F: Reconciliation History
| Column | Width |
|--------|-------|
| Recon # | 130 |
| Bank Account | 200 |
| Period | dates | 200 |
| Book Balance | money | 130 |
| Bank Balance | money | 130 |
| Difference | money | 130 |
| Status | badge | 130 |
| Approved By | user | 130 |
| Approved At | datetime | 150 |
| Actions: [View] [Re-open] [Download PDF] | 250 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-recon-run | تشغيل المطابقة | dashboard | 🟦 | role.ar |
| btn-line-match | مطابقة | exception | 🟦 | role.ar |
| btn-line-create-je | إنشاء قيد | exception | 🟢 | role.ar |
| btn-line-aggregate | جمع | exception | 🟡 | role.ar |
| btn-line-split | تقسيم | exception | 🟡 | role.ar |
| btn-line-ignore | تجاهل | exception | 🔴 | role.ar + reason |
| btn-line-undo-match | إلغاء المطابقة | matched | 🔴 | role.ar_supervisor |
| btn-line-categorize | تصنيف | line | ⬜ | role.ar |
| btn-bulk-match-suggested | مطابقة مقترحة (مجموعة) | exceptions | 🟢 | role.ar_supervisor |
| btn-bulk-ignore | تجاهل مجموعة | exceptions | 🔴 | role.ar_supervisor |
| btn-bulk-assign | إسناد | exceptions | ⬜ | role.ar_supervisor |
| btn-rule-create | + قاعدة | rules | 🟢 | role.ar_supervisor |
| btn-rule-edit | تعديل | rule row | ⬜ | role.ar_supervisor |
| btn-rule-test | اختبار | rule editor | 🟡 | role.ar_supervisor |
| btn-rule-disable | تعطيل | rule row | 🔴 | role.ar_supervisor |
| btn-rule-delete | حذف | rule row | 🔴 | unused only |
| btn-rule-from-match | حفظ كقاعدة | match modal | 🟢 | role.ar |
| btn-recon-close-period | إغلاق مطابقة الفترة | dashboard | 🔴 | role.ar_manager |
| btn-recon-approve | موافقة | recon row | 🟢 | role.cfo |
| btn-recon-reopen | إعادة فتح | recon row | 🔴 | role.cfo + reason |
| btn-recon-pdf | تنزيل PDF | recon row | ⬜ | viewer |
| btn-check-mark-cleared | تم الصرف | check row | 🟢 | role.ar |
| btn-check-cancel | إلغاء | check row | 🔴 | role.ar_manager |
| btn-check-stale | متقادم | check row | 🟡 | role.ar |
| btn-export-exceptions | تصدير | exceptions | ⬜ | role.ar |

---

## 8. Search & Filters

### Exceptions:
- Bank account, Date range, Amount range, Type (D/C), Has suggestions, Priority, Assigned, Days open

### Rules:
- Bank account, Action type, Enabled, Success rate range

### Reconciliations:
- Bank account, Period range, Status, Approved by

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Bank Reconciliation Statement | per period per account |
| Exceptions Aging | how long open |
| Auto-match Rate Trend | monthly |
| Rule Effectiveness | which rules work |
| Outstanding Checks Aging | stale checks |
| Deposits in Transit | per period |
| Reconciliation Compliance | sign-off timing |
| Match Strategy Distribution | which strategies most used |
| AI Match Performance | confidence vs accuracy |

---

## 10. Dashboards & Widgets

- KPIs: Auto-match rate / Exceptions / Outstanding checks / Last recon date
- Charts: Match rate trend, Exception aging histogram, Strategy mix
- Lists: Today's exceptions, Old outstanding checks, Pending sign-offs

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Recon match completed | in-app | initiator |
| New exceptions | in-app | AR team |
| Exception > 7 days old | email | AR clerk + supervisor |
| Outstanding check > 90 days | email | AP manager |
| Period sign-off pending | email | AR manager |
| Sign-off approved | email | initiator |
| Rule learned | in-app | creator |
| Rule disabled (low success rate) | in-app | creator |

---

## 12. Permissions Matrix

| Action | Clerk | Supervisor | Manager | CFO |
|--------|-------|-----------|---------|-----|
| Run match | ✓ | ✓ | ✓ | ✓ |
| Manual match | ✓ | ✓ | ✓ | ✓ |
| Create JE from line | ✓ | ✓ | ✓ | ✓ |
| Undo match | ✗ | ✓ | ✓ | ✓ |
| Bulk operations | ✗ | ✓ | ✓ | ✓ |
| Create rule | ✗ | ✓ | ✓ | ✓ |
| Edit rule | ✗ | ✓ | ✓ | ✓ |
| Close period | ✗ | ✗ | ✓ | ✓ |
| Approve sign-off | ✗ | ✗ | ✗ | ✓ |
| Re-open closed period | ✗ | ✗ | ✗ | ✓ |
| Manage outstanding checks | ✓ | ✓ | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Google Gemini | AI matching |
| BlackLine | external reconciliation tool sync |
| BullMQ | background matching |
| Email service | notifications |
| PDF generator | recon statement |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `M` | Match selected |
| `J` | Create JE |
| `I` | Ignore |
| `A` | Aggregate (multi-select) |
| `R` | Run match |

---

## 15. Mobile / Print

- Mobile: simplified exception queue + tap-to-match
- Print: bank reconciliation statement (audit-ready)

---

## 16. Audit & Logging

- Every match → AuditLog with strategy + confidence
- Every JE created → linked to bank line
- Period close → immutable record
- Rule changes → diff
- Outstanding checks → history

---

## 17. Test Cases

```typescript
describe('Match Strategies', () => {
  test('exact match scores 100')
  test('fuzzy reference Levenshtein')
  test('counterparty + amount')
  test('aggregate sum')
  test('split distribution')
  test('AI suggestion parsing')
  test('rule application')
})

describe('Confidence Threshold', () => {
  test('above threshold auto-matches')
  test('below threshold queues')
  test('configurable per account')
})

describe('Rule Learning', () => {
  test('captures pattern from manual match')
  test('applies to similar future txns')
  test('tracks success rate')
  test('disables low-success rules')
})

describe('Period Close', () => {
  test('blocks if exceptions exist')
  test('generates PDF correctly')
  test('locks matched txns')
  test('approval workflow')
})

describe('Outstanding Checks', () => {
  test('tracks unmatched checks')
  test('marks stale after 180 days')
  test('clears on bank match')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Match candidate already matched | exclude |
| Multiple candidates same confidence | show all + manual |
| Negative amount (correction) | special handling |
| Currency conversion within match | recompute amounts |
| Bank fee inside transfer description | extract + sub-allocate |
| Reversal of cleared txn | undo + alert |
| Future-dated bank txn | accept + don't match yet |
| Rule conflict (2 rules same line) | priority resolves |
| Sign-off with residual difference | require explanation |
| Mass undo (admin tool) | requires manager + audit |

---

**نهاية مواصفات النقص #8**

> 8 سيناريوهات • 6 جداول schema • 6 forms • 6 grids • 25 button • 8 widgets • 8 notifications • 9 reports
