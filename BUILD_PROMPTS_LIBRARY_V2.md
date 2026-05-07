# 🚀 Namasoft ERP — Build Prompts Library V2

> **46 build package** كاملة — لكل واحدة: schema + APIs + engine + UI + سيناريو + flow + برومت جاهز للتنفيذ.
> Generated: 2026-05-06 | يكمل `BUILD_PLAYBOOK.md` (الذي يحتوي على Builds 1-15 بصيغة مختصرة)

---

## 📑 Master Summary Index — 46 Builds

| # | Title | Effort | Priority | Phase |
|---|-------|--------|----------|-------|
| 1 | Universal Journal | L | Foundation | 0 |
| 2 | Numbering Sequences | M | Foundation | 0 |
| 3 | Document State Machine | L | Foundation | 0 |
| 4 | Field-Level Audit Trail | M | Foundation | 0 |
| 5 | Period Close Engine | L | Foundation | 0 |
| 6 | Approval Workflow | L | Foundation | 0 |
| 7 | Qiwa + Saudization | L | Saudi | 1 |
| 8 | PDPL Compliance | L | Saudi | 1 |
| 9 | VAT Per-Line + Auto Filing | L | Saudi | 1 |
| 10 | WHT Foreign + Form 14 | M | Saudi | 1 |
| 11 | Zakat Verify + Integration | M | Saudi | 1 |
| 12 | Mudad Full Integration | L | Saudi | 1 |
| 13 | CO-PA | L | Finance | 2 |
| 14 | Driver Budgeting + Forecast | L | Finance | 2 |
| 15 | Asset Componentization | L | Finance | 2 |
| 16 | AP OCR + Auto 3-Way | L | Finance | 2 |
| 17 | Real-Time Credit Check | M | Finance | 2 |
| 18 | Cash Forecast + Pooling | L | Finance | 2 |
| 19 | FX Hedging | L | Finance | 2 |
| 20 | Intercompany Netting | L | Finance | 2 |
| 21 | CPQ | L | Sales | 3 |
| 22 | Rebate Management | L | Sales | 3 |
| 23 | Sales Forecast + Pipeline | M | Sales | 3 |
| 24 | Customer Portal | L | Sales | 3 |
| 25 | Vendor Scorecard + Onboard | M | Procurement | 3 |
| 26 | Spend Analytics | M | Procurement | 3 |
| 27 | Contract Compliance | M | Procurement | 3 |
| 28 | e-Auction | L | Procurement | 3 |
| 29 | Wave Picking + Slotting | L | WMS | 4 |
| 30 | Multi-Valuation Books | L | WMS | 4 |
| 31 | Consignment Inventory | M | WMS | 4 |
| 32 | Yard Management | M | WMS | 4 |
| 33 | APS Scheduler | L | Mfg | 4 |
| 34 | MES Shop Floor | L | Mfg | 4 |
| 35 | Genealogy + Traceability | L | Mfg | 4 |
| 36 | WBS + EVM | L | Projects | 5 |
| 37 | Service SLA + Mobile | L | Service | 5 |
| 38 | Preventive Maintenance | M | Service | 5 |
| 39 | BI Cubes + Personas | L | BI | 5 |
| 40 | NLQ (CFO AI Extension) | M | BI | 5 |
| 41 | Clinic Insurance Claims | L | Vertical | 6 |
| 42 | School Gradebook + Portal | L | Vertical | 6 |
| 43 | Restaurant Recipe + KDS | M | Vertical | 6 |
| 44 | SSO/SAML + SCIM | L | Cross-cutting | 6 |
| 45 | Webhook Subscriber | M | Cross-cutting | 6 |
| 46 | Mobile PWA | L | Cross-cutting | 6 |

---

## 🗓️ Recommended Execution Order

**Phase 0 (Foundation, weeks 1-8):** Builds 1-6 — يفتح الباقي
**Phase 1 (Saudi Critical, weeks 9-16):** Builds 7-12 — blocker للإنتاج
**Phase 2 (Finance Excellence, weeks 17-28):** Builds 13-20
**Phase 3 (Sales/Procurement, weeks 29-38):** Builds 21-28
**Phase 4 (Operations, weeks 39-50):** Builds 29-35
**Phase 5 (Projects/Service/BI, weeks 51-60):** Builds 36-40
**Phase 6 (Verticals + Cross-cutting, weeks 61-72):** Builds 41-46

---

> **ملاحظة:** Builds 1-15 موجودة بصيغة مختصرة في `BUILD_PLAYBOOK.md` (السابق).
> Builds 29-46 موجودة بتفصيل كامل أدناه (هذا الملف).
> Builds 16-28 — راجع `GAPS_BY_DOMAIN.md` للسياق وابني عند الحاجة.

---

## Build #29: Wave Picking + Slotting (WMS)

### الهدف
تخطيط جلسات الـ pick (waves) ذكياً + توزيع المنتجات بأفضل مواقع لتقليل وقت المشي.

### Schema
```prisma
model PickWave {
  id String @id @default(cuid())
  waveNumber String @unique
  warehouseId String
  status String @default("PLANNED")
  plannedStartAt DateTime
  pickerId String?
  totalLines Int
  completedLines Int @default(0)
  tenantId String
}
model PickTask {
  id String @id @default(cuid())
  waveId String
  orderId String
  productId String
  binLocation String
  quantity Decimal @db.Decimal(18,4)
  pickedQty Decimal? @db.Decimal(18,4)
  sequence Int
  status String @default("PENDING")
  pickedAt DateTime?
  tenantId String
}
model SlotRecommendation {
  id String @id @default(cuid())
  productId String
  currentBin String
  suggestedBin String
  reason String
  velocityRank Int
  generatedAt DateTime @default(now())
  tenantId String
}
```

