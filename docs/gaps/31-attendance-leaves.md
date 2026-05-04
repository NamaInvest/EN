# النقص #31: Attendance + Leaves + Shifts (Time & Attendance) — مواصفات

> **المرجعيات:** SAP Time Mgmt、Oracle T&L、Workday Time Tracking、Kronos/UKG、ADP Time

---

## 1. البرومنت

```
وسّع T&A لمستوى Workday:

موجود: Attendance, Vacation, LeaveBalance, LeaveAccrual, LeaveRequest, Shift, WorkShift, leave-engine

النواقص:
A) Attendance:
   - Multi-method check-in (Face-ID, biometric, QR, mobile, web, RFID)
   - Geo-fencing (validate location)
   - Shift assignments
   - Late/early/absent tracking
   - Overtime auto-calc
   - Multi-day shifts (overnight)
   - Break tracking
   - Anomaly detection (forgot to clock-out)
B) Schedule Management:
   - Shift patterns (morning, evening, night, custom)
   - Roster planning (week/month)
   - Shift swaps (with approval)
   - Open shifts (volunteer-based)
   - Coverage requirements per location
C) Leave Mgmt:
   - 11 leave types (annual, sick, maternity, hajj, iddah, paternity, bereavement, marriage, study, hajj, unpaid)
   - Saudi Labor Law (Articles 109-116)
   - Accrual policies (monthly/quarterly/yearly)
   - Carry-forward + expiry
   - Leave encashment
   - Multi-level approval
   - Leave conflicts (with team)
   - Public holidays calendar
D) Integration:
   - Auto-feed to payroll (deductions)
   - GOSI for sick leave
E) Mobile + Self-service:
   - Apply leave from mobile
   - View calendar
   - Check-in via face/QR

APIs (40+), UI (15 pages), Tests 60+
```

---

## 2. السيناريوهات (8)

### A — Daily Check-in
```
1. Employee arrives 8:55 AM
2. Opens mobile app → tap "Check-In"
3. Face-ID validation + GPS check
4. Recorded: Check-in 08:55, Status: ON_TIME (shift starts 9:00)
5. Lunch break: 13:00 OUT, 14:00 IN
6. End of day: 17:30 → Check-out
7. Total: 8h 5m worked + 1h break
```

### B — Shift Planning
```
- Restaurant has 3 shifts: Morning (8-16), Evening (14-22), Night (22-6)
- Manager creates weekly roster
- 12 staff assigned to shifts
- System validates coverage (min 4/shift)
- Notifies staff
- Staff can request swaps
```

### C — Leave Request (Annual)
```
1. Employee: /leaves → [Apply]
2. Type: Annual, Dates: 1-7 May
3. Balance check: 12 days available
4. Reason + emergency contact
5. Submit → manager approval
6. Approved → calendar updated
7. Payroll auto-deducts (no, annual is paid)
```

### D — Maternity Leave (KSA)
```
- Saudi female employee
- 70 days fully paid (10 weeks)
- 30 before + 40 after (or split)
- Auto-calc EDD (Expected Delivery Date)
- Document upload (medical)
- Approval by HR + Manager
- Salary paid in payroll
```

### E — Sick Leave + GOSI
```
- 3 days sick → 100% pay
- Medical certificate required
- 4-30 days → 75% pay (GOSI covers)
- 31-60 days → 50% pay
- 61-90 days → 25% pay
- > 90 days → unpaid
- Auto-calc in payroll
```

### F — Late Arrival Handling
```
- Employee arrives 9:30 (30 min late)
- Grace period: 15 min → over → late
- Repeated lateness:
  - 1st: warning
  - 3rd: written warning
  - 5th: deduction (per policy)
- Auto-tracked
```

### G — Overtime Approval
```
- Employee works extra 3 hours
- Auto-detected from check-out
- Requires pre-approval (or post for emergencies)
- Manager approves
- Counted toward overtime pay
```

### H — Bulk Leave (Holiday Closure)
```
- Eid Al-Fitr 5-day closure
- HR creates bulk leave: all employees, dates, type=Public Holiday
- Auto-applied (no individual requests needed)
- Calendar updated
- Payroll: paid normally
```

---

## 3. تدفق البيانات

