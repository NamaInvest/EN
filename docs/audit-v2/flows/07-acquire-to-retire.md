# BPF #7: Acquire-to-Retire (A2R) — Fixed Assets End-to-End

> **المرجعيات:** SAP FI-AA、Oracle Fixed Assets Cloud、NetSuite FAM
> **الموديولات:** CapEx Approval, Procurement, AP, FA, Maintenance, Insurance, GL, Tax (depreciation)

---

## 1) الفلو

```
[CapEx Request]
   ↓ approval
[Approved CapEx]
   ↓ becomes PR
[Procurement (covered in #2)]
   ↓ goods received
[CWIP (Capital Work in Progress)]
   ↓ ongoing project
[Capitalization]
   ↓ becomes fixed asset
[Active Fixed Asset]
   ↓ throughout useful life
[Monthly Depreciation]
[Insurance Renewals]
[Maintenance Records]
[Impairment Tests]
[Component Replacements]
[Transfers (location/branch/cost center)]
[Reclassifications (e.g., to held-for-sale)]
   ↓ end of life
[Disposal (sale/scrap/donation/write-off)]
   ↓
[Retired Asset Archived]
```

**~14 stages، 7 modules، spans years/decades**

---

## 2) البرومنت

```
بناء A2R orchestration:

موجود: FixedAsset, FixedAssetCategory, AssetDepreciationLog, AssetImpairmentRecord, AssetTransferRecord, AssetMaintenanceRecord, fixed-assets-engine

النواقص:
A) CapEx Approval Workflow (separate from PR for capital purposes)
B) CWIP tracking with progress milestones
C) Capitalization decision (when to move from CWIP to FA)
D) Component-based depreciation (IAS 16.43)
E) Insurance auto-renewal alerts
F) IoT-based maintenance prediction
G) Disposal workflow with gain/loss + tax
H) Multi-book depreciation (Tax vs Book)

أنشئ:
- src/lib/a2r-orchestrator.ts
- prisma: CapExRequest, CwipProject, AssetLifecycleEvent
- UI: /finance/asset-lifecycle (timeline view)
```

---

## 3) السيناريوهات (8)

### A — Standard Asset Purchase
```
1. Sales VP requests new laptops 50K
2. CapEx form: justification, ROI, vendor quotes
3. Approval: Dept Head → CFO → CEO (>30K)
4. Approved → PR auto-created
5. Procurement (#2)
6. Goods received → 50K capitalized
7. Asset cards created (50 laptops, 1K each)
8. Useful life: 4 years, SL method
9. Monthly depreciation: 1000 / 48 ≈ 20.83 per laptop
```

### B — Construction Project (CWIP)
```
- New factory build 10M, 18 months
- CapEx approved
- Multiple POs over time:
  - Civil works 4M
  - Equipment 5M
  - Setup 1M
- All charged to CWIP-Factory
- Monthly progress tracked
- On completion (Day 540): all moved to fixed assets
- Depreciation begins from "available for use" date
- Useful life: 25 years building, 10 years equipment
```

### C — Component Building Purchase
```
Building 5M, decomposed:
- Structure 3.5M (50 yr)
- Roof 500K (20 yr)
- HVAC 600K (15 yr)
- Elevator 400K (10 yr)
4 separate FA records, each own depreciation

Year 8: HVAC replaced 750K
- Derecognize old HVAC (NBV 280K) → Loss 280K
- Capitalize new HVAC 750K (15 yr depreciation begins)
```

### D — Insurance Renewal
```
- Vehicle policy expires Dec 31
- Alert Sep (90d), Nov (30d), Dec 24 (7d)
- Get quotes from insurers
- Renew: 5K premium for next year
- Old policy archived
- New policy uploaded
- JE for premium expense (or prepaid if multi-year)
```

### E — Asset Transfer
```
Sales rep moves from Riyadh to Jeddah
- Their assigned car transfers
- /assets/[id]/transfer
- New: Jeddah branch + Sales-Jeddah cost center
- If cross-branch: JE for inter-branch (NBV transfer)
- Audit trail
```

### F — Impairment Test
```
- Annual review or trigger event (e.g., damaged)
- Carrying amount: 800K (cost 1.5M, accum dep 700K)
- Recoverable: max(fair value - costs to sell, value in use)
  - Fair value - costs: 550K
  - Value in use (DCF): 600K
  - Max: 600K
- Impairment: 800K - 600K = 200K
- JE: DR Impairment Loss 200K / CR Accumulated Impairment 200K
- Future depreciation based on 600K
```

### G — Sale of Asset
```
Sell old machine for 30K
- Cost 100K, accum dep 60K, NBV 40K
- Proceeds 30K → Loss 10K
- JE:
  DR Cash 30K
  DR Accum Dep 60K
  DR Loss on Disposal 10K
  CR Asset 100K
- Asset archived (status=DISPOSED)
- Insurance cancelled if applicable
```

