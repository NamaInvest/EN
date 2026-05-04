# البرومنتات الجاهزة — القطاع المالي والمحاسبي

كل بند يحتوي: **الحالة الحالية** → **السيناريو العالمي** → **فلو البيانات** → **البرومنت الجاهز**.

---

## F-01 — FX Revaluation حقيقي (الأسعار حالياً مرمزة!)

### الحالة الحالية
`src/lib/fx-revaluation.ts` يحتوي أسعار صرف **hardcoded** (3.75 و 3.78). لا يقرأ من جدول، ولا يطبق على AR/AP المفتوحة فعلياً. القيد لا يُولَّد.

### السيناريو العالمي (SAP FAGL_FC_VAL)
في نهاية كل شهر، النظام يقرأ الفواتير المفتوحة بالعملات الأجنبية، يحسب الفرق بين سعر الفاتورة وسعر الإقفال، ويُولِّد قيد FX Gain/Loss على OCI. القيد يُعكس تلقائياً في أول يوم من الشهر التالي.

### فلو البيانات
```
[Period End Trigger]
        │
        ▼
[Read ExchangeRate at periodEnd] ──→ [Read AR/AP/Bank open items in foreign currency]
        │                                            │
        ▼                                            ▼
[Compute Δ = (newRate - oldRate) × balance] ──→ [Generate JE per account]
        │
        ▼
[Post JE: DR/CR Account vs FX Gain/Loss]
        │
        ▼
[Schedule Auto-Reverse on 1st day of next period]
```

### البرومنت الجاهز
```
أعد بناء src/lib/fx-revaluation.ts بالكامل.

المتطلبات:
1. أنشئ ExchangeRate model إن لم يوجد:
   ExchangeRate { id, currencyFrom, currencyTo, rateType (SPOT|AVG|CLOSING), rate Decimal(18,8), effectiveDate, source, createdAt }
   
2. أضف FxRevaluationRun model:
   { id, fiscalPeriodId, runDate, baseCurrency, accountIds[], totalGain Decimal, totalLoss Decimal, journalEntryId?, reverseJournalEntryId?, status (DRAFT|POSTED|REVERSED), createdBy }

3. الدالة الأساسية:
   revalueOpenItems(periodEndDate: Date, baseCurrency: string, userId: string):
   - لكل فاتورة AR/AP بعملة أجنبية مفتوحة في periodEndDate:
     * اقرأ originalRate (rate وقت الفاتورة)
     * اقرأ closingRate من ExchangeRate (rateType=CLOSING, effectiveDate=periodEndDate)
     * delta = (closingRate - originalRate) × outstandingForeignAmount
     * إذا AR + delta>0 → DR: AR foreign, CR: Unrealized FX Gain (P&L)
     * إذا AR + delta<0 → DR: Unrealized FX Loss (P&L), CR: AR foreign
     * AP العكس
   - استخدم Settings.fxGainAccountId و Settings.fxLossAccountId
   - استخدم Prisma transaction

4. revalueBankBalances(periodEndDate, baseCurrency): نفس المنطق على أرصدة البنوك بعملات أجنبية.

5. autoReverse: عند runDate = nextPeriodStart → اعكس القيد تلقائياً (مرتبط بـ recurring-journal-runner).

6. اربط مع period-close.ts كخطوة بعد Soft Close قبل Hard Close.

7. API:
   - POST /api/accounting/fx-revaluation/run { fiscalPeriodId, dryRun: boolean }
   - GET /api/accounting/fx-revaluation/history
   - POST /api/accounting/fx-revaluation/reverse/[id]

8. UI: صفحة /finance/fx-revaluation فيها:
   - زر "تشغيل (Preview)" يعرض القيد قبل الترحيل
   - زر "ترحيل" يفعّل القيد
   - جدول تاريخ التشغيلات
   - عمود "تم العكس" مع تاريخ الإلغاء التلقائي

9. Tests: 3 سيناريوهات
   - Gain on AR (USD invoice, SAR strengthens)
   - Loss on AP (EUR invoice, EUR strengthens)
   - Bank balance revaluation

ملاحظة: استخدم Decimal بدقة 8 للسعر و 4 للمبالغ.
الحسابات: استخدم getDefaults() من src/lib/getDefaults.ts.
الترحيل: عبر src/lib/auto-journal.ts بـ source='FX_REVALUATION'.
```

---

## F-02 — Payment Run Engine (F110-style، حالياً stub فقط بدون API/UI)

### الحالة الحالية
`src/lib/payment-run-engine.ts` يحتوي مقترح فقط، **لا API و لا UI**. لا يُولِّد ملفات SEPA/SWIFT/WPS. لا يُولِّد قيد JE.

### السيناريو العالمي (SAP F110)
المحاسب يطلب "اقترح كل الفواتير المستحقة خلال 7 أيام". النظام يُولِّد proposal، يُجمِّع الفواتير لكل مورد، يحسب الإجمالي، يطبق early-payment discount. المحاسب يراجع → يعتمد. النظام يُولِّد ملف بنكي + قيود JE تلقائياً.

### فلو البيانات
```
[Run Date + Criteria] → [Find AP open items due ≤ runDate + N]
                                        │
                                        ▼
[Group per Vendor] ──→ [Apply Early Payment Discount] ──→ [Sum per Bank Account]
                                        │
                                        ▼
                              [Create PaymentRun + Lines]
                                        │
                              [User Reviews → Approves]
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                   [SEPA/SWIFT]    [WPS SIF]      [JE Auto-Post]
                    XML File      File           DR: AP, CR: Bank
```

