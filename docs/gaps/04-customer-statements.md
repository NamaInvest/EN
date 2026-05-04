# النقص #4: Customer Statements PDF + Email + Portal — مواصفات تفصيلية

> **المرجعيات:** SAP F.27 / FBL5N، Oracle AR Customer Statements، NetSuite Statements، QuickBooks، Xero、Sage Intacct
> **معايير:** GAAP/IFRS disclosure، VAT-compliant statement layouts (KSA ZATCA)

---

## 1. البرومنت الكامل

```
أنشئ نظام كشوف حساب عميل احترافي في Namasoft ERP:

ملفات موجودة:
- src/lib/customer-statement.ts (JSON only)
- src/app/api/portals/* (B2B portal exists)

المتطلبات:

A) Schema (جداول جديدة):
   - StatementTemplate: قوالب قابلة للتخصيص
   - StatementDispatchLog: سجل الإرسالات
   - StatementSubscription: تفضيلات العميل
   - StatementSchedule: جدولة شهرية/ربعية
   - StatementCustomization: تخصيصات per-customer
   - StatementBatch: عمليات bulk
   - StatementAccessLog: من قرأ كشفه (للـ compliance)
   إضافات على Customer (انظر القسم 4)

B) Engines:
   1. PDF Generator (src/lib/customer-statement-pdf.ts):
      - استخدم puppeteer + handlebars templates
      - دعم RTL (Arabic) كامل
      - دعم bilingual (AR + EN)
      - watermark (PAID / OVERDUE / DRAFT)
      - QR code (verification + portal link)
      - digital signature (P12 cert)
      - VAT-compliant layout
      - print-friendly (A4 portrait)
   
   2. Email Sender (src/lib/customer-statement-email.ts):
      - templates (HTML + plain text)
      - personalized greeting
      - PDF attachment
      - tracking pixels (open detection)
      - bounce handling
      - click tracking on portal link
      - unsubscribe link (compliance)
   
   3. Scheduler (src/lib/customer-statement-scheduler.ts):
      - cron monthly (1st of month, 6 AM)
      - cron quarterly (1st Apr/Jul/Oct/Jan)
      - cron yearly (configurable date)
      - on-demand single
      - bulk run with queue (BullMQ)
      - resume on failure
      - throttling (max 100/min to avoid spam filters)

C) APIs (24 endpoints): انظر قسم 7

D) UI Pages:
   - /accounting/customer-statements (admin overview)
   - /accounting/customer-statements/templates (CRUD)
   - /accounting/customer-statements/dispatch-log (audit)
   - /accounting/customer-statements/bulk (batch run)
   - /accounting/customer-statements/preview/:customerId
   - /accounting/customers/:id/statements-tab
   - /accounting/customers/:id/statement-settings
   - /portal/my-statements (B2B customer view)
   - /portal/my-statements/:id (PDF view)
   - /admin/statements/templates-marketplace

E) Integrations:
   - SendGrid / AWS SES / Postmark (email)
   - WhatsApp Business (statement delivery)
   - SMS (link to portal)
   - DocuSign (if customer signature required)
   - S3/Azure Blob (PDF storage)

F) Tests: 30+ unit, 10 integration, 4 E2E
```

---

## 2. السيناريوهات (8)

### A — Single Customer Manual Statement
```
1. المحاسب يفتح /accounting/customers/123
2. tab "كشوف الحساب" → [إنشاء كشف جديد]
3. Modal:
   - فترة: من 1/1/2026 إلى 31/3/2026 (Q1)
   - قالب: dropdown (Default Arabic / Bilingual / Premium / Custom)
   - تضمين: ✓ Aging ✓ QR ✓ Open Items ✗ Closed Items
   - watermark: None
   - اللغة: عربي
4. [معاينة] → preview على الشاشة
5. [توليد PDF] → يولّد + ينزّل
6. أو [إرسال Email] → يفتح modal:
   - إلى: customer.email (auto)
   - cc: المحاسب (auto)
   - بدلاً من ذلك: textarea للإضافات
   - زر [إرسال]
7. تنبيه: "تم الإرسال" + log entry
```

### B — Monthly Cron Run
```
1/2/2026، الساعة 6:00 صباحاً:
1. Cron يبدأ
2. يجلب 850 عميل { emailStatementsEnabled: true, frequency: MONTHLY, status: ACTIVE }
3. يقسّمهم على batches (50 each = 17 batches)
4. Worker thread per batch
5. لكل عميل:
   - generate statement data
   - render PDF (template per customer.statementTemplateId or default)
   - upload to S3 (signed URL valid 90d)
   - send email via SendGrid
   - log StatementDispatchLog
6. After 2 hours:
   - 845 ✓ sent
   - 5 ✗ failed (3 invalid emails + 2 timeouts)
   - summary email to AR Manager:
     "Monthly statements: 850 sent, 845 delivered, 5 failed (see report)"
   - admin can re-trigger failed ones
```

