# النقص #22: Manufacturing (BOM/MRP/WO/WC/Kanban/CAPA) — مواصفات تفصيلية

> **المرجعيات:** SAP PP (Production Planning)、Oracle Manufacturing Cloud、SAP IBP、Plex、Infor CloudSuite Industrial、Rockwell FactoryTalk

---

## 1. البرومنت

```
وسّع Manufacturing لمستوى SAP PP/PP-PI:

موجود: ManufacturingOrder, Recipe (BOM), RecipeIngredient, RecipeOperation, RecipeByProduct, Machine, WorkCenter, ManufacturingCost, ManufacturingWastage, QualityCheck, QualitySpec, BOMVersion, SubcontractingPO

النواقص:
A) Multi-level BOM with phantom assemblies + by-products + co-products
B) Engineering Change Orders (ECO) workflow
C) MRP run with shortage reports + auto-PR generation
D) Production scheduling (finite capacity / infinite capacity)
E) Routing operations with setup time + run time + queue time
F) Work order workflow (Released → InProgress → QualityCheck → Closed)
G) Material backflushing
H) Operation reporting (start/stop/scrap/yield)
I) Standard cost vs actual variance
J) Subcontracting send/receive flow
K) Shop floor mobile app
L) Kanban / Lean / Pull system
M) Digital Twin / IoT integration
N) Blockchain traceability for serialized products
O) Quality during production
P) CAPA closure workflow
Q) MES (Manufacturing Execution System) features

APIs (60+), UI (25 pages), Tests 80+
```

---

## 2. السيناريوهات (10)

### A — MRP Run + Procurement
```
1. Sales forecast + open SOs trigger demand
2. MRP run: explodes BOMs, calculates net requirements
3. Suggests:
   - Production: 500 finished goods (MO)
   - Purchase: raw materials shortage 200 units (PR)
   - Subcontract: 100 components
4. Planner reviews → confirms → generates documents
```

### B — Multi-level BOM Production
```
- Final product: Bicycle
- Level 1: Frame, Wheels, Drivetrain, Accessories
- Level 2 (under Frame): Tubes, Welds, Paint
- Production:
  - WO for Tubes (raw → semi-finished)
  - WO for Frame (combines Tubes + Welds + Paint)
  - WO for Bicycle (combines Frame + Wheels + Drivetrain)
- Each WO has own routing + costing
```

### C — Phantom Assembly
```
- Sub-assembly "Engine Bracket Kit" used in 5 products
- BOM declares as phantom (not stocked separately)
- During MO: explodes to component level transparently
```

### D — Engineering Change Order (ECO)
```
- Quality issue: replace screw type
- Engineer creates ECO:
  - Old BOM: Screw A
  - New BOM: Screw B
  - Effective: 2026-06-01
  - Reason: stronger material
- Approval workflow: Eng → QC → Production → Procurement
- Approved → BOMVersion incremented
- Old MOs continue old BOM; new MOs use new
```

### E — Operation Reporting
```
- Operator at Work Center 1 starts WO-001 op 10
- Scans badge → start time logged
- 2 hours later: pauses for break
- Resumes → completes
- Reports: 100 produced + 5 scrap (defect)
- Auto-creates: stock IN (FG), stock OUT (raw via backflush), QC sample
```

### F — Variance Analysis
```
- WO planned: 100 units @ 50 cost = 5000
- Actual: 95 units @ 52 cost = 4940
- Variances:
  - Quantity: -5 → -250 SAR
  - Price: +2 → +190 SAR
  - Net: -60 SAR
- JE: DR/CR Variance Account
- Investigation: defective batch
```

### G — Subcontracting Cycle
```
- Send raw materials to vendor
- WO with subcontract flag
- Stock OUT → vendor's location (transfer)
- After processing: GRN of finished goods
- Service invoice from vendor
- Final cost = materials + service
```

