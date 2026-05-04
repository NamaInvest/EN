# البرومنتات الجاهزة — الموارد البشرية والرواتب

كل بند: **الحالة الحالية** → **سيناريو عالمي** → **فلو بيانات** → **برومنت جاهز**.

---

## H-01 — Mudad / Qiwa / Absher / Muqeem API Integration

### الحالة الحالية
WPS يولّد ملف SIF يدوي. **لا integration مع Mudad API**. لا Qiwa contracts. لا Absher Iqama check.

### السيناريو العالمي (Saudi modern HR)
عند توظيف موظف جديد:
1. Qiwa: ينشئ عقد عمل آلياً، يأخذ موافقة العامل عبر تطبيق
2. GOSI: يضاف للتأمين تلقائياً
3. Mudad: يستلم رواتبه شهرياً عبر API
4. Absher: يتحقق من إقامته كل 3 شهور

### فلو البيانات
```
[New Employee] → [Push to Qiwa] → [Worker accepts in app]
                       ↓
                  [Sync to GOSI]
                       ↓
              [Monthly: Mudad API submission]
                       ↓
       [Quarterly cron: Absher check Iqama validity]
                       ↓
          [If expiring: notify HR + employee]
```

### البرومنت الجاهز
```
بناء Saudi Gov APIs Integration.

1. Schema:
   GovApiCredentials {
     id, provider (MUDAD|QIWA|ABSHER|MUQEEM|GOSI|ZATCA_EGS),
     apiKey (encrypted), apiSecret (encrypted),
     env (SANDBOX|PRODUCTION), accessToken?, tokenExpiry?, isActive
   }
   GovApiTransaction {
     id, provider, endpoint, method, requestBody JSON,
     responseBody JSON, status (PENDING|SUCCESS|FAILED|RETRYING),
     errorMessage?, retryCount int, createdAt
   }

2. Engine src/lib/saudi-gov/:
   - mudad.ts:
     * authenticate() → OAuth2 token
     * submitWPSBatch(batchId): pushes WPS file via API
     * pollStatus(transactionId): تتبع نتيجة الإرسال
     * reconcileRejections(): handle bounced employees
   - qiwa.ts:
     * createContract(employeeData): pushes new employment contract
     * receiveContractUpdates(): webhook for probation/termination/leave
     * getContractStatus(contractId)
   - absher.ts:
     * checkIqama(iqamaNumber): returns validity + expiry
     * checkVisa(visaNumber)
   - muqeem.ts: نفس فكرة Absher (للزوار/الزائرين)
   - gosi.ts (REST API for GOSI portal):
     * registerEmployee(employee)
     * monthlyContributionSubmit(period)

3. Cron jobs:
   - Daily: pollStatus pending Mudad transactions
   - Quarterly (or on document-expiry trigger): bulk Absher check
   - Monthly 25th: prepare next month WPS via Mudad

4. API:
   - GET/POST/PUT /api/admin/gov-apis/credentials
   - POST /api/hr/qiwa/contracts/sync
   - POST /api/hr/mudad/wps/submit/[batchId]
   - GET /api/hr/absher/check/[iqama]
   - GET /api/admin/gov-apis/transactions (audit)

5. UI /admin/gov-apis:
   - Credentials manager (5 tabs per provider)
   - Test connection buttons
   - Transaction log
   - Status dashboard

6. Compliance:
   - encrypt credentials at rest
   - audit every call (ip, user, timestamp)
   - signed payloads where required (HMAC)

7. Error handling:
   - retry 3x with exponential backoff
   - on final fail: notification + manual queue

8. Tests:
   - mock Mudad API success/fail
   - WPS submission end-to-end
   - Absher check valid/expired
```

---

## H-02 — Approval Workflow للإجازات (Manager → HR → Finance)

### الحالة الحالية
طلبات الإجازات تُنشأ بدون workflow. تحديث manual للحالة.

