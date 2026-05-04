# النقص #19: Purchases + Procurement (PO/PR/RFQ/GRN/LC/3WM) — مواصفات تفصيلية

> **المرجعيات:** SAP MM (Materials Management)、Oracle Procurement Cloud、SAP Ariba、Coupa、Jaggaer、Ivalua

---

## 1. البرومنت الكامل

```
وسّع نظام Purchases + Procurement لمستوى SAP Ariba/Coupa:

موجود: PurchaseOrder, PurchaseInvoice, PurchaseReturn, PurchaseRequisition, RequestForQuotation, GoodsReceiptNote, LandedCost, ThreeWayMatch, LetterOfCredit, SupplierContract, VendorRating

النواقص:

A) Source-to-Pay (S2P) Cycle:
   - Strategic sourcing (RFI → RFQ → RFP → eAuction)
   - Vendor onboarding workflow (KYC + qualification)
   - Vendor scorecards (KPIs: OTD, quality, price)
   - Vendor approved list (AVL)
   - Spend analysis & category management
   - Contract lifecycle management
   - Punchout catalogs (cXML)
   - Hosted catalogs

B) Purchase Requisition:
   - Multi-level approval workflows (per amount/category)
   - Budget validation pre-approval
   - Auto-conversion to PO/RFQ
   - Purchase request from any module (sales BOM, etc.)

C) RFQ / Bid Management:
   - Multi-vendor invitation
   - Sealed bidding
   - Bid comparison matrix
   - Award decision workflow
   - eAuction reverse bidding

D) Purchase Order:
   - Multiple PO types (Standard/Blanket/Contract/Service/Subcontract)
   - Multi-line + multiple delivery dates per line
   - Schedule lines
   - Drop-ship to customer
   - PO change orders (with audit)
   - PO cancellation
   - Confirmations from vendors
   - Vendor PO acknowledgment

E) Goods Receipt:
   - Partial receipts
   - Over-receipt tolerance
   - Quality inspection at receipt
   - Quarantine/release workflow
   - Returns to vendor
   - Multi-location receipt

F) Three-Way Match:
   - PO ↔ GRN ↔ Invoice
   - Tolerance per line/header
   - Auto-match if within tolerance
   - Exception queue
   - Block payment if mismatch

G) Letters of Credit:
   - Application workflow
   - Document management
   - Bank fees tracking
   - LC drawdown
   - LC closure

H) Landed Costs:
   - Allocation methods (value/qty/weight)
   - Multi-PO allocation
   - Customs + freight + insurance + handling

APIs (60+), UI (25 pages), Tests 80+
```

---

## 2. السيناريوهات (8)

### A — Full Source-to-Pay Cycle
```
1. Department creates PR for 100 units
2. Approval workflow: Manager → Department Head → Finance (>10K)
3. Approved → Procurement creates RFQ
4. RFQ sent to 5 approved vendors (sealed)
5. 4 quotes received → comparison matrix
6. Award to Vendor X (best total cost of ownership)
7. PO created → emailed to vendor
8. Vendor acknowledges → confirms delivery date
9. Goods received at warehouse → GRN
10. QC inspection → 5 rejected
11. Vendor invoice received → OCR scanned
12. 3-way match: PO 100 / GRN 95 / Invoice 100
    - Mismatch → exception queue
    - Auto-resolved with credit note
13. Payment scheduled
```

### B — Blanket PO + Releases
```
- Annual contract: 1,200 units × 100 SAR each
- Blanket PO created
- Monthly releases: 100 units each
- Each release auto-creates regular PO + GRN
- Spend tracked against blanket
```

### C — Drop-Ship from Customer Order
```
- Customer SO with drop-ship flag
- Procurement auto-receives PR
- Reviews → creates PO to vendor
- Vendor ships directly to customer
- GRN at customer location (proxy)
- Invoice received → 3-way match
- Customer invoice generated separately
```

### D — Subcontracting
```
- Send raw materials to vendor for processing
- Subcontract PO with materials list
- Materials shipped to vendor (transfer)
- Finished goods received back
- Invoice for service only
- Material consumption recorded
```

