# النقص #34: Fleet Management — مواصفات

> **المرجعيات:** Geotab、Samsara、Verizon Connect、Fleetio、Fleet Complete

---

## 1. البرومنت

```
وسّع Fleet:

موجود: Vehicle, FleetTrip, FuelLog

النواقص:
A) Vehicle Master (with all docs + insurance)
B) GPS tracking (real-time)
C) Trip planning + routing
D) Fuel cards + monitoring
E) Maintenance schedule (preventive)
F) Driver management (license, behavior)
G) Telematics (speed, harsh braking, idle time)
H) Fuel theft detection
I) Cost per km/trip
J) Compliance (Saudi Wasl, Mukamala)

APIs (35+), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Vehicle Onboarding
```
1. New truck purchased
2. Master record:
   - Plate, VIN, Make/Model/Year
   - Insurance policy + expiry
   - Istimara (registration) + expiry
   - Wasl tracker installed
   - Driver assigned
3. Initial odometer reading
4. Maintenance schedule defined (every 5,000 km)
```

### B — Trip Planning + Tracking
```
- Driver assigned route: Riyadh → Jeddah delivery
- Pre-trip: vehicle inspection checklist
- Start: GPS tracking begins
- Real-time updates to dispatcher
- ETA notifications to customer
- Geofencing alerts (entered/left zone)
- End: arrival confirmed
```

### C — Fuel Tracking
```
- Fuel card (Aldrees, ADNOC) per vehicle
- Each fill-up: amount + odometer + cost auto-uploaded
- System calculates: fuel efficiency (L/100km)
- Anomaly detection: theft (fill-up but no km gained)
- Alerts on excess
```

### D — Preventive Maintenance
```
- Engine oil change every 5,000 km
- Vehicle at 24,800 km → alert at 25,000
- Service scheduled with provider
- Cost recorded
- Next due: 30,000 km
```

### E — Driver Behavior
```
- Telematics monitors:
  - Speed > limit
  - Harsh braking
  - Sharp turns
  - Idling > 10 min
- Driver scorecard
- Coaching for low scores
- Insurance discount for top drivers
```

### F — Insurance Renewal
```
- Insurance expiring 30 days
- Alert to fleet mgr
- Get quotes from 3 insurers
- Renew + upload policy
- Old policy archived
```

### G — Wasl / Mukamala Compliance (KSA)
```
- KSA requires GPS tracking for commercial fleets
- System integrates with TGA portal
- Automatic reports
- Compliance status visible
```

### H — Fuel Theft Detection
```
- Vehicle filled 60L
- Odometer didn't change
- Or: tank capacity 50L, recorded 60L (overfill?)
- Anomaly flagged
- Investigation
```

---

## 3. تدفق البيانات

```
[Trip Lifecycle]
POST /fleet/trips/start
   ↓ create FleetTrip
   ↓ start GPS tracking
   ↓ ETA calculated

GPS pings:
   ↓ update location every 30 sec
   ↓ check geofences
   ↓ alert on speed violations

POST /fleet/trips/:id/end
   ↓ finalize
   ↓ calculate distance, duration, fuel used
   ↓ update vehicle odometer
   ↓ post costs

[Maintenance Trigger]
Cron daily:
   ↓ for each vehicle:
     check odometer vs maintenance schedule
     if due → alert
     if overdue → critical alert
```

---

## 4. Schema (إضافات)

```prisma
model Vehicle {
  // ... existing
  vehicleNumber   String    @unique  // internal
  plateNumber     String    @unique
  vin             String    @unique
  
  make            String    // Toyota, Mercedes
  model           String
  year            Int
  color           String?
  vehicleType     String    // 'CAR' | 'TRUCK' | 'VAN' | 'BUS' | 'MOTORCYCLE' | 'TRAILER'
  category        String?   // 'COMPACT' | 'MIDSIZE' | 'FULL_SIZE' | 'HEAVY_DUTY'
  
  fuelType        String    // 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG'
  tankCapacity    Decimal?  @db.Decimal(8,2)
  fuelEfficiency  Decimal?  @db.Decimal(5,2)  // L/100km
  
  // Capacity
  passengerCapacity Int?
  cargoCapacityKg Decimal?  @db.Decimal(10,2)
  cargoVolumeM3   Decimal?  @db.Decimal(10,2)
  
  // Tracking
  currentOdometer Decimal   @db.Decimal(20,2)
  totalFuelConsumed Decimal @default(0) @db.Decimal(20,2)
  totalCostKm     Decimal?  @db.Decimal(20,4)
  
  // Documents
  istimaraExpiryDate DateTime?
  insuranceExpiryDate DateTime?
  inspectionExpiryDate DateTime?
  permitExpiryDate DateTime?
  
  // GPS
  gpsDeviceId     String?
  gpsLastSeenAt   DateTime?
  gpsLastLocation Json?
  
  // Driver
  primaryDriverId Int?
  
  // Status
  status          String    @default("ACTIVE")  // ACTIVE | IDLE | IN_TRIP | MAINTENANCE | OUT_OF_SERVICE | SOLD | TOTALED
  
  // Wasl
  waslTrackerId   String?
  
  // Cost
  acquisitionCost Decimal?  @db.Decimal(20,4)
  acquisitionDate DateTime?
  fixedAssetId    Int?      // link to FA
  
  documents       VehicleDocument[]
  insurances      VehicleInsurance[]
  trips           FleetTrip[]
  maintenances    VehicleMaintenance[]
  fuelLogs        FuelLog[]
}

