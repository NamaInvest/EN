# البرومنتات الجاهزة — المبيعات / المشتريات / المخزون / التصنيع

كل بند: **الحالة الحالية** → **السيناريو العالمي** → **فلو البيانات** → **برومنت جاهز**.

---

## C-01 — E-Commerce Frontend (لا Frontend موجود!)

### الحالة الحالية
`/api/b2b/shop/` و `/api/ecommerce/` موجودة كـ APIs أساسية، **لا واجهة عميل أمامية**، لا cart UI، لا checkout flow، لا product catalog public.

### السيناريو العالمي (Shopify/Salla)
العميل يدخل example.com/shop → يتصفح، يبحث، يضيف للسلة، يدخل بياناته، يدفع، يتلقى تأكيد بالإيميل + WhatsApp + يتابع الشحن.

### فلو البيانات
```
[Public Shop URL] → [Catalog Page]
                          │
                          ▼
                 [Product Detail]
                          │
                          ▼
                  [Add to Cart] (localStorage + session)
                          │
                          ▼
                  [Cart Review]
                          │
                          ▼
                  [Checkout]
                  ├─ Guest or Login
                  ├─ Address (Saudi cities)
                  ├─ Shipping option
                  └─ Payment: Mada/Visa/Apple Pay/STC Pay/BNPL
                          │
                          ▼
                  [Order Created] → [Sales Invoice + ZATCA]
                          │
                          ├─ Email confirmation
                          ├─ WhatsApp notification
                          ├─ Track shipment URL
                          └─ Customer portal access
```

### البرومنت الجاهز
```
بناء E-Commerce Frontend في app/shop/ (Public).

1. Pages (Next.js App Router):
   - app/shop/page.tsx → Home (hero + featured + categories)
   - app/shop/[category]/page.tsx → category browsing
   - app/shop/product/[slug]/page.tsx → product detail
   - app/shop/cart/page.tsx → cart review
   - app/shop/checkout/page.tsx → 3-step wizard
   - app/shop/order-confirmation/[id]/page.tsx
   - app/shop/account/* → customer dashboard (orders، addresses، wishlist)
   - app/shop/track/[orderId]/page.tsx (public tracking)

2. Components:
   - <ProductCard /> مع image, price, rating, "add to cart"
   - <Cart /> sticky drawer
   - <CheckoutWizard /> 3 steps
   - <PaymentMethodSelector /> (Mada/Visa/Apple Pay/STC Pay/Tabby/Tamara)
   - <AddressForm /> مع Saudi cities autocomplete
   - <OrderTimeline /> (placed → confirmed → shipped → delivered)

3. State:
   - Zustand store للـ cart (persisted to localStorage)
   - SWR للـ products
   - بسيط — لا redux

4. API endpoints (extend existing):
   - GET /api/shop/products (public, paginated, search)
   - GET /api/shop/products/[slug]
   - POST /api/shop/cart (session-based)
   - POST /api/shop/checkout (creates order + invoice + ZATCA)
   - POST /api/shop/customers/register
   - POST /api/shop/auth/login (separate from B2B login)
   - GET /api/shop/orders/[id]/track

5. Payment integration:
   - Moyasar / HyperPay للـ Mada
   - Stripe للـ Visa
   - Apple Pay / Google Pay
   - STC Pay
   - Tabby/Tamara (BNPL — موجود partially)

6. Saudi-specific:
   - VAT 15% inclusive display
   - Saudi address format
   - Hijri date option
   - Arabic RTL throughout

7. SEO:
   - Server-rendered product pages
   - structured data (Product schema)
   - sitemap.xml
   - robots.txt

8. PWA:
   - install on phone
   - offline cart
   - push notifications

9. Tests:
   - guest checkout flow
   - logged-in customer (saved address)
   - payment failure recovery
   - mobile responsive
```

---

## C-02 — Subscription Billing / Recurring Invoices إنتاجي

### الحالة الحالية
`/api/recurring-invoices/` موجود لكن غير مكتمل. لا دورة فوترة تلقائية، لا dunning، لا upgrade/downgrade.

### السيناريو العالمي (Zuora / Stripe Billing)
عميل يشترك بخطة شهرية. النظام كل شهر يولد فاتورة، يحاول تحصيل من البطاقة المحفوظة، يعيد المحاولة 3 مرات إن فشل، ينقل لـ dunning، يلغي إن لم يدفع.