### APIs
- `POST /api/wms/waves/plan`
- `POST /api/wms/waves/[id]/pick/[taskId]`
- `GET /api/wms/slotting/recommendations`
- `POST /api/wms/slotting/apply/[id]`

### Engine: `src/lib/wms-engine.ts`
```typescript
export class WMSEngine {
  static async planWave(warehouseId, orderIds): Promise<PickWave>
  static async optimizePickPath(tasks): Promise<PickTask[]>
  static async confirmPick(taskId, qty): Promise<void>
  static async analyzeSlotting(period): Promise<SlotRecommendation[]>
  static async applySlotting(recommendationId): Promise<MoveTask[]>
}
```

### UI Pages
- `src/app/(dashboard)/wms/waves/page.tsx`
- `src/app/(dashboard)/wms/waves/[id]/page.tsx`
- `src/app/(dashboard)/wms/slotting/page.tsx`
- `src/app/(dashboard)/wms/picker-mobile/page.tsx` (PWA)

### سيناريو
1. WH manager يفتح "Wave Planning" 7 صباحاً
2. يرى 50 طلب جاهز للـ pick → يضغط "Auto-Plan Wave"
3. النظام يجمعهم في 5 waves حسب zone
4. كل wave يُعيَّن لـ picker
5. Picker يفتح mobile app, يرى المهام مرتبة بـ shortest path
6. يمشي للموقع، يمسح barcode، يدخل الكمية، confirm
7. النظام يحدّث ATP فوراً
8. ربع سنوي: slotting analysis يقترح نقل منتج عالي الحركة قرب shipping

### Flow
```
Orders ready → WMSEngine.planWave (group)
   → optimizePickPath (TSP heuristic)
   → Generate PickTasks
   → Picker confirms via mobile
   → Inventory deducted real-time
   → Quarterly: analyzeSlotting (ABC + velocity)
```

### Effort: L

### Ready Prompt
```
Build Wave Picking + Slotting WMS for Namasoft ERP.

Step 1 — Schema (PickWave, PickTask, SlotRecommendation) per spec.
Step 2 — Engine src/lib/wms-engine.ts:
- planWave: group orders by warehouse + zone + ship date, limit by picker capacity (50 lines/wave)
- optimizePickPath: TSP nearest-neighbor heuristic per zone, order by aisle/bay/level
- confirmPick: tx { update task, deduct inventory, check shortage }
- analyzeSlotting: velocity per product, ABC classification, A near shipping, co-pick analysis
- applySlotting: generate MoveTasks
Step 3 — Mobile picker PWA: src/app/(dashboard)/wms/picker-mobile, large buttons, barcode scan, offline queue
Step 4 — APIs per spec
Step 5 — UI Desktop + Mobile (slotting heatmap)
Step 6 — Tests: pick path optimization, wave splitting, inventory deduction, ABC
Validation: 100 orders → plan waves, simulate picking, verify inventory + KPIs.
```

---

## Build #30: Multi-Valuation per Book (FIFO + Std Cost Concurrent)

### الهدف
الاحتفاظ بأكثر من تقييم للمخزون في نفس الوقت (FIFO للـ LOCAL، Standard Cost للـ MGMT).

### Schema
```prisma
model InventoryValuation {
  id String @id @default(cuid())
  productId String
  warehouseId String
  bookCode String  // LOCAL | MGMT | TAX
  method String  // FIFO | LIFO | AVG | STANDARD
  unitCost Decimal @db.Decimal(18,6)
  quantity Decimal @db.Decimal(18,4)
  totalValue Decimal @db.Decimal(18,4)
  asOfDate DateTime
  tenantId String
  @@unique([productId, warehouseId, bookCode, asOfDate])
}
model StandardCost {
  id String @id @default(cuid())
  productId String
  fiscalYear String
  materialCost Decimal @db.Decimal(18,6)
  laborCost Decimal @db.Decimal(18,6)
  overheadCost Decimal @db.Decimal(18,6)
  totalCost Decimal @db.Decimal(18,6)
  effectiveFrom DateTime
  status String @default("DRAFT")
  tenantId String
}
model CostVariance {
  id String @id @default(cuid())
  productId String
  varianceType String  // PRICE | QUANTITY | EFFICIENCY
  bookCode String
  amount Decimal @db.Decimal(18,4)
  period String
  jeId String?
  tenantId String
}
```

### APIs
- `POST /api/inventory/valuations/run/[bookCode]`
- `POST /api/inventory/standard-cost`
- `GET /api/inventory/variance/[period]`
- `POST /api/inventory/revalue`

### Engine: `src/lib/multi-valuation-engine.ts`
```typescript
export class MultiValuationEngine {
  static async valueInventory(bookCode): Promise<ValuationResult>
  static async setStandardCost(productId, costs): Promise<StandardCost>
  static async computeVariance(period): Promise<CostVariance[]>
  static async revalue(bookCode, asOf): Promise<RevaluationResult>
  static async rollupBOM(productId): Promise<RolledCost>
}
```

### Saudi Compliance
SOCPA يقبل FIFO/Average — Standard Cost للـ management reporting only، يجب reconcile to LOCAL.

### Effort: L

