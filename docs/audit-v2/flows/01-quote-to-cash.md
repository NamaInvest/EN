# BPF #1: Quote-to-Cash (Q2C) — End-to-End

> **المرجعيات:** SAP O2C، Oracle Quote-to-Cash、NetSuite Order-to-Cash、Salesforce CPQ→Billing
> **الموديولات المعنية:** CRM, Sales, Inventory, AR, Treasury, Tax (ZATCA), Customer Master, Loyalty

---

## 1) الفلو الكامل عبر الموديولات

```
[CRM Lead]
   ↓ qualified
[CRM Opportunity] — pipeline stage tracking
   ↓ won
[Quote] — CPQ engine
   ↓ accepted by customer
[Sales Order] — credit check + ATP
   ↓ approved
[Stock Reservation] — inventory hold
   ↓ allocated
[Pick List] — warehouse
   ↓ picked + packed
[Delivery Note] — carrier dispatch
   ↓ delivered (PoD)
[Sales Invoice] — auto-generated from DN
   ↓ posted
[ZATCA Submission] — clearance
   ↓ cleared
[Open Item (AR)] — receivable created
   ↓ payment received
[Cash Application] — match invoice + reduce balance
   ↓ posted
[Bank Reconciliation] — match bank statement
   ↓ closed
[Loyalty Points] — earned + tier update
   ↓ optional
[Commission Accrual] — salesman compensation
```

**12 خطوة، 8 موديولات، 7 قيود محاسبية محتملة**

---

## 2) البرومنت الجاهز

```
نفّذ Quote-to-Cash كاملاً بـ orchestration حقيقي عبر الموديولات في Namasoft ERP.

الموديولات والـ engines الموجودة:
- CRM: src/lib/crm-engine.ts
- Quote: src/lib/quote-engine.ts
- SO/Invoice: src/lib/auto-journal.ts
- Inventory: src/lib/inventory-engine.ts
- AR: src/lib/open-items.ts
- ZATCA: src/lib/zatca-*.ts
- Bank: src/lib/bank-recon-engine.ts

النواقص في الـ orchestration:

A) State Machine موحّدة لـ Q2C:
   - حالة العميل عبر الفلو (QUOTE_OPEN → ORDER_PLACED → SHIPPED → INVOICED → PAID)
   - كل خطوة تُحدّث state + تطلق events
   
B) Event Bus داخلي:
   - Quote Accepted → trigger SO creation
   - SO Approved → trigger inventory reservation
   - DN Confirmed → trigger Invoice creation
   - Invoice Posted → trigger ZATCA submission
   - Payment Received → trigger Cash Application
   
C) Saga Pattern للـ failures:
   - SO created لكن inventory شح → revert SO + notify customer
   - Invoice posted لكن ZATCA failed → queue + retry + alert
   - Payment received لكن application failed → unapplied cash + notify

D) Cross-module Auditing:
   - Q2C journey log per customer
   - Bottleneck identification (where time spent)
   - SLA breaches per stage

E) Document Linking:
   - Quote → SO → DN → Invoice → Payment chain
   - Drill-down from any document to see complete history

F) Reporting:
   - Q2C cycle time (avg per customer)
   - Conversion rate per stage
   - Stuck documents per stage

أنشئ:
- src/lib/q2c-orchestrator.ts (state machine + event bus)
- src/lib/q2c-saga.ts (failure recovery)
- src/app/api/q2c/* (orchestration endpoints)
- prisma: Q2CJourney, Q2CEvent, Q2CSlaBreach
- UI: /sales/q2c-pipeline (visual journey board)
- Tests: 30+ E2E covering happy + sad paths
```

---

## 3) السيناريوهات (8 + 4 sad paths)

### A — Happy Path كامل
```
Day 1: Lead → Opp (50% prob, value 100K)
Day 5: Quote sent
Day 10: Customer accepts → SO auto-created
       - Credit check ✓ (limit 500K, exposure 200K)
       - ATP: 80 of 100 in stock + 20 in production
       - Approval workflow: Manager approves
Day 11: Stock reservation (80 immediate, 20 backorder)
Day 12: Pick list → picked + packed → DN
Day 13: Aramex picked up → tracking created
Day 14: Delivered (PoD signed)
Day 14: Invoice auto-generated (from DN)
       - ZATCA submission → cleared in 15s
       - QR code added
       - Email + WhatsApp to customer
       - Open Item created (Net 30)
Day 30: Payment via SADAD
Day 30: Bank statement imported → auto-matched
       - Open Item cleared
       - JE: DR Cash / CR AR
       - Loyalty: 1000 points earned
       - Salesman commission accrued: 5%
Total cycle: 30 days, 0 manual interventions
```

