# النقص #23: Quality Management (QC + NCR + CAPA + SPC) — مواصفات تفصيلية

> **المرجعيات:** SAP QM、Oracle Quality、MasterControl、Pilgrim、ETQ Reliance、ISO 9001/13485/14001、FDA 21 CFR Part 11

---

## 1. البرومنت

```
ابني نظام Quality Management شامل:

موجود: QualityCheck, QualitySpec, QualityInspection (basic)

النواقص:
A) Quality Specifications (per product/category):
   - Parameters with min/max/target
   - Sampling plans (AQL ISO 2859, MIL-STD-105)
   - Test methods + equipment
   - Skip-lot rules
B) Inspection Workflows:
   - Incoming (vendor goods)
   - In-process (during production)
   - Final (FG)
   - Customer return inspection
   - Lab tests (with TAT)
C) NCR (Non-Conformance):
   - Source (incoming/in-process/final/customer)
   - Disposition workflow (return/rework/scrap/use-as-is/downgrade)
   - Cost tracking (cost of poor quality)
D) CAPA (Corrective + Preventive):
   - Root cause analysis (5-whys, fishbone, Pareto)
   - Action plans
   - Effectiveness verification
   - Recurrence prevention
E) SPC (Statistical Process Control):
   - Control charts (X-bar, R, P, NP, C, U)
   - Cpk / Cp capability
   - Out-of-control detection
   - Auto-alert on rules (Western Electric)
F) Supplier Quality:
   - Vendor audits
   - Incoming AQL acceptance
   - Vendor scorecards
G) Calibration Mgmt:
   - Equipment register
   - Calibration schedule
   - Out-of-cal alerts
H) Document Control:
   - SOPs versioning
   - Training records
   - Compliance audits
I) ISO compliance support
J) FDA 21 CFR Part 11 (electronic signatures)

APIs (40+), UI (18 pages), Tests 60+
```

---

## 2. السيناريوهات (8)

### A — Incoming QC with AQL
```
1. GRN of 1000 units from vendor
2. AQL plan: General Inspection Level II, AQL 1.0
3. Sample size: 80
4. Acceptable defects: 2, Rejection: 3
5. QC inspector samples 80 → 1 defect found
6. Pass → release entire lot
7. If 3 defects → reject entire lot → return to vendor
```

### B — In-Process QC
```
- During production: every 100th unit pulled for QC
- Inspector measures critical dimensions
- Result entered in tablet
- SPC chart updated real-time
- If trending toward limit → alert operator + supervisor
```

### C — NCR Disposition
```
- 50 units found defective (cosmetic)
- NCR opened
- Material Review Board (MRB) decides:
  - 30 → rework (paint touch-up)
  - 15 → downgrade (sold as B-grade)
  - 5 → scrap
- Cost calculated: 5 × 100 = 500 SAR scrap
- CAPA opened to prevent recurrence
```

### D — CAPA Full Workflow
```
1. Customer complaint: product failure
2. CAPA opened
3. Root cause analysis:
   - 5-whys: stopped at "supplier batch issue"
   - Fishbone: people/method/material/machine
4. Corrective action: recall + replace
5. Preventive action: stricter incoming AQL + supplier audit
6. Implemented over 30 days
7. Effectiveness verification: 0 recurrences in 90 days
8. CAPA closed
```

### E — SPC Out-of-Control
```
- Control chart shows 3 consecutive points beyond +2σ
- Western Electric rule violated
- Auto-alert sent to supervisor
- Production paused for investigation
- Adjustment made + chart returns to control
```

### F — Supplier Audit
```
- Annual audit scheduled for vendor X
- Auditor uses checklist (40 items)
- Score: 85/100 → Approved
- Findings: 3 minor (corrective requested)
- Vendor responds in 30 days
- Closure verified
```

### G — Equipment Calibration
```
- Caliper #C-001 due for calibration
- Alert sent to maintenance
- Calibration performed (external lab)
- Certificate uploaded
- Next due date: 1 year
- If overdue: equipment marked DO NOT USE
```

### H — Recall
```
- Defect identified in batch
- Severity: Class II
- Recall workflow:
  - Identify all affected units (sales + stock)
  - Notify customers
  - Quarantine remaining stock
  - Track returns
  - Refund / replace
- Regulatory reporting (SFDA if pharmacy)
```