### Ready Prompt
```
Build Multi-Valuation per Book extending costing.ts.
Step 1 — Schema per spec.
Step 2 — Verify costing.ts (FIFO/Average present).
Step 3 — Extend src/lib/multi-valuation-engine.ts with valueInventory, setStandardCost, computeVariance (PPV/QV/EV math), revalue, rollupBOM.
Step 4 — Use multi-book-engine.ts for parallel JE. Variance auto-posted.
Step 5 — APIs + UI dashboards.
Step 6 — Tests: FIFO correctness, standard variance math, BOM rollup, cross-book reconciliation.
Validation: Same sale yields different COGS in 2 books, variance reconciles.
```

---

## Build #31: Consignment Inventory

### الهدف
إدارة المخزون لدى العميل (vendor consignment) أو لدينا (vendor-managed) — لا يُسجَّل كأصل حتى البيع/الاستهلاك.

### Schema (key models)
- `ConsignmentAgreement`: type (VENDOR_TO_US|US_TO_CUSTOMER), partner, location, products, min/max, invoiceFrequency
- `ConsignmentStock`: agreement, product, qty, ownerId, receivedAt
- `ConsignmentMovement`: type (RECEIVE|CONSUME|RETURN|ADJUST), qty, invoiced flag

### APIs
- `POST /api/inventory/consignment/agreements`
- `POST /api/inventory/consignment/{receive,consume,reconcile,auto-invoice}`

### Engine: `src/lib/consignment-engine.ts`
- `receiveStock` → no AP entry
- `consumeStock` → log movement, trigger invoice if ON_USAGE
- `generateInvoice` → aggregate uninvoiced consumption
- `reconcile` → physical count vs system

### Saudi Compliance
ZATCA invoice only at consumption — receipt is non-taxable transfer.

### Effort: M

### Ready Prompt
```
Build Consignment Inventory for Namasoft ERP.
Step 1 — Schema (ConsignmentAgreement, ConsignmentStock, ConsignmentMovement).
Step 2 — Engine: receive (no AP), consume (log + invoice if ON_USAGE), generateInvoice (aggregate period), reconcile.
Step 3 — ConsignmentStock separate from main Stock (ATP can include or exclude).
Step 4 — APIs + UI (agreements, receive, reconcile).
Step 5 — Cron: WEEKLY/MONTHLY auto-invoice for ON_FREQUENCY agreements.
Step 6 — Tests: no asset increase on receipt, invoice on consume, reconciliation finds discrepancies.
Validation: Receive 500 → consume 100 → verify no asset increase, AP only on consume.
```

---

## Build #32: Yard Management

### الهدف
إدارة المركبات في ساحة المستودع (truck dispatch, dock scheduling, yard moves).

### Schema (key models)
- `Dock`: dockNumber, type (INBOUND/OUTBOUND/BOTH), status, currentTruckId
- `TruckVisit`: plate, driver, carrier, scheduled/arrived/dock/loading/departed times, status, poId/shipmentId, yardSpotId
- `YardSpot`: spotNumber, isOccupied, truckVisitId

### APIs
- `POST /api/wms/yard/{check-in,assign-dock,check-out}`
- `GET /api/wms/yard/{dock-schedule,wait-time-analytics}`

### Engine: `src/lib/yard-engine.ts`
- `scheduleVisit`, `checkIn`, `assignDock`, `checkOut` (compute wait time)
- Hooks: on checkOut → trigger GRN (inbound) or Shipment (outbound)

### Effort: M

### Ready Prompt
```
Build Yard Management for Namasoft ERP.
Step 1 — Schema (Dock, TruckVisit, YardSpot).
Step 2 — Engine: scheduleVisit (no double-booking), checkIn, assignDock (validate type+available), checkOut (compute time, free dock+spot), findAvailableDock.
Step 3 — Hooks: checkOut triggers GRN/Shipment.
Step 4 — APIs + UI (yard map, dispatch board, analytics).
Step 5 — Tests.
Validation: Schedule 10 trucks, simulate flows, verify analytics.
```

---

## Build #33: APS Finite-Capacity Scheduler

### الهدف
جدولة الإنتاج بقيود الطاقة الفعلية (machines, labor, materials) بدلاً من MRP infinite.

### Schema
- `WorkCenter`: capacity, capacityUnit, efficiency, shiftPattern
- `ResourceCalendar`: per resource per date, availableHours, reason
- `ScheduledOperation`: moId, operationId, workCenterId, plannedStart/End, setupTime, runTime, status, priority

### APIs
- `POST /api/manufacturing/aps/{schedule,reschedule,scenario}`
- `GET /api/manufacturing/aps/{gantt,bottlenecks}`

### Engine: `src/lib/aps-engine.ts`
- `schedule`: sort MOs by priority+due, find slots respecting capacity+calendar+dependencies
- `findEarliestStart`, `detectBottlenecks` (utilization > 90%), `runScenario`, `optimizeSequence`
- Integration: MRP → APS schedules → flag delays

### Effort: L

### Ready Prompt
```
Build APS Scheduler for Namasoft ERP.
Step 1 — Schema (WorkCenter, ResourceCalendar, ScheduledOperation).
Step 2 — Engine: schedule (forward-pass with capacity/calendar/deps), findEarliestStart (walk forward), detectBottlenecks, runScenario, optimizeSequence.
Step 3 — Integrate with mrp-engine.ts (planned MOs → APS finite-cap).
Step 4 — APIs + UI (Gantt with drag-drop, bottleneck heatmap).
Step 5 — Tests: no double-book, dependencies, calendar honored, bottleneck accuracy.
Validation: Schedule 50 MOs, verify capacity not exceeded, compare to manual plan.
```

