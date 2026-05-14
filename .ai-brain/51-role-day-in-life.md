# 51 - يوم في حياة... (Role-Based Daily Workflows)

> Cashier + Accountant + CFO + HR Manager + Owner — كيف يستخدمون النظام يومياً

---

## 🛒 يوم في حياة كاشير POS

### الصباح (7:30 AM):
```
1. الوصول للمتجر
2. تسجيل الدخول في النظام:
   /login → username + password
3. فتح جلسة POS:
   /pos → "فتح جلسة"
   - opening cash: 500 SAR (من المدير)
   - status: OPEN
4. التحقق من المخزون:
   - أي منتجات ناقصة؟ تنبيه المدير
   - أي منتجات قاربت على الانتهاء؟ وضعها في عرض
5. تنظيف ال POS counter
```

### خلال اليوم:
```
لكل زبون:
1. مسح الباركود (يضاف للسلة)
2. السؤال عن الـ Loyalty card:
   - إذا عضو: مسح + الحصول على discount/points
3. اقتراح items إضافية (Cross-sell):
   - "بيبسي خصم 50% مع البيتزا"
4. حساب الإجمالي
5. طريقة الدفع:
   - Cash → فتح الـ drawer
   - Card → الـ POS terminal
   - mada/STC Pay → QR scan
6. إصدار الفاتورة:
   - ZATCA QR على الإيصال
   - طباعة 80mm thermal
   - تسليم للزبون
7. شكر الزبون
8. تنظيف الـ counter
```

### المرتجعات:
```
زبون يريد إرجاع:
1. طلب الفاتورة الأصلية
2. /pos/returns
3. اختيار الفاتورة الأصل
4. تحديد البنود + الكمية
5. تحديد السبب
6. النظام يحسب الـ refund
7. الدفع:
   - Cash → من الـ drawer (يخصم من السيشن)
   - Card → reverse on card
   - Store Credit
8. ختم على الفاتورة الأصل: "RETURNED"
```

### نهاية اليوم (10:00 PM):
```
1. تنظيف ال counter
2. عد الـ cash في الـ drawer
3. /pos/session/close:
   - declared cash: 5,230 SAR
4. النظام يحسب expected: 5,180
5. variance = +50 (زيادة)
   - تسجيل + شرح
6. status: CLOSED
7. تسليم الـ cash للمدير
8. تسجيل الخروج
```

### المشاكل الشائعة:
- ❌ زبون بدون فاتورة → لا إرجاع
- ❌ المنتج تالف → فحص قبل الإرجاع
- ❌ انقطاع الإنترنت → POS يكمل offline
- ❌ ZATCA reject → علم المدير
- ❌ Cash short → audit log + investigation

---

## 💰 يوم في حياة محاسب

### الصباح (8:00 AM):
```
1. تسجيل الدخول
2. /dashboard — نظرة عامة
3. /accounting/journal/inbox — قيود pending
4. /approvals/inbox — موافقات pending
5. مراجعة AI CFO Insights:
   - أي تنبيهات حرجة؟
   - عملاء متأخرون؟
   - فروقات في الجرد؟
```

### مراجعة الفواتير الجديدة (9:00 AM):
```
1. /sales — فواتير اليوم
2. التحقق:
   - الـ JE تلقائي صحيح؟
   - VAT applied correctly؟
   - ZATCA cleared؟
3. /purchases — فواتير الشراء
4. التحقق:
   - 3-way match صحيح؟
   - GR/IR clearing OK؟
   - VAT Input recoverable?
```

### معالجة قيود يدوية (10:00 AM):
```
لكل قيد جديد:
1. /accounting/journal/new
2. الإدخال:
   - التاريخ (اليوم)
   - الوصف الواضح
   - الـ lines (Dr/Cr)
3. التحقق:
   - Dr = Cr ✓
   - الحسابات صحيحة
   - Cost Center / Project إذا applicable
4. حفظ → DRAFT
5. إذا > 10K → إرسال للموافقة
6. إذا < 10K → ترحيل مباشر
```

### الـ Bank Reconciliation (11:00 AM):
```
يومياً:
1. /accounting/bank-recon
2. مراجعة الـ unmatched:
   - رسوم بنكية → قيد جديد
   - فوائد → قيد جديد
3. مطابقة يدوية للـ pending
4. الإجمالي matched ينمو يومياً
```

