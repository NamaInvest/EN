# النقص #12: Fixed Assets — Components + Impairment + 6 Methods — مواصفات تفصيلية

> **المرجعيات:** SAP Asset Accounting (FI-AA)、Oracle Fixed Assets、NetSuite Fixed Assets Management、Sage Fixed Assets、ProSeries Fixed Asset Manager
> **معايير:** IAS 16、IAS 36 (Impairment)、IAS 40 (Investment Property)、IAS 41 (Biological)、IFRS 5 (Held for Sale)、IFRS 6 (Mineral)、ASC 360、MACRS (US Tax)

---

## 1. البرومنت الكامل

```
وسّع نظام Fixed Assets لمستوى SAP FI-AA:

ملفات موجودة:
- src/lib/fixed-assets-engine.ts (3 methods, basic disposal)
- prisma: FixedAsset, FixedAssetAdvanced

المتطلبات:

A) طرق إهلاك (10 methods):
   1. STRAIGHT_LINE: cost / useful_life
   2. DECLINING_BALANCE: NBV × rate
   3. DOUBLE_DECLINING: NBV × (2/life)
   4. SUM_OF_YEARS_DIGITS: (remaining/SoYD) × depreciable
   5. UNITS_OF_PRODUCTION: (units_used/total_units) × depreciable
   6. HOURS_OF_OPERATION: similar to UoP for hours
   7. MACRS_3_YEAR: IRS table
   8. MACRS_5_YEAR
   9. MACRS_7_YEAR
   10. MACRS_10_YEAR

B) Conventions:
   - FULL_MONTH (default)
   - HALF_YEAR
   - MID_MONTH (US tax)
   - MID_QUARTER

C) Component Accounting (IAS 16.43):
   - parent asset + multiple components
   - each component own life + method
   - replacement cost → derecognize old + capitalize new
   - useful life review annually

D) Impairment (IAS 36):
   - cash-generating unit (CGU)
   - recoverable = max(fair value - costs to sell, value in use)
   - if recoverable < carrying → impairment
   - reversal allowed (not for goodwill)

E) Asset Lifecycle:
   - CWIP (Capital Work in Progress)
   - Active depreciation
   - Transfer (location/branch/dept)
   - Reclassification (e.g., to held-for-sale)
   - Disposal (sale, scrap, donation)
   - Insurance + claims
   - Maintenance schedule
   - Physical count (barcode/RFID)

F) APIs (35 endpoints): انظر القسم 7

G) UI (15 pages): انظر قسم 5-7

H) Tests: 60+ unit, 20 integration, 8 E2E
```

---

## 2. السيناريوهات (12)

### A — Component Accounting (Building)
```
شراء مبنى 5,000,000 SAR، تقسيم لـ4 components:
- Structure: 3,500,000 (50 سنة)
- Roof: 500,000 (20 سنة)
- HVAC: 600,000 (15 سنة)
- Elevator: 400,000 (10 سنة)

→ 4 سجلات FixedAsset (parent + 3 components)
→ كل component إهلاك مستقل
→ شهرياً 4 JEs منفصلة:
  Structure: 5,833/شهر (3.5M / 50 / 12)
  Roof: 2,083/شهر
  HVAC: 3,333/شهر
  Elevator: 3,333/شهر

بعد 8 سنوات: استبدال HVAC بـ 750,000 جديد
→ derecognize old:
  DR Accum Dep HVAC: 320,000 (8/15 × 600K)
  DR Loss on Disposal: 280,000
  CR HVAC Asset: 600,000
→ capitalize new:
  DR HVAC Asset (new): 750,000
  CR Cash/Payable: 750,000
→ يبدأ إهلاك جديد (15 سنة)
```

### B — Impairment Test (Machine)
```
- آلة بقيمة دفترية: 800,000 SAR (cost 1.5M، accum dep 700K)
- مؤشر impairment: قطع تالف، إنتاج منخفض
- recoverable amount calc:
  - fair value - costs to sell: 550,000
  - value in use (DCF): 600,000
  - max = 600,000
- impairment loss: 800,000 - 600,000 = 200,000

JE:
  DR Impairment Loss 200,000
  CR Accumulated Impairment 200,000

→ revised NBV: 600,000
→ revised depreciation base: 600,000 / remaining_life

سنة قادمة: recoverable يرتفع لـ 750,000
→ reversal allowed (لـ assets غير goodwill):
  DR Accumulated Impairment 150,000  (capped at original NBV without impairment)
  CR Reversal of Impairment Loss 150,000
```

### C — Units of Production
```
- آلة 1,000,000 SAR، تنتج 500,000 وحدة على عمرها
- شهرياً: تسجيل الإنتاج (مثلاً 8,000 وحدة)
- depreciation = (8,000 / 500,000) × 1,000,000 = 16,000

JE شهري:
  DR Depreciation Expense 16,000
  CR Accum. Depreciation 16,000

→ متى أنتجت 500K كاملة → fully depreciated
→ لو الاستخدام مستمر بعد ذلك → 0 depreciation
```

### D — Asset Transfer
```
- نقل سيارة من فرع الرياض لفرع جدة
- nbv: 80,000
- لو cost centers مختلفة (شركتين فرعيتين):
  JE inter-branch:
    DR Asset (new branch) 80,000
    CR Asset (old branch) 80,000
  + transfer accumulated dep similarly
- audit trail: TransferRecord
```

### E — CWIP → Capitalization
```
- بناء مصنع جديد، spent 12M SAR over 18 months في CWIP
- شهرياً: capture spending → CWIP balance يزيد
- عند الإنجاز:
  - reclassify CWIP → Fixed Asset
  - JE:
    DR Building 12,000,000
    CR CWIP 12,000,000
  - بدء الإهلاك من تاريخ available-for-use
```