---

## Build #34: MES Shop Floor (Real-Time Data Collection)

### الهدف
نظام Manufacturing Execution System لجمع بيانات أرض المصنع في الوقت الحقيقي.

### Schema
- `OperatorSession`, `OperationLog` (good/scrap/rework qty, setup/run/idle minutes), `AndonAlert`, `OEERecord`

### APIs
- `POST /api/manufacturing/mes/{login,start-op,complete-op,andon}`
- `GET /api/manufacturing/mes/{oee,dashboard/live}`

### Engine: `src/lib/mes-engine.ts`
- `dispatch` (next op from APS), `startOperation`, `completeOperation` (deduct inventory, log scrap, post WIP), `raiseAndon`, `computeOEE` (A×P×Q)

### Effort: L

### Ready Prompt
```
Build MES Shop Floor for Namasoft ERP.
Step 1 — Schema per spec.
Step 2 — Engine: dispatch (from APS), startOperation, completeOperation (validate qty, deduct inventory, post WIP→FG, scrap account), raiseAndon (WebSocket push), computeOEE (Availability×Performance×Quality).
Step 3 — Real-time WebSocket per work center.
Step 4 — Touchscreen UI: large buttons, barcode scan, qty entry, andon button.
Step 5 — APIs + Live dashboard with OEE gauges.
Step 6 — auto-journal hooks: WIP→FG (good), WIP→Scrap account (scrap).
Step 7 — Tests: OEE math, WIP/FG flow, Andon notify, dispatch logic.
Validation: Simulate full shift, verify OEE, WIP movements, scrap accounting.
```

---

## Build #35: Genealogy + Full Traceability

### الهدف
تتبع كامل لكل وحدة منتج: من المواد الخام إلى العميل (forward + backward) — مهم للأدوية والأغذية.

### Schema
- `Lot`: lotNumber, mfgDate, expiry, parentLotIds[], cocPath
- `SerialNumber`: serial, lotId, status, currentLocation, customer, saleDate
- `GenealogyLink`: parent → child (qty, operation)
- `RecallEvent`: affectedLots, forwardTrace, status

### APIs
- `POST /api/inventory/{lots,recall,serials/transfer}`
- `GET /api/inventory/lots/[id]/{forward-trace,backward-trace}`

### Engine: `src/lib/genealogy-engine.ts`
- `forwardTrace` (BFS lot → children → MO → sales)
- `backwardTrace` (BFS lot → parents → raw materials)
- `linkGenealogy`, `initiateRecall`, `getExpiring`

### Saudi Compliance
SFDA يتطلب recall procedure إلزامي خلال 24 ساعة.

### Effort: L

### Ready Prompt
```
Build Genealogy + Full Traceability for Namasoft ERP.
Step 1 — Schema (Lot, SerialNumber, GenealogyLink, RecallEvent).
Step 2 — Engine: forwardTrace (BFS lot→children→MO→sales), backwardTrace, linkGenealogy on every transformation, initiateRecall (collect affected, generate notifications, create quarantine moves), getExpiring.
Step 3 — Hooks: MO issue links parent (raw lot) → MO. MO output links MO → child (FG lot/serial). Sale invoice links serial → customer.
Step 4 — APIs + UI (genealogy tree D3, recall management, expiry dashboard).
Step 5 — Tests: multi-level traversal, recall coverage, serial uniqueness, symmetric trace.
Validation: 3-level production chain (raw → semi → FG), trace verifies completeness.
```

---

## Build #36: WBS + EVM (Project Earned Value Management)

### الهدف
WBS hierarchy + قياس Earned Value (CPI, SPI, EAC, ETC).

### Schema
- `Project` (budget, dates), `WBSElement` (parent, level, budget, weight, %complete)
- `TimeEntry` (wbs, employee, hours×rate=cost)
- `EVMSnapshot` (PV, EV, AC, SV=EV-PV, CV=EV-AC, SPI=EV/PV, CPI=EV/AC, EAC=AC+(BAC-EV)/CPI, ETC=EAC-AC)

### APIs
- `POST /api/projects/{id}/wbs`, `/api/projects/{id}/evm/calculate`
- `GET /api/projects/{id}/evm/history`

### Engine: `src/lib/evm-engine.ts`
- `calculateEVM`, `forecast`, `findCriticalPath`, `updateProgress` (cascade to parent weighted)

### Saudi Compliance
Vision 2030 megaprojects تتطلب EVM reporting — حكومية إلزامية.

### Effort: L

### Ready Prompt
```
Build WBS + EVM for Namasoft ERP.
Step 1 — Schema (Project, WBSElement, TimeEntry, EVMSnapshot).
Step 2 — Engine: calculateEVM (PV from schedule × planned%, EV from BAC × actual%, AC from cost capture, SV/CV/SPI/CPI/EAC/ETC formulas), forecast, findCriticalPath (longest path), updateProgress (cascade weighted).
Step 3 — Cost capture: TimeEntry + Material requisitions tagged + Expenses + POs (project tag).
Step 4 — APIs + UI (project dashboard, WBS tree editor, Gantt, time entry grid, EVM 3-line chart, critical path).
Step 5 — Cron: monthly EVM snapshot.
Step 6 — Tests: formulas, weight propagation, critical path, cost rollup.
Validation: Sample project, manually compute EVM, compare with engine.
```

