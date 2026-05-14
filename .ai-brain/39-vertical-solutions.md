# 39 - الحلول القطاعية (Vertical Solutions Deep Dive)

> صيدلية + عيادة + مدرسة + مطعم + أسطول + عقارات + إنشاءات + توزيع + خدمات

---

## 💊 الصيدلية (Pharmacy)

### المسارات:
- `/pharmacy` — الصفحة الرئيسية
- `/pharmacy/manager` — المدير
- `/pharmacy/drug-interact` — تفاعلات الأدوية
- `/api/pharmacy/**`

### النماذج:
```prisma
Drug {
    name, nameEn, scientificName
    barcode
    activeIngredient
    drugClass            // antibiotic, painkiller, etc.
    prescriptionRequired
    controlledSubstance  // مادة مخدرة
    storageConditions    // درجة الحرارة
    sideEffects, contraindications
    interactions: Json   // قائمة الأدوية المتعارضة
    sfdaCode             // رقم SFDA
    asfa_approved        // اعتماد الهيئة العامة للغذاء والدواء
    
    productId            // ربط بـ Product
}

Patient {
    fullName, nationalId, dateOfBirth, gender
    bloodType
    allergies: Json
    chronicDiseases: Json
    
    insuranceProvider, insuranceCardNo
    
    medicalFile: Json    // ملف طبي
}

Prescription {
    patientId
    doctorName, doctorLicense
    prescriptionDate
    items: PrescriptionItem[]
    status: 'NEW' | 'DISPENSED' | 'REJECTED' | 'EXPIRED'
}

PrescriptionItem {
    prescriptionId
    drugId
    dosage, frequency, duration
    quantity
    instructions
    dispensed Boolean
}

DrugInteraction {
    drug1Id, drug2Id
    severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CONTRAINDICATED'
    description
    recommendation
}
```

### السيناريو:
```
1. مريض يأتي بوصفة:
   - الصيدلي يدخل بياناته
   - أو يبحث (إذا مسجل)
   
2. إدخال الوصفة:
   POST /api/pharmacy/prescriptions
   - الأدوية، الجرعات
   
3. فحص تلقائي:
   - تفاعلات الأدوية
   - حساسية المريض
   - تكرار وصف مادة مخدرة
   - تنبيه إذا أي مشكلة
   
4. الصيدلي يصرف:
   - مسح baroce
   - تحقق من المخزون
   - تحديث ProductStock
   - عرض السعر للمريض
   
5. الدفع:
   - نقد / تأمين
   - إذا تأمين:
     - تطبيق نسبة المريض (مثلاً 20%)
     - الباقي على شركة التأمين (AR منفصل)
   
6. طباعة:
   - الفاتورة
   - الإرشادات للمريض
   - ZATCA QR
```

### Saudi-Specific:
- **SFDA Approval:** كل دواء يجب أن يكون مسجلاً في الهيئة العامة للغذاء والدواء
- **Controlled Substances:** المخدرات تحتاج وصفة طبيب + ختم خاص + سجل
- **National Insurance:** تكامل مع شركات التأمين الكبرى

### AI Features:
- **Drug Interaction Checker** (Gemini)
- **Dose Recommendation** based on age/weight
- **OCR للوصفات اليدوية**

---

## 🏥 العيادة (Clinic)

### المسارات:
- `/clinic` — الرئيسية
- `/clinic/appointments` — المواعيد
- `/clinic/erx` — الوصفات الإلكترونية
- `/clinic/lab` — المختبر
- `/v3/clinic/emr` — السجل الطبي الإلكتروني
- `/api/clinic/**`

