# النقص #5: Dunning Automation كامل — مواصفات تفصيلية

> **المرجعيات:** SAP F150 / FCH4، Oracle Collections Cloud، NetSuite Collections، HighRadius Collections AI، Sidetrade、Esker
> **معايير:** FDCPA-aligned (US)، KSA Civil Code، KSA Commercial Court Law

---

## 1. البرومنت الكامل

```
ابني نظام Dunning كامل بمستوى SAP Collections Management:

ملفات موجودة:
- src/lib/dunning-engine.ts (basic level detection only)
- prisma models: DunningLevel, DunningLetter

المتطلبات:

A) Schema Extensions:
   - DunningLevel: + templateHtml/Pdf/Email/SMS/WhatsApp variants
     + lateFeeFormula, interestRateMonthly, blockCustomer flag
     + legalAction flag, escalateToCollectionsAgency flag
     + autoRunEnabled, manualReviewRequired
   - DunningLetter: + pdfUrl, emailMessageId, whatsappMessageId
     + lateFeeAmount, interestAmount, lateFeeJournalId
     + snoozedUntil, snoozedReason, snoozedByUserId
     + customerResponseAt, customerResponse
   - DunningCampaign: grouping multiple letters in a run
   - DunningCommunication: per channel detail
   - PromiseToPay: separate model with workflow
   - CollectionAgency: external agencies registry
   - CollectionAssignment: cases sent to agencies
   - CustomerCreditAction: history of holds/releases

B) Engine الكامل:
   1. Daily Cron Engine:
      - executeDailyRun(date)
      - getOverdueOpenItems (excluding disputed/snoozed/promised)
      - calculateLevels (based on daysOverdue + customer history)
      - generateLetters (HTML/PDF)
      - sendCommunications (email/WhatsApp/SMS)
      - postLateFees + interest JEs
      - blockCustomers as needed
      - notifyCollectors of escalations
   
   2. Smart Collection Strategies:
      - by customer segment (VIP, Regular, Risky)
      - by amount band (small/medium/large)
      - by aging bucket
      - by industry
      - cultural (gentle for first dunning, firmer later)
   
   3. Multi-channel Delivery:
      - Email (primary, with PDF attachment)
      - WhatsApp Business (text + PDF link)
      - SMS (link to portal)
      - Phone call task (assigned to collector)
      - Physical mail (printed letter ready)
   
   4. Workflow Automation:
      - level escalation
      - assignment to collector
      - call task creation
      - approval for legal action
      - collection agency handoff
   
   5. Promise-to-Pay Tracker:
      - record promise with date + amount
      - block dunning until promise date
      - on promise date: check payment
      - if not paid: jump 2 levels
   
   6. Effectiveness Analytics:
      - DSO before/after dunning
      - collection rate per level
      - response time analysis
      - best channel per customer

C) APIs (32 endpoints): انظر القسم 7

D) UI (10 pages): انظر القسم 5-7

E) Tests: 35+ unit, 12 integration, 4 E2E
```

---

## 2. السيناريوهات (8)

### A — Daily Cron Run
```
8:00 ص يومياً:
1. Cron يبدأ
2. fetch overdue open items (excluding: disputed=true، snoozed، promise active)
3. group by customer
4. لكل عميل:
   - فحص أعلى days overdue
   - تحديد المستوى المناسب (1-4)
   - فحص: هل letter سابق بنفس المستوى أُرسل قبل X أيام؟
   - if جديد:
     - generate PDF
     - send email
     - send WhatsApp (if configured)
     - if level 3+: post late fee JE
     - if level 4: block customer
5. summary email للـ AR Manager
```

### B — Promise to Pay
```
1. Collector يتصل بعميل overdue 35 يوم
2. العميل يعد بالدفع 15/5
3. Collector يفتح /accounting/customers/123/dunning
4. [+ تسجيل وعد بالدفع]:
   - amount: 50,000
   - date: 15/5
   - communicated by: phone
   - notes: "اتصلت بـ المدير المالي"
5. النظام:
   - PromiseToPay created (status=ACTIVE)
   - Customer.dunningSnoozeUntil = 16/5
   - dunning يتجاوزه
6. في 14/5: reminder للـ collector "وعد غداً — تابع"
7. في 16/5:
   - if paid → mark KEPT + close
   - if not → mark BROKEN + escalate level
```

