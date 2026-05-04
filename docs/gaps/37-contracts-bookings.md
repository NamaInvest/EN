# النقص #37: Sales Contracts + Performance Obligations + Bookings — مواصفات

> **المرجعيات:** SAP Contract & Lease Management、Oracle CPQ Contracts、DocuSign CLM、Ironclad、ContractWorks

---

## 1. البرومنت

```
ابني نظام Contracts + Bookings:

موجود: SalesContract, PerformanceObligation, ContractModificationRecord, Booking

النواقص:
A) Contract Lifecycle Management:
   - Templates + clauses library
   - Negotiation tracking
   - E-signature integration (DocuSign)
   - Version control
   - Renewals + auto-renewals
   - Termination workflow
B) Performance Obligations (IFRS 15):
   - Decomposition
   - Allocation by SSP
   - Recognition tracking
C) Bookings (Service appointments):
   - Calendar-based booking
   - Resource scheduling
   - Reminders
   - Deposit handling
D) Contract Discovery (AI):
   - Auto-extract terms
   - Clause categorization
   - Risk assessment
APIs (35+), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — SaaS Contract
```
1. Sales rep creates SaaS contract
2. Components:
   - License (12 months) - 60K
   - Implementation - 20K
   - Annual Support - 30K (renewable)
3. Auto-allocation per SSP
4. E-sign sent → customer signs
5. Implementation tracked → on completion: revenue recognized
6. Support: monthly recognition
7. Auto-renewal 30 days before expiry
```

### B — Service Contract Negotiation
```
- Initial draft sent
- Customer redlines (markup)
- Internal review (legal + finance)
- Counter-offer
- Final agreement
- All versions tracked
- Final e-signed
```

### C — Booking Service
```
- Customer books beauty salon appointment
- Selects: service, stylist, date+time
- Pays deposit (refundable)
- Reminder 24h + 2h before
- Service performed → balance paid
```

### D — Booking with Resources
```
- Hotel room booking
- Resources: room + bed type + view
- Block from inventory
- Confirmation sent
- Check-in/out
- Cancellation policy applied
```

### E — Contract Renewal
```
- Contract expires in 60 days
- Auto-notify account manager
- Renewal proposal generated (with price increase)
- Customer accepts/negotiates
- New contract auto-created
- Continuity of service
```

### F — Contract Termination
```
- Customer requests early termination
- Termination fees calculated (per clause)
- Approval: legal + CFO
- Final invoice generated
- Service stopped
- Documents archived
```

### G — Performance Obligation Tracking
```
- Each PO has its own progress
- Implementation: 60% complete
- Revenue recognized cumulative: 60% × allocated
- Support: monthly straight-line
- Dashboard view per contract
```

### H — AI Contract Review
```
- Upload signed contract PDF
- AI extracts: parties, dates, amounts, clauses
- Flags risks (unusual terms, missing clauses)
- Categorizes (auto-renewal, termination, IP)
- Searchable repository
```

---

## 3. تدفق البيانات

```
[Contract Creation]
POST /sales/contracts
   ↓ create SalesContract + POs
   ↓ allocate prices (SSP-based)
   ↓ generate document from template
   ↓ send for e-signature

[E-Signature Webhook]
POST /webhooks/docusign
   ↓ on signed → update contract.status=ACTIVE
   ↓ trigger billing
   ↓ trigger PO start

[Booking]
POST /bookings
   ↓ check resource availability
   ↓ block resource
   ↓ require deposit
   ↓ send confirmation
```

---

## 4. Schema (إضافات)

```prisma
model ContractTemplate {
  id              Int       @id @default(autoincrement())
  templateNumber  String    @unique
  name            String
  type            String    // 'SAAS' | 'SERVICE' | 'GOODS' | 'NDA' | 'LEASE' | 'EMPLOYMENT'
  content         String    @db.Text  // HTML with merge tags
  language        String    @default("ar")
  active          Boolean   @default(true)
}

model ContractClause {
  id              Int       @id @default(autoincrement())
  category        String    // 'PAYMENT' | 'TERMINATION' | 'IP' | 'WARRANTY' | 'INDEMNITY' | 'SLA' | 'NON_COMPETE'
  title           String
  content         String    @db.Text
  riskLevel       String?   // 'LOW' | 'MEDIUM' | 'HIGH'
  approvedByLegal Boolean   @default(false)
}