### البرومنت الجاهز
```
بناء Payment Run Engine كامل (SAP F110 equivalent).

1. Schema:
   PaymentRun {
     id, code, runDate, paymentDate, paymentMethod (CHECK|TRANSFER|WIRE|WPS),
     bankAccountId, currencyId, criteria JSON, totalAmount Decimal,
     status (DRAFT|PROPOSED|APPROVED|EXECUTED|CANCELLED),
     fileFormat, fileName?, journalEntryId?, createdBy, approvedBy?, executedBy?
   }
   PaymentRunLine {
     id, runId, vendorId, invoiceIds JSON, paymentTermDiscount Decimal,
     grossAmount Decimal, discountAmount Decimal, netAmount Decimal,
     status, errorMessage?
   }

2. Engine src/lib/payment-run-engine.ts:
   - proposePayments(criteria: { dueWithinDays, vendors?, minAmount?, maxAmount?, paymentMethod, bankAccountId }):
     * SELECT open items من AP حيث dueDate ≤ today + dueWithinDays
     * GROUP BY vendor
     * طبق early-payment discount إذا paid date ≤ discount window من PaymentTerm
     * أنشئ PaymentRun status=PROPOSED + lines
   - approvePaymentRun(runId, userId): تحقق من approval workflow + عيّن status=APPROVED
   - executePaymentRun(runId, userId):
     * generate ملف بنكي (انظر #3)
     * أنشئ JE واحد: DR كل AP الموردين، CR Bank
     * عيّن AP open items كـ CLEARED
     * status=EXECUTED
   - cancelPaymentRun(runId, reason): يعكس JE إن وُجد + يُعيد open items للحالة OPEN

3. Bank File Generators:
   - src/lib/bank-files/sepa-pain-001.ts (SEPA Credit Transfer ISO 20022 pain.001.001.09)
   - src/lib/bank-files/swift-mt103.ts (SWIFT MT103 single payment)
   - src/lib/bank-files/wps-sif.ts (إن لم يكن موجود — استخدم Mudad SIF v3)
   - src/lib/bank-files/check-print.ts (PDF بـ MICR line)

4. API:
   - POST /api/finance/payment-runs/propose
   - GET /api/finance/payment-runs?status=...
   - GET /api/finance/payment-runs/[id]
   - POST /api/finance/payment-runs/[id]/approve
   - POST /api/finance/payment-runs/[id]/execute
   - POST /api/finance/payment-runs/[id]/cancel
   - GET /api/finance/payment-runs/[id]/file (download)

5. UI /finance/payment-runs (Wizard 4 خطوات):
   - الخطوة 1: اختر المعايير (due date, vendors, bank account)
   - الخطوة 2: راجع الـ proposal (جدول قابل للتعديل لإضافة/إزالة فواتير)
   - الخطوة 3: اعتمد (مع approval workflow integration)
   - الخطوة 4: نفّذ (يولد الملف + يعرض رابط التنزيل)

6. Tests:
   - propose: 5 موردين × 10 فواتير → تجميع صحيح
   - early discount: فاتورة 2/10 net 30 paid in 8 days → خصم 2%
   - SEPA file: schema validation
   - WPS file: mudad spec v3 compliance
   - cancel reverses JE
```

---

## F-03 — Dunning Engine (إنذارات التأخير) — stub بدون API/UI

### الحالة الحالية
`src/lib/dunning-engine.ts` يحتوي placeholder. لا يُرسل emails/SMS/WhatsApp. لا يُولِّد letter PDF. لا يضيف late fees.

### السيناريو العالمي (SAP FBL5N)
المدير يضع سياسة: "Level 1 بعد 7 أيام إيميل، Level 2 بعد 14 يوم SMS+1% فائدة، Level 3 بعد 30 يوم لتر بريدي PDF + ربع%، Level 4 إحالة قضائية". Cron يومي يجد المتأخرين، يحدد المستوى، يرسل القناة، ويسجل dunning history.

### فلو البيانات
```
[Daily Cron 9 AM]
        │
        ▼
[Find AR open items where days_overdue > 0]
        │
        ▼
[Match each invoice → DunningPolicy (per customer)]
        │
        ▼
[Determine Current Level based on days_overdue]
        │
        ▼
[Has it been sent at this level before? Yes → skip / No → process]
        │
   ┌────┼────┬───────┐
   ▼    ▼    ▼       ▼
Email  SMS WhatsApp Letter PDF
   │    │    │       │
   └────┴────┴───────┘
        │
        ▼
[Add late fee/interest as new AR open item]
        │
        ▼
[Insert DunningHistory record + Update aging snapshot]
```

### البرومنت الجاهز
```
بناء Dunning Engine إنتاجي.

1. Schema:
   DunningPolicy { id, name, currency, customerSegment?, isActive, levels JSON }
   DunningLevel inside JSON: { level, daysOverdue, channels[] (EMAIL|SMS|WHATSAPP|LETTER|CALL|LEGAL),
     templateId, lateFeeFlat?, lateFeePct?, interestRatePctMonthly? }
   DunningRun { id, runDate, customerId, invoiceIds[], level, channelsUsed[],
     totalFeesAdded, status (PENDING|SENT|FAILED), errorMessage?, createdAt }
   DunningTemplate { id, code, language, channel, subject?, bodyHtml, attachStatement bool }

2. Engine src/lib/dunning-engine.ts:
   - runDunningCron(asOfDate): cron يومي
     * SELECT distinct customer من AR open items where dueDate < asOfDate
     * لكل عميل: جد policy المرتبطة (default policy لو ما له)
     * احسب أقدم days_overdue
     * حدد current level (matching highest applicable threshold)
     * تحقق: هل هذا level أُرسل خلال آخر 7 أيام لنفس العميل؟ → skip
     * نفّذ:
       a) أرسل عبر القنوات (email via src/lib/email.ts، SMS عبر src/lib/sms.ts، WhatsApp عبر api/crm/whatsapp/)
       b) أنشئ late fee invoice إذا lateFeeFlat
       c) أنشئ interest charge JE إذا interestRatePctMonthly: DR AR Customer, CR Interest Income
       d) أنشئ DunningRun record
   - generateLetterPdf(customerId, level): يولد PDF بـ pdfkit/puppeteer
   - getDunningHistory(customerId): timeline

3. Late Fee/Interest كـ open items:
   - استخدم auto-journal.ts source='DUNNING_FEE'
   - حساب Interest Income من Settings.interestIncomeAccountId

4. API:
   - GET/POST/PUT/DELETE /api/finance/dunning/policies
   - GET/POST/PUT /api/finance/dunning/templates
   - POST /api/finance/dunning/run (manual trigger)
   - GET /api/finance/dunning/history?customerId=...
   - GET /api/finance/dunning/[id]/letter (PDF)

5. UI /finance/dunning:
   - Tab 1: Policies (CRUD + level builder)
   - Tab 2: Templates (HTML editor + variables {{customerName}}, {{amount}}, ...)
   - Tab 3: Active Cases (عملاء حالياً في dunning مع level + last action)
   - Tab 4: History (timeline)

6. Cron:
   - أضف /api/cron/dunning route
   - Schedule: يومي 9:00 AM

7. Tests:
   - 3 levels × 4 channels × 2 currencies
   - duplicate prevention (same level not sent twice in 7 days)
   - PDF generation
   - late fee creates open item
```

