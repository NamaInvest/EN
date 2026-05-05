# BPF #3: Hire-to-Retire (H2R) — End-to-End

> **المرجعيات:** SAP SuccessFactors، Workday HCM、Oracle HCM Cloud
> **الموديولات:** Recruitment, HR, Payroll, T&A, Performance, Training, Loans, EOS, GOSI/WPS, GL

---

## 1) الفلو

```
[Job Vacancy Identified]
   ↓ approval
[Job Posting Internal/External]
   ↓ applications received
[Resume Screening (AI)]
   ↓ shortlisted
[Interviews (Multi-round)]
   ↓ scorecards
[Offer Letter]
   ↓ accepted
[Onboarding Workflow]
   ↓ Day 1
[Active Employee]
   ↓ ongoing
[Time + Attendance]
[Leaves Mgmt]
[Payroll Monthly]
[Performance Reviews]
[Training + Certifications]
[Loans Issued/Recovered]
[Promotions/Raises]
   ↓ eventually
[Termination/Resignation/Retirement]
   ↓ workflow
[Final Settlement (EOS)]
   ↓ paid
[Documents Archived]
   ↓ closed
```

**~25 events، 10 موديولات، طوال عمر الموظف**

---

## 2) البرومنت

```
بناء H2R orchestration كامل:

موجود: Employee, JobPosting, JobApplicant, EmployeeEvaluation, TrainingCourse, PayrollRun, Salary, Vacation, EOS, gosi-engine, wps-generator, saudi-eos-engine

النواقص:
A) Employee Lifecycle State Machine (CANDIDATE → HIRED → ACTIVE → ON_LEAVE → TERMINATED → ARCHIVED)
B) Cross-module events:
   - Hire → create budget commitment + GOSI registration
   - Promotion → salary change + retroactive calc + re-encumber budget
   - Termination → EOS calc + final settlement + asset return checklist + access revocation
C) Integration:
   - Mudad WPS auto-submit
   - GOSI monthly file
   - Iqama renewal alerts → finance for cost
D) Onboarding/Offboarding workflow templates
E) Document chain: contract, NDA, training certs, performance reviews, EOS letter — all in one timeline

أنشئ:
- src/lib/h2r-orchestrator.ts
- prisma: H2RJourney, EmployeeLifecycleEvent, OnboardingChecklist, OffboardingChecklist
- UI: /hr/employee-360 (full lifecycle view)
- Tests: 40+ E2E
```

---

## 3) السيناريوهات (8)

### A — New Hire Saudi Employee
```
1. Vacancy: HR Specialist
2. Posted Bayt + LinkedIn
3. 50 applications → AI screens → 8 qualified
4. 4 interviews → top candidate
5. Offer accepted (5,000 + 1,500 housing = 6,500)
6. Day -7: pre-boarding (laptop ordered, ID processed, access requested)
7. Day 1: orientation, contract signed, GOSI registered
8. Days 1-90: probation (manager reviews monthly)
9. Day 91: confirmed permanent
10. Month 1 payroll:
    - Pro-rated if joined mid-month
    - GOSI 9% deducted: 585
    - GOSI employer 9%: 585 (cost to company)
    - SANED 1%: 65
    - Net: 5,915
    - WPS file → Mudad → Bank transfer
```

### B — Mid-Year Promotion
```
- Employee Khalid, current 8K, gets promoted to 10K
- Form: new role, new salary, justification
- Approval: Dept Head → HR Mgr → CFO
- Effective Mar 1
- Payroll:
  - Mar: 8K Jan-Feb + pro-rated for Mar uplift
  - Apr onwards: 10K
- New JD signed
- Org chart updated
- Budget re-encumbered for remaining year
```

### C — Maternity Leave
```
- Saudi female employee, expected delivery May 15
- 70 days fully paid (10 weeks)
- Apply 30 days before + 40 days after
- Document: medical certificate
- Approval: HR + Manager
- Salary continues normally during leave
- Returns May+10 weeks
```

### D — Loan Request
```
- Employee Ahmed requests 30K for emergency
- Submit form with reason
- Approval: HR + CFO
- Approved → schedule:
  - 30 installments × 1,000
  - Auto-deduct from monthly salary
- After 12 months: outstanding 18K
- Wants early payoff → settle 18K (no interest)
```