### E — LC Process for Import
```
1. PO with international vendor 50,000 USD
2. LC application to bank → approved
3. Bank issues LC to vendor
4. Vendor ships → docs to bank
5. Goods arrive → customs clearance
6. Bank pays vendor (LC drawdown)
7. Landed costs: customs 5K + freight 8K + insurance 1K
8. Allocation across PO lines (by value)
9. Inventory cost = PO + landed
```

### F — Vendor Onboarding
```
1. New vendor submits info (Wathq lookup)
2. KYC documents uploaded
3. Compliance review (sanctions, blacklists)
4. Bank account verification (penny test)
5. Categorization (financial/strategic/commodity)
6. Added to AVL (Approved Vendor List)
7. Initial qualification rating
```

### G — Vendor Performance Review
```
- Monthly cron calculates KPIs:
  - OTD (On-Time Delivery): 92%
  - Quality (% accepted): 96%
  - Price competitiveness vs market
  - Responsiveness
- Score: 88 (Good)
- Status: Preferred
- If score < 60 → flag for review
- Auto-share with vendor
```

### H — Three-Way Match Exception
```
- PO: 100 units @ 50 = 5000
- GRN: 100 units received
- Invoice: 100 units @ 52 = 5200
- Variance: +200 (price up)
- Tolerance: 5% = 250 → within → auto-approve
- BUT vendor billed 105 units → quantity variance
- Goes to exception queue
- AP clerk investigates → vendor error → request credit
```

---

## 3. تدفق البيانات

```
[PR Workflow]
POST /procurement/requisitions { dept, lines, justification }
   ↓ create PR + approval workflow
   ↓ each approver decides
   ↓ if approved → create RFQ or PO

[RFQ]
POST /procurement/rfq { items, vendorIds, dueDate }
   ↓ create RFQ + invite vendors
   ↓ vendors submit quotes
   ↓ comparison matrix
   ↓ award → create PO

[PO]
POST /procurement/po { vendorId, lines, deliveryDates }
   ↓ create PO (DRAFT)
   ↓ approval workflow
   ↓ APPROVED → send to vendor (email/EDI/portal)
   ↓ vendor confirms

[GRN]
POST /procurement/grn { poId, receivedLines }
   ↓ validate against PO
   ↓ check tolerance
   ↓ trigger QC if required
   ↓ update inventory

[3-Way Match]
On Invoice receipt:
   ↓ find PO + GRN
   ↓ compare amounts/qtys/prices
   ↓ within tolerance → auto-approve
   ↓ exception → queue for review

[LC]
POST /procurement/lc/apply
   ↓ bank approval
   ↓ track fees
   ↓ on shipment receipt → drawdown
   ↓ allocate landed costs
```

---

## 4. Prisma Schema (إضافات)