### النماذج:
```prisma
ClinicPatient {
    nationalId, fullName, dateOfBirth
    bloodType, allergies, chronicDiseases
    medicalHistory: Json
    contactInfo
    insuranceProvider
}

Appointment {
    patientId
    doctorId
    appointmentDate, duration
    type: 'CONSULTATION' | 'FOLLOWUP' | 'PROCEDURE'
    status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'
    chiefComplaint
    notes
}

MedicalRecord {
    patientId, appointmentId, doctorId
    visitDate
    chiefComplaint, history, examination
    diagnosis: Json
    prescription: Json
    labOrders: Json
    radiologyOrders: Json
    procedures: Json
    followUpDate
}

LabOrder {
    patientId, doctorId
    tests: Json
    sampleType
    status: 'ORDERED' | 'COLLECTED' | 'PROCESSING' | 'COMPLETED'
    
    results: LabResult[]
}

LabResult {
    orderId, testName
    value, unit
    referenceRange
    flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL'
}

ElectronicPrescription {
    patientId, doctorId
    items: Json
    issueDate
    digitalSignature
    qrCode
}
```

### السيناريو:
```
1. حجز موعد:
   POST /api/clinic/appointments
   - يدوياً عبر الـ Receptionist
   - أو online عبر portal
   
2. وصول المريض:
   - Check-in
   - دفع رسوم الكشف
   - الانتظار
   
3. الكشف:
   - الطبيب يفتح ملف المريض (EMR)
   - يدخل: الشكوى، الفحص، التشخيص
   - يطلب فحوصات (Lab/Radiology)
   - يكتب وصفة (eRx)
   
4. eRx:
   - توقيع رقمي
   - QR للصيدلي
   - يمكن إرسال للصيدلية مباشرة
   
5. Lab:
   - أخذ العينات
   - معالجة
   - النتائج → الطبيب
   
6. الفاتورة:
   - رسوم الكشف + الفحوصات + الإجراءات
   - تطبيق تأمين
   - ZATCA invoice
```

### Saudi-Specific:
- **MOH Approval:** ترخيص وزارة الصحة
- **Eservices** integration (مستقبلاً)
- **التأمين الصحي** التعاوني

---

## 🎓 المدرسة (School)

### المسارات:
- `/school` — الرئيسية
- `/school/attendance` — الحضور
- `/school/dashboard` — لوحة المعلومات
- `/school/exams` — الامتحانات
- `/school/schedule` — الجدول
- `/school/stages` — المراحل
- `/school/transport` — النقل
- `/v3/school/sis` — Student Information System
- `/v3/school/gradebook` — الدرجات
- `/v3/school/transcripts` — السجل الأكاديمي
- `/api/school/**`

### النماذج:
```prisma
Student {
    studentNo, fullName, dateOfBirth, gender
    nationalId
    nationality
    
    classId, gradeLevel
    academicYear
    
    enrollmentDate
    status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'DROPPED_OUT'
    
    parentId
    transportRoute  // مسار النقل المدرسي
    
    medicalConditions
}

Parent {
    fullName, nationalId
    relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN'
    mobile, email
    canPickup Boolean
}

Class {
    name  // 'الصف الأول - أ'
    gradeLevel  // 1-12
    academicYear
    classTeacherId
    capacity
    maxStudents
}

Subject {
    name, nameEn, code
    gradeLevel
    credits
}

Schedule {
    classId, subjectId, teacherId
    dayOfWeek, period
    startTime, endTime
    room
}

Exam {
    name, examType  // QUIZ | MIDTERM | FINAL
    subjectId, classId
    examDate, duration
    totalMarks, passingMarks
    
    results: ExamResult[]
}

ExamResult {
    examId, studentId
    obtainedMarks
    grade  // A+ / A / B+ / ...
    rank
    comments
}

Attendance {
    studentId, date
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
    markedByTeacherId
}

SchoolInvoice {
    studentId, academicYear
    feeType: 'TUITION' | 'TRANSPORT' | 'UNIFORM' | 'BOOKS' | 'ACTIVITY'
    amount, dueDate
    paidAmount, paidAt
    status
    
    tenantAccountId  // للـ ZATCA
}

TransportRoute {
    name, driver, vehicleNo
    capacity
    stops: Json
    pricePerMonth
}

BehaviorReport {
    studentId, date
    type: 'POSITIVE' | 'NEGATIVE'
    description
    severity
}
```

