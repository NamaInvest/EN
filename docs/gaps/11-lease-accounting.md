# النقص #11: Lease Accounting (IFRS 16 / ASC 842) — مواصفات تفصيلية

> **المرجعيات:** SAP RE-FX (Real Estate Lease)、SAP Lease Accounting Engine (LAE)、Oracle Lease Accounting、NetSuite Lease Accounting、LeaseQuery、Visual Lease、CoStar
> **معايير:** IFRS 16、ASC 842、IAS 17 (legacy)、GASB 87 (govt)

---

## 1. البرومنت الكامل

```
ابني نظام Lease Accounting كامل بمستوى SAP LAE/Oracle:

ملفات موجودة:
- src/lib/lease-accounting-engine.ts (PV calc + amortization, JE TODO)
- prisma: LeaseContract (basic)

المتطلبات:

A) IFRS 16 / ASC 842 — Lessee Accounting:
   - Recognize Right-of-Use (ROU) Asset
   - Recognize Lease Liability
   - Depreciate ROU over lease term
   - Interest expense on liability
   - Amortize liability with payments

B) Initial Recognition:
   JE:
     DR ROU Asset = PV of payments + Initial Direct Costs - Lease Incentives
     CR Lease Liability = PV of payments
     CR Cash = Initial Direct Costs paid
     CR Lease Incentive Liability (if any)

C) Monthly Recognition:
   1. Interest:
      DR Interest Expense = opening_liability × monthly_rate
      CR Lease Liability
   2. Payment:
      DR Lease Liability = full payment
      CR Cash
   3. Depreciation:
      DR Depreciation Expense = straight-line over term
      CR Accumulated Depreciation - ROU

D) Schema:
   - LeaseContract: full IFRS 16 fields
   - LeaseSchedule: full amortization schedule
   - LeaseScheduleLine: monthly: opening_liab, interest, payment, principal, closing_liab, rou_dep, rou_nbv
   - LeaseModification: extension, reduction, payment change, scope change
   - LeaseTermination: early termination handling
   - Sublease: operating + finance subleases
   - LeaseClassification: financial vs operating (lessor only)
   - LeaseImpairment: ROU asset impairment

E) Engine:
   1. calculatePV(payments, ibr, paymentTiming): present value
   2. generateSchedule(contractId): full amortization schedule
   3. postInitialRecognition(contractId)
   4. runMonthlyRecognition(periodEnd)
   5. modifyLease(contractId, type, newTerms): re-measure
   6. terminateLease(contractId, terminationDate, penalty)
   7. impairROU(contractId, recoverableAmount)
   8. revaluateForFXChange(contractId)
   9. handleVariablePayments(contractId, period, indexValue)

F) Lessor Accounting (separate flow):
   - classify as Operating vs Finance Lease
   - if Finance: derecognize asset + recognize lease receivable
   - if Operating: continue recognizing asset + lease income

G) Disclosures (IFRS 16.51-60):
   - Maturity analysis (1y, 2-5y, >5y)
   - Total cash outflows
   - ROU asset by class
   - Variable lease payments
   - Short-term + low-value exemptions used
   - Sublease income

H) APIs (28 endpoints): انظر القسم 7

I) UI (12 pages): انظر قسم 5-7

J) Tests: 50+ unit, 18 integration, 6 E2E
```

---

## 2. السيناريوهات (10)

### A — Office Lease (Standard Operating)
```
عقد إيجار مكتب 5 سنوات:
- إيجار شهري: 10,000 SAR
- IBR: 6% سنوي (= 0.5% شهري)
- بدء: 1/1/2026
- initial direct costs (commission): 5,000 SAR (مدفوعة)

PV calculation:
  60 شهر × 10,000 @ 0.5%/شهر
  PV ≈ 517,255 SAR

Initial JE (1/1/2026):
  DR ROU Asset 522,255  (517,255 + 5,000 IDC)
  CR Lease Liability 517,255
  CR Cash 5,000

Monthly Schedule (Month 1):
- Opening Liability: 517,255
- Interest (0.5% × 517,255): 2,586
- Payment: 10,000
- Principal: 7,414
- Closing Liability: 509,841
- ROU Depreciation: 522,255 / 60 = 8,704

Month 1 JEs (31/1/2026):
  DR Interest Expense 2,586 / CR Lease Liability 2,586
  DR Lease Liability 10,000 / CR Cash 10,000
  DR Depreciation Expense 8,704 / CR Accum. Depreciation - ROU 8,704

P&L impact monthly: 11,290
Cash outflow: 10,000

Continue 60 months → ROU and Liability both 0 at end
```

