# النقص #10: Revenue Recognition (IFRS 15 / ASC 606) — مواصفات تفصيلية

> **المرجعيات:** SAP Revenue Accounting and Reporting (RAR)、Oracle Revenue Management Cloud、NetSuite Advanced Revenue Mgmt (ARM)、Zuora、Stripe Billing
> **معايير:** IFRS 15、ASC 606 (5-step model)、AICPA Revenue Recognition Guide

---

## 1. البرومنت الكامل

```
ابني نظام Revenue Recognition كامل بمستوى SAP RAR:

ملفات موجودة:
- src/lib/revenue-recognition.ts (skeleton + DeferredRevenueSchedule)
- prisma: RevenueRecognitionLine

المتطلبات:

A) IFRS 15 / ASC 606 — 5-step model:
   1. Identify contract with customer
   2. Identify performance obligations (POs)
   3. Determine transaction price
   4. Allocate price to POs based on Standalone Selling Price (SSP)
   5. Recognize revenue when (or as) PO satisfied

B) Recognition Patterns:
   - POINT_IN_TIME: delivery, completion
   - OVER_TIME_STRAIGHT_LINE: subscriptions
   - OVER_TIME_USAGE_BASED: pay-per-use
   - OVER_TIME_PERCENT_COMPLETION: construction (input or output method)
   - MILESTONE: project deliverables
   - OUTPUT_BASED: units delivered
   - INPUT_BASED: costs incurred

C) Schema (extends موجود):
   - SalesContract: contract master with terms
   - PerformanceObligation: each PO with pattern + SSP + allocation
   - DeferredRevenueSchedule: schedule per PO
   - RevenueRecognitionLine: monthly recognition entries
   - ContractModification: modifications tracking
   - VariableConsideration: bonuses/penalties/refunds estimation
   - StandaloneSellingPrice: SSP catalog (per product/service)
   - RevenueAdjustment: corrections + cumulative catch-up

D) Engine:
   1. createContract(customerId, lines[])
   2. identifyPOs(contract)
   3. allocatePrice(contract) — SSP-based
   4. createSchedule(po)
   5. runMonthlyRecognition(periodEnd)
   6. handleModification(contractId, type, params)
   7. estimateVariableConsideration(contractId, scenario)
   8. recognizePOComplete(poId, completionDate)
   9. revenueDisclosures(periodStart, periodEnd) — for notes

E) Auto-recognition:
   - cron monthly 1st: scan POs with OVER_TIME pattern
   - generate RevenueRecognitionLine + JE
   - update PO.recognizedAmount

F) APIs (25 endpoints): انظر القسم 7

G) UI (12 pages): انظر قسم 5-7

H) Tests: 50+ unit (per pattern), 18 integration, 6 E2E
```

---

## 2. السيناريوهات (10)

### A — Software Subscription (Over-time Straight-line)
```
1. شركة SaaS تبيع اشتراك سنوي 12,000 SAR
2. /sales/contracts → [+ عقد جديد]
3. Customer: شركة العميل
4. PO 1: "SaaS Subscription Annual" - 12,000 SAR
   - pattern: OVER_TIME_STRAIGHT_LINE
   - duration: 12 months from 1/1/2026
5. invoice issued for 12,000 SAR
6. JE فوري:
   DR Customer 12,000
   CR Deferred Revenue (Contract Liability) 12,000
7. Schedule generated: 12 lines × 1,000 monthly
8. Cron 1/2/2026:
   - find lines WHERE recognitionDate <= today AND not recognized
   - JE: DR Deferred Revenue 1,000 / CR Revenue 1,000
   - mark line as recognized
9. تكرار شهرياً
10. بعد 12 شهر: recognizedAmount = 12,000, deferred = 0
```