```
[Check-in]
POST /attendance/checkin { method, location?, photo? }
   ↓ validate face/biometric/QR
   ↓ check geo-fence
   ↓ determine shift + time status
   ↓ create Attendance record
   ↓ if late > grace → flag

[Leave Request]
POST /leaves { type, dates, reason }
   ↓ balance check
   ↓ conflict check (team)
   ↓ create LeaveRequest (PENDING)
   ↓ notify approvers
   ↓ on approval → update LeaveBalance
   ↓ feed to payroll

[Accrual Cron]
Monthly:
   ↓ for each employee:
     compute earned days based on tenure
     credit LeaveBalance
     check carry-forward limits
```

---

## 4. Schema (إضافات)

```prisma
model Attendance {
  // ... existing
  employeeId      Int
  date            DateTime
  
  shiftId         Int?
  
  checkInTime     DateTime?
  checkInMethod   String?   // 'FACE_ID' | 'BIOMETRIC' | 'QR' | 'WEB' | 'MOBILE_GPS' | 'RFID' | 'MANUAL'
  checkInLocation Json?     // {lat, lng, address}
  checkInPhoto    String?
  
  checkOutTime    DateTime?
  checkOutMethod  String?
  checkOutLocation Json?
  
  totalHoursWorked Decimal? @db.Decimal(5,2)
  breakDurationMin Int      @default(0)
  
  status          String?   // 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'HOLIDAY'
  isLate          Boolean   @default(false)
  lateBy          Int?      // minutes
  isEarlyLeave    Boolean   @default(false)
  earlyBy         Int?
  
  overtimeHours   Decimal?  @db.Decimal(5,2)
  overtimeApproved Boolean  @default(false)
  
  notes           String?
  
  manualEntryByUserId String?
  manualReason    String?
  
  @@unique([employeeId, date])
  @@index([date, status])
}

model AttendanceBreak {
  id              Int       @id @default(autoincrement())
  attendanceId    Int
  attendance      Attendance @relation(fields: [attendanceId], references: [id])
  startTime       DateTime
  endTime         DateTime?
  type            String    // 'LUNCH' | 'PRAYER' | 'COFFEE' | 'OTHER'
  durationMin     Int?
}

model Shift {
  // ... existing
  shiftCode       String    @unique
  name            String
  
  startTime       String    // HH:mm
  endTime         String    // HH:mm
  durationHours   Decimal   @db.Decimal(5,2)
  
  isOvernight     Boolean   @default(false)
  
  graceMinutes    Int       @default(15)
  earlyAllowedMin Int       @default(15)
  
  breakMinutes    Int       @default(60)
  prayerBreakMinutes Int    @default(0)
  
  active          Boolean   @default(true)
}

model ShiftAssignment {
  id              Int       @id @default(autoincrement())
  employeeId      Int
  shiftId         Int
  
  startDate       DateTime
  endDate         DateTime?
  
  daysOfWeek      Int[]     // 0=Sun..6=Sat
  
  branchId        Int?
  
  active          Boolean   @default(true)
}

model Roster {
  id              Int       @id @default(autoincrement())
  weekStart       DateTime
  branchId        Int?
  status          String    @default("DRAFT")  // DRAFT | PUBLISHED | ARCHIVED
  publishedAt     DateTime?
  publishedByUserId String?
  
  assignments     RosterAssignment[]
}

model RosterAssignment {
  id              Int       @id @default(autoincrement())
  rosterId        Int
  roster          Roster    @relation(fields: [rosterId], references: [id], onDelete: Cascade)
  
  employeeId      Int
  shiftId         Int
  date            DateTime
  
  status          String    @default("ASSIGNED")  // ASSIGNED | SWAPPED | OPEN | CANCELLED
}

model ShiftSwap {
  id              Int       @id @default(autoincrement())
  fromAssignmentId Int
  toAssignmentId  Int
  
  requestedByEmployeeId Int
  acceptedByEmployeeId  Int?
  
  status          String    @default("PENDING")  // PENDING | ACCEPTED | REJECTED | CANCELLED | EXPIRED
  
  reason          String?
  managerApproved Boolean   @default(false)
  approvedByUserId String?
  
  requestedAt     DateTime  @default(now())
  decidedAt       DateTime?
}

model Leave {
  id              Int       @id @default(autoincrement())
  leaveCode       String    @unique
  leaveType       String    // 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'HAJJ' | 'IDDAH' | 'BEREAVEMENT' | 'MARRIAGE' | 'STUDY' | 'UNPAID' | 'PUBLIC_HOLIDAY'
  
  nameAr          String
  nameEn          String
  
  isPaid          Boolean   @default(true)
  paidPercent     Decimal   @default(100) @db.Decimal(5,2)
  
  // Eligibility
  minTenureMonths Int?
  applicableGenders String[]?  // ['MALE'] for paternity, ['FEMALE'] for maternity
  applicableNationalities String[]?  // for hajj eligibility etc.
  applicableMaritalStatus String[]?
  
  // Quota
  daysPerYear     Decimal?  @db.Decimal(5,2)
  daysPerOccurrence Int?
  occurrencesPerYear Int?
  occurrencesLifetime Int?
  
  // Accrual
  accrualMethod   String    @default("YEARLY")  // YEARLY | MONTHLY | QUARTERLY | NONE
  
  // Carry forward
  carryForwardAllowed Boolean @default(false)
  carryForwardCap Int?
  carryForwardExpireMonths Int?
  
  // Encashment
  encashable      Boolean   @default(false)
  encashmentRate  Decimal?  @db.Decimal(5,2)  // % of daily salary
  
  // Approval
  requiresMedicalCert Boolean @default(false)
  approvalLevels  Int       @default(1)
  
  // Documentation
  required        Boolean   @default(true)
  
  active          Boolean   @default(true)
}

model LeaveRequest {
  // ... existing
  requestNumber   String    @unique
  employeeId      Int
  leaveTypeId     Int
  
  startDate       DateTime
  endDate         DateTime
  totalDays       Decimal   @db.Decimal(5,2)
  
  reason          String?
  emergencyContact String?
  
  attachments     Json?
  
  status          String    @default("PENDING")  // PENDING | APPROVED | REJECTED | CANCELLED | TAKEN
  
  approvalChain   Json
  
  takenStartedAt  DateTime?
  takenEndedAt    DateTime?
  
  payrollDeducted Boolean   @default(false)
  
  cancellationReason String?
}

model LeaveBalance {
  // ... existing
  employeeId      Int
  leaveTypeId     Int
  
  fiscalYear      Int
  
  entitledDays    Decimal   @db.Decimal(8,4)
  carriedForwardDays Decimal @default(0) @db.Decimal(8,4)
  takenDays       Decimal   @default(0) @db.Decimal(8,4)
  pendingDays     Decimal   @default(0) @db.Decimal(8,4)
  encashedDays    Decimal   @default(0) @db.Decimal(8,4)
  expiredDays     Decimal   @default(0) @db.Decimal(8,4)
  availableDays   Decimal   @db.Decimal(8,4)
  
  @@unique([employeeId, leaveTypeId, fiscalYear])
}

model LeaveAccrual {
  // ... existing
  employeeId      Int
  leaveTypeId     Int
  
  accrualDate     DateTime
  daysAccrued     Decimal   @db.Decimal(8,4)
  reason          String?   // 'MONTHLY' | 'YEARLY_RESET' | 'CARRY_FORWARD' | 'MANUAL_GRANT'
}

model PublicHoliday {
  id              Int       @id @default(autoincrement())
  date            DateTime
  name            String
  nameEn          String?
  countryCode     String    @default("SA")
  isPaid          Boolean   @default(true)
  applicableEmployeeTypes String[]  // ['ALL'] or ['MUSLIM_ONLY']
}
```