### C — Customer Portal Self-Service
```
1. العميل يدخل /portal/login → email + password
2. /portal/my-account → tab "كشوفاتي"
3. جدول آخر 24 شهر:
   - الفترة (Jan 2026, Feb 2026, ...)
   - تاريخ الإنشاء
   - الرصيد الافتتاحي
   - الرصيد الختامي
   - عدد المعاملات
   - زر [عرض] | [تنزيل] | [طلب نسخة موقّعة]
4. يضغط [عرض] → في-page PDF viewer
5. يضغط [تنزيل] → PDF
6. كل وصول → StatementAccessLog (compliance)
```

### D — Bulk Run by Filter
```
1. /accounting/customer-statements/bulk
2. Filter:
   - segment: VIP customers
   - balance > 1,000
   - last statement > 60 days ago
3. النظام: "543 عميل سيتم إرسال لهم"
4. Form:
   - فترة: from / to
   - template
   - delivery: email + WhatsApp
   - test mode: ☐
5. [تشغيل] → background job
6. progress bar live
7. على الإكمال: report
```

### E — Statement Template Designer
```
1. /accounting/customer-statements/templates → [+ قالب جديد]
2. Visual editor:
   - upload logo
   - choose colors (primary, accent)
   - rearrange sections (drag-drop):
     • Header
     • Customer Info Block
     • Period Range Bar
     • Opening Balance Box
     • Transactions Grid
     • Aging Analysis Chart
     • Closing Balance Box
     • Payment Instructions Block
     • Footer
   - toggle sections on/off
   - choose font (Cairo / Tajawal / Almarai / Custom)
   - bilingual layout
3. Preview live على عميل تجريبي
4. Save → test send لـ test email
5. Activate
```

### F — VAT-Compliant Statement (KSA)
```
- إذا الشركة سعودية + ZATCA enabled:
  - الكشف يُولّد بحسب ZATCA layout requirements:
    - Tax Registration Number visible
    - VAT amount per line
    - Total exclusive of VAT + Total inclusive
    - QR code يحتوي ZATCA-compliant TLV
    - Tax breakdown summary box
```

### G — Stop Email (Bounce Handling)
```
1. SendGrid webhook: customer email bounced (hard bounce)
2. النظام:
   - update Customer.emailStatementsEnabled = false
   - update Customer.emailDeliveryIssue = 'HARD_BOUNCE'
   - تنبيه AR clerk: "Email لـ X bounced — حدّث العنوان"
3. AR clerk يحدّث email + يعيد التفعيل
```

### H — WhatsApp Delivery
```
1. للعملاء بـ statementChannel = WHATSAPP:
2. cron يولّد PDF + يرسل عبر WhatsApp Business API:
   - رسالة: "كشف حساب X لشهر Y"
   - attachment: PDF
   - link: portal access
3. delivery status: sent / delivered / read
4. log في StatementDispatchLog
```

---

## 3. تدفق البيانات

```
[Manual Trigger]
   POST /customer-statements/preview
      ↓
   StatementEngine.buildStatementData(customerId, from, to)
      ↓
   parallel queries:
     - SELECT opening balance from JE before 'from'
     - SELECT transactions BETWEEN 'from' AND 'to'
     - SELECT closing balance at 'to'
     - SELECT aging at 'to'
     - SELECT credit limit, payment terms
      ↓
   compute running balance
   compute aging buckets
      ↓
   return JSON

[Generate PDF]
   POST /customer-statements/generate-pdf
      ↓
   load template (HTML + handlebars)
   render with data → HTML
   puppeteer → PDF buffer
   upload to S3 (UUID filename, signed URL 90d)
   generate hash
   create StatementDispatchLog (status=GENERATED)
      ↓
   return { pdfUrl, hash, dispatchLogId }

[Send Email]
   POST /customer-statements/send-email
      ↓
   load email template
   personalize (name, balance)
   attach PDF
   embed tracking pixel
   send via SendGrid
   handle response:
     - 202 → status=SENT, save messageId
     - error → status=FAILED, save error
      ↓
   on webhook (delivered/opened/clicked/bounced):
     - update StatementDispatchLog.deliveryEvents

[Cron Monthly]
   BullMQ scheduled job
      ↓
   query Customer WHERE emailStatementsEnabled=true AND frequency=MONTHLY AND active=true
      ↓
   chunk by 50
      ↓
   for each chunk → enqueue StatementBatchJob
      ↓
   worker:
     for each customer:
       buildData → renderPDF → upload → sendEmail
       log result
       respect throttle (100/min)
      ↓
   on batch complete → aggregate → notify AR manager

[Portal Access]
   GET /portal/my-statements (B2B JWT)
      ↓
   query StatementDispatchLog WHERE customerId=session.customerId
   ORDER BY generatedAt DESC LIMIT 24
      ↓
   return list with signed URLs

   GET /portal/my-statements/:id/pdf
      ↓
   verify customer owns this statement
   log StatementAccessLog
   redirect to signed S3 URL
```

