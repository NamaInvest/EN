# النقص #29: HR Core (Employees + Jobs + Recruitment + Training + Evaluations) — مواصفات

> **المرجعيات:** SAP SuccessFactors、Oracle HCM Cloud、Workday HR、BambooHR、Zenefits、Personio

---

## 1. البرومنت

```
وسّع HR Core لمستوى Workday HCM:

موجود: Employee, JobPosting, JobApplicant, EmployeeEvaluation, TrainingCourse, TrainingEnrollment, Shift, WorkShift

النواقص:
A) Employee Master 360°:
   - Personal + employment + contact + emergency
   - Multiple addresses (home/temp/work)
   - Dependents (for benefits)
   - Education + certifications
   - Skills + competencies
   - Career history
   - Employment contracts (multi-versions)
   - Documents (Iqama, passport, license, etc.)
   - Org chart (reporting hierarchy)

B) Job Architecture:
   - Job families + roles + grades + bands
   - Salary grades with min/mid/max
   - Job requirements (skills, education, experience)
   - Job descriptions (multi-language)

C) Recruitment (ATS):
   - Job postings (internal + external)
   - Career page integration
   - Application tracking
   - Resume parsing (AI)
   - Interview scheduling
   - Scorecards (multi-interviewer)
   - Offer letter generation
   - Background checks

D) Onboarding:
   - Pre-boarding tasks
   - Day-1 checklist
   - Document collection
   - Equipment provisioning
   - Welcome workflow

E) Performance Management:
   - Goal setting (SMART, OKR)
   - Continuous feedback
   - 360° reviews
   - Mid-year + annual cycles
   - Calibration sessions
   - Performance Improvement Plans (PIP)

F) Learning & Development:
   - Course catalog
   - Mandatory + optional training
   - Certifications + expiry
   - Skills matrix
   - Career paths
   - LMS integration

G) Compensation:
   - Pay structures
   - Promotion + raise workflows
   - Bonus management

H) Offboarding:
   - Resignation workflow
   - Exit interviews
   - Asset return
   - Final settlement
   - Handover

APIs (60+), UI (25 pages), Tests 80+
```

---

## 2. السيناريوهات (10)

### A — New Hire Onboarding
```
1. Job posting filled → candidate accepted offer
2. Pre-boarding wizard:
   - Equipment ordered (laptop, ID card)
   - Email account created
   - Welcome packet sent
3. Day 1: HR meeting
   - Documents collected (ID, contracts signed)
   - Workstation setup
   - System access granted
4. Week 1: orientation + buddy assignment
5. 90-day probation tracking
```

### B — Job Posting → Hire
```
1. Manager: [Open Position] → form
2. HR creates job posting
3. Posted internally + external (Bayt, LinkedIn)
4. 50 applications received
5. Resume parsing (AI extracts skills/experience)
6. Shortlist 10 → schedule interviews
7. 4 panel interviews → scorecards aggregated
8. Top candidate → offer letter generated
9. Candidate accepts → hire process triggered
```

### C — Annual Performance Review
```
1. Cycle starts: 1 Jan
2. Self-assessment due: 31 Jan
3. Manager review: 15 Feb
4. Calibration session: 28 Feb
5. Final ratings shared: 15 Mar
6. Salary action triggered
7. Documented in employee file
```

### D — Training & Certification
```
- New employee enrolled in mandatory courses:
  - Code of Conduct
  - Data Privacy
  - Safety Training
- LMS tracks progress
- Quizzes completed
- Certificate issued
- Expiry: 1 year (renewal required)
- HR dashboard shows compliance %
```

### E — Promotion / Raise
```
1. Manager nominates employee
2. Form: new role, new salary, justification
3. Workflow: Dept Head → HR → CFO
4. Approved → effective date
5. Salary adjustment in payroll
6. New job description + reporting line
7. Communication to employee
```

### F — Employee Exit
```
1. Resignation submitted
2. Exit interview scheduled
3. Handover plan
4. Asset return checklist (laptop, phone, ID)
5. Email/system access revocation date
6. EOS calculated (linked to payroll)
7. Final settlement
8. Letters issued (experience, EOS receipt)
```

### G — Org Chart Update
```
- Org structure visual
- Drag-drop to reorganize
- Auto-update reporting lines
- Change approval workflow
- Effective dating
```

