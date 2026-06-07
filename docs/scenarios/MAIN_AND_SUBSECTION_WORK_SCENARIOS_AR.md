# سيناريوهات عمل الأقسام الرئيسية والفرعية (MAIN_AND_SUBSECTION_WORK_SCENARIOS_AR)
**المشروع:** Nama Invest ERP
**المهمة:** REFERENCE_SKILLS_SCENARIOS_GIT_HYGIENE_AND_AUTOPILOT_CLOSEOUT
**التاريخ:** 2026-06-07

يضم هذا المستند السيناريوهات الموثقة لكافة الأقسام الرئيسية والفرعية في نظام Nama Invest ERP للتأكد من مطابقة النظام لمتطلبات الجودة والأمان والمحاسبة.

---

## 🏛️ 1. الموديول المالي والمحاسبي (Accounting & General Ledger)

### SCENARIO_ID: SCN-GL-001
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Journal Entries & Period Close
* **PAGE_FILE:** `src/app/(dashboard)/accounting/journal/new/page.tsx`
* **ROUTE_URL:** `/accounting/journal/new`
* **API_ROUTE:** `POST /api/accounting/journal`
* **USER_ROLE:** محاسب عام (General Accountant)
* **PERMISSION_REQUIRED:** `create:journal_entry`
* **PRECONDITIONS:**
  * أن تكون الفترة المالية الحالية مفتوحة وغير مغلقة.
  * أن يكون دليل الحسابات SoCPA مهيأ مسبقاً للمستأجر.
* **USER_WORKFLOW_STEPS:**
  1. الدخول لشاشة إدخال قيود اليومية.
  2. تحديد تاريخ الحركة ورقم الحساب الفرعي.
  3. إدخال مبالغ المدين والدائن والتأكد من مطابقة إجمالياتهم.
  4. الضغط على زر ترحيل.
* **EXPECTED_UI_RESULT:** ظهور قيد اليومية في دفتر الأستاذ العام وتعديل أرصدة الحسابات فوراً.
* **EXPECTED_API_RESULT:** يرجع الخادم كود `200 OK` مع تفاصيل القيد.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إنشاء سجلات جديدة في جدولي `JournalEntry` و `JournalLine` مع ربطها بالـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل عملية إنشاء قيد يومية باسم المستخدم ورقمه المالي.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW`
* **TENANT_ISOLATION_CHECK:** عزل القيد وخطوطه بالـ `tenantId` لضمان عدم تسريبه لمستأجر آخر.
* **RBAC_CHECK:** رفض الترحيل لمن يملك دور قارئ فقط (Read-only).
* **VALIDATION_CHECK:** التحقق من عدم قبول قيود فارغة أو غير متوازنة.
* **NEGATIVE_CASE:** محاولة إدخال قيد غير متوازن، يرجع الخادم `400 Bad Request`.
* **EDGE_CASE:** محاولة الكتابة في تاريخ يقع في فترة محاسبية مغلقة، يرجع الخادم خطأ منع التعديل في فترة مغلقة.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر ترحيل:
    * Expected: حفظ القيد وترحيله لدفتر الأستاذ.
    * Risk: حدوث قيد غير متوازن نتيجة التقريب العشري.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

## 📦 2. موديول المبيعات ونقاط البيع (Sales & POS)

### SCENARIO_ID: SCN-POS-001
* **MODULE:** Sales
* **MAIN_SECTION:** Point of Sale (POS)
* **SUBSECTION:** Cashier Checkout & Printing
* **PAGE_FILE:** `src/app/(dashboard)/pos/page.tsx`
* **ROUTE_URL:** `/pos`
* **API_ROUTE:** `POST /api/sales/invoices`
* **USER_ROLE:** كاشير (Cashier)
* **PERMISSION_REQUIRED:** `create:pos_invoice`
* **PRECONDITIONS:**
  * توفر المنتجات في المخزن للفرع المعني.
  * فتح وردية كاشير نشطة (Active Shift).
* **USER_WORKFLOW_STEPS:**
  1. تصفح المنتجات أو استخدام قارئ الباركود لإضافتها لسلة المشتريات.
  2. تحديد العميل وطريقة الدفع (نقدي أو شبكة مادا).
  3. الضغط على زر إتمام الدفع.
  4. طباعة فاتورة المبيعات الحرارية تلقائياً عبر متصفح QZ Tray.
* **EXPECTED_UI_RESULT:** تفريغ سلة المشتريات وتحديث شاشات الجرد الفوري وطباعة الفاتورة.
* **EXPECTED_API_RESULT:** يرجع الخادم كود `201 Created` مع بيانات الفاتورة المعتمدة زكاة.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إنشاء سجل فاتورة في `Invoice` وتخفيض الكمية المتاحة في `StockInventory`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل عملية البيع وربطها بوردية الكاشير ورقم الـ POS.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW`
* **TENANT_ISOLATION_CHECK:** عزل كامل للفواتير والكميات بالـ `tenantId`.
* **RBAC_CHECK:** منع الدخول لصفحة POS لغير الكاشير أو المشرف المعتمد.
* **VALIDATION_CHECK:** التحقق من مطابقة الرقم التسلسلي للفاتورة ومطابقة حسابات الضريبة.
* **NEGATIVE_CASE:** محاولة إتمام بيع كمية غير متوفرة إذا كان النظام يمنع البيع بالسالب.
* **EDGE_CASE:** فقدان الاتصال بشبكة الإنترنت أو خادم QZ Tray، يفعل النظام auto-recovery polling للتحقق من الطابعة وتحديث مؤشر الحالة.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر الدفع:
    * Expected: حفظ الفاتورة وطباعتها.
    * Risk: تعطل الطباعة بسبب فقدان الاتصال بالـ Websocket.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * UI Runtime Stability, Node API, Tenant Isolation, ERP Accounting Controls