### B — Vehicle Lease with Variable Payment
```
- car lease 3 years, 5,000 SAR base + variable based on mileage
- variable: index-linked → reassessment at index changes
- base PV calculated normally
- variable component: expense as incurred (not in liability)
- if index changes → re-measure liability + adjust ROU
```

### C — Lease Modification (Extension)
```
- 5-year lease ending after 3 years
- extension agreed for 2 more years at 12,000/month
- modification date: 1/1/2029
- recalculate PV of all remaining 24 months at new rate
- compare to current liability balance
- difference → adjust ROU and Liability
- regenerate schedule for remaining period

JE remeasurement:
  DR/CR ROU Asset = adjustment
  DR/CR Lease Liability = adjustment
```

### D — Lease Modification (Reduction)
```
- reduce office space → 50% reduction
- reduce ROU by 50% + recognize gain/loss
- JE:
  CR ROU Asset (50% × NBV)
  DR Lease Liability (50% × balance)
  DR/CR Gain/Loss
```

### E — Early Termination
```
- 5-year lease, terminate after 2 years
- termination penalty: 50,000
- remaining ROU NBV: 200,000
- remaining liability: 220,000

JE:
  DR Lease Liability 220,000
  CR ROU Asset 200,000
  CR Cash 50,000 (penalty)
  DR Loss on Termination 30,000
```

### F — Sublease (Operating)
```
- main lease for 1000 sqm
- sublease 400 sqm to another tenant for 4,000/month
- main lease accounting unchanged
- recognize sublease income separately:
  DR Cash / CR Sublease Income
- disclose sublease arrangements
```

### G — Sublease (Finance)
```
- transfer substantially all risks and rewards
- derecognize ROU asset
- recognize Net Investment in Lease (sublease receivable)
- recognize gain/loss on de-recognition
```

### H — Short-term / Low-value Exemption
```
- lease 6 months → SHORT_TERM exemption
- expense as paid:
  DR Lease Expense / CR Cash
- no ROU/liability recognized

- printer lease at 200/month (low-value) → exemption
- same straight-line expense
```

### I — Foreign Currency Lease
```
- lease in USD, functional currency SAR
- PV calculated in USD
- translate to SAR at initial recognition
- monthly: payment in USD → translate at FX
- ROU asset is non-monetary → no revaluation
- Liability is monetary → revalue at period-end
- FX gain/loss on liability
```

### J — Lease Impairment
```
- COVID-style scenario: office not used
- recoverable amount of ROU < NBV
- IAS 36 impairment:
  DR Impairment Loss (P&L)
  CR Accumulated Impairment - ROU
- depreciate revised NBV over remaining term
```

---

## 3. تدفق البيانات