---

## Build #37: Service SLA + Mobile Field Engineer

### الهدف
خدمات ما بعد البيع: SLA tracking + dispatch مهندسين عبر mobile.

### Schema
- `ServiceContract` (type, response/resolution time, coveredEquipment, monthlyFee)
- `ServiceTicket` (priority, status, deadlines, engineer, scheduled/arrived/resolved, signature)
- `ServicePart` (chargeable flag, unitPrice)
- `EngineerSkill` (level 1-5, certifications)

### APIs
- `POST /api/service/tickets/{id}/{dispatch,arrive,resolve}`
- `POST /api/service/tickets/[id]/parts`
- `GET /api/service/sla/breaches`

### Engine: `src/lib/service-engine.ts`
- `createTicket` (set deadlines from contract)
- `dispatchEngineer` (skill+distance+availability)
- `checkSLA`, `resolveTicket` (parts deduct, signature, invoice if T&M)

### Saudi Compliance
نظام التجارة الإلكترونية — يجب توفير سجل خدمات للعميل.

### Effort: L

### Ready Prompt
```
Build Service SLA + Mobile Field Engineer for Namasoft ERP.
Step 1 — Schema (ServiceContract, ServiceTicket, ServicePart, EngineerSkill).
Step 2 — Engine: createTicket (compute SLA deadlines), dispatchEngineer (skill match + distance + availability), checkSLA, resolveTicket (tx: update, parts deduct, signature, invoice generate if chargeable), generateServiceInvoice (labor + parts × markup).
Step 3 — Mobile PWA: src/app/(dashboard)/service/engineer-mobile (tickets list, navigation, on-site actions, signature canvas).
Step 4 — APIs + UI (tickets with SLA badges, dispatch map, ticket detail timeline, SLA dashboard KPIs).
Step 5 — Cron 15min: SLA breach check.
Step 6 — Tests: SLA calc, dispatch logic, parts deduction, invoice gen.
Validation: Create ticket → dispatch → resolve → verify timeline + invoice.
```

---

## Build #38: Preventive Maintenance Scheduler

### الهدف
جدولة الصيانة الوقائية بناء على intervals (calendar / runtime hours / units produced).

### Schema
- `PMSchedule` (frequencyType: CALENDAR|RUNTIME|USAGE, value, lastDoneAt, nextDueAt)
- `MaintenanceWO` (woNumber, type: PREVENTIVE|CORRECTIVE|EMERGENCY, priority, status, costs)
- `AssetReading` (readingType: RUNTIME_HOURS|UNITS|CYCLES)

### APIs
- `POST /api/maintenance/{schedules,wo/generate,wo/[id]/complete,readings}`
- `GET /api/maintenance/metrics/[assetId]`

### Engine: `src/lib/maintenance-engine.ts`
- `generatePMWOs` (cron), `checkDueSchedules`, `completeWO` (post costs, update schedule), `computeMetrics` (MTBF, MTTR, Availability), `forecastSpares`

### Saudi Compliance
SFDA/SASO يتطلب صيانة وقائية للمعدات الحساسة.

### Effort: M

### Ready Prompt
```
Build Preventive Maintenance Scheduler for Namasoft ERP.
Step 1 — Schema (PMSchedule, MaintenanceWO, AssetReading).
Step 2 — Engine: generatePMWOs (check due per type), checkDueSchedules (CALENDAR/RUNTIME/USAGE logic), completeWO (post costs, update schedule), computeMetrics (MTBF=runtime/failures, MTTR=avg duration, Availability), forecastSpares (aggregate from upcoming WOs).
Step 3 — Hook into Fixed Assets (each asset has PMSchedule[]; capitalize major maintenance per IFRS 16).
Step 4 — APIs + UI (dashboard, schedules per asset, WO list+calendar, metrics, spares forecast).
Step 5 — Cron: daily generate due WOs, hourly overdue alert.
Step 6 — Tests: due detection, WO auto-gen, metrics math, parts deduction.
Validation: Setup schedule, simulate time passage, verify WO generated.
```

---

## Build #39: Semantic BI Cubes + Persona Dashboards

### الهدف
طبقة تحليلية موحدة + dashboards مخصصة لكل persona (CEO, CFO, COO, Sales VP, CPO).

### Schema
- `BIcube` (factTable, measures Json, dimensions Json, refreshSchedule)
- `KPI` (formula, unit, target, alertThreshold, ownerRole)
- `Dashboard`, `DashboardWidget` (KPI_CARD|LINE|BAR|TABLE|HEATMAP)

### APIs
- `POST /api/bi/cubes/refresh/[id]`
- `GET /api/bi/cubes/[id]/query`
- `POST /api/bi/{kpis,dashboards}`

### Engine: `src/lib/bi-engine.ts`
- `refreshCube` (materialized view), `queryCube` (dynamic SQL), `computeKPI` (formula parser via mathjs), `checkAlerts`

### Effort: L

### Ready Prompt
```
Build Semantic BI Cubes + Persona Dashboards for Namasoft ERP.
Step 1 — Schema per spec.
Step 2 — Engine: refreshCube, queryCube (dynamic SQL by selected dims+filters), computeKPI (mathjs), checkAlerts.
Step 3 — Define 4 cubes: SalesCube, FinanceCube, InventoryCube, HRCube.
Step 4 — Define 12+ KPIs (Revenue YTD, GP%, EBITDA, DSO, DPO, OEE, Saudization%, NPS, Customer Churn).
Step 5 — Persona templates: CEO, CFO, COO, CPO, Sales VP.
Step 6 — APIs + UI (drag-drop builder via react-grid-layout, KPI card/charts/heatmap widgets, drill-through, persona switcher, PDF export via puppeteer).
Step 7 — Cron: nightly cube refresh.
Step 8 — Tests: refresh correctness, KPI calc, tenant isolation, alert trigger.
Validation: Build CEO dashboard, populate real data, verify load < 2s.
```