### H — Skills Matrix
```
- Each role has required skills
- Each employee assessed on skills (1-5 scale)
- Gap analysis: who needs what training
- Career path suggestions
- Succession planning
```

### I — Document Expiry Tracking
```
- Iqama expiring 30 days → alert HR
- Renewal process:
  - Estimated cost: 650 SAR
  - Status: PENDING_RENEWAL
  - Document submitted
  - New copy uploaded
  - Status: VALID
```

### J — 360° Feedback
```
- Manager + 3 peers + 2 direct reports + 2 customers
- Anonymous responses
- Aggregated report
- Used for development plan
```

---

## 3. تدفق البيانات

```
[Hire Process]
POST /hr/employees → Employee created
   ↓ trigger onboarding workflow
   ↓ create access requests
   ↓ assign mandatory training
   ↓ schedule 30/60/90 day check-ins

[Performance Review Cycle]
Cron on cycle start:
   ↓ create EmployeeEvaluation per employee
   ↓ assign tasks (self, peer, manager)
   ↓ track completion

[Document Expiry]
Cron daily:
   ↓ check documents expiring 30/15/7d
   ↓ alert HR + employee
```

---

## 4. Schema (إضافات)

```prisma
model Employee {
  // ... existing
  employeeNumber  String    @unique
  
  // Personal
  firstName       String
  lastName        String
  arabicName      String?
  dateOfBirth     DateTime?
  gender          String?
  nationality     String
  maritalStatus   String?
  religion        String?
  
  // ID
  nationalId      String?
  iqamaNumber     String?
  iqamaExpiryDate DateTime?
  passportNumber  String?
  passportExpiryDate DateTime?
  passportCountry String?
  
  // Contact
  personalEmail   String?
  workEmail       String?
  phone           String?
  emergencyContactName String?
  emergencyContactPhone String?
  emergencyContactRelation String?
  
  // Employment
  employmentType  String    // 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'INTERN' | 'CONSULTANT'
  employmentStatus String   @default("ACTIVE")  // ACTIVE | PROBATION | TERMINATED | RESIGNED | RETIRED | TRANSFERRED
  hireDate        DateTime
  probationEndDate DateTime?
  contractEndDate DateTime?
  terminationDate DateTime?
  terminationReason String?
  
  // Position
  jobId           Int?
  job             JobPosition? @relation(fields: [jobId], references: [id])
  departmentId    Int?
  branchId        Int?
  costCenterId    Int?
  
  reportingManagerId Int?
  
  // Compensation
  basicSalary     Decimal   @db.Decimal(20,4)
  housingAllowance Decimal? @db.Decimal(20,4)
  transportAllowance Decimal? @db.Decimal(20,4)
  otherAllowances Decimal?  @db.Decimal(20,4)
  totalSalary     Decimal   @db.Decimal(20,4)
  currency        String    @default("SAR")
  payFrequency    String    @default("MONTHLY")
  payGradeId      Int?
  
  // Bank
  bankIban        String?
  bankName        String?
  bankAccountVerified Boolean @default(false)
  
  // GOSI
  gosiNumber      String?
  gosiRegisteredDate DateTime?
  
  // Profile
  profilePhotoUrl String?
  
  // Activity
  lastLoginAt     DateTime?
  systemAccessRevoked Boolean @default(false)
  
  // Relations
  addresses       EmployeeAddress[]
  dependents      EmployeeDependent[]
  educations      EmployeeEducation[]
  certifications  EmployeeCertification[]
  skills          EmployeeSkill[]
  documents       EmployeeDocument[]
  contracts       EmploymentContract[]
  evaluations     EmployeeEvaluation[]
  trainings       TrainingEnrollment[]
  payrolls        Salary[]
  loans           EmployeeLoan[]
  vacations       Vacation[]
  attendance      Attendance[]
  
  directReports   Employee[] @relation("EmployeeManager")
  manager         Employee?  @relation("EmployeeManager", fields: [reportingManagerId], references: [id])
}

model EmployeeAddress {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  employee        Employee  @relation(fields: [employeeId], references: [id])
  type            String    // 'PERMANENT' | 'CURRENT' | 'TEMPORARY' | 'WORK'
  street          String
  city            String
  country         String
  isPrimary       Boolean   @default(false)
}

model EmployeeDependent {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  employee        Employee  @relation(fields: [employeeId], references: [id])
  name            String
  relationship    String    // 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER'
  dateOfBirth     DateTime?
  isBenefitEligible Boolean @default(true)
}

model EmployeeEducation {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  degree          String
  major           String?
  institution     String
  graduationYear  Int?
  gpa             String?
  countryCode     String?
}

model EmployeeCertification {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  certificationName String
  issuingBody     String
  certificateNumber String?
  issueDate       DateTime
  expiryDate      DateTime?
  documentUrl     String?
}

model EmployeeSkill {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  employee        Employee  @relation(fields: [employeeId], references: [id])
  skillName       String
  proficiency     Int       // 1-5
  yearsExperience Int?
  selfRated       Boolean   @default(false)
  managerRated    Boolean   @default(false)
}

model EmployeeDocument {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  employee        Employee  @relation(fields: [employeeId], references: [id])
  type            String    // 'IQAMA' | 'PASSPORT' | 'LICENSE' | 'CONTRACT' | 'CV' | 'CERTIFICATE' | 'OTHER'
  documentNumber  String?
  issueDate       DateTime?
  expiryDate      DateTime?
  fileUrl         String
  uploadedAt      DateTime  @default(now())
  verified        Boolean   @default(false)
}

model EmploymentContract {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  employee        Employee  @relation(fields: [employeeId], references: [id])
  contractType    String    // 'PERMANENT' | 'FIXED_TERM' | 'PROJECT'
  startDate       DateTime
  endDate         DateTime?
  basicSalary     Decimal   @db.Decimal(20,4)
  workingHours    Decimal   @db.Decimal(5,2)
  workingDays     Int
  contractFileUrl String
  signedDate      DateTime?
  active          Boolean   @default(true)
}

model JobPosition {
  id              Int       @id @default(autoincrement())
  positionCode    String    @unique
  titleAr         String
  titleEn         String
  
  jobFamilyId     Int?
  gradeId         Int?
  bandId          Int?
  
  description     String?   @db.Text
  responsibilities String[] 
  requiredSkills  String[]
  preferredSkills String[]
  minEducation    String?
  minExperience   Int?
  
  reportsTo       Int?      // another job ID
  
  active          Boolean   @default(true)
  employees       Employee[]
}

model JobGrade {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  name            String
  level           Int
  minSalary       Decimal   @db.Decimal(20,4)
  midSalary       Decimal   @db.Decimal(20,4)
  maxSalary       Decimal   @db.Decimal(20,4)
}

model JobPosting {
  // ... existing
  positionId      Int?
  status          String    @default("OPEN")  // DRAFT | OPEN | CLOSED | FILLED | CANCELLED
  postedAt        DateTime?
  closingDate     DateTime?
  
  vacancies       Int       @default(1)
  filled          Int       @default(0)
  
  internalOnly    Boolean   @default(false)
  
  applicationsCount Int     @default(0)
  
  postedChannels  String[]  // 'INTERNAL' | 'BAYT' | 'LINKEDIN' | 'INDEED' | 'CAREER_PAGE'
}

model JobApplicant {
  // ... existing
  applicationStatus String  @default("APPLIED")  // APPLIED | SCREENING | INTERVIEW_SCHEDULED | INTERVIEWED | OFFER_PENDING | OFFER_ACCEPTED | REJECTED | WITHDRAWN
  
  resumeUrl       String?
  parsedResumeData Json?    // skills, experience, education from AI
  
  scorecards      InterviewScorecard[]
  interviews      Interview[]
  
  source          String?
  referredByEmployeeId Int?
}

model Interview {
  id              Int       @id @default(autoincrement())
  applicantId     Int
  applicant       JobApplicant @relation(fields: [applicantId], references: [id])
  
  type            String    // 'PHONE' | 'VIDEO' | 'ON_SITE' | 'PANEL'
  round           Int
  scheduledAt     DateTime
  durationMinutes Int       @default(60)
  
  interviewerIds  Int[]
  
  status          String    @default("SCHEDULED")  // SCHEDULED | COMPLETED | CANCELLED | NO_SHOW
  
  feedback        String?
  recommendation  String?   // 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE'
}

model InterviewScorecard {
  id              Int       @id @default(autoincrement())
  interviewId     Int
  interviewerEmployeeId Int
  
  criteria        Json      // [{name, weight, score}]
  totalScore      Decimal   @db.Decimal(5,2)
  recommendation  String
  notes           String?
  submittedAt     DateTime  @default(now())
}

model EmployeeEvaluation {
  // ... existing
  evaluationCycle String    // '2026_ANNUAL' | '2026_H1' | etc.
  evaluationType  String    // 'SELF' | 'PEER' | 'MANAGER' | '360' | 'PROBATION'
  
  goals           Json?
  ratings         Json      // [{competency, rating, comments}]
  overallRating   Int?      // 1-5
  promotionRecommended Boolean @default(false)
  pipRequired     Boolean   @default(false)
  
  status          String    @default("DRAFT")  // DRAFT | SUBMITTED | CALIBRATED | FINALIZED | ACKNOWLEDGED
  
  submittedAt     DateTime?
  acknowledgedAt  DateTime?
}

model PerformanceImprovementPlan {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  startDate       DateTime
  endDate         DateTime
  reasons         String    @db.Text
  goals           Json
  checkIns        Json[]
  outcome         String?   // 'COMPLETED_SUCCESSFULLY' | 'TERMINATED' | 'EXTENDED'
  status          String    @default("ACTIVE")
}

model TrainingCourse {
  // ... existing
  courseCode      String    @unique
  category        String
  type            String    // 'MANDATORY' | 'OPTIONAL' | 'CERTIFICATION'
  durationHours   Decimal   @db.Decimal(5,1)
  modeOfDelivery  String    // 'ONLINE' | 'CLASSROOM' | 'BLENDED' | 'EXTERNAL'
  certificateValidMonths Int?
  cost            Decimal?  @db.Decimal(20,4)
  active          Boolean   @default(true)
}

model TrainingEnrollment {
  // ... existing
  status          String    @default("ENROLLED")  // ENROLLED | IN_PROGRESS | COMPLETED | FAILED | CANCELLED
  completedAt     DateTime?
  certificateUrl  String?
  certificateExpiry DateTime?
  scorePercent    Decimal?  @db.Decimal(5,2)
}

model OrgChart {
  id              Int       @id @default(autoincrement())
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  data            Json      // hierarchical structure
  approvedByUserId String?
  approvedAt      DateTime?
}
```

