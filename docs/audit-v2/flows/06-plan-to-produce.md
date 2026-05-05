# BPF #6: Plan-to-Produce (P2P-Mfg) — End-to-End

> **المرجعيات:** SAP PP/PP-PI、Oracle Manufacturing、Plex MES
> **الموديولات:** Demand Forecast, MRP, Procurement, Inventory, Production, QC, Costing, Inventory FG, GL

---

## 1) الفلو

```
[Demand Forecast (AI)]
   ↓ aggregated
[Master Production Schedule (MPS)]
   ↓ exploded
[MRP Run]
   ↓ identifies shortages
[PR for Materials] OR [Internal MO for sub-assemblies]
   ↓ procurement (covered in #2)
[Materials Available]
   ↓ trigger
[Manufacturing Order Released]
   ↓ shop floor
[Operations Sequence]
[Material Issuance]
[Production Reporting]
[QC during production]
   ↓ pass
[Finished Goods Receipt]
   ↓ to FG warehouse
[Cost Posting]
   ↓ standard vs actual
[Variance Analysis]
   ↓ closed
[WO Closed]
```

**~14 stages، 6 modules**

---

## 2) البرومنت

```
بناء P2P-Mfg orchestration:

موجود: ManufacturingOrder, Recipe (BOM), MrpRun, MrpSuggestion, WorkCenter, Machine, ManufacturingCost, ManufacturingWastage, QualityCheck

النواقص:
A) Demand → Forecast → MPS automation
B) MRP run with calendar (not just on-demand)
C) Capacity planning (finite vs infinite)
D) Operation scheduling (Gantt)
E) Real-time shop floor data collection
F) Variance analysis (price + qty + mix + yield)
G) ECO (Engineering Change Order) workflow
H) Subcontracting orchestration
I) Digital twin / IoT integration

أنشئ:
- src/lib/p2p-mfg-orchestrator.ts
- src/lib/mps-engine.ts (already exists?)
- prisma: ProductionJourney, OperationSchedule
```

---

## 3) السيناريوهات (8)

### A — Standard Production Cycle
```
Day 1: Sales forecast + open SOs aggregated
Day 2: MPS generated for next 4 weeks
Day 2: MRP run → identifies:
   - Buy: 500 raw material X (PR auto-created)
   - Make: 100 finished good Y (MO created)
Day 5: Materials arrive (P2P #2)
Day 6: MO released
   - Operations scheduled at work centers
   - Materials issued
Days 6-10: Production
   - Operators report start/end at each station
   - Backflush materials at completion
   - QC samples per spec
Day 11: QC pass → finished goods to warehouse
Day 12: WO closed
   - Standard cost vs actual cost
   - Variances analyzed
```

### B — Multi-Level BOM
```
Final: Bicycle
- Frame (sub-assembly, makes from tubes)
  - Tubes (raw material)
  - Welding (operation)
  - Paint (operation)
- Wheels (purchased)
- Drivetrain (purchased)

Production:
- WO-Frame: produces Frame from raw tubes
- WO-Bicycle: assembles Frame + Wheels + Drivetrain → Bicycle
Each WO has own routing + QC
```

### C — Engineering Change Order (ECO)
```
Quality issue: replace screw type
Engineer creates ECO:
- Old BOM: Screw A
- New BOM: Screw B
- Effective: 2026-06-01
- Reason: stronger material
Approval: Eng → QC → Production → Procurement
On approval: BOMVersion incremented
Old MOs continue with old BOM
New MOs use new BOM
```

### D — Subcontracting
```
Send raw materials to vendor for processing
- WO with subcontract flag
- Materials transferred to vendor location
- Vendor processes
- Finished goods returned via GRN (#2 P2P)
- Service invoice from vendor
- Cost = materials + service
```

### E — QC Failure During Production
```
WO-100: 50 units produced
QC: 5 sampled
- 4 pass
- 1 fail (cosmetic defect)
Decision: rework all 50
- Rework WO created
- Cost added
- Or: scrap if not fixable
```