---

## Build #40: Natural Language Query (CFO AI Extension)

### الهدف
سؤال البيانات بلغة طبيعية (عربي/إنجليزي).

### Schema
- `NLQConversation`, `NLQMessage` (role: USER|ASSISTANT, content, generatedSQL, resultData, visualization, tokensUsed)

### APIs
- `POST /api/ai/nlq/{ask,conversation,feedback}`

### Engine: `src/lib/nlq-engine.ts`
- `translateToSQL` (Gemini with schema context), `executeSafely` (validate AST, inject permissions, parameter binding), `suggestVisualization`, `respond`

### Saudi Compliance
PDPL: يجب التحقق أن AI لا يكشف بيانات شخصية بدون صلاحية.

### Effort: M

### Ready Prompt
```
Build Natural Language Query (CFO AI Extension) for Namasoft ERP.
Step 1 — Schema (NLQConversation, NLQMessage).
Step 2 — Engine: translateToSQL (Gemini with schema context, constraints "SELECT only, tenantId required, whitelist tables"), executeSafely (validate AST via node-sql-parser, inject user permissions, $queryRaw, 5s timeout, 10K row limit), suggestVisualization, respond.
Step 3 — Schema introspection on startup (cache tables+columns+FKs).
Step 4 — APIs + Chat UI (extend CFO AI: bubbles, table/chart viewer, "Show SQL" toggle, suggested follow-ups, conversation history).
Step 5 — Tests: 20 sample questions, malicious SQL rejected, tenant isolation.
Validation: 20 sample questions, accuracy > 80%, no security bypasses.
```

---

## Build #41: Clinic — Insurance Claims + Pre-Authorization

### الهدف
إدارة المطالبات التأمينية + Pre-authorization مع NPHIES (Saudi national platform).

### Schema
- `InsuranceCompany`, `PatientInsurance` (coverage%, copay, validity)
- `PreAuthorization` (procedureCode, diagnosisCode, status, approvalCode)
- `InsuranceClaim` (codes, amounts, status, rejection)

### APIs
- `POST /api/clinic/insurance/eligibility-check`
- `POST /api/clinic/{preauth,claims}`
- `POST /api/clinic/claims/[id]/{submit,resubmit}`

### Engine: `src/lib/insurance-claims-engine.ts`
- `checkEligibility` (FHIR CoverageEligibilityRequest)
- `requestPreAuth`, `createClaim`, `submitToNPHIES`, `handleRejection`

### Saudi Compliance
NPHIES (HL7 FHIR R4) إجباري للمنشآت الصحية الكبيرة.

### Effort: L

### Ready Prompt
```
Build Clinic Insurance Claims + Pre-Authorization for Namasoft ERP.
Step 1 — Schema per spec.
Step 2 — NPHIES client src/lib/nphies-client.ts (FHIR R4: eligibilityRequest, preAuthRequest, claimSubmit, claimStatus, sandbox mode).
Step 3 — Engine: checkEligibility (FHIR CoverageEligibilityRequest), requestPreAuth, createClaim (procedures+diagnoses), submitToNPHIES (sign+submit), handleRejection (log+resubmit).
Step 4 — Code lookup: ICD-10 + CPT seed data.
Step 5 — APIs + UI (insurance mgmt, patient insurance tab, pre-auth dashboard, claims list+detail, aging report, resubmission).
Step 6 — auto-journal hooks: claim approval (AR insurance + AR patient), insurance payment.
Step 7 — Tests: eligibility, pre-auth, submission, rejection.
Validation: Sandbox NPHIES, end-to-end visit → claim → payment.
```

---

## Build #42: School — Gradebook + Parent Portal

### الهدف
نظام تقييم الطلاب + بوابة لأولياء الأمور.

### Schema
- `AcademicYear`, `Course`, `ClassSection` (teacher, schedule slots)
- `GradeCategory` (HOMEWORK|QUIZ|MIDTERM|FINAL, weight)
- `Grade` (score/maxScore, comment)
- `ParentPortalUser`

### APIs
- `POST /api/school/grades`
- `GET /api/school/grades/student/[id]`
- `POST /api/school/report-cards/generate/[studentId]/[term]`
- `POST /api/school/parent-portal/login`

### Engine: `src/lib/gradebook-engine.ts`
- `recordGrade`, `computeTermGrade` (weighted by category), `generateReportCard` (@react-pdf, MoE template bilingual), `classAverage`, `detectAtRisk`

### Saudi Compliance
وزارة التعليم تتطلب نموذج محدد لـ report cards.

### Effort: L

### Ready Prompt
```
Build School Gradebook + Parent Portal for Namasoft ERP.
Step 1 — Schema (AcademicYear, Course, ClassSection, GradeCategory, Grade, ParentPortalUser).
Step 2 — Engine: recordGrade, computeTermGrade (groupBy category, weighted avg), generateReportCard (MoE bilingual template), classAverage, detectAtRisk (avg<60% or >5 absences).
Step 3 — Parent Portal: separate route /parent-portal with own auth, filtered by parent.studentIds.
Step 4 — APIs + UI Teacher (gradebook grid, class averages, at-risk dashboard, report card preview) + Parent (mobile-first, child tiles, grades by subject, attendance calendar, pay tuition).
Step 5 — Notifications: low grade or absence threshold → notify parent.
Step 6 — Tests: weighted calc, PDF gen, parent isolation, bilingual.
Validation: 10 students × 5 assignments → report cards.
```