model SalesContract {
  // ... existing
  contractNumber  String    @unique
  templateId      Int?
  
  parties         Json      // [{role, name, signatoryEmail, signedAt}]
  
  description     String?   @db.Text
  
  effectiveFrom   DateTime
  effectiveTo     DateTime
  
  totalContractValue Decimal @db.Decimal(20,4)
  currency        String
  
  status          String    @default("DRAFT")  // DRAFT | UNDER_NEGOTIATION | PENDING_SIGNATURE | ACTIVE | EXPIRED | TERMINATED | RENEWED
  
  // Auto-renewal
  autoRenew       Boolean   @default(false)
  renewalNoticeDays Int?
  renewalTerms    Json?
  
  // Termination
  terminationClause String? @db.Text
  terminationFeePercent Decimal? @db.Decimal(5,2)
  
  // Version
  version         Int       @default(1)
  parentContractId Int?
  
  // Files
  signedDocumentUrl String?
  
  // E-signature
  esignProvider   String?   // 'DOCUSIGN' | 'INTERNAL'
  esignEnvelopeId String?
  
  // AI insights
  aiInsights      Json?
  riskScore       Int?
  
  performanceObligations PerformanceObligation[]
  modifications   ContractModificationRecord[]
  versions        SalesContractVersion[]
  signatures      ContractSignature[]
}

model SalesContractVersion {
  id              Int       @id @default(autoincrement())
  contractId      Int
  contract        SalesContract @relation(fields: [contractId], references: [id])
  
  versionNumber   Int
  changes         Json
  documentUrl     String
  createdAt       DateTime  @default(now())
  createdByUserId String
}

model ContractSignature {
  id              Int       @id @default(autoincrement())
  contractId      Int
  contract        SalesContract @relation(fields: [contractId], references: [id])
  
  partyName       String
  partyRole       String    // 'BUYER' | 'SELLER' | 'WITNESS'
  signatoryName   String
  signatoryEmail  String
  signatoryRole   String?
  
  signedAt        DateTime?
  ipAddress       String?
  
  status          String    @default("PENDING")  // PENDING | SIGNED | DECLINED | EXPIRED
}

model PerformanceObligation {
  // ... existing (covered in #10 revenue recognition)
}

model Booking {
  // ... existing
  bookingNumber   String    @unique
  customerId      Int
  
  serviceType     String    // 'APPOINTMENT' | 'EQUIPMENT' | 'ROOM' | 'EVENT'
  serviceId       Int?
  
  resourceId      Int?
  resourceName    String?
  
  startDateTime   DateTime
  endDateTime     DateTime
  
  numGuests       Int       @default(1)
  
  basePrice       Decimal   @db.Decimal(20,4)
  depositAmount   Decimal?  @db.Decimal(20,4)
  totalAmount     Decimal   @db.Decimal(20,4)
  paidAmount      Decimal   @default(0) @db.Decimal(20,4)
  
  status          String    @default("PENDING")  // PENDING | CONFIRMED | PAID_DEPOSIT | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
  
  cancellationDate DateTime?
  cancellationFee Decimal?  @db.Decimal(20,4)
  refundAmount    Decimal?  @db.Decimal(20,4)
  
  notes           String?
  specialRequests String?
  
  reminderSentAt  DateTime?
  
  invoiceId       Int?
}

model BookingResource {
  id              Int       @id @default(autoincrement())
  resourceCode    String    @unique
  name            String
  type            String    // 'PERSON' | 'EQUIPMENT' | 'ROOM' | 'TABLE' | 'VEHICLE'
  
  capacity        Int?
  
  availableHours  Json?     // {monday: ["09:00-12:00", "14:00-18:00"], ...}
  
  defaultDuration Int?      // minutes
  
  hourlyRate      Decimal?  @db.Decimal(20,4)
  
  active          Boolean   @default(true)
}

