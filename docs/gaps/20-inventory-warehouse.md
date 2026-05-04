# النقص #20: Inventory + Warehouse Management (WMS) — مواصفات تفصيلية

> **المرجعيات:** SAP EWM (Extended Warehouse Mgmt)、Oracle WMS、Manhattan Associates、Blue Yonder、Körber、Infor SCM

---

## 1. البرومنت الكامل

```
وسّع Inventory + WMS لمستوى SAP EWM:

موجود: Stock, ProductStock, StockMovement, StockTransfer, Stocktake, ProductBatch, ProductSerialNumber, WarehouseZone/Rack/Bin, StockReservation, InventoryPlanning

النواقص:

A) Multi-Warehouse + Bin Management:
   - Hierarchical zones (Receiving / Storage / Picking / Packing / Shipping / Quarantine / Damaged)
   - Bin types (Floor / Rack / Cold / Hazmat / Ambient)
   - Bin capacity (weight + volume)
   - Bin restrictions (product types, hazmat class)
   - Slotting strategies (ABC, velocity-based)

B) Putaway:
   - Putaway strategies (random, fixed, ABC, FEFO, FIFO)
   - Suggested putaway location
   - Mobile/scan confirmation
   - Cross-docking

C) Picking:
   - Pick list generation
   - Wave picking (batch multiple orders)
   - Cluster picking
   - Zone picking
   - Pick path optimization
   - Mobile pick app
   - Voice picking integration
   - Pick-to-light (optional)

D) Packing:
   - Pack station with scanning
   - Carton selection (right-size)
   - Manifest generation
   - Weight verification
   - Shipping label printing

E) Shipping:
   - Carrier rate shopping
   - Label printing (multi-carrier)
   - Manifest + EOD close
   - Tracking integration

F) Cycle Counting:
   - ABC-based cycle plans
   - Random sampling
   - Mobile count
   - Variance investigation
   - Auto-adjustment with approval
   - Continuous count vs annual

G) Batch / Lot Management:
   - Batch attributes (manufacture date, expiry, supplier batch)
   - FEFO (First Expiry First Out)
   - Quarantine (hold) / Release
   - Recall management
   - Genealogy (parent-child batches)

H) Serial Numbers:
   - Track per unit
   - Assign at receipt or sale
   - Warranty tracking
   - Service history
   - Recall by serial range

I) Inventory Valuation:
   - FIFO / LIFO / Weighted Average / Standard / Specific ID
   - Multi-currency cost
   - Landed cost integration
   - Period-end revaluation

J) Stock Reservations:
   - Hard vs soft reservation
   - Reservation by SO/WO/MO
   - Reservation expiry
   - Auto-allocation

K) Slow-moving / Dead Stock:
   - Aging analysis
   - Liquidation suggestions

L) Reorder Planning:
   - Min/Max levels
   - Safety stock calculation
   - Lead time variability
   - Auto-PR generation
   - Demand forecasting (AI link)

APIs (60+), UI (25 pages), Tests 80+
```

---

## 2. السيناريوهات (10)

### A — Receiving with QC + Putaway
```
1. Truck arrives → driver provides PO #
2. Receiving clerk scans → opens GRN
3. Counts each pallet → confirms
4. QC inspection (if required) → quarantine zone
5. After QC pass: putaway suggestion → "Bin A-12-3"
6. Forklift moves pallet → scans bin
7. System updates: stock in A-12-3
```

### B — Wave Picking (multi-order)
```
- 50 orders to ship today
- Wave manager creates wave: "Morning Wave 1"
- System combines pick lists by product
- 1 pickrun: walk through warehouse picking all required items
- Sort at staging by order
- Pack each order separately
- 30% time saved vs single-order picking
```

### C — Cycle Count Variance
```
- Bin A-12-3 cycle count
- Expected: 100 units, Counted: 95
- Variance: -5 (5%)
- Within tolerance? No (>2%) → investigation
- Root cause: 5 units sold but movement not posted
- Adjustment: -5 with reason "system delay"
- Approved by warehouse mgr
```

