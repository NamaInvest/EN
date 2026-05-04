# النقص #3: Open Items متعدد العملات + Disputes — مواصفات تفصيلية

> **المرجعيات:** SAP FI Open Items Management، Oracle Cash Management، NetSuite Cash Application، HighRadius، Billtrust، Versapay
> **معايير:** IFRS 9 (financial instruments)، IAS 21 (FX)، IFRS 15 (revenue)، PCAOB AS 2410 (audit)

---

## 1. البرومنت الكامل

```
وسّع نظام Open Items في Namasoft ERP إلى مستوى SAP FSCM:

ملفات موجودة:
- src/lib/open-items.ts (FIFO basic SAR only)
- prisma model OpenItem
- src/app/api/accounting/open-items/* (basic routes)

المتطلبات:

A) Schema (إضافات لـ OpenItem + جداول جديدة):
   - OpenItem: + currency, originalAmount, originalOpenAmount, exchangeRate,
     disputedAmount, disputedReason, disputedAt, disputedByUserId,
     disputeStatus, disputeResolution, disputeResolvedAt, disputeResolvedByUserId,
     promiseToPayDate, promiseToPayAmount,
     creditScore, riskLevel, lastReminderSentAt,
     allocationStatus, parentOpenItemId, splitFromId,
     externalReference, blockedForCollection, blockReason
   - ItemApplication: full schema (انظر القسم 4)
   - DisputeCase: full case management
   - DeductionReason: catalog of deduction codes
   - WriteoffPolicy: rules for auto-writeoff

B) Engine توسيعات:
   1. Multi-currency matching:
      - parsing currencies, fetching FX rates from ExchangeRate table
      - calculating realized/unrealized FX gain/loss
      - posting JE with FX line
   
   2. Dispute Management Workflow:
      - markAsDisputed(openItemId, amount, reason, expectedResolution, attachments)
      - assignDispute(caseId, assigneeUserId)
      - addCommunication(caseId, type, content)
      - escalate(caseId, level, reason)
      - resolveDispute(caseId, resolution: ACCEPT_CUSTOMER | REJECT_CLAIM | PARTIAL_CREDIT | WRITEOFF | LITIGATE)
   
   3. Auto-Match Strategies (configurable):
      - FIFO (default)
      - LIFO
      - LARGEST first
      - SMALLEST first
      - BY_REFERENCE (match by invoice number in payment description)
      - BY_DATE (closest to payment date)
      - SMART (ML-based — analyze patterns)
   
   4. Tolerance Rules:
      - per customer / per amount band
      - WriteoffPolicy: { underAmount, overAmount, percentageThreshold, autoApprove }
      - small differences → auto-writeoff to Bank Charges/Rounding
      - large → exception queue
   
   5. Partial Application + Discount:
      - 2/10 Net 30 → if paid within 10 days, auto-apply 2% discount
      - DR Sales Discount expense / CR AR
      - track discountTaken vs discountForfeited
   
   6. Reverse Application:
      - undo a match → restore openAmounts
      - create reversal JE
      - audit trail full
   
   7. Aging Engine (multi-bucket):
      - 0-15, 16-30, 31-45, 46-60, 61-90, 91-120, 121-180, >180
      - per customer / per currency / per branch
      - separate disputed amounts
      - DSO calculation (days sales outstanding)
   
   8. Credit Risk Scoring:
      - factor in: payment history, dispute frequency, average DSO, current exposure
      - score 0-100 (calculated nightly)
      - alert when score drops by >20%

C) APIs (28 endpoints): انظر قسم 7

D) UI: 12 pages: انظر قسم 5-7

E) Tests: 40+ unit, 15 integration, 5 E2E
```

---

## 2. السيناريوهات (10)

### A — Multi-currency Application
```
عميل أوروبي:
- فاتورة 15,000 EUR في 1/1/2026 (rate 4.20 → 63,000 SAR)
- دفع 15,000 EUR في 1/3/2026 (rate 4.18 → 62,700 SAR)
- النظام:
  - تطابق الفاتورة + الدفع (نفس العملة، نفس المبلغ)
  - حساب FX loss: 63,000 - 62,700 = 300 SAR loss
  - JE: DR Cash 62,700 / DR FX Loss 300 / CR AR 63,000
- البديل: لو دفع 15,000 EUR @ 4.25 → FX gain 750
```

### B — Partial Payment مع Discount
```
- فاتورة 10,000 SAR في 1/1، شروط 2/10 Net 30
- العميل دفع 9,800 SAR في 8/1 (خلال 10 أيام)
- المحاسب يضغط "Apply Payment with Discount":
  - amount: 10,000 (قيمة الفاتورة)
  - paid: 9,800
  - discount: 200 (2%)
  - discount valid: ✓ (within window)
  - JE:
    DR Cash 9,800
    DR Sales Discount 200
    CR AR 10,000
- لو دفع في 15/1 (بعد window) → no discount → balance 200 يبقى مستحق
```