```
[Create Contract]
POST /accounting/leases
   { lessor, leaseClass, startDate, endDate, paymentAmount, paymentFrequency, ibr, ... }
      ↓
   validate exemption (short-term/low-value)
   if exemption → simple expense workflow, skip rest
      ↓
   calculate PV:
     payments = generatePaymentList(start, end, frequency, amount)
     PV = ∑(payment / (1 + monthly_rate)^n)
   ↓
   create LeaseContract
   create LeaseSchedule
   for each period:
     create LeaseScheduleLine with:
       opening_liab, interest, payment, principal, closing_liab,
       rou_dep, rou_nbv
   ↓
   call postInitialRecognition()
   ↓
   create initial JE:
     DR ROU Asset (PV + IDC - incentives)
     CR Lease Liability (PV)
     CR Cash (IDC paid)
     CR Lease Incentive Liability
   ↓
   return { contractId, scheduleId, initialJournalId }

[Monthly Cron - 1st of Month at 3 AM]
LeaseEngine.runMonthly(periodEnd)
   ↓
   query active LeaseSchedule.lines WHERE
     periodDate <= periodEnd AND
     recognizedAt IS NULL
   ↓
   for each line:
     create 3 JEs:
       1. Interest:
          DR Interest Expense = line.interestExpense
          CR Lease Liability = line.interestExpense
       2. Payment:
          DR Lease Liability = line.payment
          CR Cash = line.payment
       3. Depreciation:
          DR Depreciation Expense = line.rouDepreciation
          CR Accumulated Depreciation - ROU = line.rouDepreciation
     ↓
     update line.recognizedAt = now()
     update line.interestJournalId, paymentJournalId, depreciationJournalId

[Modification]
POST /accounting/leases/:id/modify
   { type, newPayment?, newEndDate?, modificationDate, reason }
      ↓
   based on type:
     - EXTENSION → recalculate PV with new term
     - REDUCTION → calculate proportional reduction
     - PAYMENT_CHANGE → recalculate PV with new payments
     - SCOPE_CHANGE → may require new lease accounting
   ↓
   compare new PV to current liability
   adjustment = new PV - current liability
   ↓
   create remeasurement JE:
     DR/CR ROU Asset = adjustment
     DR/CR Lease Liability = adjustment
   ↓
   regenerate schedule for remaining periods
   create LeaseModification record

[Termination]
POST /accounting/leases/:id/terminate
   { terminationDate, penalty, reason }
      ↓
   stop schedule at terminationDate
   reverse remaining ROU + Liability
   ↓
   JE:
     DR Lease Liability (remaining)
     CR ROU Asset (NBV)
     CR Cash (penalty)
     DR/CR Gain/Loss

[Impairment]
POST /accounting/leases/:id/impair-rou
   { recoverableAmount, evidence, testDate }
      ↓
   calculate impairment loss = NBV - recoverableAmount
   if positive:
     JE: DR Impairment Loss / CR Accumulated Impairment
     update remaining depreciation schedule
```

---

## 4. Prisma Schema

