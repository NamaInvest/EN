# النقص #30: Payroll (Calc + WPS + GOSI + EOS + Loans + Allowances) — مواصفات

> **المرجعيات:** SAP HCM Payroll、Oracle HCM、Workday、ADP、Mudad (KSA WPS)、GOSI

---

## 1. البرومنت

```
وسّع Payroll لمستوى SAP HCM:

موجود: PayrollRun, Salary, WPSBatch, GOSIContribution, EmployeeLoan, EndOfServiceCalculation, gosi-engine, wps-generator, saudi-eos-engine

النواقص:
A) Salary Structure Builder (configurable):
   - Earnings: basic, housing, transport, custom allowances
   - Deductions: GOSI, advances, loans, fines, custom
   - Taxable vs non-taxable
   - Per-grade salary structures
B) Advanced Payroll Calculation:
   - Pro-rated for partial months
   - Mid-month joiners/leavers
   - Overtime calculation (1.5x weekday, 2x Friday/Saturday)
   - Variable pay (commission, bonus)
   - Multi-currency payroll
   - Off-cycle payments (bonus, advance)
C) WPS / Mudad:
   - SIF v3 file generation (Saudi)
   - IBAN validation
   - Multi-bank batches
   - Submission to Mudad API
   - Rejection handling
D) GOSI:
   - Saudi: 9% employer + 9% employee + 1% SANED
   - Non-Saudi: 2% hazards (employer only)
   - Min/max base wages (1,500-45,000 SAR)
   - Monthly file submission
E) EOS (End of Service):
   - Saudi Labor Law Articles 84-85
   - Half-month per year first 5 years
   - Full month after 5 years
   - Resignation factor (1/3 < 2y, 2/3 2-5y, 1.0 >5y)
F) Loans:
   - Loan request workflow
   - Interest-free or with markup
   - Auto-deduct from salary
   - Early payoff
G) Off-cycle payments
H) Payslip generation (PDF, multi-language)
I) Tax (if applicable in some countries)

APIs (40+), UI (15 pages), Tests 70+
```

---

## 2. السيناريوهات (8)

### A — Monthly Payroll Run
```
1. Last day of month: HR initiates payroll run
2. System aggregates per employee:
   - Basic salary (pro-rated if needed)
   - Housing + transport allowances
   - Overtime (from attendance)
   - Commission (from sales)
   - Bonus (off-cycle if any)
   - Total earnings
3. Deductions:
   - GOSI 9% (Saudi) or 0% (non-Saudi from employee)
   - Loan deductions (active plans)
   - Advance recoveries
   - Absences
   - Fines/penalties
   - Total deductions
4. Net Salary = Earnings - Deductions
5. Generate payslips
6. WPS file → Mudad
7. Bank transfer
8. JE posted
```

### B — Mid-month Joiner
```
- New hire starts 15th
- Pro-rated: 16/30 × monthly salary
- Allowances pro-rated
- GOSI pro-rated
- First payslip shows pro-ration explanation
```

### C — Overtime Calculation
```
- Saudi labor: 8h/day, 48h/week
- Weekday OT: 1.5× hourly rate
- Friday/Saturday OT: 2×
- Calculated from attendance:
  - 12 hours weekday OT this month
  - 8 hours Friday OT
  - Total OT pay = (12 × 1.5 × hourlyRate) + (8 × 2 × hourlyRate)
```

### D — GOSI Calculation
```
- Saudi employee, basic + housing = 8,000 SAR (subject wage)
- Employee GOSI: 9% × 8,000 = 720
- Employer GOSI: 9% × 8,000 = 720
- SANED: 1% × 8,000 = 80
- Total cost to company: salary + 800 (employer + SANED)
- File submitted monthly via API
```

### E — EOS Calculation
```
- Employee Khalid, 7 years, basic + housing = 10,000
- Resignation, served full notice
- Calculation:
  - First 5 years: 5 × 0.5 × 10,000 = 25,000
  - Years 6-7: 2 × 1 × 10,000 = 20,000
  - Total: 45,000
- Resignation factor: 1.0 (>5 years served)
- Final EOS: 45,000
- Plus unused leave: 12 days × (10000/30) = 4,000
- Plus pro-rated bonus
- Total final settlement: 49,000
```