### C — Customer Block
```
- عميل وصل Level 4 (90 يوم تأخير)
- النظام تلقائياً:
  - Customer.creditHold = true
  - Customer.creditHoldReason = "DUNNING_LEVEL_4"
  - Sales يحاول إصدار فاتورة جديدة → blocked
  - يحتاج موافقة AR Manager + CFO
- بعد سداد كامل المتأخرات:
  - manual: Manager يضغط [رفع الحظر]
  - or auto: لو Settings.autoUnblockOnFullPayment = true
```

### D — Legal Escalation
```
- عميل overdue 120 يوم، 3 محاولات dunning فاشلة
- Manager يضغط [تحويل قانوني]:
  - يختار اللائحة القانونية
  - يحدد المبلغ المتنازع عليه
  - يرفع المستندات
  - يضيف وكيل قانوني
- النظام:
  - LegalCase created
  - Customer.legalActionInProgress = true
  - يولّد letter قانونية رسمية
  - يرسل عبر مكتب البريد المسجل
  - يخصم 15% خاص للقيمة (litigation provision)
```

### E — Send to Collection Agency
```
- شركة سعودية تتعاقد مع وكالة تحصيل
- العميل overdue 180+ يوم
- AR Manager: [تحويل لوكالة تحصيل]
- يختار الوكالة: "Saudi Collection Co"
- يحدد commission %: 30%
- النظام:
  - CollectionAssignment created
  - يرسل بيانات العميل + الفواتير لـ API الوكالة
  - يتابع status webhooks
  - عند التحصيل: عمولة 30% expense + الباقي إيراد
```

### F — Snooze بسبب ظرف خاص
```
- عميل عميل قديم (5 سنوات)، تأخر بسبب ظرف صحي
- AR Manager يضغط [Snooze لـ 60 يوم]
- يدخل سبب: "ظرف صحي للمالك"
- النظام:
  - dunning يتوقف 60 يوم
  - بعد 60 يوم: dunning يستأنف من المستوى السابق
  - audit log
```

### G — Customer Response
```
- العميل يستلم email dunning
- يضغط على [الرد على هذا الإشعار] في الإيميل
- ينقله لـ portal مع form:
  - "أعتذر، سأدفع نهاية الأسبوع"
  - أو: "هذه الفاتورة خطأ — أريد نزاعاً"
  - أو: upload payment receipt
- النظام:
  - يسجل الـ response في DunningCommunication
  - تنبيه للـ collector
  - if dispute → فتح dispute case تلقائي
```

### H — A/B Testing Templates
```
- AR Manager يجرب 2 قوالب لـ Level 2:
  - A: "تذكير ودي" (نسبة استجابة سابقة 35%)
  - B: "تذكير عاجل" (جديد)
- يحدد: 50% عملاء A، 50% B
- بعد شهر: يقارن النتائج → الأفضل يصبح default
```

---

## 3. تدفق البيانات