### B — Stockout During SO
```
SO created for 100 units, only 20 in stock
ATP shows: 20 immediate + 50 backorder + 30 not available
Options:
1. Partial ship now + backorder rest
2. Wait for full → customer agrees
3. Substitute product → customer agrees
4. Cancel
System handles each path with proper JE/audit
```

### C — Credit Hold Block
```
Customer balance 480K, limit 500K
New SO 50K → would exceed
- System blocks at SO approval stage
- Sales rep submits override request
- CFO approves with reason
- SO proceeds with flag
- Order ships
- Invoice created
- Customer balance now 530K (over by 30K)
- New orders blocked until balance comes down
```

### D — ZATCA Failure
```
Invoice posted at 10:30
ZATCA submit → 500 error
Queue for retry (exponential backoff: 1m, 5m, 15m, 1h)
After 1h still failing → alert tax team
Manual review → ZATCA portal showed maintenance window
Resubmit at 12:00 → cleared
ICV chain remained unbroken
Customer not affected (invoice was already PDF'd)
```

### E — Partial Delivery + Multiple Invoices
```
SO 1000 units, 600 ship now, 400 in 2 weeks
DN1 → Invoice1 for 600
SO status: PARTIALLY_DELIVERED
After 2 weeks: DN2 → Invoice2 for 400
SO status: COMPLETED
Both invoices linked to SO
Each has own ZATCA UUID
Total revenue in P&L: sum of both
```

### F — Customer Pays Wrong Amount
```
Invoice 50,000 SAR, customer pays 49,500 (mistake)
Difference: 500
Cash app:
- Apply 49,500 to invoice
- Create open item for 500 still due
- Email customer about shortfall
- Or: WriteoffPolicy under 1,000 → auto-writeoff
- Audit trail full
```

### G — Customer Returns Within Period
```
Customer received 100 units, 10 defective
Submits RMA → approved
Returned to warehouse → inspected (8 defective + 2 OK)
Credit memo for 8 units → 8 × price
- Reverse inventory IN
- Credit AR
- ZATCA credit note (linked to original)
- Loyalty points clawback
- Salesman commission clawback
```

### H — Payment Discount (2/10 Net 30)
```
Invoice 10,000 + terms 2/10 Net 30
Customer pays day 8: 9,800
Cash app:
- Apply 9,800 to invoice
- Discount taken: 200
- Invoice fully cleared
- JE: DR Cash 9,800 / DR Sales Discount 200 / CR AR 10,000
```

### sad-1 — Customer Goes Bankrupt
```
Outstanding 80K, customer files bankruptcy
- Pause dunning
- Mark as legal action
- Provision (IFRS 9 ECL): expected loss 100% → 80K
- Eventually: write off
- JE: DR Bad Debt / CR AR
- Loyalty + commission clawback
```

### sad-2 — Cancel SO After Pick
```
SO picked but customer cancels
- Restocking fee applied
- Inventory IN (back to stock)
- Pick list reversed
- Notify warehouse
- Salesman commission reverted
- Customer charged restocking fee → invoice
```

### sad-3 — Wrong Item Shipped
```
Customer received wrong item
- Open ticket
- Send correct item (priority)
- Pick up wrong item from customer
- Inventory IN for returned (after inspection)
- No financial adjustment (just operational)
```

### sad-4 — Carrier Loses Shipment
```
Aramex confirms package lost
- Insurance claim
- Reship to customer (free)
- Original DN status → LOST
- Inventory write-off (if not insured) or claim recovery
```

---

## 4) تدفق البيانات + JEs في كل خطوة

```
[CRM Opportunity Won]
   ↓ no JE yet
[Quote Created]
   ↓ no JE
[Quote → SO Conversion]
   ↓ no JE (commitment only)
[SO Approved + Stock Reserved]
   ↓ no JE (reservation, not consumption)
[Pick + Pack + Ship (DN)]
   ↓ JE: DR COGS / CR Inventory  (revenue not yet recognized in IFRS 15)
   ↓ Stock movement: -qty (out of warehouse)
[Delivery Confirmed (PoD)]
   ↓ JE: DR Receivable / CR Revenue  (now recognized per IFRS 15)
   ↓ JE: DR Tax Receivable / CR Tax Liability (VAT)
   ↓ open item created
[ZATCA Cleared]
   ↓ no JE (compliance event only)
[Payment Received]
   ↓ JE: DR Bank / CR Receivable
   ↓ Open item cleared
[Bank Reconciliation]
   ↓ no JE (match only)
[Loyalty Points]
   ↓ no JE (operational, but liability tracked)
[Commission Accrual]
   ↓ JE: DR Commission Expense / CR Accrued Commission Liability
[Commission Paid in Payroll]
   ↓ JE: DR Accrued Commission / CR Bank
```

**8 JEs محتملة عبر Q2C الكامل**

---

## 5) Schema الجديدة لـ Orchestration