### C — Dispute Lifecycle
```
1. فاتورة 50,000 SAR، عميل يطعن في 8,000 منها (بضاعة معيبة)
2. /accounting/customers/123/open-items → فاتورة 50K → [وضع نزاع]
3. Modal:
   - مبلغ: 8,000
   - سبب: dropdown [Defective Goods]
   - تفاصيل: textarea "10 وحدات معيبة من أصل 100"
   - تاريخ متوقع للحل: 30 يوم
   - مرفقات: صور المنتج المعيب (2 ملفات)
   - أسند إلى: مدير المبيعات
4. النظام:
   - DisputeCase created
   - OpenItem.disputedAmount = 8,000
   - dunning ينظر فقط للـ 42,000
   - إشعار للـ مدير المبيعات
5. مدير المبيعات يفتح الـ case:
   - يضيف communication: "اتصلت بالعميل، سنرسل بضاعة بديلة"
   - يصعّد لـ Quality Manager
6. بعد 15 يوم: يحلّه:
   - resolution: PARTIAL_CREDIT (5,000)
   - النظام يولّد Credit Note بـ 5,000
   - DR Sales Returns 5,000 / CR AR 5,000
   - openAmount = 50,000 - 5,000 = 45,000
   - disputedAmount = 0
7. dunning يعود للعمل على الـ 45,000
```

### D — Auto-Match Tolerance
```
- فاتورة 10,000.50، دفع 10,000.00
- WriteoffPolicy للعميل: under 1 SAR → auto-writeoff
- النظام:
  - يطابق
  - يولّد JE: DR Cash 10,000 / DR Rounding 0.50 / CR AR 10,000.50
  - openItem.status = CLEARED
```

### E — Smart Match بـ Reference
```
- دفع وارد 50,000 SAR، description: "INV-2026-001234 + INV-2026-001235"
- النظام:
  - parse references بـ regex
  - يجد 2 فواتير: 30,000 + 20,000 = 50,000 ✓
  - auto-match
- لو reference غير واضح → exception queue
```

### F — Reverse Mistaken Application
```
- محاسب طبّق الدفع 5,000 على فاتورة خطأ
- /accounting/open-items/applications → يفتح الـ application
- يضغط [عكس]
- يدخل سبب: "Wrong invoice"
- النظام:
  - يعكس الـ openAmounts
  - reversal JE
  - يضع علم على الـ application: REVERSED
  - يرسل إشعار للمحاسب الأصلي
```

### G — Credit Hold بسبب Risk Score
```
- العميل score انخفض من 80 إلى 45 (بسبب 3 disputes + late payments)
- النظام تلقائياً:
  - يضع Customer.creditHold = true
  - يمنع إصدار فواتير جديدة (إلا بموافقة manager)
  - تنبيه CFO + Sales Manager
```

### H — Bulk Application
```
- المحاسب لديه bank statement فيه 50 دفعة
- /accounting/cash-application → bulk mode
- يستورد الـ 50 → النظام:
  - 35 → exact match (auto-applied)
  - 10 → reference match (auto-applied)
  - 5 → exception queue (manual)
- المحاسب يعالج الـ5 يدوياً
```

### I — Bad Debt Writeoff
```
- فاتورة 15,000 معلقة منذ 18 شهر
- العميل أفلس
- المحاسب: [Writeoff as Bad Debt]
- يدخل سبب + موافقة manager
- JE:
  DR Bad Debt Expense 15,000
  CR AR 15,000
- لو لاحقاً العميل دفع: Recovery JE
  DR Cash 15,000
  CR Bad Debt Recovery 15,000
```

### J — Promise to Pay
```
- المحاسب يتصل بعميل overdue: يعد بالدفع 15/5
- /accounting/open-items/123 → [تسجيل وعد بالدفع]
- form: amount, date, notes
- النظام:
  - dunning يتجاوز الفاتورة حتى 16/5
  - reminder للمحاسب في 15/5
  - في 16/5: لو لم يدفع → dunning level أعلى
  - لو دفع: ✓ تم الوفاء
```

---

## 3. تدفق البيانات