```
[Daily Cron 8AM]
   ↓
DunningEngine.executeDailyRun()
   ↓
fetchEligibleItems():
   SELECT openItem WHERE
     status IN ('OPEN', 'PARTIAL') AND
     dueDate < today AND
     disputeStatus != 'ACTIVE' AND
     (snoozedUntil IS NULL OR snoozedUntil < today) AND
     (promiseToPayDate IS NULL OR promiseToPayDate < today AND promiseStatus = 'BROKEN')
   GROUP BY customerId
   ↓
for each customer:
   maxOverdue = MAX(daysOverdue)
   targetLevel = determineLevel(maxOverdue, customer.segment, customer.history)
   currentLevel = lastDunningLevel
   ↓
   if targetLevel > currentLevel:
     campaign = createDunningCampaign(customerId, targetLevel)
     letter = generateDunningLetter(customer, items, level=targetLevel, campaign)
     pdf = renderPdf(letter)
     ↓
     for each enabled channel:
       if EMAIL → send via SendGrid → log
       if WHATSAPP → send via WhatsApp Biz → log
       if SMS → send via Twilio → log
       if PHONE → create CollectorTask
     ↓
     if level >= 3:
       lateFee = calculateLateFee(items, level)
       interest = calculateInterest(items, daysOverdue)
       postFeeJournal(customerId, lateFee + interest)
     ↓
     if level == 4:
       Customer.creditHold = true
       Customer.creditHoldReason = 'DUNNING_LVL_4'
       notifyCFO()
     ↓
     update Customer.dunningCurrentLevel
     update OpenItem.dunningLevel + lastReminderSentAt
   ↓
endfor
   ↓
generateSummaryReport() → email to AR Manager

[Promise to Pay]
POST /dunning/promise-to-pay
   { customerId, openItemIds, amount, date, channel, notes }
   ↓
   create PromiseToPay (status=ACTIVE)
   update customer.dunningSnoozeUntil = date + 1
   notify collector
   schedule reminder 1 day before
   ↓
[On Promise Date Cron]
   foreach active promise:
     if promiseDate == today:
       check if payment received >= promiseAmount
       if YES → status=KEPT
       if NO  → status=BROKEN → trigger immediate dunning escalation

[Customer Response Webhook]
POST /webhooks/dunning/response { token }
   ↓
   parse token → customer + letter
   show response form
   on submit:
     - record DunningCommunication (direction=INBOUND)
     - notify collector
     - if dispute opened → create DisputeCase
     - if payment uploaded → manual review queue
```

---

## 4. Prisma Schema

