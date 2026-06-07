# سيناريوهات عمل الأقسام الرئيسية والفرعية (MAIN_AND_SUBSECTION_WORK_SCENARIOS_AR)
**المشروع:** Nama Invest ERP
**المهمة:** FULL_MAIN_AND_SUBSECTION_SCENARIO_COVERAGE_REPAIR_AUTOPILOT
**التاريخ:** 2026-06-07

يضم هذا المستند السيناريوهات الموثقة لكافة الأقسام الرئيسية والفرعية في نظام Nama Invest ERP للتأكد من مطابقة النظام لمتطلبات الجودة والأمان والمحاسبة.

---

## 📊 جدول التغطية الشامل (Coverage Matrix)

| المعرف (Scenario ID) | القسم الرئيسي (Main Section) | القسم الفرعي (Subsection) | الصفحة التشغيلية (Page File) | حالة التغطية |
| :--- | :--- | :--- | :--- | :--- |
| **SCN-GL-001** | General Ledger | Journal Entries & Period Close | `/accounting/journal/new` | **COVERED** |
| **SCN-GL-002** | General Ledger | Chart of Accounts (COA) | `/accounting/coa` | **COVERED** |
| **SCN-BANK-001** | Cash & Banks | Bank Reconciliation | `/banks/reconciliation` | **COVERED** |
| **SCN-GL-003** | Accounts Receivable | Dunning Engine V2 | `/accounting/dunning` | **COVERED** |
| **SCN-ASST-001** | Fixed Assets | Asset Depreciation | `/fixed-assets/depreciation` | **COVERED** |
| **SCN-POS-001** | Point of Sale (POS) | Cashier Checkout & Printing | `/pos` | **COVERED** |
| **SCN-SAL-002** | Sales Operations | Sales Returns | `/sales-returns` | **COVERED** |
| **SCN-POS-002** | Point of Sale (POS) | Restaurant POS & Tables | `/restaurant-pos` | **COVERED** |
| **SCN-PUR-001** | Procurement | Purchase Orders | `/purchase-orders` | **COVERED** |
| **SCN-PUR-002** | Supply Chain | Purchase Returns | `/purchase-returns` | **COVERED** |
| **SCN-INV-001** | Stock Management | Stock Transfers | `/stock-transfers` | **COVERED** |
| **SCN-INV-002** | Stocktake Operations | Stocktake & Adjustment | `/stocktake` | **COVERED** |
| **SCN-HR-001** | Human Resources | Employee Directory & Contracts | `/hr/employees` | **COVERED** |
| **SCN-COMP-001** | Wages Protection | Mudad File Generation | `/saudi/mudad` | **COVERED** |
| **SCN-APP-001** | Document Approvals | Document Workflow Approvals | `/approvals` | **COVERED** |
| **SCN-AI-001** | AI Copilots | AI CFO Financial Auditor | `/ai-cfo` | **COVERED** |
| **SCN-CMMS-001** | Facilities | CMMS Preventive Maintenance | `/maintenance` | **COVERED** |

---

## 🏛️ 1. الموديول المالي والمحاسبي (Accounting & General Ledger)

### SCENARIO_ID: SCN-GL-001
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Journal Entries & Period Close
* **PAGE_FILES:**
  * `src/app/(dashboard)/accounting/journal/new/page.tsx`
* **ROUTE_URLS:**
  * `/accounting/journal/new`
* **API_ROUTES:**
  * `POST /api/accounting/journal`
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
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل القيد وخطوطه بالـ `tenantId` لضمان عدم تسريبه لمستأجر آخر.
* **RBAC_CHECK:** رفض الترحيل لمن يملك دور قارئ فقط (Read-only).
* **VALIDATION_CHECK:** التحقق من عدم قبول قيود فارغة أو غير متوازنة.
* **NEGATIVE_CASES:**
  * محاولة إدخال قيد غير متوازن، يرجع الخادم `400 Bad Request`.
  * محاولة الحفظ بدون تحديد tenant، يرجع الخادم `401 Unauthorized`.
* **EDGE_CASES:**
  * محاولة الكتابة في تاريخ يقع في فترة محاسبية مغلقة، يرجع الخادم خطأ منع التعديل في فترة مغلقة.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر ترحيل:
    * Expected UI: تحول حالة المستند لـ Posted وتجميد الحقول.
    * Expected API: `POST /api/accounting/journal`
    * Risk: حدوث قيد غير متوازن نتيجة التقريب العشري.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

### SCENARIO_ID: SCN-GL-002
* **MODULE:** Accounting
* **MAIN_SECTION:** General Ledger
* **SUBSECTION:** Chart of Accounts (COA)
* **PAGE_FILES:**
  * `src/app/(dashboard)/accounting/coa/page.tsx`
* **ROUTE_URLS:**
  * `/accounting/coa`
* **API_ROUTES:**
  * `GET /api/accounting/coa`
  * `POST /api/accounting/coa`
* **USER_ROLE:** مدير مالي (CFO)
* **PERMISSION_REQUIRED:** `manage:coa`
* **PRECONDITIONS:**
  * تهيئة المستأجر وتحديد الحسابات الجذرية (Assets, Liabilities, Equity, Revenue, Expenses).
* **USER_WORKFLOW_STEPS:**
  1. استعراض دليل الحسابات على شكل شجرة متداخلة (Tree View).
  2. الضغط على حساب أب واختيار "إضافة حساب فرعي".
  3. إدخال اسم الحساب (بالعربي والإنجليزي)، النوع (مدين/دائن)، والرمز المالي.
  4. الضغط على "حفظ".
