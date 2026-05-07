# 02 — الفجوات العالمية P0 + P1

> 84 بنداً عالي الأولوية. كل بند: تعريف + جداول + فورمات + برومنت + سيناريو + فلو بيانات.
> الترتيب: P0 أولاً (22 بند)، ثم P1 (62 بند).

---

# 🔴 الجزء الأول — P0 (Critical)

## P0-01 · Cash Position & Liquidity Planning — مركز النقد والتخطيط للسيولة

**موجود في:** SAP Cash Mgmt, Oracle Cash Mgmt, NetSuite Cash 360, Dynamics
**لماذا حرج:** الخزانة تستخدم Excel اليوم. لا يمكن الإجابة "كم سيولتنا الآن عبر كل البنوك بكل العملات؟"

### الجداول المطلوبة (Prisma)

```prisma
model CashPositionSnapshot {
  id           String   @id @default(cuid())
  tenantId     String
  capturedAt   DateTime
  totalCashSAR Decimal  @db.Decimal(18,4)
  bankCount    Int
  data         Json     // {bankAccountId, balance, currency, sarEquivalent}[]
  @@index([tenantId, capturedAt])
}

model LiquidityForecast {
  id          String   @id @default(cuid())
  tenantId    String
  scenarioId  String
  forecastDate DateTime
  weekNumber  Int      // 1..13
  category    String   // AR_INFLOW | AP_OUTFLOW | PAYROLL | CAPEX | LOAN | TAX
  expectedAmount Decimal @db.Decimal(18,4)
  actualAmount   Decimal? @db.Decimal(18,4)
  varianceAmount Decimal? @db.Decimal(18,4)
  notes       String?
  @@index([tenantId, forecastDate])
}

model LiquidityScenario {
  id        String   @id @default(cuid())
  tenantId  String
  name      String   // "Base", "Stress", "Best"
  weights   Json     // adjustments per category
  createdBy String
  createdAt DateTime @default(now())
}
```

### الفورمات والأزرار والقوائم

- **شاشة "Cash Position Today"** — gauge للرصيد الكلي + جدول البنوك (اسم البنك / الفرع / الرقم / الرصيد / العملة / المعادل ر.س.) + Pie chart بالعملات + Bar chart بالشركات.
- **أزرار:** `Refresh Now`، `Snapshot & Save`، `Export to Excel`، `View by Entity`، `View by Currency`.
- **شاشة "13-Week Forecast"** — جدول خطي 13 عمود (أسابيع) × صفوف (Inflow/Outflow categories)، خانة Net، Cumulative Cash، صف Min Required.
- **أزرار:** `Generate Forecast` (يسحب من AR/AP/Payroll تلقائياً)، `Run Scenario`، `Compare Scenarios`، `Lock Forecast`، `Export PDF`.
- **قائمة Scenarios** — Base/Stress/Best مع زر `Clone`، `Edit Weights`.

### برومنت جاهز (انسخه)

```
/erp-build-feature cash-position-liquidity

أنشئ موديول "Cash Position & Liquidity Planning" بمعمارية:

1. Schema: أضف 3 جداول (CashPositionSnapshot, LiquidityForecast, LiquidityScenario)
   كما هو محدد في AUDIT_2026_05_07/02_GLOBAL_GAPS_P0_P1.md → P0-01

2. APIs:
   - POST /api/treasury/cash-position/snapshot — يحسب رصيد كل BankAccount × ExchangeRate الحالي → يحفظ snapshot
   - GET /api/treasury/cash-position?asOf=date — يرجع آخر snapshot أو يحسب لحظياً
   - POST /api/treasury/liquidity/forecast/generate — يسحب من:
     * AR open invoices (حسب dueDate)
     * AP open invoices (حسب paymentTerms)
     * Payroll schedule
     * Loan amortization
     * Recurring expenses
     ويولد 13 صف أسبوعي حسب category
   - POST /api/treasury/liquidity/scenarios — CRUD السيناريوهات
   - GET /api/treasury/liquidity/forecast?scenarioId — رؤية السيناريو

3. Frontend: 
   - src/app/(dashboard)/treasury/cash-position/page.tsx — Live cash position
   - src/app/(dashboard)/treasury/liquidity/page.tsx — 13-week forecast
   - استخدم Recharts للرسوم البيانية
   - زر تحديث كل 5 دقائق تلقائياً

4. Cron: snapshot يومي تلقائي عبر /api/cron/treasury-snapshot

5. تكامل مع Saudi banks: استخدم settings/exchange-rates للعملات
```

### سيناريو عمل (User Scenario)

**الممثل:** أمين الخزانة (Treasurer).
**الصباح 8:00 ص:** يفتح "Cash Position" — يرى رصيد إجمالي 12,400,000 ر.س. عبر 8 حسابات بنكية (Al Rajhi 4M، SNB 3M، Riyad 2M، حسابات USD = 1.2M USD ≈ 4.5M ر.س.). يلاحظ نقصاً في Al Bilad → يضغط "Snapshot & Save" للأرشفة.
**9:30 ص:** يفتح "13-Week Forecast" → يرى أن الأسبوع الرابع لديه عجز 800K بسبب دفعة الرواتب + مستحق ZATCA. يضغط "Run Scenario: Stress" → يكتشف أن إيرادات أحد العملاء الكبار مؤجلة 30 يوماً → العجز يصبح 2.1M.
**القرار:** يطلب من المسؤول سحب 1.5M من Murabaha facility الأسبوع القادم. يضغط `Lock Forecast` ويرسل للـ CFO.

### فلو البيانات (Data Flow)

```
Snapshot Daily Cron (00:00)
    ↓
For each BankAccount → fetch latest balance (from BankStatement.lastBalance OR Treasury.cashBalance)
    ↓
For each balance → ExchangeRate.lookupRate(currency, SAR, today) → sarEquivalent
    ↓
INSERT CashPositionSnapshot(totalCashSAR, data[])
    ↓
Dashboard reads via GET /api/treasury/cash-position (cached 5 min)

Forecast Generation:
User triggers POST /api/treasury/liquidity/forecast/generate
    ↓
For week 1..13:
  - Pull AR.OpenInvoices WHERE dueDate IN week → INFLOW
  - Pull AP.OpenInvoices WHERE expectedPayment IN week → OUTFLOW
  - Pull Payroll.Schedule WHERE periodEnd IN week → OUTFLOW
  - Pull LoanSchedule WHERE installmentDate IN week → OUTFLOW
  - Pull RecurringExpenses → OUTFLOW
    ↓
INSERT LiquidityForecast rows (one per category per week)
    ↓
Compute cumulative + min required → flag negative weeks
    ↓
Frontend renders Recharts BarChart + Threshold line
```

---

## P0-02 · Group Reporting / IFRS Consolidation Engine — التوحيد المالي IFRS

**موجود في:** SAP Group Reporting, Oracle FCCS, NetSuite Adv. Financials, OneStream
**لماذا حرج:** الشركات المُدرجة في تداول مُلزمة بإعداد قوائم مالية موحدة وفق IFRS ربعياً. النظام الحالي يجمع الأرقام لكن لا يقوم بـ eliminations حقيقية.

### الجداول المطلوبة

```prisma
model ConsolidationGroup {
  id           String @id @default(cuid())
  tenantId     String
  name         String
  parentEntityId String
  reportingCurrency String // SAR
  consolidationMethod String // FULL | PROPORTIONAL | EQUITY
  effectiveFrom DateTime
  effectiveTo   DateTime?
  members      ConsolidationMember[]
}

model ConsolidationMember {
  id              String @id @default(cuid())
  groupId         String
  entityId        String
  ownership       Decimal @db.Decimal(7,4) // 0.7500
  consolidationMethod String // FULL | PROPORTIONAL | EQUITY
  acquisitionDate DateTime
  group           ConsolidationGroup @relation(fields: [groupId], references: [id])
}

model EliminationRule {
  id          String @id @default(cuid())
  tenantId    String
  groupId     String
  ruleName    String
  ruleType    String // INTERCOMPANY_AR_AP | INTERCOMPANY_REVENUE_COGS | INVESTMENT_EQUITY | UNREALIZED_PROFIT
  sourceAccount String
  targetAccount String
  formula     String  // expression
  isActive    Boolean @default(true)
}

model ConsolidationRun {
  id           String @id @default(cuid())
  tenantId     String
  groupId      String
  periodId     String
  status       String // DRAFT | IN_PROGRESS | COMPLETED | LOCKED
  startedAt    DateTime
  completedAt  DateTime?
  trialBalanceData Json
  eliminations Json
  ctaAdjustments Json // Currency Translation Adjustments
  minorityInterest Decimal? @db.Decimal(18,4)
  totalAssets    Decimal? @db.Decimal(18,4)
  totalLiabilities Decimal? @db.Decimal(18,4)
  totalEquity    Decimal? @db.Decimal(18,4)
}
```

### الفورمات والأزرار والقوائم

- **شاشة "Consolidation Setup"** — قائمة الـ Groups + إضافة Member (Entity, Ownership %, Method) + شجرة هرمية للمجموعة.
- **شاشة "Elimination Rules"** — قائمة قواعد ال elimination + Rule designer (Source Account → Target Account → Formula).
- **شاشة "Consolidation Run"** — اختيار Group + Period + زر `Run Consolidation` يعرض:
  1. **Step 1:** Trial Balances per entity (كل شركة عمود)
  2. **Step 2:** Currency Translation (CTA الناتج)
  3. **Step 3:** Eliminations (جدول قبل/بعد لكل قاعدة)
  4. **Step 4:** Minority Interest calculation
  5. **Step 5:** Consolidated Statements (BS, IS, CF)
- **أزرار:** `Run`, `Lock`, `Reverse`, `Export Pack` (PDF + XBRL لـ Tadawul), `Audit Trail`.

### برومنت جاهز

```
/erp-build-feature group-consolidation

ابن محرك Group Reporting/IFRS Consolidation كامل:

1. Schema: 4 جداول (ConsolidationGroup, ConsolidationMember, EliminationRule, ConsolidationRun)

2. APIs:
   - POST /api/finance/consolidation/groups — CRUD المجموعات
   - POST /api/finance/consolidation/eliminations — CRUD قواعد الإلغاء
   - POST /api/finance/consolidation/run — يشغل التوحيد:
     Step 1: pull TB لكل entity في الفترة
     Step 2: translate كل entity للعملة الأم (closing rate للـ BS, average rate للـ IS) → CTA → Equity
     Step 3: apply elimination rules (intercompany AR/AP, revenue/COGS, investment/equity)
     Step 4: calculate minority interest = (1 - ownership) * NetIncome
     Step 5: assemble consolidated FS
   - POST /api/finance/consolidation/run/:id/lock — قفل النتيجة
   - GET /api/finance/consolidation/run/:id/audit-trail — تتبع كل خطوة

3. Frontend:
   - src/app/(dashboard)/finance/consolidation/page.tsx — Dashboard
   - src/app/(dashboard)/finance/consolidation/setup/page.tsx — Groups
   - src/app/(dashboard)/finance/consolidation/eliminations/page.tsx — Rules
   - src/app/(dashboard)/finance/consolidation/run/[id]/page.tsx — Run details with 5-step wizard
   - استخدم MultiStepForm pattern

4. تأكد من توازن الـ TB المُوحدة (Debit = Credit)

5. اربط بـ FxRevaluation للسعر اليومي
```

