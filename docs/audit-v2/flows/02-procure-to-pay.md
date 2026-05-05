# BPF #2: Procure-to-Pay (P2P) — End-to-End

> **المرجعيات:** SAP MM-FI Integration、Oracle P2P、Coupa BSM、SAP Ariba、Tradeshift
> **الموديولات المعنية:** Procurement, Inventory, Quality, AP, Treasury, Tax (WHT/VAT), Vendor Master, Budget

---

## 1) الفلو الكامل

```
[Need Identified]
   ↓ requested
[Purchase Requisition (PR)]
   ↓ multi-level approval
[Approved PR]
   ↓ either ↓
[RFQ to Vendors] OR [Direct PO from Contract]
   ↓ bids received + evaluated
[Vendor Selected + PO Issued]
   ↓ vendor acknowledges
[Confirmed PO]
   ↓ goods shipped
[Goods Receipt (GRN)]
   ↓ QC inspection
[QC Pass / Quarantine / Reject]
   ↓ accepted goods
[Inventory Updated]
   ↓ vendor invoice received
[Invoice Capture (OCR)]
   ↓ 3-way match
[Match Pass / Exception]
   ↓ if pass + budget OK
[Payable Booked]
   ↓ payment run
[Payment Approved]
   ↓ bank file generated
[Bank Payment (SARIE/SEPA/SWIFT)]
   ↓ confirmation received
[AP Cleared]
   ↓ bank statement
[Bank Reconciled]
   ↓ closed
```

**14 خطوة، 8 موديولات، 6 JEs**

---

## 2) البرومنت

```
بناء P2P orchestration كامل في Namasoft ERP:

موجود: PR, RFQ, PO, GRN, 3WM, LC, payment-run-engine, wht-engine

النواقص:
A) State Machine موحّدة (PR_DRAFT → PO_SENT → GRN_RECEIVED → INVOICED → PAID)
B) Event Bus: PO Approved → notify vendor; GRN Accepted → trigger 3WM
C) Saga Pattern: PR rejected → unblock budget; GRN partial → handle backorder
D) Budget validation throughout: PR → encumber, PO → maintain, Invoice → release encumbrance + record actual
E) Cross-module Auditing: spend per category/vendor/cost-center
F) Document linking: PR → RFQ → PO → GRN → Invoice → Payment chain
G) Vendor Portal: vendor sees their POs, submits invoices directly

أنشئ:
- src/lib/p2p-orchestrator.ts
- src/lib/p2p-saga.ts
- prisma: P2PJourney, P2PEvent, P2PSaga
- UI: /procurement/p2p-pipeline
- Tests: 30+ E2E
```

---

## 3) السيناريوهات (8)

### A — Standard P2P
```
Day 0: Department needs office supplies → PR for 5,000
Day 1: Manager approves
Day 2: Procurement creates PO to approved vendor
Day 4: Vendor confirms + ships
Day 7: GRN received → QC pass
Day 8: Invoice received → 3WM passes (within 1% tolerance)
Day 10: AP books invoice → schedules payment Net 30
Day 38: Payment run → SARIE file generated
Day 39: Bank confirms → AP cleared
Day 40: Bank reconciliation → matched
```

### B — RFQ Process
```
PR > 50K → must go through RFQ
3 vendors invited
2 respond with quotes
Comparison matrix: Vendor A = best total cost
Award decision → PO to Vendor A
Other vendors notified (auto)
Saved for next time (Vendor relationship maintained)
```

### C — 3WM Exception
```
PO 100 units @ 50 = 5000
GRN: 100 received
Invoice: 100 @ 52 = 5200
Variance: +200 (4% price up)
Tolerance: 5% → within → auto-approve
But: PO had freight estimated 200, invoice has 350
Total invoice: 5550 vs PO 5200 → variance 350 (6.7%) → exception
Manual review: vendor confirms freight increase
Approved with explanation → payment proceeds
```

### D — Drop-Ship from Customer SO
```
Customer SO with drop-ship flag
Procurement auto-receives PR
Reviews → creates PO to vendor
Vendor ships to customer (not us)
GRN at customer location (proxy via tracking)
Invoice from vendor → 3WM (no internal warehouse movement)
Payment proceeds normally
```

### E — Letter of Credit Import
```
Foreign vendor 50K USD
LC application → bank approves
Bank issues LC to vendor
Vendor ships → docs to bank
Goods arrive → customs clearance (Fasah)
Bank pays vendor (LC drawdown)
Landed costs allocated:
  - Customs: 5K
  - Freight: 8K
  - Insurance: 1K
Inventory cost = PO + landed = 64K (was 50K)
```

### F — Subcontracting
```
Send raw materials to vendor for processing
Subcontract PO with materials list
Stock OUT → vendor location (transfer doc)
Vendor processes → ships finished back
GRN of FG
Invoice for service only (not materials)
Material consumption recorded
JE: DR FG / CR WIP-Subcontract
```

