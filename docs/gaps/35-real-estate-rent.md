# النقص #35: Real Estate / Rent Module — مواصفات

> **المرجعيات:** SAP RE-FX، Yardi、AppFolio、Buildium、Ejar (KSA)

---

## 1. البرومنت

```
ابني نظام إدارة عقارات + إيجار:

موجود: LeaseContract (basic), rent API

النواقص:
A) Property Master (buildings → floors → units)
B) Tenant management
C) Rental contracts (Ejar-compliant for KSA)
D) Rent installments + auto-invoicing
E) Maintenance requests from tenants
F) Property inspections
G) Utility tracking (electricity, water)
H) Common area management
I) Vacancy tracking + listings
J) Owner statements (for property mgmt companies)
APIs (35+), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Property Setup
```
1. Building "Tower X" with:
   - 10 floors × 20 units = 200 units
   - Each unit: bedrooms, sqm, type (residential/commercial)
2. Common areas (parking, gym, pool)
3. Utilities (master meter + sub-meters)
4. Photos + documents
```

### B — Lease Contract (Ejar)
```
1. Tenant signs 1-year lease, 60K/year
2. Quarterly payments: 15K each
3. Security deposit: 5K (1 month)
4. Ejar registration (KSA mandatory)
5. Receive Ejar number
6. Auto-generate quarterly invoices
7. PDC checks accepted
```

### C — Rent Collection
```
- Cron 1st of quarter: invoice generated
- Tenant pays via STC Pay/SADAD
- Auto-receipted
- If overdue 30 days → late fee
- 60 days → eviction warning (per Ejar)
```

### D — Maintenance Request
```
- Tenant: AC not working
- Submits via portal/WhatsApp
- Ticket created → assigned to maintenance
- Technician dispatched
- Repair done → tenant confirms
- Cost: landlord pays (per contract)
```

### E — Lease Renewal
```
- Lease expiring 30 days
- Auto-notify tenant + landlord
- Renewal offer: same terms or +5%
- Tenant accepts → new contract
- New Ejar registration
```

### F — Vacancy Listing
```
- Unit becomes vacant
- Auto-listed on website + Aqar
- Inquiries tracked
- Showings scheduled
- Application + screening
```

### G — Inspection
```
- Move-in inspection: photos + checklist
- Mid-term (yearly)
- Move-out: compare to move-in
- Damages → deduct from deposit
```

### H — Owner Statement
```
- Property mgmt for owner
- Monthly statement:
  - Rent collected
  - Expenses (maintenance, utilities)
  - Mgmt fee (10%)
  - Net to owner
- Sent to owner with detail
```

---

## 3. تدفق البيانات

```
[Lease Contract]
POST /rent/contracts
   ↓ create LeaseContract
   ↓ create rent schedule
   ↓ register with Ejar (if KSA)
   ↓ block unit (status=OCCUPIED)

[Auto-invoicing Cron]
On schedule date:
   ↓ create invoice
   ↓ send to tenant (email + WhatsApp)
   ↓ track payment
```

---

## 4. Schema (إضافات)

```prisma
model Property {
  id              Int       @id @default(autoincrement())
  propertyCode    String    @unique
  name            String
  
  type            String    // 'BUILDING' | 'COMPOUND' | 'COMMERCIAL_TOWER' | 'VILLA' | 'LAND' | 'WAREHOUSE'
  
  address         String
  city            String
  district        String?
  countryCode     String    @default("SA")
  geoLocation     Json?
  
  totalUnits      Int       @default(0)
  totalAreaSqm    Decimal?  @db.Decimal(20,2)
  
  ownerId         Int?      // CrmAccount or external owner
  
  acquisitionDate DateTime?
  acquisitionCost Decimal?  @db.Decimal(20,4)
  
  // Common areas
  hasParking      Boolean   @default(false)
  parkingSpaces   Int?
  hasGym          Boolean   @default(false)
  hasPool         Boolean   @default(false)
  
  status          String    @default("ACTIVE")  // ACTIVE | UNDER_CONSTRUCTION | SOLD
  
  units           PropertyUnit[]
  expenses        PropertyExpense[]
}