### سيناريو عمل

**الممثل:** المدير المالي للمجموعة.
**نهاية الربع:** يفتح Consolidation. لديه 3 شركات: مصنع رياض (100%)، شركة دبي تجارية (USD، 100%)، استثمار 30% في شركة ثالثة.
1. يضغط `Run Consolidation` للربع.
2. النظام يسحب TB من 3 شركات.
3. يترجم بيانات دبي بسعر نهاية الفترة → CTA = 250K ر.س. خسارة ترجمة → تذهب لـ OCI.
4. يطبق elimination: المصنع باع لدبي 5M → يلغي AR/AP ويلغي Revenue/COGS.
5. الشركة الثالثة (30%): تطبق Equity method — يأخذ 30% × صافي ربحها (1.2M = 360K) + investment.
6. النتيجة: قائمة موحدة → 45M Total Assets، 32M Equity، 13M Liabilities.
7. يضغط `Export Pack` → PDF ملوّن + XBRL جاهز لرفعه على Tadawul.

### فلو البيانات

```
User triggers POST /api/finance/consolidation/run
    ↓
prisma.$transaction:
  1. Read ConsolidationGroup + Members
  2. For each Member entity:
     - getTrialBalance(entityId, periodId) → Map<account, {debit, credit}>
     - if currency != reporting: translate (BS@ClosingRate, IS@AvgRate)
     - record CTA adjustment
  3. Sum all entities → unconsolidated TB
  4. For each EliminationRule:
     - eval formula on data
     - generate elimination journal entries
     - apply to TB
  5. For each non-100% Member:
     - calculate minority interest = (1 - ownership) × postElimEquity
     - reduce equity by minority share, create MI line
  6. Compute consolidated BS, IS, CF
  7. INSERT ConsolidationRun with full trace
    ↓
Frontend renders 5-step wizard with drill-down on each line
```

---

## P0-03 · Available-to-Promise (ATP) at Order Entry — وعد التسليم الفوري

**موجود في:** SAP aATP, Oracle GOP, Dynamics
**لماذا حرج:** مندوب المبيعات يَعِد العميل بتاريخ تسليم بدون التحقق من المخزون + Inbound + Production. عواقبها: تعهدات مكسورة، عملاء غاضبون.

### الجداول المطلوبة

```prisma
model AtpRule {
  id           String @id @default(cuid())
  tenantId     String
  productId    String?  // null = default
  warehouseId  String?
  bufferDays   Int      // safety buffer
  considerInbound Boolean @default(true)
  considerProduction Boolean @default(true)
  considerAllocations Boolean @default(true)
  alternateWarehouses Json? // [warehouseId, priority]
  active       Boolean @default(true)
}

model AtpCheck {
  id           String @id @default(cuid())
  tenantId     String
  productId    String
  requestedQty Decimal @db.Decimal(18,4)
  requestedDate DateTime
  warehouseId  String
  result       Json    // {available, dates: [{date, qty, source}], suggestion}
  createdBy    String
  createdAt    DateTime @default(now())
}
```

### الفورمات والأزرار والقوائم

- **في شاشة "إنشاء طلب بيع":** عند إضافة بند:
  - `Check ATP` button بجانب الكمية + التاريخ المطلوب.
  - **Popup ATP Result:** جدول 4 أعمدة (التاريخ / الكمية المتاحة / المصدر "On-hand/Inbound/Production" / Cumulative).
  - زر `Promise This Date`، `Choose Alternative Warehouse`، `Split Shipment`.
  - في حالة عدم توفر: زر `Create Back-order` + `Trigger PR` + `Notify Customer`.

### برومنت جاهز

```
/erp-build-feature atp-engine

ابن محرك ATP عند إنشاء أمر البيع:

1. Schema: AtpRule + AtpCheck

2. APIs:
   - POST /api/sales/atp/check
     Input: {productId, qty, requestedDate, warehouseId, customerId}
     Logic:
       a. Get current Stock (qty available, qty allocated)
       b. Pull inbound POs not yet received: GRN expected dates
       c. Pull Manufacturing Orders in progress with ETA
       d. Apply allocations to other open SOs
       e. Apply buffer days from AtpRule
       f. Check alternate warehouses if shortage
     Output: {
       canPromise: boolean,
       suggestedDate: Date,
       breakdown: [{date, source, qty}],
       alternativeWarehouses: [{whId, qty, leadTime}]
     }

3. Frontend integration:
   - عند إنشاء SO → عند إضافة line item → استدعِ ATP تلقائياً
   - اعرض Popup مع breakdown
   - في حالة شح المخزون: زر "Trigger PR" يفتح PurchaseRequisition جاهزة

4. Cache ATP لمدة 30 ثانية لتجنب الضرب المتكرر

5. ربط مع Available Stock + InTransit + ProductionPlan
```

### سيناريو عمل

**الممثل:** مندوب المبيعات Ahmed.
**الموقف:** عميل يطلب 500 وحدة من Product X بتاريخ 2026-05-20.
1. يفتح SO جديد، يضيف Product X، الكمية 500، التاريخ 2026-05-20.
2. زر `Check ATP` يضغط تلقائياً.
3. النظام يعرض:
   - On-hand اليوم: 200 ✓
   - Inbound PO PO-2310 وصول 2026-05-15: +400 ✓
   - أمر تشغيل MO-559 جاهز 2026-05-25: +300
   - **Total Available 2026-05-20: 600 → نعم يمكن الوعد بـ 500**
4. لكن لو طلب التاريخ 2026-05-12: المتاح فقط 200 → يقترح:
   - `Promise 200 on 05-12 + 300 on 05-15` (split)
   - `Backorder 500 → all on 05-15`
   - `Source from Jeddah warehouse` (450 متاح)
5. أحمد يختار Split → SO يُحفظ بـ 2 lines مع تواريخ مختلفة.

### فلو البيانات

```
User adds line to SalesOrder
    ↓
Auto-trigger POST /api/sales/atp/check
    ↓
Engine pulls in parallel:
  - SELECT SUM(qty - allocated) FROM Stock WHERE productId, warehouseId
  - SELECT poId, expectedDate, qty FROM PurchaseOrder WHERE productId AND status = OPEN
  - SELECT moId, completionDate, qty FROM ManufacturingOrder WHERE productId AND status IN_PROGRESS
  - SELECT date, qty FROM SalesOrderDetail WHERE productId AND deliveryDate < requestedDate AND status NOT_FULFILLED
    ↓
Build availability timeline by date
    ↓
Compare against requestedQty + bufferDays
    ↓
If shortage: query alternate warehouses
    ↓
Return result with suggestions
    ↓
SO line is saved only after ATP confirmation
```

---

## P0-04 · AP Invoice Capture (OCR + AI Match) — أتمتة فواتير الموردين

**موجود في:** SAP Document Information Extraction, Oracle IDR, Tipalti, Bill.com
**لماذا حرج:** فريق AP يدخل فواتير يدوياً → بطء + أخطاء. الفواتير الواردة لا تُطابق تلقائياً مع PO/GRN. مع ZATCA Phase 2 يمكن للفواتير أن تصل عبر API.

### الجداول المطلوبة

```prisma
model InvoiceCapture {
  id          String @id @default(cuid())
  tenantId    String
  source      String // EMAIL | UPLOAD | ZATCA_API | EDI
  fileUrl     String
  ocrRawText  String?
  extractedData Json  // {vendor, vatNumber, invoiceNo, date, total, lines: [...]}
  matchStatus String // PENDING | MATCHED_PO | MATCHED_GRN | EXCEPTION | POSTED
  matchedPoId String?
  matchedGrnId String?
  exceptionReason String?
  confidence  Float  // 0.0 - 1.0
  reviewedBy  String?
  postedAsInvoiceId String?
  createdAt   DateTime @default(now())
}

model OcrTrainingData {
  id          String @id @default(cuid())
  tenantId    String
  vendorId    String
  template    Json   // field positions/regex
  accuracy    Float
}
```

### الفورمات والأزرار والقوائم

- **شاشة "Invoice Capture Inbox"** — قائمة الفواتير الواردة + Filters (Source, Status, Confidence) + Bulk Actions.
- **شاشة Detail:** صورة الفاتورة على اليمين + Form فيه الحقول المستخرجة على اليسار + جدول المنتجات + قسم Match Status.
- **أزرار:** `Approve & Post`، `Reject`، `Match to PO`، `Manual Edit`، `Train OCR for this vendor`.
- **زر AI:** `Suggest GL Coding` (يستخدم vendor history + line description).

### برومنت جاهز

```
/erp-build-feature ap-invoice-capture

ابن محرك AP Invoice Capture:

1. Schema: InvoiceCapture + OcrTrainingData

2. APIs:
   - POST /api/ap/capture/upload — يستقبل PDF/JPG → يخزن → يستدعي OCR
   - POST /api/ap/capture/email-webhook — webhook لـ inbound email parser
   - POST /api/ap/capture/zatca-inbound — webhook لـ ZATCA Phase 2 incoming
   - POST /api/ap/capture/:id/match — يحاول matching تلقائياً مع:
     a. Vendor (fuzzy match على VAT number ثم اسم)
     b. PO (exact PO# في النص أو via fuzzy match على total)
     c. GRN (إذا في PO ولديه GRN)
   - POST /api/ap/capture/:id/post — يحول إلى PurchaseInvoice حقيقية
   - POST /api/ap/capture/:id/train — يحفظ تصحيحات للـ vendor template

3. OCR Integration:
   - استخدم Gemini Vision API لاستخراج الحقول
   - Prompt محدد: "Extract: vendor name, VAT, invoice #, date, total, VAT amount, line items (desc, qty, price, total)"
   - Confidence score من الـ model

4. Frontend:
   - src/app/(dashboard)/ap/capture/page.tsx — Inbox
   - src/app/(dashboard)/ap/capture/[id]/page.tsx — Side-by-side review
   - استخدم react-pdf لعرض PDF
   - زر "Post" يستدعي auto-journal logic

5. Auto-routing:
   - Confidence > 0.95 + matched PO + within tolerance → auto-post
   - Confidence 0.7-0.95 → review queue
   - Confidence < 0.7 → manual entry queue
```