---

## F-04 — IFRS 9 Expected Credit Loss (ECL) — stub

### الحالة الحالية
`src/lib/ifrs9-ecl.ts` فيه skeleton لا يحسب PD/LGD/EAD. لا forward-looking info. لا time-value adjustment.

### السيناريو العالمي
بنوك وشركات كبيرة تطبق IFRS 9 على AR. كل عميل يُصنّف Stage 1/2/3 حسب DPD وعوامل أخرى. النظام يحسب ECL = PD × LGD × EAD ويولد provision JE.

### فلو البيانات
```
[Period End]
     │
     ▼
[For each Customer with AR exposure]
     │
     ▼
[Compute DPD (Days Past Due) of oldest invoice]
     │
     ▼
[Determine Stage]
  - Stage 1: DPD < 30 → 12-month ECL
  - Stage 2: 30 ≤ DPD < 90 → Lifetime ECL
  - Stage 3: DPD ≥ 90 OR credit-impaired → Lifetime ECL + interest on net
     │
     ▼
[Lookup PD per (segment, stage) from ECLModel]
     │
     ▼
[ECL = PD × LGD × EAD × discountFactor]
     │
     ▼
[Compare to existing provision] → [Generate adjustment JE]
     │
     ▼
DR: Bad Debt Expense  /  CR: Allowance for ECL (contra-AR)
```

### البرومنت الجاهز
```
بناء IFRS 9 ECL Engine حقيقي.

1. Schema:
   ECLModel { id, segmentName, stage1PD Decimal, stage2PD Decimal, stage3PD Decimal,
     stage1Months int default 12, stage2Months int default 36, defaultLGD Decimal default 0.45,
     forwardLookingFactor Decimal, isActive }
   ECLAssessment { id, customerId, fiscalPeriodId, exposure Decimal, daysPastDue,
     stage (1|2|3), pdUsed, lgdUsed, eclAmount, journalEntryId?, runAt, runBy }
   CustomerSegment { id, name, eclModelId } -- ربط على Customer.segmentId

2. Engine src/lib/ifrs9-ecl.ts:
   assessCustomer(customerId, asOfDate):
     - exposure = sum(open invoices outstanding)
     - DPD = days(asOfDate - oldest_due_date)
     - stage = DPD<30 ? 1 : DPD<90 ? 2 : 3
     - PD = ECLModel[segment][stage]
     - LGD = defaults to 0.45 إلا لو configured
     - lifetime months = stage==1 ? 12 : 36
     - discountFactor = 1/(1+EIR)^lifetime
     - ECL = PD × LGD × exposure × discountFactor × forwardLookingFactor
     - إن stage==3: أضف interest على net = (exposure - existingProvision) × EIR
     - return { stage, pd, lgd, exposure, eclAmount }

   runPortfolioECL(fiscalPeriodId, userId):
     - لكل عميل له exposure>0:
       * احسب assessment
       * احسب delta vs previousAssessment
       * append إلى group JE
     - بعد المرور: post JE واحد:
       * DR: Bad Debt Expense (per cost center)
       * CR: Allowance for ECL (contra account 1310-CONTRA مثلاً)

3. API:
   - GET/POST /api/accounting/ecl/models
   - POST /api/accounting/ecl/run { fiscalPeriodId, dryRun }
   - GET /api/accounting/ecl/assessments?customerId&period
   - GET /api/accounting/ecl/portfolio-summary?period

4. UI /finance/ecl:
   - Models tab (CRUD)
   - Run tab (preview + execute)
   - Customer drill-down (history of assessments)
   - Portfolio dashboard (stage distribution، coverage ratio)

5. Settings:
   - allowanceECLAccountId
   - badDebtExpenseAccountId
   - effectiveInterestRate (EIR)
   - defaultLGD

6. Tests:
   - 3 customers × 3 stages
   - stage migration (Stage 1 → 2 → 3)
   - reversal when paid
   - portfolio aggregation

ملاحظة: لا تكتب على contra-AR account من JE manual — استخدم auto-journal.ts source='ECL_ASSESSMENT'.
```

---

## F-05 — Customer/Vendor Statement PDF محسن

### الحالة الحالية
`/api/reports/customer-statement` يُرجع JSON. لا PDF محسن، لا email scheduling، لا Vendor Statement.

### السيناريو العالمي
العميل يطلب "كشف حساب آخر 3 شهور". النظام يُولِّد PDF بشعار الشركة + بيانات العميل + Opening Balance + كل الحركات + Aging Buckets + Closing Balance + بنك التحويل + ملاحظات. يُرسل email تلقائياً شهرياً.