### F — Asset Disposal
```
- بيع سيارة مستعملة: 30,000 SAR
- cost: 100,000، accum dep: 60,000، nbv: 40,000
- gain/loss = 30,000 - 40,000 = -10,000 (loss)

JE:
  DR Cash 30,000
  DR Accum. Depreciation 60,000
  DR Loss on Disposal 10,000
  CR Vehicle Asset 100,000
```

### G — MACRS (US Tax)
```
- شركة لها بعض العمليات في US
- equipment 5-year MACRS:
  Year 1: 20%
  Year 2: 32%
  Year 3: 19.2%
  Year 4: 11.52%
  Year 5: 11.52%
  Year 6: 5.76%
- if cost = 100K:
  Y1: 20K, Y2: 32K, Y3: 19.2K, Y4: 11.52K, Y5: 11.52K, Y6: 5.76K
- في tax book فقط (multi-book separation)
```

### H — Half-Year Convention
```
- asset acquired in Q3 (Sep)
- US tax: half-year convention → only 50% depreciation in Y1
- straight-line 5y, cost 100K → annual 20K
- Y1: 10K (half year)
- Y2-5: 20K each
- Y6: 10K (final half)
```

### I — Asset Insurance
```
- vehicle policy:
  - provider: التعاونية
  - premium: 5,000/year
  - coverage: 100,000 (insured value)
  - expiry: 31/12/2026
- 30 days before expiry → alert
- claim event:
  - accident → claim filed
  - settlement received
  - JE: DR Cash / CR Insurance Claim Income or reduce asset
```

### J — Physical Count
```
- annual physical count
- generate count plan (all assets in location X)
- counters use mobile app + barcode scanner
- variances:
  - assets found not in books → add
  - assets in books not found → write-off
  - location mismatches → transfer
- JEs for losses/gains
```

### K — Asset Reclassification (to Held-for-Sale)
```
- decision to sell warehouse
- IFRS 5: classify as Held for Sale
- stop depreciation
- measure at lower of carrying or fair value - costs to sell
- JE:
  DR Held for Sale Asset (new account)
  CR Original Asset
  + adjustment if fair value < carrying
```

### L — Bonus Depreciation (US Tax)
```
- US Section 179: deduct full cost in Y1 (up to limit)
- in tax book: full deduction
- in book book: normal SL
- creates deferred tax difference
```

---

## 3. تدفق البيانات

```
[Asset Creation]
POST /fixed-assets
   { name, totalCost, components: [{name, cost, life, method}], ... }
      ↓
   if components > 0:
     create parent FixedAsset (isComposite=true)
     for each component:
       create child FixedAsset (parentAssetId, isComponent=true)
   else:
     create single FixedAsset
   ↓
   create initial JE:
     DR each Asset / CR Cash or AP
   ↓
   schedule cron for depreciation

[Monthly Depreciation Cron]
On 1st of month at 1 AM:
   ↓
   query FixedAsset WHERE
     status = 'ACTIVE' AND
     depreciationStartDate <= today
      ↓
   for each asset:
     calculate period depreciation based on method:
       - SL: cost / life × period_factor
       - DB: NBV × rate × period_factor
       - DDB: NBV × (2/life) × period_factor
       - SoYD: (remaining/SoYD) × depreciable
       - UoP: requires units_consumed input
       - HoO: requires hours_operated input
       - MACRS: lookup from IRS table
     ↓
     check max depreciable cap (don't exceed)
     check convention (half-year, mid-month, etc.)
     ↓
     create JE: DR Dep Expense / CR Accum Dep
     update accumulatedDepreciation, currentBookValue
     ↓
   summary report

[Impairment Test]
POST /fixed-assets/:id/test-impairment
   { recoverableAmount, calculationMethod, evidence }
      ↓
   carrying = cost - accumDep - accumImpairment
   if recoverableAmount < carrying:
     impairmentLoss = carrying - recoverableAmount
     create JE: DR Impairment Loss / CR Accum Impairment
     create AssetImpairmentRecord
     update accumulatedImpairment
     re-calculate future depreciation base

[Asset Transfer]
POST /fixed-assets/:id/transfer
   { newLocationId, newCostCenterId, transferDate, reason }
      ↓
   if cross-cost-center:
     create JE inter-branch transfer
     transfer accum dep too
   else:
     just update fields
   ↓
   create AssetTransferRecord

[Component Replacement]
POST /fixed-assets/:parentId/replace-component
   { componentId, newCost, replacementDate, reason }
      ↓
   derecognize old component:
     create JE:
       DR Accum Dep (component)
       DR Loss on Disposal (NBV)
       CR Component Asset
   ↓
   create new component:
     INSERT FixedAsset (parentId same)
     create JE: DR new Asset / CR Cash

[Disposal]
POST /fixed-assets/:id/dispose
   { disposalDate, proceedsAmount, reason, type }
      ↓
   carrying = cost - accumDep - accumImpairment
   gainLoss = proceedsAmount - carrying
      ↓
   create JE:
     DR Cash (proceeds)
     DR Accum Dep
     DR Accum Impairment (if any)
     DR/CR Gain/Loss
     CR Asset (cost)
   ↓
   update Asset.status = 'DISPOSED'

[Physical Count]
POST /fixed-assets/physical-count/start
   { locationIds, scheduledDate }
      ↓
   generate count plan: all assets in scope
   create PhysicalCountSession

POST /fixed-assets/physical-count/scan
   { sessionId, barcode/serial }
      ↓
   match to asset → mark as found
   if not in plan → add to "found extras"

POST /fixed-assets/physical-count/finalize
   ↓
   compute variances
   for each variance:
     - missing → write-off JE
     - extra → add asset
     - wrong location → transfer JE
```