### D — Batch Recall
```
- Vendor reports defective batch (BATCH-2026-A)
- Stock check: 250 units in 3 warehouses + sold to 35 customers
- /inventory/batches/[id]/recall
- All stock quarantined
- Customer notification + return labels
- Affected sales reports generated
```

### E — Cross-Docking
```
- Customer order received
- Vendor PO arriving same day
- System routes goods directly receiving → packing (skips storage)
- Faster fulfillment, lower handling costs
```

### F — Slow-Moving Detection
```
- Cron monthly:
  - Items with 0 sales in 90 days flagged
  - Aging analysis: 30/60/90/180/365 days
- Suggestions:
  - 30 days no sales → discount
  - 90 days → liquidation auction
  - 365 days → write-off candidate
```

### G — Reorder Trigger
```
- Product X: min=50, max=200, current=45
- Reorder point reached → auto-create PR for 155 units
- PR routes to procurement
- Lead time 14 days → expected receipt 2026-05-18
- Safety stock prevents stockout
```

### H — Serial Tracking (Service)
```
- Customer brings broken laptop (serial S/N 12345)
- /inventory/serial/lookup
- History shows: sold 2024-01, warranty 2 years (active)
- Service ticket created
- Repair history added
- Serial stays linked even after repair
```

### I — Multi-Warehouse Transfer
```
- Riyadh warehouse: 1000 units
- Jeddah needs 200 (low stock)
- Transfer order: Riyadh → Jeddah
- Status: PENDING → IN_TRANSIT → RECEIVED
- COGS captured: shipping cost added
- Reconciliation if shortage
```

### J — Period-End Revaluation
```
- Year-end: revalue inventory
- Method: weighted average
- New cost calculated
- JE: DR/CR Inventory Adjustment / CR/DR Cost Variance
- All stock value updated
```

---

## 3. تدفق البيانات

```
[Receive Goods]
POST /grn → GRN created
   ↓ stock movement: + qty in receiving zone
   ↓ if QC required → quarantine
   ↓ on QC pass → putaway suggestion
POST /inventory/putaway/confirm → moves to suggested bin

[Pick]
POST /shipping/wave/create → wave with multi-orders
   ↓ generate optimized pick path
   ↓ mobile pick app
POST /shipping/pick/confirm → reduce stock + reservation cleared

[Cycle Count]
POST /inventory/cyclecount/start { bins, products }
   ↓ generate count tasks
   ↓ counters scan + enter qty
   ↓ system computes variance
   ↓ approve adjustment → JE posted

[Reorder Cron]
   ↓ for each product:
     check current stock vs min
     if < reorder point → create PR
     calculate qty to order (max - current)
```

---

## 4. Prisma Schema (إضافات selected)