```prisma
model Vendor {
  id                Int       @id @default(autoincrement())
  vendorCode        String    @unique
  name              String
  nameAr            String?
  
  type              String    // 'GOODS' | 'SERVICES' | 'BOTH'
  category          String?   // 'STRATEGIC' | 'PREFERRED' | 'STANDARD' | 'TACTICAL' | 'BLOCKED'
  
  // Tax + Reg
  vatNumber         String?
  commercialReg     String?
  countryCode       String    @default("SA")
  
  // Contact
  primaryContact    String?
  email             String?
  phone             String?
  website           String?
  address           Json?
  
  // Bank
  iban              String?
  swift             String?
  bankName          String?
  bankVerified      Boolean   @default(false)
  
  // Currency + Terms
  defaultCurrency   String    @default("SAR")
  defaultPaymentTerm String?
  defaultIncoterm   String?   // FOB, CIF, DDP, etc.
  
  // Credit
  creditLimit       Decimal?  @db.Decimal(20,4)
  
  // KYC
  kycStatus         String    @default("PENDING")
  kycVerifiedAt     DateTime?
  
  // Sanctions
  sanctionsChecked  Boolean   @default(false)
  sanctionsCheckedAt DateTime?
  
  // Onboarding
  onboardingStatus  String    @default("DRAFT")  // DRAFT | UNDER_REVIEW | APPROVED | REJECTED | BLOCKED
  approvedAt        DateTime?
  approvedByUserId  String?
  
  // Performance
  currentScore      Int?
  scoreUpdatedAt    DateTime?
  
  // Categorization
  categoryIds       Int[]
  productCategories String[]?
  
  active            Boolean   @default(true)
  blockedAt         DateTime?
  blockedReason     String?
  
  contacts          VendorContact[]
  documents         VendorKycDocument[]
  ratings           VendorPerformanceRating[]
}

model VendorPerformanceRating {
  id              Int       @id @default(autoincrement())
  vendorId        Int
  vendor          Vendor    @relation(fields: [vendorId], references: [id])
  
  periodStart     DateTime
  periodEnd       DateTime
  
  // Metrics (0-100 each)
  otdScore        Int?
  qualityScore    Int?
  priceScore      Int?
  responsivenessScore Int?
  innovationScore Int?
  
  overallScore    Int
  
  ordersCount     Int
  totalSpend      Decimal   @db.Decimal(20,4)
  rejectedQty     Decimal?  @db.Decimal(20,4)
  lateDeliveriesCount Int?
  
  notes           String?
  recommendation  String?   // 'PREFERRED' | 'STANDARD' | 'PROBATION' | 'TERMINATE'
  
  generatedAt     DateTime  @default(now())
}

model PurchaseRequisition {
  // ... existing
  status                String    @default("DRAFT")  // DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | CONVERTED | CANCELLED
  
  prType                String    @default("STANDARD")  // STANDARD | URGENT | EMERGENCY | CAPITAL
  
  requestedByEmployeeId Int
  departmentId          Int?
  costCenterId          Int?
  projectId             Int?
  
  justification         String?   @db.Text
  budgetCheckPassed     Boolean?
  budgetAvailable       Decimal?  @db.Decimal(20,4)
  
  approvalChain         Json?
  
  convertedToPoId       Int?
  convertedToRfqId      Int?
  convertedAt           DateTime?
}

model PurchaseOrder {
  // ... existing
  poType                String    @default("STANDARD")  // STANDARD | BLANKET | CONTRACT | SERVICE | SUBCONTRACT | CAPITAL
  
  isBlanket             Boolean   @default(false)
  blanketParentPoId     Int?
  blanketReleaseNumber  Int?
  
  contractId            Int?     // link to SupplierContract
  
  isDropShip            Boolean   @default(false)
  dropShipCustomerId    Int?
  dropShipSalesOrderId  Int?
  
  isSubcontract         Boolean   @default(false)
  subcontractMaterials  Json?     // materials provided
  
  incoterm              String?
  shippingTerms         String?
  shippingAddress       Json?
  
  expectedDeliveryDate  DateTime?
  
  vendorAcknowledged    Boolean   @default(false)
  vendorAcknowledgedAt  DateTime?
  vendorPoNumber        String?
  
  changeOrderCount      Int       @default(0)
  changeOrders          PoChangeOrder[]
  
  status                String    @default("DRAFT")
  // DRAFT | PENDING_APPROVAL | APPROVED | SENT | ACKNOWLEDGED | PARTIAL | RECEIVED | INVOICED | CLOSED | CANCELLED
}

model PoChangeOrder {
  id              Int       @id @default(autoincrement())
  poId            Int
  po              PurchaseOrder @relation(fields: [poId], references: [id])
  
  changeOrderNumber Int
  changeType      String    // 'PRICE' | 'QTY' | 'DELIVERY_DATE' | 'ADD_LINE' | 'REMOVE_LINE' | 'OTHER'
  oldValue        Json
  newValue        Json
  reason          String    @db.Text
  
  approvedByUserId String?
  approvedAt      DateTime?
  vendorAccepted  Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
}

model RequestForQuotation {
  // ... existing
  rfqType         String    @default("RFQ")  // RFI | RFQ | RFP | EAUCTION
  
  invitedVendors  RfqVendor[]
  bidsReceived    RfqBid[]
  
  status          String    @default("DRAFT")
  // DRAFT | SENT | BIDS_RECEIVED | UNDER_EVALUATION | AWARDED | CANCELLED
  
  awardedVendorId Int?
  awardedAt       DateTime?
  awardedByUserId String?
  awardJustification String? @db.Text
  
  isSealed        Boolean   @default(true)
  bidOpeningDate  DateTime?
}

model RfqVendor {
  id              Int       @id @default(autoincrement())
  rfqId           Int
  rfq             RequestForQuotation @relation(fields: [rfqId], references: [id])
  vendorId        Int
  
  invitedAt       DateTime  @default(now())
  responseStatus  String    @default("INVITED")  // INVITED | DECLINED | RESPONDED | NO_RESPONSE
  respondedAt     DateTime?
}

model RfqBid {
  id              Int       @id @default(autoincrement())
  rfqId           Int
  rfq             RequestForQuotation @relation(fields: [rfqId], references: [id])
  vendorId        Int
  
  bidNumber       Int
  bidDate         DateTime
  
  totalAmount     Decimal   @db.Decimal(20,4)
  currency        String
  paymentTerms    String?
  deliveryDays    Int?
  validityDays    Int?
  
  notes           String?
  attachments     Json?
  
  lines           RfqBidLine[]
  
  unsealed        Boolean   @default(false)
  unsealedAt      DateTime?
}

model RfqBidLine {
  id              Int       @id @default(autoincrement())
  bidId           Int
  bid             RfqBid    @relation(fields: [bidId], references: [id], onDelete: Cascade)
  
  rfqLineId       Int
  unitPrice       Decimal   @db.Decimal(20,4)
  totalPrice      Decimal   @db.Decimal(20,4)
  alternateProduct String?
  notes           String?
}

model GoodsReceiptNote {
  // ... existing
  status          String    @default("DRAFT")
  // DRAFT | PENDING_INSPECTION | ACCEPTED | PARTIALLY_ACCEPTED | REJECTED | RETURNED
  
  receivedByEmployeeId Int?
  receivedAt      DateTime
  
  warehouseId     Int
  
  inspectionRequired Boolean @default(false)
  inspectedAt     DateTime?
  inspectedByUserId String?
  inspectionNotes String?
  
  qcStatus        String?   // 'PENDING' | 'APPROVED' | 'CONDITIONAL' | 'REJECTED'
  
  vendorRefNumber String?
  invoiceNumber   String?
}

model SupplierContract {
  // ... existing
  contractNumber  String    @unique
  vendorId        Int
  vendor          Vendor    @relation(fields: [vendorId], references: [id])
  
  contractType    String    // 'BLANKET' | 'TERM' | 'FRAMEWORK' | 'SLA'
  
  startDate       DateTime
  endDate         DateTime
  autoRenew       Boolean   @default(false)
  renewalNoticeDate DateTime?
  
  contractValue   Decimal?  @db.Decimal(20,4)
  spentToDate     Decimal   @default(0) @db.Decimal(20,4)
  
  paymentTerms    String?
  incoterm        String?
  
  signedDocument  String?
  
  status          String    @default("ACTIVE")  // DRAFT | ACTIVE | EXPIRED | TERMINATED
}

model PurchaseSpend {
  // analytical view (materialized)
  vendorId        Int
  productId       Int?
  categoryId      Int?
  fiscalYear      Int
  fiscalMonth     Int
  totalSpend      Decimal   @db.Decimal(20,4)
  poCount         Int
  avgLeadTime     Int?
  
  @@index([vendorId, fiscalYear, fiscalMonth])
}
```