---

## 5. Forms (10)

A: Employee Master Wizard (multi-step)
B: Job Position Setup
C: Job Posting + Channels
D: Application Form (career page)
E: Interview Scorecard
F: Performance Evaluation
G: Training Enrollment
H: Promotion/Raise Request
I: Resignation/Exit Workflow
J: Document Upload + Verification

---

## 6. Tables (10)

A: Employees Master (with status)
B: Org Chart (visual tree)
C: Job Postings + Applications
D: Interview Schedule
E: Performance Cycle Status
F: Training Compliance
G: Document Expiry Tracker
H: Skills Matrix
I: PIP Tracking
J: Career Path

---

## 7. Buttons (35+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-employee-create | + موظف | 🟢 hr |
| btn-employee-onboard | بدء التهيئة | 🟦 hr |
| btn-employee-promote | ترقية | 🟢 mgr |
| btn-employee-transfer | نقل | 🟦 hr |
| btn-employee-terminate | إنهاء خدمة | 🔴 hr mgr + reason |
| btn-employee-resign | تسجيل استقالة | 🟡 hr |
| btn-document-upload | رفع وثيقة | 🟢 hr/employee |
| btn-document-verify | تحقق | 🟢 hr |
| btn-document-renew | تجديد | 🟦 hr |
| btn-job-position-create | + وظيفة | 🟢 hr mgr |
| btn-job-grade-create | + درجة | 🟢 hr mgr |
| btn-posting-create | + إعلان وظيفة | 🟢 hr |
| btn-posting-publish | نشر | 🟦 hr |
| btn-posting-close | إغلاق | 🔴 hr |
| btn-application-screen | غربلة | 🟦 hr |
| btn-interview-schedule | جدولة مقابلة | 🟦 hr |
| btn-scorecard-submit | تقديم تقييم | 🟢 interviewer |
| btn-offer-generate | إصدار عرض | 🟢 hr mgr |
| btn-offer-send | إرسال | 🟦 hr |
| btn-evaluation-cycle-start | بدء دورة تقييم | 🟢 hr mgr |
| btn-self-assessment | التقييم الذاتي | 🟢 employee |
| btn-manager-review | مراجعة المدير | 🟢 mgr |
| btn-calibration-session | جلسة معايرة | 🟦 hr mgr |
| btn-pip-create | + خطة تحسين | 🟡 mgr + hr |
| btn-pip-checkin | متابعة | 🟦 mgr |
| btn-training-enroll | تسجيل تدريب | 🟢 employee/hr |
| btn-training-complete | إكمال | 🟢 employee |
| btn-skills-assess | تقييم المهارات | 🟦 mgr |
| btn-org-chart-edit | تعديل الهيكل | 🟦 hr mgr |
| btn-bulk-import-employees | استيراد جماعي | ⬜ hr mgr |
| btn-export-org-chart | تصدير | ⬜ viewer |
| btn-anniversary-list | قائمة الذكريات | ⬜ hr |
| btn-birthday-list | أعياد الميلاد | ⬜ hr |
| btn-headcount-report | تقرير العدد | ⬜ hr mgr |
| btn-attrition-analysis | تحليل الترك | ⬜ hr mgr |

