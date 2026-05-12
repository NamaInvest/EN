# Schema Delta Proposal — Gaps Filling

> تغييرات الـ schema المطلوبة لتفعيل كامل الميزات الـ10.
> ⚠️ لم تُطبَّق بعد. راجعها ووافق عليها قبل التطبيق.
> كل التغييرات additive (لا حذف، لا إعادة تسمية).

## كيفية التطبيق

1. انسخ الكتل التالية إلى `prisma/schema.prisma`
2. شغّل: `npx prisma migrate dev --name gaps_2026_05`
3. تحقق من generated SQL في `prisma/migrations/{timestamp}_gaps_2026_05/migration.sql`

---

## 1. Anomaly Detection — AuditFinding (إن لم يوجد)

```prisma
model AuditFinding {
  id           String   @id @default(cuid())
  tenantId     String
  source       String   // 'ANOMALY_DETECTION', 'MANUAL', 'EXTERNAL_AUDIT'
  sourceRef    String?  // detector name + entity id
  severity     String   // INFO | LOW | MEDIUM | HIGH | CRITICAL
  title        String
  description  String?  @db.Text
  evidence     Json?
  status       String   @default("OPEN")  // OPEN | INVESTIGATING | RESOLVED | DISMISSED
  resolution   String?  // ACCEPTED | REVERSED | CORRECTED | DUPLICATE
  resolvedById String?
  resolvedAt   DateTime?
  detectedAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([tenantId, status, severity])
  @@index([tenantId, detectedAt])
  @@index([tenantId, source])
}
```

## 2. Demand Forecast v2

```prisma
model DemandForecastV2 {
  id            String   @id @default(cuid())
  tenantId      String
  productId     String
  warehouseId   String
  forecastDate  DateTime
  horizonDays   Int
  p50           Decimal  @db.Decimal(15, 4)
  p90           Decimal  @db.Decimal(15, 4)
  p99           Decimal  @db.Decimal(15, 4)
  lowerBound    Decimal  @db.Decimal(15, 4)
  upperBound    Decimal  @db.Decimal(15, 4)
  modelVersion  String
  mape          Decimal? @db.Decimal(6, 4)
  fittedAt      DateTime @default(now())
  
  @@unique([tenantId, productId, warehouseId, forecastDate])
  @@index([tenantId, productId, warehouseId, forecastDate])
}
```

## 3. ESG / Sustainability

```prisma
model EmissionLog {
  id            String   @id @default(cuid())
  tenantId      String
  date          DateTime
  scope         Int      // 1, 2, or 3
  factorKey     String
  qty           Decimal  @db.Decimal(15, 4)
  unit          String
  kgCO2e        Decimal  @db.Decimal(15, 4)
  factorSource  String
  branchId      String?
  vendorId      String?
  productId     String?
  reference     String?
  createdAt     DateTime @default(now())
  
  @@index([tenantId, date])
  @@index([tenantId, scope, date])
  @@index([tenantId, branchId, date])
}

model EnergyConsumption {
  id         String   @id @default(cuid())
  tenantId   String
  branchId   String
  date       DateTime
  source     String   // GRID, SOLAR, DIESEL_GENERATOR
  kwh        Decimal  @db.Decimal(15, 4)
  cost       Decimal? @db.Decimal(15, 4)
  createdAt  DateTime @default(now())
  
  @@unique([tenantId, branchId, date, source])
  @@index([tenantId, branchId, date])
}

model WaterConsumption {
  id         String   @id @default(cuid())
  tenantId   String
  branchId   String
  date       DateTime
  m3         Decimal  @db.Decimal(15, 4)
  cost       Decimal? @db.Decimal(15, 4)
  
  @@unique([tenantId, branchId, date])
}

model WasteLog {
  id          String   @id @default(cuid())
  tenantId    String
  branchId    String
  date        DateTime
  type        String   // HAZARDOUS | RECYCLABLE | GENERAL | ORGANIC
  kg          Decimal  @db.Decimal(15, 4)
  disposal    String?  // LANDFILL | RECYCLING | INCINERATION | COMPOSTING
  
  @@index([tenantId, date, type])
}

model SustainabilityGoal {
  id            String   @id @default(cuid())
  tenantId      String
  kpi           String   // EMISSIONS_TOTAL | EMISSIONS_INTENSITY | ENERGY_RENEWABLE_PERCENT | ...
  targetValue   Decimal  @db.Decimal(15, 4)
  baselineValue Decimal  @db.Decimal(15, 4)
  baselineDate  DateTime
  targetDate    DateTime
  unit          String
  active        Boolean  @default(true)
  
  @@index([tenantId, active])
}

model DiversitySnapshot {
  id              String   @id @default(cuid())
  tenantId        String
  date            DateTime
  totalEmployees  Int
  female          Int
  male            Int
  saudiNationals  Int
  expats          Int
  disability      Int
  nationalitiesJson Json
  
  @@unique([tenantId, date])
}
```

## 4. EVM (Earned Value)