### البرومنت الجاهز
```
بناء Subscription Billing كامل.

1. Schema:
   SubscriptionPlan {
     id, code, name, billingCycle (MONTHLY|QUARTERLY|YEARLY), price Decimal,
     setupFee?, trialDays, features JSON, isActive
   }
   Subscription {
     id, customerId, planId, startDate, currentPeriodStart, currentPeriodEnd,
     nextBillingDate, status (TRIAL|ACTIVE|PAST_DUE|PAUSED|CANCELLED|ENDED),
     cancelAtPeriodEnd bool, paymentMethodId, prorationCredit Decimal
   }
   SubscriptionInvoice {
     id, subscriptionId, periodStart, periodEnd, amount, salesInvoiceId?, status
   }
   PaymentMethod {
     id, customerId, type (CARD|MADA|BANK), last4, expiry, providerToken (encrypted), isDefault
   }
   SubscriptionEvent { id, subId, type, payload JSON, createdAt }

2. Engine src/lib/subscription-engine.ts:
   - createSubscription(customerId, planId, paymentMethodId, trialDays?)
   - generateRecurringInvoices(): cron daily 2 AM
     * find active subs where nextBillingDate ≤ today
     * create SubscriptionInvoice + Sales Invoice
     * attempt charge via paymentMethodId
     * success: mark paid + update period
     * fail: status=PAST_DUE + trigger dunning
   - upgradeDowngradePlan(subId, newPlanId, prorate bool)
     * compute proration credit/charge
     * apply to next invoice
   - cancelSubscription(subId, atPeriodEnd: bool, reason)
   - pauseSubscription(subId, untilDate)

3. Dunning integration:
   - on PAST_DUE → trigger src/lib/dunning-engine.ts
   - retry payment 3 times (day 1, 3, 7)
   - on final fail → status=CANCELLED

4. API:
   - CRUD /api/billing/plans
   - GET /api/billing/subscriptions?customerId
   - POST /api/billing/subscriptions (create)
   - POST /api/billing/subscriptions/[id]/upgrade
   - POST /api/billing/subscriptions/[id]/cancel
   - POST /api/billing/payment-methods (tokenize via Moyasar)
   - GET /api/billing/invoices?subscriptionId

5. UI /finance/subscriptions:
   - Plans tab (CRUD)
   - Subscriptions list
   - Customer subscription detail (status، payment history، usage)
   - Self-service portal for customers

6. Customer portal /portal/subscription:
   - عرض الخطة الحالية
   - upgrade/downgrade
   - update payment method
   - cancel
   - download invoices

7. Tests:
   - monthly renewal
   - failed payment + retries
   - upgrade mid-period (proration)
   - cancel at period end
```

---

## C-03 — Quote-to-Invoice Conversion + Quote Versioning

### الحالة الحالية
`/api/price-quotes/` موجود لكن لا conversion إلى فاتورة، لا revisions/versions.

### السيناريو العالمي
المندوب يصدر quote، العميل يطلب تعديل (نسخة 2)، يوافق، النظام يحوّل لـ Sales Order ثم Invoice مع نفس الأرقام والشروط.

### البرومنت الجاهز
```
أكمل Quote module.

1. Schema:
   ALTER PriceQuote: ADD versionNumber int default 1, parentQuoteId? (للـ revisions),
     status (DRAFT|SENT|ACCEPTED|REJECTED|EXPIRED|CONVERTED),
     convertedToSalesOrderId?, convertedAt?
   QuoteRevision { id, quoteId, version, changes JSON, revisedBy, revisedAt }

2. Engine:
   reviseQuote(quoteId, changes):
     - mark current as SUPERSEDED
     - create new version with parentQuoteId
     - copy lines + apply changes
   convertToSalesOrder(quoteId):
     - validate status=ACCEPTED
     - create SalesOrder with same lines
     - mark quote as CONVERTED
   convertToInvoice(quoteId):
     - convert to SO first إن لم يكن
     - then convert SO to Invoice (existing flow)
   sendQuoteEmail(quoteId): PDF + email + log

3. API:
   - POST /api/sales/quotes/[id]/revise
   - POST /api/sales/quotes/[id]/accept
   - POST /api/sales/quotes/[id]/reject
   - POST /api/sales/quotes/[id]/convert-to-so
   - POST /api/sales/quotes/[id]/convert-to-invoice
   - GET /api/sales/quotes/[id]/versions
   - POST /api/sales/quotes/[id]/email

4. UI /sales/quotes:
   - List مع filter بالحالة
   - Quote builder (drag products + discount + terms)
   - Revisions tab (compare versions side-by-side)
   - "Send to customer" button (email + WhatsApp)
   - "Convert" button (visible only if ACCEPTED)
   - Customer portal: accept/reject quote online

5. PDF template:
   - branding
   - quote # + version + valid till
   - line items + totals + VAT
   - terms & conditions
   - sales rep signature
   - "Click to accept" link (signed token)

6. Tests:
   - revise + version increment
   - accept → convert to SO → invoice
   - expired auto-marked
```

