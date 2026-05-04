# النقص #13: Sales Core (Invoices + SO + Quotes + Returns + Delivery) — مواصفات تفصيلية

> **المرجعيات:** SAP SD (Sales & Distribution)، Oracle Order Management、NetSuite SuiteSales、MS D365 F&O Sales、Odoo Sales、Salesforce CPQ
> **معايير:** ZATCA Phase 2 (KSA)、IFRS 15 revenue、SOCPA、Saudi Commercial Code

---

## 1. البرومنت الكامل

```
وسّع Sales Core في Namasoft ERP لمستوى SAP SD:

ملفات موجودة:
- src/lib/quote-engine.ts
- src/lib/auto-journal.ts (sales scenarios)
- src/app/api/sales/* (10+ routes)
- prisma: SalesInvoice, SalesOrder, PriceQuote, SalesReturn, DeliveryNote, SalesmanCommission

النواقص لإضافتها:

A) Sales Invoice المحسّن:
   - Multi-currency مع FX freeze عند الإصدار
   - Tax breakdown متعدد (VAT 15% + Excise + Custom)
   - ZATCA QR + signed XML + clearance status
   - Credit/Debit notes مرتبطة بالأصل
   - Recurring template support
   - Down payment / Advance application
   - Partial deliveries مع pro-rata invoicing
   - Consignment vs straight sale
   - Drop-shipment flag مع PO auto-trigger
   - Customer PO reference
   - Salesperson + commission rule
   - Discount header + line + cumulative
   - Free goods (BOGO)
   - Trade-in credits

B) Sales Order Workflow:
   - DRAFT → CONFIRMED → APPROVED → ALLOCATED → PICKED → PACKED → SHIPPED → DELIVERED → INVOICED → COMPLETED
   - ATP (Available-to-Promise) check
   - Backorder management
   - Order modification (with audit trail)
   - Order cancellation (with restocking fee)
   - Hold management (credit/quality/legal)
   - Drop-ship vs warehouse fulfillment

C) Quote (CPQ):
   - Multi-version revisions
   - Configurator (variants + options)
   - Approval workflow (margin-based)
   - Validity period + expiry
   - Convert to SO with single click
   - Lost reason tracking
   - Bundle pricing

D) Sales Returns / RMA:
   - RMA approval workflow
   - Return reasons catalog
   - Restocking fees
   - Inspection upon return
   - Refund vs credit memo
   - Replacement orders

E) Delivery Notes:
   - Pick list generation
   - Pack list with weight/dimensions
   - Carrier integration
   - PoD (Proof of Delivery)
   - Return delivery note for rejections

F) Salesman Commission Engine:
   - Per product / per category / per customer
   - Tiered (volume-based)
   - Split commissions (team)
   - Clawback on returns
   - Monthly calculation + payroll integration

G) APIs (60+ endpoints): انظر القسم 7

H) UI (25 pages): انظر قسم 5-7

I) Tests: 80+ unit, 30 integration, 12 E2E
```

---

## 2. السيناريوهات (10)

### A — Quote → Order → Delivery → Invoice (Full Cycle)
```
1. Customer requests quote for 500 units of Product X
2. Sales rep: /sales/quotes → [+ Quote]
   - customer + line + price 100 SAR
   - margin: 30% (auto-calculated)
   - validity: 30 days
3. Manager approves (because margin > threshold) → Quote SENT
4. Customer accepts → 1-click "Convert to SO"
5. SO created (DRAFT) → ATP check shows 350 in stock + 200 in production
6. Order CONFIRMED → APPROVED (auto if credit OK)
7. Allocation: 350 from warehouse, 150 backorder
8. Pick list generated → warehouse picks → PICKED status
9. Pack list → weight/dim → PACKED
10. Carrier (Aramex) booked → SHIPPED with tracking
11. Customer receives → PoD scanned → DELIVERED
12. Invoice auto-generated (INV-2026-001234)
13. ZATCA cleared → QR added → emailed to customer
14. AR: open item created
15. Salesperson commission accrued: 5% × 50,000 = 2,500
```