---

## 4. Prisma Schema

```prisma
model FixedAsset {
  id                              Int                       @id @default(autoincrement())
  assetNumber                     String                    @unique
  name                            String
  nameAr                          String?
  description                     String?                   @db.Text
  
  // Category
  categoryId                      Int?
  category                        FixedAssetCategory?       @relation(fields: [categoryId], references: [id])
  
  // Component structure
  parentAssetId                   Int?
  parentAsset                     FixedAsset?               @relation("AssetComponents", fields: [parentAssetId], references: [id])
  components                      FixedAsset[]              @relation("AssetComponents")
  isComposite                     Boolean                   @default(false)
  isComponent                     Boolean                   @default(false)
  componentType                   String?                   // 'STRUCTURE' | 'ROOF' | 'HVAC' | 'OTHER'
  
  // Acquisition
  acquisitionDate                 DateTime
  acquisitionCost                 Decimal                   @db.Decimal(20,4)
  currency                        String                    @default("SAR")
  vendorId                        Int?
  vendor                          Vendor?                   @relation(fields: [vendorId], references: [id])
  invoiceId                       Int?
  acquisitionJournalId            Int?
  
  // Depreciation method
  depreciationMethod              String                    // 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'DOUBLE_DECLINING' | 'SUM_OF_YEARS_DIGITS' | 'UNITS_OF_PRODUCTION' | 'HOURS_OF_OPERATION' | 'MACRS_3' | 'MACRS_5' | 'MACRS_7' | 'MACRS_10' | 'NO_DEPRECIATION'
  
  usefulLifeYears                 Int?
  usefulLifeMonths                Int?
  
  declineRate                     Decimal?                  @db.Decimal(5,4)
  
  totalEstimatedUnits             Decimal?                  @db.Decimal(20,4)
  unitsConsumed                   Decimal                   @default(0) @db.Decimal(20,4)
  
  totalEstimatedHours             Decimal?                  @db.Decimal(20,4)
  hoursOperated                   Decimal                   @default(0) @db.Decimal(20,4)
  
  salvageValue                    Decimal                   @default(0) @db.Decimal(20,4)
  
  depreciationConvention          String                    @default("FULL_MONTH")  // 'FULL_MONTH' | 'HALF_YEAR' | 'MID_MONTH' | 'MID_QUARTER'
  
  depreciationStartDate           DateTime
  
  // Current state
  accumulatedDepreciation         Decimal                   @default(0) @db.Decimal(20,4)
  accumulatedImpairment           Decimal                   @default(0) @db.Decimal(20,4)
  currentBookValue                Decimal                   @db.Decimal(20,4)
  
  // Status
  status                          String                    @default("ACTIVE")  // 'CWIP' | 'ACTIVE' | 'DISPOSED' | 'WRITTEN_OFF' | 'TRANSFERRED' | 'HELD_FOR_SALE' | 'IMPAIRED' | 'IDLE'
  statusChangedAt                 DateTime?
  
  // Disposal
  disposalDate                    DateTime?
  disposalProceeds                Decimal?                  @db.Decimal(20,4)
  disposalGainLoss                Decimal?                  @db.Decimal(20,4)
  disposalJournalId               Int?
  disposalType                    String?                   // 'SALE' | 'SCRAP' | 'DONATION' | 'WRITE_OFF' | 'EXCHANGE'
  
  // Held for sale
  heldForSaleDate                 DateTime?
  heldForSaleJournalId            Int?
  
  // Location
  locationId                      Int?
  branchId                        Int?
  costCenterId                    Int?
  custodianEmployeeId             Int?
  
  // Insurance
  insurancePolicyNumber           String?
  insuranceProvider               String?
  insurancePremium                Decimal?                  @db.Decimal(10,2)
  insuranceExpiryDate             DateTime?
  insuredValue                    Decimal?                  @db.Decimal(20,4)
  
  // Identification
  serialNumber                    String?
  barcode                         String?                   @unique
  rfidTag                         String?
  manufacturer                    String?
  model                           String?
  modelYear                       Int?
  registrationNumber              String?
  
  // Warranty
  warrantyStartDate               DateTime?
  warrantyEndDate                 DateTime?
  warrantyVendorId                Int?
  
  // CGU
  cguId                           Int?
  cgu                             CashGeneratingUnit?       @relation(fields: [cguId], references: [id])
  
  // GL Accounts (override category defaults)
  assetAccountId                  Int?
  accumDepAccountId               Int?
  depExpenseAccountId             Int?
  
  // Maintenance
  nextMaintenanceDate             DateTime?
  maintenanceFrequencyMonths      Int?
  
  // Physical count
  lastPhysicalCountDate           DateTime?
  lastPhysicalCountStatus         String?                   // 'FOUND' | 'MISSING' | 'WRONG_LOCATION'
  
  // Audit
  createdByUserId                 String
  createdAt                       DateTime                  @default(now())
  updatedAt                       DateTime                  @updatedAt
  
  // Relations
  depreciationLog                 AssetDepreciationLog[]
  impairmentRecords               AssetImpairmentRecord[]
  transferRecords                 AssetTransferRecord[]
  maintenanceRecords              AssetMaintenanceRecord[]
  insuranceClaims                 AssetInsuranceClaim[]
  usageLog                        AssetUsageLog[]
  documents                       AssetDocument[]
  reclassifications               AssetReclassification[]
  
  @@index([status, depreciationMethod])
  @@index([categoryId, status])
  @@index([locationId, branchId])
  @@index([insuranceExpiryDate])
  @@index([nextMaintenanceDate])
  @@index([parentAssetId])
}

model FixedAssetCategory {
  id                              Int                       @id @default(autoincrement())
  code                            String                    @unique
  nameAr                          String
  nameEn                          String
  parentCategoryId                Int?
  parentCategory                  FixedAssetCategory?       @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  childCategories                 FixedAssetCategory[]      @relation("CategoryHierarchy")
  
  defaultDepreciationMethod       String?
  defaultUsefulLife               Int?
  defaultSalvageValuePercent      Decimal?                  @db.Decimal(5,2)
  
  // Default GL accounts
  assetAccountId                  Int?
  accumDepAccountId               Int?
  depExpenseAccountId             Int?
  
  active                          Boolean                   @default(true)
  
  assets                          FixedAsset[]
}

model AssetDepreciationLog {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  periodStart                     DateTime
  periodEnd                       DateTime
  
  openingNbv                      Decimal                   @db.Decimal(20,4)
  depreciationAmount              Decimal                   @db.Decimal(20,4)
  closingNbv                      Decimal                   @db.Decimal(20,4)
  
  method                          String
  unitsThisPeriod                 Decimal?                  @db.Decimal(20,4)
  hoursThisPeriod                 Decimal?                  @db.Decimal(20,4)
  
  journalEntryId                  Int
  
  recognizedAt                    DateTime                  @default(now())
  
  @@index([assetId, periodEnd])
}

model AssetImpairmentRecord {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id])
  
  testDate                        DateTime
  carryingAmount                  Decimal                   @db.Decimal(20,4)
  fairValueLessCosts              Decimal?                  @db.Decimal(20,4)
  valueInUse                      Decimal?                  @db.Decimal(20,4)
  recoverableAmount               Decimal                   @db.Decimal(20,4)
  impairmentLoss                  Decimal                   @db.Decimal(20,4)
  
  reversal                        Boolean                   @default(false)
  reversalReason                  String?
  
  calculationMethod               String                    // 'DCF' | 'COMPARABLE_SALES' | 'COST_APPROACH' | 'EXPERT_VALUATION'
  evidence                        String?                   @db.Text
  evidenceFileId                  Int?
  
  journalEntryId                  Int
  
  testedByUserId                  String
  approvedByUserId                String?
  approvedAt                      DateTime?
  
  @@index([assetId, testDate])
}

model AssetTransferRecord {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id])
  
  transferDate                    DateTime
  transferType                    String                    // 'LOCATION' | 'BRANCH' | 'COST_CENTER' | 'CUSTODIAN' | 'COMPOSITE'
  
  fromLocationId                  Int?
  toLocationId                    Int?
  fromBranchId                    Int?
  toBranchId                      Int?
  fromCostCenterId                Int?
  toCostCenterId                  Int?
  fromCustodianId                 Int?
  toCustodianId                   Int?
  
  bookValueAtTransfer             Decimal                   @db.Decimal(20,4)
  reason                          String                    @db.Text
  
  journalEntryId                  Int?
  
  approvedByUserId                String?
  createdByUserId                 String
  createdAt                       DateTime                  @default(now())
}

model AssetMaintenanceRecord {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id])
  
  type                            String                    // 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'OVERHAUL'
  scheduledDate                   DateTime?
  performedDate                   DateTime?
  
  cost                            Decimal?                  @db.Decimal(20,4)
  capitalize                      Boolean                   @default(false)
  capitalizationReason            String?
  
  description                     String                    @db.Text
  performedByVendorId             Int?
  performedByEmployeeId           Int?
  
  partsReplaced                   Json?
  hoursWorked                     Decimal?                  @db.Decimal(8,2)
  
  journalEntryId                  Int?
  
  nextDueDate                     DateTime?
  
  attachments                     Json?
  
  @@index([assetId, performedDate])
  @@index([nextDueDate])
}

model AssetInsuranceClaim {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id])
  
  claimNumber                     String                    @unique
  claimDate                       DateTime
  incidentDate                    DateTime
  incidentDescription             String                    @db.Text
  
  claimedAmount                   Decimal                   @db.Decimal(20,4)
  approvedAmount                  Decimal?                  @db.Decimal(20,4)
  receivedAmount                  Decimal?                  @db.Decimal(20,4)
  
  status                          String                    @default("FILED")  // 'FILED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'
  
  insuranceCompany                String
  policyNumber                    String?
  
  journalEntryId                  Int?
  
  attachments                     Json?
  
  filedByUserId                   String
  filedAt                         DateTime                  @default(now())
}

model CashGeneratingUnit {
  id                              Int                       @id @default(autoincrement())
  code                            String                    @unique
  name                            String
  description                     String?
  
  lastTestDate                    DateTime?
  nextScheduledTestDate           DateTime?
  recoverableAmount               Decimal?                  @db.Decimal(20,4)
  
  responsibleEmployeeId           Int?
  
  assets                          FixedAsset[]
}

model AssetUsageLog {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id])
  
  periodStart                     DateTime
  periodEnd                       DateTime
  
  unitsProduced                   Decimal?                  @db.Decimal(20,4)
  hoursOperated                   Decimal?                  @db.Decimal(20,4)
  downtimeHours                   Decimal?                  @db.Decimal(20,4)
  efficiency                      Decimal?                  @db.Decimal(5,2)
  
  recordedByUserId                String
  recordedAt                      DateTime                  @default(now())
  
  @@index([assetId, periodEnd])
}

model AssetReclassification {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id])
  
  reclassificationDate            DateTime
  fromCategoryId                  Int?
  toCategoryId                    Int?
  fromStatus                      String
  toStatus                        String
  
  reason                          String                    @db.Text
  fairValueAdjustment             Decimal?                  @db.Decimal(20,4)
  journalEntryId                  Int?
  
  approvedByUserId                String?
  createdByUserId                 String
}

model AssetDocument {
  id                              Int                       @id @default(autoincrement())
  assetId                         Int
  asset                           FixedAsset                @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  documentType                    String                    // 'INVOICE' | 'WARRANTY' | 'INSURANCE' | 'PHOTO' | 'MANUAL' | 'CERTIFICATE'
  fileUrl                         String
  fileName                        String
  uploadedAt                      DateTime                  @default(now())
  uploadedByUserId                String
  
  expiryDate                      DateTime?
  
  @@index([assetId, documentType])
}

model PhysicalCountSession {
  id                              Int                       @id @default(autoincrement())
  sessionNumber                   String                    @unique
  scheduledDate                   DateTime
  startedAt                       DateTime?
  completedAt                     DateTime?
  
  scope                           Json                      // {locationIds, branchIds, categoryIds}
  totalAssetsExpected             Int
  totalAssetsFound                Int                       @default(0)
  totalVariances                  Int                       @default(0)
  
  status                          String                    @default("PLANNED")  // 'PLANNED' | 'IN_PROGRESS' | 'RECONCILING' | 'COMPLETED'
  
  scans                           PhysicalCountScan[]
  variances                       PhysicalCountVariance[]
  
  startedByUserId                 String?
  completedByUserId               String?
}

model PhysicalCountScan {
  id                              Int                       @id @default(autoincrement())
  sessionId                       Int
  session                         PhysicalCountSession      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  assetId                         Int?
  scannedCode                     String                    // barcode or serial
  scannedAt                       DateTime                  @default(now())
  scannedByUserId                 String
  locationId                      Int?
  conditionNotes                  String?
}

model PhysicalCountVariance {
  id                              Int                       @id @default(autoincrement())
  sessionId                       Int
  session                         PhysicalCountSession      @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  assetId                         Int?
  varianceType                    String                    // 'MISSING' | 'EXTRA' | 'WRONG_LOCATION' | 'DAMAGED'
  expectedLocation                Int?
  actualLocation                  Int?
  resolution                      String?                   // 'WRITE_OFF' | 'TRANSFER' | 'ADD_NEW' | 'INVESTIGATE'
  resolvedAt                      DateTime?
  journalEntryId                  Int?
}
```