model PropertyUnit {
  id              Int       @id @default(autoincrement())
  propertyId      Int
  property        Property  @relation(fields: [propertyId], references: [id])
  
  unitCode        String
  unitType        String    // 'RESIDENTIAL' | 'COMMERCIAL' | 'OFFICE' | 'RETAIL' | 'STORAGE' | 'PARKING'
  
  floor           Int?
  unitNumber      String?
  
  bedrooms        Int?
  bathrooms       Int?
  areaSqm         Decimal?  @db.Decimal(10,2)
  
  furnishedStatus String    @default("UNFURNISHED")  // UNFURNISHED | SEMI_FURNISHED | FULLY_FURNISHED
  
  expectedMonthlyRent Decimal? @db.Decimal(20,4)
  expectedAnnualRent Decimal?  @db.Decimal(20,4)
  
  status          String    @default("VACANT")  // VACANT | OCCUPIED | RESERVED | UNDER_RENOVATION | NOT_FOR_RENT
  
  currentLeaseId  Int?
  
  amenities       String[]
  photos          String[]
  
  contracts       RentContract[]
  inspections     UnitInspection[]
}

model Tenant {
  id              Int       @id @default(autoincrement())
  tenantCode      String    @unique
  
  type            String    // 'INDIVIDUAL' | 'COMPANY'
  
  fullName        String
  arabicName      String?
  
  nationalId      String?
  iqama           String?
  passport        String?
  commercialReg   String?
  
  phone           String
  email           String?
  
  occupants       Int       @default(1)
  
  guarantorName   String?
  guarantorPhone  String?
  
  contracts       RentContract[]
}

model RentContract {
  id              Int       @id @default(autoincrement())
  contractNumber  String    @unique
  ejarNumber      String?   @unique
  
  propertyUnitId  Int
  unit            PropertyUnit @relation(fields: [propertyUnitId], references: [id])
  
  tenantId        Int
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  startDate       DateTime
  endDate         DateTime
  durationMonths  Int
  
  monthlyRent     Decimal   @db.Decimal(20,4)
  totalRent       Decimal   @db.Decimal(20,4)
  currency        String    @default("SAR")
  
  paymentFrequency String   @default("QUARTERLY")  // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL
  
  securityDeposit Decimal?  @db.Decimal(20,4)
  utilityDeposit  Decimal?  @db.Decimal(20,4)
  
  rentIncrease    Decimal?  @db.Decimal(5,2)  // % yearly
  
  status          String    @default("ACTIVE")  // DRAFT | ACTIVE | TERMINATED | EXPIRED | RENEWED
  
  signedAt        DateTime?
  terminatedAt    DateTime?
  terminationReason String?
  
  ejarRegisteredAt DateTime?
  
  schedule        RentSchedule[]
  paymentsReceived RentPayment[]
}

model RentSchedule {
  id              Int       @id @default(autoincrement())
  contractId      Int
  contract        RentContract @relation(fields: [contractId], references: [id])
  
  installmentNumber Int
  dueDate         DateTime
  amount          Decimal   @db.Decimal(20,4)
  
  invoiceId       Int?
  paid            Boolean   @default(false)
  paidDate        DateTime?
  paidAmount      Decimal?  @db.Decimal(20,4)
  
  daysLate        Int?
  lateFee         Decimal?  @db.Decimal(20,4)
}

model RentPayment {
  id              Int       @id @default(autoincrement())
  contractId      Int
  contract        RentContract @relation(fields: [contractId], references: [id])
  
  amount          Decimal   @db.Decimal(20,4)
  paymentDate     DateTime
  method          String    // 'BANK_TRANSFER' | 'PDC' | 'CASH' | 'STC_PAY' | 'SADAD'
  
  scheduleIds     Int[]     // applied to which installments
  
  receivedByUserId String
  receiptUrl      String?
}