---

## C-04 — Product Variants (Size / Color / Material)

### الحالة الحالية
لا variants. كل variant ينشأ كمنتج منفصل (anti-pattern).

### السيناريو العالمي (Shopify/Odoo)
Parent: "T-Shirt Cotton Premium". Attributes: Size (S, M, L, XL) × Color (أحمر، أزرق، أبيض). 12 variants تلقائياً. كل variant SKU + barcode + stock + price.

### البرومنت الجاهز
```
بناء Product Variants.

1. Schema:
   AttributeGroup { id, name, values JSON } -- {Sizes: [S,M,L,XL]} | {Colors: [...]} 
   Product: ADD hasVariants bool default false, variantAttributeIds JSON
   ProductVariant {
     id, parentProductId, sku, attributes JSON ({size:"M",color:"أحمر"}),
     barcode, costOverride? Decimal, priceOverride? Decimal,
     weight?, image?, isActive
   }
   -- Inventory tracked per variant
   ALTER ProductStock: ADD variantId? FK
   ALTER SalesInvoiceLine: ADD variantId? FK
   ALTER PurchaseOrderLine: ADD variantId? FK

2. Engine src/lib/variant-engine.ts:
   - generateVariants(parentId, attributeGroups[]):
     * cartesian product
     * SKU pattern: PARENT-{ATTR1}-{ATTR2} (مثل TSH-M-RED)
     * barcode auto via numbering.ts
   - getVariantStock(variantId, warehouseId)
   - selectVariantForOrder(parentId, attrs): lookup matching variant

3. Migration:
   - existing simple products → no change
   - apparel/fashion products: prompt to migrate (manual)

4. POS integration:
   - product card → tap → variant picker (size + color matrix)
   - barcode scan → direct variant match

5. API:
   - GET /api/products/[id]/variants
   - POST /api/products/[id]/variants/generate
   - PUT /api/products/variants/[id]
   - POST /api/products/[id]/attributes (assign attribute groups)

6. UI:
   - Product editor: toggle "Has Variants"
   - Variant matrix (rows=Size, cols=Color, cells=stock+price)
   - bulk update prices
   - bulk delete inactive variants

7. Reports:
   - sales by variant attribute (best-selling color/size)

8. Tests:
   - 4 sizes × 3 colors = 12 variants
   - stock per variant
   - POS variant selection
```

---

## C-05 — Lot Lifecycle (Expiry / Quarantine / FEFO)

### الحالة الحالية
`Batch` model موجود لكن لا expiry alerts، لا quarantine status، لا FEFO picking.

### السيناريو العالمي (الصيدليات/أغذية)
دواء يصل بـ batch + expiry. النظام ينبه قبل 90 يوم. ينبه قبل 30 يوم بشكل حرج. يقوم بـ FEFO (First Expiring First Out) في الـ picking. يضع الـ batch في Quarantine إن وصلت شكوى.