### فلو البيانات
```
[Request: customerId, fromDate, toDate, format]
     │
     ▼
[Fetch Opening Balance @ fromDate]
     │
     ▼
[Fetch all transactions (invoices, payments, credit notes) in range]
     │
     ▼
[Fetch Closing Balance @ toDate]
     │
     ▼
[Compute Aging Buckets (0-30, 31-60, 61-90, 90+)]
     │
     ▼
[Render PDF/Excel via puppeteer or pdfkit]
     │
     ├──→ [Download direct]
     ├──→ [Email to customer]
     └──→ [Save to /storage/statements/]
```

### البرومنت الجاهز
```
أكمل Customer Statement + بناء Vendor Statement.

1. Engine src/lib/customer-statement.ts (موجود — حسّنه):
   generateStatement(customerId, fromDate, toDate, options: { format: PDF|EXCEL|JSON, includeOpenOnly: bool, language: ar|en }):
   - Opening = sum of (invoices - payments) where date < fromDate
   - Transactions: invoices + payments + credit notes في range، sorted by date
   - Running balance column
   - Aging buckets snapshot at toDate
   - Branding: شعار + بيانات الشركة من Settings
   - Footer: بنك التحويل + IBAN + شروط الدفع

2. PDF: استخدم puppeteer مع HTML template في src/templates/customer-statement.html
   - دعم RTL للعربي
   - Header مع logo
   - جدول الحركات (Invoice/Payment/CN + المبلغ + الرصيد المتراكم)
   - Aging table (4 buckets)
   - Footer مع payment instructions

3. Excel: ExcelJS مع الـ formatting
4. Email: استخدم src/lib/email.ts مع template
5. أنشئ Vendor Statement مثيلة في src/lib/vendor-statement.ts

6. API:
   - POST /api/customers/[id]/statement (body: {fromDate, toDate, format, sendEmail: bool})
   - POST /api/vendors/[id]/statement
   - POST /api/reports/statements/batch (لإرسال شهري لكل العملاء النشطين)

7. Cron job:
   - /api/cron/monthly-statements
   - schedule: 1st of month, 8 AM
   - أرسل لكل عميل/مورد

8. UI /finance/statements:
   - فلتر بالعميل/المورد + تواريخ
   - معاينة PDF inline
   - زر "إرسال بالإيميل"
   - زر "تحميل Excel"
   - قسم "إعدادات الإرسال التلقائي" (إعداد frequency)

9. Tests:
   - PDF rendering مع 50 سطر حركات
   - aging buckets دقيقة
   - email سليم
   - Excel كامل بكل الأعمدة
```

---

## F-06 — WHT (Withholding Tax) كامل + Certificate + Monthly Return

### الحالة الحالية
`src/lib/wht-engine.ts` و `/api/finance/wht/route.ts` فيهم منطق أساسي. **لا WHT Certificate PDF**، لا ربط بـ Payment Run، لا monthly XML return لـ ZATCA.

### السيناريو العالمي (Saudi WHT)
المورد الأجنبي يصدر فاتورة. عند الدفع، النظام يستقطع WHT (5% خدمات تقنية، 15% إتاوات، 20% إدارة). الصافي يُحوَّل للمورد، WHT يُسجَّل في حساب payable. يُولَّد certificate PDF للمورد. آخر الشهر: ملف XML للزكاة.

### فلو البيانات
```
[Invoice Created → Vendor type=Non-Resident]
              │
              ▼
[Determine Service Type → Lookup WHTRule]
              │
              ▼
[Compute WHT = invoiceBase × rate]
              │
              ▼
[Adjust Payment: net = gross − WHT]
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
[Pay vendor] [Create WHT] [Generate Cert]
  net amount   payable     PDF for vendor
              │
              ▼
[Monthly: aggregate all WHT → XML for ZATCA]
              │
              ▼
[Pay WHT to ZATCA → Mark certificates as Paid]
```

### البرومنت الجاهز
```
أكمل WHT Engine.

1. Schema (الموجود + إضافات):
   WHTRule { id, countryCode, serviceType (TECH_SERVICES|ROYALTIES|MGMT_FEES|RENT|DIVIDENDS|INTEREST|CONSULTING),
     residentRate Decimal, nonResidentRate Decimal, treatyOverrides JSON, effectiveFrom, effectiveTo? }
   WHTTransaction { id, vendorId, invoiceId, paymentId?, baseAmount, whtRate, whtAmount,
     certificateNumber, certificateGeneratedAt?, paidToZATCAAt?, fiscalPeriodId, status }
   WHTReturn { id, fiscalPeriodId, totalAmount, transactionCount, xmlFileName?, submittedAt?, status }

2. Engine src/lib/wht-engine.ts:
   - calculateWHT(invoice, vendor):
     * إذا vendor.residentStatus = NON_RESIDENT → استخدم nonResidentRate
     * Service type من invoice.line.serviceType (أضف الحقل)
     * lookup WHTRule
     * apply treaty if vendor.taxTreatyCountry موجود
     * return { rate, amount }
   - applyWHTToPayment(paymentId):
     * payment.netAmount = grossAmount − whtAmount
     * أنشئ WHTTransaction
     * JE: DR AP (gross), CR Bank (net), CR WHT Payable (whtAmount)
     * توليد certificate number sequentially via numbering.ts
   - generateWHTCertificatePDF(transactionId): PDF عربي/إنجليزي مع رقم شهادة + بيانات المورد + مبلغ + توقيع رقمي
   - generateMonthlyReturn(fiscalPeriodId):
     * aggregate all WHTTransaction in period
     * generate XML بصيغة ZATCA WHT return
     * save to WHTReturn
   - markReturnSubmitted(returnId, zatcaResponse)

3. Saudi Rates (seed data):
   - Royalties: 15%
   - Management/Consultation fees: 20%
   - Technical services: 5%
   - Rent: 5%
   - Dividends: 5%
   - Loans interest: 5%
   - Insurance/Reinsurance: 5%

4. API:
   - GET/POST/PUT /api/finance/wht/rules
   - GET /api/finance/wht/transactions?vendorId&period
   - POST /api/finance/wht/calculate-for-invoice/[invoiceId]
   - GET /api/finance/wht/certificates/[id]/pdf
   - POST /api/finance/wht/returns/generate { fiscalPeriodId }
   - POST /api/finance/wht/returns/[id]/submit-to-zatca

5. UI /finance/wht:
   - Rules tab (CRUD مع جدول حسب البلد والخدمة)
   - Transactions tab (filter + drill down)
   - Certificates tab (تحميل PDF + إعادة إصدار)
   - Returns tab (شهرية + status لـ ZATCA)

6. تكامل:
   - عند payment-run-engine.ts execute: استدعي applyWHTToPayment
   - في purchase-orders/[id]: عرض WHT المتوقع
   - في purchase-invoices: حقل service type على line item

7. Tests: 6 service types × resident/non-resident، monthly XML schema validation
```

