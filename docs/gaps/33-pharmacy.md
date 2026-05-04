# النقص #33: Pharmacy Module — مواصفات

> **المرجعيات:** SAP Industry for Healthcare、Oracle Healthcare، PrimeRx、SFDA (KSA)、Wahed Pharmacy

---

## 1. البرومنت

```
وسّع Pharmacy Module:

موجود: PharmacyDrug, PharmacyPatient, PrescriptionItem, ControlledDrugLog, drug-interactions API

النواقص:
A) Drug Master with SFDA compliance
B) Prescription management (electronic + paper)
C) Drug-Drug interaction checks
D) Allergy + contraindications
E) Insurance integration (NPHIES, BUPA, Tawuniya)
F) Controlled substance tracking (FDA 21 CFR Part 1304)
G) Refill management
H) Dosing calculations (pediatric, weight-based)
I) Compounding
J) Vaccinations
K) Patient counseling records
L) Pharmacy POS

APIs (35+), UI (12 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Prescription Fulfillment
```
1. Patient brings prescription
2. Pharmacist scans/enters
3. System checks:
   - Patient allergies
   - Drug-drug interactions
   - Insurance coverage
4. Counseling provided
5. Dispensing
6. Insurance claim submitted
```

### B — Controlled Substance
```
- Class C drug (e.g., morphine)
- Requires double sign-off (pharmacist + witness)
- Logged in ControlledDrugLog
- Inventory reconciliation daily
- Police report on theft/loss
```

### C — Insurance Pre-Auth
```
- Expensive medication
- Submit pre-auth to insurance
- Get approval/denial
- Co-pay calculated
- Patient pays only co-pay
```

### D — Refill
```
- Patient calls for refill
- System validates: still authorized + days supply remaining
- If running out → notify prescriber
- Auto-fill option
```

### E — Drug Recall
```
- Manufacturer recalls batch
- /pharmacy/recall → enter batch
- System lists all dispensed
- Notify all affected patients
- Replace + reverse insurance
```

### F — Patient Counseling
```
- HIPAA-style: pharmacist counsels patient
- Documents: dosage, side effects, interactions
- Recorded in patient file
- Patient signs acknowledgement
```

### G — Compounding
```
- Doctor orders custom dose (50mg from 100mg tablet)
- Pharmacist compounds (split, mix)
- Records ingredients + lot numbers
- Quality check
- Label generated
```

### H — Vaccination
```
- Flu vaccine offered
- Patient consent + screening
- Administered
- Recorded in patient + national registry (KSA)
- Insurance claim
```

---

## 3. تدفق البيانات

```
[Prescription Entry]
POST /pharmacy/prescriptions { patientId, drugs[] }
   ↓ allergy check
   ↓ interaction check
   ↓ insurance check
   ↓ create Prescription
   ↓ on dispense → reduce inventory + update patient

[Insurance Claim]
POST /pharmacy/insurance/claim
   ↓ submit to NPHIES (KSA) or insurer
   ↓ track status
   ↓ on approval → bill insurer + patient co-pay
```

---

## 4. Schema (إضافات)

```prisma
model PharmacyDrug {
  // ... existing
  drugCode        String    @unique
  
  brandName       String
  genericName     String
  strength        String
  form            String    // 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'CREAM' | etc.
  manufacturer    String
  
  sfdaNumber      String?   // SFDA registration
  ndcCode         String?   // National Drug Code
  
  drugClass       String    // 'OTC' | 'Rx' | 'CONTROLLED_C' | 'CONTROLLED_B' | 'CONTROLLED_A' | 'NARCOTIC'
  
  atcCode         String?   // Anatomical Therapeutic Chemical
  
  prescriptionRequired Boolean @default(false)
  
  storageConditions String?  // "2-8°C" | "Room temp" | "Below 25°C"
  
  pregnancyCategory String? // 'A' | 'B' | 'C' | 'D' | 'X'
  pediatricUseAllowed Boolean @default(true)
  
  maxDailyDose    String?
  unitOfMeasure   String?
  
  insurancePrice  Decimal?  @db.Decimal(20,4)
  cashPrice       Decimal   @db.Decimal(20,4)
  
  active          Boolean   @default(true)
  
  interactions    DrugInteraction[]
  allergens       String[]
}

model DrugInteraction {
  id              Int       @id @default(autoincrement())
  drugAId         Int
  drugA           PharmacyDrug @relation("DrugA", fields: [drugAId], references: [id])
  drugBId         Int
  
  severity        String    // 'CONTRAINDICATED' | 'MAJOR' | 'MODERATE' | 'MINOR'
  description     String    @db.Text
  recommendation  String    @db.Text
  source          String?
  
  @@unique([drugAId, drugBId])
}

model PharmacyPatient {
  // ... existing
  patientCode     String    @unique
  
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  gender          String
  
  nationalId      String?
  
  phone           String?
  email           String?
  address         String?
  
  weight          Decimal?  @db.Decimal(5,2)
  height          Decimal?  @db.Decimal(5,2)
  
  bloodType       String?
  
  pregnancyStatus String?
  breastfeeding   Boolean?
  
  allergies       String[]
  chronicConditions String[]
  currentMedications Json?
  
  insurancePolicyId Int?
  primaryDoctorName String?
  primaryDoctorPhone String?
  
  prescriptions   Prescription[]
  vaccinations    Vaccination[]
}