model VehicleDocument {
  id              Int       @id @default(autoincrement())
  vehicleId       Int
  vehicle         Vehicle   @relation(fields: [vehicleId], references: [id])
  
  type            String    // 'ISTIMARA' | 'INSURANCE' | 'INSPECTION' | 'PERMIT' | 'OTHER'
  documentNumber  String?
  issueDate       DateTime
  expiryDate      DateTime
  fileUrl         String
  
  active          Boolean   @default(true)
}

model VehicleInsurance {
  id              Int       @id @default(autoincrement())
  vehicleId       Int
  vehicle         Vehicle   @relation(fields: [vehicleId], references: [id])
  
  policyNumber    String    @unique
  insurer         String
  type            String    // 'COMPREHENSIVE' | 'THIRD_PARTY'
  
  startDate       DateTime
  endDate         DateTime
  
  premium         Decimal   @db.Decimal(20,4)
  coverage        Decimal   @db.Decimal(20,4)
  deductible      Decimal?  @db.Decimal(20,4)
  
  documentUrl     String?
  
  active          Boolean   @default(true)
}

model Driver {
  id              Int       @id @default(autoincrement())
  employeeId      Int       @unique
  
  licenseNumber   String    @unique
  licenseType     String    // 'PRIVATE' | 'PUBLIC' | 'HEAVY_TRUCK' | 'BUS' | 'MOTORCYCLE'
  licenseIssueDate DateTime
  licenseExpiryDate DateTime
  licenseCountry  String    @default("SA")
  
  totalKmDriven   Decimal   @default(0) @db.Decimal(20,2)
  totalTrips      Int       @default(0)
  
  behaviorScore   Decimal?  @db.Decimal(5,2)  // 0-100
  
  violationsCount Int       @default(0)
  accidentsCount  Int       @default(0)
  
  status          String    @default("ACTIVE")  // ACTIVE | SUSPENDED | TERMINATED
  
  trips           FleetTrip[]
  violations      DriverViolation[]
  accidents       DriverAccident[]
}

model FleetTrip {
  // ... existing
  tripNumber      String    @unique
  vehicleId       Int
  vehicle         Vehicle   @relation(fields: [vehicleId], references: [id])
  driverId        Int
  driver          Driver    @relation(fields: [driverId], references: [id])
  
  type            String    @default("WORK")  // WORK | PERSONAL | DELIVERY | PICKUP
  
  startLocation   Json
  endLocation     Json?
  plannedRoute    Json?
  actualRoute     Json?     // GPS waypoints
  
  startOdometer   Decimal   @db.Decimal(20,2)
  endOdometer     Decimal?  @db.Decimal(20,2)
  distanceKm      Decimal?  @db.Decimal(20,2)
  
  startedAt       DateTime
  endedAt         DateTime?
  durationMin     Int?
  
  status          String    @default("PLANNED")  // PLANNED | IN_PROGRESS | COMPLETED | CANCELLED
  
  customerId      Int?      // for delivery
  salesOrderId    Int?      // link to SO
  
  fuelUsedL       Decimal?  @db.Decimal(8,2)
  fuelCost        Decimal?  @db.Decimal(20,4)
  totalCost       Decimal?  @db.Decimal(20,4)
  
  preTrip         Json?     // checklist
  postTrip        Json?
  
  events          FleetTripEvent[]
}

model FleetTripEvent {
  id              Int       @id @default(autoincrement())
  tripId          Int
  trip            FleetTrip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  
  type            String    // 'SPEEDING' | 'HARSH_BRAKE' | 'SHARP_TURN' | 'IDLE' | 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' | 'STOP'
  severity        String?   // 'LOW' | 'MEDIUM' | 'HIGH'
  
  location        Json
  speed           Decimal?  @db.Decimal(5,2)
  
  occurredAt      DateTime  @default(now())
}