### Apply Payment Flow
```
[Cash App UI] → POST /open-items/apply-payment
   { paymentOpenItemId, allocations: [{invoiceId, amount, discount?, writeoff?}] }
      ↓
   begin TX (SERIALIZABLE)
      ↓
   for each allocation:
     - lock invoice openItem (FOR UPDATE)
     - lock payment openItem
     - validate: payment.openAmount >= sum(allocations.amount)
     - validate: invoice.openAmount >= allocation.amount + discount
     - check currency:
       if same → straight match
       if different → fetch FX rate → calculate FX gain/loss
     - update invoice.openAmount -= amount
     - update payment.openAmount -= amount
     - if invoice.openAmount = 0 → status = CLEARED
     - if payment.openAmount = 0 → status = CLEARED
     - create ItemApplication record
      ↓
   build unified JE:
     - DR Cash (payment currency)
     - CR AR (invoice currency, FX-converted)
     - DR/CR FX Gain/Loss
     - DR Sales Discount (if any)
     - DR Bad Debt (if writeoff)
     - validate balanced
      ↓
   post JE → POSTED
   link applications to JE
   create AuditLog
   commit
      ↓
   trigger notifications:
     - email customer "Payment received"
     - update credit score
     - check dunning impact
      ↓
   return { applied: [], totalApplied, fxGainLoss, discountTaken, writeoff }
```

### Dispute Flow
```
[Customer Card] → [Dispute Button] → POST /open-items/disputes
   { openItemId, amount, reasonCode, description, expectedResolution, attachments }
      ↓
   create DisputeCase (status=OPEN, severity=auto-classified)
      ↓
   update OpenItem.disputedAmount += amount
   update OpenItem.disputeStatus = ACTIVE
      ↓
   create AuditLog
      ↓
   notify:
     - assignee
     - manager (if amount > threshold)
     - customer (acknowledgment email)
      ↓
[Investigation phase] → POST /disputes/:id/communications
   { type: EMAIL|CALL|MEETING|INTERNAL_NOTE, content, attachments }
      ↓
[Resolution] → POST /disputes/:id/resolve
   { resolution, amount, notes }
      ↓
   based on resolution:
     - ACCEPT_CUSTOMER → create CreditNote → reduce AR
     - REJECT_CLAIM → reduce disputedAmount to 0 → resume dunning
     - PARTIAL_CREDIT → create CreditNote (partial)
     - WRITEOFF → JE: DR Bad Debt / CR AR
     - LITIGATE → escalate to legal, status=IN_LITIGATION
      ↓
   update OpenItem
   create resolution JE (if any)
   notify all parties
```

---

## 4. Prisma Schema