### H — Kanban Pull System
```
- Visual board: Backlog | In Progress | QC | Ready
- Cards = WOs
- WIP limits per column (e.g., 5 max in In Progress)
- Drag-drop to move stages
- Automatic backflush on QC complete
```

### I — Quality During Production
```
- WO-100: 50 units produced
- Sample QC: 5 inspected
  - 4 pass, 1 fail
  - Failure: cosmetic defect
- Decision: rework all 50 (scratching)
- New WO created for rework
- Scrap recorded if not fixable
```

### J — CAPA (Corrective + Preventive)
```
- Defect identified in Batch X
- CAPA created:
  - Root cause: machine 7 calibration drift
  - Corrective: recall affected batches + recalibrate
  - Preventive: weekly calibration schedule + alert
  - Verify effectiveness: re-test after 30 days
- Closure: signed by quality + production
```

---

## 3. تدفق البيانات

```
[MRP Run]
POST /manufacturing/mrp { horizonDays }
   ↓ aggregate demand: SOs + forecast + safety
   ↓ compute on-hand + on-order
   ↓ explode BOMs (multi-level)
   ↓ identify shortages
   ↓ suggest: PR, MO, transfers
POST /manufacturing/mrp/commit { suggestionsToAccept }
   ↓ create PRs + MOs

[Work Order Lifecycle]
POST /manufacturing/orders → MO (status=PLANNED)
   ↓ release → status=RELEASED
   ↓ stock issued (manual or backflush) → status=IN_PROGRESS
   ↓ operations completed → status=COMPLETED
   ↓ QC → status=QC_PASSED or REWORK
   ↓ FG to stock → status=CLOSED

[ECO]
POST /eco → DRAFT
   ↓ approval workflow
   ↓ on approval → create new BOMVersion + effectivity date
   ↓ old MOs continue, new MOs use new
```

---

## 4. Schema (selected)