### E — Annual Performance Review
```
- Cycle: Jan 1 - 31 each year
- Self-assessment due Jan 15
- Manager review Jan 31
- Calibration session Feb 15
- Final ratings shared
- Salary action triggered for promotions
- PIP for low performers
```

### F — Resignation + EOS
```
- Khalid resigns (8 years tenure)
- Notice: 60 days
- Calculate EOS:
  - First 5 years: 5 × 0.5 × 10K = 25K
  - Years 6-8: 3 × 1 × 10K = 30K
  - Subtotal: 55K
  - Resignation factor (>5y served): 1.0
  - Final EOS: 55K
- Plus:
  - Unused leave: 15 days × (10K/30) = 5K
  - Pending bonus: 3K
- Less:
  - Outstanding loan: 8K
- Net: 55K + 5K + 3K - 8K = 55K final settlement
- Final payroll run (off-cycle)
- WPS for final
- GOSI deregistration
- Asset return checklist
- Access revocation
- Experience letter
```

### G — Termination (For Cause)
```
- Employee fired for misconduct
- HR Mgr + Legal involved
- Documentation complete
- EOS calculation:
  - Per Labor Law Art. 80, terminated for cause = 0 EOS
- But unused leave: paid
- Final settlement
- Strict access revocation immediately
- Investigation file archived
```

### H — Iqama Renewal
```
- Iqama expires in 30 days
- Alert HR + employee
- Cost: 650 SAR (renewable + government fees)
- Form submitted
- Status: PENDING_RENEWAL
- After renewal: new copy uploaded
- If past expiry: GOSI suspended → impacts payroll
```

### sad-1 — Death of Employee
```
- Sad event reported
- HR notified
- Death certificate uploaded
- EOS calculated (full per Art. 84 + Art. 87)
- Family compensation
- All access revoked
- Final settlement to family
- GOSI death benefit application
```

### sad-2 — Long-term Sick Leave
```
- Employee on sick leave 60+ days
- Medical certificate
- Pay reduces:
  - Days 1-30: 100%
  - Days 31-60: 75% (GOSI covers)
  - Days 61-90: 50%
  - Days 91+: 25%
- After 90 days: review for fitness to work
- If unable: termination per Labor Law
```

---

## 4) JEs throughout H2R

```
[Hire]
   ↓ Budget encumbered for annual salary
[Monthly Payroll]
   ↓ JE: DR Salaries Expense / CR Salaries Payable
   ↓ JE: DR GOSI Employer Expense / CR GOSI Payable
   ↓ JE: DR Salaries Payable / CR Bank (on transfer)
   ↓ JE: DR GOSI Payable / CR Bank (monthly to GOSI)
[Loan Issued]
   ↓ JE: DR Employee Loan Receivable / CR Bank
[Loan Recovery (each month)]
   ↓ JE: DR Salaries Payable / CR Employee Loan Receivable
[Bonus Accrual]
   ↓ JE: DR Bonus Expense / CR Accrued Bonus
[Bonus Payment]
   ↓ JE: DR Accrued Bonus / CR Bank
[EOS Provision (annually)]
   ↓ JE: DR EOS Expense / CR EOS Provision Liability
[EOS Payment (on departure)]
   ↓ JE: DR EOS Provision / CR Bank
[Vacation Provision]
   ↓ JE: DR Vacation Expense / CR Vacation Liability (as accrued)
```

**8-12 JEs per employee per year**

---

## 5) Schema (Orchestration)