### الغداء (12:00 PM)

### بعد الظهر:
```
1. مراجعة الـ Approvals:
   - PO approvals
   - JE approvals
   - Payment Run approvals
   
2. /finance/payments — معالجة المدفوعات:
   - من العملاء (incoming)
   - للموردين (outgoing)
   
3. /reports — تقارير اليوم:
   - Daily Sales
   - Daily Receipts
   - Cash Position
```

### نهاية اليوم (4:00 PM):
```
1. التحقق من:
   - كل JE اليوم POSTED
   - كل الفواتير ZATCA cleared
   - الـ trial balance متوازن
2. backup يدوي (إذا الجهاز local)
3. الخروج
```

### الأنشطة الأسبوعية:
- **الأحد:** Bank Recon أسبوعي
- **الإثنين:** AR Aging review
- **الثلاثاء:** AP Aging review
- **الأربعاء:** Tax compliance check
- **الخميس:** Pre-close prep

### الأنشطة الشهرية:
- نهاية الشهر (28-31):
  1. Pre-close checklist
  2. Accruals (مصروفات/إيرادات مستحقة)
  3. Prepayments amortization
  4. Depreciation run (cron تلقائي)
  5. FX Revaluation
  6. WHT Form 14
  7. GOSI ملف شهري
  8. Trial Balance
  9. Period Close

---

## 💼 يوم في حياة CFO

### الصباح (7:30 AM):
```
1. /dashboard — CFO Dashboard
2. مراجعة AI CFO Daily Insights:
   - أرباح اليوم/الشهر
   - cash position
   - AR aging
   - AP aging
   - top risks
3. الـ Notifications:
   - approvals waiting (high amounts)
   - SLA breaches
   - red flags
```

### الاجتماع الصباحي (8:00 AM):
```
- مع الفريق المالي:
  - مراجعة الـ AR
  - الـ collections plan
  - الـ payments plan
  - الـ tax obligations
- مع MD/CEO:
  - الـ KPIs
  - أي قرارات استثمارية
```

### الموافقات (9:00 AM):
```
1. /approvals/inbox
2. لكل request > limit:
   - مراجعة الـ details
   - فحص الـ supporting documents
   - الموافقة أو الرفض مع تعليق
3. أنواع الموافقات:
   - PO > 50K SAR
   - JE > 100K SAR
   - Payment Run
   - Salary Run
   - Tax Submissions
```

### Strategic Review (10:00 AM):
```
1. /finance/cfo-dashboard
2. Key metrics:
   - Revenue growth: +12% MTD
   - Gross margin: 35% (target 40%)
   - Operating expenses: -5% vs budget ✓
   - Net profit: 15% of revenue
3. Drill down على الـ outliers:
   - أي قسم خرج عن الميزانية؟
   - أي خط منتج تحت الـ target?
4. Action items للفريق
```

### Cash Management (11:00 AM):
```
1. /treasury/cash-forecast
2. الـ 30/60/90 day forecast
3. أي shortfall متوقع؟
4. Strategies:
   - تحصيل أسرع من العملاء
   - تأجيل الموردين
   - استخدام line of credit
   - استثمار الفائض
```

### Tax & Compliance (2:00 PM):
```
1. /tax/dashboard
2. مراجعة:
   - VAT (شهري/ربعي)
   - WHT (شهري)
   - Zakat (سنوي)
   - GOSI (شهري)
3. متابعة الـ deadlines
4. التواصل مع المحاسب القانوني
```

### Risk Management (3:00 PM):
```
1. /compliance/risks
2. مراجعة:
   - Credit risks (العملاء)
   - Liquidity risk
   - Operational risks
   - Compliance risks (PDPL, ZATCA)
3. Mitigation plans
```

### Reports Review (4:00 PM):
```
1. Daily flash report
2. تحضير weekly report للـ Board
3. Monthly close progress
```

---

## 👤 يوم في حياة HR Manager