---

## 3. تدفق البيانات

```
[Inspection]
POST /quality/inspections { type, sourceType, productId, qty, plan }
   ↓ generate sample tasks per parameter
   ↓ inspector enters readings
   ↓ auto-calc against limits
   ↓ pass/fail/conditional decision
   ↓ if fail → create NCR

[NCR Disposition]
POST /quality/ncr/:id/disposition { decision, qty per disposition }
   ↓ for SCRAP → JE writeoff
   ↓ for REWORK → create rework WO
   ↓ for DOWNGRADE → create new SKU
   ↓ for RETURN → create vendor return PO

[SPC Real-time]
On reading entry:
   ↓ update control chart
   ↓ check rules (1: out of limits, 2: 9 same side, 3: 6 trending)
   ↓ if violation → alert
```

---

## 4. Schema (selected)

```prisma
model QualitySpec {
  // ... existing
  productId       Int
  applicableInspectionTypes String[] // INCOMING | IN_PROCESS | FINAL | RETURN
  
  parameters      QualityParameter[]
  
  samplingPlanId  Int?
  
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  version         Int       @default(1)
}

model QualityParameter {
  id              Int       @id @default(autoincrement())
  specId          Int
  spec            QualitySpec @relation(fields: [specId], references: [id], onDelete: Cascade)
  
  paramName       String
  paramCode       String
  description     String?
  
  type            String    // 'NUMERIC' | 'BOOLEAN' | 'TEXT' | 'CATEGORICAL' | 'DATE'
  
  // Numeric limits
  minValue        Decimal?  @db.Decimal(20,8)
  maxValue        Decimal?  @db.Decimal(20,8)
  targetValue     Decimal?  @db.Decimal(20,8)
  unit            String?
  
  // Categorical
  allowedValues   String[]?
  
  isCritical      Boolean   @default(false)
  
  testMethod      String?
  equipmentId     Int?
}

model SamplingPlan {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  standard        String    // 'ANSI/ASQ Z1.4' | 'MIL-STD-105E' | 'ISO 2859' | 'CUSTOM'
  inspectionLevel String    // 'I' | 'II' | 'III' | 'S-1' | 'S-2' | 'S-3' | 'S-4'
  aql             Decimal   @db.Decimal(5,3)
  
  table           Json      // sample size per lot size
}

model QualityInspection {
  // ... existing
  inspectionNumber String   @unique
  type            String    // 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'CUSTOMER_RETURN' | 'AUDIT'
  
  sourceDocumentType String? // 'GRN' | 'MO' | 'SO_RETURN'
  sourceDocumentId Int?
  
  productId       Int
  batchId         Int?
  qty             Decimal   @db.Decimal(20,4)
  
  specId          Int
  samplingPlanId  Int?
  sampleSize      Int
  
  status          String    @default("PENDING")  // PENDING | IN_PROGRESS | PASSED | FAILED | CONDITIONAL | OBSOLETED
  
  inspectorUserId String?
  inspectedAt     DateTime?
  inspectionDuration Int?
  
  ncrCreated      Boolean   @default(false)
  ncrId           Int?
  
  results         QualityInspectionResult[]
  decision        String?   // 'ACCEPT' | 'REJECT' | 'CONDITIONAL_ACCEPT' | 'RE_INSPECT'
  decisionNotes   String?
}

model QualityInspectionResult {
  id              Int       @id @default(autoincrement())
  inspectionId    Int
  inspection      QualityInspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  parameterId     Int
  sampleNumber    Int
  
  numericValue    Decimal?  @db.Decimal(20,8)
  textValue       String?
  booleanValue    Boolean?
  
  passed          Boolean
  outOfControl    Boolean   @default(false)
  
  recordedAt      DateTime  @default(now())
  recordedByUserId String
}

model NcReport {
  id              Int       @id @default(autoincrement())
  ncrNumber       String    @unique
  
  source          String    // 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'CUSTOMER_RETURN' | 'INTERNAL_FOUND'
  productId       Int
  batchId         Int?
  qty             Decimal   @db.Decimal(20,4)
  
  defectType      String
  description     String    @db.Text
  severity        String    // 'MINOR' | 'MAJOR' | 'CRITICAL'
  classification  String?   // 'COSMETIC' | 'FUNCTIONAL' | 'SAFETY' | 'PERFORMANCE'
  
  inspectionId    Int?
  
  // Disposition
  status          String    @default("OPEN")  // OPEN | UNDER_MRB | DECIDED | IMPLEMENTING | CLOSED
  
  dispositionId   Int?
  
  cost            Decimal?  @db.Decimal(20,4)
  
  capaId          Int?
  
  reportedByUserId String
  reportedAt      DateTime  @default(now())
  
  closedAt        DateTime?
  closedByUserId  String?
}

model NcrDisposition {
  id              Int       @id @default(autoincrement())
  ncrId           Int
  ncr             NcReport  @relation(fields: [ncrId], references: [id])
  
  decisions       Json      // [{type: SCRAP, qty: 5}, {type: REWORK, qty: 30}, ...]
  decidedAt       DateTime  @default(now())
  decidedByUserId String
  mrbMembers      String[]
  reasoning       String    @db.Text
  
  reworkMoId      Int?
  vendorReturnPoId Int?
  scrapJournalId  Int?
}

model CapaCase {
  id              Int       @id @default(autoincrement())
  capaNumber      String    @unique
  
  type            String    // 'CORRECTIVE' | 'PREVENTIVE' | 'CAPA'
  source          String    // 'CUSTOMER' | 'INTERNAL' | 'AUDIT' | 'NCR' | 'TREND' | 'REGULATORY'
  
  title           String
  description     String    @db.Text
  
  rootCauseAnalysisMethod String? // '5_WHYS' | 'FISHBONE' | 'PARETO' | 'FMEA'
  rootCauseDetails String?  @db.Text
  
  correctiveActions Json?   // [{action, owner, dueDate, status}]
  preventiveActions Json?
  
  effectivenessChecks Json? // [{checkType, criterion, dueDate, result}]
  effectivenessVerified Boolean @default(false)
  
  status          String    @default("OPEN")  // OPEN | INVESTIGATING | ACTION_PLAN | IMPLEMENTING | VERIFYING | CLOSED | CANCELLED
  
  ownerUserId     String
  reportedDate    DateTime
  closedDate      DateTime?
  
  costImpact      Decimal?  @db.Decimal(20,4)
  
  relatedNcrIds   Int[]
  relatedAuditIds Int[]
}

model SpcChart {
  id              Int       @id @default(autoincrement())
  productId       Int
  parameterId     Int
  type            String    // 'X_BAR_R' | 'X_BAR_S' | 'P' | 'NP' | 'C' | 'U' | 'INDIVIDUAL_MR'
  
  ucl             Decimal?  @db.Decimal(20,8)
  lcl             Decimal?  @db.Decimal(20,8)
  centerLine      Decimal?  @db.Decimal(20,8)
  
  cpk             Decimal?  @db.Decimal(8,4)
  cp              Decimal?  @db.Decimal(8,4)
  
  lastUpdated     DateTime  @default(now())
  
  outOfControlAlerts Int    @default(0)
  
  dataPoints      SpcDataPoint[]
}

model SpcDataPoint {
  id              Int       @id @default(autoincrement())
  chartId         Int
  chart           SpcChart  @relation(fields: [chartId], references: [id])
  
  value           Decimal   @db.Decimal(20,8)
  subgroupNumber  Int
  outOfControl    Boolean   @default(false)
  ruleViolated    String?   // 'BEYOND_LIMITS' | 'NINE_SAME_SIDE' | 'SIX_TRENDING' | etc.
  
  recordedAt      DateTime  @default(now())
}

model SupplierAudit {
  id              Int       @id @default(autoincrement())
  vendorId        Int
  
  auditDate       DateTime
  auditorUserId   String
  
  checklistType   String    // 'ANNUAL' | 'NEW_VENDOR' | 'FOLLOW_UP' | 'INCIDENT'
  
  score           Int       // 0-100
  passed          Boolean
  
  findings        Json      // [{category, severity, description, recommendation}]
  
  status          String    @default("DRAFT")  // DRAFT | UNDER_REVIEW | COMPLETED | FOLLOW_UP_REQUIRED | CLOSED
  
  vendorResponse  String?   @db.Text
  vendorResponseAt DateTime?
  closedAt        DateTime?
}

model QualityEquipment {
  id              Int       @id @default(autoincrement())
  equipmentNumber String    @unique
  name            String
  type            String    // 'GAUGE' | 'SCALE' | 'METER' | 'TESTER' | 'SCANNER'
  manufacturer    String?
  model           String?
  serialNumber    String?
  
  location        String?
  responsibleUserId String?
  
  // Calibration
  calibrationFrequency Int   // months
  lastCalibrationDate DateTime?
  nextCalibrationDate DateTime?
  calibrationStatus String   @default("CALIBRATED")  // CALIBRATED | DUE | OVERDUE | OUT_OF_SERVICE
  calibrationCertUrl String?
  
  active          Boolean   @default(true)
}

model QualityDocument {
  id              Int       @id @default(autoincrement())
  documentNumber  String    @unique
  type            String    // 'SOP' | 'WORK_INSTRUCTION' | 'POLICY' | 'FORM' | 'CHECKLIST'
  title           String
  
  version         Int
  status          String    @default("DRAFT")  // DRAFT | UNDER_REVIEW | APPROVED | OBSOLETE
  
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  
  fileUrl         String
  
  approvedByUserId String?
  trainingRequired Boolean  @default(false)
  
  trainingRecords QualityTrainingRecord[]
}

model QualityTrainingRecord {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  documentId      Int
  document        QualityDocument @relation(fields: [documentId], references: [id])
  
  trainedAt       DateTime
  trainedByUserId String?
  signedOff       Boolean   @default(false)
  acknowledgedAt  DateTime?
}
```