### البرومنت الجاهز
```
ربط Leave Requests بـ approval-engine.ts.

1. Schema (extend LeaveRequest):
   ADD approvalRequestId? FK
   ADD currentApproverUserId?
   ADD approvalLevel int default 0

2. Workflow rules:
   - Sick leave ≤ 3 days: Manager only
   - Sick leave > 3 days: Manager + HR (medical certificate required)
   - Annual leave ≤ 5 days: Manager
   - Annual leave > 5 days: Manager + HR
   - Hajj leave: Manager + HR + Finance (paid)
   - Maternity: HR direct (legal entitlement)

3. Integration:
   - on POST /api/hr/leaves: create ApprovalRequest with appropriate route
   - on approve/reject: update LeaveRequest.status
   - on full approval: deduct from balance
   - email/WhatsApp/push notifications

4. UI:
   - Employee /attendance/leaves: submit + track
   - Manager dashboard: pending approvals queue
   - Approval flow visualization

5. Mobile:
   - PWA push notification on approve required
   - one-tap approve

6. Tests:
   - sick 5 days → routes to HR
   - manager rejects → employee notified
   - delegation: manager on leave → delegate
```

---

## H-03 — Org Chart / Hierarchy / Departments / Reporting Manager

### الحالة الحالية
Employee model لا فيها department/manager/position level واضح.

### البرومنت الجاهز
```
بناء Organization Structure.

1. Schema:
   Department { id, code, name, parentDepartmentId?, costCenterId?, managerId?, isActive }
   Position { id, code, title, departmentId, gradeId?, headcount int, isActive }
   PayGrade { id, code, minSalary, maxSalary, midPoint, currency }
   ALTER Employee:
     ADD departmentId, positionId, reportingManagerId?,
     hiringDate, contractType (PERMANENT|TEMPORARY|CONTRACT|PART_TIME),
     contractEndDate?, employmentStatus (ACTIVE|ON_LEAVE|RESIGNED|TERMINATED|RETIRED)

2. Engine:
   - getOrgChart(rootDepartmentId?): recursive tree
   - getReportingChain(employeeId): up to CEO
   - getDirectReports(managerId): for performance review
   - validateNoCycles(employeeId, newManagerId)

3. API:
   - CRUD /api/hr/departments (with tree view)
   - CRUD /api/hr/positions
   - GET /api/hr/employees/[id]/org-chart
   - GET /api/hr/employees/[id]/reports
   - POST /api/hr/transfer (employee dept change → audit + notification)

4. UI /hr/organization:
   - Drag-drop org chart (react-flow)
   - Department tree
   - Position management (with budget headcount vs actual)

5. Reports:
   - Headcount by department
   - Salary spend by dept
   - Span of control analysis

6. Tests:
   - cycle detection
   - org chart 3 levels deep
   - transfer with audit trail
```

---

## H-04 — Performance Management (OKRs / Goals / 360 Reviews)

### الحالة الحالية
HR Evaluations API = STUB.

### البرومنت الجاهز
```
بناء Performance Management.

1. Schema:
   PerformanceCycle {
     id, name, year, quarter?, startDate, endDate,
     status (DRAFT|ACTIVE|REVIEW|CLOSED), templateId
   }
   Goal {
     id, employeeId, cycleId, parentGoalId?, title, description,
     type (OKR|KPI|PROJECT), weight Decimal, targetValue, actualValue?,
     achievementPct Decimal, status, dueDate
   }
   PerformanceReview {
     id, employeeId, cycleId, reviewerType (SELF|MANAGER|PEER|SUBORDINATE|CUSTOMER),
     reviewerId, ratings JSON, comments TEXT, submittedAt?
   }
   PerformanceTemplate {
     id, name, competencies JSON, ratingScale JSON
   }

2. Engine:
   - cascadeGoals(parentGoalId, childEmployeeIds): align team goals
   - compute360Score(employeeId, cycleId): weighted avg of all reviewers
   - identifyTopPerformers(cycleId, threshold)
   - identifyAtRisk(cycleId)

3. API:
   - CRUD /api/hr/performance/cycles
   - CRUD /api/hr/performance/goals
   - POST /api/hr/performance/reviews/[id]/submit
   - GET /api/hr/performance/employees/[id]/scorecard

4. UI /hr/performance:
   - Cycle calendar
   - Goal tree (parent → child)
   - Review form (multi-rater)
   - Calibration meeting view (table of all employees + ratings)
   - Employee scorecard

5. Tests:
   - cascade goals
   - 360 score computation
   - calibration adjustments
```