---

## 🛡️ 3. موديول الامتثال السعودي وحماية الأجور (Saudi Payroll Compliance)

### SCENARIO_ID: SCN-COMP-001
* **MODULE:** Compliance
* **MAIN_SECTION:** Wages Protection System (WPS)
* **SUBSECTION:** Mudad File Generation
* **PAGE_FILE:** `src/app/(dashboard)/saudi/mudad/page.tsx`
* **ROUTE_URL:** `/saudi/mudad`
* **API_ROUTE:** `GET /api/saudi/mudad/compliance`
* **USER_ROLE:** مدير الموارد البشرية (HR Manager)
* **PERMISSION_REQUIRED:** `manage:wps_files`
* **PRECONDITIONS:**
  * إكمال معالجة مسير الرواتب للشهر المستهدف بالكامل.
  * توفر البيانات البنكية والملفات التعريفية للموظفين (رقم الهوية، رقم الحساب البنكي IBAN).
* **USER_WORKFLOW_STEPS:**
  1. الدخول لشاشة حماية الأجور مدد.
  2. اختيار الشهر والفرع والبنك المعتمد للصرف.
  3. الضغط على زر "توليد ملف مدد WPS".
  4. تحميل الملف بصيغة المعتمدة لتقديمه لمنصة مدد.
* **EXPECTED_UI_RESULT:** إظهار تفاصيل مسير الرواتب المرفوع وتحميل الملف.
* **EXPECTED_API_RESULT:** يرجع الخادم كود `200 OK` مع محتويات الملف المنسق.
* **EXPECTED_DB_IMPACT:**
  * `READ_ONLY`
  * استعلام بيانات الموظفين والرواتب والمسيرات المسجلة لـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل توليد وتحميل ملف حماية الأجور مدد باسم المستخدم.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE`
* **TENANT_ISOLATION_CHECK:** عزل بيانات رواتب الموظفين بالـ `tenantId` لمنع قراءة بيانات مستأجر آخر.
* **RBAC_CHECK:** حظر الوصول لهذه الواجهات لغير مسؤولي الرواتب.
* **VALIDATION_CHECK:** التحقق من دقة صياغة ملف مدد وصحة أرقام الآيبان للرواتب.
* **NEGATIVE_CASE:** محاولة توليد ملف مدد لمسير رواتب لم يتم اعتماده أو ترحيله بعد.
* **EDGE_CASE:** وجود موظف براتب سلبي أو صفر بسبب الخصومات؛ يرفض محرك التحقق توليد الملف مع تنبيه المستخدم لمعالجة الخطأ.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر توليد ملف مدد:
    * Expected: توليد وتحميل الملف.
    * Risk: نقص بيانات الهوية أو IBAN تسبب كراش في المعالج.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation, ERP Accounting Controls