* **EXPECTED_UI_RESULT:** تحديث شجرة الحسابات فوراً وإدراج الحساب الجديد في موقعه الهرمي المناسب.
* **EXPECTED_API_RESULT:**
  * `POST /api/accounting/coa` يرجع `201 Created` مع بيانات الحساب الجديد.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إضافة سجل جديد في جدول `Account` مع ربطه بالـ `parentId` وتخصيصه للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل إضافة حساب جديد في الدليل مع تحديد الرمز المالي وصاحب العملية.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE`
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل شجرة الحسابات بالكامل بحيث لا تظهر للمستأجر حسابات مستأجر آخر.
* **RBAC_CHECK:** منع تعديل الدليل لغير أصحاب الصلاحيات العالية (CFO/Admin).
* **VALIDATION_CHECK:** التحقق من تفرد الرمز المالي للحساب وتطابق نوع الحساب مع حساب الأب.
* **NEGATIVE_CASES:**
  * محاولة إنشاء رمز حساب مكرر في نفس المستأجر.
  * محاولة إدراج حساب فرعي كمدين تحت أب دائن بدون تأكيد.
* **EDGE_CASES:**
  * إضافة حساب متداخل بعمق 10 مستويات؛ يجب أن يتعامل محرك العرض مع العمق دون تشوه بصرى.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر إضافة حساب فرعي:
    * Expected UI: فتح نافذة منبثقة مع تعبئة رمز الأب تلقائياً.
    * Expected API: `POST /api/accounting/coa`
    * Risk: تكرار طلب الإنشاء السريع يسبب تكرار الرموز.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls

---

### SCENARIO_ID: SCN-BANK-001
* **MODULE:** Accounting
* **MAIN_SECTION:** Cash & Banks
* **SUBSECTION:** Bank Reconciliation
* **PAGE_FILES:**
  * `src/app/(dashboard)/banks/reconciliation/page.tsx`
* **ROUTE_URLS:**
  * `/banks/reconciliation`
* **API_ROUTES:**
  * `GET /api/banks/transactions`
  * `POST /api/banks/reconcile`
* **USER_ROLE:** محاسب خزينة (Treasury Accountant)
* **PERMISSION_REQUIRED:** `manage:bank_recon`
* **PRECONDITIONS:**
  * استيراد كشف الحساب البنكي (CSV/Excel) الخاص بالبنك المستهدف.
  * تسجيل القيود المحاسبية للبنك في النظام.
* **USER_WORKFLOW_STEPS:**
  1. اختيار البنك المعني وتحديد الفترة الزمنية للمطابقة.
  2. استعراض الحركات المسجلة دفترياً في اليمين، وحركات كشف البنك في اليسار.
  3. ربط الحركة الدفترية بالحركة البنكية المقابلة يدوياً أو استخدام المطابقة الآلية.
  4. الضغط على زر "تأكيد التسوية البنكية".
* **EXPECTED_UI_RESULT:** تلاشي الحركات المتطابقة من القائمتين وتحديث رصيد التسوية الفعلي للبنك.
* **EXPECTED_API_RESULT:**
  * `POST /api/banks/reconcile` يرجع `200 OK` مع مصفوفة المعرفات المتطابقة.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * تحديث حقل `reconciled` في جدولي `BankStatementLine` و `JournalLine` مع ربطهما بالـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل إجراء تسوية بنكية للفترة المحددة باسم المحاسب.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (تسوية ومطابقة أرصدة دون إنشاء قيود جديدة ما لم يتم تسجيل فرق صرف يدوياً)
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل حركات البنوك للمستأجر بالكامل.
* **RBAC_CHECK:** رفض اعتماد التسوية لمن يملك دور مبيعات أو مستودعات.
* **VALIDATION_CHECK:** التحقق من تطابق القيمة المادية للحركات المربوطة.
* **NEGATIVE_CASES:**
  * محاولة مطابقة حركتين بقيم مختلفة يرجع النظام خطأ عدم تطابق المبالغ.
* **EDGE_CASES:**
  * مطابقة حركة دفترية واحدة مع حركات بنكية متعددة (One-to-Many Reconciliation).
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر مطابقة آلية:
    * Expected UI: تمييز الحركات المتطابقة في التاريخ والمبلغ باللون الأخضر.
    * Expected API: `GET /api/banks/transactions?auto=true`
    * Risk: مطابقة حركة خاطئة بالصدفة لتطابق المبالغ.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P2
* **REQUIRED_SKILL_GATES:**
  * UI Runtime Stability, Node API, Tenant Isolation

---

### SCENARIO_ID: SCN-GL-003
* **MODULE:** Accounting
* **MAIN_SECTION:** Accounts Receivable
* **SUBSECTION:** Dunning Engine V2
* **PAGE_FILES:**
  * `src/app/(dashboard)/accounting/dunning/page.tsx`
* **ROUTE_URLS:**
  * `/accounting/dunning`
* **API_ROUTES:**
  * `POST /api/accounting/dunning/run`
* **USER_ROLE:** مسؤول تحصيل (Collections Officer)
* **PERMISSION_REQUIRED:** `manage:dunning`
* **PRECONDITIONS:**
  * وجود فواتير مبيعات آجلة تجاوزت تاريخ الاستحقاق الفعلي.
  * تهيئة مستويات التحصيل والرسائل (إيميل/رسالة نصية) لكل مستوى.
* **USER_WORKFLOW_STEPS:**
  1. الدخول لشاشة المتابعة والتحصيل.
  2. استعراض الفواتير المتأخرة وتوزيعها على مستويات المتابعة (Dunning Levels).
  3. الضغط على زر "تشغيل محرك التحصيل اليومي" (Daily Run).
* **EXPECTED_UI_RESULT:** إرسال التنبيهات تلقائياً وتحديث مستوى التحصيل لكل فاتورة مسجلة.
* **EXPECTED_API_RESULT:**
  * `POST /api/accounting/dunning/run` يرجع `200 OK` مع إجمالي التنبيهات الصادرة وتحديثات الحالات.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إضافة سجلات في `DunningHistory` وتحديث حالة الفاتورة `Invoice` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل تشغيل محرك الدانينج وقائمة العملاء المنذرين.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (تحديث حالات التنبيه دون قيود مالية)
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED
* **TENANT_ISOLATION_CHECK:** ضمان إرسال التنبيهات لعملاء المستأجر الفعلي فقط وعدم خلط أرقام العملاء.
* **RBAC_CHECK:** رفض التشغيل لغير مسؤولي التحصيل والحسابات المدنية.
* **VALIDATION_CHECK:** التحقق من عدم إرسال إشعار لعميل قام بالتسديد قبل لحظات من التشغيل.
* **NEGATIVE_CASES:**
  * محاولة تشغيل المحرك في حال عدم توفر فواتير مستحقة يرجع رسالة تنبيه واضحة.
* **EDGE_CASES:**
  * العميل يملك فواتير مستحقة وأخرى غير مستحقة؛ يجب إدراج المستحقة فقط في الإشعار.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر تشغيل المحرك:
    * Expected UI: عرض شريط تقدم المعالجة الفورية وإظهار عدد الإشعارات المرسلة.
    * Expected API: `POST /api/accounting/dunning/run`
    * Risk: استهلاك مكثف للذاكرة أو تعطيل الـ Event Loop بسبب المعالجة الضخمة للفواتير.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation, UI Runtime Stability

---

## 📦 2. موديول المبيعات ونقاط البيع (Sales & POS)

### SCENARIO_ID: SCN-POS-001
* **MODULE:** Sales
* **MAIN_SECTION:** Point of Sale (POS)
* **SUBSECTION:** Cashier Checkout & Printing
* **PAGE_FILES:**
  * `src/app/(dashboard)/pos/page.tsx`
* **ROUTE_URLS:**
  * `/pos`
* **API_ROUTES:**
  * `POST /api/sales/invoices`
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
  * إنشاء سجل فاتورة في `Invoice` وتخفيض الكمية المتاحة في `StockInventory` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل عملية البيع وربطها بوردية الكاشير ورقم الـ POS.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW`
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل كامل للفواتير والكميات بالـ `tenantId`.
* **RBAC_CHECK:** منع الدخول لصفحة POS لغير الكاشير أو المشرف المعتمد.
* **VALIDATION_CHECK:** التحقق من مطابقة الرقم التسلسلي للفاتورة ومطابقة حسابات الضريبة.
* **NEGATIVE_CASES:**
  * محاولة إتمام بيع كمية غير متوفرة إذا كان النظام يمنع البيع بالسالب.