```prisma
model LeaseContract {
  id                              Int                       @id @default(autoincrement())
  contractNumber                  String                    @unique
  
  // Counterparty
  lessor                          String
  lessorContact                   String?
  lessorVendorId                  Int?
  lessorVendor                    Vendor?                   @relation(fields: [lessorVendorId], references: [id])
  
  // Asset
  leaseClass                      String                    // 'PROPERTY' | 'VEHICLE' | 'EQUIPMENT' | 'IT_EQUIPMENT' | 'FURNITURE' | 'OTHER'
  assetDescription                String
  assetLocation                   String?
  
  // Lease term
  startDate                       DateTime
  endDate                         DateTime
  termMonths                      Int
  hasExtensionOption              Boolean                   @default(false)
  extensionTerms                  String?
  exerciseOptionLikely            Boolean?
  
  // Payments
  paymentAmount                   Decimal                   @db.Decimal(20,4)
  paymentFrequency                String                    @default("MONTHLY")  // 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL'
  paymentTiming                   String                    @default("END")  // 'BEGIN' (annuity due) | 'END' (ordinary)
  paymentDayOfMonth               Int                       @default(1)
  
  // Variable payments
  hasVariablePayments             Boolean                   @default(false)
  variablePaymentBasis            String?                   // 'INDEX' | 'USAGE' | 'PERFORMANCE'
  variablePaymentDescription      String?
  
  // Currency
  currency                        String                    @default("SAR")
  
  // Discount rate
  ibr                             Decimal                   @db.Decimal(8,4)  // annual %
  ibrSource                       String?                   // 'BANK_QUOTE' | 'MARKET_AVERAGE' | 'GOVERNMENT_BOND'
  ibrDate                         DateTime?
  
  // Initial direct costs + incentives
  initialDirectCosts              Decimal                   @default(0) @db.Decimal(20,4)
  initialDirectCostsPaidAt        DateTime?
  leaseIncentive                  Decimal                   @default(0) @db.Decimal(20,4)
  
  // Exemption
  exemption                       String?                   // 'SHORT_TERM' | 'LOW_VALUE' | null
  exemptionReason                 String?
  
  // GL Accounts
  rouAccountId                    Int
  liabilityAccountId              Int
  interestAccountId               Int
  depreciationAccountId           Int
  accumDepreciationAccountId      Int
  cashAccountId                   Int
  expenseAccountId                Int?                      // for exempt leases
  
  // Calculated values
  pvOfPayments                    Decimal?                  @db.Decimal(20,4)
  rouAssetValue                   Decimal?                  @db.Decimal(20,4)
  liabilityValue                  Decimal?                  @db.Decimal(20,4)
  
  // Current state
  currentRouNbv                   Decimal?                  @db.Decimal(20,4)
  currentLiability                Decimal?                  @db.Decimal(20,4)
  
  // Status
  status                          String                    @default("DRAFT")  // 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'MODIFIED' | 'IMPAIRED'
  
  // Approval
  approvedAt                      DateTime?
  approvedByUserId                String?
  
  // Journals
  initialJournalId                Int?
  terminationJournalId            Int?
  
  // Sublease
  hasSublease                     Boolean                   @default(false)
  
  // Audit
  createdByUserId                 String
  createdAt                       DateTime                  @default(now())
  updatedAt                       DateTime                  @updatedAt
  
  // Relations
  schedule                        LeaseSchedule?
  modifications                   LeaseModification[]
  terminations                    LeaseTermination[]
  subleases                       Sublease[]
  impairments                     LeaseImpairment[]
  variablePayments                VariableLeasePayment[]
  
  @@index([status, endDate])
  @@index([lessorVendorId])
  @@index([leaseClass])
}

model LeaseSchedule {
  id                              Int                       @id @default(autoincrement())
  contractId                      Int                       @unique
  contract                        LeaseContract             @relation(fields: [contractId], references: [id], onDelete: Cascade)
  
  generatedAt                     DateTime                  @default(now())
  isCurrent                       Boolean                   @default(true)
  versionNumber                   Int                       @default(1)
  
  totalPayments                   Decimal                   @db.Decimal(20,4)
  totalInterest                   Decimal                   @db.Decimal(20,4)
  pvAtGeneration                  Decimal                   @db.Decimal(20,4)
  
  lines                           LeaseScheduleLine[]
}

model LeaseScheduleLine {
  id                              Int                       @id @default(autoincrement())
  scheduleId                      Int
  schedule                        LeaseSchedule             @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  
  periodNumber                    Int
  periodDate                      DateTime
  
  openingLiability                Decimal                   @db.Decimal(20,4)
  interestExpense                 Decimal                   @db.Decimal(20,4)
  payment                         Decimal                   @db.Decimal(20,4)
  principal                       Decimal                   @db.Decimal(20,4)
  closingLiability                Decimal                   @db.Decimal(20,4)
  
  rouDepreciation                 Decimal                   @db.Decimal(20,4)
  rouOpeningNbv                   Decimal                   @db.Decimal(20,4)
  rouClosingNbv                   Decimal                   @db.Decimal(20,4)
  
  recognizedAt                    DateTime?
  interestJournalId               Int?
  paymentJournalId                Int?
  depreciationJournalId           Int?
  
  // For variable
  variableComponent               Decimal?                  @db.Decimal(20,4)
  
  notes                           String?
  
  @@index([scheduleId, periodNumber])
  @@index([scheduleId, periodDate])
  @@index([recognizedAt])
}

model LeaseModification {
  id                              Int                       @id @default(autoincrement())
  contractId                      Int
  contract                        LeaseContract             @relation(fields: [contractId], references: [id])
  
  modificationDate                DateTime
  modificationType                String                    // 'EXTENSION' | 'REDUCTION' | 'PAYMENT_CHANGE' | 'SCOPE_CHANGE' | 'IBR_CHANGE'
  
  oldPaymentAmount                Decimal?                  @db.Decimal(20,4)
  newPaymentAmount                Decimal?                  @db.Decimal(20,4)
  oldEndDate                      DateTime?
  newEndDate                      DateTime?
  oldIbr                          Decimal?                  @db.Decimal(8,4)
  newIbr                          Decimal?                  @db.Decimal(8,4)
  
  rouAdjustment                   Decimal?                  @db.Decimal(20,4)
  liabilityAdjustment             Decimal?                  @db.Decimal(20,4)
  remeasurementJournalId          Int?
  
  newScheduleId                   Int?
  
  reason                          String                    @db.Text
  approvedByUserId                String?
  approvedAt                      DateTime?
  
  createdByUserId                 String
  createdAt                       DateTime                  @default(now())
  
  @@index([contractId, modificationDate])
}

model LeaseTermination {
  id                              Int                       @id @default(autoincrement())
  contractId                      Int                       @unique
  contract                        LeaseContract             @relation(fields: [contractId], references: [id])
  
  terminationDate                 DateTime
  terminationType                 String                    // 'EARLY_BY_LESSEE' | 'EARLY_BY_LESSOR' | 'EXPIRED' | 'MUTUAL'
  
  remainingLiability              Decimal                   @db.Decimal(20,4)
  remainingRouNbv                 Decimal                   @db.Decimal(20,4)
  
  penaltyAmount                   Decimal                   @default(0) @db.Decimal(20,4)
  refundAmount                    Decimal                   @default(0) @db.Decimal(20,4)
  
  gainLoss                        Decimal                   @db.Decimal(20,4)
  terminationJournalId            Int
  
  reason                          String                    @db.Text
  
  createdByUserId                 String
  createdAt                       DateTime                  @default(now())
}

model Sublease {
  id                              Int                       @id @default(autoincrement())
  mainLeaseId                     Int
  mainLease                       LeaseContract             @relation(fields: [mainLeaseId], references: [id])
  
  sublessee                       String
  sublessorContractId             Int?                      // separate contract record
  
  type                            String                    // 'OPERATING' | 'FINANCE'
  
  startDate                       DateTime
  endDate                         DateTime
  
  paymentAmount                   Decimal                   @db.Decimal(20,4)
  paymentFrequency                String
  
  netInvestmentInLease            Decimal?                  @db.Decimal(20,4)
  derecognitionJournalId          Int?
  
  status                          String                    @default("ACTIVE")
}

model LeaseImpairment {
  id                              Int                       @id @default(autoincrement())
  contractId                      Int
  contract                        LeaseContract             @relation(fields: [contractId], references: [id])
  
  testDate                        DateTime
  carryingAmount                  Decimal                   @db.Decimal(20,4)
  recoverableAmount               Decimal                   @db.Decimal(20,4)
  impairmentLoss                  Decimal                   @db.Decimal(20,4)
  
  reversal                        Boolean                   @default(false)
  reversalReason                  String?
  
  evidence                        String?
  
  journalEntryId                  Int
  
  approvedByUserId                String?
  
  createdByUserId                 String
  createdAt                       DateTime                  @default(now())
}

model VariableLeasePayment {
  id                              Int                       @id @default(autoincrement())
  contractId                      Int
  contract                        LeaseContract             @relation(fields: [contractId], references: [id])
  
  periodDate                      DateTime
  amount                          Decimal                   @db.Decimal(20,4)
  basisDescription                String                    // "5 SAR per km × 2,000 km"
  indexValue                      Decimal?                  @db.Decimal(20,8)  // if INDEX-based
  
  expenseJournalId                Int?
  
  recordedAt                      DateTime                  @default(now())
  recordedByUserId                String
  
  @@index([contractId, periodDate])
}
```