### F — Loan from Salary
```
- Employee requests 30,000 SAR loan
- Approved by HR + manager
- Schedule: 30 months × 1,000
- Auto-deducted each payroll
- Outstanding tracked
- Early payoff allowed (no interest)
```

### G — Off-cycle Bonus
```
- Annual performance bonus declared
- Off-cycle run (mid-month)
- Not subject to GOSI on bonus (depends)
- Tax handled (if applicable)
- Payslip generated separately
- Single bank transfer
```

### H — Multi-currency (Expat)
```
- Saudi entity employee, paid in USD
- Salary 5,000 USD
- FX rate at run: 3.78 → 18,900 SAR
- GOSI calculated in SAR (per regulation)
- Bank transfer in USD
- Reporting in both currencies
```

---

## 3. تدفق البيانات

```
[Payroll Run]
POST /payroll/run/initiate { period }
   ↓ create PayrollRun
   ↓ for each employee:
     - aggregate earnings (basic + allowances + OT + bonus + commission)
     - calculate GOSI
     - apply deductions (loans, advances, absences)
     - compute net
     - create Salary record
   ↓ generate WPS SIF file
   ↓ submit to Mudad API
   ↓ on Mudad acceptance → bank transfer
   ↓ post JE
   ↓ generate payslips
   ↓ email/in-app to employees
```

---

## 4. Schema (إضافات)