---

## 4. Prisma Schema

```prisma
model Customer {
  // ... existing
  
  // Statement preferences
  emailStatementsEnabled    Boolean   @default(false)
  statementFrequency        String    @default("NEVER")  // NEVER | MONTHLY | QUARTERLY | YEARLY | ON_DEMAND
  statementChannel          String    @default("EMAIL")  // EMAIL | WHATSAPP | SMS | PORTAL_ONLY | EMAIL_AND_WHATSAPP
  statementEmail            String?   // override
  statementWhatsapp         String?   // override
  statementCcEmails         String?   // comma-separated
  statementBccEmails        String?
  statementLanguage         String    @default("ar")    // ar | en | bilingual
  statementTemplateId       Int?
  statementTemplate         StatementTemplate? @relation(fields: [statementTemplateId], references: [id])
  statementDayOfMonth       Int       @default(1)        // when to send (1-28)
  statementSendTime         String    @default("06:00") // HH:mm
  statementIncludeAging     Boolean   @default(true)
  statementIncludeClosed    Boolean   @default(false)
  statementIncludeOpenOnly  Boolean   @default(false)
  statementWatermark        String?   // PAID | OVERDUE | CONFIDENTIAL | null
  statementSinceLastSent    Boolean   @default(false)   // since last statement vs all time
  
  emailDeliveryIssue        String?
  emailDeliveryIssueDate    DateTime?
  emailLastBounceReason     String?
  
  statementDispatchLogs     StatementDispatchLog[]
  statementAccessLogs       StatementAccessLog[]
}

model StatementTemplate {
  id                Int       @id @default(autoincrement())
  name              String
  nameAr            String
  description       String?
  isDefault         Boolean   @default(false)
  isActive          Boolean   @default(true)
  language          String    @default("ar")  // ar | en | bilingual
  layoutType        String    @default("STANDARD")  // STANDARD | DETAILED | SUMMARY | LEGAL
  
  // Branding
  logoUrl           String?
  primaryColor      String    @default("#1e40af")
  accentColor       String    @default("#dbeafe")
  fontFamily        String    @default("Cairo")
  
  // Sections (JSON config)
  sections          Json      // [{type: 'HEADER', visible: true, order: 1, config: {}}, ...]
  
  // Header / Footer HTML
  headerHtml        String?   @db.Text
  footerHtml        String?   @db.Text
  
  // Email template
  emailSubject      String    // "كشف حساب {{customerName}} - {{period}}"
  emailBodyHtml     String    @db.Text
  emailBodyText     String    @db.Text
  
  // Features
  includeQR         Boolean   @default(true)
  includeSignature  Boolean   @default(false)
  signatureFileId   Int?
  signatoryName     String?
  signatoryRole     String?
  includePaymentInstructions Boolean @default(true)
  paymentInstructionsHtml String? @db.Text
  
  // VAT compliance (KSA)
  zatcaCompliant    Boolean   @default(false)
  showTaxBreakdown  Boolean   @default(false)
  
  customers         Customer[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdByUserId   String
}

model StatementDispatchLog {
  id                  Int       @id @default(autoincrement())
  customerId          Int
  customer            Customer  @relation(fields: [customerId], references: [id])
  templateId          Int?
  
  dateFrom            DateTime
  dateTo              DateTime
  generatedAt         DateTime  @default(now())
  
  pdfUrl              String?
  pdfHash             String?
  pdfSizeBytes        Int?
  
  // Statement content snapshot
  openingBalance      Decimal   @db.Decimal(20,4)
  closingBalance      Decimal   @db.Decimal(20,4)
  transactionsCount   Int
  totalDebits         Decimal   @db.Decimal(20,4)
  totalCredits        Decimal   @db.Decimal(20,4)
  agingSnapshot       Json?     // {0-30, 31-60, ...}
  
  // Delivery
  deliveryChannel     String    // EMAIL | WHATSAPP | SMS | PORTAL | DOWNLOAD
  recipientAddress    String?
  ccAddresses         String?
  bccAddresses        String?
  
  status              String    @default("GENERATED")  // GENERATED | SENT | DELIVERED | OPENED | CLICKED | BOUNCED | FAILED | SOFT_BOUNCED
  externalMessageId   String?
  errorMessage        String?
  retryCount          Int       @default(0)
  
  sentAt              DateTime?
  deliveredAt         DateTime?
  openedAt            DateTime?
  clickedAt           DateTime?
  bouncedAt           DateTime?
  
  triggeredBy         String    // 'MANUAL' | 'CRON_MONTHLY' | 'CRON_QUARTERLY' | 'BULK' | 'PORTAL' | 'API'
  triggeredByUserId   String?
  batchId             Int?
  batch               StatementBatch? @relation(fields: [batchId], references: [id])
  
  deliveryEvents      Json?     // raw webhook events
  
  @@index([customerId, generatedAt])
  @@index([status])
  @@index([batchId])
  @@index([triggeredBy, generatedAt])
}

model StatementBatch {
  id                  Int       @id @default(autoincrement())
  batchNumber         String    @unique
  startedAt           DateTime  @default(now())
  startedByUserId     String?
  triggeredBy         String    // 'CRON_MONTHLY' | 'CRON_QUARTERLY' | 'MANUAL_BULK'
  
  totalCount          Int
  processedCount      Int       @default(0)
  successCount        Int       @default(0)
  failedCount         Int       @default(0)
  
  status              String    @default("PROCESSING")  // PROCESSING | COMPLETED | FAILED | CANCELLED
  completedAt         DateTime?
  
  filterCriteria      Json      // for reproducibility
  templateId          Int?
  dateFrom            DateTime
  dateTo              DateTime
  
  dispatchLogs        StatementDispatchLog[]
  errorLog            Json?
  
  @@index([status, startedAt])
}

model StatementAccessLog {
  id              Int       @id @default(autoincrement())
  customerId      Int
  customer        Customer  @relation(fields: [customerId], references: [id])
  dispatchLogId   Int?
  accessedAt      DateTime  @default(now())
  accessChannel   String    // 'PORTAL' | 'EMAIL_LINK' | 'DOWNLOAD'
  ipAddress       String?
  userAgent       String?
  countryCode     String?
  city            String?
  duration        Int?      // seconds spent (if portal)
  
  @@index([customerId, accessedAt])
  @@index([dispatchLogId])
}

model StatementSchedule {
  id                Int       @id @default(autoincrement())
  name              String
  cronExpression    String    // standard cron
  templateId        Int?
  filterCriteria    Json      // who to send
  enabled           Boolean   @default(true)
  lastRunAt         DateTime?
  nextRunAt         DateTime?
  successRate       Decimal?  @db.Decimal(5,2)
  
  @@index([enabled, nextRunAt])
}
```