---

## 5. Forms (8)

A: Check-in/out (Mobile)
B: Manual Attendance Entry
C: Leave Request (with type selector)
D: Shift Definition
E: Roster Planning (calendar)
F: Shift Swap Request
G: Bulk Leave (Holiday)
H: Leave Encashment

---

## 6. Tables (8)

A: Daily Attendance
B: Monthly Attendance Summary
C: Leave Requests (workflow)
D: Leave Balances
E: Roster (calendar view)
F: Shift Swaps
G: Public Holidays
H: Anomalies (missed check-out, etc.)

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-checkin | تسجيل دخول | 🟢 employee |
| btn-checkout | تسجيل خروج | 🟢 employee |
| btn-break-start | بدء استراحة | 🟦 employee |
| btn-break-end | إنهاء استراحة | 🟢 employee |
| btn-attendance-manual | إدخال يدوي | 🟡 hr + reason |
| btn-attendance-correct | تصحيح | 🟡 hr |
| btn-leave-apply | + طلب إجازة | 🟢 employee |
| btn-leave-approve | موافقة | 🟢 manager |
| btn-leave-reject | رفض | 🔴 manager + reason |
| btn-leave-cancel | إلغاء | 🔴 employee/hr |
| btn-leave-encash | استبدال نقدي | 🟦 employee + hr |
| btn-shift-create | + شفت | 🟢 hr mgr |
| btn-shift-assign | إسناد شفت | 🟢 manager |
| btn-roster-create | + جدول أسبوعي | 🟢 manager |
| btn-roster-publish | نشر | 🟦 manager |
| btn-roster-fill-open | ملء shift شاغر | 🟢 employee |
| btn-shift-swap-request | طلب تبديل | 🟢 employee |
| btn-shift-swap-accept | قبول التبديل | 🟢 colleague |
| btn-shift-swap-approve | موافقة المدير | 🟢 manager |
| btn-overtime-approve | موافقة OT | 🟢 manager |
| btn-bulk-leave | إجازة جماعية | 🟢 hr |
| btn-public-holiday-add | + يوم رسمي | 🟢 hr mgr |
| btn-attendance-export | تصدير | ⬜ hr |
| btn-leave-balance-recalc | إعادة احتساب الرصيد | 🟦 hr |
| btn-leave-accrual-run | تشغيل الاستحقاق | ⬜ system |
| btn-anomaly-resolve | حل الشذوذ | 🟦 hr |
| btn-fingerprint-enroll | تسجيل بصمة | 🟦 hr |
| btn-faceid-enroll | تسجيل وجه | 🟦 hr |