---

## H-05 — Travel & Expense Management (Concur-style)

### الحالة الحالية
لا T&E module.

### البرومنت الجاهز
```
بناء T&E.

1. Schema:
   TravelRequest {
     id, employeeId, purpose, fromDate, toDate, destination,
     estimatedCost JSON ({flight, hotel, meals, transport}),
     advanceRequested Decimal, status, approvedBy?
   }
   ExpenseClaim {
     id, employeeId, travelRequestId?, period, totalAmount,
     status (DRAFT|SUBMITTED|APPROVED|PAID|REJECTED), approvedBy?
   }
   ExpenseLine {
     id, claimId, date, category (FLIGHT|HOTEL|MEAL|TRANSPORT|OTHER),
     amount, currency, exchangeRate?, baseAmount,
     receiptUrl?, ocrExtractedData JSON?, projectId?, costCenterId?
   }
   ExpensePolicy {
     id, category, dailyLimit?, requiresReceipt bool, requiresPreApproval bool
   }

2. Engine:
   - Receipt OCR via Gemini: extract date/amount/vendor/category
   - Policy violation check
   - Auto-approve if below threshold + within policy
   - Generate JE: DR Expense (per category), CR Petty Cash or Employee Liability

3. Mobile:
   - Photo receipt → OCR → auto-fill claim
   - GPS auto-tag location
   - Mileage tracking

4. API:
   - CRUD /api/hr/travel-requests
   - CRUD /api/hr/expense-claims
   - POST /api/hr/expense-claims/[id]/submit
   - PUT /api/hr/expense-claims/[id]/approve
   - POST /api/hr/expenses/ocr-receipt (Gemini)

5. UI /hr/expenses:
   - Submit claim wizard (with receipt upload)
   - Approval queue (manager)
   - Reimbursement run (link to payment-run-engine)

6. Tests:
   - receipt OCR accuracy
   - policy violation flag
   - reimbursement flow
```

---

## H-06 — Self-Service Portal للموظفين

### الحالة الحالية
لا employee portal مستقل.

### البرومنت الجاهز
```
بناء /portal/employee.

1. Pages:
   - /portal/employee/login
   - /portal/employee/dashboard (next leave, next salary, alerts)
   - /portal/employee/profile (update phone, address, emergency contacts)
   - /portal/employee/leaves (balance, request, history)
   - /portal/employee/payslips (download monthly PDF)
   - /portal/employee/attendance (punch in/out, monthly report)
   - /portal/employee/expenses (submit + track)
   - /portal/employee/documents (Iqama, contract, certificates)
   - /portal/employee/training (assigned courses)
   - /portal/employee/performance (goals, reviews)

2. Authentication:
   - JWT + refresh token
   - 2FA recommended
   - separate from main app auth

3. Mobile-first design:
   - PWA installable
   - Push notifications

4. API:
   - /api/portal/employee/* (separate namespace)
   - read-only mostly، write endpoints for: leaves submit, expense, profile updates، attendance punch

5. Localization: ar/en

6. Tests:
   - login flow
   - request leave
   - download payslip
   - attendance punch with geofence
```

---

## H-07 — Multi-Shift Scheduling + Overtime Rules

### الحالة الحالية
Shifts page موجودة لكن simple. لا multi-shift scheduling، لا overtime rules engine.