### G — WHT on Foreign Service
```
Pay foreign consultant 10K
WHT 5% = 500
Net to vendor: 9,500
JE:
  DR Consulting Expense 10,000
  CR Cash 9,500
  CR WHT Payable 500
File quarterly WHT return
Issue WHT certificate to vendor
```

### H — Budget Exceeded
```
Department spent 95K of 100K budget
New PR for 8K → would exceed
- Strict mode → block
- Soft mode → warn + allow with override
- Off mode → no check
Department head approves override (with reason)
PR proceeds + flagged
End-of-period: budget review
```

### sad-1 — Vendor Cancels
```
PO sent, vendor confirms, but later cancels
Procurement notified
Inventory: reservation released
Need to find alt vendor → urgent RFQ
```

### sad-2 — GRN Partial
```
PO 100 units, only 60 received (vendor backorder)
GRN-1 for 60 → accepted
Open balance: 40 units
GRN-2 (later) for 40
Two invoices possible
Or: vendor sends single invoice for full → 3WM matches against both GRNs
```

### sad-3 — Defective Goods at QC
```
GRN received → QC inspection
30% fail → quarantine
Decision: return to vendor (RTV)
RTV doc → debit memo
Vendor credit applied to next invoice
```

### sad-4 — Invoice Without PO
```
Vendor sends invoice for unauthorized purchase
- Reject + alert procurement
- Investigate (rogue purchase)
- Either authorize retroactively (with explanation) or refuse
- Audit issue raised
```

---

## 4) JEs throughout P2P

```
[PR Approved]
   ↓ no JE (commitment only)
[PO Issued]
   ↓ no JE (commitment to vendor)
   ↓ Encumbrance recorded (budget)
[GRN Received + Accepted]
   ↓ JE: DR Inventory / CR GR-IR (Goods Receipt-Invoice Receipt)
   ↓ Inventory IN
[Invoice Received + 3WM Pass]
   ↓ JE: DR GR-IR / CR Accounts Payable
   ↓ JE: DR VAT Receivable / CR (already handled in invoice)
   ↓ Encumbrance released, actual booked
[WHT (if applicable)]
   ↓ JE: DR AP / CR WHT Payable (reduces AP)
[Payment]
   ↓ JE: DR AP / CR Bank
   ↓ JE: DR Bank Charges / CR Bank (if any)
   ↓ JE: DR FX Loss / CR FX Gain (if cross-currency)
[WHT Settlement]
   ↓ JE: DR WHT Payable / CR Bank (quarterly to ZATCA)
```

**6-7 JEs per P2P cycle**

---

## 5) Schema (Orchestration)

```prisma
model P2PJourney {
  id              Int       @id @default(autoincrement())
  vendorId        Int
  
  // Source documents
  prId            Int?
  rfqId           Int?
  poId            Int?
  grnIds          Int[]
  invoiceIds      Int[]
  paymentIds      Int[]
  
  // State
  currentStage    String    // PR_DRAFT | APPROVED | RFQ | PO_ISSUED | GRN_RECEIVED | INVOICED | MATCHED | PAID | CLOSED | CANCELLED
  
  // Timing
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  totalCycleDays  Int?
  
  stageTimings    Json
  
  totalAmount     Decimal?  @db.Decimal(20,4)
  currency        String?
  
  // Type
  type            String    // 'STANDARD' | 'BLANKET' | 'CONTRACT' | 'DROP_SHIP' | 'SUBCONTRACT' | 'IMPORT_LC'
  
  // Health
  health          String    @default("ON_TRACK")
  
  events          P2PEvent[]
  
  @@index([vendorId, currentStage])
}

model P2PEvent {
  id              BigInt    @id @default(autoincrement())
  journeyId       Int
  journey         P2PJourney @relation(fields: [journeyId], references: [id])
  
  eventType       String
  fromStage       String?
  toStage         String?
  
  triggeredBy     String
  userId          String?
  
  metadata        Json?
  occurredAt      DateTime  @default(now())
}

model GrIrAccount {
  // Goods Receipt - Invoice Receipt clearing
  id              Int       @id @default(autoincrement())
  poId            Int
  poLineId        Int
  
  qtyReceived     Decimal   @db.Decimal(20,4)
  qtyInvoiced     Decimal   @default(0) @db.Decimal(20,4)
  amountReceived  Decimal   @db.Decimal(20,4)
  amountInvoiced  Decimal   @default(0) @db.Decimal(20,4)
  
  status          String    // 'OPEN' | 'PARTIAL' | 'CLEARED'
  
  @@index([status])
}
```

---

## 6) Forms عبر الموديولات

| الفورم | الموديول | المرحلة |
|---------|----------|---------|
| PR Form | Procurement | 1 |
| Approval | RBAC | 2 |
| RFQ Builder | Procurement | 3 |
| Bid Comparison | Procurement | 4 |
| PO Form | Procurement | 5 |
| GRN Form | Inventory | 6 |
| QC Inspection | Quality | 7 |
| Invoice Capture (OCR) | AP | 8 |
| 3WM Resolution | AP | 9 |
| Payment Run | AP/Treasury | 10 |
| Bank File Generation | Treasury | 11 |
| Confirmation Upload | Treasury | 12 |