---

## F-07 — Bank Statement Import (MT940/CAMT.053/OFX/CSV)

### الحالة الحالية
`src/lib/bank-statement-importer.ts` و `mt940.ts` موجودان ويدعمان MT940 + CSV. **لا CAMT.053 و لا OFX**.

### السيناريو العالمي
المحاسب يحمّل ملف MT940 أو CAMT.053 من بنك. النظام يُحلّل، يحفظ كل سطر، ثم يُشغِّل bank-recon-engine.ts للمطابقة الذكية. السطور غير المطابقة → workbench يدوي.

### فلو البيانات
```
[Upload File] → [Detect Format] → [Parse] → [Save BankStatementLines]
                                                    │
                                                    ▼
                              [Auto-match via bank-recon-engine]
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                   [Matched lines]    [Unmatched lines]
                                   Auto-post JE       → Workbench UI
                                                          ↓
                                                   User clicks "match to..."
                                                          ↓
                                                   Post JE manually
```

### البرومنت الجاهز
```
أضف parsers لـ CAMT.053 و OFX إلى src/lib/bank-parsers/.

1. parsers جديدة:
   - src/lib/bank-parsers/camt-053.ts (ISO 20022 XML)
   - src/lib/bank-parsers/ofx.ts (Open Financial Exchange SGML/XML)
   كل parser يُرجع: { openingBalance, closingBalance, statementDate, currency, lines[] }
   كل line: { valueDate, bookingDate, description, reference, debit, credit, balance, raw }

2. Detection في bank-statement-importer.ts:
   - first 200 chars يقرر الـ format
   - MT940: ":20:" header
   - CAMT: "<Document xmlns="
   - OFX: "<OFX>" or "OFXHEADER:"
   - CSV: comma-separated

3. UI /finance/bank-statements:
   - Drop zone + format picker
   - Preview بعد parse (قابل للتعديل)
   - زر "احفظ + شغّل المطابقة"
   - شاشة workbench للسطور غير المطابقة:
     * sidebar: invoice/expense suggestion
     * زر "match"، "create new expense"، "ignore"

4. اربط بـ bank-recon-engine.ts الموجود (3-stage matching).

5. Tests: 5 ملفات samples (Al Rajhi MT940, NCB CAMT, ANB OFX, mawarid CSV).
```

---

## F-08 — Multi-Book Accounting (IFRS / Tax / Zakat / Management)

### الحالة الحالية
`src/lib/multi-book-engine.ts` موجود. **لا API و لا UI و لا integration مع auto-journal**.

### السيناريو العالمي (NetSuite Multi-Book)
نفس الفاتورة → IFRS book يقيد إيراد فوراً (IFRS 15)، Tax book يقيد عند القبض (cash basis)، Zakat book قد يستبعد فروقات FX. كل تقرير من كتاب مستقل.

### فلو البيانات
```
[Transaction occurs]
        │
        ▼
[auto-journal.ts called]
        │
        ▼
[For each Active Book]
        │
        ├──→ [Apply Book-specific rules]
        │      - IFRS: full accrual
        │      - Tax: cash basis adjustments
        │      - Zakat: exclude FX gain
        │
        ▼
[Post JE per Book to JournalEntry table (with bookId)]
        │
        ▼
[Reports filter by bookId]
```

### البرومنت الجاهز
```
بناء Multi-Book Accounting كامل.

1. Schema:
   AccountingBook {
     id, code (IFRS|TAX|ZAKAT|MGMT|GAAP), name, baseCurrency,
     fiscalYearStart, isPrimary bool, isActive,
     adjustmentRules JSON  -- مثلاً { excludeFXGain: true, cashBasisOnly: false }
   }
   ALTER JournalEntry: ADD bookId (FK to AccountingBook)
   AccountMapping {
     id, sourceBookId, targetBookId, sourceAccountId, targetAccountId, transformRule? JSON
   }

2. Engine src/lib/multi-book-engine.ts (إعادة بناء):
   - postToBooks(jeData, sourceModule):
     * لكل book نشط:
       a) apply book.adjustmentRules
       b) translate accounts via AccountMapping إن لزم
       c) إن book.fiscalYearStart != primary، عدل period
       d) post JE with bookId
   - reconcileBooks(periodId, bookA, bookB): تقرير الفروقات

3. Update src/lib/auto-journal.ts:
   - استبدل كل postEntry calls → postToBooks
   - الـ primary book = يقيد دائماً
   - secondary books تنطبق عليها rules

4. Migration:
   - أنشئ default IFRS book
   - UPDATE existing journal_entries SET bookId = IFRS_book_id

5. API:
   - GET/POST/PUT /api/accounting/books
   - GET/POST /api/accounting/books/[id]/mappings
   - GET /api/accounting/books/[id]/trial-balance?period
   - POST /api/accounting/books/reconcile

6. UI /finance/multi-book:
   - Books tab (CRUD)
   - Mappings tab (drag-drop accounts)
   - Reports per book
   - Reconciliation report (book-to-book differences)

7. Modify reports:
   - balance-sheet/ income-statement/ trial-balance يقبلون bookId param

8. Tests:
   - تأجير معدات: IFRS-16 على IFRS book، تكلفة فقط على Tax book
   - 3 books × depreciation difference (SL vs MACRS vs Zakat skip)
```