model UnitInspection {
  id              Int       @id @default(autoincrement())
  propertyUnitId  Int
  unit            PropertyUnit @relation(fields: [propertyUnitId], references: [id])
  
  type            String    // 'MOVE_IN' | 'MOVE_OUT' | 'PERIODIC' | 'COMPLAINT'
  
  inspectionDate  DateTime
  inspectorUserId String
  
  conditions      Json      // [{room, item, status, notes, photos}]
  
  damagesIdentified Boolean @default(false)
  damageCost      Decimal?  @db.Decimal(20,4)
  
  signedByTenantId Int?
  
  reportUrl       String?
}

model MaintenanceRequest {
  id              Int       @id @default(autoincrement())
  requestNumber   String    @unique
  propertyUnitId  Int?
  contractId      Int?
  
  category        String    // 'PLUMBING' | 'ELECTRICAL' | 'AC' | 'APPLIANCE' | 'STRUCTURAL' | 'OTHER'
  priority        String    @default("NORMAL")  // LOW | NORMAL | HIGH | EMERGENCY
  
  description     String    @db.Text
  photos          String[]
  
  reportedByTenantId Int?
  reportedAt      DateTime  @default(now())
  
  status          String    @default("OPEN")  // OPEN | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED
  
  assignedToUserId String?
  scheduledFor    DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  resolutionNotes String?
  cost            Decimal?  @db.Decimal(20,4)
  paidByLandlord  Boolean   @default(true)
  
  tenantSignOff   Boolean   @default(false)
}

model PropertyExpense {
  id              Int       @id @default(autoincrement())
  propertyId      Int
  property        Property  @relation(fields: [propertyId], references: [id])
  
  category        String    // 'MAINTENANCE' | 'UTILITIES' | 'INSURANCE' | 'TAX' | 'MGMT_FEE' | 'CLEANING' | 'SECURITY'
  
  amount          Decimal   @db.Decimal(20,4)
  date            DateTime
  description     String?
  
  vendorId        Int?
  invoiceUrl      String?
}

model OwnerStatement {
  id              Int       @id @default(autoincrement())
  propertyId      Int
  ownerId         Int
  
  periodStart     DateTime
  periodEnd       DateTime
  
  rentCollected   Decimal   @db.Decimal(20,4)
  expenses        Decimal   @db.Decimal(20,4)
  managementFee   Decimal   @db.Decimal(20,4)
  netToOwner      Decimal   @db.Decimal(20,4)
  
  details         Json
  pdfUrl          String?
  
  paidToOwnerAt   DateTime?
}