model Prescription {
  id              Int       @id @default(autoincrement())
  prescriptionNumber String @unique
  patientId       Int
  patient         PharmacyPatient @relation(fields: [patientId], references: [id])
  
  prescribingDoctor String
  doctorLicense   String?
  prescriptionDate DateTime
  
  status          String    @default("ACTIVE")  // ACTIVE | DISPENSED | PARTIALLY_FILLED | EXPIRED | CANCELLED
  
  refillsAllowed  Int       @default(0)
  refillsUsed     Int       @default(0)
  
  validUntil      DateTime?
  
  insuranceClaimId Int?
  
  items           PrescriptionItem[]
}

model PrescriptionItem {
  // ... existing
  prescriptionId  Int
  prescription    Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  
  drugId          Int
  drug            PharmacyDrug @relation(fields: [drugId], references: [id])
  
  quantityPrescribed Int
  daysSupply      Int
  
  dosage          String    // "1 tablet"
  frequency       String    // "twice daily"
  duration        String    // "10 days"
  instructions    String?
  
  dispensedQty    Int       @default(0)
  dispensedAt     DateTime?
  dispensedByPharmacistId Int?
  
  warningsGiven   Boolean   @default(false)
  counseledAt     DateTime?
}

model ControlledDrugLog {
  // ... existing
  drugId          Int
  
  type            String    // 'RECEIVED' | 'DISPENSED' | 'WASTED' | 'TRANSFERRED' | 'INVENTORY_COUNT'
  quantity        Decimal   @db.Decimal(20,4)
  
  patientId       Int?
  prescriptionId  Int?
  
  pharmacistId    Int
  witnessId       Int?
  
  serialNumber    String?
  batchNumber     String?
  
  reason          String?
  
  loggedAt        DateTime  @default(now())
}

model InsurancePolicy {
  id              Int       @id @default(autoincrement())
  patientId       Int
  policyNumber    String
  insurer         String    // 'BUPA' | 'TAWUNIYA' | 'MEDGULF' | etc.
  policyType      String
  
  startDate       DateTime
  endDate         DateTime?
  
  coverageDetails Json?
  copayPercent    Decimal?  @db.Decimal(5,2)
  
  active          Boolean   @default(true)
}

model InsuranceClaim {
  id              Int       @id @default(autoincrement())
  claimNumber     String    @unique
  patientId       Int
  prescriptionId  Int?
  
  insurer         String
  policyNumber    String
  
  totalAmount     Decimal   @db.Decimal(20,4)
  patientCopay    Decimal   @db.Decimal(20,4)
  insurerAmount   Decimal   @db.Decimal(20,4)
  
  status          String    @default("SUBMITTED")  // SUBMITTED | PRE_AUTH_REQUESTED | APPROVED | DENIED | PAID
  
  preAuthCode     String?
  rejectionReason String?
  
  submittedAt     DateTime  @default(now())
  approvedAt      DateTime?
  paidAt          DateTime?
}

model Vaccination {
  id              Int       @id @default(autoincrement())
  patientId       Int
  patient         PharmacyPatient @relation(fields: [patientId], references: [id])
  
  vaccineName     String
  vaccineCode     String
  manufacturer    String
  batchNumber     String
  
  doseNumber      Int       // 1, 2, 3 (booster)
  dosage          String
  route           String    // 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'ORAL'
  site            String?   // 'LEFT_DELTOID' | etc.
  
  administeredAt  DateTime
  administeredByPharmacistId Int
  
  reactionsObserved String?
  
  reportedToRegistry Boolean @default(false)
  registryId      String?
}

model Compound {
  id              Int       @id @default(autoincrement())
  prescriptionItemId Int
  
  ingredients     Json      // [{drugId, quantity, lot}]
  finalQuantity   Decimal   @db.Decimal(20,4)
  
  preparedByPharmacistId Int
  qcCheckedByPharmacistId Int?
  
  labelUrl        String?
  
  preparedAt      DateTime  @default(now())
  qcCheckedAt     DateTime?
}