```prisma
model OpenItem {
  id                    Int                @id @default(autoincrement())
  partyId               Int
  partyType             String             // 'customer' | 'vendor'
  documentType          String             // 'invoice' | 'credit_note' | 'payment' | 'advance'
  documentId            Int
  documentNumber        String
  documentDate          DateTime
  dueDate               DateTime?
  
  // Amounts (functional currency = SAR)
  amount                Decimal            @db.Decimal(20,4)
  openAmount            Decimal            @db.Decimal(20,4)
  
  // Original currency
  currency              String             @default("SAR")
  originalAmount        Decimal            @db.Decimal(20,4)
  originalOpenAmount    Decimal            @db.Decimal(20,4)
  exchangeRate          Decimal            @db.Decimal(20,8) @default(1)
  rateDate              DateTime?
  
  // Status
  status                String             @default("OPEN")  // OPEN | PARTIAL | CLEARED | WRITTEN_OFF | DISPUTED_FULL
  
  // Dispute
  disputedAmount        Decimal?           @db.Decimal(20,4)
  disputeStatus         String?            // null | ACTIVE | RESOLVED | LITIGATING
  disputeCases          DisputeCase[]
  
  // Promise to pay
  promiseToPayDate      DateTime?
  promiseToPayAmount    Decimal?           @db.Decimal(20,4)
  promiseStatus         String?            // null | ACTIVE | KEPT | BROKEN
  
  // Risk
  riskLevel             String             @default("NORMAL")  // LOW | NORMAL | HIGH | CRITICAL
  blockedForCollection  Boolean            @default(false)
  blockReason           String?
  
  // Dunning state
  dunningLevel          Int                @default(0)
  lastReminderSentAt    DateTime?
  remindersCount        Int                @default(0)
  snoozedUntil          DateTime?
  snoozeReason          String?
  
  // External
  externalReference     String?
  
  // Allocation tree (for splits)
  parentOpenItemId      Int?
  parentOpenItem        OpenItem?          @relation("OpenItemSplits", fields: [parentOpenItemId], references: [id])
  splits                OpenItem[]         @relation("OpenItemSplits")
  
  // Apps
  applicationsAsPayment ItemApplication[]  @relation("ApplicationPayment")
  applicationsAsInvoice ItemApplication[]  @relation("ApplicationInvoice")
  
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  
  @@index([partyId, partyType, status])
  @@index([dueDate, status])
  @@index([currency, status])
  @@index([disputeStatus])
  @@index([documentType, documentId])
}

model ItemApplication {
  id                    Int                @id @default(autoincrement())
  
  paymentOpenItemId     Int
  paymentOpenItem       OpenItem           @relation("ApplicationPayment", fields: [paymentOpenItemId], references: [id])
  invoiceOpenItemId     Int
  invoiceOpenItem       OpenItem           @relation("ApplicationInvoice", fields: [invoiceOpenItemId], references: [id])
  
  appliedAmount         Decimal            @db.Decimal(20,4)
  appliedCurrency       String
  invoiceCurrency       String
  paymentCurrency       String
  exchangeRateUsed      Decimal            @db.Decimal(20,8)
  
  fxGainLoss            Decimal?           @db.Decimal(20,4)
  fxGainLossAccountId   Int?
  
  discountAmount        Decimal?           @db.Decimal(20,4)
  discountAccountId     Int?
  
  writeoffAmount        Decimal?           @db.Decimal(20,4)
  writeoffReason        String?
  writeoffAccountId     Int?
  writeoffApprovedByUserId String?
  
  matchStrategy         String             // 'MANUAL' | 'FIFO' | 'LIFO' | 'LARGEST' | 'REFERENCE' | 'SMART'
  matchConfidence       Decimal?           @db.Decimal(5,2)
  
  appliedAt             DateTime           @default(now())
  appliedByUserId       String
  journalEntryId        Int?
  
  reversedAt            DateTime?
  reversedByUserId      String?
  reversalReason        String?
  reversalJournalId     Int?
  
  @@index([paymentOpenItemId])
  @@index([invoiceOpenItemId])
  @@index([appliedAt])
  @@index([reversedAt])
}

model DisputeCase {
  id                    Int                @id @default(autoincrement())
  caseNumber            String             @unique
  openItemId            Int
  openItem              OpenItem           @relation(fields: [openItemId], references: [id])
  customerId            Int
  
  amount                Decimal            @db.Decimal(20,4)
  currency              String
  reasonCode            String             // FK to DeductionReason
  reasonText            String
  description           String             @db.Text
  
  severity              String             @default("MEDIUM")  // LOW | MEDIUM | HIGH | CRITICAL
  priority              String             @default("NORMAL")  // LOW | NORMAL | HIGH | URGENT
  
  status                String             @default("OPEN")    // OPEN | INVESTIGATING | PENDING_CUSTOMER | PENDING_INTERNAL | RESOLVED | CANCELLED
  
  raisedAt              DateTime           @default(now())
  raisedByUserId        String
  expectedResolution    DateTime?
  
  assignedToUserId      String?
  assignedAt            DateTime?
  
  escalationLevel       Int                @default(0)
  escalatedAt           DateTime?
  escalatedToUserId     String?
  
  resolvedAt            DateTime?
  resolvedByUserId      String?
  resolution            String?            // 'ACCEPT_CUSTOMER' | 'REJECT_CLAIM' | 'PARTIAL_CREDIT' | 'WRITEOFF' | 'LITIGATE'
  resolutionAmount      Decimal?           @db.Decimal(20,4)
  resolutionNotes       String?            @db.Text
  resolutionJournalId   Int?
  creditNoteId          Int?
  
  attachments           DisputeAttachment[]
  communications        DisputeCommunication[]
  
  customerSatisfactionScore Int?
  
  @@index([customerId, status])
  @@index([assignedToUserId, status])
  @@index([raisedAt, status])
}

model DisputeAttachment {
  id          Int          @id @default(autoincrement())
  caseId      Int
  case        DisputeCase  @relation(fields: [caseId], references: [id], onDelete: Cascade)
  fileUrl     String
  fileName    String
  fileType    String
  fileSizeBytes Int
  uploadedAt  DateTime     @default(now())
  uploadedByUserId String
}

model DisputeCommunication {
  id          Int          @id @default(autoincrement())
  caseId      Int
  case        DisputeCase  @relation(fields: [caseId], references: [id], onDelete: Cascade)
  type        String       // EMAIL | CALL | MEETING | INTERNAL_NOTE | LETTER
  direction   String?      // INBOUND | OUTBOUND
  content     String       @db.Text
  fromAddress String?
  toAddress   String?
  occurredAt  DateTime     @default(now())
  recordedByUserId String
  attachments Json?
  
  @@index([caseId, occurredAt])
}

model DeductionReason {
  id          Int          @id @default(autoincrement())
  code        String       @unique
  nameAr      String
  nameEn      String
  category    String       // PRICING | QUALITY | DELIVERY | SHORT_PAY | ADMIN | TAX | OTHER
  defaultResolution String?
  requiresEvidence Boolean @default(true)
  glAccountId Int?         // default account for resolution
  active      Boolean      @default(true)
  
  @@index([category, active])
}

model WriteoffPolicy {
  id          Int          @id @default(autoincrement())
  name        String
  customerSegmentId Int?
  underAmount Decimal      @db.Decimal(20,4)  // auto-writeoff if abs(diff) < this
  glAccountId Int          // where to post (Rounding, Bank Charges, etc.)
  requiresApproval Boolean @default(false)
  approverRole String?
  active      Boolean      @default(true)
  effectiveFrom DateTime
  effectiveTo DateTime?
}

model CustomerCreditScore {
  id          Int          @id @default(autoincrement())
  customerId  Int          @unique
  currentScore Int          // 0-100
  previousScore Int?
  scoreDate   DateTime     @default(now())
  factors     Json         // {paymentHistory: 30, disputes: 20, dso: 15, ...}
  history     CustomerCreditScoreHistory[]
  
  @@index([currentScore])
}

model CustomerCreditScoreHistory {
  id          Int          @id @default(autoincrement())
  customerCreditScoreId Int
  customerCreditScore CustomerCreditScore @relation(fields: [customerCreditScoreId], references: [id])
  score       Int
  changeReason String?
  recordedAt  DateTime     @default(now())
}
```