---

## 8. Search & Filters

- Attendance: date range, employee, status, branch, late > X, missing checkout
- Leaves: type, status, employee, date range, days range
- Roster: week, branch, employee
- Anomalies: type, resolved

---

## 9. Reports

- Daily/Monthly Attendance
- Late Arrivals
- Absenteeism Rate
- Overtime Summary
- Leave Liability (financial)
- Leave Pattern Analysis
- Roster Coverage
- Shift Swap History
- Productivity Hours
- Anomalies Report

---

## 10. Dashboards

- KPIs: Today Present / Late / Absent / On Leave / OT Hours
- Charts: Attendance trend, Leave usage, Coverage gaps
- Lists: Late today, Pending leaves, Anomalies

---

## 11. Notifications

- Late arrival
- Missing check-out
- Leave request awaiting approval
- Leave approved/rejected
- Roster published
- Shift swap accepted
- Birthday/anniversary
- Public holiday reminder

---

## 12. Permissions

| Action | Self | Mgr | HR | HR Mgr |
|--------|------|-----|-----|--------|
| Check-in | ✓ | ✓ | ✓ | ✓ |
| Manual entry | ✗ | ✗ | ✓ | ✓ |
| Apply leave | ✓ | ✓ | ✓ | ✓ |
| Approve leave | ✗ | ✓ team | ✓ | ✓ |
| Cancel approved | ✗ | ✓ | ✓ | ✓ |
| Encash leave | ✓ | ✗ | ✓ | ✓ |
| Create shift | ✗ | ✗ | ✗ | ✓ |
| Assign shifts | ✗ | ✓ team | ✓ | ✓ |
| Bulk leave | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Biometric devices (ZKTeco, Suprema, Hanvon)
- Face-ID systems (camera-based)
- RFID readers
- Mobile (geo-fencing)
- Mudad / Qiwa (compliance)
- GOSI (sick leave reporting)
- Calendar (Outlook/Google)
- Payroll (auto-deductions)

---

## 14. Shortcuts

- `I` Check-in
- `O` Check-out
- `Ctrl+L` New leave request

---

## 15. Mobile / Print

- Mobile: check-in/out + leave + roster view
- Print: monthly attendance, leave letter

---

## 16. Audit

- All check-ins logged with method + location
- Manual entries require reason
- Leave changes audited
- Roster changes versioned

---

## 17. Tests

```typescript
describe('Check-in Methods', () => { /* face, biometric, QR, GPS */ })
describe('Late Detection', () => { /* grace period, threshold */ })
describe('Leave Balance', () => { /* accrual, carry-forward, expiry */ })
describe('Sick Leave', () => { /* 3-30-60-90 day rule */ })
describe('Maternity', () => { /* 70 days KSA */ })
describe('Roster', () => { /* coverage validation */ })
describe('Shift Swap', () => { /* approval flow */ })
describe('Overtime', () => { /* weekday vs weekend rates */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Check-in without check-out (forgot) | flag + manual close |
| Multi-day shift overnight | split correctly |
| Leave during public holiday | use holiday |
| Sick leave > certificate | hold + medical review |
| Maternity overlap with annual | maternity priority |
| Shift swap conflict (overlap) | reject |
| Check-in outside geo-fence | flag + manager review |
| Roster published but employee resigned | reassign |
| Holiday cancelled (rare) | recalculate |

---

**نهاية #31** • 8 سيناريوهات • 9 جداول • 8 forms • 8 grids • 28 button • 10 reports