### البرومنت الجاهز
```
أكمل Lot Lifecycle.

1. Schema:
   ALTER Batch: ADD status (AVAILABLE|QUARANTINED|EXPIRED|RECALLED|CONSUMED),
     supplierBatchNumber, manufacturedDate, expiryDate, qrCode,
     quarantineReason?, recalledAt?, recallReason?

2. Engine src/lib/lot-engine.ts:
   - alertExpiringBatches(asOfDate):
     * find batches expiring within 90/30/7 days
     * create Notifications + Email
   - quarantineBatch(batchId, reason, userId): updates status, blocks consumption
   - releaseFromQuarantine(batchId, userId)
   - recallBatch(batchId, reason): creates negative stock movement + customer notifications
   - pickFEFO(productId, qty, warehouseId): returns batch IDs in expiry order

3. Update sales/invoice creation:
   - if product.lotTracked: must select batch (or auto-FEFO)
   - prevent selling QUARANTINED/EXPIRED/RECALLED

4. API:
   - GET /api/inventory/batches?status=&expiringWithin=
   - POST /api/inventory/batches/[id]/quarantine
   - POST /api/inventory/batches/[id]/release
   - POST /api/inventory/batches/[id]/recall
   - GET /api/inventory/batches/expiring-report

5. UI /inventory/batches:
   - List with status badges (color-coded by expiry)
   - Detail page: timeline (manufactured → received → quarantined → released → consumed)
   - Bulk actions
   - Print batch QR labels

6. Cron:
   - Daily: expiring batches alert
   - Weekly: expiry report email to manager

7. Tests:
   - FEFO picking with mixed batches
   - quarantine prevents sale
   - 90/30/7 day alerts
   - recall triggers customer notification
```

---

## C-06 — Bin-Level Tracking + Putaway Rules + Pick Strategies

### الحالة الحالية
Warehouse model موجود لكن لا bins (rack/shelf/bin)، لا putaway rules، لا pick paths.

### السيناريو العالمي (SAP EWM / Manhattan)
المستودع 1000 m². 50 rack × 5 shelves × 10 bins. عند GRN: putaway rules تقترح bin (FIFO bin / nearest empty / by weight / by category). عند pick: wave picking يعطي order للعامل بـ optimal path.

### البرومنت الجاهز
```
بناء Bin-Level WMS.

1. Schema:
   StorageZone { id, warehouseId, code, name, type (BULK|PICK|RECEIVING|SHIPPING|QC) }
   Rack { id, zoneId, code, rows int, columns int }
   Bin { id, rackId, code, position (row,col), maxWeight, maxVolume, currentUtilization Decimal,
     bin Type (PALLET|CASE|EACH), allowedCategories JSON?, status (AVAILABLE|RESERVED|FULL|BLOCKED) }
   ProductStock: ADD binId? FK, replace warehouseId → keep + add bin
   PickList { id, salesOrderId, status, assignedTo, pickStrategyUsed }
   PickListLine { id, listId, productId, variantId?, batchId?, qty, sourceBinId, status, pickedAt? }
   PutawayRule { id, productId? OR categoryId?, preferredZoneId, fillStrategy (FIRST_EMPTY|FILL_PARTIAL|BY_VELOCITY) }

2. Engine src/lib/wms-engine.ts:
   - suggestPutaway(productId, qty, warehouseId): returns bin
     * lookup PutawayRule
     * apply strategy → bin
   - generatePickList(salesOrderId, strategy: FIFO|FEFO|NEAREST):
     * for each line: pick batches (FIFO/FEFO) → bins
     * optimize path: sort by physical layout
     * create PickListLines
   - waveSplitPickList(orderIds[]): combine multiple orders → single wave
   - confirmPick(lineId, actualBin, actualQty): updates stock + line

3. API:
   - CRUD /api/warehouses/[id]/zones, /racks, /bins
   - GET /api/inventory/bins?zone=&utilization=
   - POST /api/inventory/putaway/suggest
   - POST /api/sales-orders/[id]/generate-pick-list
   - POST /api/picking/[lineId]/confirm

4. UI:
   - Warehouse map (3D visualization optional)
   - Bin detail (current contents + capacity)
   - Mobile picker app (PWA)
     * scan order → display next bin
     * scan bin → confirm → display next
     * voice picking optional
   - Put-away worker app
     * scan GRN → suggest bin
     * scan bin → confirm

5. Tests:
   - putaway suggestion respects rules
   - pick path optimization
   - wave picking 5 orders
```

---

## C-07 — Quality Management (NCR / CAPA / Inspection Plans)

### الحالة الحالية
`quality-management.ts` engine + schema model موجودان كـ stub. لا inspection plans، لا CAPA workflow.