---

## 5. Forms & Fields

### Form A: Create Fixed Asset (Wizard)

**Step 1 — Basic:**
| Field | Type | Required |
|-------|------|----------|
| assetNumber | text | auto |
| name | text | ✓ |
| nameAr | text | ✓ |
| description | textarea | ✗ |
| categoryId | dropdown (tree) | ✓ |
| isComposite | toggle | ✗ |

**Step 2 — Acquisition:**
| Field | Type | Required |
|-------|------|----------|
| acquisitionDate | datepicker | ✓ |
| acquisitionCost | money | ✓ |
| currency | dropdown | ✓ |
| vendorId | autocomplete | ✗ |
| invoiceId | dropdown | ✗ |
| paymentMethod | dropdown | ✓ |

**Step 3 — Components (if isComposite):**
- dynamic table:
| Field | Type | Required |
|-------|------|----------|
| componentName | text | ✓ |
| componentType | dropdown | ✓ |
| cost | money | ✓ |
| usefulLife | number | ✓ |
| method | dropdown | ✓ |

**Step 4 — Depreciation:**
| Field | Type | Required |
|-------|------|----------|
| depreciationMethod | dropdown | ✓ (10 options) |
| usefulLifeYears | number | conditional |
| declineRate | number | conditional |
| totalEstimatedUnits | number | conditional (UoP) |
| totalEstimatedHours | number | conditional (HoO) |
| salvageValue | money | ✗ |
| salvagePercent | number | ✗ (auto-calc) |
| depreciationConvention | radio | ✓ |
| depreciationStartDate | datepicker | ✓ |