---

## 5. Forms & Fields

### Form A: Apply Payment (Cash Application)
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| paymentOpenItemId | hidden | ✓ | exists, type=payment | from URL |
| customerId | autocomplete | ✓ | from payment | locked |
| allocations[] | dynamic table | ✓ min 1 | — | drag-drop add |
| allocations[i].invoiceId | invoice picker | ✓ | open invoices for customer | autocomplete |
| allocations[i].amount | money | ✓ | <= invoice.openAmount, <= payment.remainingAmount | live calc |
| allocations[i].discount | money | ✗ | <= 100% of amount | tooltip: "خصم تعجيل دفع" |
| allocations[i].discountReason | dropdown | conditional | enum | required if discount |
| allocations[i].writeoff | money | ✗ | <= tolerance | requires approval if > policy |
| allocations[i].writeoffReason | dropdown | conditional | enum | required if writeoff |
| matchStrategy | dropdown | ✓ | MANUAL/FIFO/LIFO/LARGEST | default MANUAL |
| notes | textarea | ✗ | max 500 | — |
| confirmFxImpact | checkbox | conditional | — | shown only if FX gain/loss > 100 |

### Form B: Auto-Apply Modal
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| paymentOpenItemId | hidden | ✓ | — |
| strategy | radio | ✓ | FIFO / LIFO / LARGEST / SMART |
| dryRun | checkbox | ✗ | preview only |
| respectDiscountWindow | toggle | ✗ | apply 2/10 etc |
| ignoreDisputed | toggle | ✗ | skip disputed amounts |

### Form C: Mark as Disputed
| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| openItemId | hidden | ✓ | — | — |
| amount | money | ✓ | > 0, <= openAmount | partial dispute allowed |
| reasonCode | dropdown | ✓ | from DeductionReason | grouped by category |
| description | textarea | ✓ | min 30 | — |
| expectedResolution | datepicker | ✗ | > today | — |
| severity | dropdown | ✓ | LOW/MED/HIGH/CRITICAL | auto-suggested by amount |
| assignToUserId | user picker | ✗ | from sales/AR team | auto by reasonCode |
| attachments | file upload | conditional | required if reasonCode.requiresEvidence | multiple, 10MB each |
| notifyCustomer | toggle | ✗ | — | sends ack email |

### Form D: Resolve Dispute
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| caseId | hidden | ✓ | status not RESOLVED |
| resolution | radio | ✓ | enum 5 values |
| resolutionAmount | money | conditional | required if PARTIAL_CREDIT |
| resolutionNotes | textarea | ✓ | min 50 |
| customerSatisfactionScore | rating 1-5 | ✗ | — |
| createCreditNote | toggle | conditional | default true if ACCEPT/PARTIAL |
| notifyCustomer | toggle | ✓ | default true |
| supervisorApproval | password | conditional | required if amount > threshold |

### Form E: Promise to Pay
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| openItemId | hidden | ✓ | — |
| customerId | autocomplete | ✓ | — |
| promisedAmount | money | ✓ | > 0, <= openAmount |
| promisedDate | datepicker | ✓ | > today, <= today + 90 |
| communicationMethod | dropdown | ✓ | PHONE/EMAIL/MEETING/SMS/WHATSAPP |
| spokeToContact | text | ✓ | name + role |
| notes | textarea | ✓ | min 20 |
| reminderDate | datepicker | ✗ | < promisedDate |
| escalateIfBroken | toggle | ✗ | default true |

### Form F: Reverse Application
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| applicationId | hidden | ✓ | not already reversed |
| reason | dropdown | ✓ | enum (Wrong Invoice, Customer Refund, Bank Reversal, Mistake) |
| description | textarea | ✓ | min 30 |
| approvedByPassword | password | conditional | if amount > 10K |