### سيناريو عمل

**الممثل:** Sara، AP Clerk.
**الصباح:** تفتح "Invoice Capture Inbox" → 23 فاتورة جديدة (8 بريد، 12 ZATCA API، 3 رفع يدوي).
1. **15 فاتورة** auto-matched بـ POs (confidence > 95%) → تظهر بحالة Ready to Post → تضغط `Bulk Post`.
2. **5 فواتير** بحالة Exception:
   - 3 منها: المبلغ يختلف عن PO بـ 50 ر.س. (ضمن 2% tolerance) → تضغط `Approve Variance`.
   - 1 منها: vendor جديد لم يُسجل → تضغط `Create Vendor` (form يفتح بالبيانات المستخرجة).
   - 1 منها: PO# غير موجود → تضغط `Match Manually` تختار PO صحيح.
3. **3 فواتير** بحالة Low Confidence → تفتحها يدوياً، ترى الـ PDF + الحقول، تصحح خطأين، تضغط `Train OCR for this vendor` ليتعلم.
4. النتيجة: 23 فاتورة في 30 دقيقة بدلاً من 4 ساعات.

### فلو البيانات

```
Inbound (Email | Upload | ZATCA API)
    ↓
POST /api/ap/capture/upload → store file in /uploads/invoices/{id}.pdf
    ↓
Async job: send to Gemini Vision OCR
    ↓
Parse extracted JSON → INSERT InvoiceCapture(extractedData, confidence)
    ↓
Auto-match attempt:
  1. SELECT Vendor WHERE vatNumber = extracted.vat OR fuzzy(name)
  2. IF vendorId: SELECT PurchaseOrder WHERE vendorId AND poNo = extracted.poNo
  3. IF po: SELECT GRN WHERE poId = po.id AND status = RECEIVED
  4. Compare totals within tolerance
    ↓
UPDATE InvoiceCapture SET matchStatus, matchedPoId, matchedGrnId
    ↓
User reviews → POST /api/ap/capture/:id/post
    ↓
prisma.$transaction:
  - INSERT PurchaseInvoice (using auto-journal.ts)
  - DR Inventory/Expense, CR Vendor Payable, DR Input VAT
  - Link PI to original captured doc (audit trail)
  - UPDATE InvoiceCapture.status = POSTED
```

---

## P0-05 · Manufacturing Execution System (Shop Floor Terminal) — تنفيذ التصنيع

**موجود في:** SAP Digital Mfg, Oracle MES, Dynamics Shop Floor, Odoo MRP Workcenter
**لماذا حرج:** بيانات الإنتاج تُسجل بأثر رجعي في Excel، WIP ليس آنياً، عمالة ومحطات لا تُتبع. مطلوب لـ IKTVA من Aramco.

### الجداول

```prisma
model ShopFloorSession {
  id           String @id @default(cuid())
  tenantId     String
  workCenterId String
  operatorId   String
  manufacturingOrderId String
  operationId  String  // step in routing
  startedAt    DateTime
  pausedAt     DateTime?
  completedAt  DateTime?
  goodQty      Decimal? @db.Decimal(18,4)
  scrapQty     Decimal? @db.Decimal(18,4)
  scrapReason  String?
  downtimeMinutes Int?
  downtimeReason String?
  status       String // ACTIVE | PAUSED | COMPLETED | ABANDONED
}

model AndonCall {
  id           String @id @default(cuid())
  tenantId     String
  workCenterId String
  callType     String // MATERIAL | MAINTENANCE | QUALITY | SUPERVISOR
  calledBy     String
  calledAt     DateTime
  respondedBy  String?
  respondedAt  DateTime?
  resolvedAt   DateTime?
  resolutionNote String?
}
```

### الفورمات والأزرار

- **Touchscreen UI** للعامل (kiosk mode):
  - عرض Operations المُسندة لمحطة العمل اليوم
  - Big buttons: `Start`، `Pause`، `Complete`، `Scrap`، `Andon - Material`، `Andon - QC`، `Andon - Supervisor`
  - نموذج Scrap Entry (Qty + Reason dropdown)
  - عرض Work Instructions (PDF/فيديو)
  - Barcode scanner لـ Material Issue
  - Quality Capture (QC checkpoints inline)

### برومنت جاهز

```
/erp-build-feature shop-floor-terminal

ابن MES Operator Terminal:

1. Schema: ShopFloorSession, AndonCall

2. APIs:
   - POST /api/manufacturing/shopfloor/start — يبدأ session
   - POST /api/manufacturing/shopfloor/pause
   - POST /api/manufacturing/shopfloor/complete — يرسل good/scrap qty
   - POST /api/manufacturing/shopfloor/andon — يطلق إنذار
   - POST /api/manufacturing/shopfloor/andon/:id/respond — supervisor response
   - GET /api/manufacturing/shopfloor/operator/:id/today — مهام اليوم
   - يكامل مع MO state machine + auto-journal للـ scrap

3. Frontend (kiosk mode):
   - src/app/(dashboard)/shopfloor/page.tsx — login by employee badge
   - src/app/(dashboard)/shopfloor/operations/page.tsx — list of ops
   - src/app/(dashboard)/shopfloor/operations/[id]/page.tsx — large UI
   - استخدم Tailwind classes: text-4xl للأزرار
   - touch-friendly (min 80px height للأزرار)
   - استخدم QR/Barcode reader

4. Real-time:
   - استخدم WebSocket لإرسال updates لـ supervisor dashboard
   - andon dashboard يعرض live calls

5. Integration with auto-journal:
   - عند Complete → auto-journal لمنتج تام + WIP relief
   - عند Scrap → auto-journal لخسارة الإنتاج
```

### سيناريو عمل

**الممثل:** عامل CNC اسمه Ali.
1. يصل للمحطة 7:00 ص، يمسح badge → يدخل terminal الخاص بمحطته.
2. يرى 3 operations اليوم: OP-101 (BOM-559، 200 وحدة)، OP-102، OP-105.
3. يضغط `Start` على OP-101 → الكاميرا تطلب Barcode المواد الخام → يمسح → النظام يخصم تلقائياً.
4. خلال 4 ساعات: ينتج 195 وحدة جيدة + 5 scrap.
5. يضغط `Scrap` → يدخل 5 + reason "Material defect".
6. آلة تتعطل → يضغط `Andon - Maintenance` → الـ supervisor dashboard تنبه فوراً.
7. الصيانة تصل خلال 8 دقائق → يضغط `Resume`.
8. يضغط `Complete` على OP-101 → النظام:
   - DR منتج تام (Finished Goods) 195 × cost
   - DR Scrap Loss 5 × cost
   - CR WIP

### فلو البيانات

```
Operator scans badge → POST /api/auth/employee/login (kiosk)
    ↓
GET /api/manufacturing/shopfloor/operator/:id/today
    ↓
Operator picks operation → POST /api/manufacturing/shopfloor/start
  - INSERT ShopFloorSession(status=ACTIVE)
  - UPDATE MO.currentOperationId
  - WebSocket broadcast to supervisor
    ↓
Operator scans materials → POST /api/manufacturing/material-issue
  - DR WIP, CR Raw Materials (auto-journal)
    ↓
Operator presses Complete → POST /api/manufacturing/shopfloor/complete
  - UPDATE Session(completedAt, goodQty, scrapQty)
  - IF nextOp exists: auto-create next session (queued)
  - IF lastOp: auto-receipt FG + scrap + WIP relief (auto-journal)
  - Update MO progress
    ↓
Andon: POST /api/manufacturing/shopfloor/andon
  - INSERT AndonCall + WebSocket push to supervisor screens
  - Email/SMS to maintenance lead
```

---

## P0-06 · Planning & Budgeting (xP&A) — التخطيط والميزانية المتقدم

**موجود في:** SAP Analytics Cloud Planning, Oracle EPM (PBCS), Anaplan, Workday Adaptive
**لماذا حرج:** الميزانية اليوم في Excel، لا ربط بالفعلي. لا scenarios. لا rolling forecast.

### الجداول

```prisma
model BudgetVersion {
  id           String @id @default(cuid())
  tenantId     String
  fiscalYearId String
  name         String  // "Budget 2026 v1", "Forecast Q2 v2"
  versionType  String  // BUDGET | FORECAST | ACTUAL_OVERLAY | SCENARIO
  status       String  // DRAFT | LOCKED | ARCHIVED
  parentVersionId String?
  createdBy    String
}

model BudgetDriver {
  id           String @id @default(cuid())
  tenantId     String
  versionId    String
  driverName   String  // "Sales Volume", "Headcount", "FX Rate"
  unit         String
  values       Json    // monthly array
}

model BudgetLine {
  id           String @id @default(cuid())
  tenantId     String
  versionId    String
  accountId    String
  costCenterId String?
  profitCenterId String?
  segmentId    String?
  monthlyValues Decimal[] // 12 months in SAR
  driverFormula String?  // e.g., "{{Sales Volume}} * 25 * {{FX Rate}}"
  notes        String?
}

model RollingForecastSchedule {
  id           String @id @default(cuid())
  tenantId     String
  cadence      String // QUARTERLY | MONTHLY
  rollPattern  String // 12_MONTH | 18_MONTH | END_OF_YEAR
  nextDueDate  DateTime
  active       Boolean
}
```

### الفورمات والأزرار

- **شاشة "Budget Setup"** — إنشاء Version + Drivers + Distribution Pattern (linear, S-curve, custom).
- **شاشة "Budget Workbook"** — جدول شبيه Excel (Account × Month) + drag-fill + formula bar مرتبط بـ Drivers.
- **شاشة "Variance Analysis"** — Budget vs Actual + Drill-down + Alerts > threshold.
- **شاشة "Scenarios"** — Side-by-side comparison (Base/Upside/Downside).
- **أزرار:** `Lock Version`, `Copy from Last Year`, `Apply Driver`, `Run Scenario`, `Submit for Approval`, `Push to GL` (encumbrance).

### برومنت جاهز

