# النقص #27: Tax Compliance + ZATCA Phase 2 + Zakat + WHT — مواصفات تفصيلية

> **المرجعيات:** ZATCA (Saudi Zakat, Tax & Customs Authority)、SAP Localization KSA、Oracle Tax Engines、Avalara、Vertex、Sovos

---

## 1. البرومنت

```
وسّع نظام Tax + ZATCA لمستوى enterprise:

موجود: ZatcaRecord, src/lib/zatca-* (signer/fatoora/java), wht-engine, statutory-reports-engine

النواقص:
A) ZATCA Phase 2 (E-Invoicing) Full:
   - CSR generation + onboarding (sandbox + production)
   - CSID + PCSID management
   - ICV (Invoice Counter Value) + PIH (Previous Invoice Hash) chain
   - UBL 2.1 XML generation (compliant)
   - Digital signature (XAdES-B-B/EnvelopedSignature)
   - QR code generation (TLV format Phase 1 + Phase 2)
   - Clearance vs Reporting (B2B vs B2C)
   - Credit/Debit notes proper linking
   - Batch reporting
   - Certificate renewal (yearly)
   - Re-submission on failures

B) VAT Returns:
   - Auto-aggregation per period
   - Box 1-9 mapping
   - Reverse charge mechanism
   - Adjustments
   - Filing reminders

C) Zakat:
   - Annual Zakat calculation (2.5% Gregorian / 2.577% Hijri)
   - Adjustments per regulation
   - Filing form generation

D) WHT (Withholding Tax):
   - Per supplier/service type
   - Rates: 5% services / 15% royalty / 20% management
   - Certificate generation
   - Vendor exemptions
   - Refund process

E) Other Saudi Taxes:
   - Excise tax (tobacco, sugary drinks, energy)
   - Real Estate Transaction Tax (RETT)

F) International (multi-country support):
   - VAT for UAE (5%), Bahrain (10%), Oman (5%), Qatar
   - Multi-jurisdiction tax engine
   - Tax returns per country

APIs (40+), UI (15 pages), Tests 70+ (especially ZATCA edge cases)
```

---

## 2. السيناريوهات (10)

### A — ZATCA Onboarding (First Time)
```
1. /settings/zatca-onboard
2. Generate CSR (private key + public)
3. Submit to ZATCA sandbox → OTP verification
4. Receive sandbox CSID + private key encrypted in vault
5. Test invoice → submit → receive cleared response ✓
6. Switch to production → repeat with prod CSID
7. Schedule auto-renewal (yearly)
```

### B — B2B Invoice Clearance (Standard)
```
- Invoice 50K + VAT 7,500
- Build UBL 2.1 XML
- Sign with private key
- Generate QR (TLV)
- POST to ZATCA Clearance API
- Response: cleared with UUID + signed XML
- Save signed XML + QR
- Update invoice.zatcaClearanceStatus = CLEARED
- Email customer (with QR + signed PDF)
```

### C — B2C Simplified (Reporting)
```
- POS sale 200 SAR
- Generate Phase 1 QR (TLV: seller name, VAT#, time, total, VAT)
- Print receipt with QR
- Background: build XML + sign + report (within 24h)
- ZATCA acknowledges
```

### D — Credit Note Chain
```
- Original invoice (cleared) UUID-A, ICV-100, PIH-X
- Credit note: links to UUID-A + reason code
- ICV-101, PIH = hash(UUID-A's XML)
- Submit clearance
- Customer receives both
```

### E — Failed Clearance + Retry
```
- Invoice submission → 500 error from ZATCA
- Queue + retry exponential backoff
- After 3 failures → alert tax team
- Manual review + resubmit
- ICV chain unbroken
```

### F — Quarterly VAT Return
```
- /tax/vat-return → period Q1 2026
- Auto-aggregate from all invoices
- Box 1: Standard rated sales 500K (tax 75K)
- Box 5: Standard rated purchases 300K (tax 45K)
- Net VAT payable: 30K
- Submit to ZATCA → payment instruction
- JE: DR VAT Payable 30K / CR Cash 30K
```

### G — WHT on Foreign Service
```
- Pay consultant abroad 50K SAR for services
- WHT rate: 5%
- Calc: 2,500 SAR withheld
- Pay vendor: 47,500 SAR
- File quarterly WHT return
- Issue WHT certificate to vendor
```

### H — Zakat Annual Calculation
```
- Year-end financial position
- Compute zakatable base:
  - Cash + receivables + inventory + investments - current liabilities
- Apply 2.577% (Hijri year)
- Zakat estimated payable
- File Zakat declaration with GAZT/ZATCA
```