### B — Down Payment + Final Invoice
```
- contract 100,000 SAR
- 30% down payment 30,000 → invoice "down payment INV"
  JE: DR Cash 30K / CR Customer Advance 30K
- delivery → final invoice 100,000 with offset:
  - line items: 100,000
  - applied advance: -30,000
  - net due: 70,000
  JE: DR Customer 70K, DR Customer Advance 30K / CR Sales 100K
```

### C — Partial Delivery
```
- SO 1000 units
- deliver 600 first batch → DN1 → INV1 for 600 × price
- 400 remaining: backorder
- 2 weeks later: deliver 400 → DN2 → INV2
- both invoices linked to single SO
- ATP recalculates after each delivery
```

### D — Drop-shipment
```
- Customer orders custom item (not stocked)
- SO with drop-ship flag
- Auto-creates PO to vendor
- Vendor ships directly to customer
- GRN at customer location (signed PoD)
- COGS recognized on PO receipt
- Invoice to customer
```

### E — Sales Return + Refund
```
- Customer returns 50 units (defective)
- /sales/rma → [+ RMA]
- Reason: Defective | Original invoice: INV-001234
- Manager approves → RMA-001
- Customer ships back → received at warehouse
- Inspection: 45 OK + 5 unrepairable
- Credit memo for 45 + writeoff 5
- Refund to customer (or credit balance)
- Salesman commission clawback: -225
```

### F — Configurable Product Quote
```
- Product: "Custom Computer" with options:
  - CPU: i5/i7/i9 (price diff)
  - RAM: 8/16/32GB
  - Storage: 256GB/512GB/1TB
  - GPU: optional
- Configurator computes price + checks compatibility
- Generates quote with detailed BOM
- On acceptance → MO created automatically
```

### G — Volume Discount Tiers
```
- Customer "ABC Corp" eligible for tier discount:
  - 0-100 units: 0%
  - 101-500: 5%
  - 501-1000: 8%
  - 1001+: 12%
- Buys 750 → 8% discount applied automatically
- Dashboard shows: "buy 251 more for 12% tier"
```

### H — Bundle / BOGO Promotion
```
- Active promotion: "Buy 2 Get 1 Free"
- Customer adds 2 of product X → system auto-adds 1 free
- Invoice shows: 3 × 100 = 300, discount -100, net 200
```

### I — Credit Hold During Order
```
- Customer overdue invoices > credit limit
- New SO → blocked at APPROVAL stage
- Sales rep requests override → CFO approves with reason
- Order proceeds, but flagged
```

### J — Multi-currency Sale
```
- Saudi company sells to UAE customer
- Quote in AED 50,000 (rate 1.020 SAR/AED)
- Invoice frozen at 51,000 SAR equivalent
- Customer pays in AED later (rate 1.018) → FX loss recorded
```

---

## 3. تدفق البيانات

```
[Quote] → POST /sales/quotes
   ↓
   create PriceQuote + lines + revisions
   ↓
   margin check → if < threshold → require approval
   ↓
   send to customer (email/WhatsApp)
   ↓
   customer accepts → POST /sales/quotes/:id/convert-to-so
   ↓
   create SalesOrder (DRAFT)
   ↓
   ATP check → split warehouse vs backorder
   ↓
   credit check → block if exceeded
   ↓
   approval workflow (if needed)
   ↓
   stock allocation → reservation
   ↓
   pick list → packing → shipping → DN
   ↓
   delivery → POST /sales/dn/:id/confirm-delivery (PoD)
   ↓
   auto-create invoice from DN
   ↓
   ZATCA submission → QR + cleared
   ↓
   email/WhatsApp invoice to customer
   ↓
   create OpenItem (AR)
   ↓
   accrue salesman commission
```

---

## 4. Prisma Schema (إضافات)

