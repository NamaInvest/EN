# النقص #32: School / Education Module — مواصفات

> **المرجعيات:** Blackbaud, PowerSchool, Skyward, Classera (KSA), Madrasati (KSA MoE), Tatweer

---

## 1. البرومنت

```
وسّع School Module:

موجود: Student, AcademicClass, ClassEnrollment, SchoolInvoice, Parent Portal

النواقص:
A) Academic structure: Years, Terms, Classes, Sections, Subjects
B) Student lifecycle: Application → Admission → Enrollment → Graduation
C) Tuition + fees (with schedule + discounts)
D) Grades + Report Cards
E) Attendance per class period
F) Teacher management + scheduling
G) Parent portal: grades, attendance, fees, communications
H) Library
I) Transport (bus routes)
J) Cafeteria
K) Online classes (LMS integration)
L) Discipline / Behavioral records
M) Health records
N) Alumni network
APIs (40+), UI (15 pages), Tests 50+
```

---

## 2. السيناريوهات (8)

### A — Student Admission
```
1. Application: parent submits online (school portal)
2. Documents required: birth cert, prev school transcripts
3. Application fee paid
4. Entrance exam scheduled
5. Interview
6. Decision: Accepted/Waitlist/Rejected
7. On accept: enrollment + tuition agreement
```

### B — Tuition Schedule
```
- Annual fee 50,000 SAR
- Schedule: 4 quarterly installments
- Sibling discount 10%
- Early bird discount 5% (if paid first month)
- Auto-invoice each quarter
- Late fees if overdue
```

### C — Class Schedule + Attendance
```
- 6 periods per day, each 50 min
- Teachers assigned per subject per class
- Daily attendance taken per period
- Student absent → SMS to parent
- Pattern detection: chronic absenteeism
```

### D — Grades + Report Cards
```
- Subjects: Math, Arabic, English, Science, Social, Religion, Art, PE
- Each subject: tests, quizzes, projects, final
- Weights: tests 30%, quizzes 20%, projects 20%, final 30%
- Auto-calc final grade per subject + GPA
- Quarterly report card auto-generated
- Sent to parents
```

### E — Parent Communication
```
- Parent Portal:
  - View child's grades + attendance
  - View fees + pay online
  - Message teacher
  - View school announcements
  - Permission slips for trips
  - Health records
- Notifications: SMS, email, app push
```

### F — Discipline Record
```
- Student misbehavior incident
- Teacher logs: type, date, action taken
- Multiple incidents → escalation to admin
- Parent notification
- Counselor session if needed
```

### G — Bus Transportation
```
- 5 routes covering city
- Each child assigned to route + stop
- Driver tablet with student list
- Pickup/drop-off scanned (RFID/manual)
- Parent SMS: "Child boarded bus", "Child off at school"
- Live tracking via GPS
```

### H — Online Classes
```
- COVID-style or hybrid
- Schedule with Zoom links
- Attendance auto-tracked from Zoom
- Recording auto-saved
- Assignment submission
- Quiz + grading
```

---

## 3. تدفق البيانات

```
[Admission]
POST /admissions { studentInfo, parentInfo, documents }
   ↓ create application
   ↓ schedule tests
   ↓ on accept → create Student + Parent + Enrollment

[Daily Attendance]
POST /attendance/period { classId, period, students[] }
   ↓ record per student
   ↓ if absent → notify parent
   ↓ aggregate to daily/monthly

[Tuition Cycle]
Cron quarterly:
   ↓ generate invoices per enrollment
   ↓ apply discounts
   ↓ send to parents
   ↓ track payments
```

---

## 4. Schema (إضافات)