---

## F-09 — Component Depreciation + Multi-Book Asset Books (IFRS-16)

### الحالة الحالية
`fixed-assets-engine.ts` يحسب depreciation لكن لا يدعم component depreciation (IAS 16) ولا multi-book.

### السيناريو العالمي (SAP AA)
طائرة شراء تتحلل: هيكل 25 سنة، محركات 8 سنوات، داخل 5 سنوات. كل component له depreciation method منفصل. تقرير مالي مختلف عن tax book.

### فلو البيانات
```
[Asset: Aircraft $50M]
       │
       ▼
[Decompose into Components]
   - Body: $30M / 25 years SL
   - Engines: $15M / 8 years SL
   - Interior: $5M / 5 years SL
       │
       ▼
[For each component → Compute depreciation per book]
   - IFRS book: SL
   - Tax book: MACRS
   - Zakat book: skipped
       │
       ▼
[Post separate JE per component per book]
```

### البرومنت الجاهز
```
أضف Component Depreciation + Multi-Book Asset Books.

1. Schema:
   AssetComponent {
     id, parentAssetId, name, cost Decimal, salvageValue Decimal,
     usefulLifeMonths, depreciationMethod (SL|DDB|SYD|UoP|MACRS),
     bookId, startDate, accumulatedDepreciation, currentNBV,
     status (ACTIVE|DISPOSED|TRANSFERRED)
   }
   AssetBookValue {
     id, assetId, componentId?, bookId, period, openingBV, depreciation, closingBV
   }

2. Engine src/lib/fixed-assets-engine.ts (إضافات):
   - decomposeAsset(parentId, components[]):
     * insert components
     * cost validation: sum(components.cost) ≤ parent.cost
   - runMonthlyDepreciation(period, bookId):
     * لكل component نشط:
       - احسب depreciation حسب method
       - أنشئ AssetBookValue row
       - أنشئ JE per book: DR Depreciation Expense, CR Accumulated Depreciation
   - disposeComponent(componentId, salePrice, date)
   - revalueAsset(assetId, newFairValue, bookId)  -- IAS 16 revaluation model

3. Migration:
   - existing assets → single component (matching parent)
   - existing AccumulatedDepreciation → component.accumulatedDepreciation

4. API:
   - GET /api/fixed-assets/[id]/components
   - POST /api/fixed-assets/[id]/decompose
   - POST /api/fixed-assets/run-depreciation { period, bookId? }
   - POST /api/fixed-assets/[id]/revalue { newFairValue, bookId, date }
   - POST /api/fixed-assets/components/[id]/dispose

5. UI /finance/fixed-assets:
   - Asset detail page → components tab
   - Tree view (parent → components)
   - Per-book NBV side panel
   - "Decompose Asset" wizard
   - "Run Monthly Depreciation" button

6. Tests:
   - aircraft scenario (3 components × 3 books)
   - revaluation IAS 16 (DR Asset, CR OCI/Revaluation Surplus)
   - disposal mid-period (pro-rata)
```

---

## F-10 — Period Close Engine متقدم (Auto Reversals + Retained Earnings + Sub-ledger Reconciliation)

### الحالة الحالية
`src/lib/period-close.ts` يدعم Soft Close + Checklist + Lock. **لا**:
- Auto-Reversals of accruals
- Retained Earnings rollover (year-end)
- Sub-ledger to GL reconciliation step

### فلو البيانات
```
[Period End Trigger]
        │
        ▼
[1. Stop Sub-ledger Postings]
        │
        ▼
[2. Run FX Revaluation]
        │
        ▼
[3. Run Allocations]
        │
        ▼
[4. Run Depreciation]
        │
        ▼
[5. Post Accruals (mark for auto-reverse)]
        │
        ▼
[6. Reconcile Sub-ledgers vs GL]
   - AR sum vs Account 1200
   - AP sum vs Account 2100
   - Inventory sum vs Account 1300
        │
        ▼
[7. If Year-End: Closing Entries]
   - DR all Revenue, CR Income Summary
   - DR Income Summary, CR all Expense
   - DR Income Summary, CR Retained Earnings
        │
        ▼
[8. Soft Close (warning if posted) → Hard Close (locked)]
        │
        ▼
[Day 1 of Next Period: Auto-Reverse Accruals]
```

### البرومنت الجاهز
```
وسّع src/lib/period-close.ts.

1. أضف:
   reconcileSubLedgers(fiscalPeriodId):
   - Compare:
     a) sum(Customer outstanding) vs trial balance Account 1200 (AR)
     b) sum(Vendor outstanding) vs Account 2100 (AP)
     c) sum(Product onHand × cost) vs Account 1300 (Inventory)
   - إن mismatch > tolerance → SubLedgerReconciliationException

2. أضف postYearEndClosingEntries(fiscalPeriodId):
   - SELECT all Revenue accounts (4xxx) → close balances to Income Summary (3900 مثلاً)
   - SELECT all Expense accounts (5xxx) → close balances to Income Summary
   - close Income Summary balance to Retained Earnings (3500)
   - mark all 4xxx + 5xxx with closingFlag=true في الفترة

3. أضف autoReverseAccrualsOnNextPeriod(fiscalPeriodId):
   - find JE with autoReverse=true في الفترة الحالية
   - Day 1 of next period: insert reverse JE

4. update period-close API:
   - POST /api/accounting/period-close/[id]/reconcile (manual trigger)
   - POST /api/accounting/period-close/[id]/year-end-close
   - GET /api/accounting/period-close/[id]/reconciliation-report

5. UI /finance/period-close:
   - Checklist tab (existing)
   - Reconciliation tab: 3 cards (AR, AP, Inventory) → matched/mismatch
   - Year-End Close button (visible only if Dec)
   - Auto-Reverse history

6. Tests:
   - sub-ledger mismatch detection
   - year-end closing (3 revenue + 5 expense → retained earnings)
   - auto-reverse next period
```