```prisma
model SalesInvoice {
  // ... existing
  
  // Multi-currency
  currency                String      @default("SAR")
  exchangeRate            Decimal     @default(1) @db.Decimal(20,8)
  exchangeRateDate        DateTime?
  amountFunctional        Decimal?    @db.Decimal(20,4)
  
  // ZATCA
  zatcaUuid               String?     @unique
  zatcaIcv                Int?
  zatcaPih                String?
  zatcaQrCode             String?     @db.Text
  zatcaXmlUrl             String?
  zatcaClearanceStatus    String?
  zatcaSubmittedAt        DateTime?
  
  // Credit Notes link
  parentInvoiceId         Int?
  parentInvoice           SalesInvoice? @relation("CreditNotes", fields: [parentInvoiceId], references: [id])
  creditNotes             SalesInvoice[] @relation("CreditNotes")
  invoiceType             String      @default("INVOICE")  // INVOICE | CREDIT_NOTE | DEBIT_NOTE | DOWN_PAYMENT | FINAL_INVOICE | PROFORMA
  
  // Down payment
  appliedAdvanceAmount    Decimal?    @db.Decimal(20,4)
  appliedAdvanceJournalId Int?
  
  // Customer reference
  customerPoNumber        String?
  customerOrderDate       DateTime?
  
  // Salesperson + commission
  salespersonId           Int?
  commissionRuleId        Int?
  commissionAmount        Decimal?    @db.Decimal(20,4)
  commissionStatus        String?     // PENDING | ACCRUED | PAID | CLAWBACK
  
  // Recurring
  recurringTemplateId     Int?
  recurringSequence       Int?
  
  // Delivery link
  deliveryNoteId          Int?
  deliveryNote            DeliveryNote? @relation(fields: [deliveryNoteId], references: [id])
  
  // Source order
  salesOrderId            Int?
  
  // Discount tracking
  totalDiscountHeader     Decimal?    @db.Decimal(20,4)
  totalDiscountLine       Decimal?    @db.Decimal(20,4)
  freeGoodsAmount         Decimal?    @db.Decimal(20,4)
  
  // Hold
  holdReason              String?
  holdAt                  DateTime?
  releasedFromHoldAt      DateTime?
  
  @@index([zatcaUuid])
  @@index([customerPoNumber])
}

model SalesOrder {
  // ... existing
  status                  String      @default("DRAFT")
  // DRAFT | CONFIRMED | PENDING_APPROVAL | APPROVED | REJECTED | ON_HOLD | ALLOCATED | PICKED | PACKED | SHIPPED | DELIVERED | INVOICED | COMPLETED | CANCELLED
  
  customerPoNumber        String?
  expectedDeliveryDate    DateTime?
  shipToAddress           Json?
  billToAddress           Json?
  isDropShip              Boolean     @default(false)
  isConsignment           Boolean     @default(false)
  
  // ATP results
  atpCheckedAt            DateTime?
  atpAvailableQty         Decimal?    @db.Decimal(20,4)
  atpBackorderQty         Decimal?    @db.Decimal(20,4)
  
  // Hold
  holdType                String?     // CREDIT | QUALITY | LEGAL | CUSTOMER_REQUEST
  holdReason              String?
  
  // Source
  quoteId                 Int?
  contractId              Int?
  
  // Approval
  approvalRequired        Boolean     @default(false)
  approvedAt              DateTime?
  approvedByUserId        String?
  
  // Cancellation
  cancelledAt             DateTime?
  cancelledByUserId       String?
  cancellationReason      String?
  restockingFee           Decimal?    @db.Decimal(20,4)
  
  // Modifications
  modifications           SalesOrderModification[]
}

model SalesOrderModification {
  id                      Int         @id @default(autoincrement())
  salesOrderId            Int
  salesOrder              SalesOrder  @relation(fields: [salesOrderId], references: [id])
  modificationDate        DateTime    @default(now())
  modificationType        String      // ADD_LINE | REMOVE_LINE | QTY_CHANGE | PRICE_CHANGE | DATE_CHANGE | ADDRESS_CHANGE
  oldValue                Json?
  newValue                Json?
  reason                  String      @db.Text
  approvedByUserId        String?
  modifiedByUserId        String
}

model PriceQuote {
  // ... existing
  status                  String      @default("DRAFT")
  // DRAFT | PENDING_APPROVAL | APPROVED | SENT | REVISED | ACCEPTED | REJECTED | EXPIRED | CONVERTED
  
  validUntil              DateTime
  marginPercent           Decimal?    @db.Decimal(5,2)
  marginAmount            Decimal?    @db.Decimal(20,4)
  
  // Versioning
  version                 Int         @default(1)
  parentQuoteId           Int?
  
  // CPQ
  configuratorData        Json?
  bundleId                Int?
  
  // Lost reason
  lostReason              String?
  lostToCompetitor        String?
  lostReasonDetails       String?     @db.Text
  
  // Conversion
  convertedToOrderId      Int?
  convertedAt             DateTime?
}

model SalesReturn {
  // ... existing
  rmaNumber               String      @unique
  status                  String      @default("DRAFT")
  // DRAFT | PENDING_APPROVAL | APPROVED | RECEIVED | INSPECTED | CREDITED | REFUNDED | CANCELLED
  
  reasonCode              String
  reasonDetails           String?     @db.Text
  originalInvoiceId       Int
  
  inspectionCompletedAt   DateTime?
  inspectionResult        Json?       // {acceptedQty, defectiveQty, conditionPerLine}
  
  restockingFeePercent    Decimal?    @db.Decimal(5,2)
  restockingFeeAmount     Decimal?    @db.Decimal(20,4)
  
  refundMethod            String?     // CASH | CREDIT_MEMO | REPLACEMENT | STORE_CREDIT
  creditMemoInvoiceId     Int?
  replacementOrderId      Int?
  
  approvedByUserId        String?
  approvedAt              DateTime?
}

model DeliveryNote {
  // ... existing
  status                  String      @default("DRAFT")
  // DRAFT | PICKED | PACKED | READY_TO_SHIP | SHIPPED | IN_TRANSIT | DELIVERED | RETURNED | FAILED
  
  pickListId              Int?
  packListData            Json?       // {weight, dimensions, packageCount}
  
  carrierId               Int?
  carrierName             String?
  trackingNumber          String?
  shippedAt               DateTime?
  deliveredAt             DateTime?
  podSignature            String?
  podPhotoUrl             String?
  podReceivedBy           String?
  
  failureReason           String?
}

model SalesmanCommissionRule {
  id                      Int         @id @default(autoincrement())
  name                    String
  
  scope                   String      // 'GLOBAL' | 'PRODUCT' | 'CATEGORY' | 'CUSTOMER' | 'TERRITORY'
  scopeIds                Int[]
  
  calculationType         String      // 'FLAT_PERCENT' | 'TIERED' | 'FIXED_PER_UNIT' | 'PROFIT_BASED'
  flatPercent             Decimal?    @db.Decimal(5,2)
  tiers                   Json?       // [{from, to, percent}]
  fixedPerUnit            Decimal?    @db.Decimal(20,4)
  profitPercent           Decimal?    @db.Decimal(5,2)
  
  applicableSalespersonIds Int[]
  
  effectiveFrom           DateTime
  effectiveTo             DateTime?
  active                  Boolean     @default(true)
}

model SalesmanCommission {
  // ... existing
  ruleId                  Int?
  invoiceId               Int
  amount                  Decimal     @db.Decimal(20,4)
  status                  String      @default("PENDING")  // PENDING | ACCRUED | PAID | CLAWBACK
  
  accruedJournalId        Int?
  paymentJournalId        Int?
  clawbackJournalId       Int?
  
  paidInPayrollRunId      Int?
  paidAt                  DateTime?
}

model AtpCheck {
  id                      Int         @id @default(autoincrement())
  salesOrderId            Int
  productId               Int
  requestedQty            Decimal     @db.Decimal(20,4)
  
  availableInWarehouse    Decimal     @db.Decimal(20,4)
  availableFromWip        Decimal     @db.Decimal(20,4)
  availableFromPo         Decimal     @db.Decimal(20,4)
  totalAvailable          Decimal     @db.Decimal(20,4)
  
  shortageQty             Decimal     @db.Decimal(20,4)
  expectedAvailableDate   DateTime?
  
  checkedAt               DateTime    @default(now())
}
```