---

## 5. Forms & Fields

### Form A: Generate Statement (Single)
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| customerId | hidden | ✓ | exists | from URL |
| periodPreset | dropdown | ✓ | This Month/Last Month/This Q/Last Q/YTD/Last Year/Custom | Last Month |
| dateFrom | datepicker | ✓ if Custom | <= dateTo | calculated |
| dateTo | datepicker | ✓ if Custom | <= today | calculated |
| templateId | dropdown | ✓ | active templates | customer.statementTemplateId or default |
| language | radio | ✓ | ar/en/bilingual | customer.statementLanguage |
| includeAging | toggle | ✗ | — | template default |
| includeClosed | toggle | ✗ | — | false |
| includeOpenOnly | toggle | ✗ | — | false |
| watermark | dropdown | ✗ | None/PAID/OVERDUE/CONFIDENTIAL | None |
| includePaymentInstructions | toggle | ✗ | — | true |
| pdfPassword | text | ✗ | min 6 if set | empty (no pwd) |

### Form B: Send Email
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| to | email | ✓ | valid | customer.statementEmail or customer.email |
| cc | email list | ✗ | comma-separated valid | customer.statementCcEmails |
| bcc | email list | ✗ | — | customer.statementBccEmails |
| subject | text | ✓ | max 200 | from template |
| body | rich text | ✓ | — | from template |
| attachPdf | toggle | ✓ | — | true |
| sendNow | radio | ✓ | Now / Schedule | Now |
| scheduledTime | datetime | ✓ if Schedule | > now | — |
| trackOpen | toggle | ✗ | — | true |
| trackClicks | toggle | ✗ | — | true |