* **EDGE_CASES:**
  * فقدان الاتصال بشبكة الإنترنت أو خادم QZ Tray، يفعل النظام auto-recovery polling للتحقق من الطابعة وتحديث مؤشر الحالة.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر الدفع:
    * Expected UI: وميض مؤشر الدفع ثم تفريغ السلة وطباعة الفاتورة.
    * Expected API: `POST /api/sales/invoices`
    * Risk: تعطل الطباعة بسبب فقدان الاتصال بالـ Websocket.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * UI Runtime Stability, Node API, Tenant Isolation, ERP Accounting Controls

---

### SCENARIO_ID: SCN-SAL-002
* **MODULE:** Sales
* **MAIN_SECTION:** Sales Operations
* **SUBSECTION:** Sales Returns
* **PAGE_FILES:**
  * `src/app/(dashboard)/sales-returns/page.tsx`
* **ROUTE_URLS:**
  * `/sales-returns`
* **API_ROUTES:**
  * `POST /api/sales/returns`
* **USER_ROLE:** مشرف مبيعات (Sales Supervisor)
* **PERMISSION_REQUIRED:** `create:sales_return`
* **PRECONDITIONS:**
  * توفر فاتورة مبيعات أصلية مرحلة ومسجلة في النظام ومربوطة بالـ `tenantId`.
* **USER_WORKFLOW_STEPS:**
  1. استعلام الفاتورة الأصلية باستخدام رقم الفاتورة أو باركود الفاتورة.
  2. تحديد الأصناف المسترجع كميتها والسبب (تالف/إرجاع عادي).
  3. تحديد طريقة رد المبلغ (نقدي/إلى حساب العميل الآجل/كوبون شراء).
  4. الضغط على زر "اعتماد مرتجع المبيعات".