```prisma
model DunningLevel {
  id                      Int       @id @default(autoincrement())
  levelNumber             Int       @unique  // 1, 2, 3, 4
  nameAr                  String
  nameEn                  String
  description             String?
  
  // Triggers
  daysOverdue             Int       // minimum days
  minOpenAmount           Decimal?  @db.Decimal(20,4)
  customerSegments        String[]  // applies to which segments
  
  // Templates
  templateHtmlAr          String    @db.Text
  templateHtmlEn          String?   @db.Text
  emailSubjectAr          String
  emailSubjectEn          String?
  emailBodyAr             String    @db.Text
  emailBodyEn             String?   @db.Text
  whatsappTemplateName    String?   // pre-approved by Meta
  smsTemplate             String?
  
  // Fees & Interest
  lateFeeAmount           Decimal?  @db.Decimal(10,2)
  lateFeeFormula          String?   // 'FLAT' | 'PERCENT' | 'TIERED'
  lateFeePercent          Decimal?  @db.Decimal(5,2)
  interestRateMonthly     Decimal?  @db.Decimal(5,4)  // per month
  feeAccountId            Int?
  interestAccountId       Int?
  
  // Actions
  blockCustomer           Boolean   @default(false)
  legalAction             Boolean   @default(false)
  escalateToAgency        Boolean   @default(false)
  
  // Channels
  sendEmail               Boolean   @default(true)
  sendWhatsApp            Boolean   @default(false)
  sendSms                 Boolean   @default(false)
  createCallTask          Boolean   @default(false)
  
  // Workflow
  autoRunEnabled          Boolean   @default(true)
  manualReviewRequired    Boolean   @default(false)
  approvalRoleRequired    String?   // 'AR_MANAGER' | 'CFO'
  
  // A/B testing
  abTestVariantId         Int?
  
  active                  Boolean   @default(true)
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  letters                 DunningLetter[]
  
  @@index([levelNumber, active])
}

model DunningCampaign {
  id                      Int       @id @default(autoincrement())
  campaignNumber          String    @unique
  customerId              Int
  customer                Customer  @relation(fields: [customerId], references: [id])
  startedAt               DateTime  @default(now())
  endedAt                 DateTime?
  status                  String    @default("ACTIVE")  // ACTIVE | PAUSED | COMPLETED | CANCELLED
  totalAmountAtStart      Decimal   @db.Decimal(20,4)
  amountCollected         Decimal   @default(0) @db.Decimal(20,4)
  letters                 DunningLetter[]
  triggeredBy             String    // 'CRON' | 'MANUAL' | 'API'
  
  @@index([customerId, status])
}

model DunningLetter {
  id                      Int       @id @default(autoincrement())
  letterNumber            String    @unique
  campaignId              Int
  campaign                DunningCampaign @relation(fields: [campaignId], references: [id])
  customerId              Int
  customer                Customer  @relation(fields: [customerId], references: [id])
  levelId                 Int
  level                   DunningLevel @relation(fields: [levelId], references: [id])
  
  invoiceIds              Int[]     // open items covered
  totalAmountDue          Decimal   @db.Decimal(20,4)
  oldestDueDate           DateTime
  daysOverdue             Int
  
  pdfUrl                  String?
  pdfHash                 String?
  
  // Fees applied
  lateFeeAmount           Decimal?  @db.Decimal(10,2)
  interestAmount          Decimal?  @db.Decimal(10,2)
  lateFeeJournalId        Int?
  
  // Customer response
  customerResponseAt      DateTime?
  customerResponse        String?   @db.Text
  customerResponseChannel String?
  
  // Workflow
  status                  String    @default("GENERATED")  // GENERATED | SENT | DELIVERED | OPENED | RESPONDED | RESOLVED
  snoozedUntil            DateTime?
  snoozedReason           String?
  snoozedByUserId         String?
  
  generatedAt             DateTime  @default(now())
  
  communications          DunningCommunication[]
  
  @@index([customerId, status])
  @@index([levelId, generatedAt])
  @@index([campaignId])
}

model DunningCommunication {
  id                  Int             @id @default(autoincrement())
  letterId            Int
  letter              DunningLetter   @relation(fields: [letterId], references: [id])
  channel             String          // 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PHONE_CALL' | 'PHYSICAL_MAIL' | 'PORTAL'
  direction           String          @default("OUTBOUND")  // OUTBOUND | INBOUND
  sentAt              DateTime        @default(now())
  recipientAddress    String
  status              String          // 'SENT' | 'DELIVERED' | 'READ' | 'OPENED' | 'BOUNCED' | 'FAILED'
  externalMessageId   String?
  errorMessage        String?
  responseReceived    String?         @db.Text
  responseReceivedAt  DateTime?
  spokeWith           String?         // for phone calls
  callDurationSeconds Int?
  callOutcome         String?         // 'PROMISE' | 'DISPUTE' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'PAYMENT_CONFIRMED'
  
  @@index([letterId, channel])
  @@index([sentAt])
}

model PromiseToPay {
  id                  Int       @id @default(autoincrement())
  customerId          Int
  customer            Customer  @relation(fields: [customerId], references: [id])
  openItemIds         Int[]
  promisedAmount      Decimal   @db.Decimal(20,4)
  promisedDate        DateTime
  status              String    @default("ACTIVE")  // ACTIVE | KEPT | BROKEN | CANCELLED
  recordedByUserId    String
  recordedAt          DateTime  @default(now())
  channel             String    // 'PHONE' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'PORTAL'
  spokeTo             String?
  notes               String?   @db.Text
  reminderDate        DateTime?
  reminderSent        Boolean   @default(false)
  outcomeNotes        String?
  outcomeRecordedAt   DateTime?
  outcomeRecordedByUserId String?
  
  @@index([customerId, status])
  @@index([promisedDate, status])
}

model CollectionAgency {
  id                  Int       @id @default(autoincrement())
  name                String
  contactPerson       String?
  contactEmail        String?
  contactPhone        String?
  commissionPercent   Decimal   @db.Decimal(5,2)
  apiEndpoint         String?
  apiKey              String?   // encrypted
  active              Boolean   @default(true)
  performanceScore    Decimal?  @db.Decimal(5,2)
  totalAssignedCount  Int       @default(0)
  totalCollected      Decimal   @default(0) @db.Decimal(20,4)
  totalCommissionPaid Decimal   @default(0) @db.Decimal(20,4)
  assignments         CollectionAssignment[]
}

model CollectionAssignment {
  id                  Int       @id @default(autoincrement())
  agencyId            Int
  agency              CollectionAgency @relation(fields: [agencyId], references: [id])
  customerId          Int
  customer            Customer  @relation(fields: [customerId], references: [id])
  assignedAt          DateTime  @default(now())
  assignedByUserId    String
  amountAssigned      Decimal   @db.Decimal(20,4)
  invoiceIds          Int[]
  status              String    @default("ASSIGNED")  // ASSIGNED | IN_PROGRESS | COLLECTED | FAILED | RETURNED
  collectedAmount     Decimal   @default(0) @db.Decimal(20,4)
  commissionAmount    Decimal?  @db.Decimal(20,4)
  closedAt            DateTime?
  notes               String?   @db.Text
  
  @@index([agencyId, status])
  @@index([customerId])
}

model Customer {
  // ... existing
  
  // Dunning state
  dunningCurrentLevel     Int       @default(0)
  dunningLastRunAt        DateTime?
  dunningSnoozeUntil      DateTime?
  dunningSnoozeReason     String?
  dunningSnoozedByUserId  String?
  dunningPaused           Boolean   @default(false)
  dunningPauseReason      String?
  
  // Credit hold
  creditHold              Boolean   @default(false)
  creditHoldReason        String?
  creditHoldDate          DateTime?
  creditHoldByUserId      String?
  creditHoldExpiresAt     DateTime?
  
  // Legal action
  legalActionInProgress   Boolean   @default(false)
  legalCaseId             Int?
  
  // Collection agency
  inCollectionAgency      Boolean   @default(false)
  
  // Communication preferences for dunning
  dunningPreferredChannel String    @default("EMAIL")
  dunningOptOutChannels   String[]  // ['SMS', 'WHATSAPP']
  
  // History
  promisesToPay           PromiseToPay[]
  campaigns               DunningCampaign[]
  letters                 DunningLetter[]
  collectionAssignments   CollectionAssignment[]
  creditActions           CustomerCreditAction[]
}

model CustomerCreditAction {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  action          String    // 'HOLD' | 'RELEASE' | 'REDUCE_LIMIT' | 'INCREASE_LIMIT'
  reason          String
  performedAt     DateTime  @default(now())
  performedByUserId String
  approvedByUserId String?
  oldValue        Json?
  newValue        Json?
  
  @@index([customerId, performedAt])
}
```