### B — Multi-PO Contract (License + Support + Implementation)
```
عقد بـ 100,000 يحتوي:
- PO1: Software License (perpetual) - SSP 60,000 - POINT_IN_TIME
- PO2: Annual Support - SSP 30,000 - OVER_TIME_STRAIGHT_LINE 12 months
- PO3: Implementation - SSP 25,000 - MILESTONE (5 milestones × 5,000)

Total SSP: 115,000 (vs contract 100,000 → discount 13%)

Allocated:
- PO1: 60,000 × (100,000/115,000) = 52,174
- PO2: 30,000 × ratio = 26,087
- PO3: 25,000 × ratio = 21,739
Total: 100,000 ✓

عند توقيع:
  DR Customer 100,000 / CR Contract Liability 100,000

PO1 delivered 1/1/2026:
  DR Contract Liability 52,174 / CR Revenue 52,174

PO2 (شهرياً 26,087/12 = 2,174):
  DR Contract Liability 2,174 / CR Revenue 2,174

PO3 milestones:
  - Milestone 1 done 15/2: DR 4,348 / CR 4,348
  - Milestone 2 done 15/3: DR 4,348 / CR 4,348
  - ...
```

### C — Construction Contract (% of Completion)
```
- contract: build factory 5,000,000 SAR over 18 months
- estimated total cost: 4,000,000 SAR
- pattern: OVER_TIME_PERCENT_COMPLETION (input method)
- شهرياً:
  - cost incurred this month: 222,222 SAR
  - cumulative cost: 1,500,000
  - % complete: 1,500,000 / 4,000,000 = 37.5%
  - revenue to recognize cumulative: 5,000,000 × 37.5% = 1,875,000
  - previously recognized: 1,650,000
  - this period: 225,000
- JE: DR Contract Asset / CR Revenue 225,000
- إذا cost overrun: re-estimate + cumulative catch-up
```

### D — Variable Consideration (Bonus/Penalty)
```
- contract: project 2,000,000 + bonus 200,000 if delivered early + penalty 100,000 if late
- expected value method:
  - 70% chance early delivery → 200,000
  - 20% chance on time → 0
  - 10% chance late → -100,000
  - expected = 0.7×200K + 0.2×0 + 0.1×-100K = 130,000
- constrained by likelihood threshold (95%): cap at 50,000
- Total transaction price: 2,000,000 + 50,000 = 2,050,000
- recognized over time
- on actual delivery: true-up if needed
```

### E — Contract Modification (New Goods)
```
- existing subscription 12,000 (6 months remaining)
- customer adds 2 more users at standalone price
- modification type: NEW_CONTRACT (because additional standalone price)
- separate contract created for new users
- old contract continues unchanged
```

### F — Contract Modification (Price Change)
```
- existing contract: 12,000 (6 months remaining = 6,000 deferred)
- customer agreed to extend with discount
- modification: PROSPECTIVE
- restate future periods with new price
- previously recognized: untouched
```

### G — Refund Liability
```
- selling 1,000 units, history shows 5% returns
- revenue 1,000 × 100 = 100,000
- expected returns 5,000
- JE:
  DR Cash 100,000
  CR Revenue 95,000
  CR Refund Liability 5,000
- on actual return:
  DR Refund Liability / CR Cash
```

### H — Right of Return (with Asset Recognition)
```
- customer can return within 30 days
- estimate 8% will return
- JE:
  DR Cash 100,000
  CR Revenue 92,000
  CR Refund Liability 8,000
  DR Right to Recover Asset 4,800 (assumed COGS 60%)
  CR Inventory 4,800 (only the un-recognized cost)
```

### I — Cumulative Catch-up
```
- subscription 12,000/year, started 1/1
- in May: changed pricing for remaining 8 months
- POSPRECTIVE method:
  - already recognized 4,000 (Jan-Apr)
  - new total contract value: 14,000
  - new monthly: (14,000 - 4,000) / 8 = 1,250
- continue Jan-Apr unchanged, May+: 1,250
```

### J — Contract Asset → Receivable
```
- service performed but not yet billed
- DR Contract Asset / CR Revenue
- when invoice issued:
  DR Receivable / CR Contract Asset
- shows distinction between unconditional right (Receivable) and conditional (Contract Asset)
```

---

## 3. تدفق البيانات