* **EXPECTED_UI_RESULT:** إصدار إشعار دائن (Credit Note) معتمد وطباعته مع الرمز المربع QR المحدث زكاة.
* **EXPECTED_API_RESULT:**
  * `POST /api/sales/returns` يرجع `201 Created` مع تفاصيل الإشعار الدائن.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إنشاء سجل في `SalesReturn` وزيادة كمية المخزون في `StockInventory` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل اعتماد إشعار المبيعات الدائن وتحديد المرجع والوردية.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW`
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل الفواتير والمرتجعات بالـ `tenantId` لمنع إرجاع فواتير لمستأجر آخر.
* **RBAC_CHECK:** حظر تنفيذ عمليات المرتجعات للكاشير العادي دون تفويض المشرف عبر صلاحيات RBAC.
* **VALIDATION_CHECK:** التحقق من عدم تجاوز الكمية المسترجعة للكمية المباعة في الفاتورة الأصلية.
* **NEGATIVE_CASES:**
  * محاولة إرجاع فاتورة تم إرجاعها مسبقاً بالكامل؛ يظهر خطأ الفاتورة مسترجعة بالكامل.
* **EDGE_CASES:**
  * إرجاع الفاتورة بعد انقضاء المهلة الرسمية للإرجاع (مثلاً بعد 14 يوم)، يطلب النظام رمز موافقة المدير المالي.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر اعتماد المرتجع:
    * Expected UI: عرض نافذة نجاح العملية وطباعة إيصال المرتجع.
    * Expected API: `POST /api/sales/returns`
    * Risk: عدم زيادة الكمية بالمخزن نتيجة تعطل transactional write في Prisma.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

### SCENARIO_ID: SCN-POS-002
* **MODULE:** Sales
* **MAIN_SECTION:** Point of Sale (POS)
* **SUBSECTION:** Restaurant POS & Tables
* **PAGE_FILES:**
  * `src/app/(dashboard)/restaurant-pos/page.tsx`
* **ROUTE_URLS:**
  * `/restaurant-pos`
* **API_ROUTES:**
  * `POST /api/restaurant/orders`
  * `PUT /api/restaurant/tables/status`
* **USER_ROLE:** ويتر / نادل (Waiter)
* **PERMISSION_REQUIRED:** `create:restaurant_order`
* **PRECONDITIONS:**
  * تهيئة خريطة الطاولات والأقسام في المطعم للمستأجر.
  * فتح وردية المطعم وتوفر الطابعات في المطبخ (Kitchen Printers).
* **USER_WORKFLOW_STEPS:**
  1. اختيار الطاولة الشاغرة من خريطة الصالة.
  2. إضافة الوجبات وتحديد الملاحظات لكل وجبة (بدون بصل/إضافة جبن).
  3. الضغط على زر "إرسال للمطبخ".
  4. بعد الانتهاء، الضغط على زر "طلب الحساب الفوري" وطباعة الفاتورة للعميل.
* **EXPECTED_UI_RESULT:** تحول حالة الطاولة إلى "مشغولة" وإرسال تذكرة المطبخ وطباعتها وتحديث رصيد الطاولة الفوري.
* **EXPECTED_API_RESULT:**
  * `POST /api/restaurant/orders` يرجع `201 Created`.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * تعديل حالة الطاولة في `Table` وإنشاء أمر التحضير في `KitchenOrder` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل إرسال الطلب مربوطاً برقم الطاولة واسم الويتر.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (أثناء إرسال الطلب للمطبخ) / `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW` (عند إغلاق الفاتورة والدفع).
* **PERIOD_LOCK_CHECK:** REQUIRED (عند إغلاق الفاتورة فقط)
* **TENANT_ISOLATION_CHECK:** عزل كامل للطاولات والطلبات لتجنب خلط طاولات فروع أو مستأجرين مختلفين.
* **RBAC_CHECK:** منع الويتر من إلغاء صنف مرسل للمطبخ دون إدخال كلمة سر المشرف المعتمد.
* **VALIDATION_CHECK:** التحقق من عدم إرسال طلب لطاولة مشغولة بطلبات أخرى دون دمج الطاولات.
* **NEGATIVE_CASES:**
  * محاولة إرسال طلب فارغ يظهر تنبيه يجب إضافة أصناف للطلب أولاً.
* **EDGE_CASES:**
  * دمج طاولتين أو نقل الطلب من طاولة لأخرى أثناء التحضير في المطبخ.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر إرسال للمطبخ:
    * Expected UI: تحول حالة الأصناف في الواجهة لـ "قيد التحضير" مع وميض بصرى.
    * Expected API: `POST /api/restaurant/orders`
    * Risk: كراش في واجهة الطاولات نتيجة فشل تحديث حالة websocket الحية.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * UI Runtime Stability, Node API, Tenant Isolation

---

## 🛒 3. موديول المشتريات والتموين (Purchases & SCM)

### SCENARIO_ID: SCN-PUR-001
* **MODULE:** Purchases
* **MAIN_SECTION:** Procurement
* **SUBSECTION:** Purchase Orders
* **PAGE_FILES:**
  * `src/app/(dashboard)/purchase-orders/page.tsx`
* **ROUTE_URLS:**
  * `/purchase-orders`
* **API_ROUTES:**
  * `POST /api/purchases/orders`
* **USER_ROLE:** موظف مشتريات (Procurement Officer)
* **PERMISSION_REQUIRED:** `create:purchase_order`
* **PRECONDITIONS:**
  * تسجيل الموردين واعتمادهم في النظام.
  * توفر المنتجات في دليل المشتريات للمستأجر.
* **USER_WORKFLOW_STEPS:**
  1. الدخول لشاشة أمر شراء جديد واختيار المورد.
  2. إضافة المواد المطلوبة وتحديد الكميات وأسعار التوريد المتفق عليها.
  3. الضغط على زر "إرسال للمراجعة والاعتماد".
* **EXPECTED_UI_RESULT:** حفظ المستند كـ Draft وحجزه للرقم التسلسلي لأوامر الشراء وإرساله للمشرف.
* **EXPECTED_API_RESULT:**
  * `POST /api/purchases/orders` يرجع `201 Created` مع بيانات المستند المسودة.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إنشاء سجل في `PurchaseOrder` و `PurchaseOrderLine` مع ربطهما بالـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل إنشاء أمر شراء مسودة باسم الموظف.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (أمر الشراء لا ينشئ قيوداً مالية في الدفاتر العامة دفترياً)
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل كامل لبيانات الموردين وأسعار الشراء لضمان سرية معلومات المستأجر.
* **RBAC_CHECK:** منع موظف المشتريات من اعتماد أمر الشراء فوق `50,000 SAR` يدوياً دون موافقة المدير المالي.
* **VALIDATION_CHECK:** التحقق من مطابقة حسابات القيمة المضافة الضريبية 15% على إجمالي الأصناف.
* **NEGATIVE_CASES:**
  * محاولة الحفظ بدون اختيار مورد أو اختيار مورد غير نشط (Inactive Vendor).
* **EDGE_CASES:**
  * طلب شراء أصناف بعملة مختلفة عن العملة الأساسية للمستأجر وتطبيق أسعار صرف العملات.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر حفظ مسودة:
    * Expected UI: حفظ البيانات بنجاح وتوليد الرقم التسلسلي.
    * Expected API: `POST /api/purchases/orders`
    * Risk: حجز أرقام تسلسلية مكررة نتيجة تكرار النقرات (Double click).
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P2
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation, UI Runtime Stability

---

### SCENARIO_ID: SCN-PUR-002
* **MODULE:** Purchases
* **MAIN_SECTION:** Supply Chain
* **SUBSECTION:** Purchase Returns
* **PAGE_FILES:**
  * `src/app/(dashboard)/purchase-returns/page.tsx`
* **ROUTE_URLS:**
  * `/purchase-returns`
* **API_ROUTES:**
  * `POST /api/purchases/returns`
* **USER_ROLE:** أمين مستودع (Storekeeper)
* **PERMISSION_REQUIRED:** `create:purchase_return`
* **PRECONDITIONS:**
  * توفر فاتورة شراء أو سند استلام مخزني (GRN) مرحل ومثبت لـ `tenantId`.
* **USER_WORKFLOW_STEPS:**
  1. استدعاء سند الاستلام أو فاتورة الشراء الأصلية.
  2. تحديد المنتجات المراد إرجاعها للمورد وتحديد كمياتها والسبب.
  3. الضغط على زر "اعتماد مرتجع المشتريات".
* **EXPECTED_UI_RESULT:** تخفيض كمية المنتجات من المخازن فورياً وتحديث الرصيد المستحق للمورد.
* **EXPECTED_API_RESULT:**
  * `POST /api/purchases/returns` يرجع `201 Created` مع تفاصيل سند الإرجاع والقيود المحاسبية.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إنشاء سجل في `PurchaseReturn` وتحديث المخزون الفعلي في `StockInventory` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل خروج كميات البضائع المرجعة وتحديث حسابات المورد.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW`
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل المستندات والمخازن بالـ `tenantId` لضمان عدم تسريب مستندات الموردين.
* **RBAC_CHECK:** رفض اعتماد سند الإرجاع لغير أمناء المستودعات المعتمدين.
* **VALIDATION_CHECK:** التحقق من صحة أسعار المنتجات المرتجعة ومطابقتها لأسعار الشراء الأصلية لتجنب فروق الجرد الخاطئة.
* **NEGATIVE_CASES:**
  * محاولة إرجاع بضاعة بكمية أكبر من الكمية المتوفرة حالياً في المستودع المحدد.