### I — Excise Tax
```
- Sell sugary drinks 100 cases @ 50 SAR
- Excise: 50% on sugar drinks → 50 SAR/case excise
- Plus VAT 15%
- Total: 50 + 25 (excise) + (75 × 15%) = 86.25 per case
- Excise tax filed monthly
```

### J — Multi-Country VAT
```
- Saudi parent + UAE subsidiary
- Each entity has own VAT registration
- Inter-company sales: zero-rated (intra-GCC)
- Each files own VAT return per country
- Group consolidation eliminates IC
```

---

## 3. تدفق البيانات

```
[Invoice POST]
On invoice POSTED:
   ↓ build UBL 2.1 XML (per ZATCA spec)
   ↓ load private key + cert from vault
   ↓ sign XML (XAdES)
   ↓ generate QR (TLV)
   ↓ if Standard (B2B) → POST to /clearance
       on success → save UUID + signed XML
   ↓ if Simplified (B2C) → POST to /reporting (async)
   ↓ update invoice.zatcaStatus

[VAT Return Generation]
POST /tax/vat-return/generate { periodStart, periodEnd }
   ↓ aggregate sales invoices by tax category
   ↓ aggregate purchase invoices by tax category
   ↓ map to Boxes 1-9
   ↓ apply adjustments (corrections, reverse charge)
   ↓ generate XML/PDF
   ↓ submit to ZATCA
```

---

## 4. Schema (إضافات)

```prisma
model ZatcaConfig {
  id              Int       @id @default(autoincrement())
  environment     String    // 'SANDBOX' | 'SIMULATION' | 'PRODUCTION'
  vatNumber       String
  
  csr             String    @db.Text
  privateKey      String    @db.Text   // encrypted
  certificate     String?   @db.Text
  csid            String?
  pcsid           String?
  
  certificateExpiresAt DateTime?
  certificateRenewedAt DateTime?
  
  icvCounter      Int       @default(0)
  lastPih         String?   @default("0".repeat(64))
  
  active          Boolean   @default(true)
  
  // Per branch (for multi-branch)
  branchId        Int?
  
  @@unique([environment, branchId])
}

model ZatcaRecord {
  id              Int       @id @default(autoincrement())
  invoiceId       Int       @unique
  
  invoiceType     String    // 'STANDARD' | 'SIMPLIFIED' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  uuid            String    @unique
  icv             Int
  pih             String
  
  xml             String    @db.Text
  signedXml       String?   @db.Text
  xmlHash         String
  qrCode          String    @db.Text
  
  submissionType  String    // 'CLEARANCE' | 'REPORTING'
  
  status          String    @default("PENDING")  // PENDING | SUBMITTED | CLEARED | REPORTED | WARNING | REJECTED | FAILED
  
  submittedAt     DateTime?
  responseAt      DateTime?
  clearanceStatus String?
  warnings        Json?
  errors          Json?
  
  retriedCount    Int       @default(0)
  lastRetryAt     DateTime?
  
  parentZatcaId   Int?      // for credit/debit notes
  
  @@index([status, retriedCount])
}

model VatReturn {
  id              Int       @id @default(autoincrement())
  returnNumber    String    @unique
  periodStart     DateTime
  periodEnd       DateTime
  fiscalPeriodId  Int?
  
  // Boxes
  box1_standardSales Decimal @db.Decimal(20,4)
  box1_standardSalesVat Decimal @db.Decimal(20,4)
  box2_zeroRatedSales Decimal @db.Decimal(20,4)
  box3_exemptSales Decimal @db.Decimal(20,4)
  box4_imports Decimal @db.Decimal(20,4)
  box5_standardPurchases Decimal @db.Decimal(20,4)
  box5_standardPurchasesVat Decimal @db.Decimal(20,4)
  box6_zeroRatedPurchases Decimal @db.Decimal(20,4)
  box7_exemptPurchases Decimal @db.Decimal(20,4)
  box8_correction Decimal @db.Decimal(20,4)
  box9_netVat Decimal @db.Decimal(20,4)
  
  status          String    @default("DRAFT")  // DRAFT | SUBMITTED | ACCEPTED | REJECTED
  submittedAt     DateTime?
  acceptedAt      DateTime?
  paymentRef      String?
  
  filingDeadline  DateTime
  
  pdfUrl          String?
  xmlSubmitted    String?   @db.Text
}

model WhtTransaction {
  id              Int       @id @default(autoincrement())
  invoiceId       Int?
  vendorId        Int
  
  serviceType     String    // 'SERVICES' | 'ROYALTIES' | 'MANAGEMENT_FEES' | 'TECHNICAL_SERVICES' | 'OTHER'
  rate            Decimal   @db.Decimal(5,4)  // 0.05, 0.15, 0.20
  
  grossAmount     Decimal   @db.Decimal(20,4)
  whtAmount       Decimal   @db.Decimal(20,4)
  netAmount       Decimal   @db.Decimal(20,4)
  
  vendorIsResident Boolean
  vendorCountryCode String?
  
  certificateNumber String?
  certificateIssued Boolean @default(false)
  certificateUrl  String?
  
  reportedToZatca Boolean   @default(false)
  reportPeriodId  Int?
  
  occurredAt      DateTime
  journalEntryId  Int?
}

model WhtReturn {
  id              Int       @id @default(autoincrement())
  periodStart     DateTime
  periodEnd       DateTime
  
  totalGross      Decimal   @db.Decimal(20,4)
  totalWht        Decimal   @db.Decimal(20,4)
  
  status          String    @default("DRAFT")
  submittedAt     DateTime?
  
  transactions    WhtTransaction[]
}

model ZakatCalculation {
  id              Int       @id @default(autoincrement())
  fiscalYearId    Int
  
  // Zakatable assets
  cash            Decimal   @db.Decimal(20,4)
  receivables     Decimal   @db.Decimal(20,4)
  inventory       Decimal   @db.Decimal(20,4)
  investments     Decimal   @db.Decimal(20,4)
  
  // Deductions
  shortTermLiabilities Decimal @db.Decimal(20,4)
  
  zakatableBase   Decimal   @db.Decimal(20,4)
  rate            Decimal   @db.Decimal(8,5)  // 0.025 or 0.02577
  zakatPayable    Decimal   @db.Decimal(20,4)
  
  status          String    @default("DRAFT")
  submittedAt     DateTime?
  paidAt          DateTime?
  
  detailedBreakdown Json?
}

model ExciseTax {
  id              Int       @id @default(autoincrement())
  productCategory String    // 'TOBACCO' | 'ENERGY_DRINKS' | 'SOFT_DRINKS' | 'SUGAR_SWEETENED'
  rate            Decimal   @db.Decimal(5,4)  // 1.0 = 100%, 0.5 = 50%
  effectiveFrom   DateTime
  effectiveTo     DateTime?
}

model TaxCategory {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  defaultRate     Decimal   @db.Decimal(5,4)
  countryCode     String?
  
  zatcaCategoryCode String?  // S | Z | E | R | etc.
}

model TaxJurisdiction {
  id              Int       @id @default(autoincrement())
  countryCode     String    @unique
  name            String
  
  defaultVatRate  Decimal   @db.Decimal(5,4)
  vatRegistrationNumber String?
  
  filingFrequency String    // 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  
  active          Boolean   @default(true)
}
```