### F — Variance Analysis
```
WO Standard:
- Materials: 50 SAR (10 units × 5)
- Labor: 30 SAR (3 hours × 10)
- Overhead: 20 SAR
- Total Std: 100 SAR per unit × 100 units = 10K

WO Actual:
- Materials: 5,200 (price was 5.20 actual, used 1000 units)
- Labor: 3,300 (4 hours actual)
- Overhead: 2,000

Variances:
- Material price: (5.20-5.00) × 1000 = +200 (unfavorable)
- Material usage: (1000 - 1000) × 5 = 0
- Labor efficiency: (4-3) × 100 × 10 = +1000 (unfavorable)
- Total variance: +1300 (over budget)

JE: DR Variance (unfavorable) / CR Inventory or COGS
Investigation: machine 7 broken, took longer
```

### G — Demand Spike (Rush Order)
```
Customer wants 200 units in 5 days (lead time normally 14)
- Override: rush MO
- Expedited materials (priority PO)
- Overtime authorized
- Production prioritized
- Premium cost absorbed (or charged to customer)
```

### H — IoT-based Predictive
```
Machine vibration sensor → anomaly detected
AI predicts: bearing failure in 3 days
Auto-create maintenance WO before failure
Maintenance team scheduled
Avoids unplanned downtime
```

### sad-1 — Material Shortage Mid-WO
```
WO started, but mid-way: ran out of material
- Pause WO
- Urgent PR
- Wait for delivery
- Resume WO
- Capture lost time as variance
```

### sad-2 — Customer Cancels Mid-Production
```
WO 40% complete, customer cancels SO
Options:
1. Continue → finish → put in stock
2. Stop → write-off WIP
3. Rework for another customer
Decision based on demand + economics
```

---

## 4) JEs throughout P2P-Mfg

```
[MRP Run]
   ↓ no JE (planning only)
[MO Released + Materials Issued]
   ↓ JE: DR WIP / CR Raw Material Inventory
[Labor Reported]
   ↓ JE: DR WIP / CR Labor Liability (or accrued)
[Overhead Allocated]
   ↓ JE: DR WIP / CR Overhead Applied
[Subcontract Service Received]
   ↓ JE: DR WIP / CR Subcontract Cost
[Finished Goods Receipt]
   ↓ JE: DR Finished Goods Inventory / CR WIP
[Variance (if any)]
   ↓ JE: DR Variance Account / CR WIP (or COGS)
[Scrap]
   ↓ JE: DR Scrap Loss / CR WIP
[FG Sold (later, in O2D #5)]
   ↓ JE: DR COGS / CR FG Inventory
```

**5-9 JEs per MO**

---

## 5) Schema

```prisma
model ProductionJourney {
  id              Int       @id @default(autoincrement())
  manufacturingOrderId Int   @unique
  
  currentStage    String    // 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'QC' | 'COMPLETED' | 'CLOSED' | 'CANCELLED'
  
  plannedStart    DateTime
  plannedEnd      DateTime
  actualStart     DateTime?
  actualEnd       DateTime?
  
  qtyToProduce    Decimal   @db.Decimal(20,4)
  qtyProduced     Decimal   @default(0) @db.Decimal(20,4)
  qtyScrapped     Decimal   @default(0) @db.Decimal(20,4)
  
  plannedCost     Decimal?  @db.Decimal(20,4)
  actualCost      Decimal?  @db.Decimal(20,4)
  variance        Decimal?  @db.Decimal(20,4)
  
  health          String    @default("ON_TRACK")
}

model OperationSchedule {
  id              Int       @id @default(autoincrement())
  moOperationId   Int
  workCenterId    Int
  
  scheduledStart  DateTime
  scheduledEnd    DateTime
  actualStart     DateTime?
  actualEnd       DateTime?
  
  setupMinutes    Int
  runMinutes      Decimal   @db.Decimal(10,2)
  queueMinutes    Int?
  
  operatorUserId  String?
  
  status          String    // 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED'
}
```

