# 25 - الموارد البشرية والرواتب (HR & Payroll)

> Employees + Attendance + Salary + GOSI + WPS + EOS + Leaves + Performance

---

## 👤 إدارة الموظفين

### النموذج الأساسي:
```prisma
Employee {
    employeeNo
    fullName, fullNameEn
    nationalId         // الرقم الوطني (سعودي) أو إقامة
    iqamaNumber        // للأجانب
    iqamaExpiry
    passportNumber, passportExpiry
    
    nationality        // 'SA' | 'YE' | 'EG' | ...
    dateOfBirth, gender
    maritalStatus
    
    department, position, jobTitle
    managerId          // للهيكل التنظيمي
    
    hireDate, contractEndDate
    contractType: 'PERMANENT' | 'TEMPORARY' | 'PART_TIME'
    
    baseSalary
    housingAllowance, transportAllowance, otherAllowances
    
    bankAccount: { bankCode, iban, accountName }
    
    status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED'
    
    contactInfo: Json
    address: Json
    emergencyContact: Json
    documents: Json
    
    deletedAt
}
```

### الـ Onboarding:
```
1. تسجيل بيانات الموظف:
   POST /api/hr/employees
   
2. توقيع العقد:
   - POST /api/hr/contracts
   - يُحفظ PDF
   - توقيع إلكتروني (e-sign)
   
3. تسجيل في GOSI:
   - تلقائياً إذا nationality = SA أو GCC
   - يدوياً للأجانب (2% hazards فقط)
   
4. إنشاء حساب نظام:
   - User record مع role
   - بريد إلكتروني
   - بطاقة employee ID
   
5. إصدار:
   - بطاقة دخول (RFID/Face)
   - أجهزة (laptop, phone)
   - زي (إذا needed)
```

---

## 📅 الحضور والانصراف

### الطرق:
1. **يدوي** — الموظف يسجل
2. **Face-ID** — تعرف على الوجه (AI)
3. **Fingerprint** — بصمة
4. **RFID/NFC** — بطاقة
5. **Mobile App** — GPS + Selfie
6. **Manual Override** — للحالات الاستثنائية

### النموذج:
```prisma
Attendance {
    employeeId, date
    checkIn, checkOut
    breakStart, breakEnd
    totalHours, overtimeHours
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'HALF_DAY'
    notes
    location          // GPS coordinates
    method: 'MANUAL' | 'FACE_ID' | 'FINGERPRINT' | 'CARD' | 'MOBILE'
}
```

### AI Face Recognition:
- المسار: `/api/attendance/face-id`
- المكتبة: `face-api.js`
- التسجيل: `/hr/ai-enrollment`
- الموظف يصور وجهه (5+ صور بزوايا مختلفة)
- يُحفظ embedding في DB (encrypted)
- عند الحضور: يقارن (matching > 95%)

### الإحصائيات:
- متوسط ساعات شهري
- معدل التأخير
- معدل الغياب
- ساعات إضافية

---

## 🗓 الإجازات (Leaves)

### النموذج:
```prisma
Vacation {
    employeeId
    type: 'ANNUAL' | 'SICK' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY' | 'HAJJ' | 'UNPAID' | 'BEREAVEMENT'
    startDate, endDate, daysRequested
    halfDay: Boolean
    reason
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    
    submittedAt, approvedAt
    approvedBy
    rejectionReason
    
    paidAmount         // إذا paid leave
    deduction          // إذا unpaid
    
    coveringEmployeeId // من سيغطي
    attachments
}

LeaveBalance {
    employeeId
    type
    yearEarned, used, remaining
    expiresAt          // الإجازة السنوية: ينتهي بنهاية السنة التالية
}
```

### الحدود حسب نظام العمل السعودي:

| النوع | المدة | الشرط |
|---|---|---|
| **سنوية** | 21 يوم/سنة | بعد 5 سنوات → 30 يوم |
| **مرضية** | 30 يوم بأجر + 60 يوم بـ ¾ | بشهادة طبية |
| **أمومة** | 10 أسابيع | للمرأة |
| **أبوة** | 3 أيام | للرجل |
| **زواج** | 5 أيام | عقد قران |
| **وفاة قريب** | 5 أيام | درجة أولى |
| **حج** | 10-15 يوم | مرة كل 5 سنوات |
| **بدون أجر** | متفق عليه | بموافقة المنشأة |

### Approval Workflow:
```
1. الموظف يقدم طلب
2. المدير المباشر يراجع
3. HR يتحقق من:
   - الرصيد المتاح
   - تعارض مع موظفين آخرين (نفس القسم)
4. الموافقة النهائية (لو > 5 أيام: CEO)
5. النظام يحدّث:
   - LeaveBalance
   - Attendance (يضع أيام الإجازة)
   - الراتب (إذا مدفوعة/غير مدفوعة)
```

---

## 💰 الرواتب (Payroll)

### دورة الرواتب الشهرية:
```
1. الأسبوع الأول من الشهر:
   - تجميع بيانات الحضور
   - تجميع الإجازات
   - تجميع السلف والقروض
   - تجميع الإضافي
   
2. الأسبوع الثاني:
   - حساب الراتب:
     Gross = Base + Allowances + Overtime
     Deductions = Loans + Advances + Unpaid Leaves + Late Penalties
     GOSI = Subject Wage × (9% or 10%)
     Net = Gross - GOSI - Deductions
   
3. الأسبوع الثالث:
   - مراجعة من HR
   - مراجعة من Finance
   - الموافقة (CFO + CEO)
   
4. اليوم 28 (Cron تلقائي):
   POST /api/cron/payroll-monthly
   - توليد PayrollRun
   - توليد PayrollInvoice لكل موظف
   - JE تلقائي
   
5. اليوم 30:
   - توليد SIF (WPS file)
   - رفع للبنك
   - الموظفون يستلمون الراتب
   
6. اليوم 1 من الشهر التالي:
   - GOSI ملف شهري → دفع
   - WHT (إن وجد) → دفع
```

### النموذج:
```prisma
PayrollRun {
    runNo, payrollMonth, payrollYear
    status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CLOSED'
    totalGross, totalNet, totalGOSI, totalDeductions
    runByUserId, approvedByUserId
    createdAt, approvedAt, paidAt
}

PayrollInvoice {
    runId, employeeId
    grossSalary, netSalary
    baseSalary, allowances: Json, overtime
    deductions: Json
    gosiEmployee, gosiEmployer
    wht
    notes
    deletedAt
}

Salary {
    employeeId, month, year
    baseSalary, allowances, deductions
    netSalary
    paymentDate
    status
    deletedAt
}
```

### مكونات الراتب:
```
Gross Salary = Base Salary
            + Housing Allowance (25% عادة)
            + Transport Allowance (10% عادة)
            + Other Allowances
            + Overtime (1.5x for regular hours, 2x for weekends/holidays)
            + Commission/Bonus

Deductions = GOSI Employee (9% or 10%)
          + WHT (إذا applicable, نادر للموظفين)
          + Loan/Advance Repayment
          + Unpaid Leave Days
          + Late Penalties
          + Other Deductions

Net = Gross - Deductions
```

---

## 🏦 GOSI (التأمينات الاجتماعية)

### المعدلات (تفصيل في `15-saudi-compliance.md`):

| الفئة | الموظف | المنشأة |
|---|---|---|
| سعودي | 10% (9% Pension + 1% SANED) | 12% (9%+1%+2% Hazards) |
| خليجي | 9% | 11% (9%+2%) |
| أجنبي | 0% | 2% Hazards |