---

## 5. Forms & Fields

### Form A: Create Lease Contract (Wizard)

**Step 1 — Counterparty + Asset:**
| Field | Type | Required |
|-------|------|----------|
| contractNumber | text | auto |
| lessorVendorId | autocomplete | ✓ |
| lessor | text | ✓ |
| leaseClass | dropdown | ✓ |
| assetDescription | text | ✓ |
| assetLocation | text | ✗ |

**Step 2 — Term + Payments:**
| Field | Type | Required |
|-------|------|----------|
| startDate | datepicker | ✓ |
| endDate | datepicker | ✓ |
| termMonths | auto-calc | — |
| hasExtensionOption | toggle | ✗ |
| extensionTerms | text | conditional |
| exerciseOptionLikely | toggle | conditional |
| paymentAmount | money | ✓ |
| paymentFrequency | dropdown | ✓ |
| paymentTiming | radio | ✓ |
| paymentDayOfMonth | number 1-28 | ✓ |
| currency | dropdown | ✓ |

**Step 3 — Variable Payments:**
| Field | Type | Required |
|-------|------|----------|
| hasVariablePayments | toggle | ✓ |
| variablePaymentBasis | dropdown | conditional |
| variablePaymentDescription | textarea | conditional |

**Step 4 — Discount Rate:**
| Field | Type | Required |
|-------|------|----------|
| ibr | number % | ✓ |
| ibrSource | dropdown | ✓ |
| ibrDate | datepicker | ✓ |
| ibrEvidence | file upload | ✗ |

**Step 5 — Initial Costs + Incentives:**
| Field | Type | Required |
|-------|------|----------|
| initialDirectCosts | money | ✗ |
| initialDirectCostsPaidAt | datepicker | conditional |
| leaseIncentive | money | ✗ |