### البرومنت الجاهز
```
بناء QM module كامل.

1. Schema:
   QualitySpec { id, productId?, categoryId?, parameters JSON, version, isActive }
   -- parameters: [{name:"moisture", type:"NUMERIC", min:2, max:5, unit:"%"}, ...]
   QualityInspection {
     id, sourceDocType (GRN|MO|IN_PROCESS|FINAL_GOODS|RANDOM), sourceDocId,
     productId, batchId?, inspectedQty, results JSON,
     overallStatus (PASS|FAIL|REWORK|HOLD), inspectorId, inspectedAt
   }
   NCR { -- Non-Conformance Report
     id, inspectionId?, source, severity (MINOR|MAJOR|CRITICAL), description,
     dispositionType (USE_AS_IS|REWORK|RETURN_VENDOR|SCRAP), costImpact Decimal,
     vendorId?, status, createdBy, createdAt
   }
   CAPA { -- Corrective and Preventive Action
     id, ncrId, rootCause TEXT, action TEXT, owner, dueDate,
     status (OPEN|IN_PROGRESS|VERIFIED|CLOSED), effectivenessReview? TEXT,
     closedAt?, closedBy?
   }

2. Engine src/lib/quality-management.ts:
   - createInspection(sourceDocType, sourceDocId, productId, batchId?):
     * lookup QualitySpec
     * create inspection with parameters waiting
   - submitInspectionResults(inspectionId, results):
     * compare each parameter vs spec
     * compute overallStatus
     * if FAIL → auto-create NCR
   - createCAPA(ncrId, rootCause, action, owner, dueDate)
   - closeCAPA(capaId, effectivenessReview)
   - vendorScorecard(vendorId, period): NCR count + cost impact

3. Workflow integration:
   - on GRN posting: if product.qmEnabled → trigger inspection
   - inspection FAIL: hold the GRN (block invoice match)
   - inspection PASS: release for putaway

4. API:
   - CRUD /api/quality/specs
   - POST /api/quality/inspections (create)
   - PUT /api/quality/inspections/[id]/submit
   - CRUD /api/quality/ncr
   - CRUD /api/quality/capa
   - GET /api/quality/vendor-scorecards/[vendorId]

5. UI /quality:
   - Inspection queue (pending)
   - Inspector form (parameters input + photos upload)
   - NCR dashboard (severity heatmap)
   - CAPA list with due dates
   - Vendor quality reports

6. Tests:
   - inspection auto-fail when out-of-spec
   - NCR auto-creation on fail
   - CAPA workflow (OPEN → IN_PROGRESS → CLOSED)
```

---

## C-08 — Production Scheduling + Capacity Planning

### الحالة الحالية
`mrp-engine.ts` يحسب احتياج المواد لكن لا يخطط الجدول الزمني (CRP/MPS/APS).

### البرومنت الجاهز
```
بناء MPS + CRP + APS basic.

1. Schema:
   MasterProductionSchedule {
     id, period, productId, scheduledQty, demandSource JSON, status
   }
   CapacityCalendar {
     id, workCenterId, date, availableHours, plannedHours, actualHours, utilizationPct
   }
   ScheduledOperation {
     id, manufacturingOrderId, operationId, workCenterId,
     plannedStart, plannedEnd, sequence, status (PLANNED|SCHEDULED|IN_PROGRESS|DONE),
     dependencies JSON
   }

2. Engine src/lib/mps-engine.ts:
   - generateMPS(periodStart, periodEnd, granularity: WEEK|MONTH):
     * collect demand: sales forecast + open SOs + safety stock
     * for each product: compute net req per period
     * level loading: smooth peaks
   - capacityCheck(workCenterId, date, hoursNeeded): returns conflict?
   - scheduleOperations(moId, strategy: ASAP|JIT|FINITE):
     * forward/backward scheduling
     * respect work center capacity
     * create ScheduledOperation
   - reschedule(moId, reason): re-run for that MO and downstream

3. APS (Advanced Planning Scheduling):
   - finite capacity scheduling
   - alternate routings (if WC1 full → WC2)
   - setup time minimization (group similar SKUs)
   - Gantt visualization

4. API:
   - POST /api/manufacturing/mps/generate
   - GET /api/manufacturing/capacity?workCenter&dateRange
   - POST /api/manufacturing/orders/[id]/schedule
   - GET /api/manufacturing/gantt?workCenter&dateRange

5. UI /factory/scheduling:
   - MPS view: products × periods grid (editable cells)
   - Gantt chart: work centers × time
   - Capacity heatmap (red = overloaded)
   - Drag-drop operations to reschedule

6. Tests:
   - MPS generation from forecast + SOs
   - capacity overload detection
   - rescheduling cascading downstream
```