```
[Create Contract]
POST /sales/contracts
   { customerId, lines: [{description, ssp, qty, recognitionPattern, ...}], totalValue, modifiedFromContractId? }
      ↓
   create SalesContract
   for each line:
     create PerformanceObligation
     calculate allocated amount based on SSP
   ↓
   create initial JE:
     DR Customer (total)
     CR Deferred Revenue (per PO)
   ↓
   for each PO with OVER_TIME pattern:
     create DeferredRevenueSchedule
     generate monthly RevenueRecognitionLine[]
   ↓
   return { contractId, performanceObligations, schedule, journalId }

[Monthly Recognition Cron]
On 1st of each month at 2 AM:
   ↓
   call RevenueRecognitionEngine.runMonthlyRecognition(today)
      ↓
   query RevenueRecognitionLine WHERE
     recognitionDate <= today AND
     status = 'PENDING'
      ↓
   group by performanceObligationId
      ↓
   for each PO:
     for each line in this batch:
       create JournalEntry:
         DR Deferred Revenue (line amount)
         CR Revenue (line amount)
       update line.recognizedAt = now()
       update line.status = 'RECOGNIZED'
       update PO.recognizedAmount += line.amount
   ↓
   summary report → email controller

[PO Completion (Point in Time)]
POST /sales/po/:id/mark-completed
   { completionDate, completionMethod, evidence? }
      ↓
   validate PO is POINT_IN_TIME or MILESTONE
      ↓
   amount to recognize = PO.allocatedAmount - PO.recognizedAmount
      ↓
   create JE: DR Deferred Revenue / CR Revenue
   update PO.completedAt + recognizedAmount

[Modification]
POST /sales/contracts/:id/modify
   { modificationType, params }
      ↓
   based on type:
     NEW_CONTRACT → create separate SalesContract
     PROSPECTIVE → recalculate remaining periods
     CUMULATIVE_CATCH_UP → calculate adjustment + post JE
   ↓
   create ContractModification record
   update schedules accordingly

[% Complete Update]
POST /sales/po/:id/update-progress
   { newPercentComplete, costsIncurredThisPeriod }
      ↓
   amount cumulative = PO.allocatedAmount × percentComplete
   amount this period = cumulative - previously recognized
      ↓
   create JE: DR Contract Asset / CR Revenue
   update PO.recognizedAmount
```

---

## 4. Prisma Schema