---

## 5. Forms (8)

A: ZATCA Onboarding Wizard
B: VAT Return Setup
C: WHT Transaction Entry
D: WHT Certificate Generation
E: Zakat Calculation Review
F: Excise Tax Setup
G: Tax Jurisdiction (multi-country)
H: Manual Adjustment

---

## 6. Tables (8)

A: ZATCA Records (status + retries)
B: VAT Returns History
C: WHT Transactions
D: WHT Certificates
E: Zakat Calculations
F: Tax Adjustments
G: Tax Jurisdictions
H: ZATCA Configuration

---

## 7. Buttons (30+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-zatca-onboard | تفعيل ZATCA | 🟢 cfo |
| btn-zatca-renew-cert | تجديد الشهادة | 🟦 cfo |
| btn-zatca-test-invoice | فاتورة اختبار | 🟦 cfo |
| btn-zatca-resubmit | إعادة إرسال | 🟡 ar |
| btn-zatca-batch-resubmit | إعادة جماعية | 🟦 tax mgr |
| btn-zatca-credit-note | إصدار CN | 🟢 ar |
| btn-zatca-pih-recover | استرداد PIH | 🔴 super admin |
| btn-vat-return-generate | توليد إقرار VAT | 🟦 tax mgr |
| btn-vat-return-submit | تقديم | 🟢 cfo |
| btn-vat-adjustment-add | + تعديل | 🟡 tax mgr |
| btn-wht-calc | احتساب WHT | 🟦 ap |
| btn-wht-cert-issue | إصدار شهادة | 🟢 ap |
| btn-wht-return-generate | توليد إقرار WHT | 🟦 tax mgr |
| btn-wht-vendor-exempt | إعفاء مورد | 🟡 cfo |
| btn-zakat-calc | احتساب زكاة | 🟦 cfo |
| btn-zakat-submit | تقديم | 🟢 cfo |
| btn-excise-record | تسجيل ضريبة انتقائية | 🟦 tax |
| btn-tax-category-add | + فئة ضريبية | 🟢 cfo |
| btn-jurisdiction-add | + بلد | 🟢 cfo |
| btn-tax-rate-update | تحديث المعدل | 🟡 cfo |
| btn-export-vat-pdf | PDF | ⬜ tax |
| btn-export-vat-xml | XML | ⬜ tax |
| btn-tax-reconciliation | تسوية الضريبة | 🟦 tax mgr |
| btn-zatca-archive | أرشيف ZATCA | ⬜ tax |
| btn-zatca-config-edit | إعدادات | ⬜ super admin |
| btn-tax-audit-prep | إعداد للتدقيق | ⬜ tax mgr |
| btn-tax-deadline-alerts | تنبيهات المواعيد | ⬜ tax |
| btn-rev-charge-toggle | reverse charge | 🟡 tax |
| btn-bulk-zatca-status | حالة جماعية | ⬜ tax |
| btn-tax-treaty-info | اتفاقيات الازدواج | ⬜ tax |