---

## 8. Search & Filters

- Employees: status, department, branch, manager, hire date, contract end, expiring documents
- Jobs: family, grade, status
- Applications: position, status, source
- Trainings: type, status, expiry
- Documents: type, expiry within X

---

## 9. Reports

- Headcount by Department
- Attrition Rate
- Time-to-Fill (recruitment)
- Compensation Distribution
- Performance Distribution
- Training Compliance %
- Document Expiry Pipeline
- Promotions History
- New Hires Report
- Org Chart Snapshot
- Skills Gap Analysis
- Diversity Metrics

---

## 10. Dashboards

- KPIs: Headcount / Open Positions / Attrition % / Training Compliance / Documents Expiring 30d
- Charts: Headcount trend, Diversity mix, Tenure distribution
- Lists: New hires this month, Probation ending, Birthdays, Anniversaries

---

## 11. Notifications

- New employee added
- Probation ending
- Document expiring (30/15/7d)
- Performance cycle starts
- Training enrolled
- Training overdue
- Birthday/anniversary
- Manager change

---

## 12. Permissions

| Action | Self | Mgr | HR | HR Mgr | CEO |
|--------|------|-----|-----|--------|-----|
| View own profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit own profile | partial | ✓ | ✓ | ✓ | ✓ |
| View team | ✗ | ✓ | ✓ | ✓ | ✓ |
| View all | ✗ | ✗ | ✓ | ✓ | ✓ |
| Hire/terminate | ✗ | request | ✓ | ✓ | ✓ |
| Promote | ✗ | request | ✗ | ✓ | ✓ |
| Compensation changes | ✗ | request | ✗ | ✓ | ✓ |
| Performance review | ✓ self | ✓ team | ✓ | ✓ | ✓ |
| Org chart edit | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Mudad (KSA HR) / Qiwa
- LinkedIn Talent Solutions
- Bayt.com
- Indeed
- LMS (Moodle, Cornerstone)
- Background check services
- Payroll (internal)
- Email/calendar (Google/MS)

---

## 14. Shortcuts

- `Ctrl+E` New employee
- `Ctrl+J` New job posting
- `Ctrl+I` New interview

---

## 15. Mobile / Print

- Employee self-service mobile
- Manager mobile (approve, view team)
- Print: contracts, offer letters, certificates

---

## 16. Audit

- All employee changes (FieldAuditLog)
- Compensation changes audited
- Performance ratings immutable after finalization
- Document uploads logged

---

## 17. Tests

```typescript
describe('Hire Process', () => { /* onboarding workflow */ })
describe('Document Expiry', () => { /* alerts, renewals */ })
describe('Performance Cycle', () => { /* state machine */ })
describe('Org Chart', () => { /* hierarchy, reorgs */ })
describe('Promotion', () => { /* approval, salary update */ })
describe('Termination', () => { /* offboarding checklist */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Document expired during open contract | block + alert |
| Manager left → reassign team | auto-suggest |
| Employee in 2 departments | matrix reporting |
| Iqama renewal during travel | track travel + alert |
| Termination with active loans | settle in EOS |
| 360 feedback with 1 reviewer | minimum required |

---

**نهاية #29** • 10 سيناريوهات • 16 جداول • 10 forms • 10 grids • 35 button • 12 reports