```prisma
model EVMSnapshot {
  id           String   @id @default(cuid())
  tenantId     String
  projectId    String
  asOfDate     DateTime
  BAC          Decimal  @db.Decimal(15, 4)
  PV           Decimal  @db.Decimal(15, 4)
  EV           Decimal  @db.Decimal(15, 4)
  AC           Decimal  @db.Decimal(15, 4)
  CV           Decimal  @db.Decimal(15, 4)
  SV           Decimal  @db.Decimal(15, 4)
  CPI          Decimal  @db.Decimal(8, 4)
  SPI          Decimal  @db.Decimal(8, 4)
  EAC_classic  Decimal  @db.Decimal(15, 4)
  ETC          Decimal  @db.Decimal(15, 4)
  VAC          Decimal  @db.Decimal(15, 4)
  TCPI         Decimal  @db.Decimal(8, 4)
  percentComplete Decimal @db.Decimal(8, 4)
  health       String   // GREEN | YELLOW | RED
  forecastCompletionDate DateTime
  createdAt    DateTime @default(now())
  
  @@unique([tenantId, projectId, asOfDate])
  @@index([tenantId, projectId])
}
```

## 5. ABC Costing

```prisma
model ActivityPool {
  id                String   @id @default(cuid())
  tenantId          String
  name              String
  driver            String   // 'machine_hours', 'setups', 'inspections'
  totalCost         Decimal  @db.Decimal(15, 4)
  totalDriverUnits  Decimal  @db.Decimal(15, 4)
  period            DateTime
  active            Boolean  @default(true)
  
  @@unique([tenantId, name, period])
  @@index([tenantId, period])
}

model ProductActivityConsumption {
  id              String   @id @default(cuid())
  tenantId        String
  productId       String
  activityPoolId  String
  driverConsumed  Decimal  @db.Decimal(15, 4)
  period          DateTime
  
  @@index([tenantId, period])
  @@index([productId])
}
```

## 6. Customer Portal v2

```prisma
model SavedPaymentMethod {
  id            String   @id @default(cuid())
  tenantId      String
  customerId    String
  type          String   // CARD | WALLET
  gatewayToken  String   // encrypted by gateway
  last4         String
  brand         String   // VISA | MASTERCARD | MADA | APPLE_PAY | STC_PAY
  expiryMonth   Int
  expiryYear    Int
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  @@index([tenantId, customerId])
  @@unique([tenantId, customerId, gatewayToken])
}

model DisputeCase {
  id              String   @id @default(cuid())
  tenantId        String
  customerId      String
  invoiceId       String
  reason          String
  disputedAmount  Decimal  @db.Decimal(15, 4)
  status          String   // OPEN | INVESTIGATING | RESOLVED | DISMISSED
  resolution      String?
  attachmentsJson Json?
  submittedBy     String   // 'CUSTOMER_PORTAL' | 'INTERNAL'
  submittedAt     DateTime @default(now())
  resolvedAt      DateTime?
  
  @@index([tenantId, status])
  @@index([customerId])
}
```

## 7. Vendor Portal v2

```prisma
model PoAcknowledgment {
  id              String   @id @default(cuid())
  tenantId        String
  poId            String
  vendorId        String
  acknowledgedAt  DateTime @default(now())
  promisedDate    DateTime
  ackQtyJson      Json?
  notes           String?
  
  @@unique([poId])
  @@index([tenantId, vendorId])
}

model AdvanceShipNotice {
  id             String   @id @default(cuid())
  tenantId       String
  poId           String
  vendorId       String
  packagesJson   Json
  containerNo    String?
  carrier        String?
  trackingNumber String?
  etd            DateTime
  eta            DateTime
  status         String   // SHIPPED | IN_TRANSIT | ARRIVED | RECEIVED
  submittedAt    DateTime @default(now())
  
  @@index([tenantId, poId])
  @@index([tenantId, vendorId, status])
}

model VendorOnboardingStep {
  id           String   @id @default(cuid())
  tenantId     String
  vendorId     String
  step         String   // LEGAL_INFO | BANKING_DETAILS | ...
  data         Json
  status       String   // PENDING | COMPLETED | REJECTED
  submittedAt  DateTime?
  reviewedById String?
  reviewedAt   DateTime?
  
  @@unique([vendorId, step])
  @@index([tenantId, vendorId])
}
```

## 8. (already exists) InvoiceCapture — لا تغيير

## 9. (already exists) GoodsReceiptNote — add `asnId` و `expectedArrivalDate`

```prisma
// Add to existing GoodsReceiptNote model:
asnId               String?
expectedArrivalDate DateTime?
rejectionQty        Decimal? @db.Decimal(15, 4)

@@index([asnId])
```

## 10. (already exists) PurchaseOrder — add `promisedDate`

```prisma
// Add to existing PurchaseOrder model:
promisedDate DateTime?
```

## 11. (already exists) PurchaseInvoice — add `hasException`

```prisma
// Add to existing PurchaseInvoice model:
hasException Boolean @default(false)
```

---

## Materialized Views للـ OLAP Cube

تشغيل في الـ migration:

```sql
-- Run AFTER schema applied
-- See src/lib/gaps/olap-cube-engine.ts → getCubeMatviewsSQL()
-- Includes 5 matviews + indexes

CREATE EXTENSION IF NOT EXISTS pg_cron;
-- See getCubeRefreshSQL() for schedules
```

---

## ملاحظات على التطبيق

1. **Backward compatibility**: كل الإضافات اختيارية. الـ APIs الموجودة لن تتأثر.
2. **Rollback**: لو لزم، احذف فقط الجداول الجديدة (لا تتأثر بياناتك القديمة).
3. **Multi-tenant safety**: كل model يحتوي `tenantId` + indexed.
4. **Data types**: كل المبالغ بـ `Decimal(15, 4)` — لا Float.
5. **Audit**: الـ AuditFinding يُستخدم من قبل anomaly detection و سيُستخدم لاحقاً من الـ governance engine.