---

## 5. Forms & Fields

### Form A: Vendor Onboarding (Wizard)
- Step 1: Company info (CR lookup via Wathq)
- Step 2: Bank info (verification)
- Step 3: Categories & products
- Step 4: Compliance (sanctions, KYC docs)
- Step 5: Terms (payment, delivery, currency)
- Step 6: Review & approve

### Form B: PR Creation
- Department, cost center, project, justification, lines, budget check, attachments

### Form C: RFQ
- Type, items, invited vendors (multi), due date, sealed toggle, bid opening date

### Form D: PO
- Type, vendor, currency, lines (with delivery schedules), shipping, terms, drop-ship

### Form E: GRN
- PO, warehouse, lines (with received qty + condition), inspection toggle

### Form F: Bid Comparison Matrix
- Side-by-side: lines × vendors, prices, lead times, total cost
- Award button per line or total

### Form G: PO Change Order
- Type, line, old/new value, reason, approval

### Form H: LC Application
- Vendor, amount, expiry, documents required, bank, terms

---

## 6. Tables & Columns

### Grid A: Vendors
- Code, Name, Category, Country, KYC Status, Score, Total Spend, Active POs, Last Order, Status

### Grid B: PRs
- # / Type, Department, Requested By, Date, Total, Status, Approval Stage, Days Open