---

## Build #43: Restaurant — Recipe Costing + KDS Live Sync

### الهدف
حساب تكلفة الوصفات (BOM-style) + KDS متزامنة مع POS.

### Schema
- `Recipe` (yieldQty, prepMinutes, totalCost, costPercent)
- `RecipeIngredient` (qty, unit, isSubRecipe)
- `KDSStation` (GRILL|COLD|FRY|DESSERT|BAR), `KDSOrder` (status: NEW|IN_PROGRESS|DONE|BUMPED)
- `WasteRecord` (reason: EXPIRED|DROPPED|OVERPRODUCED, cost)

### APIs
- `POST /api/restaurant/recipes`
- `POST /api/restaurant/recipes/[id]/cost-rollup`
- `POST /api/restaurant/kds/orders`, `/api/restaurant/kds/orders/[id]/bump`
- `POST /api/restaurant/waste`

### Engine: `src/lib/recipe-engine.ts`
- `computeCost` (recursive for sub-recipes), `rollUpAll`, `fireToKDS` (split by station, WebSocket), `bumpOrder` (deduct inventory via recipe), `recordWaste` (JE: Dr Waste/Cr Inventory)

### Saudi Compliance
SFDA traceability — recipe + lot tracking يدعم recall.

### Effort: M

### Ready Prompt
```
Build Restaurant Recipe Costing + KDS for Namasoft ERP.
Step 1 — Schema (Recipe, RecipeIngredient, KDSStation, KDSOrder, WasteRecord).
Step 2 — Engine: computeCost (recursive sub-recipes), rollUpAll (alert if cost%>target), fireToKDS (split by station, WebSocket push), bumpOrder (mark done, deduct inventory), recordWaste (Dr Waste/Cr Inventory).
Step 3 — KDS screens: large tiles, timer, touch to bump, real-time WebSocket updates.
Step 4 — POS integration: extend src/app/api/pos to call fireToKDS.
Step 5 — APIs + UI (recipes list, recipe builder with live cost, KDS config, waste log).
Step 6 — Cron nightly: rollUpAll, alert on high cost%.
Step 7 — Tests: cost with sub-recipes, KDS routing, inventory deduct, waste posting.
Validation: 10 dishes menu, simulate 50 orders, verify costs + KDS flow.
```

---

## Build #44: SSO/SAML + SCIM Provisioning

### الهدف
SSO عبر SAML/OIDC + provisioning تلقائي عبر SCIM.

### Schema
- `IdPConfig` (protocol: SAML|OIDC, metadata, attributeMap, groupMapping, jitProvisioning)
- `SSOSession`, `SCIMToken` (scopes, expiresAt)

### APIs
- `POST /api/auth/sso/saml/[tenantId]/{login,acs}`
- `GET /api/auth/sso/oidc/[tenantId]/callback`
- `GET/POST/PUT/DELETE /api/scim/v2/Users` (RFC 7643/7644)

### Engine: `src/lib/sso-engine.ts`
- `initiateSAML`, `handleSAMLResponse` (validate signature, JIT provision)
- `provisionUser` (SCIM, map attributes), `deprovisionUser`, `mapGroups`

### Saudi Compliance
PDPL يتطلب immediate deprovisioning عند ترك الموظف.

### Effort: L

### Ready Prompt
```
Build SSO/SAML + SCIM Provisioning for Namasoft ERP.
Step 1 — Schema (IdPConfig, SSOSession, SCIMToken).
Step 2 — Libraries: @node-saml/node-saml or saml2-js, openid-client, scim-patch.
Step 3 — Engine: initiateSAML (build AuthnRequest, sign), handleSAMLResponse (validate signature+timing, JIT provision), provisionUser (map fields per attributeMap), deprovisionUser (soft-delete), mapGroups.
Step 4 — SCIM 2.0 endpoints (RFC 7643/7644): GET filter, POST create, PUT update, DELETE deprovision, Bearer token.
Step 5 — Coexist with Clerk: tenants choose Clerk, SAML, or both.
Step 6 — APIs + UI (IdP list with status, setup wizard with metadata upload, attribute/group mapping, test connection, SCIM token mgmt, audit log).
Step 7 — Tests: SAML validation (replay/timing), SCIM CRUD, JIT, sessions.
Validation: Configure Azure AD test tenant, full provisioning + login flow.
```

---

## Build #45: Webhook Subscriber Engine

### الهدف
السماح للأنظمة الخارجية بالاشتراك في events عبر webhooks آمنة.

### Schema
- `WebhookSubscription` (URL, events[], secret, active, lastDelivery, consecutiveFailures)
- `WebhookEvent` (eventType, payload, attempts, status: PENDING|DELIVERED|FAILED|DEAD, retry)

### APIs
- `POST /api/webhooks/subscriptions`
- `POST /api/webhooks/subscriptions/[id]/test`
- `POST /api/webhooks/events/[id]/retry`