---

## F-11 — Customer/Vendor Hierarchy + Multi-Ship-To/Bill-To

### الحالة الحالية
Customer/Vendor models بسيطة. لا parent/sub-customer، لا multi-ship-to/bill-to.

### السيناريو العالمي
شركة "أرامكو" parent → فروع (الرياض، جدة، الدمام). كل فرع له ship-to address، كلهم يستلمون فواتير من Bill-to واحد. تقرير AR aging على parent يجمع الفروع.

### البرومنت الجاهز
```
أضف Hierarchy و Multi-Address:

1. Schema:
   ALTER Customer: ADD parentCustomerId, customerHierarchyType (ROOT|BRANCH|DEPT)
   ALTER Vendor: نفس الشيء
   CustomerAddress { id, customerId, type (BILL_TO|SHIP_TO|HQ), name, line1, line2, city, region, postalCode, country, isPrimary }
   VendorAddress: similar

2. Update Sales Invoice:
   - حقلين: billToAddressId و shipToAddressId
   - default: customer.primaryBillTo و primaryShipTo
   - lookup مع filter حسب customer

3. Reports:
   - AR aging يدعم rollup (parent يجمع subs)
   - Customer statement يدعم mode: branch-only vs consolidated

4. UI:
   - Customer detail → Tab "Branches/Hierarchy"
   - Customer detail → Tab "Addresses" (CRUD)
   - في Sales Invoice form: dropdowns ship-to/bill-to
   - Aging report: toggle "Roll up to parent"

5. Migration: existing customers → ROOT level، single address from current fields
```

---

## F-12 — Recurring Journal Entries + Templates + Auto-Reverse

### الحالة الحالية
`src/lib/recurring-journal-runner.ts` موجود لكن محدود. لا UI للقوالب، لا auto-reverse للـ accruals، لا formulas (مثل {prevMonthSales}).

### البرومنت الجاهز
```
وسّع Recurring JE.

1. Schema:
   JournalTemplate {
     id, name, description, frequency (DAILY|WEEKLY|MONTHLY|QUARTERLY|YEARLY|MANUAL),
     nextRunDate, endDate?, autoReverse bool, isActive, createdBy
   }
   JournalTemplateLine {
     id, templateId, accountId, costCenterId?, description,
     debitFormula String?, creditFormula String?,
     -- صيغ: {fixed:1000} | {prevMonthRevenue} | {pct:5,account:6100}
   }

2. Formula evaluator في runner:
   - {fixed:N}: قيمة ثابتة
   - {prevMonthRevenue}: sum revenue accounts في prev month
   - {pct:X,account:Y}: X% من رصيد account Y الحالي
   - {var:cellName}: lookup variable من JournalTemplateVariable

3. Cron daily: يقرأ كل templates active حيث nextRunDate ≤ today → ينفّذ JE → يحسب nextRunDate

4. UI /finance/recurring-je:
   - Templates list
   - Template editor: lines + formula builder
   - Preview JE قبل save
   - Variables tab
   - History tab (last 10 runs)

5. Auto-reverse: عند autoReverse=true → reversal JE في 1st day of next period

6. API:
   - CRUD /api/accounting/journal-templates
   - POST /api/accounting/journal-templates/[id]/run (manual)
   - GET /api/accounting/journal-templates/[id]/preview

7. Tests: monthly accrual auto-reverse، formula {pct:5,account:6100}
```

---

## F-13 — Cost Allocation متقدم (Step-down + Reciprocal + Cascading)

### الحالة الحالية
`allocation-engine.ts` skeleton. لا step-down و لا reciprocal و لا basis متعددة.

### البرومنت الجاهز
```
أعد بناء src/lib/allocation-engine.ts.

1. Schema:
   AllocationRule {
     id, name, sourceAccountId?, sourceCostCenterId?,
     basisType (FIXED_PCT|HEADCOUNT|REVENUE|SQFT|MACHINE_HOURS|CUSTOM_QUERY),
     basisQuery? String,  -- للـ CUSTOM
     priority int,  -- ترتيب التنفيذ (cascading)
     isActive
   }
   AllocationTarget { id, ruleId, targetCostCenterId, percentage Decimal?, customWeight? }
   AllocationRun { id, ruleId, fiscalPeriodId, runAt, journalEntryId?, sourceAmount, status }

2. Methods:
   - DIRECT: source CC → target CCs بنسب fixed
   - STEP-DOWN: 
     * sort rules by priority
     * Service CC #1 → distribute to CCs #2-N (يشمل service CC #2)
     * Service CC #2 → distribute (يشمل service CC #3+)
     * نهائياً: only operational CCs لها balances
   - RECIPROCAL (matrix):
     * solve linear equations: each service CC distributes to all (including other services)
     * use Gaussian elimination (3-5 service CCs typical)

3. Bases:
   - FIXED_PCT: target.percentage مباشرة
   - HEADCOUNT: count(employees per CC)
   - REVENUE: sum(revenue lines per CC) في الفترة
   - SQFT: من custom field على CC
   - MACHINE_HOURS: من manufacturing data

4. Engine:
   - simulateAllocation(ruleId, period): preview without posting
   - runAllocation(ruleId, period, userId): post JE
   - runAllAllocations(period, mode: DIRECT|STEP_DOWN|RECIPROCAL): cascading

5. JE format:
   - DR: target cost centers (multiple lines)
   - CR: source cost center (single)
   - posting via auto-journal source='COST_ALLOCATION'

6. UI /finance/allocations:
   - Rules grid (drag-drop priority)
   - Rule editor: source + basis + targets (drag pct sliders)
   - Simulate button → JE preview
   - Run button → execute
   - History tab

7. Tests:
   - 3 service CCs × step-down
   - 2 reciprocal CCs (matrix solve)
   - basis HEADCOUNT recalculation when employees change
```

---

