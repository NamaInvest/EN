# النقص #36: Maintenance + Field Service — مواصفات

> **المرجعيات:** SAP PM (Plant Maintenance)、Oracle Field Service、Salesforce FSL、ServiceTitan、IFS、Maximo

---

## 1. البرومنت

```
وسّع Maintenance + Field Service:

موجود: Maintenance, FieldService API (basic)

النواقص:
A) Asset / Equipment Maintenance:
   - Preventive schedules (km/hours/calendar)
   - Corrective work orders
   - Predictive (IoT-based)
   - Inspections
B) Field Service Dispatch:
   - Customer service requests
   - Technician scheduling + routing
   - Mobile app (offline-capable)
   - Parts inventory
   - Work orders
   - Time tracking
C) Service Contracts (SLA):
   - Coverage (hours, response time)
   - Renewals
   - Billing
D) Customer Portal:
   - Submit ticket
   - Track status
   - Rate technician
APIs (35+), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Preventive Maintenance Schedule
```
- AC unit due every 6 months
- Cron alerts 30 days before
- WO created + scheduled
- Technician dispatched
- Parts pulled (filter, refrigerant)
- Service performed + checklist
- Customer signs off
- Next due: +6 months
```

### B — Customer Service Request
```
1. Customer calls: AC not working
2. CSR creates ticket
3. Service contract checked → covered
4. Schedule technician for tomorrow 10 AM
5. Customer notified (SMS + email)
6. Reminder day-before
7. Technician arrives → fixes
8. Customer signs digitally
9. Invoice (or covered under contract)
```

### C — Technician Mobile (Offline)
```
- Technician arrives at site
- Opens app → sees today's WOs
- Selects current job → starts timer
- Photos before
- Performs work
- Logs parts used (from van inventory)
- Photos after
- Customer signs on screen
- Sync when back online
```

### D — Parts Inventory in Vans
```
- Each van has dedicated stock
- Technician takes parts from van
- System decrements van stock
- When stock low → replenishment from main warehouse
- Audit at end of week
```

### E — SLA Breach
```
- Service contract: respond within 4 hours
- Ticket created 9 AM
- Not assigned by 1 PM → SLA breach
- Auto-escalate to manager
- Penalty calc per contract terms
```

### F — Routing Optimization
```
- 5 jobs scheduled today
- System optimizes order based on:
  - Locations
  - Priority
  - Skill match
  - Travel time
- Reorders for technician
```

### G — Quote → Job
```
- Initial visit: technician assesses
- Quote generated for repair (parts + labor)
- Customer approves
- Parts ordered if needed
- Job scheduled when parts arrive
- Service performed + invoiced
```

### H — IoT-Based Predictive
```
- Equipment sensors stream data
- AI detects anomaly (vibration spike)
- Predicts failure in 7 days
- Auto-creates predictive WO
- Technician dispatched proactively
```

---

## 3. تدفق البيانات

```
[Service Request]
POST /service/tickets
   ↓ check contract coverage
   ↓ assign priority based on SLA
   ↓ create WorkOrder

[Dispatch]
POST /service/dispatch
   ↓ optimize routes
   ↓ assign technicians
   ↓ notify

[On-site]
Technician mobile:
   ↓ start timer
   ↓ log parts used
   ↓ photos
   ↓ customer signature
   ↓ sync
```

---

## 4. Schema (إضافات)

```prisma
model ServiceAsset {
  id              Int       @id @default(autoincrement())
  assetCode       String    @unique
  customerId      Int
  
  category        String    // 'AC' | 'GENERATOR' | 'ELEVATOR' | 'PUMP' | etc.
  manufacturer    String?
  model           String?
  serialNumber    String?
  
  installationDate DateTime?
  warrantyExpiryDate DateTime?
  
  location        String?
  geoLocation     Json?
  
  serviceContractId Int?
  
  // Maintenance schedule
  pmFrequencyDays Int?
  pmFrequencyHours Int?
  lastPmDate      DateTime?
  nextPmDue       DateTime?
  
  // Status
  status          String    @default("OPERATIONAL")  // OPERATIONAL | UNDER_MAINTENANCE | DOWN | DECOMMISSIONED
  
  // IoT
  iotDeviceId     String?
  
  workOrders      ServiceWorkOrder[]
  inspections     ServiceInspection[]
}

model ServiceContract {
  id              Int       @id @default(autoincrement())
  contractNumber  String    @unique
  customerId      Int
  
  type            String    // 'AMC' (Annual Maintenance Contract) | 'PER_INCIDENT' | 'TIME_AND_MATERIAL'
  
  startDate       DateTime
  endDate         DateTime
  
  monthlyFee      Decimal?  @db.Decimal(20,4)
  totalValue      Decimal?  @db.Decimal(20,4)
  
  // SLA
  responseTimeHours Int     // promise to respond
  resolutionTimeHours Int   // promise to resolve
  uptimePercent   Decimal?  @db.Decimal(5,2)
  
  coverageHours   String    // '24x7' | '8x5' | '12x6'
  
  // What's covered
  includesParts   Boolean   @default(false)
  includesLabor   Boolean   @default(true)
  includesTravel  Boolean   @default(true)
  
  status          String    @default("ACTIVE")
  
  assets          ServiceAsset[]
  workOrders      ServiceWorkOrder[]
}