* **EDGE_CASES:**
  * المرتجع يتم في فترة محاسبية لاحقة للفاتورة مع اختلاف تقييم متوسط التكلفة للمواد.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر اعتماد المرتجع:
    * Expected UI: عرض شاشة إقرار النجاح وتحديث مستويات جرد الأصناف.
    * Expected API: `POST /api/purchases/returns`
    * Risk: انخفاض المخزون لأسفل الصفر في المستودع الفرعي نتيجة خطأ التوزيع.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

## 📦 4. موديول المخازن وإدارة المستودعات (Inventory & WMS)

### SCENARIO_ID: SCN-INV-001
* **MODULE:** Inventory
* **MAIN_SECTION:** Stock Management
* **SUBSECTION:** Stock Transfers
* **PAGE_FILES:**
  * `src/app/(dashboard)/stock-transfers/page.tsx`
* **ROUTE_URLS:**
  * `/stock-transfers`
* **API_ROUTES:**
  * `POST /api/inventory/transfers`
* **USER_ROLE:** أمين مستودع (Storekeeper)
* **PERMISSION_REQUIRED:** `create:stock_transfer`
* **PRECONDITIONS:**
  * توفر مستودعين على الأقل نشطين لنفس المستأجر.
  * توفر الأصناف المستهدفة بكميات كافية في مستودع المصدر.
* **USER_WORKFLOW_STEPS:**
  1. اختيار مستودع المصدر (Source) ومستودع الهدف (Destination).
  2. إضافة المنتجات وتحديد الكميات المراد نقلها.
  3. الضغط على زر "اعتماد وإرسال التحويل".
* **EXPECTED_UI_RESULT:** تعديل فوري لكميات البضائع (محجوز للنقل) وتحديث الحالات لـ "قيد الشحن" (In-Transit).
* **EXPECTED_API_RESULT:**
  * `POST /api/inventory/transfers` يرجع `201 Created` مع تفاصيل سند التحويل.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * تحديث كمية المخزن في `StockInventory` لكلا المستودعين وإنشاء سجل `StockTransfer` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل حركة النقل الداخلي للأصناف بين المواقع المذكورة.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW` (قيود تحويل البضاعة بين حسابات الفروع إن كانت تتبع كيانات محاسبية منفصلة)
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** حظر رؤية أو استخدام مستودعات تابعة لمستأجر آخر أثناء عملية اختيار الأطراف.
* **RBAC_CHECK:** منع موظفي المبيعات من إجراء التحويلات المخزنية يدوياً دون تفويض مخزني.
* **VALIDATION_CHECK:** التحقق من سلامة الباركود والكميات المصدرة ومطابقتها.
* **NEGATIVE_CASES:**
  * محاولة تحويل صنف غير متوفر بمستودع المصدر يظهر تنبيه فوري بالكمية المتاحة.
* **EDGE_CASES:**
  * نقل المواد وتلفها أثناء الشحن؛ يجب معالجة سند الفروق وتلف البضاعة في الطريق.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر اعتماد التحويل:
    * Expected UI: تحول حالة المستند لـ Approved وتحديث كميات الجرد.
    * Expected API: `POST /api/inventory/transfers`
    * Risk: حدوث انقسام أو خلط في كميات المواد نتيجة عدم تطبيق atomic transaction في النقل.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls

---

### SCENARIO_ID: SCN-INV-002
* **MODULE:** Inventory
* **MAIN_SECTION:** Stocktake Operations
* **SUBSECTION:** Stocktake & Adjustment
* **PAGE_FILES:**
  * `src/app/(dashboard)/stocktake/page.tsx`
* **ROUTE_URLS:**
  * `/stocktake`
* **API_ROUTES:**
  * `POST /api/inventory/stocktake`
  * `POST /api/inventory/adjustments`
* **USER_ROLE:** مدير جرد مخزني (Inventory Manager)
* **PERMISSION_REQUIRED:** `manage:stocktake`
* **PRECONDITIONS:**
  * إيقاف حركات البيع والشراء مؤقتاً في المستودع المستهدف لضمان ثبات كميات الجرد.
  * إنشاء سند جرد دوري (Stocktake Sheet) للأصناف المستهدفة.
* **USER_WORKFLOW_STEPS:**
  1. فتح ورقة الجرد المفتوحة وتعبئة الكميات الممسوحة فعلياً (Actual Count).
  2. مقارنة الكميات الفعلية مع الكميات الدفترية المسجلة (Book Count).
  3. الضغط على زر "اعتماد الفروقات وتوليد سند تسوية".
* **EXPECTED_UI_RESULT:** تحديث كميات الجرد الدفتري لتطابق الفعلي فوراً وعرض مبالغ الفروق الإجمالية.
* **EXPECTED_API_RESULT:**
  * `POST /api/inventory/adjustments` يرجع `201 Created` مع قيود فروق الجرد.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * تسوية سجلات `StockInventory` بالكميات الجديدة وإنشاء سند `InventoryAdjustment` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل تسوية المخزون وتفاصيل الفروقات (عجز/زيادة) لكل صنف.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW` (إنتاج قيود تسوية تؤثر على تكلفة البضاعة المباعة ومصروف عجز الجرد)
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل أوراق الجرد ومواقعها وحظر استعراضها لغير المستأجر الفعلي.
* **RBAC_CHECK:** قصر صلاحية ترحيل تسويات الجرد على المدير المخزني أو المالي حصراً لمنع التلاعب.
* **VALIDATION_CHECK:** التحقق من صحة متوسط التكلفة وحسابات الفروق المحاسبية المصاحبة.
* **NEGATIVE_CASES:**
  * محاولة إدخال كميات جرد سالبة يرفضها محرك التحقق فورياً.