### Form G: Write-off as Bad Debt
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| openItemId | hidden | ✓ | age > 6 months recommended |
| amount | money | ✓ | <= openAmount |
| reason | dropdown | ✓ | Bankruptcy/Uncollectible/Customer Closed/Other |
| description | textarea | ✓ | min 50 |
| evidenceFiles | file upload | ✓ | required (court docs, etc) |
| managerApproval | password | ✓ | role >= manager |
| createProvisionFirst | checkbox | ✗ | book provision before writeoff |

---

## 6. Tables & Columns

### Grid A: Open Items (`/accounting/open-items`)
| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|-----------|-------|
| Doc # | link | ✓ | search | 120px |
| Type | badge | ✓ | dropdown | 100px |
| Date | date | ✓ | date range | 110px |
| Due | date | ✓ desc | date range | 110px |
| Days Overdue | number | ✓ | range | 100px (color coded) |
| Customer/Vendor | link | ✓ | search | 200px |
| Currency | code | ✓ | dropdown | 80px |
| Original Amount | money | ✓ | range | 130px |
| Open Amount (orig) | money | ✓ | — | 130px |
| Open Amount (SAR) | money | ✓ | — | 130px |
| Disputed | money | ✓ | toggle has-dispute | 100px (red) |
| Status | badge | ✓ | dropdown | 110px |
| Risk | badge | ✓ | dropdown | 80px |
| Dunning Level | badge | ✓ | dropdown | 100px |
| Promise | date + ✓/✗ | ✓ | toggle | 110px |
| Last Reminder | date | ✓ | date range | 110px |
| Actions | dropdown | — | — | 60px |

### Grid B: Aging Report
| Column | Type | Width |
|--------|------|-------|
| Customer | link | 220px |
| Currency | code | 80px |
| Current | money | 110px |
| 1-15 | money | 100px |
| 16-30 | money | 100px |
| 31-45 | money | 100px |
| 46-60 | money | 100px |
| 61-90 | money | 100px |
| 91-120 | money | 100px |
| 121-180 | money | 100px |
| >180 | money | 100px |
| Disputed | money | 110px |
| Total Open | money | 130px |
| Credit Limit | money | 130px |
| Utilization % | progress | 110px |
| DSO | days | 80px |
| Risk Score | badge | 90px |
| Actions | buttons | 120px |

### Grid C: Cash Application Workspace
- Two-pane: Payments (left) | Invoices (right)
- Drag-drop allocation
- Live totals + remaining
- Validation badges (amount mismatch, FX impact, discount window)

### Grid D: Disputes (`/accounting/disputes`)
| Column | Width | Sortable | Filterable |
|--------|-------|----------|-----------|
| Case # | 120px | ✓ | search |
| Customer | 200px | ✓ | search |
| Doc # | 120px | — | search |
| Amount | 130px | ✓ | range |
| Reason | 180px | ✓ | dropdown grouped |
| Severity | 100px | ✓ | dropdown |
| Priority | 100px | ✓ | dropdown |
| Status | 130px | ✓ | dropdown |
| Days Open | 100px | ✓ | range |
| Assigned To | 150px | ✓ | search |
| Expected Res | 110px | ✓ | date range |
| Last Activity | 130px | ✓ | date range |
| Actions | 100px | — | — |

### Grid E: Applications History
| Column | Width |
|--------|-------|
| App ID | 80 |
| Date | 130 |
| Payment Doc | 130 |
| Invoice Doc | 130 |
| Customer | 180 |
| Amount Applied | 130 |
| Currency | 80 |
| FX G/L | 100 |
| Discount | 100 |
| Writeoff | 100 |
| Strategy | 110 |
| Applied By | 130 |
| JE Link | 80 |
| Status | 110 |
| Actions: [Reverse] | 100 |