---

## 5. Forms & Fields

### Form A: Sales Invoice (Multi-step)

**Step 1 — Header:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| invoiceNumber | text | auto | unique |
| customerId | autocomplete | ✓ | active customer + credit ok |
| customerPoNumber | text | ✗ | — |
| salespersonId | dropdown | ✗ | active employee |
| invoiceDate | datepicker | ✓ | within open period |
| dueDate | datepicker | auto | based on payment terms |
| currency | dropdown | ✓ | from customer or override |
| exchangeRate | money | auto | from FX table |
| paymentTerms | dropdown | ✓ | Net30, 2/10 Net 30, EOM, etc. |
| invoiceType | radio | ✓ | INVOICE, DOWN_PAYMENT, FINAL, PROFORMA, CREDIT_NOTE, DEBIT_NOTE |
| parentInvoiceId | dropdown | conditional | if credit/debit note |
| salesOrderId | dropdown | ✗ | from open SOs of customer |
| deliveryNoteId | dropdown | ✗ | from undelivered DNs |

**Step 2 — Lines (dynamic table):**
| Field | Type | Required |
|-------|------|----------|
| productId | autocomplete | ✓ |
| description | text | auto |
| quantity | number | ✓ |
| uom | dropdown | ✓ |
| unitPrice | money | ✓ |
| discount % | percent | ✗ |
| discount amount | money | auto |
| taxCode | dropdown | ✓ (VAT 15%, Zero, Exempt) |
| taxAmount | money | auto |
| lineTotal | money | auto |
| costCenter | dropdown | ✗ |
| project | dropdown | ✗ |