model UtilityMeter {
  id              Int       @id @default(autoincrement())
  propertyId      Int
  unitId          Int?
  
  type            String    // 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET'
  meterNumber     String
  
  currentReading  Decimal?  @db.Decimal(20,4)
  lastReadingDate DateTime?
  
  isMaster        Boolean   @default(false)
}
```

---

## 5. Forms (8)

A: Property Setup (with units bulk)
B: Unit Detail Editor
C: Tenant Registration
D: Rent Contract Wizard
E: Maintenance Request
F: Inspection Form (move-in/move-out)
G: Owner Statement
H: Lease Renewal

---

## 6. Tables (8)

A: Properties + Vacancy Status
B: Units (per property)
C: Tenants
D: Active Contracts
E: Rent Schedule (upcoming)
F: Maintenance Requests
G: Inspections
H: Owner Statements

---

## 7. Buttons (25+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-property-add | + عقار | 🟢 property mgr |
| btn-unit-add | + وحدة | 🟢 property mgr |
| btn-unit-list-vacancy | إدراج للإيجار | 🟦 marketing |
| btn-tenant-register | + مستأجر | 🟢 property |
| btn-contract-create | + عقد | 🟢 property |
| btn-contract-ejar-register | تسجيل في إيجار | 🟦 property mgr |
| btn-contract-renew | تجديد | 🟦 property |
| btn-contract-terminate | إنهاء | 🔴 property mgr + reason |
| btn-rent-invoice-generate | + فاتورة | 🟦 finance |
| btn-rent-payment-record | + دفعة | 🟢 finance |
| btn-rent-late-fee | إضافة رسوم تأخير | 🟡 finance |
| btn-maintenance-request | + طلب صيانة | 🟢 tenant |
| btn-maintenance-assign | إسناد | 🟦 property mgr |
| btn-maintenance-complete | إنجاز | 🟢 technician |
| btn-inspection-create | + معاينة | 🟢 inspector |
| btn-inspection-sign-off | توقيع | 🟢 tenant |
| btn-deposit-refund | استرداد التأمين | 🟦 finance + property mgr |
| btn-deposit-deduct | خصم من التأمين | 🟡 property mgr + reason |
| btn-eviction-notice | إشعار إخلاء | 🔴 cfo + legal |
| btn-owner-statement | + كشف مالك | 🟦 finance |
| btn-utility-reading-record | تسجيل قراءة | 🟢 facility |
| btn-utility-bill-allocate | توزيع الفواتير | 🟦 finance |
| btn-photos-upload | رفع صور | 🟢 property |
| btn-export-portfolio | تصدير المحفظة | ⬜ property mgr |
| btn-vacancy-listing-export | تصدير قوائم الإيجار | ⬜ marketing |

---

## 8. Search & Filters

- Properties: type, status, occupancy
- Units: vacancy, type, beds/baths, rent range
- Contracts: status, expiring, tenant
- Maintenance: category, priority, status

---

## 9. Reports

- Occupancy Rate
- Rent Roll (current contracts)
- Aging (overdue rent)
- Maintenance Cost per Property
- Vacancy Analysis
- Owner Statements
- Lease Expiry Calendar
- Profitability per Property
- Utility Cost Analysis

---

## 10. Dashboards

- KPIs: Occupancy % / Rent MTD / Maintenance Open / Vacancy Days
- Charts: Occupancy trend, Rent collection
- Lists: Expiring contracts, Vacant units, Maintenance overdue

---

## 11. Notifications

- Rent due (tenant)
- Rent overdue
- Lease expiring (90/30/7d)
- Maintenance request received
- Maintenance scheduled
- Inspection due
- Eviction notice
- Owner statement available

---

## 12. Permissions

| Action | Tenant | Property | Mgr | Finance |
|--------|--------|----------|-----|---------|
| Submit maintenance | ✓ | ✓ | ✓ | ✗ |
| View own contract | ✓ | ✗ | ✓ | ✓ |
| Create contract | ✗ | ✓ | ✓ | ✗ |
| Terminate | ✗ | ✗ | ✓ | ✓ |
| Pay rent | ✓ | ✗ | ✓ | ✓ |
| Inspections | ✗ | ✓ | ✓ | ✗ |
| Owner statements | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Ejar (KSA) - mandatory rental registration
- Aqar.com - listings
- SADAD / STC Pay (payments)
- Saudi Electricity / NWC (utility data)
- Maintenance vendors

---

## 14. Shortcuts

- `Ctrl+P` New property
- `Ctrl+T` New tenant
- `Ctrl+C` New contract

---

## 15. Mobile / Print

- Tenant app (rent + maintenance)
- Inspector tablet (photos + checklist)
- Print: lease contract, inspection report

---

## 16. Audit

- Contract changes versioned
- Inspection records immutable
- Deposit deductions require justification
- Owner statements traceable

---

## 17. Tests

```typescript
describe('Lease Lifecycle', () => { /* create, renew, terminate */ })
describe('Rent Schedule', () => { /* monthly/quarterly */ })
describe('Late Fees', () => { /* calculation */ })
describe('Maintenance', () => { /* lifecycle */ })
describe('Inspection', () => { /* damage detection */ })
describe('Ejar', () => { /* registration */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Tenant pays > due | apply to next + credit |
| Eviction during dispute | legal process |
| Property sold mid-lease | new owner inherits |
| Multiple tenants per unit | joint contract |
| Mid-month termination | pro-rate |

---

**نهاية #35** • 8 سيناريوهات • 11 جداول • 8 forms • 8 grids • 25 button • 9 reports