### Grid F: Promise-to-Pay Tracker
| Column | Width |
|--------|-------|
| Customer | 200 |
| Doc # | 120 |
| Promised Amount | 130 |
| Promised Date | 110 |
| Days to Promise | 100 |
| Status | 110 |
| Spoken To | 150 |
| Recorded By | 130 |
| Actions: [Mark Kept] [Mark Broken] | 200 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Confirmation | الصلاحية |
|----|------|--------|-------|--------------|----------|
| btn-apply-payment | تطبيق دفعة | open items list | 🟦 | ✗ | role.ar |
| btn-auto-apply | Auto-Apply | payment row | 🟢 | strategy + preview | role.ar |
| btn-bulk-auto-apply | Auto-Apply الكل | payments list | 🟢 | ⚠ count | role.ar_supervisor |
| btn-mark-disputed | وضع نزاع | invoice row | 🟡 | + form | role.ar OR role.sales |
| btn-resolve-dispute | حل النزاع | dispute card | 🟢 | + form | assignee or manager |
| btn-escalate-dispute | تصعيد | dispute card | 🟡 | + reason + level | assignee |
| btn-add-dispute-comm | إضافة تواصل | dispute card | ⬜ | ✗ | participant |
| btn-promise-pay | تسجيل وعد بالدفع | open item | 🟡 | + form | role.ar |
| btn-mark-kept | تم الوفاء | promise row | 🟢 | ✗ | recorder |
| btn-mark-broken | لم يفِ | promise row | 🔴 | + escalate? | recorder |
| btn-reverse-app | عكس التطبيق | application row | 🔴 | + reason + password (if >10K) | role.ar_supervisor |
| btn-writeoff | شطب كدين معدوم | open item | 🔴 | + form + manager pwd | role.ar_manager |
| btn-snooze | تأجيل dunning | open item | 🟡 | + days + reason | role.ar |
| btn-block-collection | إيقاف التحصيل | open item | 🔴 | + reason | role.ar_manager |
| btn-unblock-collection | استئناف التحصيل | open item | 🟢 | + reason | role.ar_manager |
| btn-export-aging | تصدير الأعمار | aging page | ⬜ | format selector | role.ar |
| btn-recalc-credit-score | إعادة حساب الـ Score | customer card | ⬜ | ✗ | role.credit_manager |
| btn-export-applications | تصدير | apps history | ⬜ | ✗ | role.ar |
| btn-cancel-promise | إلغاء الوعد | promise row | 🔴 | + reason | recorder |
| btn-litigate | تحويل قانوني | dispute card | 🔴 | ⚠ + manager + legal | role.ar_manager + role.legal |
| btn-add-deduction-reason | + سبب جديد | settings | 🟢 | ✗ | role.admin |
| btn-edit-writeoff-policy | تعديل سياسة الشطب | settings | ⬜ | ✗ | role.cfo |
| btn-bulk-snooze | تأجيل مجموعة | aging page | 🟡 | + count + reason | role.ar_supervisor |
| btn-customer-statement | كشف حساب | customer card | 🟦 | ✗ | role.ar |
| btn-send-reminder | إرسال تذكير | open item | 🟦 | + template selector | role.ar |
| btn-attach-evidence | إرفاق دليل | dispute card | ⬜ | ✗ | participant |
| btn-print-dispute-letter | طباعة خطاب النزاع | dispute card | ⬜ | ✗ | role.ar |

---

## 8. Search & Filters

### Open Items Filters:
- Customer/Vendor (autocomplete multi)
- Currency (multi)
- Document type (invoice/credit note/payment/advance)
- Status (multi)
- Aging bucket (multi)
- Date range (doc / due / both)
- Amount range
- Has dispute (toggle)
- Has promise (toggle)
- Risk level (multi)
- Branch (multi)
- Sales rep (multi)
- Has overdue interest (toggle)
- Assigned to (user)

### Saved searches:
- "My customers (overdue >60d)"
- "All disputes pending my action"
- "FX exposure"
- "Promises broken last 7d"
- "Bad debt candidates"

---

## 9. Reports & Exports

| التقرير | الحقول | تنسيقات |
|---------|--------|----------|
| AR Aging Detail | per customer per invoice | Excel/PDF |
| AR Aging Summary | per customer rollup | Excel/PDF |
| Cash Application Audit | full apps history | Excel/CSV |
| Dispute Analysis | by reason, by customer, by aging | Excel/PDF |
| Top 20 Overdue Customers | balance + DSO + score | PDF/Excel |
| FX Gain/Loss Report | per currency, per period | Excel |
| Discount Captured vs Forfeited | savings analysis | Excel |
| Writeoff Report | period writeoffs + recoveries | Excel/PDF |
| Promise-to-Pay Effectiveness | kept vs broken | PDF |
| Credit Score Distribution | histogram + outliers | PDF |
| Cash Forecast (AR-based) | expected receipts | Excel |
| Customer Payment Pattern | per customer history | PDF |

---

## 10. Dashboards & Widgets

### `/accounting/ar/dashboard`

**Widget 1: AR Balance Evolution** — line chart, last 12 months
**Widget 2: Aging Pyramid** — stacked bars
**Widget 3: DSO Trend** — line chart with target line
**Widget 4: Top 10 Overdue** — table + drill
**Widget 5: Disputes Pending** — counter + breakdown by severity
**Widget 6: Cash Collected (today/week/month)** — KPIs
**Widget 7: FX Exposure** — by currency pie
**Widget 8: Credit Limit Utilization** — sortable list with red highlights
**Widget 9: Promise Performance** — % kept vs broken
**Widget 10: Bad Debt Trend** — area chart

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Payment received & applied | email | customer (with receipt) |
| Dispute raised | email + in-app | assignee + manager |
| Dispute escalated | email + Slack | escalation target |
| Dispute aging > 30d | in-app banner | assignee |
| Promise to pay due tomorrow | in-app | recorder |
| Promise broken | email + in-app | recorder + manager |
| Credit score dropped >20% | email + in-app | credit manager + sales rep |
| Customer reached credit limit | email + sales blocked | sales manager |
| Large writeoff approved | email | CFO |
| FX gain/loss > threshold | in-app | controller |
| Discount window closes today | in-app | AR team |