model BookingService {
  id              Int       @id @default(autoincrement())
  serviceCode     String    @unique
  name            String
  description     String?
  
  durationMinutes Int
  price           Decimal   @db.Decimal(20,4)
  
  resourceTypes   String[]  // which resources can deliver this
  
  active          Boolean   @default(true)
}
```

---

## 5. Forms (8)

A: Contract Builder (with template + clauses)
B: Performance Obligation Setup
C: Contract Modification
D: Renewal Proposal
E: Termination Workflow
F: Booking Form (calendar UI)
G: Resource Schedule Editor
H: E-signature Setup

---

## 6. Tables (8)

A: Contracts (with status + value)
B: Performance Obligations Status
C: Contract Calendar (renewals/expiries)
D: Bookings (calendar view)
E: Resource Availability
F: Modifications History
G: Signatures Status
H: Templates Library

---

## 7. Buttons (25+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-contract-create | + عقد | 🟢 sales |
| btn-contract-from-template | من قالب | 🟦 sales |
| btn-contract-redline | مراجعة | 🟡 legal |
| btn-contract-send-esign | إرسال للتوقيع | 🟦 sales |
| btn-contract-activate | تفعيل | 🟢 admin |
| btn-contract-modify | + تعديل | 🟡 sales/legal |
| btn-contract-renew | تجديد | 🟦 account mgr |
| btn-contract-auto-renew-toggle | تبديل auto-renew | 🟦 account mgr |
| btn-contract-terminate | إنهاء | 🔴 cfo + legal |
| btn-contract-archive | أرشفة | ⬜ admin |
| btn-template-create | + قالب | 🟢 legal |
| btn-clause-add | + بند | 🟢 legal |
| btn-clause-library | مكتبة البنود | ⬜ legal |
| btn-ai-extract | استخراج AI | 🟦 legal |
| btn-ai-risk-assess | تقييم AI للمخاطر | 🟦 legal |
| btn-po-add | + PO | 🟢 sales |
| btn-po-mark-complete | إكمال PO | 🟢 sales |
| btn-booking-create | + حجز | 🟢 customer/staff |
| btn-booking-confirm | تأكيد | 🟢 staff |
| btn-booking-cancel | إلغاء | 🔴 customer/staff + fee |
| btn-booking-no-show | تسجيل لم يحضر | 🟡 staff |
| btn-resource-create | + مورد | 🟢 admin |
| btn-resource-block | حظر فترة | 🟡 admin |
| btn-availability-check | فحص التوفر | ⬜ customer |
| btn-export-contracts | تصدير | ⬜ legal |

---

## 8. Search & Filters

- Contracts: status, type, expiring, value range, customer
- POs: status, recognition pattern, completion %
- Bookings: status, date range, resource, customer
- Templates: type, language

---

## 9. Reports

- Active Contracts Pipeline
- Renewal Schedule
- Contract Value (TCV)
- Termination Analysis
- Booking Utilization
- Resource Utilization
- E-signature Tracking
- Risk Assessment Summary
- Compliance Audit Trail

---

## 10. Dashboards

- KPIs: Active Contracts / TCV / Renewals 90d / Bookings Today / Resource Utilization
- Charts: Contract pipeline, Renewal forecast, Booking trends
- Lists: Expiring contracts, Pending signatures, Today's bookings

---

## 11. Notifications

- Contract sent for signature
- Customer signed
- Renewal due (90/30/7d)
- Auto-renewal triggered
- Booking confirmed
- Booking reminder
- Resource blocked
- E-sign expired

---

## 12. Permissions

| Action | Sales | Legal | Sales Mgr | Admin | Customer |
|--------|-------|-------|-----------|-------|----------|
| Create contract | ✓ | ✓ | ✓ | ✓ | ✗ |
| Modify clauses | ✗ | ✓ | ✗ | ✓ | ✗ |
| Approve template | ✗ | ✓ | ✗ | ✓ | ✗ |
| Activate contract | ✗ | ✓ | ✓ | ✓ | ✗ |
| Terminate | ✗ | ✓ | ✓ | ✓ | request |
| Book service | ✓ | ✗ | ✓ | ✓ | ✓ self |
| Block resource | ✗ | ✗ | ✗ | ✓ | ✗ |

---

## 13. Integrations

- DocuSign / SignNow / HelloSign
- Calendar (Google, Outlook)
- AI services (OpenAI, Gemini for clause extraction)
- Payment gateways (deposits)
- WhatsApp/Email (reminders)

---

## 14. Shortcuts

- `Ctrl+C` New contract
- `Ctrl+B` New booking
- `Ctrl+R` Renew

---

## 15. Mobile / Print

- Mobile: contract approve, booking
- Print: contract PDF, booking confirmation

---

## 16. Audit

- All contract versions
- Negotiation history
- Signatures with IP/timestamp
- Modifications immutable

---

## 17. Tests

```typescript
describe('Contract Lifecycle', () => { /* draft → signed → active */ })
describe('Renewal', () => { /* auto, manual */ })
describe('Termination', () => { /* fees calc */ })
describe('Booking', () => { /* availability, deposit, cancellation */ })
describe('Resource', () => { /* double-book prevention */ })
describe('AI Extraction', () => { /* terms, risk */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| E-signature expires | resend |
| Auto-renew but customer disputes | manual review |
| Termination during free trial | no fees |
| Booking outside available hours | reject |
| Resource overbook (race) | first-come |
| Contract amended after partial PO complete | recalculate |

---

**نهاية #37** • 8 سيناريوهات • 8 جداول • 8 forms • 8 grids • 25 button • 9 reports