```prisma
model SalesContract {
  id                          Int                       @id @default(autoincrement())
  contractNumber              String                    @unique
  customerId                  Int
  customer                    Customer                  @relation(fields: [customerId], references: [id])
  
  description                 String?
  startDate                   DateTime
  endDate                     DateTime?
  
  totalContractValue          Decimal                   @db.Decimal(20,4)
  currency                    String
  
  status                      String                    @default("DRAFT")  // 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED' | 'MODIFIED'
  
  // Source for modifications
  parentContractId            Int?
  parentContract              SalesContract?            @relation("ContractModifications", fields: [parentContractId], references: [id])
  modifications               SalesContract[]           @relation("ContractModifications")
  
  // Variable consideration
  variableConsideration       Json?                     // {expectedValue, mostLikelyAmount, scenarios, constraint}
  variableConstraintAmount    Decimal?                  @db.Decimal(20,4)
  
  // Refund liability
  refundLiabilityEstimate     Decimal?                  @db.Decimal(20,4)
  refundLiabilityRate         Decimal?                  @db.Decimal(5,4)
  
  // Discount allocation
  totalSsp                    Decimal?                  @db.Decimal(20,4)
  discountPercent             Decimal?                  @db.Decimal(5,4)
  
  // Salesperson
  salesPersonId               Int?
  
  // Approval
  approvalStatus              String?                   @default("PENDING")
  approvedAt                  DateTime?
  approvedByUserId            String?
  
  // Audit
  createdByUserId             String
  createdAt                   DateTime                  @default(now())
  updatedAt                   DateTime                  @updatedAt
  
  // Relations
  performanceObligations      PerformanceObligation[]
  contractModificationsLog    ContractModificationRecord[]
  variableUpdates             VariableConsiderationUpdate[]
  
  @@index([customerId, status])
  @@index([startDate])
}

model PerformanceObligation {
  id                          Int                       @id @default(autoincrement())
  poNumber                    String                    @unique
  contractId                  Int
  contract                    SalesContract             @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  description                 String
  productServiceId            Int?                      // link to Product if applicable
  
  standaloneSellingPrice      Decimal                   @db.Decimal(20,4)
  sspMethod                   String                    @default("OBSERVABLE")  // 'OBSERVABLE' | 'ADJUSTED_MARKET' | 'EXPECTED_COST_PLUS_MARGIN' | 'RESIDUAL'
  
  allocatedAmount             Decimal                   @db.Decimal(20,4)
  
  recognitionPattern          String                    // 'POINT_IN_TIME' | 'OVER_TIME_STRAIGHT_LINE' | 'OVER_TIME_USAGE' | 'OVER_TIME_PCT_COMPLETION_INPUT' | 'OVER_TIME_PCT_COMPLETION_OUTPUT' | 'MILESTONE'
  
  // Timing
  startDate                   DateTime?
  endDate                     DateTime?
  expectedCompletionDate      DateTime?
  completedAt                 DateTime?
  completionMethod            String?
  
  // Progress tracking
  recognizedAmount            Decimal                   @default(0) @db.Decimal(20,4)
  remainingAmount             Decimal                   @db.Decimal(20,4)
  percentComplete             Decimal                   @default(0) @db.Decimal(5,4)
  
  // For % completion
  totalEstimatedCost          Decimal?                  @db.Decimal(20,4)
  cumulativeCostIncurred      Decimal                   @default(0) @db.Decimal(20,4)
  costRevisedAt               DateTime?
  
  // For usage-based
  totalEstimatedUsage         Decimal?                  @db.Decimal(20,4)
  cumulativeUsage             Decimal                   @default(0) @db.Decimal(20,4)
  pricePerUnit                Decimal?                  @db.Decimal(20,8)
  
  // Schedule
  schedule                    DeferredRevenueSchedule?
  
  // Milestones
  milestones                  RevenueMilestone[]
  
  // GL accounts (override per PO)
  contractLiabilityAccountId  Int?
  contractAssetAccountId      Int?
  revenueAccountId            Int?
  
  status                      String                    @default("ACTIVE")  // 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED'
  
  createdAt                   DateTime                  @default(now())
  
  @@index([contractId])
  @@index([recognitionPattern, status])
  @@index([endDate])
}

model DeferredRevenueSchedule {
  id                          Int                       @id @default(autoincrement())
  performanceObligationId     Int                       @unique
  performanceObligation       PerformanceObligation     @relation(fields: [performanceObligationId], references: [id])
  
  totalAmount                 Decimal                   @db.Decimal(20,4)
  recognitionStartDate        DateTime
  recognitionEndDate          DateTime
  frequency                   String                    // 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
  
  totalLines                  Int
  recognizedLines             Int                       @default(0)
  
  generatedAt                 DateTime                  @default(now())
  isCurrent                   Boolean                   @default(true)
  versionNumber               Int                       @default(1)
  
  lines                       RevenueRecognitionLine[]
}

model RevenueRecognitionLine {
  id                          Int                       @id @default(autoincrement())
  scheduleId                  Int
  schedule                    DeferredRevenueSchedule   @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  performanceObligationId     Int
  
  lineNumber                  Int
  recognitionDate             DateTime
  scheduledAmount             Decimal                   @db.Decimal(20,4)
  recognizedAmount            Decimal?                  @db.Decimal(20,4)
  recognizedAt                DateTime?
  
  status                      String                    @default("PENDING")  // 'PENDING' | 'RECOGNIZED' | 'ADJUSTED' | 'CANCELLED' | 'DEFERRED'
  
  journalEntryId              Int?
  
  notes                       String?
  
  @@index([scheduleId, recognitionDate])
  @@index([recognizedAt])
  @@index([status, recognitionDate])
}

model RevenueMilestone {
  id                          Int                       @id @default(autoincrement())
  performanceObligationId     Int
  performanceObligation       PerformanceObligation     @relation(fields: [performanceObligationId], references: [id], onDelete: Cascade)
  
  milestoneNumber             Int
  description                 String
  amount                      Decimal                   @db.Decimal(20,4)
  expectedDate                DateTime
  actualCompletionDate        DateTime?
  status                      String                    @default("PENDING")  // 'PENDING' | 'COMPLETED' | 'DELAYED' | 'CANCELLED'
  
  evidenceFileId              Int?
  approvedByUserId            String?
  approvedAt                  DateTime?
  
  journalEntryId              Int?
  
  @@unique([performanceObligationId, milestoneNumber])
}

model ContractModificationRecord {
  id                          Int                       @id @default(autoincrement())
  contractId                  Int
  contract                    SalesContract             @relation(fields: [contractId], references: [id])
  
  modificationType            String                    // 'NEW_CONTRACT' | 'CUMULATIVE_CATCH_UP' | 'PROSPECTIVE'
  modificationDate            DateTime
  
  changeInScope               String?
  changeInPrice               Decimal?                  @db.Decimal(20,4)
  changeInDuration            Int?                      // months
  
  newContractId               Int?                      // if NEW_CONTRACT
  catchUpJournalId            Int?                      // if CUMULATIVE_CATCH_UP
  
  description                 String?                   @db.Text
  approvedByUserId            String?
  approvedAt                  DateTime?
  
  createdByUserId             String
  createdAt                   DateTime                  @default(now())
}

model VariableConsiderationUpdate {
  id                          Int                       @id @default(autoincrement())
  contractId                  Int
  contract                    SalesContract             @relation(fields: [contractId], references: [id])
  
  estimateMethod              String                    // 'EXPECTED_VALUE' | 'MOST_LIKELY_AMOUNT'
  scenarios                   Json                      // [{description, probability, amount}]
  expectedValue               Decimal                   @db.Decimal(20,4)
  constrainedAmount           Decimal                   @db.Decimal(20,4)
  
  effectiveDate               DateTime
  trueUpRequired              Boolean                   @default(false)
  trueUpJournalId             Int?
  
  reason                      String?
  
  estimatedByUserId           String
  estimatedAt                 DateTime                  @default(now())
}

model StandaloneSellingPrice {
  id                          Int                       @id @default(autoincrement())
  productServiceId            Int?
  description                 String
  
  price                       Decimal                   @db.Decimal(20,4)
  currency                    String                    @default("SAR")
  
  method                      String                    // 'OBSERVABLE' | 'ADJUSTED_MARKET' | 'EXPECTED_COST_PLUS_MARGIN' | 'RESIDUAL'
  
  effectiveFrom               DateTime
  effectiveTo                 DateTime?
  
  source                      String?                   // 'PRICE_LIST' | 'MARKET_STUDY' | 'COST_BASED' | 'CONTRACT'
  
  evidence                    String?
  
  createdByUserId             String
  
  @@index([productServiceId, effectiveFrom])
}
```