```prisma
model AcademicYear {
  id              Int       @id @default(autoincrement())
  yearCode        String    @unique  // "2025-2026"
  startDate       DateTime
  endDate         DateTime
  active          Boolean   @default(false)
  terms           AcademicTerm[]
}

model AcademicTerm {
  id              Int       @id @default(autoincrement())
  yearId          Int
  year            AcademicYear @relation(fields: [yearId], references: [id])
  termCode        String    // "Q1" | "Q2" | "S1" | "S2"
  termNumber      Int
  startDate       DateTime
  endDate         DateTime
}

model GradeLevel {
  id              Int       @id @default(autoincrement())
  code            String    @unique  // "G1" | "G2" | etc.
  nameAr          String
  nameEn          String
  level           Int
  classes         AcademicClass[]
}

model AcademicClass {
  // ... existing
  yearId          Int
  gradeLevelId    Int
  gradeLevel      GradeLevel @relation(fields: [gradeLevelId], references: [id])
  
  section         String    // "A" | "B" | "C"
  classCode       String    @unique  // "G1-A-2026"
  
  capacity        Int
  currentEnrollment Int     @default(0)
  
  homeroomTeacherId Int?
  
  classroom       String?
  
  enrollments     ClassEnrollment[]
  schedule        ClassSchedule[]
}

model Student {
  // ... existing
  studentCode     String    @unique
  
  firstName       String
  lastName        String
  arabicName      String?
  
  dateOfBirth     DateTime
  gender          String
  nationality     String
  
  nationalId      String?
  
  // Contact
  studentEmail    String?
  studentPhone    String?
  
  // Parents
  fatherName      String?
  fatherPhone     String?
  fatherEmail     String?
  fatherJob       String?
  motherName      String?
  motherPhone     String?
  motherEmail     String?
  
  // Address
  homeAddress     String?
  
  // Health
  bloodType       String?
  allergies       String?
  medicalConditions String?
  emergencyContact String?
  
  // Status
  status          String    @default("ACTIVE")  // APPLIED | ACCEPTED | ENROLLED | ACTIVE | WITHDRAWN | GRADUATED | TRANSFERRED
  enrollmentDate  DateTime?
  graduationDate  DateTime?
  withdrawalDate  DateTime?
  withdrawalReason String?
  
  // Photo
  photoUrl        String?
  
  // Bus
  busRouteId      Int?
  busStopId       Int?
  
  parents         Parent[]
  enrollments     ClassEnrollment[]
  invoices        SchoolInvoice[]
  grades          StudentGrade[]
  attendance      StudentAttendance[]
  disciplineRecords DisciplineRecord[]
  healthRecords   StudentHealthRecord[]
}

model Parent {
  id              Int       @id @default(autoincrement())
  studentId       Int
  student         Student   @relation(fields: [studentId], references: [id])
  
  type            String    // 'FATHER' | 'MOTHER' | 'GUARDIAN'
  name            String
  phone           String
  email           String?
  
  isPrimaryContact Boolean  @default(false)
  hasPortalAccess  Boolean  @default(true)
  
  passwordHash    String?
}

model ClassEnrollment {
  // ... existing
  studentId       Int
  classId         Int
  yearId          Int
  
  enrolledAt      DateTime  @default(now())
  withdrawnAt     DateTime?
  
  tuitionFee      Decimal   @db.Decimal(20,4)
  discountPercent Decimal   @default(0) @db.Decimal(5,2)
  finalFee        Decimal   @db.Decimal(20,4)
  
  paymentSchedule String    @default("QUARTERLY")  // ANNUAL | SEMESTER | QUARTERLY | MONTHLY
}

model Subject {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  nameAr          String
  nameEn          String
  applicableGradeLevels Int[]
  active          Boolean   @default(true)
}

model ClassSchedule {
  id              Int       @id @default(autoincrement())
  classId         Int
  class           AcademicClass @relation(fields: [classId], references: [id])
  
  subjectId       Int
  teacherId       Int
  
  dayOfWeek       Int       // 0-6
  period          Int       // 1-8
  startTime       String
  endTime         String
  
  classroom       String?
  
  termId          Int
}

model Teacher {
  id              Int       @id @default(autoincrement())
  employeeId      Int       @unique
  
  subjects        Int[]
  qualifications  String[]
  yearsExperience Int?
  
  specializations String[]
}

model StudentGrade {
  id              Int       @id @default(autoincrement())
  studentId       Int
  student         Student   @relation(fields: [studentId], references: [id])
  
  classId         Int
  subjectId       Int
  termId          Int
  
  gradeType       String    // 'TEST' | 'QUIZ' | 'PROJECT' | 'FINAL' | 'HOMEWORK' | 'PARTICIPATION'
  title           String
  
  score           Decimal   @db.Decimal(5,2)
  maxScore        Decimal   @db.Decimal(5,2)
  weight          Decimal   @db.Decimal(5,2)
  
  date            DateTime
  enteredByTeacherId Int
  
  comments        String?
}

model StudentAttendance {
  id              Int       @id @default(autoincrement())
  studentId       Int
  student         Student   @relation(fields: [studentId], references: [id])
  classId         Int?
  
  date            DateTime
  period          Int?
  
  status          String    // 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK'
  reason          String?
  excused         Boolean   @default(false)
  excuseDocumentUrl String?
  
  recordedByTeacherId Int
}

model DisciplineRecord {
  id              Int       @id @default(autoincrement())
  studentId       Int
  student         Student   @relation(fields: [studentId], references: [id])
  
  date            DateTime
  type            String    // 'MINOR' | 'MAJOR' | 'CRITICAL'
  category        String    // 'TARDINESS' | 'UNIFORM' | 'BEHAVIOR' | 'BULLYING' | 'ACADEMIC_DISHONESTY' | 'OTHER'
  description     String    @db.Text
  
  actionTaken     String?
  notifiedParents Boolean   @default(false)
  
  recordedByTeacherId Int
}

model SchoolInvoice {
  // ... existing
  studentId       Int
  student         Student   @relation(fields: [studentId], references: [id])
  
  invoiceType     String    // 'TUITION' | 'TRANSPORT' | 'CAFETERIA' | 'BOOKS' | 'TRIP' | 'OTHER'
  
  termId          Int?
  
  baseAmount      Decimal   @db.Decimal(20,4)
  discounts       Decimal?  @db.Decimal(20,4)
  totalAmount     Decimal   @db.Decimal(20,4)
  paidAmount      Decimal   @default(0) @db.Decimal(20,4)
  
  dueDate         DateTime
  
  status          String    @default("UNPAID")  // UNPAID | PARTIAL | PAID | OVERDUE | WAIVED
  
  details         SchoolInvoiceDetail[]
}

model SchoolInvoiceDetail {
  id              Int       @id @default(autoincrement())
  invoiceId       Int
  invoice         SchoolInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  description     String
  amount          Decimal   @db.Decimal(20,4)
}

model BusRoute {
  id              Int       @id @default(autoincrement())
  routeName       String
  routeCode       String    @unique
  driverId        Int?
  busPlateNumber  String?
  capacity        Int
  
  stops           BusStop[]
}

model BusStop {
  id              Int       @id @default(autoincrement())
  routeId         Int
  route           BusRoute  @relation(fields: [routeId], references: [id])
  
  stopName        String
  pickupTime      String
  dropoffTime     String
  geoLocation     Json?
  
  studentsAtStop  Int       @default(0)
}

model BusTrip {
  id              Int       @id @default(autoincrement())
  routeId         Int
  date            DateTime
  driverId        Int
  
  studentBoardings Json      // [{studentId, time, stopId}]
  studentDropoffs Json
  
  startedAt       DateTime
  completedAt     DateTime?
}

model StudentHealthRecord {
  id              Int       @id @default(autoincrement())
  studentId       Int
  student         Student   @relation(fields: [studentId], references: [id])
  
  recordType      String    // 'VACCINATION' | 'CHECKUP' | 'INCIDENT' | 'MEDICATION'
  date            DateTime
  description     String
  doctorName      String?
  attachmentUrl   String?
}

model SchoolEvent {
  id              Int       @id @default(autoincrement())
  title           String
  description     String?
  startDate       DateTime
  endDate         DateTime?
  type            String    // 'HOLIDAY' | 'EXAM' | 'PARENT_TEACHER' | 'TRIP' | 'COMPETITION' | 'CEREMONY'
  applicableGradeLevels Int[]?
}
```