```
/erp-build-feature xpa-budgeting

ابن نظام Budget & Forecast كامل:

1. Schema: 4 جداول (BudgetVersion, BudgetDriver, BudgetLine, RollingForecastSchedule)

2. APIs:
   - POST /api/finance/budget/versions — CRUD versions
   - POST /api/finance/budget/versions/:id/copy — clone مع modifications
   - POST /api/finance/budget/lines — bulk upsert
   - POST /api/finance/budget/drivers/:id/apply — يحسب قيم البنود من الـ formula
   - GET /api/finance/budget/variance?versionId&periodId — variance vs actual
   - POST /api/finance/budget/forecast/roll — يولد next forecast period

3. Excel-like UI:
   - استخدم react-table أو ag-grid للـ workbook view
   - inline editing + formula support
   - keyboard navigation (Tab, Enter, Arrow keys)

4. Frontend:
   - src/app/(dashboard)/finance/budget/versions/page.tsx
   - src/app/(dashboard)/finance/budget/workbook/[versionId]/page.tsx — main editor
   - src/app/(dashboard)/finance/budget/variance/page.tsx
   - src/app/(dashboard)/finance/budget/scenarios/page.tsx

5. Workflow:
   - Lock الـ version بعد الموافقة
   - Push values للـ GL كـ encumbrance entries (optional)
   - Cron rolling forecast quarterly
```

### سيناريو عمل

**نهاية 2025:** CFO يفتح Budgeting → ينسخ Actuals 2025 كنقطة بداية لـ Budget 2026.
1. ينشئ Driver "Sales Volume" بقيم شهرية + Driver "FX Rate" + Driver "Headcount".
2. يربط 4100 (Revenue) بـ formula: `{{Sales Volume}} * {{Avg Price}} * {{FX Rate}}`.
3. يضغط Apply Driver → ينتشر تلقائياً عبر 12 شهر × 5 منتجات.
4. يضغط Run Scenario "Stress" (Sales -15%, FX +5%) → يرى تأثيره الفوري على Revenue/EBITDA.
5. يرسل للـ CEO `Submit for Approval`.
6. **شهرياً:** يفتح Variance → يرى Marketing فوق Budget بـ 22% → drill-down يكشف حملة جديدة لم تكن مخططة.

### فلو البيانات

```
Create Version (DRAFT)
    ↓
Define Drivers (monthly arrays)
    ↓
Define Lines (Account, formula or static values)
    ↓
Apply Drivers → eval formula → fill BudgetLine.monthlyValues
    ↓
Submit → workflow approval (uses ApprovalEngine)
    ↓
Lock → snapshot saved
    ↓
Monthly: pull Actuals from JournalEntry SUM(amount) GROUP BY account, period
    ↓
Variance = Actual - Budget
    ↓
If variance > threshold → alert subscribers
    ↓
Quarterly: Cron triggers RollingForecast → create next 12 months
```

---

## P0-07 · Field-Level Audit Trail — تتبع التغييرات على مستوى الحقل

**موجود في:** SAP CDHDR/CDPOS, Oracle Audit Trail, NetSuite SAR
**لماذا حرج:** SOCPA/SOX/ZATCA يطلبون "من غيّر، ماذا غيّر، متى". الجدول `FieldAuditTrail` موجود لكن غير مفعّل في كل العمليات.

### الجداول (موجود لكن غير مكتمل)

```prisma
model FieldAuditTrail {
  id           String @id @default(cuid())
  tenantId     String
  entityType   String   // "PurchaseInvoice", "Customer", ...
  entityId     String
  fieldName    String
  oldValue     String?
  newValue     String?
  changedBy    String
  changedAt    DateTime @default(now())
  reason       String?  // optional explanation
  ipAddress    String?
  userAgent    String?
  @@index([entityType, entityId])
  @@index([tenantId, changedAt])
}
```

### الفورمات والأزرار

- **شاشة "Audit Trail Search"** — Filters: User, Entity Type, Date Range, Field Pattern.
- **شاشة Entity Detail:** Tab "Change History" يعرض timeline بتغييرات الحقول.
- **زر `Export to PDF`** للمراجعين.

### برومنت جاهز

```
/erp-build-feature field-audit-trail

فعّل Field-Level Audit عبر كل الـ APIs:

1. Schema: FieldAuditTrail موجود — لا تغيير

2. ابن middleware/helper:
   src/lib/audit-trail.ts:
   - export function trackChanges(entity, before, after, userId): يقارن ويحفظ
   - decorator pattern لـ Prisma update operations

3. تطبيق على الـ APIs الحساسة (P0):
   - PurchaseInvoice (كل تعديل)
   - SalesInvoice
   - JournalEntry
   - Customer (credit limit, bank account, VAT)
   - Vendor (bank account, terms)
   - Employee (salary, role)
   - Settings.zatca_*

4. APIs:
   - GET /api/audit/trail?entityType&entityId — تاريخ entity
   - GET /api/audit/search?userId&dateFrom&dateTo&fieldPattern
   - GET /api/audit/export — Excel/PDF

5. Frontend:
   - src/app/(dashboard)/audit/trail/page.tsx — search
   - On every entity detail page: <ChangeHistory entityId={id} />

6. Retention: حسب PDPL/ZATCA (6 سنوات) + legal hold flag
```

### سيناريو عمل

**Auditor الخارجي:** "أرني كل تغييرات حد ائتمان العملاء في Q1 2026."
- يفتح Audit Trail Search → Filter (Entity=Customer, Field=creditLimit, Date Q1).
- يرى 47 تغييراً → 3 منها فوق 500K → drill-down يكشف user IDs ووقت + IP.
- يضغط `Export to PDF` → ملف يحتوي بصمة كاملة لكل تغيير.

### فلو البيانات

```
Any Update API call
    ↓
Middleware/wrapper:
  1. Read existing entity from DB
  2. Receive new payload
  3. Compute diff (per field)
  4. For each changed field:
     INSERT FieldAuditTrail(oldValue, newValue, userId, ip)
    ↓
Apply update via Prisma
    ↓
Done — invisible to dev who writes the API
```

---

## P0-08 · Universal Approval Engine with Mobile — محرك موافقات شامل

**موجود في:** SAP BPM, Oracle BPM/AME, Dynamics Approvals
**لماذا حرج:** Approvals موجودة لـ JE/PO/Vendor فقط. لا يوجد محرك موحد. الواجهة Inbox محدودة.

### الجداول

```prisma
model ApprovalRule {
  id           String @id @default(cuid())
  tenantId     String
  documentType String  // PR, PO, JE, Expense, Salary Increase, etc.
  conditions   Json    // {amountMin, amountMax, costCenterId, userId, deptId, customField}
  approvers    Json    // [{level, approverIds[], rule: ANY|ALL}]
  escalationHours Int?
  active       Boolean @default(true)
}

model ApprovalRequest {
  id           String @id @default(cuid())
  tenantId     String
  ruleId       String
  documentType String
  documentId   String
  requestedBy  String
  status       String  // PENDING | APPROVED | REJECTED | ESCALATED
  currentLevel Int
  totalLevels  Int
  approvalChain Json   // log of who/when/decision
  createdAt    DateTime @default(now())
  completedAt  DateTime?
}
```

### الفورمات والأزرار

- **شاشة "Approvals Inbox"** — قائمة المهام المعلقة + Filters (Type, Amount, Age, Requestor) + Bulk Approve.
- **شاشة Rule Designer** — Visual rule builder + Preview chain.
- **Mobile View:** بطاقات بحجم كبير + swipe-to-approve/reject + push notifications.

### برومنت جاهز

```
/erp-build-feature approval-engine

ابن محرك موافقات موحد:

1. Schema: ApprovalRule + ApprovalRequest

2. Core engine: src/lib/approval-engine.ts
   - submitForApproval(documentType, documentId, payload, userId)
   - getMyPendingApprovals(userId)
   - approve(requestId, userId, comment)
   - reject(requestId, userId, reason)
   - escalate(requestId) — auto by cron

3. APIs:
   - POST /api/approvals/rules — CRUD rules
   - POST /api/approvals/submit — submit any document
   - GET /api/approvals/inbox — my pending
   - POST /api/approvals/:id/approve
   - POST /api/approvals/:id/reject

4. Integration:
   - في كل Document submit: استدعِ submitForApproval()
   - block document.status = APPROVED until ApprovalRequest.status = APPROVED
   - state-machine يستخدم approval result

5. Frontend:
   - src/app/(dashboard)/approvals/inbox/page.tsx — desktop
   - src/app/(dashboard)/approvals/mobile/page.tsx — mobile-first
   - src/app/(dashboard)/settings/approvals/rules/page.tsx — designer
   - PWA push notifications
```

### سيناريو عمل

**موظف Mohammed:** يطلب شراء laptop جديد بـ 8,500 ر.س.
- ينشئ Purchase Requisition → النظام يطبق Rule "PR > 5000 SAR".
- Rule chain: Manager → Department Head → CFO.
- Mohammed's manager يستلم notification → يضغط Approve → يتقدم للـ Department Head.
- Department Head يرى الطلب على هاتفه → swipe right لـ Approve.
- CFO يطلب توضيح → يضغط Reject مع reason "Need 3 quotes".
- النظام يُرجع PR لـ Mohammed مع التعليق.

### فلو البيانات

```
User submits PR → POST /api/purchases/requisitions
    ↓
PR.status = SUBMITTED
    ↓
auto: approval-engine.submitForApproval(PR, PR.id, {amount: 8500})
    ↓
Engine evaluates ApprovalRules:
  - matches "PR > 5000 SAR"
  - returns chain: [Manager, DeptHead, CFO]
    ↓
INSERT ApprovalRequest(currentLevel=1)
    ↓
Send notification to Manager (email + push + inbox row)
    ↓
Manager approves → POST /api/approvals/:id/approve
  - ApprovalRequest.approvalChain += {level:1, decision:APPROVED}
  - currentLevel = 2 → notify DeptHead
    ↓
DeptHead approves → currentLevel = 3 → notify CFO
    ↓
CFO rejects → status = REJECTED → notify requester
    ↓
PR.status = REJECTED, blocked from converting to PO
```

---

## P0-09 · Customer Hierarchy (Sold-to / Ship-to / Bill-to / Payer) — هرمية العملاء

**لماذا حرج:** عملاء المجموعات (Panda HQ + فروعها) يحتاج توحيد فوترة وتفريق شحن. اليوم: تكرار في master data.

### الجداول

```prisma
model CustomerPartnerRoles {
  id           String @id @default(cuid())
  tenantId     String
  customerId   String  // الكيان الرئيسي
  parentId     String?
  partnerType  String  // SOLD_TO | SHIP_TO | BILL_TO | PAYER
  isDefault    Boolean
  effectiveFrom DateTime
  effectiveTo   DateTime?
}
```

### الفورمات

- في صفحة Customer: Tab "Hierarchy" يعرض شجرة + إضافة partner roles.
- في SO header: dropdown منفصلة لـ Sold-to / Ship-to / Bill-to / Payer (يقترح defaults).

### برومنت جاهز