---

## 5. Forms & Fields

### Form A: Create Contract (multi-step wizard)

**Step 1 — Customer & Basic:**
| Field | Type | Required |
|-------|------|----------|
| customerId | autocomplete | ✓ |
| contractNumber | text | auto-generated |
| description | text | ✗ |
| startDate | datepicker | ✓ |
| endDate | datepicker | ✗ |
| currency | dropdown | ✓ |
| totalContractValue | money | ✓ |
| salesPersonId | user picker | ✗ |

**Step 2 — Performance Obligations:**
- dynamic table (add/remove POs)
- per PO:
| Field | Type | Required |
|-------|------|----------|
| description | text | ✓ |
| productServiceId | autocomplete | ✗ |
| standaloneSellingPrice | money | ✓ |
| recognitionPattern | dropdown | ✓ |
| startDate | datepicker | conditional |
| endDate | datepicker | conditional |
| expectedCompletionDate | datepicker | conditional |
| totalEstimatedCost | money | conditional (if % completion) |
| totalEstimatedUsage | number | conditional (if usage) |
| pricePerUnit | money | conditional |
| revenueAccountId | account picker | ✗ |

**Step 3 — Variable Consideration:**
| Field | Type | Required |
|-------|------|----------|
| hasVariableConsideration | toggle | ✓ |
| estimateMethod | radio | conditional |
| scenarios | dynamic table | conditional |

**Step 4 — Allocation Review:**
- shows total SSP vs contract value
- discount % calculated
- allocated amounts per PO

**Step 5 — Confirm & Create:**
- summary
- toggle: create invoice immediately
- toggle: post initial JE