---

## 5. Forms (10)

A: Quality Spec Editor (parameters with limits)
B: Inspection (with sampling + parameter readings)
C: NCR Submit (defect details + initial disposition)
D: NCR Disposition (MRB decision)
E: CAPA Case (with RCA)
F: SPC Data Entry
G: Supplier Audit Checklist
H: Equipment Register + Calibration Schedule
I: Quality Document Editor
J: Training Record (sign-off)

---

## 6. Tables (10)

A: Inspections (filter by type, status, product)
B: NCRs (severity, status, age)
C: CAPAs (type, status, owner)
D: SPC Charts (live)
E: Supplier Quality Scorecards
F: Calibration Status (color-coded)
G: Quality Documents
H: Training Compliance
I: Quality Costs (COPQ)
J: Quality Trends

---

## 7. Buttons (35+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-spec-create | + spec | 🟢 qa eng |
| btn-spec-version | إصدار جديد | 🟦 qa eng |
| btn-inspection-start | بدء فحص | 🟦 qc inspector |
| btn-inspection-record | تسجيل قراءات | 🟢 inspector |
| btn-inspection-decide | قرار | 🟢 qc lead |
| btn-ncr-create | + NCR | 🟢 anyone |
| btn-ncr-mrb | جلسة MRB | 🟦 qa mgr |
| btn-ncr-disposition | اتخاذ قرار | 🟢 mrb |
| btn-ncr-close | إغلاق | 🟢 qa mgr |
| btn-capa-create | + CAPA | 🟢 anyone |
| btn-capa-rca | RCA | 🟦 owner |
| btn-capa-action-add | + إجراء | 🟢 owner |
| btn-capa-verify | تحقق من الفعالية | 🟢 qa mgr |
| btn-capa-close | إغلاق | 🟢 qa mgr |
| btn-spc-add-point | إضافة قراءة | 🟦 inspector |
| btn-spc-recompute-limits | إعادة حساب الحدود | 🟦 qa eng |
| btn-spc-investigate-ooc | تحقيق out-of-control | 🟡 supervisor |
| btn-supplier-audit-schedule | جدولة تدقيق | 🟢 qa mgr |
| btn-supplier-audit-conduct | تنفيذ | 🟦 auditor |
| btn-supplier-audit-close | إغلاق | 🟢 qa mgr |
| btn-equipment-add | + معدة | 🟢 qa |
| btn-equipment-calibrate | تسجيل معايرة | 🟦 qa |
| btn-equipment-out-of-service | إخراج من الخدمة | 🔴 qa |
| btn-doc-create | + وثيقة جودة | 🟢 qa eng |
| btn-doc-approve | موافقة | 🟢 qa mgr |
| btn-doc-obsolete | تقادم | 🟡 qa mgr |
| btn-training-assign | إسناد تدريب | 🟦 hr + qa |
| btn-training-signoff | توقيع | 🟢 employee |
| btn-recall-initiate | بدء استدعاء | 🔴 qa mgr + cfo |
| btn-recall-track | تتبع | ⬜ qa |
| btn-export-quality-report | تقرير الجودة | ⬜ qa |
| btn-cpk-calculate | حساب Cpk | ⬜ qa eng |