* **EDGE_CASES:**
  * إدخال كميات جرد لمنتجات تم بيعها أثناء الجرد بالرغم من حظر البيع؛ يطلب النظام مراجعة يدوية.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر ترحيل التسوية:
    * Expected UI: عرض نافذة المطابقة والموافقة وتجميد ورقة الجرد الفعلي.
    * Expected API: `POST /api/inventory/adjustments`
    * Risk: كسر توازن متوسط التكلفة الدفترية نتيجة استخدام أسعار تسوية تالفة.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

## 🏛️ 5. موديول الموارد البشرية والرواتب (HR & Payroll)

### SCENARIO_ID: SCN-HR-001
* **MODULE:** HR
* **MAIN_SECTION:** Human Resources
* **SUBSECTION:** Employee Directory & Contracts
* **PAGE_FILES:**
  * `src/app/(dashboard)/hr/employees/page.tsx`
* **ROUTE_URLS:**
  * `/hr/employees`
* **API_ROUTES:**
  * `POST /api/hr/employees`
  * `POST /api/hr/contracts`
* **USER_ROLE:** أخصائي موارد بشرية (HR Specialist)
* **PERMISSION_REQUIRED:** `create:employee`
* **PRECONDITIONS:**
  * تهيئة مصفوفة الوظائف والأقسام للمستأجر (الرتب الوظيفية، الفروع الإدارية).
* **USER_WORKFLOW_STEPS:**
  1. الدخول لشاشة إضافة موظف جديد وإدخال البيانات الشخصية (الاسم، الهوية، رقم الجوال).
  2. الانتقال لعلامة تبويب "العقد والرواتب" وتعبئة البيانات البنكية والراتب الأساسي والبدلات.
  3. الضغط على زر "تسجيل وتفعيل الموظف".
* **EXPECTED_UI_RESULT:** إدراج الموظف في دليل موظفي الشركة النشطين وتوليد الرقم الوظيفي الفريد.
* **EXPECTED_API_RESULT:**
  * `POST /api/hr/employees` يرجع `201 Created` مع بيانات الموظف المسجل.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إنشاء سجلات جديدة في `Employee` و `Contract` مربوطة بالـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل إضافة موظف جديد وتفاصيل راتبه الأساسي المعتمد.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (تسجيل الموظف لا يولد قيوداً محاسبية حية حتى دورة الرواتب)
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل سجلات الموظفين وعقودهم بالكامل بالـ `tenantId` لحماية خصوصية بيانات الأفراد.
* **RBAC_CHECK:** حظر تصفح عقود الموظفين والبدلات لغير مخولي الموارد البشرية والرواتب.
* **VALIDATION_CHECK:** التحقق من صحة رقم الهوية الوطنية (10 خانات تبدأ بـ 1 أو 2) وصحة رمز الآيبان البنكي.
* **NEGATIVE_CASES:**
  * محاولة تسجيل موظف برقم هوية مسجل مسبقاً في نفس المستأجر.
* **EDGE_CASES:**
  * تسجيل موظف بعقد غير محدد المدة أو عقد تدريبي بمزايا مستثناة وتأثيره على ملف مدد.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر تفعيل الموظف:
    * Expected UI: عرض بطاقة الموظف المحدثة فورياً.
    * Expected API: `POST /api/hr/employees`
    * Risk: كشف تفاصيل الرواتب في شبكة الـ client نتيجة عدم تصفية حقول الاستعلام.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P2
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation, OWASP ASVS

---

### SCENARIO_ID: SCN-COMP-001
* **MODULE:** Compliance
* **MAIN_SECTION:** Wages Protection System (WPS)
* **SUBSECTION:** Mudad File Generation
* **PAGE_FILES:**
  * `src/app/(dashboard)/saudi/mudad/page.tsx`
* **ROUTE_URLS:**
  * `/saudi/mudad`
* **API_ROUTES:**
  * `GET /api/saudi/mudad/compliance`
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
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل بيانات رواتب الموظفين بالـ `tenantId` لمنع قراءة بيانات مستأجر آخر.
* **RBAC_CHECK:** حظر الوصول لهذه الواجهات لغير مسؤولي الرواتب.
* **VALIDATION_CHECK:** التحقق من دقة صياغة ملف مدد وصحة أرقام الآيبان للرواتب.
* **NEGATIVE_CASES:**
  * محاولة توليد ملف مدد لمسير رواتب لم يتم اعتماده أو ترحيله بعد.
* **EDGE_CASES:**
  * وجود موظف براتب سلبي أو صفر بسبب الخصومات؛ يرفض محرك التحقق توليد الملف مع تنبيه المستخدم لمعالجة الخطأ.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر توليد ملف مدد:
    * Expected UI: عرض رسالة التجهيز ثم بدء تحميل الملف بصيغة Text المحددة.
    * Expected API: `GET /api/saudi/mudad/compliance`
    * Risk: نقص بيانات الهوية أو IBAN تسبب كراش في المعالج.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation, ERP Accounting Controls

---

## 🏛️ 6. موديول الأصول الثابتة وإهلاكها (Fixed Assets)

### SCENARIO_ID: SCN-ASST-001
* **MODULE:** Assets
* **MAIN_SECTION:** Fixed Assets
* **SUBSECTION:** Asset Depreciation
* **PAGE_FILES:**
  * `src/app/(dashboard)/fixed-assets/depreciation/page.tsx`
* **ROUTE_URLS:**
  * `/fixed-assets/depreciation`
* **API_ROUTES:**
  * `POST /api/assets/depreciate`
* **USER_ROLE:** محاسب أصول (Asset Accountant)
* **PERMISSION_REQUIRED:** `manage:depreciation`
* **PRECONDITIONS:**
  * إدراج الأصول الرأسمالية وتحديد قيمتها الدفترية وطريقة الإهلاك (مثل القسط الثابت).
  * فتح الفترات المالية المحاسبية المستهدفة بالإهلاك.