**Step 6 — Exemption Check:**
- auto-detects:
  - if termMonths <= 12 → suggest SHORT_TERM
  - if asset value < threshold → suggest LOW_VALUE
- toggle to apply exemption

**Step 7 — GL Accounts:**
| Field | Type | Required |
|-------|------|----------|
| rouAccountId | account picker | ✓ |
| liabilityAccountId | account picker | ✓ |
| interestAccountId | account picker | ✓ |
| depreciationAccountId | account picker | ✓ |
| accumDepreciationAccountId | account picker | ✓ |
| cashAccountId | account picker | ✓ |

**Step 8 — Schedule Preview:**
- Shows full 60-row schedule
- PV calculation visible
- Total interest, total payments

**Step 9 — Confirm + Post:**
- summary
- toggle "post initial JE now"

### Form B: Lease Modification
| Field | Type | Required |
|-------|------|----------|
| contractId | hidden | ✓ |
| modificationType | radio | ✓ |
| modificationDate | datepicker | ✓ |
| newPaymentAmount | money | conditional |
| newEndDate | datepicker | conditional |
| newIbr | number | conditional |
| newScope | text | conditional |
| reason | textarea | ✓ min 100 |
| evidence | file upload | ✓ |

### Form C: Termination
| Field | Type | Required |
|-------|------|----------|
| contractId | hidden | ✓ |
| terminationDate | datepicker | ✓ |
| terminationType | dropdown | ✓ |
| penaltyAmount | money | ✗ |
| refundAmount | money | ✗ |
| reason | textarea | ✓ |
| approvalByCfo | password | ✓ |

### Form D: Impairment Test
| Field | Type | Required |
|-------|------|----------|
| contractId | hidden | ✓ |
| testDate | datepicker | ✓ |
| recoverableAmount | money | ✓ |
| calculationMethod | dropdown | ✓ FairValue/ValueInUse |
| evidence | file upload | ✓ |
| reversal | toggle | ✗ |
| reversalReason | textarea | conditional |

### Form E: Variable Payment Entry
| Field | Type | Required |
|-------|------|----------|
| contractId | hidden | ✓ |
| periodDate | datepicker | ✓ |
| amount | money | ✓ |
| basisDescription | text | ✓ |
| indexValue | number | conditional |

### Form F: Sublease Setup
| Field | Type | Required |
|-------|------|----------|
| mainLeaseId | hidden | ✓ |
| sublessee | text | ✓ |
| type | radio | ✓ OPERATING/FINANCE |
| startDate | datepicker | ✓ |
| endDate | datepicker | ✓ |
| paymentAmount | money | ✓ |
| paymentFrequency | dropdown | ✓ |

---

## 6. Tables & Columns

### Grid A: Lease Contracts
| Column | Width |
|--------|-------|
| Contract # | 130 |
| Class | badge | 100 |
| Lessor | 200 |
| Asset Description | 250 |
| Start | date | 110 |
| End | date | 110 |
| Months Remaining | number | 130 |
| Monthly Payment | money | 130 |
| Currency | 80 |
| ROU NBV | money | 150 |
| Liability | money | 150 |
| Status | badge | 110 |
| Exemption | badge | 100 |
| Actions: [View] [Schedule] [Modify] [Terminate] | 250 |

### Grid B: Schedule Lines
| Column | Width |
|--------|-------|
| Period | 60 |
| Date | 110 |
| Opening Liab | money | 130 |
| Interest | money | 110 |
| Payment | money | 110 |
| Principal | money | 110 |
| Closing Liab | money | 130 |
| ROU Dep | money | 110 |
| ROU NBV | money | 130 |
| Status | badge | 110 |
| JEs | links | 100 |
| Actions: [Recognize] [Adjust] | 150 |

### Grid C: Modifications
| Column | Width |
|--------|-------|
| Date | 110 |
| Type | badge | 130 |
| Old Payment | money | 110 |
| New Payment | money | 110 |
| Old End | date | 110 |
| New End | date | 110 |
| ROU Adj | money | 110 |
| Liab Adj | money | 110 |
| Approved By | user | 130 |
| Reason | text | 200 |