---

## 8. Search & Filters

- Inspections: type, status, product, date, inspector, has NCR
- NCRs: severity, status, source, age, has CAPA
- CAPAs: type, status, owner, age, related NCR
- SPC: chart type, product, out-of-control
- Calibration: status (overdue), equipment type

---

## 9. Reports

- Cost of Poor Quality (COPQ)
- First-Pass Yield (FPY)
- Defect Rate Trend
- NCR Aging
- CAPA Effectiveness
- Supplier Quality Scorecards
- Calibration Compliance
- Training Compliance
- SPC Capability Studies
- Recall Status

---

## 10. Dashboards

- KPIs: Defect Rate / Open NCRs / CAPAs in Progress / Calibration Overdue / Supplier Score
- Charts: Defects by category, NCR aging, CAPA cycle time
- Lists: Critical NCRs, Overdue CAPAs, Out-of-cal equipment

---

## 11. Notifications

- NCR critical → mgmt
- CAPA overdue
- SPC out-of-control
- Equipment calibration overdue
- Supplier score dropped
- Training required (new SOP)
- Recall initiated → all affected

---

## 12. Permissions

| Action | Inspector | QC Lead | QA Mgr | QA Eng | Supplier |
|--------|-----------|---------|--------|--------|----------|
| Inspect | ✓ | ✓ | ✓ | ✗ | ✗ |
| Decide pass/fail | ✗ | ✓ | ✓ | ✗ | ✗ |
| Open NCR | ✓ | ✓ | ✓ | ✓ | ✗ |
| Disposition | ✗ | ✗ | ✓ | ✗ | ✗ |
| Open CAPA | ✓ | ✓ | ✓ | ✓ | ✗ |
| Close CAPA | ✗ | ✗ | ✓ | ✗ | ✗ |
| Create spec | ✗ | ✗ | ✗ | ✓ | ✗ |
| Audit supplier | ✗ | ✗ | ✓ | ✓ | self |
| Recall | ✗ | ✗ | ✓ | ✗ | ✗ |