### H — Multi-Book Depreciation
```
- Same asset, different methods per book:
  - Book book (IFRS): SL 5 years
  - Tax book (KSA): MACRS 5-year (accelerated)
- Two separate depreciation runs each month
- Different accum dep balances
- At year-end: deferred tax difference
```

### sad-1 — Asset Lost/Stolen
```
- Asset reported stolen
- Police report filed
- Insurance claim
- Asset status → WRITTEN_OFF
- JE:
  - Reverse remaining NBV
  - Insurance receivable (if covered)
  - Any uninsured loss
```

### sad-2 — CWIP Aging Too Long
```
- CWIP project 18+ months, no progress
- Quarterly review flags
- Decision:
  - Continue (with revised plan)
  - Capitalize partial (commission what works)
  - Write-off (project failed)
- If write-off: full CWIP loss
```

---

## 4) JEs throughout A2R

```
[CapEx Approved]
   ↓ no JE (commitment only)
[PR/PO/GRN] (covered #2)
   ↓ JE: DR CWIP / CR AP
[Capitalization (CWIP → FA)]
   ↓ JE: DR Fixed Asset / CR CWIP
[Monthly Depreciation]
   ↓ JE: DR Depreciation Expense / CR Accumulated Depreciation
[Component Replacement]
   ↓ JE 1: Derecognize old (DR Accum Dep / DR Loss / CR Asset)
   ↓ JE 2: Capitalize new (DR Asset / CR Cash/AP)
[Impairment]
   ↓ JE: DR Impairment Loss / CR Accumulated Impairment
[Insurance Premium]
   ↓ JE: DR Insurance Expense (or Prepaid) / CR Cash
[Insurance Claim Settlement]
   ↓ JE: DR Cash / CR Insurance Receivable
[Disposal (Sale)]
   ↓ JE: DR Cash, DR Accum Dep, DR Loss / CR Asset, CR Gain
[Disposal (Scrap)]
   ↓ JE: DR Accum Dep, DR Loss / CR Asset
```

**Many JEs over asset lifetime, depending on years**

---

## 5) Schema

```prisma
model CapExRequest {
  id              Int       @id @default(autoincrement())
  requestNumber   String    @unique
  
  description     String
  category        String    // 'IT_EQUIPMENT' | 'VEHICLE' | 'BUILDING' | 'MACHINERY' | 'FURNITURE'
  estimatedAmount Decimal   @db.Decimal(20,4)
  
  justification   String    @db.Text
  expectedRoi     Decimal?  @db.Decimal(5,2)
  paybackPeriodMonths Int?
  
  vendorQuotes    Json?     // [{vendor, quote, leadTime}]
  
  status          String    @default("DRAFT")  // DRAFT | UNDER_APPROVAL | APPROVED | REJECTED | CONVERTED_TO_PR
  
  approvalChain   Json?
  
  fiscalYear      Int
  budgetLineId    Int?
  
  prId            Int?
  
  requestedByEmployeeId Int
  requestedAt     DateTime  @default(now())
}

model CwipProject {
  id              Int       @id @default(autoincrement())
  projectNumber   String    @unique
  name            String
  description     String?
  
  totalBudget     Decimal   @db.Decimal(20,4)
  spentToDate     Decimal   @default(0) @db.Decimal(20,4)
  percentComplete Decimal   @default(0) @db.Decimal(5,2)
  
  startDate       DateTime
  expectedCompletion DateTime?
  actualCompletion DateTime?
  
  status          String    @default("ACTIVE")  // ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  
  capitalizedAssetIds Int[]
  
  capExRequestId  Int?
  managerEmployeeId Int?
  
  costsAccumulated CwipCost[]
}

model CwipCost {
  id              Int       @id @default(autoincrement())
  projectId       Int
  project         CwipProject @relation(fields: [projectId], references: [id])
  
  description     String
  category        String    // 'CIVIL' | 'EQUIPMENT' | 'INSTALLATION' | 'PROFESSIONAL_FEES' | 'INTEREST_CAPITALIZED'
  amount          Decimal   @db.Decimal(20,4)
  
  invoiceId       Int?      // link to source AP invoice
  poId            Int?
  
  capitalizedToAssetId Int?  // when moved to FA
  capitalizedAt   DateTime?
  
  recordedAt      DateTime  @default(now())
}

model AssetLifecycleEvent {
  id              BigInt    @id @default(autoincrement())
  assetId         Int
  
  eventType       String    // 'ACQUIRED' | 'CAPITALIZED' | 'DEPRECIATED' | 'IMPAIRED' | 'TRANSFERRED' | 'COMPONENT_REPLACED' | 'INSURED' | 'CLAIMED' | 'DISPOSED' | 'WRITTEN_OFF'
  
  beforeState     Json?
  afterState      Json?
  
  journalEntryId  Int?
  
  occurredAt      DateTime  @default(now())
  recordedByUserId String
  
  @@index([assetId, occurredAt])
}
```