### الصباح (8:00 AM):
```
1. /hr/dashboard
2. Today's snapshot:
   - الحضور: 95% (5% غياب)
   - الإجازات النشطة: 8 موظفين
   - تذكيرات: 3 وثائق تنتهي قريباً
3. الـ Notifications:
   - طلبات إجازة pending
   - تقييمات pending
   - مرشحين جدد للتوظيف
```

### مراجعة الحضور (9:00 AM):
```
1. /hr/attendance
2. تحقق من الـ:
   - متأخرون
   - غائبون بدون إذن
   - تجاوز ساعات الإضافي
3. اتخاذ إجراءات:
   - تنبيه المتأخرين
   - إنذار للغياب بدون إذن
```

### معالجة طلبات الإجازات (10:00 AM):
```
1. /approvals/inbox (HR)
2. لكل طلب:
   - فحص الرصيد المتاح
   - فحص تعارض مع موظفين آخرين
   - الموافقة أو الرفض
3. تحديث الجدول
4. تنبيه الموظف + المدير
```

### التوظيف (11:00 AM):
```
1. /hr/recruitment
2. مراجعة:
   - الـ Applications الجديدة
   - الـ Interviews المجدولة
   - الـ Offers المرسلة
3. تنسيق مع المديرين
4. تحضير العقود
```

### الـ Onboarding (12:00 PM):
```
موظف جديد اليوم:
1. مقابلة welcome
2. /hr/employees/new — إنشاء سجل
3. توقيع العقد (e-sign)
4. إصدار:
   - بطاقة الموظف
   - أجهزة (laptop)
   - الزي (إن needed)
5. التدريب التوجيهي
6. تسجيل في GOSI / Qiwa
```

### الغداء

### بعد الظهر:
```
1. مراجعة تقييمات الأداء (شهرية):
   - /hr/performance
   - مع المديرين
2. إعداد التدريب:
   - /lms/courses
   - تخصيص الموظفين
3. التعامل مع شكاوى الموظفين
4. التواصل مع وزارة العمل (Qiwa)
```

### نهاية اليوم:
```
1. تحضير الـ payroll للشهر (إذا في الـ 25 أو بعدها)
2. التحقق من الـ overtime
3. التحقق من السلف والقروض
4. مراجعة احصائيات HR
```

### الأنشطة الشهرية:
- **23 من الشهر:** Pre-payroll check
- **25:** Approve payroll calculation
- **28:** Payroll run (cron)
- **30:** Salaries paid + WPS
- **1 من الشهر التالي:** GOSI submission
- **5:** الـ End of period reports

---

## 👑 يوم في حياة المالك (Owner)

### الصباح (9:00 AM):
```
1. /master-panel
2. Daily Telegram:
   - تقرير AI CFO اليومي
   - تقرير AI Auditor (إذا risk > 7)
3. مراجعة:
   - عدد المستأجرين
   - الإيرادات الشهرية (MRR)
   - النمو
```

### مراجعة الأعمال (10:00 AM):
```
1. /finance/dashboard
2. KPIs:
   - Revenue today/MTD/YTD
   - Profit margins
   - Customer satisfaction
   - Employee productivity
3. اتخاذ قرارات استراتيجية
```

### الموافقات الكبرى (11:00 AM):
```
1. أي شيء > 200K SAR
2. القرارات الاستراتيجية:
   - شراء أصل كبير
   - عقد كبير
   - توظيف senior position
   - تغيير في الـ pricing
```

### الـ Master Panel (12:00 PM):
```
1. /master-panel
2. مراجعة:
   - مستأجرين جدد (signups)
   - الـ trials المنتهية
   - شكاوى من العملاء
3. تواصل مع العملاء الكبار
```

### Strategic Planning (3:00 PM):
```
- مع الفريق التنفيذي
- مراجعة الـ roadmap
- التوسع الجغرافي
- المنتجات الجديدة
- الميزات الجديدة في النظام
```

### Stakeholder Meetings (4:00 PM):
```
- مع المستثمرين
- مع البنوك
- مع شركاء استراتيجيين
```

---

## 🛡 يوم في حياة Tech Support / ICE

### الصباح (8:00 AM):
```
1. /ice/dashboard
2. System Health:
   - Server status (PM2, DB, Redis)
   - Sentry errors
   - User reports
3. الـ Tickets المفتوحة
```