---

## 5. Forms (8)

A: Student Admission Application
B: Class Enrollment
C: Tuition Setup (per grade)
D: Schedule Builder (calendar)
E: Grade Entry
F: Attendance Roll Call
G: Bus Route Setup
H: Discipline Record

---

## 6. Tables (8)

A: Students Master
B: Classes (per year)
C: Schedule (visual)
D: Grades by Class
E: Attendance Daily
F: Tuition Status
G: Bus Routes + Students
H: Events Calendar

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-application-create | + طلب التحاق | 🟢 admissions |
| btn-application-accept | قبول | 🟢 principal |
| btn-application-reject | رفض | 🔴 principal |
| btn-student-enroll | + تسجيل | 🟢 registrar |
| btn-student-withdraw | انسحاب | 🟡 registrar + reason |
| btn-student-graduate | تخريج | 🟢 registrar |
| btn-class-create | + شعبة | 🟢 registrar |
| btn-section-assign | إسناد طالب | 🟦 registrar |
| btn-schedule-create | + جدول | 🟢 academic mgr |
| btn-teacher-assign | إسناد مدرس | 🟦 academic mgr |
| btn-attendance-record | تسجيل غياب | 🟢 teacher |
| btn-grade-enter | إدخال درجات | 🟢 teacher |
| btn-grade-approve | اعتماد | 🟢 academic mgr |
| btn-report-card-generate | توليد كشف الدرجات | 🟦 registrar |
| btn-report-card-publish | نشر للأهل | 🟦 registrar |
| btn-tuition-invoice | إصدار فواتير | 🟢 finance |
| btn-tuition-discount-apply | تطبيق خصم | 🟦 finance |
| btn-tuition-waive | إعفاء | 🔴 principal |
| btn-discipline-record | + سجل سلوك | 🟢 teacher |
| btn-discipline-escalate | تصعيد للإدارة | 🟡 teacher |
| btn-bus-route-create | + خط حافلة | 🟢 transport mgr |
| btn-bus-stop-add | + موقف | 🟢 transport mgr |
| btn-bus-board-scan | مسح صعود | 🟦 driver |
| btn-bus-dropoff | نزول | 🟢 driver |
| btn-event-create | + فعالية | 🟢 admin |
| btn-message-parent | رسالة للأهل | 🟢 teacher |
| btn-bulk-message | رسالة جماعية | 🟦 admin |
| btn-export-grades | تصدير الدرجات | ⬜ academic mgr |
| btn-alumni-search | بحث خريجين | ⬜ alumni mgr |
| btn-online-class-link | رابط كلاس online | 🟦 teacher |