```
/erp-build-feature customer-hierarchy

أضف Customer Partner Roles:

1. Schema: CustomerPartnerRoles
2. UI: Tab "Hierarchy" في صفحة Customer
3. SO/Invoice headers: separate fields لـ 4 roles
4. Default rule: Sold-to = customer; Ship-to/Bill-to/Payer fallback to Sold-to
5. APIs: 
   - POST /api/customers/:id/partners
   - GET /api/customers/:id/partners?type=SHIP_TO
6. تأكد من backward compatibility مع existing SOs
```

### سيناريو عمل

Panda HQ ← (Bill-to) → SO المُرسل لفرع Riyadh (Ship-to). الفاتورة تروح لـ Treasury في HQ. الشحنة تروح للفرع.

### فلو البيانات

```
SO header: solbToId (defaults), customerId derived from SoldTo
shipToId selectable from CustomerPartnerRoles WHERE customerId, type=SHIP_TO
billToId default = SoldTo or its Bill-to partner
payerId default = Bill-to or its Payer partner
    ↓
Invoice generation: bills the Payer, ships to Ship-to, addresses to Bill-to
```

---

## P0-10 · Real-Time Credit Check at Order Entry — فحص الائتمان فورياً

**موجود في:** SAP FSCM Credit Mgmt, Oracle Credit Mgmt
**لماذا حرج:** اليوم يمكن إنشاء SO لعميل تجاوز حده الائتماني. مخاطر خسارة مالية.

### الجداول

```prisma
model CreditPolicy {
  id           String @id @default(cuid())
  tenantId     String
  customerId   String?  // null = global
  segmentId    String?
  creditLimit  Decimal @db.Decimal(18,4)
  overdueLimit Decimal @db.Decimal(18,4)
  insuranceLimit Decimal? @db.Decimal(18,4) // Tasdeer
  paymentTerms Int     // days
  blockOnExceed Boolean
  approvalRequired Boolean
  effectiveFrom DateTime
}

model CreditCheck {
  id           String @id @default(cuid())
  tenantId     String
  customerId   String
  documentType String   // SO, DN
  documentId   String
  result       String   // PASS | WARN | BLOCKED
  exposure     Decimal @db.Decimal(18,4)
  limitUsed    Decimal @db.Decimal(18,4)
  details      Json
  overrideBy   String?
  createdAt    DateTime @default(now())
}
```

### الفورمات

- في SO save: trigger automatic check.
- زر `Override Credit Hold` (مع أحقية).
- شاشة "Credit Holds Inbox" للموافقات.

### برومنت جاهز

```
/erp-build-feature credit-check-engine

1. Schema: CreditPolicy + CreditCheck
2. APIs:
   - POST /api/credit/check — input: customerId, additionalAmount
     Logic: 
       exposure = AR.OpenInvoices.sum + OpenSOs.sum + DeliveriesNotInvoiced.sum
       overdue = AR.Invoices WHERE dueDate < today
       if overdue > overdueLimit → BLOCK
       if exposure + additional > creditLimit → BLOCK or WARN
3. Integration:
   - في POST /api/sales/orders: استدعِ check قبل الحفظ
   - if BLOCKED: status = CREDIT_HOLD, route to approval
4. Frontend:
   - Toast notification في SO entry
   - Credit Holds inbox للمسؤول
```

### سيناريو عمل

عميل ABC الحد 500K. عليه فواتير مفتوحة 480K. مندوب يحاول SO جديد بـ 50K → النظام يحظر، يطلب موافقة Sales Manager. Manager يرى الـ exposure + history → يوافق مع تعليق.

### فلو البيانات

```
SO POST → middleware credit-check
    ↓
SELECT SUM(balance) FROM AR.OpenInvoice WHERE customer = X
    ↓
+ SUM(total - shipped) FROM SO WHERE customer = X AND status = OPEN
    ↓
+ check overdue amount
    ↓
Compare with policy → return result
    ↓
IF block: SO status = CREDIT_HOLD; Approval routed
```

---

## P0-11 · Period Close Cockpit — قمرة الإقفال الشهري

**لماذا حرج:** الإقفال يأخذ 10 أيام، النظام لا يتتبع المهام لكل entity/role.

### الجداول (موجودة جزئياً)

```prisma
model PeriodCloseTask {
  id           String @id @default(cuid())
  tenantId     String
  periodId     String
  entityId     String?
  taskName     String
  taskType     String  // RECONCILIATION | ACCRUAL | DEPRECIATION | FX_REVAL | INTERCOMPANY | ...
  assignedTo   String
  dueDate      DateTime
  dependsOn    String[]  // task IDs
  status       String  // NOT_STARTED | IN_PROGRESS | DONE | BLOCKED
  evidence     Json
  signedOffBy  String?
}
```

### الفورمات

- **Period Close Dashboard:** progress bar + timeline + RACI matrix.
- زر `Generate Tasks` يبني checklist تلقائياً.
- لكل task: زر Mark Done + upload evidence.

### برومنت

```
/erp-build-feature period-close-cockpit

1. PeriodCloseTask موجود، أكمل APIs:
   - POST /api/accounting/period-close/:periodId/generate-tasks (template-driven)
   - POST /api/accounting/period-close/tasks/:id/start
   - POST /api/accounting/period-close/tasks/:id/complete (with evidence upload)
   - GET /api/accounting/period-close/:periodId/dashboard

2. Templates (PeriodCloseTaskTemplate):
   - Standard month-end checklist (35 tasks)
   - Quarter-end (50 tasks)
   - Year-end (80 tasks)

3. Frontend:
   - src/app/(dashboard)/accounting/period-close/page.tsx — dashboard
   - GanttChart للـ timeline
   - DnD لإعادة ترتيب deps
```

### سيناريو

Day 1: CFO يضغط "Open Close for May 2026". 35 task تتولد لـ 4 شركات. أول task: Bank Recon (assigned to A). Day 5: 80% انجاز. Day 7: All done. Period locked.

### فلو

Generate Tasks → loop template → INSERT tasks. User completes each → status DONE → if all complete → period.status = LOCKED → no more posting.

---

## P0-12 · Mudad / WPS Full Integration — تكامل مداد كامل

**لماذا حرج:** WPS الأخطاء = تجميد Qiwa. كل بنك له تنسيق مختلف.

### الجداول (موجود WPSBatch، تحتاج توسعة)

```prisma
model BankWpsTemplate {
  id           String @id @default(cuid())
  tenantId     String
  bankCode     String  // RAJHI | SNB | RIYAD | ANB | ...
  format       String  // SIF/PIF format spec
  headerSpec   Json
  detailSpec   Json
  trailerSpec  Json
}

model WpsSubmissionLog {
  id           String @id @default(cuid())
  tenantId     String
  batchId      String
  bankCode     String
  fileName     String
  fileContent  String   // generated file
  mudadResponse Json?
  status       String   // GENERATED | SUBMITTED | ACCEPTED | REJECTED
  rejectionReason String?
  submittedAt  DateTime?
}
```

### الفورمات

- شاشة WPS Run: اختيار شهر + بنك → يولد ملف.
- زر `Submit to Mudad`، `Download SIF`، `View Submission Log`.
- شاشة لكل بنك بـ template editor.

### برومنت

```
/erp-build-feature mudad-wps-full

1. Schema: BankWpsTemplate (متعدد) + WpsSubmissionLog
2. SIF generator per bank: src/lib/wps-generators/{rajhi,snb,riyad,anb,...}.ts
3. Mudad API integration: POST /api/saudi/mudad/wps/submit
4. IBAN validation MOD-97 + bank routing check
5. Salary discrepancy report (Qiwa contract vs paid)
6. WPS compliance certificate fetch
```

### سيناريو

End of month: HR يضغط "Run WPS". اختار Riyad Bank لـ 80 موظف، Al Rajhi لـ 40. النظام يولد 2 ملفات SIF. زر Submit to Mudad → API call → response Accepted لـ 79 + 39 → 2 errors (IBAN خطأ) → HR يصححها ويعيد الإرسال.

### فلو

PayrollRun.completed → for each employee.bankCode group → call generator → produce SIF text → submit Mudad API → log result → on error: mark employee, notify HR.

---

## P0-13 · Saudi Statutory Reports Pack — حزمة تقارير الامتثال

**لماذا حرج:** Zakat declaration, monthly VAT return, monthly WHT return — كلها مطلوبة بشكل دوري.

### المطلوب

3 تقارير جاهزة + e-file APIs (حيث تتوفر):
1. **Zakat Declaration:** SAR base, deductions, net base × 2.5%, attachments.
2. **VAT Return:** 15 box ZATCA template (Standard rate sales, Zero-rate, Exempt, Imports, Adjustments, Net VAT).
3. **WHT Return:** monthly summary by service type × rate.

### الفورمات

- لكل تقرير: شاشة Generation + Preview + Edit Adjustments + Submit/Download.
- Audit trail لكل تقرير منشور.

### برومنت

```
/erp-build-feature saudi-statutory-reports

1. ابن 3 generators:
   - src/lib/statutory/zakat-generator.ts (يحسب Zakat base من schema)
   - src/lib/statutory/vat-return-generator.ts (15 box from invoices/journals)
   - src/lib/statutory/wht-return-generator.ts (group by service, sum)

2. APIs:
   - POST /api/saudi/zakat/generate?fiscalYearId
   - POST /api/saudi/vat-return/generate?periodId
   - POST /api/saudi/wht-return/generate?periodId
   - POST /api/saudi/zakat/file (ZATCA API submission)
   - POST /api/saudi/vat-return/file

3. Frontend:
   - src/app/(dashboard)/tax/zakat/page.tsx
   - src/app/(dashboard)/tax/vat-returns/page.tsx
   - src/app/(dashboard)/tax/wht-returns/page.tsx

4. Templates: PDF format matching ZATCA
```

### سيناريو + فلو

End of month → tax team generates VAT Return → reviews 15 boxes → adjusts (e.g., bad-debt VAT recovery) → submits via ZATCA API → archives.

---

## P0-14 · ZATCA PIH Chain Integrity Monitor — مراقبة سلسلة هاش الفواتير

**لماذا حرج:** أي كسر في سلسلة PIH = رفض ZATCA لكل الفواتير اللاحقة + إعادة تسجيل الجهاز.

### الجداول

```prisma
model ZatcaChainMonitor {
  id           String @id @default(cuid())
  tenantId     String
  deviceId     String
  lastIcv      Int
  lastPih      String  // 64 chars
  lastInvoiceId String
  checkedAt    DateTime
  isHealthy    Boolean
  brokenAt     Int?    // ICV where break detected
}

model ZatcaPortalReconciliation {
  id           String @id @default(cuid())
  tenantId     String
  deviceId     String
  reconDate    DateTime
  totalLocal   Int
  totalPortal  Int
  missingInPortal Int[]  // ICVs
  orphanInPortal Int[]
  status       String   // OK | DISCREPANCY
}
```