**Step 3 — Discounts & Adjustments:**
| Field | Type | Required |
|-------|------|----------|
| headerDiscountPercent | number | ✗ |
| headerDiscountAmount | money | auto |
| freeGoodsValue | money | auto from BOGO |
| shippingCost | money | ✗ |
| handlingFee | money | ✗ |
| appliedAdvance | money | ✗ (for final invoice) |

**Step 4 — Addresses & Notes:**
| Field | Type | Required |
|-------|------|----------|
| billToAddress | textarea | auto |
| shipToAddress | textarea | auto |
| internalNotes | textarea | ✗ |
| customerNotes | textarea | ✗ |

### Form B: Sales Order (Multi-step)
- نفس Invoice + ATP check + delivery scheduling + drop-ship toggle

### Form C: Quote
- Header + Lines + Configurator + Validity + Margin display + Approval if needed

### Form D: RMA Request
| Field | Type | Required |
|-------|------|----------|
| originalInvoiceId | autocomplete | ✓ |
| reasonCode | dropdown | ✓ |
| reasonDetails | textarea | ✓ |
| restockingFee | toggle + percent | ✗ |
| refundMethod | radio | ✓ |
| linesToReturn | dynamic table | ✓ min 1 |

### Form E: Delivery Note
- Header (carrier, expected date) + Lines (from SO) + Pack (weight/dim) + PoD upload

### Form F: Salesman Commission Rule
- Scope + Calculation Type + Tiers + Salespeople + Effective dates

---

## 6. Tables & Columns

### Grid A: Sales Invoices
| Column | Width |
|--------|-------|
| Invoice # | 130 |
| Type | badge | 110 |
| Date | 110 |
| Due Date | 110 |
| Customer | 200 |
| Customer PO | 130 |
| Salesperson | 150 |
| Currency | 80 |
| Total | money | 130 |
| Tax | money | 110 |
| Paid | money | 110 |
| Balance | money | 130 |
| ZATCA | badge | 100 (cleared/pending/failed) |
| Status | badge | 110 |
| Aging | days | 100 (color coded) |
| Actions: [View] [Print] [Email] [Credit] [Pay] | 200 |

### Grid B: Sales Orders
| Column | Width |
|--------|-------|
| Order # | 130 |
| Date | 110 |
| Customer | 200 |
| Salesperson | 150 |
| Total | money | 130 |
| Status | badge + step | 200 (workflow visual) |
| ATP | badge | 100 (full/partial/back) |
| Expected Delivery | 130 |
| Drop-ship | toggle | 80 |
| On Hold | badge | 100 |
| Actions: [View] [Approve] [Allocate] [Ship] [Cancel] | 250 |

### Grid C: Quotes
| Column | Width |
|--------|-------|
| Quote # | 130 |
| Version | 80 |
| Date | 110 |
| Customer | 200 |
| Total | money | 130 |
| Margin % | percent | 100 |
| Valid Until | 110 |
| Days Left | days | 100 |
| Status | badge | 130 |
| Lost Reason | text | 200 (if lost) |
| Actions: [View] [Revise] [Send] [Convert] | 200 |