```prisma
model PayrollRun {
  // ... existing
  runNumber       String    @unique
  
  type            String    @default("MONTHLY")  // MONTHLY | OFF_CYCLE | BONUS | ADJUSTMENT | EOS
  
  periodStart     DateTime
  periodEnd       DateTime
  payDate         DateTime
  
  status          String    @default("DRAFT")  // DRAFT | CALCULATED | APPROVED | SUBMITTED_WPS | PAID | POSTED | CANCELLED
  
  totalEarnings   Decimal?  @db.Decimal(20,4)
  totalDeductions Decimal?  @db.Decimal(20,4)
  totalNet        Decimal?  @db.Decimal(20,4)
  totalGosiEmployer Decimal? @db.Decimal(20,4)
  totalCostToCompany Decimal? @db.Decimal(20,4)
  
  employeeCount   Int
  
  approvedByUserId String?
  approvedAt      DateTime?
  
  wpsBatchId      Int?
  journalEntryId  Int?
  
  salaries        Salary[]
}

model Salary {
  // ... existing
  payrollRunId    Int
  payrollRun      PayrollRun @relation(fields: [payrollRunId], references: [id])
  employeeId      Int
  employee        Employee   @relation(fields: [employeeId], references: [id])
  
  workingDays     Decimal?  @db.Decimal(5,2)
  workedDays      Decimal   @db.Decimal(5,2)
  absentDays      Decimal   @db.Decimal(5,2)
  unpaidLeaveDays Decimal   @default(0) @db.Decimal(5,2)
  
  basicSalary     Decimal   @db.Decimal(20,4)
  housingAllowance Decimal? @db.Decimal(20,4)
  transportAllowance Decimal? @db.Decimal(20,4)
  otherAllowances Decimal?  @db.Decimal(20,4)
  
  overtimeHours   Decimal?  @db.Decimal(5,2)
  overtimeAmount  Decimal?  @db.Decimal(20,4)
  
  bonus           Decimal?  @db.Decimal(20,4)
  commission      Decimal?  @db.Decimal(20,4)
  reimbursement   Decimal?  @db.Decimal(20,4)
  
  totalEarnings   Decimal   @db.Decimal(20,4)
  
  gosiEmployee    Decimal?  @db.Decimal(20,4)
  loanDeduction   Decimal?  @db.Decimal(20,4)
  advanceRecovery Decimal?  @db.Decimal(20,4)
  absenceDeduction Decimal? @db.Decimal(20,4)
  fineDeduction   Decimal?  @db.Decimal(20,4)
  taxDeduction    Decimal?  @db.Decimal(20,4)
  otherDeductions Decimal?  @db.Decimal(20,4)
  
  totalDeductions Decimal   @db.Decimal(20,4)
  netSalary       Decimal   @db.Decimal(20,4)
  
  // GOSI - employer side (cost to company)
  gosiEmployer    Decimal?  @db.Decimal(20,4)
  saned           Decimal?  @db.Decimal(20,4)
  
  // Bank
  bankIban        String
  bankName        String
  paidAt          DateTime?
  
  payslipUrl      String?
  acknowledgedAt  DateTime?
  
  currency        String    @default("SAR")
  fxRate          Decimal?  @db.Decimal(20,8)
}

model SalaryStructure {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  
  applicableJobIds Int[]
  applicableGradeIds Int[]
  
  components      SalaryComponent[]
  
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
}

model SalaryComponent {
  id              Int       @id @default(autoincrement())
  structureId     Int
  structure       SalaryStructure @relation(fields: [structureId], references: [id], onDelete: Cascade)
  
  componentCode   String
  name            String
  type            String    // 'EARNING' | 'DEDUCTION'
  category        String?   // 'BASIC' | 'ALLOWANCE' | 'BONUS' | 'GOSI' | 'TAX' | 'LOAN' | 'OTHER'
  
  calcType        String    // 'FIXED' | 'PERCENT_OF_BASIC' | 'PERCENT_OF_GROSS' | 'FORMULA' | 'EXTERNAL'
  fixedAmount     Decimal?  @db.Decimal(20,4)
  percent         Decimal?  @db.Decimal(8,4)
  formula         String?
  
  taxable         Boolean   @default(true)
  gosiSubject     Boolean   @default(true)
  
  payslipShow     Boolean   @default(true)
  payslipOrder    Int       @default(0)
  
  glAccountId     Int?
}

model EmployeeLoan {
  // ... existing
  loanNumber      String    @unique
  employeeId      Int
  
  loanType        String    // 'PERSONAL' | 'EMERGENCY' | 'HOUSING' | 'EDUCATION' | 'AUTO'
  
  principalAmount Decimal   @db.Decimal(20,4)
  outstandingAmount Decimal @db.Decimal(20,4)
  
  interestRate    Decimal?  @db.Decimal(8,4)
  
  installmentAmount Decimal @db.Decimal(20,4)
  installmentCount Int
  installmentsPaid Int      @default(0)
  
  startDate       DateTime
  endDate         DateTime
  
  status          String    @default("ACTIVE")  // PENDING_APPROVAL | ACTIVE | PAID_OFF | DEFAULTED | CANCELLED
  
  approvedByUserId String?
  approvedAt      DateTime?
  
  schedule        EmployeeLoanSchedule[]
}

model EmployeeLoanSchedule {
  id              Int       @id @default(autoincrement())
  loanId          Int
  loan            EmployeeLoan @relation(fields: [loanId], references: [id])
  
  installmentNumber Int
  dueDate         DateTime
  amount          Decimal   @db.Decimal(20,4)
  
  paid            Boolean   @default(false)
  paidInPayrollId Int?
  paidAt          DateTime?
}

model GosiContribution {
  // ... existing
  employeeId      Int
  payrollRunId    Int
  
  fiscalYear      Int
  fiscalMonth     Int
  
  subjectWage     Decimal   @db.Decimal(20,4)
  
  employeePension Decimal   @db.Decimal(20,4)  // 9% Saudi
  employerPension Decimal   @db.Decimal(20,4)  // 9% Saudi, 0% non-Saudi
  saned           Decimal?  @db.Decimal(20,4)  // 1% (Saudi only, both sides)
  hazards         Decimal?  @db.Decimal(20,4)  // 2% (non-Saudi only, employer)
  
  totalEmployee   Decimal   @db.Decimal(20,4)
  totalEmployer   Decimal   @db.Decimal(20,4)
  
  gosiNumber      String?
  
  reported        Boolean   @default(false)
  reportedInFileId Int?
}

model GosiMonthlyFile {
  id              Int       @id @default(autoincrement())
  fiscalYear      Int
  fiscalMonth     Int
  
  fileUrl         String?
  totalEmployees  Int
  totalContributions Decimal @db.Decimal(20,4)
  
  status          String    @default("DRAFT")  // DRAFT | SUBMITTED | ACCEPTED | REJECTED
  submittedAt     DateTime?
  acceptedAt      DateTime?
  
  contributions   GosiContribution[]
}

model WpsBatch {
  // ... existing
  batchNumber     String    @unique
  payrollRunId    Int?
  
  fiscalYear      Int
  fiscalMonth     Int
  
  totalEmployees  Int
  totalAmount     Decimal   @db.Decimal(20,4)
  
  bankCode        String?   // RJHI, ALBI, SABB, SNB, BSFR, RIBL
  
  sifFileUrl      String?
  sifVersion      String    @default("V3")
  
  status          String    @default("DRAFT")  // DRAFT | GENERATED | SUBMITTED_TO_MUDAD | ACCEPTED | REJECTED | PAID
  
  submittedAt     DateTime?
  acceptedAt      DateTime?
  rejectionReason String?
  
  items           WpsBatchItem[]
}

model WpsBatchItem {
  id              Int       @id @default(autoincrement())
  batchId         Int
  batch           WpsBatch  @relation(fields: [batchId], references: [id], onDelete: Cascade)
  
  employeeId      Int
  employeeIqama   String?
  basicSalary     Decimal   @db.Decimal(20,4)
  allowances      Decimal   @db.Decimal(20,4)
  totalSalary     Decimal   @db.Decimal(20,4)
  
  bankIban        String
  
  status          String    @default("PENDING")  // PENDING | ACCEPTED | REJECTED | PAID
  rejectionReason String?
}

model EndOfServiceCalculation {
  // ... existing
  employeeId      Int       @unique
  
  totalServiceYears Decimal @db.Decimal(8,4)
  yearsFirst5     Decimal   @db.Decimal(8,4)
  yearsAfter5     Decimal   @db.Decimal(8,4)
  
  monthlyBaseForEos Decimal @db.Decimal(20,4)  // basic + housing typically
  
  eosFirst5       Decimal   @db.Decimal(20,4)
  eosAfter5       Decimal   @db.Decimal(20,4)
  fullEosAmount   Decimal   @db.Decimal(20,4)
  
  resignationFactor Decimal @db.Decimal(8,4)  // 0.33, 0.67, 1.0
  finalEosAmount  Decimal   @db.Decimal(20,4)
  
  unusedLeavePayment Decimal? @db.Decimal(20,4)
  pendingBonus    Decimal?  @db.Decimal(20,4)
  loanDeduction   Decimal?  @db.Decimal(20,4)
  
  totalSettlement Decimal   @db.Decimal(20,4)
  
  reasonForLeaving String   // 'RESIGNATION' | 'TERMINATION' | 'DEATH' | 'RETIREMENT' | 'CONTRACT_END' | 'MUTUAL'
  
  status          String    @default("DRAFT")  // DRAFT | APPROVED | PAID
  approvedAt      DateTime?
  paidAt          DateTime?
  paymentJournalId Int?
}
```