### معالجة الـ Tickets (9:00 AM):
```
لكل ticket:
1. التشخيص
2. الحل:
   - guide المستخدم
   - تطبيق fix على tenant
   - escalate لـ developer إذا bug
3. الإغلاق
4. متابعة الـ satisfaction
```

### إدارة المستأجرين (11:00 AM):
```
1. /ice/tenants
2. مراجعة:
   - مستأجرين جدد (تفعيل)
   - مستأجرين معلقين (suspend)
   - مستأجرين expired
3. تنفيذ الإجراءات
```

### الـ Monitoring (12:00 PM):
```
1. Sentry:
   - errors جديدة
   - تصنيف + تذكيرات
2. Prometheus:
   - performance issues
   - resource usage
3. Logs:
   - أي patterns غريبة؟
```

### التحديثات (2:00 PM):
```
1. مراجعة PRs from developers
2. اختبار في staging
3. نشر للـ production
4. الـ rollback إذا فشل
```

### نهاية اليوم:
```
1. تقرير اليوم
2. أي critical issues
3. التحضير ليوم الـ TLR
```

---

## 🍕 يوم في حياة نادل (مطعم)

### الصباح (10:00 AM):
```
1. تسجيل الدخول
2. /restaurant-pos
3. مراجعة الجدول (الـ floor plan)
4. التحقق من المنيو (أي منتج غير متاح اليوم؟)
```

### استقبال زبائن:
```
لكل زبون:
1. الترحيب
2. تحديد طاولة
3. POST /api/restaurant/table/{id}/open
4. أخذ الطلب (Tablet/Phone)
5. POST /api/restaurant/table/{id}/order
6. الطلب يذهب للـ KDS (المطبخ)
7. متابعة:
   - حالة الـ items
   - عند READY → تقديم
8. أثناء الوجبة:
   - إعادة التعبئة
   - الـ refills
9. الفاتورة:
   - مسبقة (Pre-bill)
   - الدفع
   - Tip
10. تحويل الطاولة لـ CLEANING
```

### Special Cases:
- **Split bill:** قسمة الفاتورة
- **Tab:** فتح حساب مفتوح
- **Allergies:** modifiers خاصة
- **Complaints:** التواصل مع المدير
- **Reservations:** إعداد مسبق

### نهاية الشيفت:
```
1. إغلاق كل الطاولات المعلقة
2. تجميع الـ tips
3. تسليم الـ cash
4. تسجيل الخروج
```

---

## 🚛 يوم في حياة سائق توصيل

### الصباح (6:00 AM):
```
1. تسجيل في الـ app
2. الاستلام من المستودع:
   - Wave Picking للـ orders
   - GPS check-in
3. تحميل السيارة
4. مراجعة الـ Route (محسّن بـ AI)
```

### في الطريق:
```
لكل عميل:
1. الوصول
2. GPS check-in تلقائياً
3. اتصال بالعميل (إذا needed)
4. التسليم:
   - مسح barcode
   - استلام التوقيع (digital)
   - صورة proof
5. الدفع (إذا COD):
   - استلام الـ Cash
   - مسح Visa/mada
6. الانتقال للعميل التالي
```

### نهاية اليوم:
```
1. العودة للمستودع
2. تسليم الـ Cash (للمحاسبة)
3. تقرير الـ trip:
   - عدد الطلبات
   - مدفوعات
   - مرتجعات (إن وُجدت)
4. شحن السيارة
5. تسجيل الخروج
```

---

## 🎯 ملاحظات عبر الأدوار

### المشترك بينهم:
- ✅ كلهم يستخدمون النظام
- ✅ كلهم يخضعون لـ MFA
- ✅ كلهم يلتزمون بـ workflows محددة
- ✅ كلهم يصدرون audit log
- ✅ كلهم يحصلون على notifications

### الفرق:
- **الكاشير:** عمليات بسيطة، POS مخصص
- **المحاسب:** تفصيل، JEs، تقارير
- **CFO:** نظرة كلية، قرارات استراتيجية
- **HR:** people-focused
- **Owner:** business outcomes
- **Tech:** infrastructure

### المعادلة:
كل دور له:
- صلاحيات محددة (UserPermission)
- workflows مخصصة
- dashboards مخصصة
- AI personas مخصصة
- notifications مخصصة