```prisma
model Q2CJourney {
  id              Int       @id @default(autoincrement())
  customerId      Int
  
  // Source
  leadId          Int?
  opportunityId   Int?
  quoteId         Int?
  salesOrderId    Int?
  deliveryNoteId  Int?
  invoiceId       Int?
  
  // State
  currentStage    String    // 'LEAD' | 'OPP' | 'QUOTE' | 'SO' | 'RESERVED' | 'PICKED' | 'SHIPPED' | 'DELIVERED' | 'INVOICED' | 'CLEARED' | 'PAID' | 'CLOSED' | 'CANCELLED'
  
  // Timing
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  totalCycleDays  Int?
  
  // Per-stage timing
  stageTimings    Json      // [{stage, enteredAt, exitedAt, durationHours}]
  
  // Total
  totalAmount     Decimal?  @db.Decimal(20,4)
  currency        String?
  
  // Health
  health          String    @default("ON_TRACK")  // ON_TRACK | DELAYED | STUCK | CANCELLED
  
  events          Q2CEvent[]
  slaBreaches     Q2CSlaBreach[]
  
  @@index([customerId, currentStage])
  @@index([health, startedAt])
}

model Q2CEvent {
  id              BigInt    @id @default(autoincrement())
  journeyId       Int
  journey         Q2CJourney @relation(fields: [journeyId], references: [id])
  
  eventType       String    // 'STAGE_TRANSITION' | 'PAYMENT_RECEIVED' | 'CANCELLATION' | 'EXCEPTION' | etc.
  fromStage       String?
  toStage         String?
  
  triggeredBy     String    // 'USER' | 'SYSTEM' | 'WEBHOOK' | 'CRON'
  userId          String?
  
  metadata        Json?
  
  occurredAt      DateTime  @default(now())
  
  @@index([journeyId, occurredAt])
}

model Q2CSlaBreach {
  id              Int       @id @default(autoincrement())
  journeyId       Int
  
  stage           String
  expectedHours   Int
  actualHours     Int
  
  breachedAt      DateTime  @default(now())
  resolvedAt      DateTime?
  reason          String?
}

model Q2CSagaStep {
  id              Int       @id @default(autoincrement())
  journeyId       Int
  
  stepName        String
  status          String    // 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'COMPENSATING' | 'COMPENSATED' | 'FAILED'
  
  forwardAction   String?
  compensateAction String?
  
  payload         Json?
  result          Json?
  error           String?
  
  attempts        Int       @default(0)
  maxAttempts     Int       @default(3)
  
  startedAt       DateTime?
  completedAt     DateTime?
}
```

---

## 6) Forms عبر الموديولات

| الفورم | الموديول | عنصر Q2C |
|---------|----------|----------|
| Lead Capture | CRM | Step 1 |
| Opportunity | CRM | Step 2 |
| Quote Builder | Sales | Step 3 |
| Quote Acceptance | B2B Portal أو Sales | Step 4 |
| SO Form (with ATP + Credit) | Sales + AR | Step 5 |
| Stock Reservation | Inventory | Step 6 (auto) |
| Pick List | WMS | Step 7 |
| Pack + Ship | WMS + Logistics | Step 8 |
| DN + PoD | Logistics | Step 9 |
| Invoice + ZATCA | Sales + Tax | Step 10 |
| Cash Receipt | AR | Step 11 |
| Bank Recon | Treasury | Step 12 |

---

## 7) Tables / Grids للـ Visualization

### Grid A: Q2C Pipeline (Kanban)
- Columns = Stages
- Cards = Journeys
- Filters: customer, sales rep, value, stuck duration

### Grid B: Q2C Cycle Time Analysis
- Customer | Cycle Days | vs Avg | Bottleneck Stage | Total Value

### Grid C: Stuck Journeys
- Journey #, Customer, Current Stage, Days at Stage, Sales Rep, Action

### Grid D: SLA Breaches
- Journey, Stage, Expected, Actual, Variance, Reason

---

## 8) أزرار Cross-Module

| ID | الزر | المرحلة | يفعّل |
|----|------|---------|-------|
| btn-q2c-start | بدء Q2C | from CRM | creates Journey |
| btn-q2c-advance | تقدّم | any | manual stage transition |
| btn-q2c-cancel | إلغاء | any | rollback saga |
| btn-q2c-drill | تفصيل | any | navigates to source doc |
| btn-q2c-investigate-stuck | تحقيق التعليق | stuck | analyzes blockers |
| btn-q2c-export-journey | تصدير الرحلة | done | full PDF report |
| btn-q2c-replay-saga | إعادة | failed | recovers saga |

---

## 9) Search & Filters

- Stage (multi)
- Customer search
- Sales rep
- Value range
- Cycle days range
- Health status
- Has SLA breach
- Stuck > X days
- Currency