model ServiceTechnician {
  id              Int       @id @default(autoincrement())
  employeeId      Int       @unique
  
  skills          String[]
  certifications  String[]
  
  baseLocation    Json?
  
  vanInventoryId  Int?
  
  rating          Decimal?  @db.Decimal(3,2)  // 1-5
  
  active          Boolean   @default(true)
}

model ServiceWorkOrder {
  id              Int       @id @default(autoincrement())
  workOrderNumber String    @unique
  
  type            String    // 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'INSTALLATION' | 'EMERGENCY' | 'PREDICTIVE'
  priority        String    @default("NORMAL")  // LOW | NORMAL | HIGH | EMERGENCY
  
  customerId      Int?
  assetId         Int?
  asset           ServiceAsset? @relation(fields: [assetId], references: [id])
  contractId      Int?
  
  description     String    @db.Text
  symptoms        String?   @db.Text
  
  reportedAt      DateTime  @default(now())
  reportedByUserId String?
  reportingChannel String?  // 'PHONE' | 'EMAIL' | 'PORTAL' | 'WHATSAPP' | 'MOBILE_APP' | 'IOT'
  
  scheduledStart  DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  
  technicianId    Int?
  status          String    @default("OPEN")  // OPEN | ASSIGNED | EN_ROUTE | ON_SITE | IN_PROGRESS | COMPLETED | CANCELLED | RE_SCHEDULED
  
  // SLA tracking
  responseSlaDeadline DateTime?
  responseSlaMet  Boolean?
  resolutionSlaDeadline DateTime?
  resolutionSlaMet Boolean?
  slaBreachReason String?
  
  // Resolution
  rootCause       String?
  resolutionDescription String? @db.Text
  partsUsed       Json?     // [{partId, qty, cost}]
  laborHours      Decimal?  @db.Decimal(5,2)
  
  totalCost       Decimal?  @db.Decimal(20,4)
  
  // Customer
  customerSignatureUrl String?
  customerRating  Int?
  customerFeedback String?
  
  // Photos
  photosBefore    String[]
  photosAfter     String[]
  
  invoiceId       Int?
  isCoveredByContract Boolean @default(false)
}

model VanInventory {
  id              Int       @id @default(autoincrement())
  technicianId    Int
  van             String?
  items           VanInventoryItem[]
  lastReplenishedAt DateTime?
}

model VanInventoryItem {
  id              Int       @id @default(autoincrement())
  vanInventoryId  Int
  vanInventory    VanInventory @relation(fields: [vanInventoryId], references: [id], onDelete: Cascade)
  
  productId       Int
  qtyOnHand       Decimal   @db.Decimal(20,2)
  qtyMin          Decimal   @db.Decimal(20,2)
  
  lastConsumedAt  DateTime?
}

model ServiceInspection {
  id              Int       @id @default(autoincrement())
  assetId         Int
  asset           ServiceAsset @relation(fields: [assetId], references: [id])
  workOrderId     Int?
  
  inspectionDate  DateTime
  inspectorId     Int
  
  checklist       Json      // [{item, condition, notes, photo}]
  overallCondition String   // 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
  recommendations String?   @db.Text
  
  signedByCustomer Boolean  @default(false)
  reportUrl       String?
}

model ServiceAppointment {
  id              Int       @id @default(autoincrement())
  workOrderId     Int
  
  scheduledStart  DateTime
  scheduledEnd    DateTime
  technicianId    Int
  
  customerConfirmed Boolean @default(false)
  reminderSentAt  DateTime?
  
  status          String    @default("SCHEDULED")  // SCHEDULED | CONFIRMED | EN_ROUTE | ARRIVED | COMPLETED | NO_SHOW | RESCHEDULED
}