---

## 5. Forms & Fields

### Form A: Manual Dunning Run
| Field | Type | Required | Default |
|-------|------|----------|---------|
| customerIds | multi-select | ✗ (or filterCriteria) | — |
| filterCriteria | composite | ✗ | — |
| forceLevel | dropdown | ✗ | auto |
| skipChannels | checkboxes | ✗ | none |
| dryRun | toggle | ✗ | false |

### Form B: Promise to Pay
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| customerId | autocomplete | ✓ | — |
| openItemIds | multi-select | ✓ | min 1 |
| promisedAmount | money | ✓ | > 0 |
| promisedDate | datepicker | ✓ | > today, < today+90 |
| channel | dropdown | ✓ | enum |
| spokeTo | text | conditional | required if PHONE/MEETING |
| notes | textarea | ✓ | min 20 |
| reminderDate | datepicker | ✗ | < promisedDate |
| escalateOnBreak | toggle | ✗ | true |

### Form C: Credit Hold Override (Sales)
| Field | Type | Required |
|-------|------|----------|
| customerId | hidden | ✓ |
| reason | textarea | ✓ min 50 |
| approvedByCFO | password | ✓ |
| validFor | dropdown | ✓ Single Invoice/24h/7d |

### Form D: Snooze Dunning
| Field | Type | Required |
|-------|------|----------|
| customerId | hidden | ✓ |
| snoozeDays | number | ✓ 1-90 |
| reason | textarea | ✓ min 30 |
| categoryReason | dropdown | ✓ Health/Family/Business/Negotiation/Other |