### Grid D: Returns / RMA
| Column | Width |
|--------|-------|
| RMA # | 130 |
| Date | 110 |
| Customer | 200 |
| Original Invoice | link | 130 |
| Reason | badge | 150 |
| Total Value | money | 130 |
| Refund Method | badge | 130 |
| Status | badge | 130 |
| Actions: [Approve] [Receive] [Inspect] [Issue Credit] | 250 |

### Grid E: Delivery Notes
| Column | Width |
|--------|-------|
| DN # | 130 |
| Date | 110 |
| Customer | 200 |
| Source SO | link | 130 |
| Carrier | 130 |
| Tracking | text | 150 |
| Status | badge | 130 |
| Shipped | date | 110 |
| Delivered | date | 110 |
| PoD | icon | 80 |
| Actions: [View] [Track] [Print Label] [Confirm Delivery] | 250 |

### Grid F: Commissions Pending
| Column | Width |
|--------|-------|
| Period | 110 |
| Salesperson | 150 |
| Invoice | link | 130 |
| Amount | money | 130 |
| Rule | badge | 150 |
| Status | badge | 110 |
| Actions: [Approve] [Pay] [Clawback] | 200 |

---

## 7. Buttons & Actions

| ID | الزر | اللون | Permission |
|----|------|-------|------------|
| btn-invoice-create | + فاتورة جديدة | 🟢 | role.sales |
| btn-invoice-from-so | إنشاء من أمر بيع | 🟦 | role.sales |
| btn-invoice-from-dn | إنشاء من إذن تسليم | 🟦 | role.sales |
| btn-invoice-credit-note | إصدار إشعار دائن | 🔴 | role.sales_supervisor |
| btn-invoice-debit-note | إصدار إشعار مدين | 🟡 | role.sales_supervisor |
| btn-invoice-zatca-submit | إرسال للزكاة | 🟦 | role.sales |
| btn-invoice-zatca-resubmit | إعادة الإرسال | 🟡 | role.sales_supervisor |
| btn-invoice-print | طباعة | ⬜ | viewer |
| btn-invoice-email | إرسال بالبريد | 🟦 | role.sales |
| btn-invoice-whatsapp | إرسال بـ WhatsApp | 🟢 | role.sales |
| btn-invoice-cancel | إلغاء | 🔴 | role.sales_manager + reason |
| btn-invoice-clone | استنساخ | ⬜ | role.sales |
| btn-invoice-add-payment | تسجيل دفعة | 🟢 | role.ar |
| btn-so-create | + أمر بيع | 🟢 | role.sales |
| btn-so-confirm | تأكيد | 🟦 | role.sales |
| btn-so-approve | موافقة | 🟢 | role.sales_supervisor |
| btn-so-reject | رفض | 🔴 | role.sales_supervisor |
| btn-so-hold | إيقاف | 🟡 | role.sales_supervisor + type |
| btn-so-release-hold | رفع الإيقاف | 🟢 | role.sales_supervisor |
| btn-so-modify | تعديل | ⬜ | role.sales (with audit) |
| btn-so-cancel | إلغاء | 🔴 | role.sales_manager + fee |
| btn-so-allocate | تخصيص المخزون | 🟦 | role.warehouse |
| btn-so-pick | بدء التحضير | 🟦 | role.warehouse |
| btn-so-pack | تجهيز التغليف | 🟦 | role.warehouse |
| btn-so-ship | شحن | 🟢 | role.warehouse |
| btn-so-create-dropship-po | إنشاء PO drop-ship | 🟦 | role.purchases |
| btn-quote-create | + عرض سعر | 🟢 | role.sales |
| btn-quote-revise | تعديل (نسخة جديدة) | ⬜ | role.sales |
| btn-quote-send | إرسال | 🟦 | role.sales |
| btn-quote-mark-accepted | تأكيد القبول | 🟢 | role.sales |
| btn-quote-mark-rejected | تسجيل الرفض | 🔴 | role.sales + reason |
| btn-quote-convert-so | تحويل لأمر بيع | 🟢 | role.sales |
| btn-quote-extend-validity | تمديد الصلاحية | 🟡 | role.sales_supervisor |
| btn-rma-create | + RMA | 🟢 | role.sales |
| btn-rma-approve | موافقة | 🟢 | role.sales_supervisor |
| btn-rma-reject | رفض | 🔴 | role.sales_supervisor |
| btn-rma-receive | استلام البضاعة | 🟦 | role.warehouse |
| btn-rma-inspect | فحص | 🟡 | role.qc |
| btn-rma-issue-credit | إصدار إشعار دائن | 🟢 | role.sales_supervisor |
| btn-rma-process-refund | معالجة الاسترداد | 🟦 | role.ar |
| btn-rma-create-replacement | إنشاء بديل | 🟢 | role.sales |
| btn-dn-create | + إذن تسليم | 🟢 | role.warehouse |
| btn-dn-print-label | طباعة بطاقة الشحن | ⬜ | role.warehouse |
| btn-dn-track | تتبع الشحنة | 🟦 | viewer |
| btn-dn-confirm-pod | تأكيد التسليم | 🟢 | role.delivery + signature/photo |
| btn-dn-mark-failed | تسجيل فشل | 🔴 | role.delivery + reason |
| btn-commission-rule-create | + قاعدة عمولة | 🟢 | role.cfo |
| btn-commission-calc | احتساب العمولات | 🟦 | role.payroll |
| btn-commission-approve | اعتماد | 🟢 | role.payroll_supervisor |
| btn-commission-pay | دفع في الراتب | 🟢 | role.payroll |
| btn-commission-clawback | استرداد | 🔴 | role.cfo |
| btn-export-sales-report | تصدير | ⬜ | role.sales |
| btn-bulk-email-invoices | إرسال جماعي | 🟦 | role.sales_supervisor |