### الكود (`src/lib/gosi-engine.ts`):
```typescript
function calculate(employee, baseSalary):
    const subjectWage = Math.max(1500, Math.min(45000, baseSalary));
    
    if (employee.nationality === 'SA') {
        return {
            employee: subjectWage * 0.10,    // 10%
            employer: subjectWage * 0.12      // 12%
        };
    }
    // ...
```

### القيد:
```
Dr  Salary Expense (5210)      10000
Dr  GOSI Exp Employer (5220)    1200
    Cr  Salary Payable (2330)         9000
    Cr  GOSI Payable Emp (2340)       1000
    Cr  GOSI Payable Empl (2341)      1200
```

### Monthly File:
- يُولّد تلقائياً
- يُرفع لـ GOSI portal (يدوياً حالياً)
- مسار: `/api/payroll/gosi/{month}/download`

---

## 💼 WPS (نظام حماية الأجور)

### الـ Generator (`src/lib/wps-generator.ts`):

```typescript
async function generateSIF(payrollRunId, bankCode, employerId) {
    const run = await getPayrollRun(payrollRunId);
    
    let sif = '';
    
    // HDR
    sif += `HDR|v3|${employerId}|${bankCode}|${run.year}-${run.month}|${run.employees.length}|${run.totalNet}\n`;
    
    // EMP records
    for (const emp of run.employees) {
        // Validation
        validateIBAN(emp.iban);
        
        sif += `EMP|${emp.nationalId}|${emp.iban}|${emp.basicSalary}|${emp.housing}|${emp.transport}|${emp.otherAllowances}|${emp.deductions}|${emp.netSalary}|${emp.bankCode}\n`;
    }
    
    // TRL
    sif += `TRL|${totalBasic}|${totalAllowances}|${totalDeductions}|${totalNet}|${run.employees.length}\n`;
    
    return sif;
}
```

### Validation:
- IBAN: `^SA[0-9]{22}$` (24 char total)
- Bank Code: من `SAUDI_BANKS` map (RJHI, SNB, BSFR, ...)

### المسارات:
- `/api/payroll/wps/generate` — توليد SIF
- `/api/payroll/wps/{batchId}/download` — تنزيل
- `/hr/wps`, `/payroll/wps` — UI

---

## 🎁 EOS (مكافأة نهاية الخدمة)

### الكود (`src/lib/eos-engine.ts`):
```typescript
function calculate({ baseSalary, yearsOfService, terminationReason }) {
    // أقل من 2 سنة + استقالة → صفر
    if (yearsOfService < 2 && terminationReason === 'RESIGNATION') {
        return { amount: 0 };
    }
    
    // المكافأة الكاملة (لو تم تسريحه)
    let fullAmount;
    if (yearsOfService <= 5) {
        fullAmount = baseSalary * yearsOfService * 0.5;
    } else {
        fullAmount = baseSalary * 2.5 + baseSalary * (yearsOfService - 5);
    }
    
    // التعديل حسب السبب
    let multiplier = 1.0;
    if (terminationReason === 'RESIGNATION') {
        if (yearsOfService < 5)       multiplier = 1/3;
        else if (yearsOfService < 10) multiplier = 2/3;
        else                          multiplier = 1.0;
    }
    
    return { amount: fullAmount * multiplier };
}
```

### Provision (Actuarial — سنوي):
```
كل نهاية سنة:
  لكل موظف نشط:
    احسب EOS لو تم تسريحه الآن
    قارن مع المخصص الحالي
    Provision += (Calculated - Current)
    
JE: Dr EOS Expense (5230)
        Cr EOS Liability (2410)
```

### عند الإنهاء:
```
JE: Dr EOS Liability       45000
        Cr Bank                  45000
```

---

## 📈 الأداء والتقييم

### النماذج:
```prisma
PerformanceReview {
    employeeId, period
    reviewerId
    status: 'DRAFT' | 'COMPLETED' | 'ACKNOWLEDGED'
    overallRating: 1-5
    comments
    goals: Json[]
    completedAt
}

KPI {
    employeeId
    name, target, actual
    period
    weight, score
}

EmployeeEvaluation {
    employeeId, period
    criteria: Json[]
    overallScore
    promotionRecommended
    salaryReviewRecommended
}
```