model FuelLog {
  // ... existing
  vehicleId       Int
  vehicle         Vehicle   @relation(fields: [vehicleId], references: [id])
  
  fillDate        DateTime
  station         String?
  
  litersFilled    Decimal   @db.Decimal(8,2)
  pricePerLiter   Decimal   @db.Decimal(8,4)
  totalCost       Decimal   @db.Decimal(20,4)
  
  odometerAtFill  Decimal   @db.Decimal(20,2)
  fuelTypeUsed    String?
  
  fuelCardNumber  String?
  
  receiptUrl      String?
  
  paymentMethod   String    @default("FUEL_CARD")  // FUEL_CARD | CASH | OTHER
  
  driverId        Int?
  
  // Anomaly detection
  isAnomaly       Boolean   @default(false)
  anomalyReason   String?
  litersPerKm     Decimal?  @db.Decimal(8,4)
}

model VehicleMaintenance {
  id              Int       @id @default(autoincrement())
  vehicleId       Int
  vehicle         Vehicle   @relation(fields: [vehicleId], references: [id])
  
  type            String    // 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'OVERHAUL' | 'ACCIDENT'
  
  scheduledDate   DateTime?
  performedDate   DateTime?
  
  odometerAtService Decimal? @db.Decimal(20,2)
  
  serviceCenterName String?
  cost            Decimal?  @db.Decimal(20,4)
  
  description     String?   @db.Text
  partsReplaced   Json?
  
  nextDueOdometer Decimal?  @db.Decimal(20,2)
  nextDueDate     DateTime?
  
  status          String    @default("SCHEDULED")  // SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
  
  attachmentUrls  String[]
}

model DriverViolation {
  id              Int       @id @default(autoincrement())
  driverId        Int
  driver          Driver    @relation(fields: [driverId], references: [id])
  
  date            DateTime
  type            String    // 'SPEEDING' | 'PARKING' | 'TRAFFIC_LIGHT' | 'PHONE_USE' | 'OTHER'
  amount          Decimal?  @db.Decimal(10,2)
  paid            Boolean   @default(false)
  
  description     String?
  authorityRef    String?
}

model DriverAccident {
  id              Int       @id @default(autoincrement())
  driverId        Int
  driver          Driver    @relation(fields: [driverId], references: [id])
  vehicleId       Int
  
  accidentDate    DateTime
  location        Json
  
  type            String    // 'MINOR' | 'MAJOR' | 'TOTALED'
  faultParty      String?   // 'DRIVER' | 'OTHER' | 'BOTH' | 'UNDETERMINED'
  
  description     String    @db.Text
  damages         Decimal?  @db.Decimal(20,4)
  injuries        Boolean   @default(false)
  
  policeReportUrl String?
  insuranceClaimId String?
  
  status          String    @default("REPORTED")  // REPORTED | INVESTIGATING | RESOLVED | LITIGATED
}