### Form C: Customer Statement Settings
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| emailStatementsEnabled | toggle | ✓ | — |
| statementFrequency | dropdown | ✓ | NEVER/MONTHLY/QUARTERLY/YEARLY/ON_DEMAND |
| statementChannel | dropdown | ✓ | EMAIL/WHATSAPP/SMS/PORTAL_ONLY/EMAIL_AND_WHATSAPP |
| statementEmail | email | ✗ | valid email |
| statementWhatsapp | tel | ✗ | E.164 |
| statementCcEmails | email list | ✗ | each valid |
| statementBccEmails | email list | ✗ | — |
| statementLanguage | radio | ✓ | ar/en/bilingual |
| statementTemplateId | dropdown | ✗ | active templates |
| statementDayOfMonth | number | ✓ if MONTHLY | 1-28 |
| statementSendTime | time | ✓ | HH:mm |
| statementIncludeAging | toggle | ✗ | — |
| statementIncludeClosed | toggle | ✗ | — |
| statementWatermark | dropdown | ✗ | enum |

### Form D: Template Editor
**Section A — Basic Info:**
| Field | Type | Required |
|-------|------|----------|
| name (English) | text | ✓ |
| nameAr | text | ✓ |
| description | textarea | ✗ |
| isDefault | toggle | ✗ |
| isActive | toggle | ✓ |
| language | radio | ✓ |
| layoutType | radio | ✓ STANDARD/DETAILED/SUMMARY/LEGAL |

**Section B — Branding:**
| Field | Type |
|-------|------|
| logoUrl | file upload |
| primaryColor | color picker |
| accentColor | color picker |
| fontFamily | dropdown |

**Section C — Sections (drag-drop builder):**
- Header (always)
- Customer Info Block (toggle visible)
- Period Range Bar (toggle)
- Opening Balance Box (toggle)
- Transactions Grid (toggle + columns selector)
- Aging Analysis Chart (toggle)
- Closing Balance Box (toggle)
- Payment Instructions Block (toggle + content)
- QR Code (toggle + position)
- Signature (toggle + image + name + role)
- Footer (always)

**Section D — Email:**
| Field | Type |
|-------|------|
| emailSubject | text (with merge tags helper) |
| emailBodyHtml | rich text editor |
| emailBodyText | textarea (auto-derived) |

**Section E — Compliance:**
| Field | Type |
|-------|------|
| zatcaCompliant | toggle |
| showTaxBreakdown | toggle |

### Form E: Bulk Run
| Field | Type | Required |
|-------|------|----------|
| filterPreset | dropdown | All Active / VIP / Overdue / Custom |
| customerSegmentId | dropdown | ✗ |
| customerIds | multi-select | ✗ |
| balanceMin | money | ✗ |
| balanceMax | money | ✗ |
| daysSinceLastStatement | number | ✗ |
| dateFrom | datepicker | ✓ |
| dateTo | datepicker | ✓ |
| templateId | dropdown | ✓ |
| deliveryChannels | checkboxes | ✓ |
| testMode | toggle | ✗ (no actual send) |
| previewCountFirst | toggle | ✓ default true |
| sendImmediately | radio | Now / Schedule |
| scheduledTime | datetime | conditional |

### Form F: Schedule Builder
| Field | Type | Required |
|-------|------|----------|
| scheduleName | text | ✓ |
| frequency | dropdown | DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY/CUSTOM_CRON |
| cronExpression | text | ✓ if CUSTOM |
| dayOfMonth | number | ✓ if MONTHLY |
| timeOfDay | time | ✓ |
| timezone | dropdown | default Asia/Riyadh |
| filterCriteria | composite | ✓ |
| templateId | dropdown | ✓ |
| enabled | toggle | ✓ |
| pauseOnFailure | toggle | ✗ |
| notifyOnFailure | email list | ✗ |

---

## 6. Tables & Columns

### Grid A: Dispatch Log (`/accounting/customer-statements/dispatch-log`)
| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|-----------|-------|
| Generated At | datetime | ✓ desc | date range | 150px |
| Customer | link | ✓ | search | 220px |
| Period | text "Jan 2026" | ✓ | date range | 130px |
| Channel | badge | ✓ | dropdown | 100px |
| Recipient | email | — | search | 200px |
| Status | badge | ✓ | dropdown | 130px |
| Sent At | datetime | ✓ | date range | 150px |
| Delivered At | datetime | ✓ | date range | 150px |
| Opened At | datetime | ✓ | toggle | 150px |
| Open Count | number | ✓ | range | 100px |
| Closing Bal | money | ✓ | range | 130px |
| Triggered By | badge | ✓ | dropdown | 130px |
| PDF | icon link | — | — | 60px |
| Actions: [Resend] [View] | buttons | — | — | 150px |