### Form E: Send to Collection Agency
| Field | Type | Required |
|-------|------|----------|
| customerId | hidden | ✓ |
| agencyId | dropdown | ✓ |
| invoiceIds | multi-select | ✓ |
| commissionOverride | money | ✗ |
| supportingDocs | file upload | ✓ |
| managerApproval | password | ✓ |

### Form F: Legal Escalation
| Field | Type | Required |
|-------|------|----------|
| customerId | hidden | ✓ |
| invoiceIds | multi-select | ✓ |
| lawFirmId | dropdown | ✓ |
| caseType | dropdown | ✓ |
| evidence | file upload | ✓ multiple |
| courtJurisdiction | dropdown | ✓ |
| estimatedFees | money | ✓ |
| boardApproval | conditional | required if amount > threshold |

### Form G: Template Editor
| Field | Type | Required |
|-------|------|----------|
| levelNumber | hidden | ✓ |
| nameAr/En | text | ✓ |
| daysOverdue | number | ✓ |
| customerSegments | multi | ✗ |
| templateHtmlAr | rich text | ✓ |
| emailSubjectAr | text | ✓ |
| emailBodyAr | rich text | ✓ |
| whatsappTemplateName | dropdown | conditional |
| lateFeeAmount | money | ✗ |
| interestRateMonthly | percent | ✗ |
| blockCustomer | toggle | ✗ |
| sendChannels | checkboxes | ✓ |
| autoRunEnabled | toggle | ✓ |

---

## 6. Tables & Columns

### Grid A: Dunning Dashboard (`/accounting/dunning/dashboard`)
- KPI Tiles: Total Overdue / DSO / Letters Today / Promises Active / Customers Blocked / Collection Rate

### Grid B: Letters History
| Column | Width |
|--------|-------|
| Letter # | 130 |
| Customer | 200 |
| Level | 100 |
| Days Overdue | 110 |
| Amount Due | 130 |
| Late Fee | 100 |
| Generated | datetime | 150 |
| Status | badge | 130 |
| Channels | icons | 130 |
| Read | toggle | 80 |
| Response | text | 150 |
| Actions: [View PDF] [Resend] [Snooze] | 200 |

### Grid C: Promises to Pay
| Column | Width |
|--------|-------|
| Promise # | 100 |
| Customer | 200 |
| Amount | 130 |
| Promised Date | 130 |
| Days to Date | 100 |
| Channel | 100 |
| Spoken To | 150 |
| Recorded By | 130 |
| Status | badge | 110 |
| Actions: [Mark Kept] [Mark Broken] [Edit] | 200 |

### Grid D: Customer Credit Holds
| Column | Width |
|--------|-------|
| Customer | 200 |
| Hold Date | 130 |
| Reason | 200 |
| Days Held | 100 |
| Outstanding | money | 130 |
| Held By | 130 |
| Approved By | 130 |
| Actions: [Release] [Override Sale] | 180 |

### Grid E: Collection Agency Cases
| Column | Width |
|--------|-------|
| Case # | 130 |
| Customer | 200 |
| Agency | 150 |
| Assigned Date | 130 |
| Amount Assigned | money | 130 |
| Collected | money | 130 |
| Commission | money | 110 |
| Net to Us | money | 130 |
| Status | badge | 130 |
| Actions: [View] [Recall] | 150 |