### Grid C: RFQs
- # / Type, Title, Date Sent, Due Date, Vendors Invited, Bids Received, Status, Awarded

### Grid D: POs
- # / Type, Vendor, Date, Expected Delivery, Total, Currency, Status, Receipt %, Invoice %

### Grid E: GRNs
- # / PO, Vendor, Receipt Date, Lines, QC Status, Inspector, Status

### Grid F: 3-Way Match Queue
- Invoice #, PO, GRN, Total Variance, Status, Days Open, Actions

### Grid G: LCs
- LC #, Vendor, Amount, Currency, Expiry, Status, Drawn Amount

### Grid H: Vendor Performance
- Vendor, Period, OTD %, Quality %, Price Score, Overall, Recommendation

---

## 7. Buttons & Actions (selected, 35+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-vendor-onboard | + مورد جديد | 🟢 procurement |
| btn-vendor-approve | اعتماد | 🟢 procurement_mgr |
| btn-vendor-block | حظر | 🔴 procurement_mgr + reason |
| btn-vendor-rate | تقييم | 🟦 procurement |
| btn-vendor-view-360 | عرض 360 | ⬜ viewer |
| btn-pr-create | + طلب شراء | 🟢 employee |
| btn-pr-submit | إرسال للاعتماد | 🟦 requester |
| btn-pr-approve | موافقة | 🟢 approver |
| btn-pr-reject | رفض | 🔴 approver + reason |
| btn-pr-convert-rfq | تحويل لـ RFQ | 🟦 procurement |
| btn-pr-convert-po | تحويل لـ PO | 🟦 procurement |
| btn-rfq-create | + RFQ | 🟢 procurement |
| btn-rfq-invite-vendors | دعوة موردين | 🟦 procurement |
| btn-rfq-open-bids | فتح المناقصات | 🟢 procurement_mgr |
| btn-rfq-compare-bids | مقارنة | ⬜ procurement |
| btn-rfq-award | الترسية | 🟢 procurement_mgr |
| btn-po-create | + PO | 🟢 procurement |
| btn-po-from-pr | من PR | 🟦 procurement |
| btn-po-from-rfq-award | من ترسية | 🟦 procurement |
| btn-po-approve | موافقة | 🟢 approver |
| btn-po-send-vendor | إرسال للمورد | 🟦 procurement |
| btn-po-acknowledge | تأكيد المورد | 🟢 vendor portal |
| btn-po-change-order | + change order | 🟡 procurement |
| btn-po-cancel | إلغاء | 🔴 procurement_mgr + reason |
| btn-po-close | إغلاق | 🟦 procurement |
| btn-grn-create | + GRN | 🟢 warehouse |
| btn-grn-inspect | فحص | 🟦 qc |
| btn-grn-accept | قبول | 🟢 qc |
| btn-grn-reject | رفض | 🔴 qc + reason |
| btn-grn-quarantine | إيقاف للحجر | 🟡 qc |
| btn-3wm-resolve | حل التطابق | 🟦 ap |
| btn-3wm-block-payment | إيقاف الدفع | 🔴 ap_mgr |
| btn-3wm-override | تجاوز | 🔴 cfo + reason |
| btn-lc-apply | تقديم LC | 🟢 procurement |
| btn-lc-drawdown | سحب من LC | 🟦 finance |
| btn-lc-close | إغلاق LC | 🟢 procurement |
| btn-landed-cost-allocate | تخصيص التكاليف | 🟦 ap |
| btn-contract-create | + عقد مورد | 🟢 procurement_mgr |
| btn-contract-renew | تجديد | 🟦 procurement_mgr |
| btn-contract-terminate | إنهاء | 🔴 cfo + reason |