---

## 10) Reports

- **Q2C Cycle Time**: per customer/segment/rep
- **Stage Conversion Funnel**: Lead → Opp → Quote → SO → Invoice → Paid
- **DSO Analysis**: from invoice to payment
- **Bottleneck Analysis**: where journeys spend most time
- **Lost Revenue**: cancelled at each stage
- **Salesman Performance**: cycle time + win rate per rep
- **Customer Q2C Health**: per customer journey count + avg cycle

---

## 11) Notifications

| Stage | Trigger | Recipient |
|-------|---------|-----------|
| Quote sent | Auto | Sales rep + customer |
| Quote no response 3d | Cron | Sales rep |
| SO ready for approval | Auto | Manager |
| SO approved | Auto | Sales + warehouse |
| Stock reserved | Auto | Sales + warehouse |
| Pick complete | Auto | Sales |
| Shipped | Auto | Customer + sales |
| Delivered | Auto | Customer + sales + AR |
| Invoice issued | Auto | Customer + AR |
| ZATCA cleared/failed | Auto | AR + tax |
| Payment received | Auto | Customer + AR |
| Stuck > X days | Cron | Sales rep + manager |
| SLA breach | Cron | Sales mgr |
| Cancelled | Auto | Sales + customer |

---

## 12) Permissions Matrix

| Action | Sales Rep | Sales Mgr | Warehouse | AR | CFO |
|--------|-----------|-----------|-----------|-----|-----|
| Start Journey | ✓ | ✓ | ✗ | ✗ | ✓ |
| Advance Stage | ✓ own | ✓ team | ✓ relevant | ✓ relevant | ✓ |
| Cancel | ✗ | ✓ + reason | ✗ | ✗ | ✓ |
| Override Credit | ✗ | ✗ | ✗ | ✗ | ✓ |
| Replay Saga | ✗ | ✗ | ✗ | ✗ | ✓ |
| View All Journeys | ✗ | ✓ | ✗ | ✗ | ✓ |
| Export | ✓ own | ✓ team | ✗ | ✓ | ✓ |

---

## 13) Integration Points (Cross-Module)

| من | إلى | البيانات |
|----|-----|---------|
| CRM | Sales | qualified opp → quote |
| Sales | Inventory | SO → stock reservation |
| Inventory | WMS | reservation → pick list |
| WMS | Logistics | pack → carrier booking |
| Logistics | Sales | PoD → DN confirmation |
| Sales | Tax | invoice → ZATCA |
| Sales | AR | invoice → open item |
| AR | Treasury | payment → bank link |
| Treasury | GL | bank match → JE post |
| Sales | Loyalty | invoice → points earn |
| Sales | HR/Payroll | invoice → commission accrual |

**11 integration points حساسة**

---

## 14) Tests Cross-Module

```typescript
describe('Q2C End-to-End', () => {
  test('happy path: lead to cash', async () => {
    // create lead → convert opp → quote → SO → DN → invoice → cash
    // verify each handoff + JE + ZATCA + loyalty
  })
  
  test('saga rollback on stockout', async () => {
    // SO created with stock unavailable → revert
    // verify customer notified + audit trail
  })
  
  test('credit hold blocks SO', async () => {})
  test('partial delivery creates two invoices', async () => {})
  test('ZATCA failure queue + retry', async () => {})
  test('cancel after pick applies restocking', async () => {})
  test('payment with discount applied', async () => {})
  test('bad debt provision triggers')
  test('returns clawback loyalty + commission')
  test('multi-currency consistency throughout')
})
```

---

## 15) Edge Cases (Cross-Module)

| الحالة | الموديول الذي يكشفها | السلوك |
|--------|---------------------|--------|
| Customer changes during Q2C | CRM | use snapshot at start |
| Product discontinued mid-flow | Inventory | prompt substitute |
| Tax rate changes | Tax | use rate at invoice date |
| FX rate changes | Sales + AR | freeze at invoice |
| Sales rep terminated | HR | reassign + handle commission |
| Customer credit limit changes | AR | re-check at each stage |
| Inventory revaluation during open SO | Costing | use cost at delivery |
| ZATCA cert expires mid-flow | Tax | block until renewed |
| Bank account changed during journey | Treasury | use current at receipt |
| Loyalty program ends | Loyalty | grandfather earned |

---

## 16) إحصائيات BPF #1

- **8 موديولات** متضمّنة
- **12 خطوة** متسلسلة
- **8 JEs** محتملة
- **11 integration points**
- **8 سيناريوهات** + **4 sad paths**
- **4 جداول schema** جديدة (orchestration)
- **4 grids** جديدة
- **7 buttons** cross-module
- **14 notifications** عبر الفلو
- **10 tests** integration

---

**هذا BPF #1 / 8. الباقي في ملفات منفصلة.**