**Step 5 — Identification:**
| Field | Type | Required |
|-------|------|----------|
| serialNumber | text | ✗ |
| barcode | text | ✗ |
| rfidTag | text | ✗ |
| manufacturer | text | ✗ |
| model | text | ✗ |
| modelYear | number | ✗ |
| registrationNumber | text | conditional (vehicles) |

**Step 6 — Location:**
| Field | Type | Required |
|-------|------|----------|
| locationId | dropdown | ✓ |
| branchId | dropdown | ✓ |
| costCenterId | dropdown | ✓ |
| custodianEmployeeId | autocomplete | ✗ |

**Step 7 — Insurance + Warranty:**
| Field | Type | Required |
|-------|------|----------|
| insurancePolicyNumber | text | ✗ |
| insuranceProvider | text | ✗ |
| insurancePremium | money | ✗ |
| insuranceExpiryDate | datepicker | ✗ |
| insuredValue | money | ✗ |
| warrantyStartDate | datepicker | ✗ |
| warrantyEndDate | datepicker | ✗ |
| warrantyVendorId | autocomplete | ✗ |

**Step 8 — Maintenance:**
| Field | Type | Required |
|-------|------|----------|
| nextMaintenanceDate | datepicker | ✗ |
| maintenanceFrequencyMonths | number | ✗ |

**Step 9 — Confirm:**
- summary
- toggle "Post acquisition JE now"

### Form B: Impairment Test
| Field | Type | Required |
|-------|------|----------|
| assetId | hidden | ✓ |
| testDate | datepicker | ✓ |
| carryingAmount | display | — |
| fairValueLessCosts | money | conditional |
| valueInUse | money | conditional |
| recoverableAmount | auto (max of two) | — |
| impairmentLoss | auto-calc | — |
| calculationMethod | dropdown | ✓ |
| evidence | file upload | ✓ |
| evidenceDescription | textarea | ✓ |
| reversal | toggle | ✗ |