model Geofence {
  id              Int       @id @default(autoincrement())
  name            String
  type            String    // 'ALLOWED' | 'RESTRICTED' | 'DEPOT' | 'CUSTOMER'
  shape           String    // 'CIRCLE' | 'POLYGON'
  data            Json      // geo coordinates
  active          Boolean   @default(true)
}
```

---

## 5. Forms (8)

A: Vehicle Master Wizard
B: Driver Setup
C: Trip Planning
D: Fuel Log Entry
E: Maintenance Scheduling
F: Insurance Renewal
G: Accident Report
H: Pre-trip Inspection Checklist

---

## 6. Tables (8)

A: Vehicles (with status + alerts)
B: Drivers (with scores)
C: Trips Live (real-time)
D: Fuel Log
E: Maintenance Schedule
F: Documents Expiring
G: Violations
H: Accidents

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-vehicle-add | + مركبة | 🟢 fleet mgr |
| btn-vehicle-out-of-service | إخراج من الخدمة | 🔴 fleet mgr |
| btn-vehicle-sell | بيع | 🔴 cfo |
| btn-document-upload | + وثيقة | 🟢 fleet |
| btn-insurance-renew | تجديد التأمين | 🟦 fleet |
| btn-driver-add | + سائق | 🟢 fleet |
| btn-driver-suspend | إيقاف | 🔴 fleet mgr + reason |
| btn-trip-start | بدء رحلة | 🟢 driver |
| btn-trip-end | إنهاء رحلة | 🟢 driver |
| btn-trip-cancel | إلغاء | 🔴 driver/dispatcher |
| btn-pre-trip-checklist | فحص ما قبل الرحلة | 🟢 driver |
| btn-track-live | تتبع مباشر | ⬜ dispatcher |
| btn-fuel-log | + تعبئة وقود | 🟢 driver |
| btn-fuel-anomaly-investigate | تحقيق تعبئة | 🟡 fleet mgr |
| btn-maintenance-schedule | + صيانة | 🟢 fleet |
| btn-maintenance-perform | تنفيذ | 🟢 fleet |
| btn-violation-record | + مخالفة | 🟢 fleet |
| btn-violation-pay | دفع | 🟦 fleet |
| btn-accident-report | + حادث | 🔴 fleet |
| btn-insurance-claim | مطالبة تأمين | 🟦 fleet mgr |
| btn-geofence-create | + جيو-فنس | 🟢 fleet mgr |
| btn-route-plan | + مسار | 🟢 dispatcher |
| btn-driver-score-recalc | إعادة حساب التقييم | ⬜ fleet mgr |
| btn-wasl-sync | مزامنة Wasl | 🟦 fleet mgr |
| btn-export-fleet | تصدير | ⬜ fleet |
| btn-fuel-card-assign | إسناد بطاقة وقود | 🟢 fleet |
| btn-vehicle-transfer | نقل بين فروع | 🟦 fleet |
| btn-driver-license-renew | تجديد رخصة | 🟦 fleet |

---

## 8. Search & Filters

- Vehicles: type, status, branch, doc expiring
- Drivers: status, score range, license expiry
- Trips: status, driver, vehicle, date
- Fuel: vehicle, date, anomaly
- Maintenance: type, status, due

---

## 9. Reports

- Fleet Utilization
- Cost per KM by Vehicle
- Fuel Efficiency
- Driver Behavior Scorecard
- Maintenance Cost Trend
- Insurance Claims History
- Vehicle TCO (Total Cost of Ownership)
- Accident Statistics
- Document Expiry Schedule
- Wasl Compliance Report

---

## 10. Dashboards

- KPIs: Active Vehicles / In Trip / Maintenance Due / Docs Expiring / Avg KM/L
- Charts: Fuel cost trend, Driver scores, Trip volume
- Lists: Live trips, Maintenance overdue, Anomalies

---

## 11. Notifications

- Document expiring (90/30/7d)
- Maintenance due
- Speed violation
- Geofence breach
- Trip started/ended
- Fuel anomaly
- Accident reported
- Insurance claim status

---

## 12. Permissions

| Action | Driver | Dispatcher | Fleet Mgr | CFO |
|--------|--------|-----------|-----------|-----|
| Start trip | ✓ | ✗ | ✗ | ✗ |
| End trip | ✓ | ✗ | ✗ | ✗ |
| Plan route | ✗ | ✓ | ✓ | ✗ |
| Add vehicle | ✗ | ✗ | ✓ | ✓ |
| Sell vehicle | ✗ | ✗ | ✗ | ✓ |
| Track live | ✗ | ✓ | ✓ | ✓ |
| Insurance | ✗ | ✗ | ✓ | ✓ |
| Driver score | view own | view team | ✓ | ✓ |

---

## 13. Integrations

- GPS providers (Wasl - KSA, Geotab, Samsara)
- Fuel cards (Aldrees, ADNOC)
- Insurance APIs
- Mukamala / TGA (KSA compliance)
- Saudi Traffic Police (Absher)
- Maintenance vendors

---

## 14. Shortcuts

- `Ctrl+T` New trip
- `Ctrl+F` Fuel log
- `Ctrl+M` Maintenance

---

## 15. Mobile / Print

- Driver app (start/end trip, fuel log, inspection)
- Dispatcher dashboard (live tracking)
- Print: vehicle card, trip summary

---

## 16. Audit

- Trips fully logged
- Maintenance history immutable
- Fuel logs with receipts
- Accident reports

---

## 17. Tests

```typescript
describe('Trip Lifecycle', () => { /* start, GPS, end */ })
describe('Fuel Anomaly', () => { /* theft detection */ })
describe('Maintenance Trigger', () => { /* km-based, time-based */ })
describe('Driver Score', () => { /* events affect score */ })
describe('Geofence', () => { /* enter/exit alerts */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| GPS offline mid-trip | log gap + use end-points |
| Fuel card stolen | block + alert |
| Driver license expired during trip | warn but don't block |
| Vehicle in maintenance, trip assigned | block |
| Multiple drivers same vehicle | one active trip at a time |
| Accident during trip | end trip + report flow |

---

**نهاية #34** • 8 سيناريوهات • 11 جداول • 8 forms • 8 grids • 28 button • 10 reports