### السيناريو:
```
1. تسجيل الطالب:
   - بداية السنة الدراسية
   - تحديد الصف
   - إنشاء SchoolInvoice (رسوم سنوية)
   
2. اليومي:
   - تسجيل الحضور (يدوي / Face-ID)
   - المعلم يدخل الدرجات
   - الانضباط (سلوك)
   
3. الامتحانات:
   - جدولة
   - تنفيذ
   - إدخال الدرجات
   - حساب المتوسط
   
4. التقارير:
   - تقرير شهري
   - تقرير فصلي
   - شهادة نهاية السنة
   
5. الرسوم:
   - فاتورة سنوية
   - أقساط شهرية
   - متابعة المتأخرات
```

### Saudi-Specific:
- **وزارة التعليم** (Ministry of Education)
- **Noor system** integration (مستقبلاً)
- **تأكيد المنهاج**
- **اللغة:** عربية، إنجليزية، أو ثنائي

---

## 🍽 المطعم (Restaurant)

### المسارات:
- `/restaurant-pos` — POS مطعم
- `/restaurant-tables` — خريطة الطاولات
- `/api/restaurant/**`
- `/api/public/menu` — قائمة عامة (QR code)
- `/api/public/call-waiter` — استدعاء النادل
- `/api/public/order` — طلب أونلاين

### النماذج:
```prisma
RestaurantZone {
    name  // 'الطابق الأول' | 'الحديقة' | 'الـ VIP'
    floorPlan: Json  // ملف الـ floor plan
}

RestaurantTable {
    zoneId
    tableNo, capacity
    location: { x, y, w, h }  // موقع على الـ floor plan
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
    qrCode  // للزبون لمسحه
}

RestaurantSession {
    tableId
    openedAt, closedAt
    waiterId
    customerCount
    
    orders: RestaurantOrder[]
    paymentMethod
    totalAmount
    
    relatedInvoiceId  // SalesInvoice المرتبطة
}

RestaurantOrder {
    sessionId
    items: RestaurantOrderItem[]
    notes
    status
}

RestaurantOrderItem {
    orderId
    productId  // المنتج (طبق)
    quantity
    modifiers: Json  // 'بدون بصل', 'إضافة جبن'
    status: 'PLACED' | 'COOKING' | 'READY' | 'SERVED' | 'CANCELLED'
    kitchenId  // المطبخ المسؤول
}

Kitchen {
    name  // 'المطبخ الرئيسي', 'البيتزا', 'المشاوي'
    printerName
}

Reservation {
    customerName, mobile
    tableId, partySize
    reservationDateTime
    duration
    status: 'CONFIRMED' | 'SEATED' | 'NO_SHOW' | 'CANCELLED'
    deposit  // عربون
}

MenuItem extends Product {
    isAvailable
    preparationTime  // بالدقائق
    spicyLevel  // 0-5
    isVegetarian, isVegan
    allergens: Json
    photo
}
```

### السيناريو:
```
1. الزبون يدخل:
   - النادل يفتح طاولة:
     POST /api/restaurant/table/{id}/open
     - status: OCCUPIED
     - فتح RestaurantSession
   
2. الطلب:
   POST /api/restaurant/table/{id}/order
   - النادل يستخدم Tablet/Phone
   - يضيف الأطباق
   - يحدد modifiers
   - حالة الـ items: PLACED
   - تُرسل للمطبخ (KDS)
   
3. KDS (Kitchen Display System):
   - شاشة في المطبخ
   - يعرض الطلبات حسب الـ kitchen
   - الطباخ:
     - يضع COOKING
     - عند الانتهاء: READY
   
4. النادل يقدم:
   - يرى الـ READY items
   - يقدمها للزبون
   - حالة: SERVED
   
5. الزبون يطلب الفاتورة:
   - النادل يطبع Pre-bill
   - الزبون يدفع
   - إصدار SalesInvoice مع ZATCA QR
   - status table: OCCUPIED → CLEANING
   
6. التنظيف:
   - مسؤول التنظيف يضع: AVAILABLE
   
7. الحجوزات:
   - online أو phone
   - حجز طاولة
   - تأكيد قبل الموعد
   
8. Online Order:
   - زبون يمسح QR على الطاولة
   - يرى المنيو
   - يطلب مباشرة
   - بدون نادل
```