```prisma
model Stock { // warehouse
  // ... existing
  warehouseType   String    // 'STANDARD' | 'COLD' | 'HAZMAT' | 'BONDED' | 'TRANSIT'
  totalCapacityM3 Decimal?  @db.Decimal(20,4)
  currentUtilization Decimal? @db.Decimal(5,2)
  manager         Int?
  zones           WarehouseZone[]
}

model WarehouseZone {
  // ... existing
  zoneType        String    // 'RECEIVING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'SHIPPING' | 'QUARANTINE' | 'DAMAGED' | 'RETURNS'
  temperatureRange String?   // "2-8°C" or "ambient"
  hazmatAllowed   Boolean   @default(false)
  capacityM3      Decimal?  @db.Decimal(20,4)
  racks           WarehouseRack[]
}

model WarehouseRack {
  // ... existing
  rackType        String    // 'SHELVING' | 'PALLET' | 'CANTILEVER' | 'BIN' | 'FLOOR'
  bins            WarehouseBin[]
}

model WarehouseBin {
  // ... existing
  binCode         String    @unique
  capacityWeight  Decimal?  @db.Decimal(20,4)
  capacityVolume  Decimal?  @db.Decimal(20,4)
  capacityUnits   Int?
  
  abcCategory     String?   // 'A' | 'B' | 'C'
  velocityRank    Int?
  
  productRestrictions String[]  // allowed product categories
  hazmatClass     String?
  
  isPickable      Boolean   @default(true)
  isPutawayable   Boolean   @default(true)
  isReserved      Boolean   @default(false)
  
  positionRow     Int?
  positionLevel   Int?
  positionDepth   Int?
}

model ProductBatch {
  // ... existing
  manufactureDate DateTime?
  expiryDate      DateTime?
  vendorBatchNo   String?
  vendorId        Int?
  
  quarantine      Boolean   @default(false)
  quarantineReason String?
  recallStatus    String?   // null | 'RECALL_NOTICE' | 'RECALLED' | 'DESTROYED'
  
  parentBatchId   Int?
  
  qcResultId      Int?
  
  costPerUnit     Decimal   @db.Decimal(20,4)
}

model ProductSerialNumber {
  // ... existing
  manufactureDate DateTime?
  warrantyStart   DateTime?
  warrantyEndDate DateTime?
  
  status          String    @default("AVAILABLE")  // AVAILABLE | RESERVED | SOLD | RETURNED | UNDER_SERVICE | RETIRED
  
  currentBinId    Int?
  currentOwnerId  Int?      // customer if sold
  
  saleInvoiceId   Int?
  
  serviceHistory  Json?
}

model PickList {
  id              Int       @id @default(autoincrement())
  pickListNumber  String    @unique
  
  type            String    // 'SINGLE' | 'WAVE' | 'CLUSTER' | 'ZONE'
  waveId          Int?
  
  warehouseId     Int
  pickerUserId    String?
  
  status          String    @default("PENDING")  // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  
  startedAt       DateTime?
  completedAt     DateTime?
  
  totalLines      Int
  pickedLines     Int       @default(0)
  
  optimizedPath   Json?
  
  lines           PickListLine[]
  sourceOrders    Int[]     // SO IDs in this pick
}

model PickListLine {
  id              Int       @id @default(autoincrement())
  pickListId      Int
  pickList        PickList  @relation(fields: [pickListId], references: [id], onDelete: Cascade)
  
  productId       Int
  qtyToPick       Decimal   @db.Decimal(20,4)
  qtyPicked       Decimal   @default(0) @db.Decimal(20,4)
  
  fromBinId       Int
  batchId         Int?
  serialNumbers   String[]
  
  status          String    @default("PENDING")  // PENDING | PICKED | PARTIAL | NOT_FOUND | SUBSTITUTED
  
  pickedAt        DateTime?
  notes           String?
}

model Wave {
  id              Int       @id @default(autoincrement())
  waveNumber      String    @unique
  warehouseId     Int
  status          String    @default("PLANNED")  // PLANNED | RELEASED | PICKING | COMPLETED
  
  scheduledStart  DateTime
  releasedAt      DateTime?
  completedAt     DateTime?
  
  totalOrders     Int
  totalLines      Int
  
  pickLists       PickList[]
}

model PutawayTask {
  id              Int       @id @default(autoincrement())
  grnLineId       Int
  productId       Int
  qty             Decimal   @db.Decimal(20,4)
  fromZoneId      Int
  toBinId         Int       // suggested
  actualBinId     Int?      // confirmed
  
  status          String    @default("PENDING")  // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  assignedToUserId String?
  completedAt     DateTime?
}

model CycleCountPlan {
  id              Int       @id @default(autoincrement())
  planNumber      String    @unique
  warehouseId     Int
  
  type            String    // 'ABC' | 'RANDOM' | 'BIN_BASED' | 'PRODUCT_BASED'
  frequency       String    // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  
  scope           Json      // {bins, products, categories}
  
  active          Boolean   @default(true)
  nextRunDate     DateTime
  
  sessions        CycleCountSession[]
}

model CycleCountSession {
  id              Int       @id @default(autoincrement())
  planId          Int
  plan            CycleCountPlan @relation(fields: [planId], references: [id])
  
  sessionNumber   String    @unique
  scheduledDate   DateTime
  status          String    @default("SCHEDULED")  // SCHEDULED | IN_PROGRESS | COMPLETED | RECONCILING | CLOSED
  
  startedAt       DateTime?
  completedAt     DateTime?
  
  totalBinsToCount Int
  binsCounted     Int       @default(0)
  variancesFound  Int       @default(0)
  
  counts          CycleCountEntry[]
}

model CycleCountEntry {
  id              Int       @id @default(autoincrement())
  sessionId       Int
  session         CycleCountSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  binId           Int
  productId       Int
  expectedQty     Decimal   @db.Decimal(20,4)
  countedQty      Decimal?  @db.Decimal(20,4)
  variance        Decimal?  @db.Decimal(20,4)
  variancePercent Decimal?  @db.Decimal(5,2)
  
  countedByUserId String?
  countedAt       DateTime?
  
  status          String    @default("PENDING")  // PENDING | COUNTED | INVESTIGATED | ADJUSTED | WRITTEN_OFF
  rootCause       String?
  adjustmentJournalId Int?
}

model StockReservation {
  // ... existing
  reservationType String    @default("HARD")  // HARD | SOFT
  expiresAt       DateTime?
  
  sourceType      String    // 'SO' | 'WO' | 'MO' | 'TRANSFER'
  sourceId        Int
  
  fromBinId       Int?
  
  status          String    @default("ACTIVE")  // ACTIVE | RELEASED | CONSUMED | EXPIRED
  consumedAt      DateTime?
}

model BatchRecall {
  id              Int       @id @default(autoincrement())
  batchId         Int
  batch           ProductBatch @relation(fields: [batchId], references: [id])
  
  reason          String    @db.Text
  reportedAt      DateTime  @default(now())
  reportedByUserId String
  severity        String    // 'CLASS_I' | 'CLASS_II' | 'CLASS_III'
  
  affectedSales   Json?     // {customerId, invoiceId, qty}
  totalUnitsAffected Decimal @db.Decimal(20,4)
  
  status          String    @default("INITIATED")  // INITIATED | NOTIFIED | RETURNED | CLOSED
  
  customerNotificationsSent Int @default(0)
  unitsReturned   Decimal   @default(0) @db.Decimal(20,4)
  
  closedAt        DateTime?
}

model SlowMovingItem {
  id              Int       @id @default(autoincrement())
  productId       Int
  warehouseId     Int
  
  daysSinceLastMovement Int
  currentQty      Decimal   @db.Decimal(20,4)
  currentValue    Decimal   @db.Decimal(20,4)
  
  category        String    // 'SLOW_30' | 'SLOW_90' | 'SLOW_180' | 'DEAD_365'
  recommendation  String?   // 'DISCOUNT' | 'LIQUIDATE' | 'WRITE_OFF' | 'RETURN_VENDOR'
  
  identifiedAt    DateTime  @default(now())
  resolvedAt      DateTime?
  resolution      String?
}

model InventoryPlanning {
  // ... existing
  productId       Int       @unique
  warehouseId     Int
  
  minStock        Decimal   @db.Decimal(20,4)
  maxStock        Decimal   @db.Decimal(20,4)
  reorderPoint    Decimal   @db.Decimal(20,4)
  reorderQty      Decimal   @db.Decimal(20,4)
  safetyStock     Decimal   @db.Decimal(20,4)
  
  leadTimeDays    Int
  leadTimeStdDev  Decimal?  @db.Decimal(5,2)
  
  averageDailyUsage Decimal? @db.Decimal(20,4)
  serviceLevel    Decimal?  @db.Decimal(5,2)  // e.g., 95%
  
  abcCategory     String?
  xyzCategory     String?
  
  lastReviewedAt  DateTime?
}
```