```prisma
model Recipe {
  // ... existing
  productId       Int
  versionNumber   Int
  isActive        Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  
  ingredientsScalar Decimal? @db.Decimal(20,4)
  outputQty       Decimal   @db.Decimal(20,4)
  yieldPercent    Decimal?  @db.Decimal(5,2)
  
  ingredients     RecipeIngredient[]
  operations      RecipeOperation[]
  byProducts      RecipeByProduct[]
  coProducts      RecipeCoProduct[]
}

model RecipeIngredient {
  // ... existing
  isPhantom       Boolean   @default(false)
  isOptional      Boolean   @default(false)
  scrapPercent    Decimal?  @db.Decimal(5,2)
  substitutes     Int[]     // alternative product IDs
  issuanceMethod  String    @default("PUSH")  // PUSH | BACKFLUSH | MANUAL
}

model BOMVersion {
  // ... existing
  status          String    @default("DRAFT")  // DRAFT | ACTIVE | OBSOLETE
  ecoId           Int?
  approvedBy      String?
  approvedAt      DateTime?
}

model EngineeringChangeOrder {
  id              Int       @id @default(autoincrement())
  ecoNumber       String    @unique
  productId       Int
  
  changeType      String    // 'BOM_ADD' | 'BOM_REMOVE' | 'BOM_REPLACE' | 'ROUTING_CHANGE' | 'SPEC_CHANGE'
  
  reason          String    @db.Text
  description     String    @db.Text
  
  oldBomVersionId Int?
  newBomVersionId Int?
  
  status          String    @default("DRAFT")  // DRAFT | UNDER_REVIEW | APPROVED | REJECTED | EFFECTIVE
  
  effectiveDate   DateTime?
  
  approvalChain   Json?
  
  createdByUserId String
  createdAt       DateTime  @default(now())
}

model ManufacturingOrder {
  // ... existing
  status          String    @default("PLANNED")
  // PLANNED | RELEASED | IN_PROGRESS | QC | REWORK | COMPLETED | CLOSED | CANCELLED
  
  isPhantom       Boolean   @default(false)
  parentMoId      Int?
  
  isSubcontract   Boolean   @default(false)
  subcontractVendorId Int?
  
  scheduledStartDate DateTime?
  scheduledEndDate DateTime?
  actualStartDate DateTime?
  actualEndDate   DateTime?
  
  qtyProduced     Decimal   @default(0) @db.Decimal(20,4)
  qtyScrapped     Decimal   @default(0) @db.Decimal(20,4)
  qtyReworked     Decimal   @default(0) @db.Decimal(20,4)
  
  totalLaborHours Decimal?  @db.Decimal(20,4)
  totalMachineHours Decimal? @db.Decimal(20,4)
  
  plannedCost     Decimal?  @db.Decimal(20,4)
  actualCost      Decimal?  @db.Decimal(20,4)
  varianceAmount  Decimal?  @db.Decimal(20,4)
  
  operations      MoOperation[]
  materialIssues  MoMaterialIssue[]
  productionLog   MoProductionLog[]
}

model MoOperation {
  id              Int       @id @default(autoincrement())
  moId            Int
  mo              ManufacturingOrder @relation(fields: [moId], references: [id], onDelete: Cascade)
  
  sequenceNumber  Int
  operationCode   String
  workCenterId    Int
  
  setupMinutes    Int?
  runMinutes      Decimal?  @db.Decimal(20,4)
  queueMinutes    Int?
  
  scheduledStart  DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  
  status          String    @default("PENDING")  // PENDING | IN_PROGRESS | COMPLETED | SKIPPED
  
  qtyCompleted    Decimal?  @db.Decimal(20,4)
  qtyScrapped     Decimal?  @db.Decimal(20,4)
  
  operatorUserId  String?
  
  qcCheckId       Int?
}

model MoMaterialIssue {
  id              Int       @id @default(autoincrement())
  moId            Int
  productId       Int
  qtyPlanned      Decimal   @db.Decimal(20,4)
  qtyIssued       Decimal   @default(0) @db.Decimal(20,4)
  qtyReturned     Decimal   @default(0) @db.Decimal(20,4)
  batchId         Int?
  issuedAt        DateTime?
  issuedByUserId  String?
}

model MoProductionLog {
  id              Int       @id @default(autoincrement())
  moId            Int
  operationId     Int?
  
  type            String    // 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'SCRAP' | 'REWORK' | 'NOTE'
  qty             Decimal?  @db.Decimal(20,4)
  notes           String?
  reasonCode      String?
  
  occurredAt      DateTime  @default(now())
  recordedByUserId String
}

model MrpRun {
  id              Int       @id @default(autoincrement())
  runNumber       String    @unique
  horizonDays     Int
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  status          String    @default("RUNNING")
  
  totalDemand     Decimal?  @db.Decimal(20,4)
  totalSupply     Decimal?  @db.Decimal(20,4)
  shortagesCount  Int?
  
  suggestions     MrpSuggestion[]
  triggeredByUserId String
}

model MrpSuggestion {
  id              Int       @id @default(autoincrement())
  mrpRunId        Int
  mrpRun          MrpRun    @relation(fields: [mrpRunId], references: [id])
  
  productId       Int
  type            String    // 'PR' | 'MO' | 'TRANSFER'
  qty             Decimal   @db.Decimal(20,4)
  dueDate         DateTime
  
  accepted        Boolean   @default(false)
  rejectedReason  String?
  documentCreatedId Int?
}

model CapaCase {
  id              Int       @id @default(autoincrement())
  capaNumber      String    @unique
  type            String    // 'CORRECTIVE' | 'PREVENTIVE'
  source          String    // 'CUSTOMER_COMPLAINT' | 'INTERNAL' | 'AUDIT' | 'NCR' | 'SUPPLIER'
  
  description     String    @db.Text
  rootCause       String?   @db.Text
  rootCauseAnalysisMethod String? // '5_WHYS' | 'FISHBONE' | 'PARETO'
  
  correctiveActions Json?
  preventiveActions Json?
  
  effectivenessVerified Boolean @default(false)
  verificationDate DateTime?
  
  status          String    @default("OPEN")  // OPEN | INVESTIGATING | IMPLEMENTING | VERIFYING | CLOSED
  
  ownerUserId     String
  closedAt        DateTime?
  closedByUserId  String?
}

model NcReport {
  id              Int       @id @default(autoincrement())
  ncNumber        String    @unique
  
  source          String    // 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'CUSTOMER_RETURN'
  productId       Int
  batchId         Int?
  qty             Decimal   @db.Decimal(20,4)
  
  defectType      String
  description     String    @db.Text
  severity        String    // 'MINOR' | 'MAJOR' | 'CRITICAL'
  
  disposition     String?   // 'RETURN' | 'REWORK' | 'SCRAP' | 'USE_AS_IS' | 'DOWNGRADE'
  
  capaId          Int?
  
  status          String    @default("OPEN")
  closedAt        DateTime?
}

model KanbanBoard {
  id              Int       @id @default(autoincrement())
  name            String
  workCenterId    Int?
  columns         Json      // [{name, wipLimit, color}]
}

model BlockchainTraceRecord {
  id              Int       @id @default(autoincrement())
  serialNumber    String
  productId       Int
  
  events          Json      // each step (production, QC, ship, customer)
  blockchainHash  String?
  
  recordedAt      DateTime  @default(now())
}
```