### الـ Flow:
```
1. تحديد KPIs بداية الفترة
2. متابعة دورية
3. نهاية الفترة:
   - Self-assessment
   - Manager review
   - 360-degree feedback (اختياري)
4. مقابلة + تقييم نهائي
5. القرارات:
   - مكافآت
   - ترقيات
   - زيادة راتب
   - تدريب
```

---

## 🎓 التدريب (Training & LMS)

### النماذج:
```prisma
TrainingProgram {
    name, description
    type: 'INTERNAL' | 'EXTERNAL' | 'ONLINE'
    cost
    duration
    certificate
}

TrainingEnrollment {
    employeeId, programId
    startDate, completionDate
    status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED'
    score
    feedback
}

LMSCourse {
    title, description
    modules: Json[]
    duration
    instructor
}
```

### المسارات:
- `/api/hr/training`
- `/api/lms`
- `/lms/courses`

---

## 💼 التوظيف (Recruitment)

### الـ Flow:
```
1. JobRequisition (طلب توظيف):
   - من القسم
   - يحدد العدد والمؤهلات
   - موافقة CFO
   
2. JobPosting:
   - نشر إعلان
   - مواقع: LinkedIn, Bayt, Tanqeeb, Internal
   
3. Applications:
   - استقبال السير الذاتية
   - فلترة آلية بـ AI (مستقبلاً)
   
4. Interviews:
   - أولية (HR)
   - تقنية (Team Lead)
   - نهائية (Manager)
   - HR Final
   
5. Offer:
   - إصدار خطاب عرض
   - تفاوض
   
6. Onboarding (انظر فوق)
```

---

## 🤝 الموظف Self-Service

### الميزات:
- عرض الراتب
- طلب إجازة
- طلب سلفة
- تحديث البيانات
- عرض المستندات
- تقييم الذات
- طلبات أخرى

### المسارات:
- `/hr/self-service`
- `/portal` — Employee Portal
- API: `/api/portal/employee/*`

---

## 🇸🇦 Saudi-Specific Features

### Saudization (نسبة السعودة):
```typescript
const saudization = (saudiCount / totalCount) * 100;

// Nitaqat tiers (يختلف حسب القطاع):
if (saudization >= 60) → 'PLATINUM'
else if (saudization >= 40) → 'GREEN_HIGH'
else if (saudization >= 25) → 'GREEN_MID'
else if (saudization >= 10) → 'GREEN_LOW'
else if (saudization >= 5) → 'YELLOW'
else → 'RED'
```

### Mudad Integration:
- منصة WPS الرسمية
- API integration (stub حالياً)
- المسار: `/api/saudi/mudad`

### Qiwa:
- منصة وزارة العمل
- العقود، التأشيرات
- API integration (stub)
- المسار: `/api/saudi/qiwa`

### المسارات السعودية:
- `/hr/saudization`
- `/hr/nitaqat-simulator`
- `/hr/mudad`
- `/hr/qiwa`

---

## ✅ Best Practices

1. ✅ **عقد موقع** قبل بداية العمل
2. ✅ **GOSI تسجيل** خلال 30 يوم
3. ✅ **WPS لـ 3+ موظفين** إجباري
4. ✅ **EOS Provision** سنوياً
5. ✅ **مراجعات أداء** نصف سنوية
6. ✅ **إجازة سنوية محسوبة** قبل إنهاء الخدمة
7. ✅ **سعودة في النطاق الأخضر** للعقود الحكومية
8. ❌ **لا تأخير دفع الراتب** > 7 أيام (Mudad ينبه)
9. ❌ **لا تكتم بيانات** للأجانب (Iqama مهم)