## F-14 — IFRS 15 Revenue Recognition متقدم (Performance Obligations + Milestones)

### الحالة الحالية
`revenue-recognition.ts` بسيط (straight-line + point-in-time). لا performance obligations متقدمة، لا milestone-based recognition.

### البرومنت الجاهز
```
وسّع revenue-recognition.ts.

1. Schema:
   RevenueArrangement {
     id, customerId, salesOrderId?, contractValue, currency,
     startDate, endDate, transactionPriceAllocationMethod (RELATIVE_SSP|RESIDUAL),
     status
   }
   PerformanceObligation {
     id, arrangementId, name, allocatedAmount,
     standalonePrice,  -- SSP
     recognitionMethod (POINT_IN_TIME|STRAIGHT_LINE|PERCENT_COMPLETE|MILESTONE|UNITS_DELIVERED),
     startDate, endDate, totalUnits?, isDistinct bool,
     status (PENDING|IN_PROGRESS|SATISFIED)
   }
   Milestone {
     id, obligationId, name, percentage, plannedDate, actualDate?, status
   }
   RevenueSchedule {
     id, obligationId, period, recognizedAmount, journalEntryId, runAt
   }

2. Engine:
   allocateTransactionPrice(arrangementId):
     * sum SSPs
     * each obligation.allocatedAmount = (SSP / totalSSP) × contractValue
   
   generateRecognitionSchedule(obligationId):
     * POINT_IN_TIME: single entry on satisfaction date
     * STRAIGHT_LINE: monthly across (start..end)
     * PERCENT_COMPLETE: based on cost-to-cost ratio
     * MILESTONE: amount × milestone.percentage on actualDate
     * UNITS_DELIVERED: amount × deliveredUnits / totalUnits
   
   runMonthlyRecognition(period):
     * pour each obligation, find scheduled amount
     * post JE: DR Deferred Revenue, CR Revenue (per cost center)

3. API:
   - CRUD /api/accounting/revenue/arrangements
   - POST /api/accounting/revenue/arrangements/[id]/satisfy-obligation/[oblId]
   - POST /api/accounting/revenue/milestones/[id]/complete
   - POST /api/accounting/revenue/run-monthly

4. UI /finance/revenue:
   - Arrangements list (active contracts)
   - Arrangement detail: obligations + milestones + schedule
   - Manual satisfaction button (for POINT_IN_TIME)
   - Monthly run + drill-down

5. Tests:
   - Software contract: license (POINT) + maintenance (STRAIGHT 12m) + impl (MILESTONE 4 stages)
   - Real-time SSP recalc
   - mid-period contract modification (re-allocation)
```

---

## F-15 — Lessor Accounting + Lease Modification

### الحالة الحالية
`lease-accounting-engine.ts` يدعم Lessee فقط. لا Lessor، لا modification، لا short-term/low-value exemption.

### البرومنت الجاهز
```
وسّع lease-accounting-engine.ts.

1. Schema:
   ALTER LeaseContract: ADD leaseRole (LESSEE|LESSOR_OPERATING|LESSOR_FINANCE),
     residualValueGuarantee?, unguaranteedResidual?
   LeaseModification {
     id, contractId, modificationDate, modType (TERM_EXTENSION|SCOPE_CHANGE|PAYMENT_CHANGE|TERMINATION),
     oldRouAsset, newRouAsset, oldLiability, newLiability, journalEntryId
   }

2. Engine extensions:
   - Operating Lessor: monthly straight-line rental income
     * DR Bank/Customer, CR Rental Income
   - Finance Lessor:
     * DR Lease Receivable (PV of payments + unguaranteed residual)
     * CR Asset (derecognize)
     * recognize Selling Profit/Loss
     * monthly: DR Bank, CR Lease Receivable + Interest Income
   - Sub-lease:
     * evaluate: head-lease ROU treatment (finance vs operating)
     * sub-lease: separate accounting based on classification
   - modifyLease(contractId, changes):
     * remeasure liability with new rate
     * adjust ROU asset
     * post JE for difference
   - terminateLease(contractId, terminationFee?):
     * derecognize ROU asset and Liability
     * post gain/loss

3. Short-term/Low-value exemption:
   - if lease term ≤ 12 months OR underlying asset value ≤ $5000 (configurable):
     * skip ROU/Liability
     * just expense rental payments

4. API:
   - POST /api/accounting/leases/[id]/modify
   - POST /api/accounting/leases/[id]/terminate
   - POST /api/accounting/leases/[id]/sub-lease

5. Tests:
   - operating lessor: 12 months rental
   - finance lessor: present value calculation, selling profit
   - sub-lease: head-lease finance + sub-lease operating
   - modification: term extension increases lease liability
```

---

# ملخص فجوات المالية الـ 15

| # | الفجوة | الأولوية | الجهد |
|---|------|------|------|
| F-01 | FX Revaluation حقيقي | 🔴 | متوسط |
| F-02 | Payment Run Engine | 🔴 | كبير |
| F-03 | Dunning Engine | 🔴 | كبير |
| F-04 | IFRS 9 ECL | 🟠 | كبير |
| F-05 | Customer/Vendor Statement PDF | 🔴 | متوسط |
| F-06 | WHT كامل + Certificates + Returns | 🟠 | متوسط |
| F-07 | Bank Statement Import (CAMT/OFX) | 🟠 | صغير |
| F-08 | Multi-Book Accounting | 🟠 | كبير |
| F-09 | Component Depreciation | 🟡 | متوسط |
| F-10 | Period Close متقدم | 🟠 | متوسط |
| F-11 | Customer/Vendor Hierarchy | 🟡 | صغير |
| F-12 | Recurring JE + Auto-Reverse | 🟡 | صغير |
| F-13 | Cost Allocation متقدم | 🟡 | متوسط |
| F-14 | IFRS 15 Revenue متقدم | 🟡 | كبير |
| F-15 | Lessor Accounting | 🟡 | كبير |