---

## 7) Tables

### Grid A: P2P Pipeline
- Journey #, Vendor, Type, Stage, Days at Stage, Total Amount, Health

### Grid B: GR-IR Account Status
- PO #, Line, Received, Invoiced, Open Balance, Status

### Grid C: Open POs Aging
- PO #, Vendor, Order Date, Expected Delivery, Days Late, Outstanding %

### Grid D: 3WM Exceptions
- Invoice #, PO, GRN, Variance Type, Amount, Days Open

---

## 8) Buttons

| ID | الزر | المرحلة |
|----|------|---------|
| btn-p2p-start | بدء PR | 1 |
| btn-p2p-route-approval | تحديد التوجيه | 2 |
| btn-p2p-rfq-launch | إطلاق RFQ | 3 |
| btn-p2p-award | الترسية | 4 |
| btn-p2p-po-send | إرسال للمورد | 5 |
| btn-p2p-grn-receive | استلام | 6 |
| btn-p2p-qc-decide | قرار QC | 7 |
| btn-p2p-invoice-capture | استيلام فاتورة | 8 |
| btn-p2p-3wm-resolve | حل التطابق | 9 |
| btn-p2p-pay-schedule | جدولة الدفع | 10 |
| btn-p2p-cancel-journey | إلغاء الرحلة | any |
| btn-p2p-saga-replay | إعادة تشغيل الرحلة | failed |

---

## 9) Reports

- P2P Cycle Time
- Spend Analysis
- Vendor Performance Scorecards
- 3WM Exception Trend
- GR-IR Aging
- Open PO Aging
- Budget vs Spend
- Maverick Spend (off-contract)
- WHT Quarterly Summary
- Payment Forecast (next 30/60/90 days)

---

## 10) Notifications

| Stage | Recipient |
|-------|-----------|
| PR awaiting approval | approver |
| PR approved | requester + procurement |
| RFQ deadline approaching | invited vendors |
| PO sent | vendor (auto) |
| Vendor acknowledged | procurement |
| GRN received | inventory + AP |
| QC failed | procurement + vendor |
| Invoice received | AP + procurement |
| 3WM exception | AP clerk + procurement |
| Payment scheduled | vendor + AP |
| Payment confirmed | vendor + AP |
| Budget exceeded | dept head |
| Vendor performance dropped | procurement mgr |

---

## 11) Permissions Matrix

| Action | Requester | Procurement | Procurement Mgr | AP | CFO |
|--------|-----------|-------------|-----------------|-----|-----|
| Create PR | ✓ | ✓ | ✓ | ✗ | ✓ |
| Approve PR (per amount) | ✗ | ✗ | ✓ | ✗ | ✓ |
| Run RFQ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Award | ✗ | ✗ | ✓ | ✗ | ✓ |
| Issue PO | ✗ | ✓ | ✓ | ✗ | ✗ |
| Receive Goods | ✗ | ✗ | ✗ | ✗ | ✗ (warehouse role) |
| 3WM Resolve | ✗ | ✗ | ✗ | ✓ | ✓ |
| Pay | ✗ | ✗ | ✗ | ✓ | ✓ |
| Override Budget | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 12) Integrations

- Wathq (vendor CR)
- ZATCA Fatoora (purchase invoices)
- Bank APIs (SARIE, SWIFT)
- LC banks (HSBC, Saudi British Bank)
- Customs (Fasah, Bayan)
- Vendor portals (cXML punchout)
- OCR services (Gemini Vision for invoices)

---

## 13) Tests

```typescript
describe('P2P End-to-End', () => {
  test('standard PR-to-payment in 30 days')
  test('RFQ with bid comparison + award')
  test('3WM tolerance variance')
  test('budget encumbrance through full cycle')
  test('LC drawdown for import')
  test('subcontract material handling')
  test('WHT calculation + remittance')
  test('drop-ship without internal warehouse')
  test('vendor cancellation rollback')
  test('partial GRN with backorder')
})
```

---

## 14) Edge Cases

| Case | Cross-Module Behavior |
|------|----------------------|
| PR amount changes after RFQ sent | re-validate budget |
| Vendor blocked between PO and GRN | finish current + no new |
| Currency rate changes mid-cycle | freeze at PO date |
| Invoice in foreign currency, PO in SAR | use rate at invoice |
| GR-IR mismatch (over-receive) | tolerance check + alert |
| WHT applies but not configured | block + alert tax |
| LC expires before goods arrive | bank extends or claim |
| Vendor changes IBAN mid-payment | re-validate before bank file |

---

## 15) إحصائيات BPF #2

- 8 موديولات • 14 مرحلة • 7 JEs • 4 جداول schema جديدة • 12 forms • 12 buttons cross-module
- 8 سيناريوهات + 4 sad paths
- 10 reports • 13 notifications • 10 tests

---

**انتهى BPF #2 / 8.**