### Grid D: Maturity Analysis
| Column | Width |
|--------|-------|
| Maturity Bucket | 200 |
| Within 1 year | money | 150 |
| 1-2 years | money | 150 |
| 2-3 years | money | 150 |
| 3-4 years | money | 150 |
| 4-5 years | money | 150 |
| > 5 years | money | 150 |
| Total | money | 150 |

### Grid E: Impairment History
| Column | Width |
|--------|-------|
| Test Date | 110 |
| Carrying | money | 130 |
| Recoverable | money | 130 |
| Impairment | money | 130 |
| Reversal | toggle | 80 |
| Approved By | user | 130 |
| Evidence | link | 100 |

### Grid F: Variable Payments
| Column | Width |
|--------|-------|
| Period | date | 110 |
| Amount | money | 130 |
| Basis | text | 250 |
| Index Value | number | 130 |
| JE | link | 100 |

### Grid G: Subleases
| Column | Width |
|--------|-------|
| Main Lease | link | 150 |
| Sublessee | 200 |
| Type | badge | 100 |
| Start | date | 110 |
| End | date | 110 |
| Payment | money | 130 |
| Status | badge | 110 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-lease-create | + عقد إيجار | leases | 🟢 | role.controller |
| btn-lease-edit | تعديل (draft only) | lease | ⬜ | role.controller |
| btn-lease-calc-pv | حساب PV | wizard | 🟦 | role.controller |
| btn-lease-preview-schedule | معاينة الجدول | wizard | 🟦 | role.controller |
| btn-lease-export-schedule | تصدير الجدول | schedule | ⬜ | role.controller |
| btn-lease-post-initial | ترحيل القيد الافتتاحي | lease | 🔴 | role.cfo |
| btn-lease-modify | تعديل العقد | lease | 🟡 | role.cfo |
| btn-lease-terminate | إنهاء مبكر | lease | 🔴 | role.cfo + form |
| btn-lease-extend | تمديد | lease | 🟢 | role.cfo |
| btn-lease-recognize-line | استرداد سطر | line | 🟢 | role.controller |
| btn-lease-recognize-all | استرداد كل المتأخرات | schedule | 🟦 | role.controller |
| btn-monthly-cron-trigger | تشغيل cron يدوياً | dashboard | 🟦 | role.controller |
| btn-impair-rou | اختبار الانخفاض | lease | 🟡 | role.cfo |
| btn-reverse-impairment | عكس الانخفاض | impairment | 🟡 | role.cfo + form |
| btn-add-variable-payment | + دفعة متغيرة | lease | 🟢 | role.controller |
| btn-create-sublease | إيجار من الباطن | lease | 🟦 | role.controller |
| btn-fx-revaluate | إعادة تقييم العملة | lease | 🟡 | role.controller |
| btn-export-disclosures | تصدير الإفصاحات | reports | ⬜ | role.controller |
| btn-export-maturity | تصدير تحليل الاستحقاق | reports | ⬜ | role.controller |
| btn-print-contract | طباعة | lease | ⬜ | viewer |
| btn-attach-document | إرفاق مستند | lease | ⬜ | role.controller |
| btn-lease-clone | استنساخ | lease | ⬜ | role.controller |
| btn-bulk-recognize | استرداد مجموعة | dashboard | 🟦 | role.controller |
| btn-export-rou-rollforward | تصدير ROU rollforward | reports | ⬜ | role.controller |

---

## 8. Search & Filters

### Leases:
- Lessor, Class, Status, Currency, Has variable payments, Exemption type, Date ranges, Maturity bucket

### Schedule:
- Period date range, Recognized status, Has variable

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Lease Portfolio Summary | all active leases overview |
| Maturity Analysis | by bucket (1y/2-5y/>5y) |
| ROU Asset Roll-forward | per period |
| Lease Liability Roll-forward | per period |
| Cash Outflows | actual + projected |
| IFRS 16 Disclosures Note | structured for FS |
| Lease Expense Schedule | monthly/quarterly forecast |
| Modifications Log | all modifications with impact |
| Terminations Log | early terminations |
| Impairment History | tested + impaired leases |
| Variable Payments Summary | by period |
| Sublease Income | per period |
| Lease vs Buy Analysis | (decision support) |

---

## 10. Dashboards & Widgets