---

## 8. Search & Filters

- Vendors: category, country, KYC status, score range, active
- PRs: status, department, urgent, budget exceeded
- RFQs: status, due date, vendor invited
- POs: type, vendor, status, currency, has overdue, change orders
- GRNs: status, qc, warehouse, date range
- 3WM: variance type, amount range, days open

---

## 9. Reports & Exports

- Spend Analysis (by vendor/category/cost center)
- Vendor Performance Scorecards
- PO Cycle Time
- 3-Way Match Exception Report
- LC Status Report
- Contract Expiry Calendar
- PR Approval Aging
- Drop-Ship Tracking
- Subcontract Performance
- Landed Cost Variance
- Maverick Spend (off-contract)
- Open POs Aging
- Vendor Comparison

---

## 10. Dashboards & Widgets

- KPIs: Total Spend MTD / Active POs / Pending Approvals / 3WM Exceptions
- Charts: Spend by category (pie), Top 10 vendors, OTD trend
- Lists: PRs awaiting my approval, POs overdue, Contracts expiring

---

## 11. Notifications

- PR approval needed
- PR approved/rejected
- PO sent to vendor
- Vendor acknowledged
- Late delivery alert
- Receipt without QC
- 3WM exception
- LC expiry approaching
- Contract renewal due
- Vendor score dropped

---

## 12. Permissions Matrix

| Action | Requester | Procurement | Proc Mgr | Warehouse | QC | Finance | CFO |
|--------|-----------|-------------|----------|-----------|----|----|-----|
| Create PR | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Approve PR | role-based | ✗ | per amount | ✗ | ✗ | per amount | ✓ |
| Onboard vendor | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Approve vendor | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Create PO | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Approve PO | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | per amount |
| Receive goods | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Inspect | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Resolve 3WM | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Override | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 13. Integrations

- Wathq (KSA CR lookup)
- SAP Ariba / Coupa (if migration)
- Bank LC platforms
- Customs (KSA Fasah/Bayan)
- Carriers (Aramex, DHL)
- OFAC / EU sanctions
- Vendor portals (cXML punchout)
- DocuSign (contracts)

---

## 14. Keyboard Shortcuts

- `Ctrl+R` New PR
- `Ctrl+Q` New RFQ
- `Ctrl+P` New PO
- `Ctrl+G` New GRN

---

## 15. Mobile / Print

- Mobile receiving (warehouse barcode scan)
- Print: PO, GRN, LC application, contract

---

## 16. Audit & Logging

- All approvals
- PO change orders (full diff)
- Vendor onboarding decisions
- Contract changes
- 3WM resolutions

---

## 17. Test Cases

```typescript
describe('PR Approval', () => { /* multi-level, budget check, auto-conversion */ })
describe('RFQ Process', () => { /* sealed bidding, comparison, award */ })
describe('PO Workflow', () => { /* approval, change orders, cancellation */ })
describe('3WM', () => { /* tolerance, exception, resolution */ })
describe('Vendor Performance', () => { /* score calc, recommendations */ })
describe('LC', () => { /* application, drawdown, closure */ })
describe('Drop-ship', () => { /* SO → PO auto-creation */ })
describe('Subcontract', () => { /* materials transfer, FG receipt */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Vendor blocked mid-PO | finish open POs, no new |
| PR > budget | warn or block |
| Multiple POs same RFQ | award splits |
| Partial GRN | open balance for next |
| Over-receipt | tolerance check + alert |
| Invoice before GRN | hold for matching |
| LC drawn before goods received | bank guarantee |
| Subcontract material loss | adjust + alert |
| Vendor IBAN change mid-PO | re-verify |

---

**نهاية مواصفات #19** • 8 سيناريوهات • 11 جداول • 8 forms • 8 grids • 40 button • 13 reports