### الفورمات

- **شاشة "ZATCA Health Monitor"** — كرت لكل device + status (Healthy/Broken/Missing).
- **Daily reconciliation report:** يقارن ICVs المحلية مع ZATCA Fatoora portal.
- **زر `Recover Chain`** عند الكسر.

### برومنت

```
/erp-build-feature zatca-chain-monitor

1. Schema: ZatcaChainMonitor + ZatcaPortalReconciliation
2. Cron daily: 
   - SELECT MAX(icv) per device → compare with portal.lastIcv
   - SELECT all ICVs in last 30 days → verify continuity (no gaps)
   - If gap detected → alert + lock new invoicing for that device
3. APIs:
   - GET /api/zatca/health
   - POST /api/zatca/reconciliation/run
   - POST /api/zatca/recovery/:deviceId
4. Frontend: zatca/health page
```

### سيناريو

8:00 ص: cron يكتشف ICV gap (3, 4, 5 missing) في Device DEV-002 → ينبه CFO + يقفل الإصدار. Admin يحقق → يجد crash في 02:00 ص → يستعيد الفواتير الـ 3 → يصالح مع portal → يعيد فتح device.

### فلو

Daily 02:00 cron → for each device → fetch local invoices → compare with ZATCA portal API → detect gaps → if gap: SET device.locked = true + notify.

---

## P0-15 · Saudi National Address Verification (SPL/Wasel) — التحقق من العنوان

**لماذا حرج:** ZATCA Phase 2 يطلب National Address على الفواتير B2B. عنوان غير صحيح = رفض الفاتورة.

### الجداول

```prisma
// extension on Customer/Vendor
addressBuildingNo  String
addressStreetName  String
addressDistrict    String
addressCity        String
addressPostalCode  String  // 5 digits
addressShortCode   String  // RRRD1234 format
addressAdditional  String?
addressVerifiedAt  DateTime?
addressVerifiedSource String? // SPL_API | MANUAL
```

### الفورمات

- في Customer/Vendor form: زر `Verify Address with SPL`.
- يستدعي SPL API → يقترح صحيح → يطلب التأكيد.

### برومنت

```
/erp-build-feature spl-address-verify

1. Add address fields to Customer + Vendor + Branch
2. Integration: src/lib/spl-api.ts (Saudi Post API)
3. POST /api/saudi/spl/verify-address
4. UI button "Verify with Wasel" → returns standardized address
5. Block ZATCA invoice if address not verified for B2B
```

### سيناريو

Admin يدخل عميل جديد → يكتب عنوان تقريبي → يضغط Verify → SPL API يقترح "Building 4521, King Fahd Rd, Olaya District, Riyadh 12345, Short: RGNA4521" → يقبل. الفواتير المستقبلية لهذا العميل ستحتوي عنوان مطابق لـ ZATCA spec.

### فلو

User saves Customer → call SPL API → if mismatch → suggest correction → user accepts → save standardized address + verifiedAt timestamp.

---

## P0-16 · Hijri Calendar Engine — محرك التقويم الهجري

**لماذا حرج:** كل الجهات الحكومية تستخدم الهجري. Zakat, EOS, contracts, Ramadan OT rules.

### الجداول

```prisma
model HijriHoliday {
  id        String @id @default(cuid())
  tenantId  String?  // null = global
  hijriDate String   // 1447-09-01
  gregorianDate DateTime
  name      String
  type      String   // PUBLIC | RELIGIOUS | NATIONAL
  paymentMultiplier Decimal @db.Decimal(3,2) // 2.0 for OT
}
```

### الفورمات

- **Settings → Calendar:** Hijri/Gregorian toggle.
- في Documents: dual-date display.
- في Payslip: hijri month + Gregorian.

### برومنت

```
/erp-build-feature hijri-engine

1. Schema: HijriHoliday + utility lib
2. src/lib/hijri.ts:
   - hijriToGregorian(date)
   - gregorianToHijri(date)
   - isRamadan(date)
   - isHijriHoliday(date)
3. integrate في:
   - Payroll (Ramadan = 6h day max for Muslims)
   - Zakat fiscal year option
   - Contract dates dual display
   - Holiday calendar auto-import (CCHS or static table)
4. UI: Hijri date picker component + dual-display
```

### سيناريو

Payroll Run for Ramadan 1447: النظام يكتشف الفترة → يحدد ساعات العمل max 36/week للمسلمين. End of Ramadan: العمالة الإسلامية أُجرها مُحاسب صحيحاً.

---

## P0-17 · Customer VAT Lookup (ZATCA Registry) — التحقق من رقم ضريبي

**لماذا حرج:** ZATCA يطلب VAT صحيح على الفواتير B2B. رقم خاطئ = رفض.

### الجداول

```prisma
// extension on Customer/Vendor: vatNumberVerifiedAt + vatLookupResult
model ZatcaVatLookup {
  id        String @id @default(cuid())
  tenantId  String
  vatNumber String
  result    Json     // {isValid, name, status, ...}
  cachedAt  DateTime
  ttl       Int      // hours
}
```

### الفورمات

- زر `Verify VAT` في Customer/Vendor form.
- Cache 24 hours.
- Block ZATCA invoice if VAT not verified for B2B.

### برومنت

```
/erp-build-feature zatca-vat-lookup

1. Schema: ZatcaVatLookup
2. Integration with ZATCA VAT registry API
3. POST /api/saudi/zatca/vat-lookup
4. UI button + auto-detect B2B vs B2C from VAT presence
5. Settings: block invoice creation if VAT invalid
```

---

## P0-18 · GOSI Saudi/Non-Saudi Rate Engine — محرك تأمينات GOSI

**لماذا حرج:** المعدلات مختلفة للسعودي وغير السعودي. خطأ = under/over contribution.

### المطلوب

- Per-employee rate matrix:
  - Saudi: 9% employee + 9% employer + 1% SANED + 0.5% Occ. Hazard
  - Non-Saudi: 2% Occupational Hazard only (employer)
- GCC nationals: مرآة معاملة بلدهم (مرحلة 2).
- Wage cap 45,000 SAR.
- Housing allowance capped 25% of basic.

### برومنت

```
/erp-build-feature gosi-rate-engine

1. extend src/lib/payroll-engine.ts:
   - calculateGosi(employee, salary):
     - if Saudi: empl.rate=9%, employer=9%+1%SANED+0.5%Occ
     - if non-Saudi: only 2% Occ from employer
     - cap contributoryWage at 45,000
     - housing portion max 25% of basic

2. APIs: 
   - POST /api/hr/gosi/calculate
   - POST /api/hr/gosi/annual-recon

3. Schema additions:
   - Employee.gosiContributoryWage
   - Employee.sanedEligible

4. integrate في كل Payroll Run
```

---

## P0-19 · SANED Unemployment Insurance — تأمين البطالة

**لماذا حرج:** 1% من السعودي + 1% من المنشأة. مطلوب من GOSI.

### المطلوب

- إضافة SANED حساب في CoA.
- معدل 1% + 1% للسعوديين فقط.
- سن 60 cap.

### برومنت

```
/erp-build-feature saned-insurance

1. Add Employee.sanedActive + SanedContribution model
2. extend payroll auto-journal:
   - DR Salary Expense (employee SANED)
   - CR SANED Liability
3. integrate with GOSI annual recon
```

---

## P0-20 · Nitaqat Color Band Calculator — حاسبة نطاقات

**لماذا حرج:** Yellow/Red = block visa quotas, MHRSD restrictions.

### الجداول

```prisma
model NitaqatActivityClass {
  id          String @id @default(cuid())
  activityCode String
  size        String  // SMALL | MEDIUM | LARGE | GIANT
  platinum    Decimal // 0.50 = 50% Saudi
  green       Decimal
  yellow      Decimal
  red         Decimal
}

model NitaqatSnapshot {
  id          String @id @default(cuid())
  tenantId    String
  capturedAt  DateTime
  totalEmployees Int
  saudiEmployees Decimal // weighted
  saudiPercent Decimal
  band        String  // PLATINUM | GREEN | LOW_GREEN | YELLOW | RED
  visaQuotaAvailable Int?
}
```

### برومنت

```
/erp-build-feature nitaqat-engine

1. Schema: NitaqatActivityClass + NitaqatSnapshot
2. Engine: weighted Saudi calculation
   - tenured Saudi (>1y) = 1.0x
   - new Saudi = 0.5x
   - female Saudi = 1.5x
   - part-time = 0.5x
3. POST /api/saudi/nitaqat/snapshot — daily cron
4. POST /api/saudi/nitaqat/projection — what-if hire/fire
5. Dashboard widget showing band + days to next downgrade
```

### سيناريو

HR يخطط ل توظيف 5 expats. يفتح Nitaqat Projection → يكتشف أن البند سينزل من Green إلى Yellow → يضيف 3 سعوديين أولاً ليحافظ على Green.

---

## P0-21 · PDPL Consent Management — إدارة موافقات حماية البيانات

**لماذا حرج:** غرامة حتى 5M ر.س. سنويًا. CCC مطلوب.

### الجداول

```prisma
model ConsentPurpose {
  id          String @id @default(cuid())
  tenantId    String
  purposeKey  String   // MARKETING | NEWSLETTER | DATA_SHARING_3P | ...
  purposeDescription String
  isMandatory Boolean
  legalBasis  String   // CONSENT | CONTRACT | LEGAL_OBLIGATION
}

model UserConsent {
  id          String @id @default(cuid())
  tenantId    String
  subjectType String   // CUSTOMER | EMPLOYEE | LEAD
  subjectId   String
  purposeId   String
  consented   Boolean
  consentedAt DateTime
  withdrawnAt DateTime?
  ipAddress   String?
  consentVersion String
}

model PdplBreach {
  id          String @id @default(cuid())
  tenantId    String
  reportedAt  DateTime
  detectedAt  DateTime
  severity    String   // LOW | MED | HIGH | CRITICAL
  affectedSubjects Int
  natureOfData Json
  notifiedSdaiaAt DateTime?
  notifiedSubjectsAt DateTime?
  resolvedAt  DateTime?
}
```

### برومنت

```
/erp-build-feature pdpl-consent

1. Schema: ConsentPurpose + UserConsent + PdplBreach
2. APIs:
   - POST /api/pdpl/consents — record consent
   - DELETE /api/pdpl/consents/:id — withdraw
   - GET /api/pdpl/consents/subject/:type/:id — list
   - POST /api/pdpl/breach — report breach (72h workflow)
   - POST /api/pdpl/dsar — data subject access request
3. UI:
   - Customer/Employee profile: Tab "Consents"
   - Public consent page (per language)
   - Breach intake form
4. Cron: 72-hour SLA monitor
```