```prisma
model H2RJourney {
  id                Int       @id @default(autoincrement())
  employeeId        Int       @unique
  
  // Lifecycle state
  currentStage      String    // CANDIDATE | HIRED | ACTIVE | ON_LEAVE | UNDER_REVIEW | TERMINATED | ARCHIVED
  
  // Key dates
  applicationDate   DateTime?
  hiredDate         DateTime?
  confirmedDate     DateTime?
  terminatedDate    DateTime?
  archivedDate      DateTime?
  
  // Performance
  currentRating     Decimal?  @db.Decimal(3,2)
  
  events            EmployeeLifecycleEvent[]
}

model EmployeeLifecycleEvent {
  id                BigInt    @id @default(autoincrement())
  journeyId         Int
  journey           H2RJourney @relation(fields: [journeyId], references: [id])
  
  eventType         String    // 'APPLICATION_RECEIVED' | 'HIRED' | 'PROMOTION' | 'LEAVE_START' | 'LEAVE_END' | 'EOS' | etc.
  
  beforeState       Json?
  afterState        Json?
  
  occurredAt        DateTime  @default(now())
  recordedByUserId  String
  
  documentRefs      Json?     // links to contracts, evaluations, etc.
}

model OnboardingChecklist {
  id                Int       @id @default(autoincrement())
  employeeId        Int       @unique
  
  startedAt         DateTime  @default(now())
  completedAt       DateTime?
  
  tasks             OnboardingTask[]
  completionPct     Decimal   @default(0) @db.Decimal(5,2)
}

model OnboardingTask {
  id                Int       @id @default(autoincrement())
  checklistId       Int
  checklist         OnboardingChecklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  
  taskCode          String
  taskName          String
  category          String    // 'IT' | 'HR' | 'FINANCE' | 'TRAINING' | 'COMPLIANCE'
  
  assignedToUserId  String?
  dueDate           DateTime?
  completedAt       DateTime?
  
  status            String    @default("PENDING")
  notes             String?
  evidenceUrl       String?
}

model OffboardingChecklist {
  id                Int       @id @default(autoincrement())
  employeeId        Int       @unique
  
  reason            String    // 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'DEATH' | 'CONTRACT_END'
  
  noticeStartDate   DateTime
  lastWorkingDay    DateTime
  
  tasks             OffboardingTask[]
  
  exitInterview     Json?
  finalSettlement   Json?
}

model OffboardingTask {
  id                Int       @id @default(autoincrement())
  checklistId       Int
  checklist         OffboardingChecklist @relation(fields: [checklistId], references: [id])
  
  category          String    // 'ASSET_RETURN' | 'ACCESS_REVOKE' | 'KNOWLEDGE_TRANSFER' | 'EOS' | 'GOSI' | 'DOCUMENTS'
  taskCode          String
  taskName          String
  
  status            String    @default("PENDING")
  completedAt       DateTime?
  evidenceUrl       String?
}

model HrCostBudget {
  id                Int       @id @default(autoincrement())
  employeeId        Int
  fiscalYear        Int
  
  budgetedSalary    Decimal   @db.Decimal(20,4)
  budgetedBenefits  Decimal   @db.Decimal(20,4)
  budgetedTotal     Decimal   @db.Decimal(20,4)
  
  actualToDate      Decimal   @default(0) @db.Decimal(20,4)
  variance          Decimal?  @db.Decimal(20,4)
}
```

---

## 6) Forms (12)

A: Job Posting (with internal + external channels)
B: Resume Upload (with AI parsing)
C: Interview Scorecard
D: Offer Letter (with merge tags)
E: Onboarding Checklist (per role)
F: Performance Review (self/peer/manager)
G: Loan Request
H: Promotion/Raise Request
I: Resignation Form
J: Termination Workflow
K: EOS Calculation Review
L: Final Settlement Approval

---

## 7) Tables

A: Employees Lifecycle View (per stage)
B: Open Vacancies + Application Stages
C: Onboarding Tasks (across all hires)
D: Offboarding Tasks (across departures)
E: Performance Cycle Status
F: Training Compliance
G: Loan Schedule (active)
H: EOS Liability per Employee

---

## 8) Buttons Cross-Module

| ID | الزر | المرحلة | يفعّل عبر موديولات |
|----|------|---------|---------------------|
| btn-h2r-create-vacancy | + شاغر | 1 | HR + Budget |
| btn-h2r-publish-job | نشر | 2 | HR + Integration (Bayt/LinkedIn) |
| btn-h2r-shortlist | غربلة | 3 | HR + AI |
| btn-h2r-interview-schedule | جدولة | 4 | HR + Calendar |
| btn-h2r-make-offer | إصدار عرض | 5 | HR + Documents |
| btn-h2r-accept-offer | قبول العرض | 6 | HR + Onboarding trigger |
| btn-h2r-onboard | بدء التهيئة | 7 | HR + IT + Finance + Training |
| btn-h2r-confirm-hire | تثبيت | 8 | HR + Payroll + GOSI |
| btn-h2r-promote | ترقية | mid | HR + Payroll + Budget |
| btn-h2r-terminate | إنهاء | exit | HR + Payroll + GOSI + Assets + Access |
| btn-h2r-eos-calc | احتساب EOS | exit | Payroll + Provision |
| btn-h2r-final-settlement | الإذن النهائي | exit | Payroll + Bank |