- KPIs: Total ROU / Total Liability / Monthly Lease Expense / Avg Term Remaining / Leases Expiring Next 6 Months
- Charts: Maturity profile, P&L impact trend, ROU vs Liability over time
- Lists: Leases needing impairment test, Modifications pending, Variable payments due update

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Lease created | email | controller |
| Lease pending approval | in-app | CFO |
| Monthly recognition completed | email | controller |
| Recognition failed | email + Slack | controller + IT |
| Lease ending in 90 days | in-app | controller + facilities |
| Modification posted | email | CFO |
| Impairment test required | in-app | controller |
| Variable payment overdue | in-app | controller |
| Sublease income late | in-app | AR clerk |

---

## 12. Permissions Matrix

| Action | Controller | CFO | Auditor | Facilities |
|--------|-----------|-----|---------|------------|
| Create lease | ✓ | ✓ | ✗ | request |
| Edit (draft) | ✓ | ✓ | ✗ | ✗ |
| Post initial JE | ✗ | ✓ | ✗ | ✗ |
| Modify | ✗ | ✓ | ✗ | ✗ |
| Terminate | ✗ | ✓ | ✗ | ✗ |
| Run monthly | ✓ | ✓ | ✗ | ✗ |
| Impair | ✗ | ✓ | ✗ | ✗ |
| Add variable payment | ✓ | ✓ | ✗ | ✓ |
| Sublease | ✓ | ✓ | ✗ | ✗ |
| View reports | ✓ | ✓ | ✓ R | ✓ R |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Real estate management software | sync property leases |
| Fleet management | sync vehicle leases |
| ERP fixed assets | link ROU to FA module |
| ExchangeRate API | for FX leases |
| BullMQ | monthly cron |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | New lease |
| `Ctrl+R` | Run monthly recognition |
| `Ctrl+M` | Modify lease |

---

## 15. Mobile / Print

- Mobile: view contracts + schedules (read-only)
- Print: lease summary, schedule export

---

## 16. Audit & Logging

- Every initial recognition → AuditLog
- Every modification → LeaseModification + AuditLog
- Every impairment → AuditLog
- FX revaluation logged
- Schedule version history

---

## 17. Test Cases

```typescript
describe('PV Calculation', () => {
  test('annuity due (BEGIN) correct')
  test('ordinary annuity (END) correct')
  test('monthly compounding')
  test('matches financial calculator')
})

describe('Schedule Generation', () => {
  test('60 monthly lines')
  test('opening + interest - principal = closing')
  test('total payments matches sum')
  test('handles uneven payments')
})

describe('Initial Recognition', () => {
  test('JE balanced')
  test('ROU = PV + IDC - incentive')
  test('Liability = PV')
})

describe('Monthly Recognition', () => {
  test('3 JEs per period')
  test('interest calculated correctly')
  test('depreciation straight-line')
  test('handles partial month')
})

describe('Modification', () => {
  test('extension recalculates PV')
  test('reduction recognizes gain/loss')
  test('payment change adjusts schedule')
  test('IBR change re-measures')
})

describe('Termination', () => {
  test('reverses remaining balances')
  test('penalty + gain/loss correct')
})

describe('Impairment', () => {
  test('writes down ROU')
  test('revised depreciation')
  test('reversal possible (non-goodwill)')
})

describe('Variable Payments', () => {
  test('expensed as incurred')
  test('not in liability calculation')
})

describe('Exemptions', () => {
  test('short-term: simple expense')
  test('low-value: simple expense')
})

describe('FX', () => {
  test('liability revalued at period-end')
  test('ROU not revalued')
  test('FX gain/loss correct')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Term changes mid-year | re-measure |
| Holiday no payment | skip but accrue interest |
| Initial direct cost paid later | accrue first |
| IBR not available | use government bond + spread |
| Leap year | 366 days vs 365 |
| Multiple modifications same day | apply in sequence |
| Termination on first day | reverse initial JE |
| Sublease starts before main lease | reject (data integrity) |
| Variable payment > base payment | accept + alert |
| Zero payment period (rent-free month) | include in PV at 0 |
| Currency change (rare) | re-measure at new functional |
| Lessor changes mid-term | update record + log |
| Asset destroyed (force majeure) | special termination |
| Lease becomes onerous | additional impairment |
| Renewal option becomes likely | reassess + extend |

---

**نهاية مواصفات النقص #11**

> 10 سيناريوهات • 8 جداول schema • 6 forms • 7 grids • 24 button • 8 widgets • 9 notifications • 13 reports