---

## C-09 — Subcontracting (Job Work)

### الحالة الحالية
`subcontracting-engine.ts` skeleton. لا workflow كامل.

### البرومنت الجاهز
```
بناء Subcontracting.

1. Schema:
   SubcontractingPO {
     id, vendorId, expectedDelivery, status,
     productToReceive (finished good), qtyExpected,
     materialsToSend JSON [{productId, qty}]
   }
   SubcontractMovement {
     id, scPoId, type (ISSUE_RAW|RETURN_RAW|RECEIVE_FINISHED), productId, qty, postedAt
   }

2. Workflow:
   STEP 1: Create SC PO → vendor will produce X using our Y
   STEP 2: Issue raw materials → stock movement (خصم من our inventory، subcontractor location remains "our ownership")
   STEP 3: Track at subcontractor (sub-stock area)
   STEP 4: Receive finished goods:
     - reverse materials consumption (auto-journal)
     - add finished to our inventory
   STEP 5: Vendor invoice (service charge):
     - post to COGS Manufacturing or WIP
   STEP 6: Material variance: actual consumed vs BOM expected → variance JE

3. ZATCA: subcontractor service فاتورة منفصلة (نعم).

4. API:
   - CRUD /api/manufacturing/subcontracting/pos
   - POST /api/manufacturing/subcontracting/[id]/issue-materials
   - POST /api/manufacturing/subcontracting/[id]/receive-finished
   - POST /api/manufacturing/subcontracting/[id]/invoice-vendor

5. UI /factory/subcontracting:
   - PO list
   - Stock-at-subcontractor view
   - Issue materials wizard
   - Receive wizard (with variance display)

6. Tests:
   - issue materials → quantities update
   - receive finished → reverse consumption
   - material variance posting
```

---

## C-10 — Receipt Printing + Discount Mgmt + POS Session

### الحالة الحالية
POS موحد مع Sales Invoice. **لا Receipt Printing template**، لا Session Management (open/close cash drawer)، لا Card Payment Integration.

### البرومنت الجاهز
```
أكمل POS لمستوى إنتاج.

1. Receipt Printing:
   - Create src/templates/pos-receipt.html (Arabic + ZATCA QR)
   - 80mm thermal printer support
   - Gateway: WebUSB (browser) أو KOT printer via local agent
   - PDF fallback for email

2. POS Session:
   PosSession {
     id, userId, terminalId, branchId, openingFloat Decimal,
     closingFloat?, expectedClosing Decimal, variance?,
     openedAt, closedAt?, status (OPEN|CLOSED), notes
   }
   PosSessionMovement {
     id, sessionId, type (CASH_IN|CASH_OUT|DROP|LIFT), amount, reason, createdAt
   }
   - openSession(userId, openingFloat)
   - closeSession(sessionId, actualCash):
     * compute expected = openingFloat + sales_cash - cash_out + cash_in
     * variance = actual - expected
     * post JE if variance ≠ 0 (DR/CR Cash Over/Short account)

3. Card Payment:
   - integrate Geidea/PayTabs/Moyasar
   - terminal API or browser payment
   - webhook for confirmation

4. UI /pos:
   - Splash: "Open Session" مع opening float input
   - Main POS screen
   - Session indicator (top: net cash so far)
   - Cash drawer button
   - End-of-day: "Close Session" → variance form

5. API:
   - POST /api/pos/sessions/open
   - POST /api/pos/sessions/[id]/close
   - GET /api/pos/sessions/active?userId
   - POST /api/pos/sessions/[id]/cash-movement
   - POST /api/pos/print-receipt/[invoiceId]

6. Tests:
   - open + sales + close → variance computation
   - JE posting on variance
   - receipt template rendering
```

---

## C-11 — RMA / Warranty Management

### الحالة الحالية
Sales Returns تعمل لكن لا RMA workflow متقدم، لا warranty tracking.