---

## 13. Integrations

- IoT sensors (real-time SPC)
- Lab instruments (LIMS)
- ETQ / MasterControl
- ISO compliance platforms
- SFDA / FDA reporting (recalls)

---

## 14. Shortcuts

- `Ctrl+I` New inspection
- `Ctrl+N` New NCR
- `Ctrl+C` New CAPA

---

## 15. Mobile / Print

- Tablet inspection app
- Mobile camera evidence
- Print: inspection reports, NCRs, certificates

---

## 16. Audit

- Electronic signatures (FDA 21 CFR Part 11)
- Audit trail for spec changes
- Document version history
- Training records immutable

---

## 17. Tests

```typescript
describe('AQL Sampling', () => { /* sample size, accept/reject */ })
describe('SPC', () => { /* control limits, rules detection */ })
describe('CAPA', () => { /* lifecycle, effectiveness verification */ })
describe('Calibration', () => { /* due alerts, out-of-service */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Spec changes mid-inspection | use spec at start |
| Calibration overdue but in use | block + alert |
| Multiple NCRs same root cause | merge to one CAPA |
| CAPA action fails verification | reopen + new actions |
| Recall on already-shipped + delivered | full recall workflow |

---

**نهاية #23** • 8 سيناريوهات • 11 جداول • 10 forms • 10 grids • 32 button • 10 reports