---

## P0-22 · Cross-Border Data Transfer Log (PDPL) — سجل النقل عبر الحدود

**لماذا حرج:** PDPL يطلب توثيق أي نقل بيانات شخصية خارج KSA. غرامة 3M.

### الجداول

```prisma
model CrossBorderTransfer {
  id          String @id @default(cuid())
  tenantId    String
  destinationCountry String
  recipient   String
  recipientType String // CONTROLLER | PROCESSOR
  dataCategory String  // CONTACT | FINANCIAL | HEALTH | ...
  legalBasis  String   // ADEQUACY | SCC | BCR | CONSENT
  sdaiaApprovalRef String?
  startedAt   DateTime
  endedAt     DateTime?
  active      Boolean
}
```

### برومنت

```
/erp-build-feature pdpl-cross-border

1. Schema: CrossBorderTransfer
2. API: CRUD + approval workflow
3. UI: Settings → PDPL → Cross-Border Register
4. Cron: monitor SDAIA approval expiry
5. Block transfer if no active approval
```

---

# 🟠 الجزء الثاني — P1 (High Priority — 62 بند)

> الترتيب أقل تفصيلاً (definition + tables key + UI + prompt-summary). نمط أصغر لكن قابل للتنفيذ.

## P1-01 · In-House Bank (IHB) — البنك الداخلي للمجموعة
**ما المطلوب:** حسابات بنكية داخلية بين الشركات الشقيقة، تسوية intercompany cash بدون تحويل خارجي.
**جداول:** `InternalBankAccount`, `InternalCashTransfer`, `IhbStatement`.
**فورمات:** شاشة IHB Dashboard، Inter-entity transfer form، Statement.
**برومنت:** `/erp-build-feature in-house-bank` — أنشئ IHB module مع internal bank accounts، transfer between entities (DR Inter-entity Receivable، CR Inter-entity Payable in source entity + reverse in target)، statement generation per internal account.

## P1-02 · Bank Account Management (BAM) — إدارة الحسابات البنكية
**ما المطلوب:** Workflow لفتح/إغلاق حسابات، signatories matrix، dormant detection.
**جداول:** `BankAccountLifecycle`, `Signatory`, `BankFee`.
**برومنت:** `/erp-build-feature bank-account-mgmt` — Lifecycle workflow (Request → KYC → Approve → Active → Close)، Signatories tracking، Dormant alert (no activity 90 days).

## P1-03 · Tax Determination Engine (Multi-Jurisdiction) — محرك تحديد الضرائب
**ما المطلوب:** Rule-based VAT/Excise selection per line based on ship-from/to، item type، customer status.
**برومنت:** `/erp-build-feature tax-determination-engine` — engine يقرر VAT code + rate + exemption لكل invoice line.

## P1-04 · S&OP / IBP — تخطيط المبيعات والعمليات
**ما المطلوب:** Monthly cycle: forecast → demand → supply → financial plan.
**جداول:** `SopCycle`, `DemandPlan`, `SupplyPlan`.
**برومنت:** `/erp-build-feature sop-ibp` — متعدد الخطوات: Sales Forecast → Demand Plan → Supply Plan → Financial Plan → Consensus Meeting.

## P1-05 · Configure-Price-Quote (CPQ) — التهيئة والتسعير
**ما المطلوب:** Variant configurator + constraint engine + multi-tier pricing + proposal generator.
**جداول:** `ProductOption`, `OptionConstraint`, `PricingTier`, `ProposalTemplate`.
**برومنت:** `/erp-build-feature cpq-engine` — Configurator UI + auto-BOM per config + auto-pricing.

## P1-06 · Subscription Billing (SuiteBilling-style) — فوترة الاشتراكات
**ما المطلوب:** Recurring + usage-based + proration + ASC 606 revenue allocation.
**جداول موجودة جزئياً:** Subscription, SubscriptionPayment.
**برومنت:** `/erp-build-feature subscription-billing-full` — أكمل metering + proration + mid-cycle changes + revenue recognition rules.

## P1-07 · Supplier Lifecycle Management (SLM) — دورة حياة المورد
**ما المطلوب:** Onboarding workflow، qualification، scorecard، risk monitoring.
**جداول:** `SupplierOnboarding`, `SupplierQualification`, `SupplierRisk`.
**برومنت:** `/erp-build-feature supplier-lifecycle` — full lifecycle مع KYC + IKTVA scoring + Nitaqat tracking.

## P1-08 · Contract Lifecycle Management (CLM) — إدارة دورة حياة العقود
**ما المطلوب:** Drafting from clauses + redline + e-sign + obligation tracking + renewal.
**جداول موجودة جزئياً:** Contract, ContractTemplate, ContractRevision, ContractRenewal.
**برومنت:** `/erp-build-feature clm-full` — أضف clause library + redline editor + obligation tracker.

## P1-09 · Catalog Management & Punchout — كتالوج المشتريات
**ما المطلوب:** Internal catalog + cXML/OCI punchout للموردين الخارجيين.
**برومنت:** `/erp-build-feature procurement-catalog` — internal catalog + punchout sessions.

## P1-10 · Plant Maintenance / EAM — صيانة المصانع
**ما المطلوب:** Equipment master + Functional locations + Maintenance plans (PM/CM) + WO + downtime.
**جداول موجودة جزئياً:** Machine, MaintenanceSchedule, MaintenanceWorkOrder.
**برومنت:** `/erp-build-feature eam-plant-maintenance` — Equipment hierarchy + PM schedules (calendar/meter-based) + WO workflow + MTBF/MTTR analytics.

## P1-11 · Quality Management Full (AQL + SPC + CAPA) — جودة شاملة
**ما المطلوب:** Sampling plans (ANSI/ASQ Z1.4) + control charts + CAPA workflow + calibration.
**برومنت:** `/erp-build-feature qm-full-suite` — AQL config + SPC dashboards + CAPA case mgmt + calibration scheduler.

## P1-12 · Field Service Management (FSM) — إدارة الخدمة الميدانية
**ما المطلوب:** Schedule board + mobile tech app + parts van inventory + signature/photo capture + SLA.
**جداول موجودة جزئياً:** field-service.
**برومنت:** `/erp-build-feature fsm-full` — dispatch board + offline-capable PWA + parts mgmt + SLA timer.

## P1-13 · Service Contracts & Entitlements — عقود الخدمة
**ما المطلوب:** AMC/Warranty contracts + covered assets + SLA + auto-billing.
**برومنت:** `/erp-build-feature service-contracts` — contracts table + entitlement check at ticket open + auto-billing.

## P1-14 · Drop-Ship & Multi-Channel Orchestration — تنسيق طلبات متعدد القنوات
**ما المطلوب:** Order routing to best fulfillment node (DC/store/supplier).
**برومنت:** `/erp-build-feature order-orchestration` — routing engine + drop-ship PO auto-creation.

## P1-15 · Compensation Management — إدارة التعويضات
**ما المطلوب:** Annual merit/bonus cycle + budget guardrails + manager self-service.
**برومنت:** `/erp-build-feature compensation-mgmt` — comp worksheet + matrix + multi-level approval.

## P1-16 · Vendor/Customer Self-Service Portals — بوابات
**ما المطلوب:** Web portal لـ supplier (PO ack, ASN, invoice) + customer (orders, statements, returns).
**جداول موجودة جزئياً:** VendorPortalUser, PortalUser.
**برومنت:** `/erp-build-feature self-service-portals` — actually use the existing portal APIs in Tab UIs.

## P1-17 · e-Signature (Saudi NCDC / Tawqee/Nafath) — التوقيع الإلكتروني
**ما المطلوب:** PKI integration with Saudi CA + qualified e-signature.
**برومنت:** `/erp-build-feature nafath-esign` — integrate with Nafath API + signature audit trail.

## P1-18 · Document Management System (DMS) — إدارة الوثائق
**ما المطلوب:** Versioned storage + metadata + retention rules + OCR search.
**جداول موجودة:** DMS module Stub.
**برومنت:** `/erp-build-feature dms-full` — versioning + retention engine + OCR indexing.

## P1-19 · Embedded BI / Pre-built Analytics — تحليلات مضمنة
**ما المطلوب:** CFO Cockpit, COO Dashboard, CHRO Dashboard + self-service modeler.
**جداول موجودة جزئياً:** BiDashboard, BiWidget, BiKpiDefinition.
**برومنت:** `/erp-build-feature embedded-bi` — pre-built role dashboards + drag-drop modeler.

## P1-20 · Profitability & Cost Management (CO-PA) — ربحية متعددة الأبعاد
**ما المطلوب:** Profitability per product × customer × channel × region with allocations.
**جداول موجودة جزئياً:** CopaDocument, CopaCharacteristic.
**برومنت:** `/erp-build-feature copa-multi-dim` — extend characteristics + allocation engine.

## P1-21 · Real Estate (CAM Reconciliation) — تسوية الصيانة المشتركة
**ما المطلوب:** Estimated CAM monthly + Actual at year-end + Tenant pro-rata + true-up.
**برومنت:** `/erp-build-feature cam-reconciliation` — monthly billing + year-end actual + true-up invoices.

## P1-22 · IFRS Component Accounting (Fixed Assets) — محاسبة المكونات IFRS
**ما المطلوب:** Asset components with separate useful lives.
**برومنت:** `/erp-build-feature fa-components` — add component sub-numbers + per-component depreciation.

## P1-23 · CWIP / AUC Tracking — أصول تحت الإنشاء
**ما المطلوب:** Cost collector → settlement → FA capitalization workflow.
**برومنت:** `/erp-build-feature cwip-auc` — AUC accounts + settlement rules + capitalization approval.

## P1-24 · Inventory Cycle Count by ABC Class — جرد دوري حسب ABC
**ما المطلوب:** ABC classification → count frequency → tasks.
**برومنت:** `/erp-build-feature abc-cycle-count` — auto-generate count tasks based on ABC.

## P1-25 · Inventory Replenishment Min/Max with Forecast — تجديد بحد أدنى/أعلى مع توقع
**ما المطلوب:** Dynamic recalc from forecast.
**برومنت:** `/erp-build-feature dynamic-replenishment` — extend ReorderRule with forecast input.

## P1-26 · Goods Receipt with Quality Hold — استلام مع حجز جودة
**ما المطلوب:** Stock status post-GRN: Quality Inspection / Blocked / Unrestricted.
**برومنت:** `/erp-build-feature grn-quality-hold` — extend Stock with status field + auto-create inspection lot.