---

## 5. Forms (10)

A: BOM Editor (with operations + by-products + phantom)
B: ECO Submit
C: MRP Run Setup
D: Work Order Release
E: Operation Time Recording
F: Material Issue
G: Production Reporting (qty good/scrap/rework)
H: QC during production
I: CAPA Case
J: NCR Disposition

---

## 6. Tables (10 grids)

A: Manufacturing Orders (Kanban + List)
B: BOMs (with version)
C: ECOs (workflow stages)
D: MRP Suggestions
E: Operations Schedule (Gantt)
F: Material Shortages
G: Variance Report
H: Quality Checks during production
I: CAPA Cases
J: Work Center Utilization

---

## 7. Buttons (40+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-bom-create | + BOM | 🟢 engineer |
| btn-bom-version | إصدار جديد | 🟦 engineer |
| btn-bom-activate | تفعيل | 🟢 engineer mgr |
| btn-bom-cost-rollup | حساب التكلفة الكلية | ⬜ cost acct |
| btn-eco-submit | تقديم ECO | 🟦 engineer |
| btn-eco-approve | موافقة | 🟢 approver |
| btn-eco-reject | رفض | 🔴 approver |
| btn-mrp-run | تشغيل MRP | 🟦 planner |
| btn-mrp-commit | اعتماد الاقتراحات | 🟢 planner |
| btn-mo-create | + WO | 🟢 planner |
| btn-mo-release | إصدار | 🟦 planner |
| btn-mo-cancel | إلغاء | 🔴 planner mgr |
| btn-mo-pause | إيقاف مؤقت | 🟡 planner |
| btn-op-start | بدء العملية | 🟢 operator |
| btn-op-pause | إيقاف | 🟡 operator |
| btn-op-resume | استئناف | 🟢 operator |
| btn-op-complete | إنهاء | 🟢 operator |
| btn-material-issue | صرف مواد | 🟢 wh |
| btn-material-return | إرجاع زائد | 🟦 wh |
| btn-backflush | backflush تلقائي | 🟦 system |
| btn-report-production | إبلاغ إنتاج | 🟢 operator |
| btn-report-scrap | إبلاغ هالك | 🔴 operator + reason |
| btn-report-rework | إبلاغ معاد | 🟡 operator |
| btn-qc-during-production | فحص أثناء الإنتاج | 🟦 qc |
| btn-mo-close | إغلاق WO | 🔴 planner mgr |
| btn-variance-investigate | تحقيق التباين | 🟡 cost acct |
| btn-subcontract-send | إرسال للمقاول | 🟦 wh |
| btn-subcontract-receive | استلام من المقاول | 🟢 wh |
| btn-kanban-move | نقل الكرت | 🟦 anyone |
| btn-capa-create | + CAPA | 🟢 qc |
| btn-capa-investigate | تحقيق | 🟦 owner |
| btn-capa-close | إغلاق | 🟢 qc mgr + verify |
| btn-ncr-create | + NCR | 🟢 qc |
| btn-ncr-disposition | قرار | 🟦 qc mgr |
| btn-machine-add | + آلة | 🟢 maintenance |
| btn-work-center-create | + مركز عمل | 🟢 planner mgr |
| btn-routing-create | + توجيه | 🟢 engineer |
| btn-blockchain-trace | تتبع | ⬜ viewer |
| btn-digital-twin-sync | مزامنة | 🟦 IT |
| btn-iot-data-view | بيانات IoT | ⬜ viewer |