---

## 8. Search & Filters

- Students: grade, status, year, has overdue tuition
- Grades: class, subject, term, type
- Attendance: date range, class, status
- Tuition: status, year, overdue
- Buses: route, stop

---

## 9. Reports

- Student Roster
- Academic Performance (per student/class)
- Attendance Summary
- Tuition Aging
- Class Average
- GPA Distribution
- Bus Utilization
- Discipline Statistics
- Enrollment Trends
- Teacher Workload
- Alumni Listing

---

## 10. Dashboards

- KPIs: Enrolled / Waitlist / Avg GPA / Tuition Collected / Attendance %
- Charts: Enrollment trend, GPA distribution
- Lists: Overdue tuition, Discipline cases, Today's events

---

## 11. Notifications

- Absence (parent)
- Grade posted
- Tuition due
- Tuition overdue
- Event reminder
- Discipline incident
- Report card available
- Bus delay

---

## 12. Permissions

| Action | Teacher | Principal | Registrar | Finance | Parent |
|--------|---------|-----------|-----------|---------|--------|
| Take attendance | ✓ | ✓ | ✓ | ✗ | ✗ |
| Enter grades | ✓ | ✓ | ✓ | ✗ | ✗ |
| View own classes | ✓ | ✓ | ✓ | ✗ | ✗ |
| View all students | ✗ | ✓ | ✓ | ✓ | own kids |
| Enroll student | ✗ | ✓ | ✓ | ✗ | ✗ |
| Tuition | ✗ | ✓ | ✗ | ✓ | view own |
| Discipline | ✓ | ✓ | ✓ | ✗ | view own kid |
| Pay tuition | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- Madrasati (KSA MoE)
- Classera
- Microsoft Teams / Zoom (online classes)
- LMS (Moodle, Canvas)
- Payment gateways (parents pay online)
- SMS/WhatsApp (parent notifications)
- GPS (bus tracking)

---

## 14. Shortcuts

- `Ctrl+S` Student lookup
- `Ctrl+A` Attendance
- `Ctrl+G` Grade entry

---

## 15. Mobile / Print

- Parent app
- Teacher app (attendance + grades)
- Driver app (bus)
- Print: report cards, certificates, ID cards

---

## 16. Audit

- Grade changes audited
- Discipline records immutable
- Tuition transactions
- Application decisions

---

## 17. Tests

```typescript
describe('Admission', () => { /* lifecycle */ })
describe('Tuition Schedule', () => { /* installments, discounts */ })
describe('Grade Calculation', () => { /* weighted average */ })
describe('Attendance Tracking', () => { /* per period */ })
describe('Bus Tracking', () => { /* board, dropoff */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Student transferred mid-year | partial fees + records transfer |
| Sibling discount applied retroactively | recompute |
| Class capacity exceeded | block + waitlist |
| Teacher absent (no schedule sub) | substitute reassignment |
| Bus broke down | notify all parents on route |
| Grade override needed | requires principal approval |

---

**نهاية #32** • 8 سيناريوهات • 16 جداول • 8 forms • 8 grids • 30 button • 11 reports