---

## 8. Search & Filters

### Invoices:
- Customer, Salesperson, Date range, Due date range, Status (multi), Currency, ZATCA status, Has balance, Aging bucket, Has dispute, Type (Invoice/CN/DN), Has commission

### Orders:
- Status workflow stage, Customer, Salesperson, Drop-ship, Has hold, ATP status, Expected delivery range, Created range

### Quotes:
- Status, Validity expiring within X days, Margin range, Customer, Salesperson, Lost reason, Days since last activity

### RMA:
- Status, Reason, Date range, Refund method

### Delivery Notes:
- Status, Carrier, In transit > X days, Failed deliveries

### Commissions:
- Salesperson, Period, Status, Rule

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Sales Register | all invoices with totals |
| Daily Sales Summary | by salesperson/branch |
| Sales by Customer | top customers + concentration |
| Sales by Product | top SKUs |
| Sales by Salesperson | rankings + targets vs actual |
| Sales by Region/Territory | geographical |
| Sales by Channel | direct/B2B/POS/online |
| Margin Analysis | per invoice/customer/product |
| Quote Conversion Funnel | win rate per stage |
| Quote Win/Loss Analysis | reasons |
| Backorder Report | pending fulfillment |
| Aging Report | linked to AR |
| Sales Tax Report (VAT) | input/output per period |
| Returns Analysis | reasons + costs |
| Commission Statement | per salesperson per period |
| Customer Concentration | risk analysis |
| Sales Forecast | from CRM pipeline |
| ZATCA Compliance Report | submission status |

---

## 10. Dashboards & Widgets

### `/sales/dashboard`
- KPIs: MTD Sales / YTD vs Target / Open Orders / In Pipeline / DSO / Margin %
- Charts: Sales trend (12m), Top 10 customers, Top 10 products, Sales by stage funnel
- Lists: Today's deliveries, Quotes expiring this week, Orders on hold, ZATCA failures

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| New invoice issued | email | customer |
| Invoice past due | email + WhatsApp | customer + AR |
| ZATCA cleared | in-app | sales |
| ZATCA failed | email + Slack | sales + IT |
| Order awaiting approval | in-app | approver |
| Order approved | email | sales |
| Order on hold | email | sales + customer |
| Quote sent | in-app | salesperson |
| Quote about to expire (3d) | email | salesperson |
| Quote accepted | email | salesperson + manager |
| RMA submitted | in-app | sales supervisor |
| Inventory shortage on order | email | sales + warehouse |
| Delivery delivered | email + WhatsApp | customer + sales |
| Commission due | in-app | salesperson |
| Customer credit hold blocked sale | email | sales manager |