### Grid B: Templates (`/accounting/customer-statements/templates`)
| Column | Width |
|--------|-------|
| Name (Ar) | 200 |
| Name (En) | 200 |
| Language | 100 |
| Layout | 130 |
| Default | toggle | 80 |
| Active | toggle | 80 |
| Customers Using | counter | 130 |
| Last Used | datetime | 150 |
| Created By | 130 |
| Actions: [Edit] [Preview] [Clone] [Delete] | 200 |

### Grid C: Batches (`/accounting/customer-statements/batches`)
| Column | Width |
|--------|-------|
| Batch # | 130 |
| Started | datetime | 150 |
| Triggered By | 150 |
| Filter Summary | 250 |
| Total | number | 100 |
| Success | number (green) | 100 |
| Failed | number (red) | 100 |
| Progress | progress bar | 150 |
| Status | badge | 130 |
| Duration | text | 100 |
| Actions: [View] [Cancel] [Re-run failed] | 200 |

### Grid D: Customer Statement History (in Customer card tab)
| Column | Width |
|--------|-------|
| Date | 130 |
| Period | 150 |
| Channel | 100 |
| Status | 110 |
| Closing Balance | 130 |
| Opens | 80 |
| Last Read | 130 |
| Actions: [View PDF] [Resend] | 150 |

### Grid E: Schedules (`/admin/statements/schedules`)
| Column | Width |
|--------|-------|
| Name | 200 |
| Frequency | 130 |
| Next Run | datetime | 160 |
| Last Run | datetime | 160 |
| Success Rate | progress | 130 |
| Customers Targeted | counter | 130 |
| Enabled | toggle | 100 |
| Actions: [Edit] [Run Now] [View History] [Disable] | 250 |

### Grid F: Portal — My Statements (B2B)
| Column | Width |
|--------|-------|
| Period | 150 |
| Generated | 130 |
| Opening Balance | 130 |
| Closing Balance | 130 |
| Transactions | 100 |
| PDF | icon | 60 |
| Actions: [View] [Download] [Request Signed Copy] | 250 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Confirmation | Permission |
|----|------|--------|-------|--------------|------------|
| btn-stmt-generate | إنشاء كشف | customer card | 🟦 | ✗ | role.ar |
| btn-stmt-preview | معاينة | generate modal | 🟦 | ✗ | role.ar |
| btn-stmt-download-pdf | تنزيل PDF | preview/log | 🟢 | ✗ | role.ar OR self |
| btn-stmt-send-email | إرسال Email | preview/log | 🟦 | ✗ | role.ar |
| btn-stmt-send-whatsapp | إرسال WhatsApp | preview/log | 🟢 | ✗ | role.ar |
| btn-stmt-print | طباعة | preview | ⬜ | ✗ | role.ar OR self |
| btn-stmt-resend | إعادة إرسال | dispatch log | ⬜ | ✗ | role.ar |
| btn-stmt-cancel-send | إلغاء (مجدول) | dispatch log | 🔴 | confirm | role.ar |
| btn-stmt-bulk | تشغيل bulk | bulk page | 🟦 | preview count first | role.ar_supervisor |
| btn-stmt-bulk-test | اختبار bulk | bulk page | 🟡 | ✗ | role.ar |
| btn-stmt-bulk-cancel | إلغاء batch | batches | 🔴 | confirm | starter or admin |
| btn-stmt-batch-rerun-failed | إعادة الفاشلة | batch detail | 🟡 | ✗ | starter |
| btn-tpl-create | + قالب جديد | templates | 🟢 | ✗ | role.admin |
| btn-tpl-edit | تعديل | template row | ⬜ | ✗ | role.admin |
| btn-tpl-clone | نسخ | template row | ⬜ | ✗ | role.admin |
| btn-tpl-preview | معاينة | template row | ⬜ | ✗ | role.admin |
| btn-tpl-delete | حذف | template row | 🔴 | unused only + confirm | role.admin |
| btn-tpl-set-default | تعيين كافتراضي | template row | 🟦 | confirm (replaces current) | role.admin |
| btn-tpl-export | تصدير | template row | ⬜ | ✗ | role.admin |
| btn-tpl-import | استيراد | templates | ⬜ | ✗ | role.admin |
| btn-cust-stmt-settings | إعدادات الكشف | customer card | ⬜ | ✗ | role.ar |
| btn-cust-stmt-test-email | اختبار إرسال | customer settings | 🟡 | ✗ | role.ar |
| btn-cust-stmt-disable | إلغاء الإرسال التلقائي | customer settings | 🔴 | confirm | role.ar |
| btn-schedule-create | + جدولة | schedules | 🟢 | ✗ | role.admin |
| btn-schedule-run-now | تشغيل الآن | schedule row | 🟦 | confirm count | role.admin |
| btn-schedule-disable | تعطيل | schedule row | 🟡 | ✗ | role.admin |
| btn-schedule-history | السجل | schedule row | ⬜ | ✗ | role.admin |
| btn-export-dispatch-log | تصدير السجل | dispatch log | ⬜ | format | role.ar |
| btn-portal-view-stmt | عرض | portal grid | 🟦 | ✗ | self |
| btn-portal-download | تنزيل | portal grid | 🟢 | ✗ | self |
| btn-portal-request-signed | طلب نسخة موقّعة | portal grid | 🟡 | + form | self |