model PatientCounselingRecord {
  id              Int       @id @default(autoincrement())
  patientId       Int
  prescriptionItemId Int?
  
  pharmacistId    Int
  
  topicsCovered   String[]
  durationMinutes Int?
  patientUnderstanding String? // 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  
  patientSignature String?
  
  occurredAt      DateTime  @default(now())
}
```

---

## 5. Forms (8)

A: Drug Master Entry
B: Patient Registration
C: Prescription Entry
D: Dispense (with checks)
E: Insurance Claim Submission
F: Vaccination Record
G: Compounding Recipe
H: Counseling Record

---

## 6. Tables (8)

A: Drug Catalog
B: Patient List
C: Prescriptions Active
D: Controlled Drug Log
E: Insurance Claims
F: Recall Affected Patients
G: Vaccination Records
H: Inventory Status

---

## 7. Buttons (25+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-drug-add | + دواء | 🟢 pharmacist |
| btn-drug-update-sfda | تحديث SFDA | 🟦 pharmacist mgr |
| btn-patient-register | + مريض | 🟢 pharmacist |
| btn-prescription-enter | + روشتة | 🟢 pharmacist |
| btn-prescription-scan | مسح روشتة | 🟦 pharmacist |
| btn-allergy-check | فحص الحساسية | ⬜ pharmacist |
| btn-interaction-check | فحص التداخل | ⬜ pharmacist |
| btn-dispense | صرف | 🟢 pharmacist |
| btn-controlled-dispense | صرف مراقب | 🔴 pharmacist + witness |
| btn-refill | إعادة صرف | 🟢 pharmacist |
| btn-counseling-record | سجل التوعية | 🟢 pharmacist |
| btn-insurance-preauth | طلب pre-auth | 🟦 pharmacist |
| btn-insurance-claim | إرسال مطالبة | 🟦 pharmacist |
| btn-recall-process | معالجة استدعاء | 🔴 pharmacist mgr |
| btn-recall-notify-patients | تنبيه المرضى | 🟦 pharmacist mgr |
| btn-compound-prepare | تحضير compound | 🟢 pharmacist |
| btn-compound-qc | فحص الجودة | 🟢 senior pharmacist |
| btn-vaccinate | تطعيم | 🟢 pharmacist |
| btn-vaccine-report-registry | تبليغ السجل | 🟦 pharmacist |
| btn-controlled-inventory-count | جرد المراقب | 🔴 pharmacist mgr |
| btn-narcotic-report | تقرير المخدرات | 🔴 pharmacist mgr |
| btn-loss-report-police | تبليغ الشرطة | 🔴 pharmacist mgr |
| btn-print-label | طباعة label | ⬜ pharmacist |
| btn-print-prescription | طباعة | ⬜ pharmacist |
| btn-export-controlled-log | تصدير | ⬜ pharmacist mgr |

---

## 8. Search & Filters

- Drugs: name, class, SFDA, expiring, low stock
- Patients: name, phone, allergies
- Prescriptions: status, date, doctor
- Controlled: drug, patient, date

---

## 9. Reports

- Drug Sales Report
- Top Prescribed Drugs
- Insurance Claims Status
- Controlled Substances Daily
- Expiry Pipeline
- Patient Medication History
- Vaccination Coverage
- Recall Tracking

---

## 10. Dashboards

- KPIs: Today's Prescriptions / Insurance Claims / Controlled / Expiring / Stockouts
- Charts: Top drugs, Insurance approval rate
- Lists: Refills due, Expiring soon, Recalls active

---

## 11. Notifications

- Prescription ready
- Insurance approved/denied
- Refill due
- Drug recall
- Stock low
- Controlled inventory variance
- Vaccination reminder

---

## 12. Permissions

| Action | Pharmacist | Senior | Mgr | Doctor |
|--------|-----------|--------|-----|--------|
| Dispense | ✓ | ✓ | ✓ | ✗ |
| Controlled dispense | ✓ + witness | ✓ + witness | ✓ + witness | ✗ |
| Compound | ✓ | ✓ | ✓ | ✗ |
| QC compound | ✗ | ✓ | ✓ | ✗ |
| Insurance claim | ✓ | ✓ | ✓ | ✗ |
| Recall | ✗ | ✓ | ✓ | ✗ |
| Vaccinate | ✓ | ✓ | ✓ | ✗ |
| Edit drug master | ✗ | ✓ | ✓ | ✗ |

---

## 13. Integrations

- SFDA registration database
- NPHIES (KSA insurance)
- BUPA / Tawuniya / MEDGULF APIs
- Drug interaction databases (Lexicomp, Micromedex)
- National vaccination registry (KSA: Tabaud)
- Electronic prescriptions (Wasfaty)

---

## 14. Shortcuts

- `Ctrl+P` New prescription
- `Ctrl+D` Drug lookup
- `Ctrl+I` Interaction check

---

## 15. Mobile / Print

- Patient app (refill, history)
- Print: prescription labels, receipts, counseling forms

---

## 16. Audit

- Every controlled dispensing logged immutable
- Drug recalls fully traced
- Inventory adjustments require reason
- Pharmacist actions logged

---

## 17. Tests

```typescript
describe('Allergy Check', () => { /* blocks if allergic */ })
describe('Interaction', () => { /* severity-based action */ })
describe('Controlled', () => { /* witness, double-sign */ })
describe('Insurance', () => { /* pre-auth, claim */ })
describe('Refill', () => { /* days supply, max refills */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Allergic drug prescribed | hard block + alert |
| Controlled inventory mismatch | alert + investigation |
| Insurance denial | retry or patient pays |
| Compound for pediatric | extra QC |
| Refill past validity | reject |
| Drug expired in stock | block sale |

---

**نهاية #33** • 8 سيناريوهات • 9 جداول • 8 forms • 8 grids • 25 button • 8 reports