---

## 8. Search & Filters

- MOs: status, product, work center, due date, late, has variance
- BOMs: product, version, active, has phantom
- MRP: shortages only, suggested type, due within X
- Operations: status, work center, operator, late
- CAPAs: type, source, severity, status, owner

---

## 9. Reports

- Production Plan vs Actual
- Work Center Utilization
- Operator Productivity
- Scrap / Rework Analysis
- BOM Cost Roll-up
- Variance by WO/Product
- MRP Performance
- Cycle Time Analysis
- Quality Trend (defect rate)
- CAPA Effectiveness
- Subcontracting Costs

---

## 10. Dashboards

- KPIs: Open WOs / On-Time % / OEE / Scrap % / WIP Value
- Charts: Production trend, WC utilization heatmap
- Lists: Late WOs, Shortages, Open CAPAs

---

## 11. Notifications

- WO released to shop floor
- Material shortage during production
- QC failure during production
- Variance > tolerance
- CAPA assigned
- ECO requires approval
- WO late
- Subcontract material delay

---

## 12. Permissions

| Action | Operator | Lead | Planner | Eng | QC | Maint |
|--------|----------|------|---------|-----|----|----|
| Start/stop op | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Report production | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Issue material | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit BOM | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Approve ECO | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| Run MRP | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Release WO | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Close WO | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| QC during production | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Open CAPA | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Close CAPA | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Maintain machine | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 13. Integrations

- IoT sensors (machines telemetry)
- MES systems
- SCADA / PLC
- Digital twin platforms
- AI vision (defect detection)
- Blockchain (Hyperledger / Ethereum)
- Maintenance management (CMMS)

---

## 14. Shortcuts

- `Ctrl+M` New MO
- `Ctrl+B` BOM
- `Ctrl+R` MRP run
- `S` Start op
- `E` End op

---

## 15. Mobile / Print

- Shop floor mobile (operator)
- Foreman tablet (lead)
- Kanban TV display
- Print: pick lists, route sheets, work instructions

---

## 16. Audit

- All operations logged with operator
- ECO chain immutable
- Variance investigations
- CAPA/NCR full trail

---

## 17. Tests

```typescript
describe('BOM Explosion', () => { /* multi-level, phantom, by-products */ })
describe('MRP', () => { /* shortage detection, suggestions */ })
describe('WO Lifecycle', () => { /* state machine */ })
describe('Backflush', () => { /* auto-issue on completion */ })
describe('Variance', () => { /* qty, price, mix */ })
describe('Subcontract', () => { /* materials send/receive */ })
describe('ECO', () => { /* approval, BOM versioning */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Phantom in phantom | flatten correctly |
| Circular BOM | detect + reject |
| Negative scrap | reject |
| WO completes more than planned | allow with reason |
| Operation skipped | flag + variance |
| ECO during open MO | choose: continue or apply |
| Backflush of out-of-stock | partial + alert |
| Subcontractor returns less | claim |

---

**نهاية #22** • 10 سيناريوهات • 12 جداول • 10 forms • 10 grids • 40 button • 11 reports