---

## 5. Forms & Fields (8 forms)

### Form A: Putaway
- GRN, suggested bin, actual bin, qty, batch, scan confirmation

### Form B: Wave Creation
- Warehouse, scheduled start, orders to include, picker assignment

### Form C: Pick Confirmation
- Pick list line, qty picked, bin scanned, batch/serial scanned

### Form D: Cycle Count
- Plan, scope, scheduled date, counters, frequency

### Form E: Stock Adjustment
- Product, bin, delta qty, reason, attachment, approval

### Form F: Stock Transfer
- From/To warehouse, lines, expected date, carrier

### Form G: Batch Recall
- Batch, severity, reason, evidence

### Form H: Reorder Override
- Product, override min/max/lead time, reason

---

## 6. Tables & Columns (8 grids)

### Grid A: Stock by Bin
- Bin, Product, Qty, Reserved, Available, Batch, Expiry

### Grid B: Stock Movements
- Date, Type, Doc Ref, From/To, Qty, Cost, By

### Grid C: Pick Lists
- # / Type, Wave, Picker, Status, Lines, Started, Completed, Duration

### Grid D: Cycle Count Sessions
- # / Plan, Status, Scheduled, Bins to Count, Counted, Variances, Actions

### Grid E: Slow-Moving
- Product, Warehouse, Days No Movement, Current Qty, Value, Category, Recommendation