### Form B: Add Milestone
| Field | Type | Required |
|-------|------|----------|
| poId | hidden | ✓ |
| milestoneNumber | auto | — |
| description | text | ✓ |
| amount | money | ✓ |
| expectedDate | datepicker | ✓ |

### Form C: Mark Milestone Complete
| Field | Type | Required |
|-------|------|----------|
| milestoneId | hidden | ✓ |
| actualCompletionDate | datepicker | ✓ |
| evidence | file upload | ✓ |
| notes | textarea | ✗ |
| postJournal | toggle | ✓ default true |

### Form D: Update % Completion
| Field | Type | Required |
|-------|------|----------|
| poId | hidden | ✓ |
| newPercent | number 0-100 | ✓ |
| costsThisPeriod | money | conditional (input method) |
| revisedTotalCost | money | conditional |
| reason | textarea | ✗ |

### Form E: Modify Contract
| Field | Type | Required |
|-------|------|----------|
| contractId | hidden | ✓ |
| modificationType | radio | ✓ NEW_CONTRACT/PROSPECTIVE/CUMULATIVE_CATCH_UP |
| changeInScope | text | conditional |
| changeInPrice | money | conditional |
| changeInDuration | number | conditional |
| effectiveDate | datepicker | ✓ |
| description | textarea | ✓ |
| supportingDoc | file upload | ✓ |

### Form F: Update Variable Consideration
| Field | Type | Required |
|-------|------|----------|
| contractId | hidden | ✓ |
| method | radio | ✓ |
| scenarios | dynamic table | ✓ min 2 |
| effectiveDate | datepicker | ✓ |
| reason | textarea | ✓ |

### Form G: SSP Catalog Entry
| Field | Type | Required |
|-------|------|----------|
| productServiceId | autocomplete | ✗ |
| description | text | ✓ |
| price | money | ✓ |
| currency | dropdown | ✓ |
| method | dropdown | ✓ |
| effectiveFrom | datepicker | ✓ |
| effectiveTo | datepicker | ✗ |
| source | dropdown | ✓ |
| evidence | text | ✗ |

---

## 6. Tables & Columns

### Grid A: Contracts
| Column | Width |
|--------|-------|
| Contract # | 130 |
| Customer | 200 |
| Description | 250 |
| Start Date | 130 |
| End Date | 130 |
| Total Value | money | 150 |
| Currency | 80 |
| POs | counter | 80 |
| Recognized | money | 150 |
| Remaining | money | 150 |
| Status | badge | 130 |
| Modifications | counter | 100 |
| Actions: [View] [Modify] [Cancel] | 200 |

### Grid B: Performance Obligations
| Column | Width |
|--------|-------|
| PO # | 100 |
| Description | 250 |
| SSP | money | 130 |
| Allocated | money | 130 |
| Pattern | badge | 150 |
| Start | date | 110 |
| End | date | 110 |
| Recognized | money | 130 |
| Progress | progress | 130 |
| Status | badge | 110 |
| Actions: [View] [Update Progress] [Complete] | 200 |

### Grid C: Recognition Schedule (per PO)
| Column | Width |
|--------|-------|
| Line # | 60 |
| Date | 110 |
| Scheduled Amount | money | 130 |
| Recognized Amount | money | 130 |
| Status | badge | 110 |
| Recognized At | datetime | 150 |
| JE | link | 100 |
| Actions: [Adjust] [Defer] | 150 |

### Grid D: Milestones
| Column | Width |
|--------|-------|
| # | 60 |
| Description | 250 |
| Amount | money | 130 |
| Expected Date | date | 130 |
| Actual Date | date | 130 |
| Status | badge | 110 |
| Evidence | file link | 100 |
| Approved By | user | 130 |
| Actions: [Mark Complete] [Edit] | 200 |

### Grid E: Modifications History
| Column | Width |
|--------|-------|
| Date | 110 |
| Type | badge | 150 |
| Scope Change | text | 250 |
| Price Change | money | 130 |
| Description | text | 250 |
| Approved By | user | 130 |
| New Contract | link | 100 |
| JE | link | 100 |

### Grid F: Deferred Revenue Roll-forward
| Column | Width |
|--------|-------|
| Account | 200 |
| Customer | 200 |
| Opening Balance | money | 130 |
| Additions | money | 130 |
| Recognized | money | 130 |
| Adjustments | money | 130 |
| Closing Balance | money | 130 |