* **USER_WORKFLOW_STEPS:**
  1. اختيار الشهر المستهدف لإهلاك الأصول.
  2. استعراض قائمة الأصول المشمولة ومبالغ الإهلاك المقدرة لكل منها.
  3. الضغط على زر "تشغيل وتوثيق قيود الإهلاك الدوري".
* **EXPECTED_UI_RESULT:** تحول حالة الإهلاك للشهر المستهدف إلى "مكتمل" وتوليد القيود المحاسبية تلقائياً.
* **EXPECTED_API_RESULT:**
  * `POST /api/assets/depreciate` يرجع `200 OK` مع قائمة القيود المولدة.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * تحديث القيمة الدفترية في `Asset` وتوليد قيود الإهلاك في `JournalEntry` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل إجراء إهلاك الأصول للشهر المذكور وبيان القيمة المادية المخصومة.
* **EXPECTED_FINANCIAL_IMPACT:** `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW` (إنشاء ترحيل محاسبي يخفض قيمة الأصل ويزيد مجمع الإهلاك ومصروف الإهلاك)
* **PERIOD_LOCK_CHECK:** REQUIRED
* **TENANT_ISOLATION_CHECK:** عزل الأصول والقيود بالـ `tenantId` لضمان عدم حدوث تشابك في أصول الشركات.
* **RBAC_CHECK:** منع تعديل أرقام الإهلاك أو إيقاف الإهلاك بدون موافقة المشرف المالي.
* **VALIDATION_CHECK:** التحقق من عدم تجاوز مجمع الإهلاك للقيمة القابلة للإهلاك للأصل (القيمة الدفترية - الخردة).
* **NEGATIVE_CASES:**
  * محاولة إهلاك أصل تم إهلاكه بالكامل سابقاً أو أصل موقوف عن العمل.
* **EDGE_CASES:**
  * إهلاك أصل تم شراؤه في منتصف الشهر واحتساب الإهلاك النسبي بالأيام (Pro-rata Depreciation).
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر تشغيل الإهلاك:
    * Expected UI: عرض بطاقة الفروق وحالات الأصول بعد الإهلاك.
    * Expected API: `POST /api/assets/depreciate`
    * Risk: تكرار تشغيل الإهلاك لنفس الشهر ينتج عنه قيود مكررة وتلف الدفاتر العامة.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

## 🏛️ 7. موديول الموافقات وسجلات النظام (Approvals & Audit)

### SCENARIO_ID: SCN-APP-001
* **MODULE:** Approvals
* **MAIN_SECTION:** Document Approval Sagas
* **SUBSECTION:** Document Workflow Approvals
* **PAGE_FILES:**
  * `src/app/(dashboard)/approvals/page.tsx`
* **ROUTE_URLS:**
  * `/approvals`
* **API_ROUTES:**
  * `GET /api/approvals/pending`
  * `POST /api/approvals/action`
* **USER_ROLE:** مدير معتمد / مفوض (Approver Manager)
* **PERMISSION_REQUIRED:** `approve:documents`
* **PRECONDITIONS:**
  * وجود سندات (أمر شراء/فاتورة شراء/طلب صرف) معلقة تتطلب موافقة المدير المالي أو العام.
  * إعداد سلسلة الموافقات (Approval Matrix) وتحديد مستويات الحدود المالية للموافقة.
* **USER_WORKFLOW_STEPS:**
  1. الدخول لشاشة الطلبات المعلقة واستعراض تفاصيل السند المحال للموافقة.
  2. كتابة الملاحظات إن وجدت في حقل المراجعة.
  3. الضغط على زر "موافقة" أو "رفض".
* **EXPECTED_UI_RESULT:** إزالة المستند فورياً من قائمة الطلبات المعلقة وتحديث حالته للخطوة القادمة.
* **EXPECTED_API_RESULT:**
  * `POST /api/approvals/action` يرجع `200 OK` مع حالة المستند المحدثة بعد الساجا (Saga State).
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * تحديث حالة السند `status` في جداول المستندات المعنية وتحديث سجل `ApprovalLog` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل القرار الصادر (موافقة/رفض) ورقمه المالي وتوقيت العملية.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (أثناء الموافقة على المستند كفكرة) / `REAL_POSTING_EXPECTED_ONLY_IN_APPROVED_FLOW` (إذا كانت الموافقة تفجر ترحيلاً محاسبياً تلقائياً للمستند المعتمد).
* **PERIOD_LOCK_CHECK:** REQUIRED (إذا كان الاعتماد يرحل قيداً مالياً دفترياً)
* **TENANT_ISOLATION_CHECK:** عزل طلبات الموافقات لضمان عدم تسريب مستندات أو حدود موافقات خارج الكيان الفعلي.
* **RBAC_CHECK:** منع غير المفوض المكتوب اسمه في خطوة الاعتماد الحالية من تعديل أو تمرير الموافقة.
* **VALIDATION_CHECK:** التحقق من مطابقة الحدود المالية للموافقة مع صلاحية المدير.
* **NEGATIVE_CASES:**
  * محاولة اعتماد مستند تم إلغاؤه أو تعديله من قبل المنشئ في نفس اللحظة.
* **EDGE_CASES:**
  * تفويض الصلاحية لمدير بديل أثناء الإجازات الرسمية والتحقق من صلاحية التفويض الزمنية.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر موافقة:
    * Expected UI: اختفاء الطلب من الشاشة وتحديث مؤشرات العدد الإجمالي.
    * Expected API: `POST /api/approvals/action`
    * Risk: معالجة الطلب مرتين مما ينتج عنه تكرار الموافقات يسبب مشاكل في سيرفر الموافقات (Race Condition).
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** HIGH
* **RISK_LEVEL:** P1
* **REQUIRED_SKILL_GATES:**
  * JS/TS Runtime, Node API, Tenant Isolation, ERP Accounting Controls, Financial Posting Safety

---

### SCENARIO_ID: SCN-AI-001
* **MODULE:** AI
* **MAIN_SECTION:** AI Copilots
* **SUBSECTION:** AI CFO Financial Auditor
* **PAGE_FILES:**
  * `src/app/(dashboard)/ai-cfo/page.tsx`