---

## 6) Forms (8)

A: MRP Run Setup
B: MPS Generator
C: ECO Submission
D: WO Release
E: Operation Time Recording (mobile)
F: Production Reporting (qty good/scrap/rework)
G: QC Sample Recording
H: Variance Investigation

---

## 7) Tables

A: Production Schedule (Gantt)
B: WIP per WO
C: Operation Status (per work center)
D: Material Shortages
E: Variance Report
F: QC Status (during production)

---

## 8) Buttons (cross-module)

| ID | الزر | الموديول الذي يفعّله |
|----|------|----------------------|
| btn-p2pmfg-forecast-run | تشغيل التوقع | AI/Demand |
| btn-p2pmfg-mps-generate | + MPS | Production Planning |
| btn-p2pmfg-mrp-run | تشغيل MRP | Production + Procurement + Inventory |
| btn-p2pmfg-mrp-commit | اعتماد الاقتراحات | Procurement + Production |
| btn-p2pmfg-eco-submit | + ECO | Engineering |
| btn-p2pmfg-eco-approve | موافقة | Multi-departments |
| btn-p2pmfg-mo-release | إصدار WO | Production |
| btn-p2pmfg-issue-materials | صرف مواد | Inventory + Production |
| btn-p2pmfg-op-start | بدء عملية | Operator |
| btn-p2pmfg-op-end | إنهاء عملية | Operator |
| btn-p2pmfg-report-production | تسجيل الإنتاج | Operator |
| btn-p2pmfg-qc-during | فحص أثناء الإنتاج | QC |
| btn-p2pmfg-fg-receipt | استلام FG | Inventory |
| btn-p2pmfg-mo-close | إغلاق WO | Production + Costing |
| btn-p2pmfg-variance-analyze | تحليل التباين | Cost Acct |

---

## 9) Reports

- Production Plan vs Actual
- WO Status Dashboard
- WC Utilization
- Operator Productivity
- Scrap Trend
- BOM Cost Roll-up
- Variance Analysis
- Cycle Time
- OEE (Overall Equipment Effectiveness)
- MRP Performance

---

## 10) Notifications

- MRP run complete
- Materials shortage
- WO ready for release
- Operation late
- QC failure during production
- Variance > threshold
- ECO approval needed
- Subcontract delay

---

## 11) Permissions

| Action | Operator | Lead | Planner | Eng | QC | Cost Acct |
|--------|----------|------|---------|-----|----|----|
| Run MRP | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Release WO | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Issue materials | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Report production | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| QC during production | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Approve ECO | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| Close WO | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Investigate variance | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 12) Integrations

- IoT sensors (machines)
- MES platforms
- SCADA / PLC
- Maintenance (CMMS)
- Quality Mgmt
- Procurement (auto-PR from MRP)
- Inventory (material + FG flow)
- Cost Acct (variance)

---

## 13) Tests

```typescript
describe('P2P-Mfg', () => {
  test('MPS generation from forecast + SOs')
  test('MRP identifies all shortages')
  test('Multi-level BOM explosion')
  test('ECO updates BOM correctly')
  test('Subcontract material flow')
  test('Operation reporting + backflush')
  test('Variance calc (qty + price + mix)')
  test('FG receipt creates JE')
  test('Cancel mid-production write-off')
})
```

---

## 14) Edge Cases

| Case | Behavior |
|------|----------|
| Material substitution allowed | use alt + variance |
| Operation skipped | flag + variance |
| Yield less than expected | scrap analysis |
| Customer cancels mid-WO | rework or store |
| Rush order | bypass normal scheduling |
| Machine breakdown | reschedule + maintenance |

---

## 15) إحصائيات BPF #6

- 6 موديولات • 14 stages • 5-9 JEs per MO
- 2 جداول orchestration • 8 forms • 6 grids • 15 buttons cross-module

---

**انتهى BPF #6 / 8.**