---

## 9) Search & Filters

- Lifecycle stage
- Department
- Branch
- Employment type
- Tenure range
- Performance rating
- Documents expiring
- Loans active
- On leave
- Probation ending

---

## 10) Reports

- Employee 360 (per employee complete history)
- Headcount Trend
- Attrition by Reason
- Time-to-Fill (recruitment)
- Cost-per-Hire
- Salary Distribution
- Performance Distribution
- Training Compliance %
- EOS Liability (financial)
- Document Expiry Schedule
- Diversity Metrics
- Saudi vs Non-Saudi (Saudization)

---

## 11) Notifications

| Event | Recipient |
|-------|-----------|
| Application received | HR + hiring manager |
| Interview scheduled | candidate + interviewers |
| Offer accepted/declined | HR |
| Day 1 reminder | new hire + manager + buddy |
| Probation ending 7d | manager + HR |
| Document expiring | employee + HR |
| Performance cycle | all employees |
| Loan installment due | employee |
| Birthday/anniversary | manager + colleagues |
| Promotion approved | employee + manager |
| Resignation submitted | manager + HR + IT |
| Termination | affected parties |
| EOS calculated | employee + HR + Finance |
| Death | confidential |

---

## 12) Permissions

| Action | Self | Manager | HR | HR Mgr | CFO |
|--------|------|---------|-----|--------|-----|
| View own profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit own profile | partial | ✓ | ✓ | ✓ | ✓ |
| View team | ✗ | ✓ | ✓ | ✓ | ✓ |
| Hire | ✗ | request | ✓ | ✓ | ✓ |
| Promote | ✗ | request | ✗ | ✓ | ✓ |
| Terminate | ✗ | request | ✗ | ✓ | ✓ |
| Compensation change | ✗ | ✗ | ✗ | ✓ | ✓ |
| EOS approval | ✗ | ✗ | ✗ | ✓ | ✓ |
| Loan approval | ✗ | ✗ | ✓ | ✓ | ✓ |
| Performance ratings | ✓ self | ✓ team | ✓ | ✓ | ✓ |

---

## 13) Integrations Cross-Module

- HRMS → Payroll: monthly run
- HR → Mudad: WPS auto-submit
- HR → GOSI: registration + monthly file
- HR → IT: access provisioning + revocation
- HR → Finance: budget commitment + tracking
- HR → Bayt/LinkedIn: job posting
- HR → LMS: training enrollment
- HR → Document Mgmt: contracts archive
- HR → Treasury: EOS payment

---

## 14) Tests

```typescript
describe('H2R Full Cycle', () => {
  test('hire creates GOSI registration')
  test('hire creates budget commitment')
  test('promotion adjusts payroll + budget')
  test('long sick leave salary reduction per law')
  test('maternity leave fully paid 70 days')
  test('loan recovered from monthly salary')
  test('EOS calculated correctly per tenure + reason')
  test('final settlement = EOS + leave - loans + bonuses')
  test('access revoked at last working day')
  test('GOSI deregistration on exit')
})
```

---

## 15) Edge Cases

| Case | Behavior |
|------|----------|
| Hire mid-fiscal year | budget pro-rated |
| Multiple promotions in same year | use latest at each calc |
| Loan outstanding at termination | settle in EOS |
| Death during loan | family decides settlement |
| Long unpaid leave (Iqama renewal etc) | tenure resets? Per policy |
| Saudization quota at risk | block new non-Saudi hire |
| Salary in foreign currency | translate at run |
| Employee in 2 entities | two H2R journeys |

---

## 16) إحصائيات BPF #3

- 10 موديولات • 25+ events طوال الحياة المهنية • 12 JEs مختلفة
- 4 جداول orchestration • 12 forms • 8 grids • 12 buttons
- 8 سيناريوهات + 2 sad paths • 12 reports • 14 notifications

---

**انتهى BPF #3 / 8.**