* **ROUTE_URLS:**
  * `/ai-cfo`
* **API_ROUTES:**
  * `POST /api/ai/cfo/analyze`
* **USER_ROLE:** المدير التنفيذي / مستخدم إداري (Executive Administrator)
* **PERMISSION_REQUIRED:** `view:ai_cfo`
* **PRECONDITIONS:**
  * تسجيل حركات مالية ومصروفات كافية في قاعدة البيانات لـ `tenantId`.
  * تفعيل حرس الأمان للبيانات الحساسة وRAG Tenant Isolation.
* **USER_WORKFLOW_STEPS:**
  1. كتابة سؤال في واجهة CFO المالي (مثال: "أعطني تقريراً بنقاط الصرف غير المبررة للشهر الحالي").
  2. الضغط على زر "تحليل البيانات المالية".
* **EXPECTED_UI_RESULT:** عرض إجابة الوكيل الذكي على هيئة لوحة تحليلية مدعومة برسم بياني للتدفقات وجداول توضيحية.
* **EXPECTED_API_RESULT:**
  * `POST /api/ai/cfo/analyze` يرجع `200 OK` مع نتائج التحليل وقائمة التوصيات المستوردة من محرك RAG.
* **EXPECTED_DB_IMPACT:**
  * `READ_ONLY`
  * إجراء استعلامات مجمعة وقراءات لجداول الحركات المالية لـ `tenantId` دون أي تعديل.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل قيام المستخدم باستعلام مالي حساس عبر الذكاء الاصطناعي.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE`
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED
* **TENANT_ISOLATION_CHECK:** ضمان حتمي لعدم تسريب أي بيانات مالية أو أرقام من مستأجر آخر في مخرجات الوكيل أو سياق RAG (Strict Vector-DB Filtering).
* **RBAC_CHECK:** رفض الدخول لهذه الواجهة لغير المدراء الماليين والتنفيذيين المعتمدين.
* **VALIDATION_CHECK:** التحقق من مطابقة تقرير الذكاء الاصطناعي للأرقام الفعلية المسجلة دفترياً.
* **NEGATIVE_CASES:**
  * محاولة كتابة أسئلة غير مرتبطة بالنظام المالي أو محاولات التلاعب بالنموذج (Prompt Injection).
* **EDGE_CASES:**
  * استعلام البيانات في ظل فترات ترحيل مكثفة وتحديث الأرصدة في نفس اللحظة.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر تحليل البيانات:
    * Expected UI: عرض مؤشر انتظار تفاعلي مع نصوص تهيئة التحليل.
    * Expected API: `POST /api/ai/cfo/analyze`
    * Risk: طول وقت معالجة الـ LLM يسبب timeout للاتصال بالشبكة.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** MEDIUM
* **RISK_LEVEL:** P2
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation, OWASP ASVS

---

### SCENARIO_ID: SCN-CMMS-001
* **MODULE:** Maintenance
* **MAIN_SECTION:** Facilities Management
* **SUBSECTION:** CMMS Preventive Maintenance
* **PAGE_FILES:**
  * `src/app/(dashboard)/maintenance/page.tsx`
* **ROUTE_URLS:**
  * `/maintenance`
* **API_ROUTES:**
  * `POST /api/maintenance/tickets`
* **USER_ROLE:** فني صيانة (Maintenance Technician)
* **PERMISSION_REQUIRED:** `create:maintenance_ticket`
* **PRECONDITIONS:**
  * تسجيل الأصول التشغيلية والمعدات في النظام مع تواريخ الصلاحية وتفاصيل الضمان.
* **USER_WORKFLOW_STEPS:**
  1. تسجيل بلاغ صيانة جديد لمعدة معينة (مثال: تعطل ثلاجة التبريد رقم 3 في فرع الرياض).
  2. تحديد درجة الأهمية (طارئ/عادي) وإضافة تفاصيل الخلل.
  3. الضغط على زر "حفظ وتكليف الفني".
* **EXPECTED_UI_RESULT:** إدراج البلاغ في قائمة مهام فنيي الصيانة الفورية وتوليد إشعار المتابعة.
* **EXPECTED_API_RESULT:**
  * `POST /api/maintenance/tickets` يرجع `201 Created`.
* **EXPECTED_DB_IMPACT:**
  * `WRITE_EXPECTED`
  * إضافة تذكرة صيانة جديدة في جدول `MaintenanceTicket` للـ `tenantId`.
* **EXPECTED_AUDIT_LOG_IMPACT:** تسجيل بلاغ صيانة جديد وتكليف الفني المختار.
* **EXPECTED_FINANCIAL_IMPACT:** `NONE` (في مرحلة الإبلاغ) / `POSTING_RISK` (إذا تم صرف قطع غيار مخزنية أو تكلفة ورشة خارجية لاحقاً).
* **PERIOD_LOCK_CHECK:** NOT_REQUIRED (عند البلاغ)
* **TENANT_ISOLATION_CHECK:** عزل الأصول وتذاكر الصيانة بالكامل للمستأجر الفعلي.
* **RBAC_CHECK:** رفض تكليف فني غير مسجل في نفس فرع ومستأجر المعدة.
* **VALIDATION_CHECK:** التحقق من وجود المعدة في قائمة الأصول النشطة.
* **NEGATIVE_CASES:**
  * محاولة تقديم بلاغ صيانة لمعدة تم تكهينها أو بيعها سابقاً.
* **EDGE_CASES:**
  * تعطل معدة حيوية تؤثر على إنتاج المصنع والتحرك التلقائي لتحويل أمر الصيانة لأمر طارئ فائق الأولوية.
* **BUTTONS_AND_ACTIONS_TO_TEST:**
  * زر حفظ البلاغ:
    * Expected UI: عرض تذكرة الصيانة وتوقيت البدء المتوقع.
    * Expected API: `POST /api/maintenance/tickets`
    * Risk: عدم إرسال التنبيه التلقائي للفني بسبب فشل مزامنة الخادم الخلفي.
* **AUTOMATION_CANDIDATE:** YES
* **SMOKE_PRIORITY:** LOW
* **RISK_LEVEL:** P3
* **REQUIRED_SKILL_GATES:**
  * Node API, Tenant Isolation