### Form C: Transfer
| Field | Type | Required |
|-------|------|----------|
| assetId | hidden | ✓ |
| transferDate | datepicker | ✓ |
| transferType | radio | ✓ |
| toLocationId | dropdown | conditional |
| toBranchId | dropdown | conditional |
| toCostCenterId | dropdown | conditional |
| toCustodianId | autocomplete | conditional |
| reason | textarea | ✓ |
| approvalRequired | auto-flag | — |

### Form D: Disposal
| Field | Type | Required |
|-------|------|----------|
| assetId | hidden | ✓ |
| disposalDate | datepicker | ✓ |
| disposalType | radio | ✓ |
| proceedsAmount | money | ✓ |
| buyerInfo | text | conditional |
| reason | textarea | ✓ |
| evidence | file upload | ✓ |
| approverPassword | password | ✓ |

### Form E: Component Replacement
| Field | Type | Required |
|-------|------|----------|
| parentAssetId | hidden | ✓ |
| componentToReplace | dropdown | ✓ |
| newCost | money | ✓ |
| replacementDate | datepicker | ✓ |
| usefulLifeYears | number | ✓ |
| reason | textarea | ✓ |

### Form F: Log Usage (UoP/HoO)
| Field | Type | Required |
|-------|------|----------|
| assetId | hidden | ✓ |
| periodStart | datepicker | ✓ |
| periodEnd | datepicker | ✓ |
| unitsProduced | number | conditional |
| hoursOperated | number | conditional |
| downtimeHours | number | ✗ |
| notes | textarea | ✗ |

### Form G: Maintenance Record
| Field | Type | Required |
|-------|------|----------|
| assetId | hidden | ✓ |
| type | dropdown | ✓ |
| performedDate | datepicker | ✓ |
| cost | money | ✗ |
| capitalize | toggle | ✗ |
| capitalizationReason | textarea | conditional |
| description | textarea | ✓ |
| performedByVendorId | autocomplete | conditional |
| partsReplaced | dynamic table | ✗ |
| hoursWorked | number | ✗ |
| nextDueDate | datepicker | ✗ |

### Form H: Insurance Claim
| Field | Type | Required |
|-------|------|----------|
| assetId | hidden | ✓ |
| claimDate | datepicker | ✓ |
| incidentDate | datepicker | ✓ |
| incidentDescription | textarea | ✓ |
| claimedAmount | money | ✓ |
| insuranceCompany | text | ✓ |
| policyNumber | text | ✓ |
| evidence | file upload | ✓ multiple |

### Form I: Physical Count Setup
| Field | Type | Required |
|-------|------|----------|
| sessionName | text | ✓ |
| scheduledDate | datepicker | ✓ |
| scope | composite | ✓ (locations, branches, categories) |
| countersAssigned | multi user picker | ✓ |
| useBarcodeScanner | toggle | ✓ |

---

## 6. Tables & Columns

### Grid A: Fixed Assets Register
| Column | Width |
|--------|-------|
| Asset # | 130 |
| Name | 250 |
| Category | badge | 150 |
| Acquisition Date | date | 130 |
| Cost | money | 150 |
| Method | badge | 130 |
| Useful Life | number | 100 |
| Accum Dep | money | 150 |
| Accum Impairment | money | 150 |
| NBV | money | 150 |
| Location | text | 150 |
| Custodian | user | 150 |
| Status | badge | 110 |
| Insurance Expires | date | 130 |
| Next Maintenance | date | 130 |
| Actions: [View] [Depreciate] [Transfer] [Dispose] | 250 |

### Grid B: Components Tree (in asset detail)
- expandable tree showing parent + components
- per row: name, cost, NBV, status

### Grid C: Depreciation Schedule
| Column | Width |
|--------|-------|
| Period | 130 |
| Opening NBV | money | 150 |
| Depreciation | money | 130 |
| Closing NBV | money | 150 |
| Method | badge | 130 |
| Units/Hours | number | 100 |
| JE Link | link | 100 |
| Status | badge | 110 |
| Actions | 150 |

### Grid D: Impairment History
| Column | Width |
|--------|-------|
| Test Date | 130 |
| Carrying | money | 130 |
| Recoverable | money | 130 |
| Loss | money | 130 |
| Reversal | toggle | 80 |
| Method | badge | 130 |
| Evidence | link | 100 |
| Approved By | user | 130 |

### Grid E: Transfer History
| Column | Width |
|--------|-------|
| Date | 130 |
| Type | badge | 130 |
| From | text | 200 |
| To | text | 200 |
| NBV at Transfer | money | 150 |
| Reason | text | 200 |
| Approved By | user | 130 |

### Grid F: Maintenance Schedule
| Column | Width |
|--------|-------|
| Asset | link | 200 |
| Type | badge | 130 |
| Scheduled Date | date | 130 |
| Performed Date | date | 130 |
| Cost | money | 130 |
| Capitalized | toggle | 100 |
| Vendor | link | 150 |
| Next Due | date | 130 |
| Status | badge | 110 |

### Grid G: CWIP Aging
| Column | Width |
|--------|-------|
| Asset | link | 250 |
| Started | date | 130 |
| Days in CWIP | number | 130 |
| Cost to Date | money | 150 |
| Estimated Total | money | 150 |
| % Complete | progress | 130 |
| Estimated Capitalize Date | date | 150 |
| Actions: [Capitalize Now] | 150 |