### البرومنت الجاهز
```
بناء RMA + Warranty.

1. Schema:
   RMA {
     id, salesInvoiceId, customerId, requestedAt, requestedBy,
     reason (DEFECTIVE|WRONG_ITEM|DAMAGED_SHIPPING|CHANGED_MIND|WARRANTY),
     status (REQUESTED|APPROVED|REJECTED|RECEIVED|REFUNDED|CLOSED),
     resolution (REFUND|REPLACE|REPAIR|CREDIT_NOTE),
     approvedBy?, items JSON, notes
   }
   WarrantyClaim {
     id, productId, serialNumber, customerId, soldDate, warrantyExpiry,
     issueDescription, claimDate, status, repairOrderId?, replacementOrderId?
   }
   WarrantyPolicy {
     id, productId? OR categoryId?, durationMonths, type (LIMITED|FULL|EXTENDED),
     conditions TEXT, costToCustomer Decimal
   }

2. Workflow:
   - Customer requests RMA (online portal أو هاتف)
   - Sales/Manager approves
   - RMA number generated (numbering.ts)
   - Customer ships back (or pickup)
   - Warehouse receives → inspect
   - Decision: refund / replace / repair / reject
   - If refund: credit note + refund payment

3. API:
   - POST /api/sales/rma (create)
   - PUT /api/sales/rma/[id]/approve
   - PUT /api/sales/rma/[id]/receive
   - POST /api/sales/rma/[id]/resolve { resolution }
   - GET /api/warranty/check?serialNumber

4. UI:
   - Customer portal: "Request Return" wizard
   - Backoffice: RMA queue + approval
   - Warehouse: receive RMA scan
   - Service desk: warranty claims

5. Reports:
   - RMA rate by product
   - reason breakdown
   - warranty cost
```

---

## C-12 — Three-Way Match + Tolerance Engine متقدم

### الحالة الحالية
`three-way-match.ts` موجود ويعمل بـ tolerance basic. لا UI workbench واضح لحل الـ exceptions.

### البرومنت الجاهز
```
أكمل Three-Way Match Workbench.

1. Schema (extend):
   TolerancePolicy {
     id, name, priceTolerancePct Decimal, qtyTolerancePct Decimal,
     totalToleranceFlat Decimal, action (AUTO_APPROVE|MANUAL|HOLD),
     applicableTo (DEFAULT|VENDOR_ID|CATEGORY)
   }
   InvoiceMatchResult {
     id, invoiceId, status (MATCHED|HOLD_PRICE|HOLD_QTY|HOLD_TOTAL|MANUAL_REVIEW),
     priceDiff, qtyDiff, totalDiff, resolvedBy?, resolvedAt?, resolution
   }

2. Engine (extend):
   - matchInvoice(invoiceId):
     * find PO + GRNs
     * compare:
       - price line vs PO.price (per item) ± tolerance
       - sum(GRN.qty) vs Invoice.qty ± tolerance
       - total ± tolerance
     * apply policy action
   - resolveHold(matchId, resolution: ACCEPT|REJECT|ADJUST_PO|ADJUST_INVOICE)

3. API:
   - GET /api/finance/match/queue (pending exceptions)
   - POST /api/finance/match/[id]/resolve

4. UI /finance/three-way-match:
   - Queue: list of holds with severity color
   - Detail: side-by-side PO / GRN / Invoice + diffs highlighted
   - Resolution actions
   - Approval workflow if amount > threshold
```

---

# ملخص فجوات التجارة الـ 12

| # | الفجوة | الأولوية |
|---|------|------|
| C-01 | E-Commerce Frontend | 🔴 |
| C-02 | Subscription Billing | 🟠 |
| C-03 | Quote-to-Invoice + Versions | 🟠 |
| C-04 | Product Variants | 🟠 |
| C-05 | Lot Lifecycle (Expiry/Quarantine) | 🟠 |
| C-06 | Bin-Level WMS | 🟡 |
| C-07 | Quality Management (NCR/CAPA) | 🟠 |
| C-08 | Production Scheduling + Capacity | 🔴 |
| C-09 | Subcontracting | 🟡 |
| C-10 | Receipt Print + POS Session + Card | 🔴 |
| C-11 | RMA / Warranty | 🟠 |
| C-12 | Three-Way Match Workbench | 🟡 |