## P1-27 · Blanket PO / Scheduling Agreements — اتفاقيات إطارية
**ما المطلوب:** Annual qty + price + call-off releases.
**برومنت:** `/erp-build-feature blanket-po` — BlanketAgreement + ReleaseSchedule.

## P1-28 · Subcontracting (Toll Manufacturing) — تصنيع بالأمانة
**ما المطلوب:** Subcon PO with components + auto-issue + GR for finished + vendor stock.
**برومنت:** `/erp-build-feature subcontracting` — full toll mfg flow.

## P1-29 · Manufacturing Variance Analytics — تحليل تباينات الإنتاج
**ما المطلوب:** PPV, Mix, Efficiency, Yield variances + root cause drilldown.
**برومنت:** `/erp-build-feature mfg-variances` — standard cost setup + monthly variance computation.

## P1-30 · Capacity Leveling / Finite Scheduling Board — جدولة محدودة بالطاقة
**ما المطلوب:** Visual Gantt of work centers + drag-drop reschedule.
**برومنت:** `/erp-build-feature capacity-leveling` — finite scheduler with alternates.

## P1-31 · Batch Genealogy (Forward & Backward Trace) — تتبع الدفعات
**ما المطلوب:** Trace any batch backward to inputs and forward to outputs.
**برومنت:** `/erp-build-feature batch-genealogy` — graph traversal + recall report.

## P1-32 · Account Reconciliation Automation — أتمتة تسوية الحسابات
**ما المطلوب:** Reconciliation templates per GL + sub-ledger to GL tie-out + sign-off.
**برومنت:** `/erp-build-feature account-recon-auto` — templates + workflow + evidence.

## P1-33 · Lease Abstraction & IFRS 16 Lessee — تجريد العقود ومحاسبة المستأجر
**ما المطلوب:** Contract abstraction + ROU/Liability schedule + modifications + disclosures.
**جداول موجودة:** IfrsLeaseContract, IfrsLeaseSchedule, IfrsLeaseModification.
**برومنت:** `/erp-build-feature ifrs16-full-lessee` — أكمل modification handling + disclosures.

## P1-34 · Cash Flow Statement (Direct & Indirect, IAS 7) — قائمة التدفقات
**ما المطلوب:** CF mapping per GL + Indirect from BS+P&L movements.
**برومنت:** `/erp-build-feature cash-flow-statement` — IAS 7 generator (both methods).

## P1-35 · AR Cash Application with ML — تطبيق تحصيلات بالذكاء
**ما المطلوب:** Bank file ingest + ML matching + exception worklist.
**برومنت:** `/erp-build-feature ar-cash-app-ml` — bank file ingestion + match suggestions.

## P1-36 · AR Collections Strategy & Worklist — استراتيجية تحصيل
**ما المطلوب:** Collector queues + dunning strategies + promise-to-pay.
**برومنت:** `/erp-build-feature ar-collections` — queue + strategy + call notes.

## P1-37 · AP Payables Hub / Payment Factory — مركز المدفوعات
**ما المطلوب:** Centralized payment runs + FX netting + beneficiary master.
**برومنت:** `/erp-build-feature payables-hub` — centralized payments + netting.

## P1-38 · AP Vendor Bank Validation & Fraud Controls — ضوابط الاحتيال
**ما المطلوب:** IBAN validation + dual-control bank changes + duplicate detection.
**برومنت:** `/erp-build-feature ap-fraud-controls` — bank change workflow + fuzzy duplicate.

## P1-39 · 13-Week Cash Forecast — توقع نقدي 13 أسبوعاً
**ما المطلوب:** Direct method forecast from open AR/AP/Payroll/Loans/Capex.
(غُطّي في P0-01 جزئياً، هنا تكامل أعمق)
**برومنت:** `/erp-build-feature treasury-13week-forecast` — extend P0-01 with scenario overlays + variance.

## P1-40 · Bank Connectivity (SWIFT, MT/CAMT) — اتصال البنوك
**ما المطلوب:** SWIFT MT101/103, CAMT.053/.054, ISO 20022 pain.001.
**برومنت:** `/erp-build-feature bank-connectivity` — file generators + parsers + host-to-host.

## P1-41 · Time Clock Terminals (Biometric) — أجهزة بصمة
**ما المطلوب:** Hardware integration + face recognition + geo-fence.
**برومنت:** `/erp-build-feature biometric-clock` — ZKTeco/Suprema integration + Face/GPS clock-in.

## P1-42 · Saudization Real-Time Tracker — تتبع السعودة الآني
**ما المطلوب:** Live calc + simulator + actions to maintain band.
(غُطّي في P0-20)

## P1-43 · Off-Cycle Payroll & Retro Calculation — رواتب استثنائية
**ما المطلوب:** Off-cycle bonus + leave encashment + retroactive calc.
**برومنت:** `/erp-build-feature payroll-offcycle-retro` — off-cycle runs + retro engine.

## P1-44 · GOSI/EOS Year-End Recon — تسويات سنوية
**ما المطلوب:** GOSI annual cert + EOS provision movement + Zakat salary report.
**برومنت:** `/erp-build-feature payroll-year-end-recon` — generate all year-end reports.

## P1-45 · Opportunity Probability & Forecast Categories — احتمالية الفرص
**ما المطلوب:** Stage-based probability + commit/best-case/pipeline.
**برومنت:** `/erp-build-feature crm-forecast-categories` — extend Opportunity with categories.

## P1-46 · Customer 360 (Service+Sales+Finance) — رؤية شاملة للعميل
**ما المطلوب:** Single screen: contacts + AR + orders + tickets + NPS.
**برومنت:** `/erp-build-feature customer-360-screen` — أكمل existing Customer360 page.

## P1-47 · EVM (PV/EV/AC, CPI/SPI) — قيمة مكتسبة
**ما المطلوب:** Baseline lock + period EV calc + S-curve.
**جداول موجودة جزئياً:** projects/evm.
**برومنت:** `/erp-build-feature evm-projects` — extend projects/evm with full PV/EV/AC + S-curve.

## P1-48 · Project Resource Capacity Planning — تخطيط طاقة موارد المشاريع
**ما المطلوب:** Resource pool + skills + heatmap + utilization.
**برومنت:** `/erp-build-feature resource-capacity` — heatmap dashboard + staffing workflow.

## P1-49 · Project Milestone Billing with WIP — فوترة معالم المشاريع
**ما المطلوب:** Milestones + POC method WIP + retention payable + IFRS 15 contract asset/liability.
**برومنت:** `/erp-build-feature milestone-billing` — milestone schedule + POC + retention.

## P1-50 · Auto-Reversal of Accruals — عكس الاستحقاقات تلقائياً
**ما المطلوب:** Accrual JE flagged "auto-reverse" + batch reversal at period open.
**برومنت:** `/erp-build-feature auto-reverse-accruals` — flag + cron + audit log.

## P1-51 · Recurring Journal Templates — قوالب قيود متكررة
**ما المطلوب:** Template JE + frequency + skip-period + auto-post.
**جداول موجودة:** JournalTemplate, JournalTemplateLine.
**برومنت:** `/erp-build-feature recurring-journal-runner` — cron-driven generation.

## P1-52 · Document Splitting (Profit Center / Segment Balanced) — تقسيم المستندات
**ما المطلوب:** Auto-split lines so each PC/segment is balanced.
**برومنت:** `/erp-build-feature document-splitting` — extend journal entry with auto-balance per dimension.

## P1-53 · Standard Cost Roll-Up & Versions — تجميع التكلفة المعيارية
**ما المطلوب:** BOM × routing × rate roll-up + multiple cost versions.
**برومنت:** `/erp-build-feature std-cost-rollup` — cost calculator + version mgmt.

## P1-54 · Service SLA Engine — محرك SLA
**ما المطلوب:** SLA per contract/severity + business calendar + pause/resume.
**جداول موجودة:** SlaPolicy.
**برومنت:** `/erp-build-feature sla-engine-full` — extend SlaPolicy with timer + breach alerts.

## P1-55 · Mobile Tech App for FSM — تطبيق فني الميداني
**ما المطلوب:** Offline + work order steps + signature + photos.
**برومنت:** `/erp-build-feature fsm-mobile-app` — PWA with offline service worker.

## P1-56 · Master Data Duplicate Detection (Fuzzy) — كشف التكرار في بيانات الماستر
**ما المطلوب:** Fuzzy match on name/CR/VAT/IBAN + merge workflow.
**برومنت:** `/erp-build-feature mdm-duplicate-detect` — Levenshtein/SoundEx + merge UI.

## P1-57 · Master Data Approval Workflow — موافقات على بيانات الماستر
**ما المطلوب:** Vendor bank change requires dual approval + customer credit limit routed.
**برومنت:** `/erp-build-feature mdm-approval-workflow` — extend ApprovalEngine to MD changes.

## P1-58 · ZATCA Phase 2 Buyer-Side (Inbound Clearance) — استقبال فواتير ZATCA
**ما المطلوب:** Receive supplier ZATCA invoice via API + verify QR/UUID + match to PO.
**برومنت:** `/erp-build-feature zatca-inbound` — webhook + verification + auto-AP.

## P1-59 · Saudi Statutory Reports Pack
(غُطّي في P0-13)

## P1-60 · Document Retention & Legal Hold — احتفاظ ومنع حذف
**ما المطلوب:** Retention rule per object type + legal hold flag.
**برومنت:** `/erp-build-feature retention-legal-hold` — retention engine + hold flags.

## P1-61 · Segregation of Duties (SoD) — فصل المهام
**ما المطلوب:** SoD rule library + user role conflict detection.
**برومنت:** `/erp-build-feature sod-engine` — rule library + scanner + mitigation tracking.

## P1-62 · Mobile Executive Dashboards — لوحات تنفيذية للجوال
**ما المطلوب:** Native mobile exec view + push alerts + threshold subscriptions.
**برومنت:** `/erp-build-feature mobile-exec-dashboards` — PWA exec view + alert subscriptions.

---

## ملخص

- **22 بند P0** بـ تفصيل كامل (جداول + UI + برومنت + سيناريو + فلو).
- **62 بند P1** بـ تفصيل مختصر لكن قابل للتنفيذ.
- **الإجمالي 84 بند**.

**كيف تستخدم هذا الملف:**
1. اختر بنداً.
2. انسخ البرومنت.
3. الصقه في chat جديد مع مرجع لهذا الملف.
4. سأبني الميزة كاملة (Schema + APIs + Frontend + Tests).

→ تابع في `03_GLOBAL_GAPS_P2_P3.md` لميزات أقل أولوية.
→ أو `04_SAUDI_GAPS.md` للامتثال السعودي.