### البرومنت الجاهز
```
بناء Shift Engine.

1. Schema:
   ShiftPattern { id, name, daysPattern JSON, startTime, endTime, breakMinutes }
   ShiftSchedule {
     id, employeeId, date, shiftPatternId, status (SCHEDULED|COMPLETED|MISSED|REPLACED),
     replacementEmployeeId?, modifiedBy?, notes
   }
   OvertimeRule {
     id, name, dailyThresholdHours, weeklyThresholdHours,
     weekdayMultiplier Decimal, weekendMultiplier Decimal, holidayMultiplier Decimal,
     applicableTo (ALL|DEPARTMENT|POSITION)
   }
   OvertimeRecord {
     id, employeeId, date, regularHours, overtimeHours, multiplier, baseRate, totalPay
   }

2. Engine:
   - generateSchedule(department, weekStart): auto-rotate shifts
   - swapShift(employeeA, employeeB, date, approvalRequired)
   - computeOvertime(employeeId, period):
     * compare actual hours vs scheduled
     * apply rule (Saudi default: weekday 1.5x, weekend 2x, holiday 2.5x)
     * post to next payroll

3. Saudi Labor Law:
   - Daily max: 8 hours regular + 2 hours OT
   - Weekly max: 48 hours total
   - Friday/Saturday weekend
   - Public holidays (Eid, National Day, Founding Day): 2.5x

4. API:
   - CRUD /api/hr/shift-patterns
   - POST /api/hr/schedules/generate
   - POST /api/hr/schedules/swap
   - GET /api/hr/overtime/[employeeId]?period

5. UI /hr/scheduling:
   - Calendar view (week/month) per dept
   - Drag-drop shifts
   - Overtime alerts (red highlights)
   - Auto-generate from pattern

6. Tests:
   - rotating 3-shift coverage
   - overtime calculation Saudi weekend
   - shift swap with approval
```

---

## H-08 — Payroll: Selective + PDF Slip + Bank Batch

### الحالة الحالية
`/api/hr/payroll/generate/route.ts` يولد لكل الموظفين دفعة واحدة. لا selective، لا PDF slip، لا bank batch grouping.

### البرومنت الجاهز
```
وسّع Payroll.

1. Schema (extend PayrollRun):
   ADD selectionCriteria JSON, generatedPdfsAt?, sentToBankAt?, bankBatches JSON

2. Engine:
   - generatePayroll(period, criteria):
     * filter employees: selectionCriteria (department, status, manual list)
     * compute per employee
     * group by bankCode → BankBatch
     * each batch → WPS SIF file
   - generatePayslipPDF(payrollEntryId):
     * branded PDF with breakdown (basic + allowances - deductions)
     * Hijri + Gregorian date
     * Arabic + English option
     * includes GOSI breakdown
     * QR code with verification link
   - emailPayslip(payrollEntryId): via src/lib/email.ts
   - bulkEmailPayslips(payrollRunId)

3. UI /hr/payroll:
   - Run wizard:
     * Select employees (filters)
     * Preview (table editable)
     * Approve
     * Execute (generates JE + WPS + PDF batch)
   - Run detail:
     * Download all PDFs (zip)
     * Download per employee
     * Send all by email button
     * Bank batches tab

4. API:
   - POST /api/hr/payroll/runs/preview
   - POST /api/hr/payroll/runs/execute
   - GET /api/hr/payroll/runs/[id]/payslip/[empId] (PDF)
   - POST /api/hr/payroll/runs/[id]/email-payslips

5. Tests:
   - selective payroll (exclude probation)
   - PDF rendering
   - bank batch grouping
```

---

## H-09 — GOSI Auto-Detect Nationality + Special Categories

### الحالة الحالية
GOSI engine يفترض الجميع سعوديون (hardcoded). لا فئات خاصة.

### البرومنت الجاهز
```
أصلح GOSI:

1. Schema (extend Employee):
   ADD nationality (SAUDI|GCC|EXPAT|MILITARY|GOV_EMPLOYEE),
     iqamaNumber (encrypted), passportNumber (encrypted), idNumber (encrypted),
     birthDate, gender, maritalStatus

2. Engine src/lib/gosi-engine.ts:
   - getRates(employee):
     * SAUDI: 9% emp + 9% emp + 1% Saned + 2% Hazards
     * GCC: variable per country (Bahrain: full Saudi, others: hazards only)
     * EXPAT: 2% Hazards (employer only)
     * MILITARY: separate rules (army pension)
     * GOV_EMPLOYEE: separate (PRA - Public Retirement Authority)

3. UI:
   - Employee form: nationality dropdown auto-populates rates
   - GOSI calculator preview button

4. Migration:
   - existing employees: default SAUDI; prompt admin to review

5. Tests:
   - 5 nationalities × correct rate calculation
   - changes mid-period
```