### Special Features:
- **Split Bills:** قسمة الفاتورة بين عدة زبائن
- **Tabs:** حساب مفتوح للزبائن المتكررين
- **Loyalty:** نقاط ولاء للزبائن
- **Modifiers:** بدون بصل، إضافة جبن، نصف حار
- **Combo Meals:** وجبات مركبة
- **Happy Hour:** خصومات بأوقات محددة

---

## 🚛 الأسطول (Fleet)

### المسارات:
- `/fleet` — الرئيسية
- `/fleet/fuel` — الوقود
- `/fleet/maintenance` — الصيانة
- `/fleet/tracking` — التتبع
- `/fleet/trips` — الرحلات
- `/api/fleet/**`

### النماذج:
```prisma
Vehicle {
    plateNo, brand, model, year
    color, chassisNumber
    
    fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID'
    tankCapacity
    fuelEfficiency  // km per liter
    
    purchaseDate, purchasePrice
    currentValue  // ربط بـ FixedAsset
    
    driverId
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'SOLD'
    
    insurancePolicy, insuranceExpiry
    registrationExpiry  // الاستمارة
    inspectionExpiry  // الفحص الدوري
    
    currentMileage
    currentLocation: { lat, lng }  // إذا GPS
}

Driver {
    employeeId  // ربط بـ Employee
    licenseNo, licenseExpiry
    licenseClass  // class A, B, C
    
    rating
    safeDrivingScore
}

Trip {
    vehicleId, driverId
    startDateTime, endDateTime
    startLocation, endLocation
    distanceKm
    fuelConsumed
    purpose: 'DELIVERY' | 'BUSINESS' | 'PERSONAL'
    
    customerId  // إذا توصيل
    invoiceId   // الفاتورة المرتبطة
}

FuelLog {
    vehicleId, driverId
    date, location
    fuelAmount  // لتر
    pricePerLiter
    totalCost
    mileageReading
    fuelType
}

VehicleMaintenance {
    vehicleId
    type: 'OIL_CHANGE' | 'TIRE_ROTATION' | 'BRAKE' | 'REPAIR' | 'INSPECTION'
    date
    mileage
    description
    cost
    serviceProvider
    nextDueDate, nextDueMileage
}

VehicleViolation {
    vehicleId, driverId
    violationDate, violationType
    location
    amount  // قيمة المخالفة
    paid Boolean
}
```

### السيناريو:
```
1. تسجيل المركبة:
   POST /api/fleet
   - بيانات السيارة
   - تأمين، استمارة، فحص
   - تعيين سائق
   
2. الرحلات اليومية:
   - السائق يبدأ:
     POST /api/fleet/trips/start
     - الموقع الحالي
     - المسافة الحالية
   - في النهاية:
     POST /api/fleet/trips/end
     - الموقع، المسافة
     - الوقود
     - الغرض
   
3. الوقود:
   - تسجيل كل تعبئة
   - تنبيه إذا الاستهلاك غير عادي (احتمال سرقة)
   
4. الصيانة:
   - جدولة حسب المسافة (كل 5000 km)
   - أو حسب الوقت (كل 3 شهور)
   - تنبيه قبل الموعد
   
5. الانتهاء:
   - تنبيه قبل انتهاء التأمين/الاستمارة
   - تنبيه قبل الفحص الدوري
   
6. التقارير:
   - تكلفة كل سيارة
   - استهلاك الوقود
   - الانتهاكات
   - أداء السائقين
```