### Engine: `src/lib/webhook-engine.ts`
- `subscribe` (HTTPS only, generate secret), `publish` (find matching, queue), `deliver` (HMAC-SHA256, exponential backoff: 1m, 5m, 30m, 1h, 24h), `retryFailed` (cron), `sign`

### Standard events
INVOICE_CREATED/PAID/VOIDED, ORDER_CREATED/SHIPPED/CANCELLED, PAYMENT_RECEIVED/REFUNDED, INVENTORY_LOW, EMPLOYEE_HIRED/TERMINATED, JE_POSTED.

### Effort: M

### Ready Prompt
```
Build Webhook Subscriber Engine for Namasoft ERP.
Step 1 — Schema (WebhookSubscription, WebhookEvent).
Step 2 — Engine: subscribe, publish (find matching subscriptions, queue), deliver (HMAC-SHA256 signature in X-Signature header, 10s timeout, 2xx=DELIVERED, 4xx=FAILED no retry, 5xx/timeout=retry), retryFailed (cron exponential backoff: 1m,5m,30m,1h,24h), sign.
Step 3 — Hook into auto-journal posts, invoice creation, order events.
Step 4 — Standard event types per spec.
Step 5 — APIs + UI (subscriptions list with status/failures, form, test button, events log filterable, retry, docs modal with payload schemas).
Step 6 — Cron every minute: retryFailed (100 events), hourly: cleanup events>30 days.
Step 7 — Tests: signature gen/verify, retry timing, auto-deactivate after consecutive failures.
Validation: Subscribe to test endpoint, trigger 5 events, verify delivery + signature.
```

---

## Build #46: Mobile App (Offline-Capable PWA)

### الهدف
PWA يعمل offline-first للحقل (مندوبين، مهندسين، sales reps).

### Schema
- `MobileSyncLog` (recordsUp/Down, conflictsCount, durationMs)
- `OfflineAction` (actionType, payload, status: PENDING|SYNCED|CONFLICT|FAILED, conflictResolution)
- `PushSubscription` (endpoint, keys, userAgent)

### APIs
- `POST /api/mobile/sync/{upload,download}`
- `POST /api/mobile/push/{subscribe,send}`
- `POST /api/mobile/conflict/resolve`

### Engine: `src/lib/mobile-sync-engine.ts`
- `pushChanges` (validate, apply, detect conflicts), `pullChanges` (since lastSync), `resolveConflict` (SERVER_WINS|CLIENT_WINS|MERGE|MANUAL), `sendPush` (web-push)

### Saudi Compliance
PDPL: photos/signatures encryption at rest + retention policy.

### Effort: L

### Ready Prompt
```
Build Mobile App (Offline-Capable PWA) for Namasoft ERP.
Step 1 — Schema (MobileSyncLog, OfflineAction, PushSubscription).
Step 2 — PWA setup: manifest.json (standalone), service worker (Workbox: cache static, stale-while-revalidate API, background sync queue POSTs), IndexedDB via idb library.
Step 3 — Mobile route group src/app/(mobile)/: separate layout, bottom nav, large touch, Arabic-first.
Step 4 — Engine: pushChanges (process actions, detect conflicts via lastSync timestamp, return per-action status), pullChanges (since lastSyncAt, filter by permissions, compress), resolveConflict, sendPush (web-push lib, handle subscription failures).
Step 5 — APIs + Mobile UI (dashboard with today visits, visits list, visit form with customer/products cached + photo + signature canvas + GPS, sync screen with pending count + conflict resolution, settings).
Step 6 — Push notifications: subscribe on first launch, server sends on relevant events.
Step 7 — Camera (react-camera-pro) + signature (react-signature-canvas), photos as base64 in offline queue.
Step 8 — Tests: offline queue, sync conflict, SW cache strategy, PWA install prompt, push delivery.
Validation: Real device, offline 3 visits, return online, verify sync.
```

---

## 📁 Reference Files (Absolute Paths)

- `d:\namasoft9-3-main\CLAUDE.md`
- `d:\namasoft9-3-main\BUSINESS_FLOWS_GUIDE.md`
- `d:\namasoft9-3-main\prisma\schema.prisma`
- `d:\namasoft9-3-main\src\lib\auto-journal.ts`
- `d:\namasoft9-3-main\src\lib\costing.ts`
- `d:\namasoft9-3-main\src\lib\mrp-engine.ts`
- `d:\namasoft9-3-main\src\lib\wht-engine.ts`
- `d:\namasoft9-3-main\src\lib\gosi-engine.ts`
- `d:\namasoft9-3-main\src\lib\zatca-signer.ts`
- `d:\namasoft9-3-main\src\lib\lease-accounting-engine.ts`
- `d:\namasoft9-3-main\src\lib\multi-book-engine.ts`
- `d:\namasoft9-3-main\src\lib\three-way-match.ts`
- `d:\namasoft9-3-main\src\lib\dunning-engine.ts`
- `d:\namasoft9-3-main\src\lib\payment-run-engine.ts`
- `d:\namasoft9-3-main\src\lib\fixed-assets-engine.ts`
- `d:\namasoft9-3-main\src\lib\mfa-engine.ts`
- `d:\namasoft9-3-main\src\lib\zakat-engine.ts` (built this session)
- `d:\namasoft9-3-main\src\lib\bank-recon-engine.ts`

---

**Bottom line:** 46 build packages مع برومتات قابلة للنسخ-لصق وتنفيذها مباشرة عبر `/erp-build-feature` slash command. كل package يُحضّر للأسبوعين القادمين من العمل على المشروع.

— نهاية مكتبة البرومتات —