### Grid F: Reorder Suggestions
- Product, Current Stock, Reorder Point, Suggested Qty, Lead Time, Auto-PR Status

### Grid G: Batch Status
- Batch, Product, Manufactured, Expires, Days to Expire, Qty, Status (Quarantine/Released/Recall)

### Grid H: Serial Tracking
- Serial, Product, Status, Owner, Sold Date, Warranty End, Service Count

---

## 7. Buttons & Actions (40+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-warehouse-create | + مستودع | 🟢 admin |
| btn-zone-create | + منطقة | 🟢 wh_mgr |
| btn-bin-create | + موقع | 🟢 wh_mgr |
| btn-bin-bulk-import | استيراد جماعي | ⬜ wh_mgr |
| btn-receive-goods | استلام | 🟢 wh |
| btn-putaway-suggest | اقتراح | 🟦 system |
| btn-putaway-confirm | تأكيد الإيداع | 🟢 wh |
| btn-wave-create | + موجة | 🟢 wh_mgr |
| btn-wave-release | إصدار | 🟦 wh_mgr |
| btn-wave-cancel | إلغاء | 🔴 wh_mgr |
| btn-pick-start | بدء التحضير | 🟦 picker |
| btn-pick-confirm-line | تأكيد سطر | 🟢 picker |
| btn-pick-substitute | استبدال | 🟡 picker + reason |
| btn-pick-not-found | غير موجود | 🔴 picker |
| btn-pack-start | بدء التغليف | 🟦 packer |
| btn-pack-verify-weight | فحص الوزن | 🟦 packer |
| btn-ship-print-label | طباعة label | ⬜ shipping |
| btn-ship-create-manifest | إنشاء manifest | 🟦 shipping |
| btn-ship-eod-close | إغلاق نهاية اليوم | 🔴 wh_mgr |
| btn-cycle-count-plan-create | + خطة جرد | 🟢 wh_mgr |
| btn-cycle-count-start | بدء جرد | 🟢 wh_mgr |
| btn-cycle-count-scan | مسح | 🟦 counter |
| btn-cycle-count-finalize | إنهاء + تسوية | 🔴 wh_mgr |
| btn-stock-adjust | تعديل المخزون | 🟡 wh_mgr + reason |
| btn-stock-write-off | شطب | 🔴 cfo + reason |
| btn-transfer-create | + نقل | 🟢 wh |
| btn-transfer-approve | موافقة | 🟢 wh_mgr |
| btn-transfer-receive | استلام | 🟢 receiving wh |
| btn-batch-quarantine | حجز | 🔴 qc |
| btn-batch-release | إفراج | 🟢 qc |
| btn-batch-recall | استدعاء | 🔴 qc + manager |
| btn-batch-destroy | إتلاف | 🔴 cfo + record |
| btn-serial-lookup | بحث Serial | 🟦 viewer |
| btn-serial-mark-service | إرسال للصيانة | 🟦 service |
| btn-reorder-trigger | تشغيل الاقتراحات | 🟦 procurement |
| btn-reorder-create-pr | + PR من اقتراح | 🟢 procurement |
| btn-slow-moving-detect | كشف الراكد | ⬜ wh_mgr |
| btn-slow-moving-action | اتخاذ إجراء | 🟦 wh_mgr |
| btn-revaluation-run | إعادة التقييم | 🔴 cfo |
| btn-export-stock-card | بطاقة الصنف | ⬜ viewer |