### Grid G: SSP Catalog
| Column | Width |
|--------|-------|
| Product/Service | 250 |
| Description | 250 |
| Price | money | 130 |
| Currency | 80 |
| Method | badge | 150 |
| Effective From | date | 130 |
| Effective To | date | 130 |
| Source | badge | 130 |
| Actions: [Edit] [Deactivate] | 150 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-contract-create | + عقد جديد | contracts | 🟢 | role.sales OR role.controller |
| btn-contract-edit | تعديل | contract | ⬜ | role.sales |
| btn-contract-modify | + تعديل عقد | contract | 🟡 | role.controller |
| btn-contract-cancel | إلغاء العقد | contract | 🔴 | role.controller + reason |
| btn-contract-terminate | إنهاء مبكر | contract | 🔴 | role.cfo + form |
| btn-po-add | + PO | contract | 🟢 | role.sales |
| btn-po-edit | تعديل PO | po | ⬜ | role.sales |
| btn-po-mark-complete | إكمال PO | po | 🟢 | role.controller + evidence |
| btn-po-update-progress | تحديث التقدم | po | 🟦 | role.controller |
| btn-po-cancel | إلغاء PO | po | 🔴 | role.controller |
| btn-milestone-add | + milestone | po | 🟢 | role.sales |
| btn-milestone-complete | تم الإنجاز | milestone | 🟢 | role.controller |
| btn-milestone-delay | تأخير | milestone | 🟡 | role.controller |
| btn-schedule-recalc | إعادة حساب الجدول | schedule | 🟡 | role.controller |
| btn-schedule-defer-line | تأجيل سطر | line | 🟡 | role.controller + reason |
| btn-recognition-run-monthly | تشغيل recognition شهري | dashboard | 🟦 | role.controller |
| btn-recognition-run-po | تشغيل لـ PO | po | 🟦 | role.controller |
| btn-recognition-adjust | تعديل recognized | line | 🔴 | role.controller |
| btn-vc-update | تحديث VC | contract | 🟦 | role.controller |
| btn-vc-true-up | True-up | contract | 🟢 | role.controller |
| btn-ssp-create | + SSP | catalog | 🟢 | role.controller |
| btn-ssp-edit | تعديل | ssp | ⬜ | role.controller |
| btn-export-rollforward | تصدير | rollforward | ⬜ | role.controller |
| btn-disclosures-generate | توليد الإفصاحات | reports | 🟦 | role.controller |
| btn-backlog-report | تقرير backlog | reports | 🟦 | role.cfo |
| btn-contract-clone | استنساخ | contract | ⬜ | role.sales |
| btn-bulk-recognize | recognize مجموعة | schedule | 🟦 | role.controller |

---

## 8. Search & Filters

### Contracts:
- Customer, Status, Date range, Total value range, Currency, Has variable consideration, Has modifications

### POs:
- Pattern, Status, Completion date, Customer

### Schedule lines:
- Date range, Status, PO, Customer

### Milestones:
- Status, Expected date, Actual date

### SSP:
- Product, Method, Effective on date

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Deferred Revenue Roll-forward | opening + additions + recognized + closing |
| Revenue Recognition Schedule | future months recognition |
| Backlog (RPO) | remaining performance obligations |
| Contract Asset/Liability | per customer |
| ASC 606 Disclosures | structured for notes |
| IFRS 15 Disclosures | structured |
| Variable Consideration | scenarios + estimates |
| Refund Liability | per period |
| Contract Modifications Log | type breakdown |
| Revenue by Pattern | POINT_IN_TIME vs OVER_TIME |
| % Completion Status | construction contracts |
| Milestone Tracker | upcoming + delayed |

---

## 10. Dashboards & Widgets

- KPIs: Total Deferred Revenue / Recognized MTD / Backlog (RPO) / Contracts Active / Milestones Due
- Charts: Revenue trend (recognized vs deferred), Pattern distribution, Customer concentration
- Lists: Upcoming milestones, Contracts modified recently, % complete due update

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Contract created | email | controller + sales |
| Contract requires approval | in-app | approver |
| Monthly recognition run done | email | controller |
| Recognition failed | email + Slack | controller + IT |
| Milestone due in 7 days | in-app | PO owner |
| Milestone delayed | in-app | PO owner + manager |
| % complete needs update | in-app | controller |
| Variable consideration true-up needed | in-app | controller |
| Contract modified | email | controller |
| Backlog ratio changed significantly | email | CFO |