### Saudi-Specific:
- **Absher** للتحقق من الرخصة
- **MORO** (وزارة النقل) - تكامل مستقبلاً
- **التأمين الإلزامي**
- **العاشر السائق** (Driving Test)

---

## 🏢 العقارات (Real Estate)

### المسارات:
- `/rem` — الرئيسية
- `/rem/leases` — العقود
- `/rem/installments` — الأقساط
- `/rent` — الإيجار
- `/rental` — التأجير (سيارات/معدات)
- `/v3/realestate` — متقدم
- `/v3/realestate/cam` — Common Area Maintenance

### النماذج:
```prisma
Property {
    propertyType: 'APARTMENT' | 'VILLA' | 'OFFICE' | 'COMMERCIAL' | 'LAND'
    title, description
    
    address, city, district
    coordinates: { lat, lng }
    
    area  // متر مربع
    bedrooms, bathrooms, parkingSpaces
    
    purchasePrice, currentValue
    expectedRent
    
    status: 'AVAILABLE' | 'RENTED' | 'SOLD' | 'UNDER_RENOVATION'
    
    ownerType: 'OWNED' | 'MANAGED'  // نحن المالك أو نديره
    ownerId  // إذا managed
    
    images: Json
    documents: Json
}

LeaseAgreement {
    propertyId, tenantId
    startDate, endDate
    duration  // شهور أو سنوات
    
    monthlyRent
    securityDeposit
    paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    
    utilities: Json  // الخدمات (مياه، كهرباء، إنترنت)
    
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
    
    autoRenew Boolean
    renewalPeriod
}

RentInvoice {
    leaseId
    period
    amount
    dueDate
    paidAmount, paidAt
    
    deletedAt
    tenantAccountId  // للـ ZATCA
}

PropertyMaintenance {
    propertyId
    type, description
    cost, vendorId
    requestedBy  // المستأجر
    completedAt
}

CommonAreaMaintenance (CAM) {
    propertyId
    type: 'CLEANING' | 'SECURITY' | 'UTILITIES' | 'LANDSCAPING'
    monthlyCost
    apportionment: Json  // كيف يُقسّم على المستأجرين
}
```

### السيناريو:
```
1. إضافة عقار:
   - بياناته، الصور، الموقع
   - status: AVAILABLE
   
2. التأجير:
   - إيجاد مستأجر
   - عقد إيجار (LeaseAgreement)
   - دفع التأمين (security deposit)
   - status: RENTED
   
3. الفواتير الشهرية (cron):
   POST /api/cron/trigger-invoices
   - يولّد RentInvoice لكل عقد active
   - يرسل للمستأجر
   - ZATCA invoice
   
4. التحصيل:
   - متابعة المتأخرات
   - dunning للعملاء
   
5. الصيانة:
   - المستأجر يبلغ
   - فحص + إصلاح
   - تسجيل التكلفة
   
6. التجديد:
   - 30 يوم قبل الانتهاء → تنبيه
   - اقتراح للمستأجر
   - عقد جديد أو تجديد
   
7. الإخلاء:
   - فحص العقار
   - استرداد التأمين (- خصومات)
   - status: AVAILABLE
```

### IFRS 16 Integration:
- العقود طويلة الأجل → IFRS 16
- ROU Asset + Lease Liability
- شهرياً: Amortization + Interest

---

## 🏗 الإنشاءات (Construction)

### المسارات:
- `/v3/construction/boq` — Bill of Quantities
- `/v3/construction/progress-billing` — الفوترة بالتقدم
- `/v3/construction/variations` — التغييرات