---

## 12. Permissions Matrix

| Action | Sales Rep | Sales Sup | Sales Mgr | Warehouse | AR | CFO |
|--------|-----------|-----------|-----------|-----------|-----|-----|
| Create invoice | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Issue credit note | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Cancel invoice | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Override credit hold | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create order | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Approve order | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Modify order (post-confirm) | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Allocate stock | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Ship | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Create quote | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Discount > 10% | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Discount > 25% | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Approve RMA | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Process refund | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Set commission rules | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| View commission of others | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| ZATCA Fatoora | clearance + reporting |
| Aramex / SMSA / DHL / Naqel | shipping carriers |
| Saudi Post (SPL) | local delivery |
| WhatsApp Business | invoice delivery |
| SendGrid / SES | email delivery |
| Salla / Zid | e-commerce sync |
| Shopify / WooCommerce | external stores |
| Tabby / Tamara | BNPL |
| Stripe / PayTabs / Mada | payment processing |
| CRM/Salesforce | quote sync |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New invoice |
| `Ctrl+O` | New order |
| `Ctrl+Q` | New quote |
| `Ctrl+R` | New RMA |
| `Ctrl+S` | Save & continue |
| `Ctrl+Enter` | Save & post |
| `F2` | Add line |
| `F4` | Customer search |
| `F8` | Print preview |

---

## 15. Mobile / Print

- Mobile: invoice view, quote send, sales rep app (orders + commissions)
- Print: invoice templates (Saudi VAT compliant), packing slip, delivery note, commission statement

---

## 16. Audit & Logging

- Every invoice/order/quote → full audit trail
- ZATCA submissions → archived 7 years
- Cancellations → require reason + manager approval
- Modifications → before/after diff
- Commission accruals → linked to JEs

---

## 17. Test Cases

```typescript
describe('Invoice Creation', () => {
  test('creates with proper auto-number')
  test('calculates VAT correctly')
  test('handles multi-currency with FX')
  test('blocks if customer credit exceeded')
  test('submits to ZATCA on POST')
  test('generates QR code')
})

describe('Order Workflow', () => {
  test('ATP check identifies shortages')
  test('drop-ship creates PO automatically')
  test('credit hold blocks confirmation')
  test('cancellation applies restocking fee')
  test('partial delivery creates backorder')
})

describe('Quote → Order Conversion', () => {
  test('preserves all line items')
  test('applies current FX rate')
  test('validates within validity period')
  test('handles configurable products')
})

describe('RMA Flow', () => {
  test('approval required for >X amount')
  test('inspection records condition per line')
  test('credit memo created automatically')
  test('commission clawback on returned sale')
})

describe('Commission', () => {
  test('flat percent calc')
  test('tiered calc')
  test('split between team')
  test('clawback on return')
})

describe('ZATCA', () => {
  test('XML schema valid')
  test('QR code TLV correct')
  test('handles clearance failure')
  test('credit note preserves PIH chain')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Customer deleted mid-order | use snapshot at order date |
| Product price changed mid-order | use price at order date |
| ZATCA timeout | queue + retry |
| Fully paid invoice cancelled | refund workflow |
| Order ships before payment | accept + open item |
| Quote accepted after expiry | re-validate prices |
| Negative line item | refund line within invoice |
| Multi-tax product | each tax calculated separately |
| Customer in different timezone | use customer's timezone for delivery dates |
| Salesperson terminated mid-month | pro-rate commissions |
| Commission rule changed mid-period | use rule at sale date |
| Customer changed bank info | use latest at invoice date |
| Drop-ship vendor cancels | revert SO + alert |
| Package lost in transit | claim with carrier + replacement |
| Returned item resold | re-classify in inventory |

---

**نهاية مواصفات النقص #13**

> 10 سيناريوهات • 8 جداول schema • 6 forms • 6 grids • 50 button • 18 reports