---

## 8. Search & Filters

- ZATCA records: status, date, retry count, has errors
- VAT returns: period, status
- WHT: vendor, service type, period, certificate issued
- Zakat: fiscal year, status

---

## 9. Reports

- ZATCA Submission Status
- VAT Return Detail
- WHT Vendor Summary
- Zakat Calculation Detail
- Tax Compliance Dashboard
- Pending Submissions
- Failed ZATCA + Reasons
- Tax Adjustments Log
- Multi-jurisdiction Tax Summary
- Certificate Expiry Alert

---

## 10. Dashboards

- KPIs: Pending Clearance / Cleared / Failed / Next Filing Deadline
- Charts: Cleared trend, Tax payable forecast
- Lists: Failed invoices, Upcoming deadlines, Cert expiring

---

## 11. Notifications

- ZATCA failure
- Cert expiring (90/30/7d)
- Filing deadline approaching
- Submission rejected
- PIH chain broken
- New rate effective

---

## 12. Permissions

| Action | AR/AP | Tax Officer | CFO | Super |
|--------|-------|-------------|-----|-------|
| Submit ZATCA | auto | ✓ | ✓ | ✓ |
| Resubmit | ✓ | ✓ | ✓ | ✓ |
| Generate VAT return | ✗ | ✓ | ✓ | ✓ |
| Submit VAT | ✗ | ✗ | ✓ | ✓ |
| WHT cert | ✓ | ✓ | ✓ | ✓ |
| Zakat | ✗ | ✗ | ✓ | ✓ |
| Tax adjustment | ✗ | ✓ | ✓ | ✓ |
| Onboard ZATCA | ✗ | ✗ | ✓ | ✓ |
| Cert renewal | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- ZATCA Fatoora (clearance + reporting + onboarding)
- ZATCA VAT (returns)
- GAZT/ZATCA Zakat
- Avalara / Vertex (multi-country)
- KSA Customs (excise)

---

## 14. Shortcuts

- `Ctrl+Z` ZATCA submit
- `Ctrl+V` VAT return

---

## 15. Mobile / Print

- Mobile: ZATCA QR scan + verify
- Print: VAT return, WHT cert, Zakat declaration

---

## 16. Audit

- Every ZATCA submission
- VAT return submissions
- Cert renewals
- Manual adjustments require justification

---

## 17. Tests

```typescript
describe('ZATCA XML', () => { /* schema validation */ })
describe('PIH Chain', () => { /* sequence integrity */ })
describe('QR Code', () => { /* TLV format Phase 1 + 2 */ })
describe('Credit Note', () => { /* parent linkage */ })
describe('VAT Return', () => { /* boxes calc */ })
describe('WHT', () => { /* resident/non-resident rates */ })
describe('Zakat', () => { /* base calc */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Cert expires mid-day | block + alert |
| Network down ZATCA | queue + retry |
| ICV gap detected | recovery procedure |
| Multi-branch ZATCA | per branch CSID |
| VAT exempt customer | zero-rated invoice |
| Rate change mid-period | use rate at txn date |
| WHT vendor changes residency | reassess |

---

**نهاية #27** • 10 سيناريوهات • 9 جداول • 8 forms • 8 grids • 30 button • 10 reports