### Grid F: Effectiveness Report
| Column | Width |
|--------|-------|
| Period | 130 |
| Level | 100 |
| Letters Sent | 100 |
| Responses | 100 |
| Response Rate % | 110 |
| Promises Made | 100 |
| Promises Kept % | 110 |
| Amount Collected | money | 130 |
| Avg Days to Collect | 130 |
| Collection Rate % | progress | 130 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-dunning-run-now | تشغيل dunning الآن | dashboard | 🟦 | role.ar_supervisor |
| btn-dunning-run-customer | تشغيل لعميل | customer card | 🟦 | role.ar |
| btn-letter-view | عرض PDF | letter row | 🟦 | role.ar |
| btn-letter-resend | إعادة إرسال | letter row | ⬜ | role.ar |
| btn-letter-snooze | تأجيل | letter row | 🟡 | role.ar_supervisor |
| btn-letter-cancel | إلغاء | letter row | 🔴 | role.ar_manager |
| btn-promise-create | + وعد بالدفع | customer card | 🟡 | role.ar |
| btn-promise-mark-kept | تم الوفاء | promise row | 🟢 | recorder |
| btn-promise-mark-broken | لم يفِ | promise row | 🔴 | recorder |
| btn-promise-edit | تعديل | promise row | ⬜ | recorder |
| btn-promise-cancel | إلغاء | promise row | 🔴 | recorder OR manager |
| btn-snooze-dunning | تأجيل dunning | customer card | 🟡 | role.ar_supervisor |
| btn-resume-dunning | استئناف | customer card | 🟢 | role.ar_supervisor |
| btn-credit-hold | حظر الائتمان | customer card | 🔴 | role.ar_manager |
| btn-credit-release | رفع الحظر | customer card | 🟢 | role.ar_manager |
| btn-credit-override | السماح ببيع رغم الحظر | sales screen | 🟡 | role.cfo + password |
| btn-legal-escalate | تحويل قانوني | customer card | 🔴 | role.cfo + form |
| btn-agency-assign | تحويل لوكالة | customer card | 🟡 | role.ar_manager |
| btn-agency-recall | استرجاع من الوكالة | agency case | 🔴 | role.ar_manager |
| btn-template-edit | تعديل قالب | levels page | ⬜ | role.admin |
| btn-template-preview | معاينة | level row | ⬜ | role.admin |
| btn-template-test-send | إرسال اختبار | template editor | 🟡 | role.admin |
| btn-template-ab-test | بدء A/B test | template | 🟡 | role.admin |
| btn-export-letters | تصدير | letters | ⬜ | role.ar |
| btn-export-effectiveness | تصدير التقرير | report | ⬜ | role.ar |
| btn-call-task-create | + مهمة اتصال | letter | 🟡 | role.ar |
| btn-call-task-complete | إنهاء الاتصال | call task | 🟢 | assignee |
| btn-bulk-snooze | تأجيل مجموعة | letters list | 🟡 | role.ar_supervisor |
| btn-bulk-resend | إعادة إرسال مجموعة | letters list | ⬜ | role.ar_supervisor |
| btn-import-promise | استيراد وعود (Excel) | promises | ⬜ | role.ar |

---

## 8. Search & Filters

### Letters:
- Date range, Customer, Level, Status, Channel, Has response, Read/Unread, Has fees

### Promises:
- Status, Channel, Promised date range, Customer, Amount range, Recorder

### Holds:
- Held since (range), Reason category, Outstanding range, Released

### Effectiveness:
- Period, Level, Customer segment, Channel, Branch

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Daily Run Summary | اليومي |
| Effectiveness by Level | response/collection rate per level |
| DSO Trend | 12 months |
| Promise Performance | kept vs broken |
| Channel Effectiveness | which channel works best per segment |
| Top 50 Overdue | مع actions taken |
| Bad Debt Pipeline | المرشحون للشطب |
| Legal Cases Status | ongoing litigation |
| Agency Performance | per agency |
| Time to Resolution | average days |

---

## 10. Dashboards & Widgets

- KPIs: DSO, Total Overdue, Today's Letters, Open Promises, Held Customers, Collection Rate (MTD)
- Charts: DSO trend (line), Letters by Level (bar), Channel mix (pie), Response time (histogram), Promise outcomes (donut)
- Lists: Today's tasks (calls), Promises due tomorrow, Largest overdue, Recently broken promises

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Daily run complete | email | AR Manager |
| Letter generated | in-app | account manager |
| Customer responded | email + in-app | collector |
| Promise made | in-app | collector |
| Promise due tomorrow | in-app + email | collector |
| Promise broken | email + in-app | collector + manager |
| Credit hold triggered | email + Slack | sales team + CFO |
| Legal escalation | email + Slack | CFO + legal team |
| Agency assigned | email | agency contact |
| Agency collected | email | AR + accounting |
| Letter bounced | in-app | AR clerk |
| Snooze expiring | in-app | snoozer |