### Grid H: Insurance Renewal
| Column | Width |
|--------|-------|
| Asset | link | 200 |
| Policy # | text | 130 |
| Provider | text | 150 |
| Expires | date | 130 |
| Days to Expiry | number | 130 (red if <30) |
| Premium | money | 130 |
| Insured Value | money | 150 |
| Actions: [Renew] [Claim] | 150 |

### Grid I: Physical Count Sessions
| Column | Width |
|--------|-------|
| Session # | 130 |
| Scheduled | date | 130 |
| Status | badge | 130 |
| Total Expected | number | 130 |
| Found | number | 100 |
| Variances | number | 100 |
| Started | datetime | 150 |
| Completed | datetime | 150 |
| Actions: [Start] [View] [Reconcile] | 200 |

---

## 7. Buttons & Actions

| ID | الزر | الموقع | اللون | Permission |
|----|------|--------|-------|------------|
| btn-asset-create | + أصل جديد | register | 🟢 | role.fa |
| btn-asset-edit | تعديل | asset | ⬜ | role.fa |
| btn-asset-clone | استنساخ | asset | ⬜ | role.fa |
| btn-asset-add-component | + component | asset | 🟢 | role.fa |
| btn-asset-replace-component | استبدال component | component | 🟡 | role.fa_supervisor |
| btn-asset-deactivate-component | تعطيل component | component | 🔴 | role.fa_supervisor |
| btn-asset-depreciate-now | احتساب الإهلاك | asset | 🟦 | role.fa |
| btn-asset-recalc-schedule | إعادة حساب الجدول | asset | 🟡 | role.fa |
| btn-monthly-cron-trigger | تشغيل cron يدوياً | dashboard | 🟦 | role.fa_supervisor |
| btn-test-impairment | اختبار الانخفاض | asset | 🟡 | role.fa_supervisor |
| btn-reverse-impairment | عكس الانخفاض | impairment | 🟡 | role.cfo |
| btn-asset-transfer | نقل | asset | 🟦 | role.fa |
| btn-asset-reclassify | إعادة تصنيف | asset | 🟦 | role.fa_supervisor |
| btn-asset-mark-held-for-sale | تصنيف للبيع | asset | 🟡 | role.cfo |
| btn-asset-dispose | تصرف | asset | 🔴 | role.fa_supervisor + form |
| btn-asset-write-off | شطب | asset | 🔴 | role.cfo + reason |
| btn-add-maintenance | + صيانة | asset | 🟢 | role.fa |
| btn-complete-maintenance | إنجاز صيانة | maintenance | 🟢 | role.fa |
| btn-add-insurance | + بوليصة | asset | 🟢 | role.fa |
| btn-renew-insurance | تجديد | insurance | 🟢 | role.fa |
| btn-file-claim | + مطالبة تأمين | asset | 🟦 | role.fa |
| btn-log-usage | تسجيل استخدام | asset | 🟢 | role.fa OR operator |
| btn-cwip-capitalize | تحويل من CWIP | cwip row | 🟢 | role.fa_supervisor |
| btn-physical-count-start | بدء جرد | counts | 🟢 | role.fa |
| btn-physical-count-scan | مسح | mobile | 🟦 | counter |
| btn-physical-count-finalize | إنهاء الجرد | session | 🔴 | role.fa_supervisor |
| btn-variance-resolve | حل الفرق | variance | 🟦 | role.fa |
| btn-attach-document | إرفاق مستند | asset | ⬜ | role.fa |
| btn-print-asset-card | طباعة بطاقة | asset | ⬜ | viewer |
| btn-print-barcode-label | طباعة لاصق barcode | asset | ⬜ | role.fa |
| btn-export-register | تصدير السجل | register | ⬜ | role.fa |
| btn-export-depreciation | تصدير جدول الإهلاك | asset | ⬜ | role.fa |
| btn-export-rollforward | تصدير rollforward | reports | ⬜ | role.fa |
| btn-import-assets | استيراد جماعي | register | ⬜ | role.fa_supervisor |

---

## 8. Search & Filters

### Register:
- Category (tree), Status, Method, Location, Branch, Cost Center, Custodian, Acquisition date range, Cost range, NBV range, Insurance expiring, Maintenance due

### Depreciation:
- Period range, Method, Status

### Impairment:
- Date range, Asset, Reversal toggle

### CWIP:
- Days range (e.g., > 90 days), Cost range

---

## 9. Reports & Exports

| التقرير | الوصف |
|---------|------|
| Fixed Assets Register | full list |
| Depreciation Schedule | per asset, future periods |
| Asset Roll-forward | opening + additions + disposals + closing |
| CWIP Aging | assets in CWIP with age |
| Disposal Report | per period with gain/loss |
| Impairment Report | tested + impaired |
| Asset Transfers Log | all movements |
| Maintenance History | per asset |
| Maintenance Due | upcoming + overdue |
| Insurance Renewal | expiring soon |
| Insurance Claims | filed + status |
| Physical Count Variance | per session |
| Asset Lifecycle Cost | total cost over life |
| Tax Depreciation (MACRS) | for tax book |
| Component Detail | composite assets breakdown |
| Asset by Custodian | per employee |
| Asset by Location | per location |
| Held for Sale | IFRS 5 disclosure |

---

## 10. Dashboards & Widgets

- KPIs: Total Cost / Total NBV / Total Accum Dep / CWIP Balance / Assets Due Maintenance / Insurance Expiring 30d
- Charts: Asset additions trend, Disposals trend, NBV by category (treemap), Depreciation expense forecast
- Lists: CWIP > 6 months, Insurance expiring, Maintenance overdue, Recent disposals, Pending impairment tests

---

## 11. Notifications