---

## 5. Forms (8)

A: Payroll Run Initiate
B: Salary Structure Editor
C: Loan Request
D: Off-cycle Payment
E: Bonus Payout
F: EOS Calculation Review
G: WPS Submission
H: GOSI Adjustment

---

## 6. Tables (8)

A: Payroll Runs
B: Salaries (per employee per period)
C: Active Loans + Schedule
D: WPS Batches
E: GOSI Contributions
F: EOS Calculations
G: Off-cycle Payments
H: Payslip Distribution

---

## 7. Buttons (30+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-payroll-initiate | بدء كشف رواتب | 🟢 payroll |
| btn-payroll-calculate | احتساب | 🟦 payroll |
| btn-payroll-recalculate | إعادة الاحتساب | 🟡 payroll |
| btn-payroll-approve | موافقة | 🟢 cfo |
| btn-payroll-cancel | إلغاء | 🔴 cfo + reason |
| btn-payslip-generate | توليد payslip | 🟦 payroll |
| btn-payslip-email | إرسال بالبريد | 🟦 payroll |
| btn-payslip-print | طباعة | ⬜ employee |
| btn-payslip-acknowledge | تأكيد | 🟢 employee |
| btn-wps-generate | توليد WPS | 🟦 payroll |
| btn-wps-submit-mudad | إرسال للمداد | 🟢 payroll mgr |
| btn-wps-resubmit-rejected | إعادة الرفض | 🟡 payroll |
| btn-gosi-calc | احتساب GOSI | 🟦 payroll |
| btn-gosi-file-generate | توليد ملف شهري | 🟦 payroll |
| btn-gosi-submit | إرسال | 🟢 payroll mgr |
| btn-loan-request | طلب قرض | 🟢 employee |
| btn-loan-approve | موافقة | 🟢 hr + cfo |
| btn-loan-reject | رفض | 🔴 hr + reason |
| btn-loan-early-payoff | سداد مبكر | 🟢 employee |
| btn-loan-restructure | إعادة هيكلة | 🟡 cfo |
| btn-eos-calculate | احتساب EOS | 🟦 hr |
| btn-eos-approve | موافقة | 🟢 cfo |
| btn-eos-pay | دفع | 🟢 ar |
| btn-bonus-add | + مكافأة | 🟢 hr mgr |
| btn-off-cycle-create | + كشف خارج الدورة | 🟢 payroll mgr |
| btn-salary-structure-create | + هيكل راتب | 🟢 hr mgr |
| btn-salary-component-create | + مكون | 🟢 hr mgr |
| btn-bulk-salary-update | تحديث جماعي | 🔴 cfo |
| btn-overtime-import | استيراد إضافي | 🟦 payroll |
| btn-export-payroll | تصدير | ⬜ payroll |
| btn-export-wps-sif | تصدير SIF | ⬜ payroll |