### النماذج:
```prisma
ConstructionProject {
    name, description
    clientId  // العميل
    contractValue
    startDate, plannedEndDate, actualEndDate
    
    status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
    
    location, area
    
    boq: BOQItem[]
    phases: Phase[]
    variations: Variation[]
}

BOQItem (Bill of Quantities) {
    projectId
    description
    unit  // م، م2، م3، عدد
    quantity, unitPrice, totalPrice
    
    category: 'CIVIL' | 'ELECTRICAL' | 'PLUMBING' | 'FINISHING'
    completedQty, completedValue
}

Phase {
    projectId, name
    sequence
    plannedStart, plannedEnd
    actualStart, actualEnd
    progressPercent
    dependencies: Json  // المراحل المعتمد عليها
}

ProgressBilling {
    projectId, billingDate
    period
    workCompleted: Json  // وصف الأعمال المنجزة
    
    completedValue  // قيمة الأعمال المنجزة
    previouslyBilled
    currentlyBilling
    retention  // محتجز (5-10% عادة)
    netInvoiceAmount
    
    invoiceId  // SalesInvoice المرتبطة
}

Variation {
    projectId
    description, reason
    type: 'ADDITION' | 'OMISSION' | 'CHANGE'
    
    additionalCost, additionalDuration
    
    status: 'PROPOSED' | 'APPROVED' | 'REJECTED'
    approvedBy, approvedAt
}
```

### السيناريو:
```
1. مشروع جديد:
   - عقد مع العميل
   - BOQ تفصيلي
   - Phases (مراحل) محددة
   - Schedule (timeline)
   
2. التنفيذ:
   - تسجيل الإنجاز اليومي
   - تحديث completedQty لكل BOQ item
   - حساب progress%
   
3. Progress Billing (شهرياً):
   - تقييم الإنجاز
   - حساب القيمة المنجزة
   - خصم الاحتجاز (Retention 5-10%)
   - إصدار فاتورة مرحلية
   - JE: Dr Contract Asset / Cr Revenue (IFRS 15)
   
4. Variations (تغييرات):
   - العميل يطلب إضافة/تعديل
   - تقدير التكلفة الإضافية
   - موافقة → تعديل العقد
   - إدراج في الـ BOQ
   
5. إنهاء المشروع:
   - فحص نهائي
   - استرداد Retention
   - شهادة إنجاز
```

---

## 📦 التوزيع (Distribution)

### المسارات:
- `/v3/distribution/picking/wave` — Wave Picking
- `/v3/distribution/routes` — مسارات التوصيل
- `/v3/distribution/wms` — WMS متقدم

### الخصائص:
- **Multi-stop Routes:** سيارة واحدة تخدم 10+ عميل
- **Route Optimization:** AI يحسن الترتيب
- **Cash on Delivery (COD):** السائق يجمع
- **Proof of Delivery:** توقيع + GPS + صورة

### السيناريو:
```
1. تجميع الـ Orders:
   - 50 طلب لليوم
   - تقسيم إلى Waves (10-15 لكل سيارة)
   
2. Picking في المستودع:
   - Wave Picking
   - تجميع منتجات الـ wave
   
3. Loading:
   - تحميل السيارة
   - السائق يستلم
   
4. التوصيل:
   - السائق يتبع الـ optimized route
   - عند كل عميل:
     - يسلم
     - GPS proof
     - توقيع (digital)
     - صورة
     - إذا COD: يجمع المبلغ
   
5. العودة للمستودع:
   - السائق يسلم الـ Cash
   - تسوية في POS
```

---

## 🛠 الخدمات (Services / Field Service)

### المسارات:
- `/v3/services/sla` — اتفاقيات الخدمة
- `/v3/services/timesheet` — كشف الوقت
- `/v3/services/workorders` — أوامر العمل
- `/field-service` — خدمات ميدانية
- `/fsm/dispatch` — توجيه الفنيين
- `/fsm/tasks` — المهام