---

## 8. Search & Filters

### Dispatch Log:
- Date range
- Customer (search)
- Period (range)
- Channel (multi)
- Status (multi)
- Triggered by (manual/cron/bulk/portal)
- Has issues (toggle: bounced/failed)
- Was opened (toggle)
- Closing balance range

### Templates:
- Language
- Layout type
- Active toggle
- Default toggle
- Search by name

### Customers Subscription View:
- Frequency
- Channel
- Has email issues
- Last sent (range)
- Active subscriptions

---

## 9. Reports & Exports

| التقرير | الحقول | تنسيقات |
|---------|--------|----------|
| Dispatch Activity | per period: sent/delivered/opened/bounced | Excel/PDF |
| Delivery Issues | bounced + failed customers | Excel |
| Engagement Report | open rate per customer/template | Excel |
| Template Usage Stats | which templates most used | PDF |
| Compliance Audit | who accessed which statement when | Excel |
| Customer Subscription List | all customers + their preferences | Excel |
| Bulk Batch Summary | per batch metrics | PDF |
| Email Bounce Analysis | reasons + cleanup recommendations | Excel |
| Statement Read History | per customer access timeline | PDF |
| ROI Analysis | sent statements → payments received | Excel |

---

## 10. Dashboards & Widgets

### `/accounting/customer-statements/dashboard`

**Widget 1: This Month Sent** — counter (number) + comparison vs last month
**Widget 2: Open Rate** — percentage gauge
**Widget 3: Channel Distribution** — pie chart (email/WhatsApp/portal)
**Widget 4: Bounce Rate Trend** — line chart 12 months
**Widget 5: Top Read Templates** — list top 5
**Widget 6: Customers w/o Statements** — counter (active customers, no recent statement)
**Widget 7: Failed Deliveries (24h)** — list + action buttons
**Widget 8: Upcoming Scheduled Runs** — calendar widget

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Statement generated (manual) | in-app | requester |
| Statement sent (manual) | in-app | requester |
| Statement bounced | in-app + email | AR clerk + customer's account manager |
| Statement bounce — hard (3rd time) | email | AR manager (cleanup needed) |
| Bulk batch started | in-app | starter |
| Bulk batch completed | email + in-app | starter |
| Bulk batch failed (>10%) | email + Slack | AR manager + IT |
| Scheduled run completed | email | scheduler owner |
| Customer accessed statement (high-value) | in-app | account manager |
| Customer asked for signed copy | email | AR manager |
| Template not used 90 days | in-app | template owner |

---

## 12. Permissions Matrix