---

## 12. Permissions Matrix

| Action | AR Clerk | AR Supervisor | AR Manager | Sales | Credit Mgr | CFO |
|--------|----------|---------------|-----------|-------|-----------|-----|
| View open items | ✓ | ✓ | ✓ | ✓ own | ✓ | ✓ |
| Apply payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Auto-apply | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Reverse application | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Mark disputed | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Resolve dispute (small) | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Resolve dispute (large) | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Escalate to legal | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Promise to pay | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Snooze | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Block collection | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Writeoff | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Edit policies | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| View reports | ✓ R | ✓ | ✓ | ✓ own | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| HighRadius / Billtrust | external cash application AI |
| ExchangeRates API | live FX rates |
| Bank statement importer | auto-create payment open items |
| Email service | send reminders + statements |
| WhatsApp Business | reminders to customers |
| Credit bureau (SIMAH) | external credit data |
| Legal case management (if external) | sync litigation status |
| Customer portal B2B | self-service dispute raise |
| BI tool (Power BI / Tableau) | analytics export |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Apply Payment quick |
| `Ctrl+D` | Mark Disputed |
| `A` then `A` | Auto-apply current row |
| `→` `←` | Navigate rows |
| `Space` | Select row |
| `Ctrl+E` | Export current view |
| `?` | Help |

---

## 15. Mobile / Print

### Mobile:
- Card layout instead of grid
- Quick actions: Apply, Dispute, Promise (FAB)
- Camera upload for dispute evidence
- Voice note attachment

### Print:
- AR Aging printable
- Dispute letters (legal templates)
- Customer statements
- Internal review forms

---

## 16. Audit & Logging

كل عملية → AuditLog:
- before/after openAmount
- FX rates used
- approval chain
- evidence uploads (with hash)

Cron daily:
- recalculate aging buckets
- recalculate credit scores
- check broken promises
- detect anomalies (patterns)

---

## 17. Test Cases

```typescript
describe('Multi-currency Application', () => {
  test('same-currency exact match')
  test('cross-currency match with FX gain')
  test('cross-currency match with FX loss')
  test('FX rate missing → error')
  test('historical rate vs current rate')
  test('multi-leg currency conversion')
})

describe('Discount Window', () => {
  test('within window applies discount')
  test('outside window no discount')
  test('partial payment within window')
  test('discount + writeoff combined')
})

describe('Dispute Workflow', () => {
  test('partial dispute reduces dunnable amount')
  test('escalation chain')
  test('resolve with credit note')
  test('resolve with writeoff')
  test('multiple disputes on same invoice')
  test('attachments preserved')
})

describe('Promise to Pay', () => {
  test('skips dunning until promise date')
  test('escalates on broken promise')
  test('marks kept on payment')
})

describe('Tolerance / Auto-writeoff', () => {
  test('under threshold auto-writeoffs')
  test('over threshold queues')
  test('per-customer policy override')
})

describe('Reverse Application', () => {
  test('restores openAmounts')
  test('creates reversal JE')
  test('cannot reverse already-reversed')
})

describe('Aging', () => {
  test('correct bucket calculation')
  test('disputed amounts separated')
  test('multi-currency consolidated to SAR')
  test('DSO calculation correct')
})

describe('Credit Score', () => {
  test('factors weighted correctly')
  test('history retained')
  test('alert on >20% drop')
})

describe('Bulk operations', () => {
  test('bulk auto-apply 100 payments')
  test('bulk snooze')
  test('bulk reminder send')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| دفع أكبر من الفاتورة | overpayment → unapplied cash |
| دفع بعملة مختلفة عن العميل | cross-currency match |
| dispute > openAmount | reject (data integrity) |
| تطبيق على فاتورة مدفوعة | reject |
| FX rate تغير بين preview و apply | re-fetch + warn |
| العميل أفلس فجأة | mass writeoff workflow |
| dispute مفتوحة + payment وارد | apply only to undisputed portion |
| credit note > openAmount | residual stays as credit balance |
| reversal بعد period close | reject — needs reopen |
| concurrent application same payment | optimistic lock + retry |
| customer merge (consolidate accounts) | move open items |
| currency redenomination | convert all open items |
| invoice cancelled أثناء dispute | dispute auto-closed |
| promise date في الماضي | reject |
| writeoff لعميل لاحقاً سدد | recovery JE |
| FX revaluation أثناء open balance | unrealized → realized on settlement |

---

**نهاية مواصفات النقص #3**

> 10 سيناريوهات • 8 جداول schema • 7 forms • 6 grids • 27 button • 10 widgets • 11 notifications • 12 reports