### النماذج:
```prisma
ServiceContract {
    customerId
    title, description
    
    sla: ServiceSLA[]
    monthlyFee
    startDate, endDate
    
    status
}

ServiceSLA {
    contractId
    serviceLevel: 'P1' | 'P2' | 'P3' | 'P4'  // Priority
    
    responseTime  // ساعة
    resolutionTime  // ساعة
    
    penalty  // نسبة الخصم إذا breach
}

WorkOrder {
    contractId  // (إذا متعاقد)
    customerId
    
    type: 'INSTALLATION' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION'
    description
    priority
    
    scheduledDate
    technicianId
    
    estimatedDuration
    actualDuration
    
    status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    
    partsUsed: Json
    laborHours
    
    customerSignature
    completionPhoto
    
    invoiceId
}

FieldTechnician extends Employee {
    skillSets: Json  // ['PLUMBING', 'ELECTRICAL']
    currentLocation: { lat, lng }
    availability
}

Dispatch {
    workOrderId
    technicianId
    dispatchedAt
    estimatedArrival
    actualArrival
    route: Json
}
```

### السيناريو:
```
1. عميل يطلب خدمة:
   - عبر portal / phone / app
   - يصف المشكلة
   - يحدد الأولوية
   
2. إنشاء WorkOrder:
   - النوع، الوصف
   - تحديد المهارة المطلوبة
   - تحديد الـ SLA
   
3. Dispatch:
   - النظام يقترح فني مناسب (skill + موقع + توفر)
   - Dispatcher يؤكد
   - الفني يستلم في الـ Mobile App
   
4. التنفيذ:
   - الفني يصل (تحديث arrival time)
   - يبدأ العمل
   - يستهلك قطع غيار (تخفيض المخزون)
   - يسجل الساعات
   - يرفع صور قبل/بعد
   - الزبون يوقع
   
5. الإقفال:
   - status: COMPLETED
   - إصدار فاتورة (أو لا، إذا تحت العقد)
   - SLA tracking:
     - response time
     - resolution time
     - إذا breach → خصم
```

---

## 🎬 الإيجار (Rental)

### المسارات:
- `/rental` — الرئيسية
- `/rental/agreements` — العقود

### النماذج:
```prisma
RentalAsset extends Product {
    isRentable
    dailyRate, weeklyRate, monthlyRate
    requiresDeposit
    depositAmount
}

RentalAgreement {
    customerId
    assetId
    
    startDate, endDate
    actualReturnDate
    
    dailyRate
    totalRentAmount
    
    depositPaid
    
    initialCondition: Json
    returnCondition: Json
    
    damages, damageDeduction
    
    status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'
}
```

### الاستخدام:
- تأجير سيارات
- تأجير معدات
- تأجير قاعات
- تأجير ملابس
- إلخ

### السيناريو:
```
1. الزبون يأتي للاستلام:
   - فحص الـ asset
   - توقيع العقد
   - دفع التأمين + الإيجار
   
2. الاستخدام:
   - الـ asset مع الزبون
   - status: ACTIVE
   
3. الإعادة:
   - فحص
   - إذا تلف → خصم من التأمين
   - استرداد الباقي
   - status: RETURNED
   
4. إذا تأخر:
   - status: OVERDUE
   - رسوم تأخير
   - dunning
```

---

## 🎯 ملاحظات عامة للحلول القطاعية

- ✅ **كل قطاع له schema منفصل** لكن يشارك القاعدة (Customer, Invoice, ...)
- ✅ **Feature Flags** لتفعيل/تعطيل القطاعات لكل tenant
- ✅ **ZATCA support** لكل الفواتير (POS, Rent, School, etc.)
- ✅ **Multi-language** (عربي + إنجليزي)
- ✅ **Mobile-friendly** UI
- ✅ **AI integration** حسب القطاع (Drug interactions, OCR, etc.)