---

## 12. Permissions Matrix

| Action | Collector | AR Sup | AR Mgr | CFO | Sales |
|--------|-----------|--------|--------|-----|-------|
| Run daily | ✗ | ✓ | ✓ | ✓ | ✗ |
| Run for customer | ✓ | ✓ | ✓ | ✓ | ✗ |
| Snooze | ✗ | ✓ | ✓ | ✓ | ✗ |
| Credit hold | ✗ | ✗ | ✓ | ✓ | ✗ |
| Override hold | ✗ | ✗ | ✗ | ✓ | request |
| Promise to pay | ✓ | ✓ | ✓ | ✓ | ✓ |
| Legal escalate | ✗ | ✗ | ✗ | ✓ | ✗ |
| Agency assign | ✗ | ✗ | ✓ | ✓ | ✗ |
| Edit templates | ✗ | ✗ | ✗ | ✗ | ✗ (admin) |
| View reports | ✓ R | ✓ | ✓ | ✓ | ✗ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| WhatsApp Business API | letter delivery |
| Twilio | SMS + voice |
| SendGrid | email |
| Saudi Post (SPL) | physical mail tracking |
| Najiz / Court e-services | legal case filing (KSA) |
| SIMAH | credit bureau check |
| Collection Agency APIs | Gulf Collection, etc. |
| BullMQ | background queue |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Open dunning dashboard |
| `Ctrl+P` | New promise |
| `Ctrl+L` | View letters |
| `R` | Resend selected |
| `S` | Snooze selected |

---

## 15. Mobile / Print

- Mobile app for collectors: today's call list + dial buttons + record outcome
- Print: physical letter templates (Saudi Post compatible)

---

## 16. Audit & Logging

- Every letter generated/sent → AuditLog
- Every promise + outcome
- Every credit action (hold/release)
- Every override
- Every legal escalation
- Retention: 7 years

---

## 17. Test Cases

```typescript
describe('Daily Cron', () => {
  test('skips disputed open items')
  test('skips snoozed customers')
  test('skips active promises')
  test('correct level determination')
  test('escalates on broken promise')
  test('does not duplicate letter same level same day')
})

describe('Promise to Pay', () => {
  test('blocks dunning until promise date')
  test('escalates on broken')
  test('marks kept on payment received')
  test('multiple promises same customer')
})

describe('Credit Hold', () => {
  test('blocks new sales invoice')
  test('CFO override allowed')
  test('auto-release on full payment (config)')
})

describe('Legal Escalation', () => {
  test('creates LegalCase')
  test('books provision')
  test('blocks routine dunning')
})

describe('Templates', () => {
  test('renders Arabic RTL')
  test('merge tags substituted')
  test('A/B variant assignment')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| العميل دفع جزئياً ساعة الـ run | recompute level + skip if cleared |
| WhatsApp template not approved | fallback to email |
| Customer in legal action | skip dunning |
| Promise + dispute مفتوحة | dispute takes precedence |
| Bulk run timing out | resume from checkpoint |
| Email bounced (hard) | switch to WhatsApp/SMS |
| Customer changed contact info | use latest |
| Late fee > Open Amount | cap at Open Amount |
| Two collectors editing same customer | optimistic lock + conflict resolution |
| Holiday season auto-snooze | configurable per region |
| Snooze expires on weekend | wait for business day |
| Customer in different timezone | respect local business hours |

---

**نهاية مواصفات النقص #5**

> 8 سيناريوهات • 8 جداول schema • 7 forms • 6 grids • 30 button • 9 widgets • 12 notifications • 10 reports