---

## H-10 — Recruitment / ATS متقدم + Onboarding Workflow

### الحالة الحالية
بوابة استقبال CVs موجودة لكن لا ATS workflow، لا onboarding.

### البرومنت الجاهز
```
بناء ATS + Onboarding.

1. Schema:
   JobOpening {
     id, title, departmentId, positionId, type (FT|PT|CONTRACT),
     minSalary, maxSalary, location, description, requirements JSON,
     status (DRAFT|OPEN|ON_HOLD|CLOSED|FILLED), createdBy, postedAt
   }
   Candidate {
     id, name, email, phone, resumeUrl, linkedinUrl?,
     source (CAREERS_SITE|LINKEDIN|REFERRAL|RECRUITER|JOB_BOARD),
     skills JSON, experience JSON, education JSON
   }
   Application {
     id, candidateId, jobOpeningId, appliedAt,
     stage (NEW|SCREENING|PHONE_INTERVIEW|TECHNICAL|FINAL|OFFER|HIRED|REJECTED|WITHDRAWN),
     stageHistory JSON, score Decimal?, recruiterId, hiringManagerId
   }
   Interview {
     id, applicationId, scheduledAt, type (PHONE|VIDEO|ONSITE|TECHNICAL),
     interviewerIds JSON, feedback JSON, rating Decimal?, recommendation (HIRE|NO_HIRE|MAYBE)
   }
   OfferLetter {
     id, applicationId, position, salary, startDate, expiresAt,
     status (PENDING|ACCEPTED|DECLINED|EXPIRED), pdfUrl?
   }
   OnboardingTask {
     id, employeeId, taskName, owner, dueDate, status, completedAt?
   }
   OnboardingTemplate {
     id, name, applicableTo, tasks JSON
   }

2. Engine:
   - rankCandidates(jobOpeningId): AI-based scoring (skills match)
   - scheduleInterview: send calendar invite via email integration
   - sendOfferLetter: PDF + e-sign integration
   - startOnboarding(newEmployeeId): apply template → create tasks
     * IT setup (laptop, accounts)
     * HR (Iqama copy, contract sign)
     * Finance (bank IBAN)
     * Manager intro
     * Training assignment

3. Public Careers Site:
   - /careers public page
   - apply form upload CV
   - track application status

4. API:
   - CRUD /api/hr/jobs
   - GET/POST /api/hr/candidates
   - POST /api/hr/applications/[id]/move-stage
   - POST /api/hr/interviews/[id]/feedback
   - POST /api/hr/offers/[id]/send
   - POST /api/hr/onboarding/[employeeId]/start

5. UI /hr/recruitment:
   - Jobs board
   - Candidate pipeline (Kanban: stages)
   - Application detail (timeline + interviews)
   - Interview scorecard
   - Offer letter builder + e-sign
   - Onboarding dashboard

6. Tests:
   - candidate ranking
   - stage progression
   - offer acceptance flow
   - onboarding tasks creation
```

---

# ملخص فجوات HR الـ 10

| # | الفجوة | الأولوية |
|---|------|------|
| H-01 | Mudad/Qiwa/Absher API | 🔴 |
| H-02 | Leave Approval Workflow | 🟠 |
| H-03 | Org Chart / Hierarchy | 🟠 |
| H-04 | Performance Mgmt (OKRs/360) | 🟡 |
| H-05 | T&E (Concur-style) | 🟡 |
| H-06 | Self-Service Portal | 🟠 |
| H-07 | Multi-Shift + Overtime Rules | 🟠 |
| H-08 | Selective Payroll + PDF Slip | 🟠 |
| H-09 | GOSI Nationality Auto-Detect | 🔴 |
| H-10 | Recruitment ATS + Onboarding | 🟡 |