---

## 6) Forms (8)

A: CapEx Request (with quotes + ROI)
B: CWIP Project Setup
C: CWIP Cost Recording
D: Capitalization (CWIP → FA)
E: Asset Master Wizard
F: Impairment Test
G: Disposal Form
H: Insurance Claim

---

## 7) Tables

A: CapEx Pipeline
B: CWIP Status (per project + aging)
C: Asset Register (with NBV)
D: Depreciation Schedule
E: Insurance Renewals
F: Maintenance Schedule
G: Impairment Tests
H: Disposal History

---

## 8) Buttons

| ID | الزر | المرحلة |
|----|------|---------|
| btn-a2r-capex-request | + طلب CapEx | 1 |
| btn-a2r-capex-approve | موافقة | 2 |
| btn-a2r-cwip-create | + مشروع CWIP | 3 |
| btn-a2r-cost-add | + تكلفة CWIP | 4 |
| btn-a2r-progress-update | تحديث التقدم | 5 |
| btn-a2r-capitalize | تحويل لـ FA | 6 |
| btn-a2r-asset-create | + أصل | 7 |
| btn-a2r-component-add | + component | 8 |
| btn-a2r-depreciate-monthly | تشغيل الإهلاك | 9 |
| btn-a2r-insure | + بوليصة | 10 |
| btn-a2r-renew-insurance | تجديد | 11 |
| btn-a2r-impair | اختبار الانخفاض | 12 |
| btn-a2r-transfer | نقل | 13 |
| btn-a2r-replace-component | استبدال | 14 |
| btn-a2r-dispose | تصرف | 15 |
| btn-a2r-write-off | شطب | 16 |
| btn-a2r-claim-insurance | مطالبة تأمين | event |

---

## 9) Reports

- CapEx Pipeline (approved + spent + remaining)
- CWIP Aging
- Fixed Asset Register
- Depreciation Schedule (by asset)
- Asset Roll-forward (additions + disposals)
- Insurance Renewal Calendar
- Maintenance History
- Impairment History
- Disposal Gain/Loss
- TCO (Total Cost of Ownership)

---

## 10) Notifications

- CapEx awaiting approval
- CWIP > X months (review needed)
- Capitalization due
- Insurance expiring
- Maintenance due
- Impairment indicator detected
- Asset retiring (end of useful life)
- Insurance claim status

---

## 11) Permissions

| Action | Mgr | FA Sup | Controller | CFO | Super |
|--------|-----|--------|-----------|-----|-------|
| Submit CapEx | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve CapEx (≤50K) | ✓ | ✗ | ✓ | ✓ | ✓ |
| Approve CapEx (>50K) | ✗ | ✗ | ✓ | ✓ | ✓ |
| Capitalize | ✗ | ✓ | ✓ | ✓ | ✓ |
| Run depreciation | ✗ | ✓ | ✓ | ✓ | ✓ |
| Test impairment | ✗ | ✓ | ✓ | ✓ | ✓ |
| Dispose | ✗ | ✓ + cfo | ✓ | ✓ | ✓ |
| Write-off | ✗ | ✗ | ✗ | ✓ | ✓ |
| Multi-book mgmt | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 12) Integrations

- IoT (predictive maintenance)
- Insurance providers
- Tax authorities (depreciation deductions)
- Procurement (auto-PR from CapEx)
- AP (capture costs to CWIP)
- GL (JEs)
- Multi-book engine (parallel depreciation)

---

## 13) Tests

```typescript
describe('A2R Cycle', () => {
  test('CapEx → PR conversion')
  test('CWIP accumulates costs')
  test('Capitalization at completion')
  test('Component-based depreciation')
  test('Component replacement derecognize + capitalize')
  test('Impairment writes down + revised depreciation')
  test('Disposal calculates gain/loss correctly')
  test('Multi-book parallel depreciation')
  test('Asset transfer creates inter-branch JE')
  test('Insurance claim recovery')
})
```

---

## 14) Edge Cases

| Case | Behavior |
|------|----------|
| CapEx approved but vendor unavailable | re-procurement |
| CWIP partial completion | partial capitalize |
| Asset not yet ready for use | no depreciation |
| Mid-year acquisition | half-year convention |
| Component cost > parent | warn (allow) |
| Disposal during active maintenance | cancel maintenance |
| Insurance expired during claim | claim still valid for past period |
| Impairment reversal capped at original NBV | enforce cap |

---

## 15) إحصائيات BPF #7

- 7 موديولات • 14 lifecycle stages • spans years
- 3 جداول orchestration • 8 forms • 8 grids • 17 buttons cross-module

---

**انتهى BPF #7 / 8.**