model RouteOptimization {
  id              Int       @id @default(autoincrement())
  technicianId    Int
  date            DateTime
  
  workOrderIds    Int[]
  optimizedSequence Int[]
  estimatedDistance Decimal?  @db.Decimal(10,2)
  estimatedDuration Int?
  
  generatedAt     DateTime  @default(now())
}
```

---

## 5. Forms (8)

A: Service Asset Setup
B: Service Contract
C: Work Order Create
D: Technician Assignment
E: Mobile Work Order Update
F: Parts Used
G: Customer Sign-off
H: Inspection Checklist

---

## 6. Tables (8)

A: Assets
B: Service Contracts
C: Work Orders (Kanban)
D: Today's Schedule
E: SLA Status
F: Van Inventory
G: Inspections
H: Customer Ratings

---

## 7. Buttons (25+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-asset-add | + أصل خدمة | 🟢 service mgr |
| btn-contract-create | + عقد خدمة | 🟢 service mgr |
| btn-contract-renew | تجديد | 🟦 service mgr |
| btn-wo-create | + WO | 🟢 dispatcher |
| btn-wo-assign | إسناد | 🟦 dispatcher |
| btn-wo-route-optimize | تحسين المسار | 🟦 dispatcher |
| btn-tech-en-route | في الطريق | 🟢 technician |
| btn-tech-arrived | وصل | 🟢 technician |
| btn-tech-start-work | بدء العمل | 🟢 technician |
| btn-tech-pause | إيقاف مؤقت | 🟡 technician |
| btn-tech-add-parts | + قطع | 🟢 technician |
| btn-tech-photos-before | صور قبل | 🟢 technician |
| btn-tech-photos-after | صور بعد | 🟢 technician |
| btn-customer-signature | توقيع العميل | 🟢 technician |
| btn-customer-rate | تقييم | 🟢 customer |
| btn-wo-complete | إكمال | 🟢 technician |
| btn-wo-reschedule | إعادة جدولة | 🟡 dispatcher |
| btn-wo-cancel | إلغاء | 🔴 dispatcher + reason |
| btn-pm-schedule-create | + جدول وقاية | 🟢 service mgr |
| btn-pm-trigger | تشغيل دوري | ⬜ system |
| btn-inspection-create | + معاينة | 🟢 inspector |
| btn-quote-from-wo | + عرض سعر | 🟦 service mgr |
| btn-van-replenish | + استعاضة فان | 🟦 wh |
| btn-van-audit | جرد فان | 🟦 service mgr |
| btn-sla-breach-resolve | حل SLA | 🟡 service mgr |

---

## 8. Search & Filters

- Assets: type, customer, status, contract
- Work orders: status, priority, SLA breach, technician, date
- Contracts: status, expiring
- Technicians: skills, location, availability

---

## 9. Reports

- Service KPIs (response time, resolution time)
- Technician Productivity
- SLA Compliance
- Customer Satisfaction
- Parts Usage
- Service Revenue
- Asset Maintenance History
- First-Time Fix Rate
- Travel Efficiency

---

## 10. Dashboards

- KPIs: Open WOs / SLA at Risk / Today's Jobs / Avg Response Time
- Map: Live technician locations
- Lists: SLA breaching, Today's appointments, Customer feedback

---

## 11. Notifications

- WO assigned (technician)
- Tech en route (customer)
- SLA approaching breach
- Customer feedback received
- Parts running low (van)
- PM schedule due

---

## 12. Permissions

| Action | Tech | Dispatcher | Mgr | Customer |
|--------|------|-----------|-----|----------|
| Create WO | ✗ | ✓ | ✓ | ✓ self |
| Assign | ✗ | ✓ | ✓ | ✗ |
| Update status | ✓ own | ✓ | ✓ | ✗ |
| Add parts | ✓ | ✗ | ✓ | ✗ |
| Sign-off | customer | ✗ | ✗ | ✓ |
| Rate service | ✗ | ✗ | ✗ | ✓ |
| Manage contracts | ✗ | ✗ | ✓ | ✗ |
| Van inventory | ✓ own | ✓ | ✓ | ✗ |

---

## 13. Integrations

- IoT platforms (sensor data)
- Mapping (Google Maps, Mapbox)
- WhatsApp (customer notifications)
- SMS gateways
- Calendar
- AI routing optimization

---

## 14. Shortcuts

- `Ctrl+W` New WO
- `Ctrl+D` Dispatch view

---

## 15. Mobile / Print

- Technician mobile (offline-first)
- Dispatcher map view
- Print: WO sheet, customer copy

---

## 16. Audit

- WO state changes
- Parts usage
- Time entries
- Customer signatures (immutable)
- SLA breaches investigated

---

## 17. Tests

```typescript
describe('SLA Tracking', () => { /* response, resolution */ })
describe('Route Optimization', () => { /* TSP-like */ })
describe('Van Inventory', () => { /* deduct, replenish */ })
describe('Mobile Offline', () => { /* sync conflict resolution */ })
describe('PM Trigger', () => { /* km, hours, calendar based */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Tech offline → no sync for hours | queue locally, sync later |
| Customer not present | reschedule + log |
| Parts mismatch on van | manual correction |
| Multiple WOs same asset | one active, others pending |
| Contract expired during open WO | finish + bill T&M |
| SLA breach during weekend | check coverage hours |

---

**نهاية #36** • 8 سيناريوهات • 8 جداول • 8 forms • 8 grids • 25 button • 9 reports