---

## 8. Search & Filters

- Stock: by warehouse, zone, bin, product, batch, expiry range, available qty
- Movements: type, date range, product, document
- Pick lists: status, picker, wave, date
- Cycle counts: status, plan, with variances
- Batches: status (quarantine/released/recalled), expiry within X days
- Serials: status, owner, product

---

## 9. Reports & Exports

- Stock Status (current snapshot)
- Stock Movements Detail
- Inventory Valuation (by method)
- ABC Analysis
- XYZ Analysis (variability)
- Slow-Moving / Dead Stock
- Expiry Report (FEFO)
- Reorder Suggestions
- Cycle Count Variance
- Wave Performance
- Pick Productivity (per picker)
- Stock Card (per product full history)
- Batch Genealogy
- Serial Tracking
- Damaged/Returned Stock

---

## 10. Dashboards & Widgets

- KPIs: Total Stock Value / Coverage Days / Pick Productivity / Cycle Count Accuracy / Expiring Stock Value
- Charts: Stock trend, ABC distribution, Pick rate by hour
- Lists: Low stock, Expiring batches, Recall items, Slow movers

---

## 11. Notifications

- Reorder triggered (auto-PR)
- Batch expiring (30/15/7 days)
- Recall initiated → all affected
- Cycle count variance > tolerance
- Bin capacity exceeded
- Quarantine batch awaiting decision
- Stock adjustment posted
- Wave released
- Hazmat received

---

## 12. Permissions Matrix

| Action | Picker | Wh Worker | Wh Mgr | QC | CFO | Admin |
|--------|--------|-----------|--------|----|----|-------|
| View stock | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Receive | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Putaway | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Pick | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Pack | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Ship | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ |
| Cycle count | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Adjust stock | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| Write-off | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Quarantine | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Release batch | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Recall | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Revaluation | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Configure WMS | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 13. Integrations

- Barcode scanners (Honeywell, Zebra)
- RFID readers
- Voice picking systems
- Pick-to-light
- Conveyor / sortation systems
- Forklift terminals
- Carriers (Aramex, DHL, SMSA)
- Manhattan / Blue Yonder (if migration)
- IoT temperature sensors
- AI vision counting

---

## 14. Keyboard Shortcuts

- `B` Scan barcode
- `Ctrl+C` Cycle count
- `Ctrl+T` Transfer
- `Ctrl+R` Receive
- `Ctrl+P` Pick

---

## 15. Mobile / Print

- Native mobile WMS app (offline-capable)
- Voice picking
- Print: pick lists, bin labels, shipping labels (multi-carrier)
- AGV/Drone integration (future)

---

## 16. Audit & Logging

- Every movement logged
- Adjustments require reason + approval
- Recalls fully traced
- Cycle count history retained
- Bin moves audited

---

## 17. Test Cases

```typescript
describe('Putaway', () => { /* strategies, suggestions, capacity check */ })
describe('Wave Picking', () => { /* multi-order optimization */ })
describe('Pick Confirm', () => { /* qty, batch, serial validation */ })
describe('Cycle Count', () => { /* variance calculation, adjustment */ })
describe('Reorder', () => { /* point trigger, PR generation */ })
describe('Batch', () => { /* FEFO, quarantine, recall */ })
describe('Reservation', () => { /* hard vs soft, expiry */ })
describe('Transfer', () => { /* in-transit, reconciliation */ })
describe('Slow-Moving', () => { /* aging, recommendations */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Bin full mid-putaway | suggest alternative |
| Pick item missing | substitute or backorder |
| Serial scanned twice | reject (uniqueness) |
| Expiry passed during pick | block + alert |
| Recall during open order | suspend + replace |
| Negative stock | allow with permission + alert |
| Bin with quarantine + active stock | mixed allowed with flag |
| Transfer in-transit lost | claim + writeoff |
| Power loss mid-pick | resume from checkpoint |

---

**نهاية مواصفات #20** • 10 سيناريوهات • 14 جداول • 8 forms • 8 grids • 40 button • 15 reports