| Event | Channel | Recipient |
|-------|---------|-----------|
| Asset created | email | FA team |
| Monthly depreciation completed | email | FA team |
| Insurance expiring 30 days | email | FA + custodian |
| Insurance expiring 7 days | email + SMS | FA + custodian + manager |
| Maintenance due | in-app | FA + custodian |
| Maintenance overdue | email | FA + manager |
| CWIP > 6 months | email | controller |
| Impairment test required | in-app | controller |
| Disposal posted | email | CFO |
| Physical count variances | email | controller |
| Asset reaches end of useful life | in-app | FA team |
| Custodian leaves company | in-app | FA team |

---

## 12. Permissions Matrix

| Action | FA Clerk | FA Sup | Controller | CFO | Custodian |
|--------|----------|--------|-----------|-----|-----------|
| Create asset | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit basic | ✓ | ✓ | ✓ | ✓ | ✗ |
| Add component | ✓ | ✓ | ✓ | ✓ | ✗ |
| Replace component | ✗ | ✓ | ✓ | ✓ | ✗ |
| Run depreciation | ✓ | ✓ | ✓ | ✓ | ✗ |
| Test impairment | ✗ | ✓ | ✓ | ✓ | ✗ |
| Approve impairment | ✗ | ✗ | ✓ | ✓ | ✗ |
| Transfer | ✓ | ✓ | ✓ | ✓ | request |
| Dispose | ✗ | ✓ | ✓ | ✓ | ✗ |
| Write off | ✗ | ✗ | ✗ | ✓ | ✗ |
| Held for sale | ✗ | ✗ | ✓ | ✓ | ✗ |
| Capitalize CWIP | ✗ | ✓ | ✓ | ✓ | ✗ |
| Physical count | ✓ | ✓ | ✓ | ✓ | participate |
| Log usage | ✓ | ✓ | ✓ | ✓ | ✓ |
| File claim | ✓ | ✓ | ✓ | ✓ | report |

---

## 13. Integrations

| النظام | الغرض |
|--------|------|
| Barcode/RFID readers | physical count |
| IoT sensors | usage tracking |
| Insurance providers APIs | policy + claims |
| Maintenance management software (CMMS) | sync schedules |
| Multi-book engine | tax depreciation (MACRS) |
| BullMQ | monthly cron |

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | New asset |
| `Ctrl+D` | Run depreciation |
| `Ctrl+T` | Transfer |
| `Ctrl+I` | Impairment test |
| `B` | Barcode scan (mobile) |

---

## 15. Mobile / Print

### Mobile:
- physical count app (barcode scan + photo)
- maintenance log (technician)
- usage log (operator)
- transfer request (custodian)

### Print:
- asset card (with barcode)
- barcode labels (Avery format)
- depreciation schedule
- physical count sheets

---

## 16. Audit & Logging

- Every depreciation → AssetDepreciationLog + AuditLog
- Every transfer → AssetTransferRecord + AuditLog
- Every impairment → AssetImpairmentRecord + AuditLog
- Every disposal → AuditLog with full reason
- Every component change → linked records
- Physical count → full session history

---

## 17. Test Cases

```typescript
describe('Depreciation Methods', () => {
  test('STRAIGHT_LINE correct')
  test('DECLINING_BALANCE correct')
  test('DOUBLE_DECLINING correct')
  test('SUM_OF_YEARS_DIGITS correct')
  test('UNITS_OF_PRODUCTION correct')
  test('HOURS_OF_OPERATION correct')
  test('MACRS_5 matches IRS table')
  test('respects salvage value')
  test('handles full month vs half-year convention')
  test('does not depreciate below salvage')
})

describe('Component Accounting', () => {
  test('parent + components depreciate separately')
  test('replacement: derecognize + capitalize')
  test('useful life review')
})

describe('Impairment', () => {
  test('writes down to recoverable')
  test('blocks if recoverable >= carrying')
  test('reversal allowed (non-goodwill)')
  test('caps reversal at original NBV')
  test('CGU-level testing')
})

describe('Lifecycle', () => {
  test('CWIP → capitalize')
  test('transfer cross-cost-center creates JE')
  test('held for sale stops depreciation')
  test('disposal calculates gain/loss')
  test('write-off zeros out')
})

describe('Maintenance', () => {
  test('preventive on schedule')
  test('capitalize significant maintenance')
  test('expense routine maintenance')
})

describe('Insurance', () => {
  test('alert before expiry')
  test('claim posts JE on settlement')
})

describe('Physical Count', () => {
  test('barcode scan matches asset')
  test('variance: missing → write-off')
  test('variance: extra → add asset')
  test('variance: location mismatch → transfer')
})

describe('Edge Cases', () => {
  test('partial year acquisition')
  test('disposal before fully depreciated')
  test('zero salvage value')
  test('negative book value protection')
})
```

---

## 18. Edge Cases

| الحالة | السلوك |
|--------|--------|
| Acquisition mid-month | apply convention |
| Salvage > cost | reject |
| Useful life = 0 | reject (use NO_DEPRECIATION) |
| Component cost > parent | warn (allow) |
| Disposal before depreciation start | accept + skip dep |
| Impairment > carrying | cap at carrying |
| Transfer to inactive cost center | reject |
| Custodian terminated | force re-assignment |
| Insurance claim > insured value | reject |
| Maintenance cost negative (refund) | accept |
| Physical count finds same asset twice | flag duplicate |
| MACRS for non-US asset | warn (use only for tax) |
| FX on asset purchase | record at acquisition rate |
| Component with longer life than parent | warn |
| CWIP forgotten for years | quarterly reminder |
| Asset destroyed by force majeure | dispose with insurance claim |

---

**نهاية مواصفات النقص #12**

> 12 سيناريوهات • 13 جداول schema • 9 forms • 9 grids • 35 button • 9 widgets • 12 notifications • 18 reports