| Action | AR Clerk | AR Supervisor | AR Manager | Admin | Customer (Portal) |
|--------|----------|---------------|-----------|-------|-------------------|
| Generate statement (single) | ✓ | ✓ | ✓ | ✓ | own only |
| Send email | ✓ | ✓ | ✓ | ✓ | ✗ |
| Bulk run | ✗ | ✓ | ✓ | ✓ | ✗ |
| Schedule cron | ✗ | ✗ | ✓ | ✓ | ✗ |
| Edit templates | ✗ | ✗ | ✗ | ✓ | ✗ |
| Set default template | ✗ | ✗ | ✗ | ✓ | ✗ |
| Edit customer prefs | ✓ | ✓ | ✓ | ✓ | own |
| View dispatch log | ✓ R | ✓ R | ✓ | ✓ | own |
| View access log | ✗ | ✗ | ✓ R | ✓ | ✗ |
| Cancel scheduled send | ✓ | ✓ | ✓ | ✓ | ✗ |
| Resend bounced | ✓ | ✓ | ✓ | ✓ | ✗ |
| View own statements (portal) | — | — | — | — | ✓ |
| Download own PDF | — | — | — | — | ✓ |
| Request signed copy | — | — | — | — | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| SendGrid / AWS SES / Postmark | email delivery |
| WhatsApp Business API (360dialog) | WhatsApp delivery |
| Twilio / Unifonic | SMS notification with portal link |
| AWS S3 / Azure Blob | PDF storage (signed URLs) |
| Puppeteer | PDF generation |
| Handlebars | template rendering |
| BullMQ + Redis | background queue |
| DocuSign | digital signature on PDFs |
| Sentry | error tracking |
| Mixpanel / PostHog | engagement analytics |
| ZATCA Fatoora | VAT compliance verification |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+G` | Generate new statement |
| `Ctrl+E` | Export dispatch log |
| `Ctrl+B` | Open bulk run page |
| `Ctrl+T` | Templates |
| `R` | Resend selected (multi-select) |
| `?` | Help |

---

## 15. Mobile / Print

### Mobile:
- Customer card tab → list view
- Tap statement → full-screen PDF viewer (pinch zoom)
- Share button (native sharing)

### Print:
- A4 portrait optimized
- Margins: 20mm top, 15mm sides
- Page break after each section
- Page numbers (X of Y)
- Print preview before output

### Portal Mobile:
- PWA-compatible
- Offline cached statements
- Push notification when new statement

---

## 16. Audit & Logging

- StatementDispatchLog: every send + delivery event
- StatementAccessLog: every read (compliance)
- Template change: AuditLog with diff
- Customer settings change: FieldAuditLog
- Bulk batch: full execution log

Retention:
- Dispatch logs: 7 years (financial records)
- Access logs: 3 years
- PDFs in S3: 7 years cold storage

---

## 17. Test Cases

```typescript
describe('PDF Generation', () => {
  test('renders Arabic RTL correctly')
  test('bilingual layout 50/50')
  test('VAT-compliant format passes ZATCA')
  test('QR code valid')
  test('large statements (1000+ transactions) render')
  test('watermark appears correctly')
  test('digital signature embedded')
  test('PDF/A-3 compliance for archival')
})

describe('Email Delivery', () => {
  test('sends with attachment')
  test('handles bounces')
  test('handles soft bounces (retry)')
  test('throttles to 100/min')
  test('respects unsubscribe')
  test('tracking pixel records open')
})

describe('Cron Scheduling', () => {
  test('monthly cron runs at correct time')
  test('respects customer.statementDayOfMonth')
  test('quarterly cron Q1/Q2/Q3/Q4')
  test('skips disabled customers')
  test('resumes after failure')
})

describe('Bulk Operations', () => {
  test('processes 1000 customers in batches')
  test('throttles correctly')
  test('handles partial failures')
  test('cancellation mid-batch')
  test('re-run failed only')
})

describe('Portal Access', () => {
  test('customer sees only own statements')
  test('access logged')
  test('signed URL expires correctly')
  test('cannot access other customers')
})

describe('Bounce Handling', () => {
  test('hard bounce disables auto-send')
  test('soft bounce retries 3x')
  test('webhook updates dispatch log')
})

describe('Templates', () => {
  test('default template applied to new customers')
  test('cannot delete in-use template')
  test('clone preserves all settings')
})

describe('Compliance', () => {
  test('ZATCA layout validates')
  test('audit log immutable')
  test('access log captures IP + user agent')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| العميل بدون معاملات في الفترة | generate "no activity" statement |
| email غير صحيح | mark customer + alert + skip |
| PDF generation timeout | retry 3x + alert |
| S3 upload failed | retry + fallback to local + alert |
| webhook from SendGrid لـ unknown messageId | log warning |
| customer deleted أثناء batch | skip + log |
| template deleted أثناء scheduled run | use default + warn |
| daylight saving time change | use UTC internally |
| customer in different timezone | respect timezone for sendTime |
| VAT registration number changed | use historical at statement date |
| customer name changed | use current for header, historical in transactions |
| credit note dated after statement period | exclude (cut-off) |
| reverse JE in period | shown explicitly |
| FX revaluation in period | included with note |
| bilingual but customer language unset | default to AR |
| customer in WhatsApp blocklist | fallback to email |
| portal access while statement being regenerated | show "in progress" + auto-refresh |

---

**نهاية مواصفات النقص #4**

> 8 سيناريوهات • 6 جداول schema • 6 forms • 6 grids • 31 button • 8 widgets • 11 notifications • 10 reports