---

## 8. Search & Filters

- Runs: type, status, period, branch
- Salaries: employee, period, status
- Loans: status, employee, principal range
- WPS: bank, status
- EOS: status, year

---

## 9. Reports

- Monthly Payroll Summary
- Payslip History (per employee)
- GOSI Monthly File
- WPS Submission Report
- Loan Outstanding Balance
- EOS Liabilities (financial)
- Salary Distribution
- Compensation by Department
- Overtime Summary
- Tax Summary
- Cost to Company Analysis
- Salary Comparison vs Market

---

## 10. Dashboards

- KPIs: Last Run / Total Net / GOSI / Pending Loans / EOS Liability
- Charts: Payroll trend, Cost by department
- Lists: Loan defaulters, EOS pending, Payslips not acknowledged

---

## 11. Notifications

- Payroll calculated → for review
- Approval needed
- WPS submitted
- WPS rejected
- Payslip available
- Loan installment deducted
- Loan paid off
- EOS calculated

---

## 12. Permissions

| Action | Employee | HR | Payroll | HR Mgr | CFO |
|--------|----------|-----|---------|--------|-----|
| View own payslip | ✓ | ✓ | ✓ | ✓ | ✓ |
| View team payslips | ✗ | ✓ | ✓ | ✓ | ✓ |
| Initiate run | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approve run | ✗ | ✗ | ✗ | ✓ | ✓ |
| Edit salary | ✗ | ✗ | ✗ | ✓ | ✓ |
| Loan approve | ✗ | ✓ | ✗ | ✓ | ✓ |
| Off-cycle | ✗ | ✗ | ✗ | ✓ | ✓ |
| EOS calculate | ✗ | ✓ | ✓ | ✓ | ✓ |
| Override calc | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Mudad (WPS)
- GOSI online (KSA)
- Banks (RJHI, NCB, SAB, SNB, etc.)
- Tax authority (if applicable)
- Accounting (auto-journal)
- HR systems
- Time & Attendance

---

## 14. Shortcuts

- `Ctrl+P` Initiate payroll
- `Ctrl+L` Loan request
- `Ctrl+E` EOS

---

## 15. Mobile / Print

- Mobile: payslip view + acknowledge
- Print: payslip (PDF), WPS forms, EOS receipts

---

## 16. Audit

- Every salary calc immutable after approval
- Approval chain logged
- Manual overrides require justification
- WPS submissions traced

---

## 17. Tests

```typescript
describe('Salary Calculation', () => {
  test('full month')
  test('mid-month joiner pro-ration')
  test('overtime weekday vs weekend')
  test('GOSI Saudi vs non-Saudi')
})

describe('GOSI', () => { /* min/max wage limits */ })
describe('WPS', () => { /* SIF v3 format */ })
describe('EOS', () => {
  test('< 2 years resignation = 1/3 factor')
  test('2-5 years = 2/3')
  test('> 5 years = 1.0')
  test('first 5 years half-month')
  test('after 5 years full month')
})
describe('Loan', () => {
  test('schedule generation')
  test('auto-deduct from salary')
  test('early payoff')
})
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Payroll without active employees | warn |
| Negative net salary | block + alert |
| Loan > salary | enforce min net |
| WPS rejected employee | exclude from batch + retry |
| GOSI base > max (45K) | cap at max |
| Mid-month termination | partial + EOS |
| Bank IBAN invalid | block payment |
| Currency mismatch (employee USD vs run SAR) | translate |

---

**نهاية #30** • 8 سيناريوهات • 12 جداول • 8 forms • 8 grids • 31 button • 12 reports