---

## 12. Permissions Matrix

| Action | Sales | Controller | CFO | Auditor |
|--------|-------|-----------|-----|---------|
| Create contract | ✓ | ✓ | ✓ | ✗ |
| Modify contract | ✗ | ✓ | ✓ | ✗ |
| Cancel/terminate | ✗ | ✓ | ✓ | ✗ |
| Add/edit PO | ✓ | ✓ | ✓ | ✗ |
| Mark milestone complete | ✗ | ✓ | ✓ | ✗ |
| Update % completion | ✗ | ✓ | ✓ | ✗ |
| Run recognition | ✗ | ✓ | ✓ | ✗ |
| Adjust recognized | ✗ | ✗ | ✓ | ✗ |
| Manage SSP catalog | ✗ | ✓ | ✓ | ✗ |
| View disclosures | ✗ | ✓ | ✓ | ✓ |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Stripe Billing / Zuora | subscription invoicing |
| CRM (Salesforce, HubSpot) | contract sync |
| Project management (Asana, Monday) | milestone tracking |
| BullMQ | background recognition |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New contract |
| `Ctrl+R` | Run recognition |
| `Ctrl+M` | Mark milestone complete |

---

## 15. Mobile / Print

- Mobile: PO completion (with photo evidence)
- Print: contract summary, disclosures report

---

## 16. Audit & Logging

- Every recognition → linked JE + audit
- Every modification → ContractModificationRecord
- VC updates → history
- SSP changes → FieldAuditLog

---

## 17. Test Cases

```typescript
describe('Subscription (Straight-line)', () => {
  test('12-month schedule generated correctly')
  test('monthly recognition posts JE')
  test('handles partial months')
  test('handles leap year')
})

describe('Multi-PO Allocation', () => {
  test('SSP-based allocation')
  test('discount applied proportionally')
  test('residual method when SSP unobservable')
})

describe('Point in Time', () => {
  test('full recognition on completion')
  test('handles before/after expected date')
})

describe('Milestone', () => {
  test('discrete recognition per milestone')
  test('out-of-order completion')
  test('cancellation refund')
})

describe('% Completion', () => {
  test('input method (cost-based)')
  test('output method (units delivered)')
  test('cost overrun → catch-up')
  test('estimated cost revised')
})

describe('Variable Consideration', () => {
  test('expected value calculation')
  test('most likely amount')
  test('constraint applied')
  test('true-up on actual')
})

describe('Modifications', () => {
  test('NEW_CONTRACT separate book')
  test('PROSPECTIVE re-allocates remaining')
  test('CUMULATIVE_CATCH_UP posts adjustment')
})

describe('Refund Liability', () => {
  test('initial estimate')
  test('actual returns trigger settlement')
})

describe('Compliance', () => {
  test('ASC 606 disclosures complete')
  test('IFRS 15 disclosures complete')
  test('Backlog calculation')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Contract cancelled mid-period | reverse remaining deferred |
| Customer goes bankrupt | impair contract asset |
| Currency change mid-contract | translate at modification |
| % complete > 100% | cap at 100% + warn |
| Negative variable consideration | constrained to 0 |
| Multiple modifications same day | apply in sequence |
| Milestone completed before expected | recognize anyway |
| Cost overrun making % > revenue | recognize loss immediately |
| FX impact on USD-denominated | per period revaluation |
| Customer prepaid full year | full deferred upfront |
| SSP changes for existing contract | use original SSP for allocation |
| Bundled contract with goods + service | identify separate POs |
| Material right for customer (loyalty points) | separate PO |
| Warranty included | assess if separate PO |
| Sales tax in transaction price | exclude from revenue |

---

**نهاية مواصفات النقص #10**

> 10 سيناريوهات • 8 جداول schema • 7 forms • 7 grids • 27 button • 8 widgets • 10 notifications • 12 reports
