# دليل سيناريوهات عمل الأقسام الرئيسية والفرعية (NAMA_INVEST_ERP_FULL_MAIN_AND_SUBSECTION_WORK_SCENARIOS_AR)

يوثق هذا الملف سيناريوهات العمل الشاملة لكافة الأقسام والعمليات الحيوية والفرعية في نظام Nama Invest ERP مع تحديد قواعد الأمان والتحكم.

---

### SCENARIO_ID: SCN-GL-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entries & Period Close
PAGE_OR_ROUTE: `/accounting/journal/new`
API_ROUTE: `POST /api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: زر ترحيل قيد (Post Journal)
FORM_FIELDS: التاريخ، الفرع، الحساب المدين، الحساب الدائن، المبلغ المدين، المبلغ الدائن، الوصف
PRECONDITIONS: أن تكون الفترة المالية مفتوحة، دليل الحسابات SoCPA مهيأ.
SAFE_TEST_DATA: قيد متوازن بقيمة 1000 ريال (مدين الصندوق، دائن الإيرادات) تحت tenantId معزول.
STEPS:
1. الدخول لشاشة إدخال القيود وتعبئة البيانات الأساسية وتفاصيل الحسابات المتوازنة.
2. الضغط على زر ترحيل.
3. التحقق من تحول حالة المستند لـ Posted وتجميد جميع الحقول وتأثير القيد على الحسابات.
EXPECTED_RESULT: ترحيل القيد بنجاح وإرجاع رمز 200 OK وتحديث الأرصدة فوراً.
NEGATIVE_CASES: محاولة إرسال قيد غير متوازن يرجع 400 Bad Request، محاولة الكتابة في تاريخ يقع في فترة محاسبية مغلقة يرجع 409 LOCKED.
PERMISSION_RULES: تطلب صلاحية `create:journal_entry`.
TENANT_ISOLATION_REQUIREMENT: عزل القيد وجميع خطوطه بـ tenantId الخاص بالمستأجر.
DB_WRITE_ALLOWED: YES (في بيئة Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (عبر Test DB ومحاكاة مغلّفة، ممنوع على الإنتاج)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: NO
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/finance-isolated-db-smoke.test.ts`
RISK_LEVEL: P1 (مرتفع جداً)
NOTES: التحقق الصارم من توازن القيد حسابياً.

---

### SCENARIO_ID: SCN-GL-002
MAIN_SECTION: General Ledger
SUB_SECTION: Chart of Accounts (COA)
PAGE_OR_ROUTE: `/accounting/coa`
API_ROUTE: `POST /api/accounting/coa`
USER_ROLE: مدير مالي (CFO)
BUTTON_OR_ACTION: زر إضافة حساب فرعي (Add Child Account)
FORM_FIELDS: الرمز المالي، اسم الحساب بالعربي، اسم الحساب بالإنجليزي، النوع (مدين/دائن)، الحساب الأب
PRECONDITIONS: تهيئة المستأجر وتحديد الحسابات الجذرية الخمسة.
SAFE_TEST_DATA: حساب فرعي "ذمم اختبارية" كصنف فرعي للأصول المتداولة.
STEPS:
1. فتح دليل الحسابات والضغط على حساب الأب المعني.
2. اختيار إضافة حساب فرعي وتعبئة الاسم والرمز المالي.
3. الضغط على حفظ والتحقق من إدراج الحساب وتحديث الهيكل الهرمي.
EXPECTED_RESULT: إنشاء الحساب بنجاح وإرجاع 201 Created وتحديث شجرة العرض.
NEGATIVE_CASES: محاولة إدخال رمز مالي مكرر يرجع خطأ تفرد الرمز المالي.
PERMISSION_RULES: تطلب صلاحية `manage:coa`.
TENANT_ISOLATION_REQUIREMENT: عزل تام للشجرة لضمان عدم تسرب هيكلية دليل حسابات لمستأجر آخر.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES (يمكن استخدام Mock لـ Prisma)
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/accounting/coa.test.ts`
RISK_LEVEL: P1
NOTES: التحقق من توافق الحساب الفرعي مع طبيعة حساب الأب.

---

### SCENARIO_ID: SCN-BANK-001
MAIN_SECTION: Cash & Banks
SUB_SECTION: Bank Reconciliation
PAGE_OR_ROUTE: `/treasury/bank-reconciliation`
API_ROUTE: `POST /api/banks/reconcile`
USER_ROLE: محاسب خزينة (Treasury Accountant)
BUTTON_OR_ACTION: زر مطابقة وتسوية (Reconcile)
FORM_FIELDS: معرف حركة كشف الحساب البنكي، معرف قيد الصندوق المقابل
PRECONDITIONS: استيراد كشف الحساب البنكي (CSV/Excel) اختبار وتوافر قيود حركة بنكية في الدفاتر.
SAFE_TEST_DATA: حركة كشف حساب بقيمة 500 ريال تطابق حركة مدفوعات مسجلة في الصندوق.
STEPS:
1. الدخول لشاشة التسوية واختيار الحساب البنكي.
2. ربط حركة كشف البنك مع القيد المطابق بالدفاتر.
3. الضغط على تسوية والتحقق من تحول حالة الحركة لـ reconciled.
EXPECTED_RESULT: تسوية الحركة بنجاح وتحديث أرصدة المطابقة البنكية.
NEGATIVE_CASES: محاولة تسوية مبالغ غير متطابقة ترجع خطأ عدم توازن المبالغ للتسوية.
PERMISSION_RULES: تطلب صلاحية `manage:bank_recon`.
TENANT_ISOLATION_REQUIREMENT: عزل كشوفات الحسابات وحركات التسوية بالمستأجر.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES (للملف المرفوع)
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/accounting/bank-recon.test.ts`
RISK_LEVEL: P2
NOTES: يمنع الاتصال المباشر مع API بنوك حية أثناء الاختبار.

---

### SCENARIO_ID: SCN-GL-003
MAIN_SECTION: Accounts Receivable
SUB_SECTION: Dunning Engine V2
PAGE_OR_ROUTE: `/accounting/dunning`
API_ROUTE: `POST /api/accounting/dunning/run`
USER_ROLE: مدير اائتمان (Credit Manager)
BUTTON_OR_ACTION: زر تشغيل الجدولة (Run Dunning Engine)
FORM_FIELDS: اختيار الفواتير المتأخرة، قواعد المتابعة
PRECONDITIONS: وجود فواتير مبيعات آجلة متجاوزة لتاريخ الاستحقاق.
SAFE_TEST_DATA: فاتورة مبيعات مستحقة بقيمة 5000 ريال متأخرة 30 يوماً.
STEPS:
1. الدخول لشاشة تحصيل الديون وتحديد خيارات تشغيل المحرك.
2. فحص الفواتير المتأخرة المستهدفة وإنشاء مستندات إجراء المتابعة والتنبيه التلقائي.
EXPECTED_RESULT: توليد إخطارات المتابعة وإرسال التنبيهات وتعديل مستوى الإنذار للفاتورة.
NEGATIVE_CASES: محاولة تشغيل محرك تحصيل لفواتير غير مستحقة يرجع قائمة فارغة.
PERMISSION_RULES: تطلب صلاحية `manage:dunning`.
TENANT_ISOLATION_REQUIREMENT: عزل تام للفواتير والعملاء وقواعد المتابعة بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES (إلزامي لمقدمي خدمات الرسائل والبريد)
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/integration/accounting/dunning.test.ts`
RISK_LEVEL: P2
NOTES: يجب عمل Mock كامل لخوادم الرسائل والبريد الإلكتروني لمنع الإرسال لعملاء حقيقيين.

---

### SCENARIO_ID: SCN-POS-001
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Cashier Checkout & Printing
PAGE_OR_ROUTE: `/pos`
API_ROUTE: `POST /api/pos/invoices`
USER_ROLE: كاشير (Cashier)
BUTTON_OR_ACTION: زر الدفع النقدي والطباعة (Pay & Print)
FORM_FIELDS: المنتجات المحددة، المبلغ المدفوع، نوع الدفع، الوردية النشطة
PRECONDITIONS: وردية كاشير نشطة ومفتوحة، أصناف مخزنية مسعرة.
SAFE_TEST_DATA: صنف اختبار بقيمة 100 ريال مع ضريبة القيمة المضافة 15%.
STEPS:
1. اختيار الأصناف وتنزيلها في لوحة المبيعات.
2. اختيار طريقة الدفع النقدي وتعبئة المبلغ.
3. الضغط على زر الدفع والطباعة والتحقق من حفظ الفاتورة وتوليد رمز QR الخاص بالزكاة.
EXPECTED_RESULT: حفظ الفاتورة وإرجاع رمز 201 Created وطباعة الإيصال وتعديل رصيد الصندوق والمخازن.
NEGATIVE_CASES: محاولة الحفظ بدون وردية كاشير نشطة يرجع خطأ وردية مغلقة.
PERMISSION_RULES: تطلب صلاحية `create:pos_invoice`.
TENANT_ISOLATION_REQUIREMENT: عزل حركات الكاشير وفواتير الـ POS بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES (لبوابة الدفع ومحاكاة ZATCA)
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/e2e/pos/checkout.test.ts`
RISK_LEVEL: P1
NOTES: لا يتم ربطها ببوابات دفع Stripe حقيقية.

---

### SCENARIO_ID: SCN-SAL-002
MAIN_SECTION: Sales Operations
SUB_SECTION: Sales Returns
PAGE_OR_ROUTE: `/sales-returns`
API_ROUTE: `POST /api/sales/returns`
USER_ROLE: موظف مبيعات (Sales Officer)
BUTTON_OR_ACTION: زر ترحيل المرتجع (Post Sales Return)
FORM_FIELDS: الفاتورة الأصلية المستهدفة، كمية الصنف المسترجع، سبب المرتجع
PRECONDITIONS: وجود فاتورة مبيعات أصلية مرحلة وصالحة في النظام.
SAFE_TEST_DATA: فاتورة مبيعات مرحلة تحتوي صنف اختبار بكمية 10 حبات.
STEPS:
1. تحديد الفاتورة الأصلية.
2. تعبئة الكمية المرتجعة (حبة واحدة).
3. الضغط على زر ترحيل مرتجع المبيعات.
EXPECTED_RESULT: توليد فاتورة مرتجع مرحلة، إرجاع الصنف للمخزن، وعكس قيد المبيعات والVAT المقابل.
NEGATIVE_CASES: محاولة إرجاع كميات أكبر من الكمية المباعة أصلياً يرجع خطأ تجاوز الكمية.
PERMISSION_RULES: تطلب صلاحية `create:sales_return`.
TENANT_ISOLATION_REQUIREMENT: عزل مستند المرتجع بالكامل بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: NO
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/integration/sales/returns.test.ts`
RISK_LEVEL: P1
NOTES: التحقق من عدم تخطي قيمة الفاتورة الأصلية.

---

### SCENARIO_ID: SCN-POS-002
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Restaurant POS & Tables
PAGE_OR_ROUTE: `/v3/restaurant/tables`
API_ROUTE: `POST /api/restaurant/orders`
USER_ROLE: كابتن صالة (Waiter)
BUTTON_OR_ACTION: زر إرسال الطلب للمطبخ (Send to KOT)
FORM_FIELDS: رقم الطاولة، الوجبات المطلوبة، الملاحظات الخاصة للتحضير
PRECONDITIONS: فتح وردية الصالة للمطعم، طاولات معرفة في النظام.
SAFE_TEST_DATA: طاولة رقم 4، طلب وجبة اختبارية بقيمة 40 ريال.
STEPS:
1. اختيار طاولة رقم 4 من شاشة لوحة الصالة.
2. إضافة الوجبات المطلوبة.
3. الضغط على زر إرسال للمطبخ والتحقق من حفظ مسودة الطلب وتحديث حالة الطاولة لـ busy.
EXPECTED_RESULT: حفظ الطلب وإرجاع رمز 201 Created وطباعة KOT في طابعة التحضير.
NEGATIVE_CASES: محاولة إرسال طلب لطاولة غير شاغرة بدون دمج يرجع خطأ طاولة مشغولة.
PERMISSION_RULES: تطلب صلاحية `create:restaurant_order`.
TENANT_ISOLATION_REQUIREMENT: عزل صالة المطعم والطلبات بالمستأجر الحالي.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES (لاتصالات الويب سوكيت)
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/e2e/pos/restaurant.test.ts`
RISK_LEVEL: P2
NOTES: محاكاة اتصالات وطابعات التحضير بشكل كامل.

---

### SCENARIO_ID: SCN-PUR-001
MAIN_SECTION: Procurement
SUB_SECTION: Purchase Orders
PAGE_OR_ROUTE: `/sales/orders/create`
API_ROUTE: `POST /api/purchases/orders`
USER_ROLE: موظف مشتريات (Purchasing Officer)
BUTTON_OR_ACTION: زر حفظ كمسودة (Save PO Draft)
FORM_FIELDS: المورد، الأصناف، الكميات، أسعار الشراء، معدل الضريبة 15%
PRECONDITIONS: موردين معرفين، أصناف مهيئة في دليل المخازن.
SAFE_TEST_DATA: مورد اختبار وصنف اختبار بقيمة 100 ريال مع ضريبة 15%.
STEPS:
1. الدخول لشاشة أمر الشراء واختيار المورد والأصناف والكمية.
2. الضغط على زر حفظ كمسودة.
3. التحقق من احتساب إجمالي الفاتورة والضريبة بشكل صحيح وحفظ المستند كمسودة برقم مؤقت.
EXPECTED_RESULT: حفظ المسودة وإرجاع كود 201 Created مع تفاصيل المستند.
NEGATIVE_CASES: محاولة الحفظ بدون اختيار مورد أو بدون إدخال بنود يرجع خطأ تحقق البيانات 400.
PERMISSION_RULES: تطلب صلاحية `create:purchase_order`.
TENANT_ISOLATION_REQUIREMENT: عزل أوامر الشراء لكل مستأجر بالـ tenantId.
DB_WRITE_ALLOWED: NO (محاكاة كاملة في الاختبارات)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-procurement.test.ts`
RISK_LEVEL: P2
NOTES: مأتمت كعقد API آمن للتحقق من صحة الحقول واحتساب الضرائب.

---

### SCENARIO_ID: SCN-PUR-002
MAIN_SECTION: Supply Chain
SUB_SECTION: Purchase Returns
PAGE_OR_ROUTE: `/purchase-returns`
API_ROUTE: `POST /api/purchases/returns`
USER_ROLE: أمين مخزن (Storekeeper)
BUTTON_OR_ACTION: زر ترحيل المرتجع للمورد
FORM_FIELDS: سند الاستلام المخزني الأصلي (GRN)، الكميات المسترجعة، المورد
PRECONDITIONS: وجود مستند استلام مخزني (GRN) مرحل ومثبت مسبقاً.
SAFE_TEST_DATA: سند استلام مخزني يحتوي صنف اختبار بكمية 20 حبة.
STEPS:
1. اختيار سند الاستلام المخزني الأصلي وتعبئة الكميات المراد إرجاعها للمورد.
2. الضغط على زر ترحيل مرتجع المشتريات.
3. التحقق من خصم رصيد المخزن وعكس قيد مديونية المورد وقيد الضريبة المقابل.
EXPECTED_RESULT: ترحيل المستند وإرجاع 200 OK وتحديث الأرصدة المخزنية والمالية.
NEGATIVE_CASES: محاولة إرجاع كمية أكبر مما تم استلامه في الـ GRN يرجع خطأ تجاوز الكمية.
PERMISSION_RULES: تطلب صلاحية `create:purchase_return`.
TENANT_ISOLATION_REQUIREMENT: عزل مستند المرتجع بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: NO
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/integration/purchases/returns.test.ts`
RISK_LEVEL: P1
NOTES: حماية قيود المخازن والتكلفة المتوسطة المتحركة للأصناف.

---

### SCENARIO_ID: SCN-INV-001
MAIN_SECTION: Stock Management
SUB_SECTION: Stock Transfers
PAGE_OR_ROUTE: `/stock-transfers`
API_ROUTE: `POST /api/inventory/transfers`
USER_ROLE: أمين مخزن (Storekeeper)
BUTTON_OR_ACTION: زر ترحيل التحويل (Post Transfer)
FORM_FIELDS: مخزن المصدر، مخزن الهدف، أصناف التحويل، الكميات
PRECONDITIONS: وجود مخزنين مختلفين يحتوي الأول منهما على رصيد صنف كافٍ.
SAFE_TEST_DATA: صنف اختبار برصيد 10 حبات في مخزن أ، مخزن ب فارغ.
STEPS:
1. اختيار مخزن أ كمصدر ومخزن ب كهدف وإضافة الكمية المراد نقلها (حبتين).
2. الضغط على زر ترحيل التحويل المخزني.
3. التحقق من خصم حبتين من مخزن أ وإضافتهما لمخزن ب وتوليد القيد المحاسبي لحساب وسيط نقل المخزون.
EXPECTED_RESULT: ترحيل مستند النقل وتعديل أرصدة المخازن وإرجاع 200 OK.
NEGATIVE_CASES: محاولة النقل بكمية أكبر من الرصيد المتوفر ومخالفة إعدادات عدم البيع بالسالب يرجع خطأ رصيد غير كافٍ.
PERMISSION_RULES: تطلب صلاحية `create:stock_transfer`.
TENANT_ISOLATION_REQUIREMENT: عزل المخازن والمستند بالـ tenantId لضمان عدم تسريب مستندات مستأجر آخر.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول مخزني ومحاسبي)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: NO
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/integration/inventory/transfers.test.ts`
RISK_LEVEL: P1
NOTES: التحقق من صحة متوسط تكلفة الصنف المحول في كلا المخزنين.

---

### SCENARIO_ID: SCN-INV-002
MAIN_SECTION: Stocktake Operations
SUB_SECTION: Stocktake & Adjustment
PAGE_OR_ROUTE: `/stocktake`
API_ROUTE: `POST /api/inventory/adjustments`
USER_ROLE: مدير مخازن (Inventory Manager)
BUTTON_OR_ACTION: زر اعتماد التسوية (Approve Adjustment)
FORM_FIELDS: مسودة الجرد المعبأة، الكميات الدفترية، الكميات الفعلية، حساب فروق الجرد المقابل
PRECONDITIONS: وجود مسودة جرد مخزني معبأة بالكميات الفعلية المغايرة للمخزون الدفتري.
SAFE_TEST_DATA: عجز بمقدار حبة واحدة في صنف اختبار (الكمية الدفترية 5، الفعلية 4).
STEPS:
1. مراجعة فروق الجرد واحتساب قيمة العجز المالي.
2. الضغط على زر ترحيل واعتماد التسوية المخزنية.
3. التحقق من تعديل الأرصدة الدفترية لتطابق الكمية الفعلية وتوليد قيد فروق التكلفة وحساب مجمع خسائر الجرد.
EXPECTED_RESULT: ترحيل التسوية وتحديث الأرصدة وقيمة التكلفة وإرجاع 200 OK.
NEGATIVE_CASES: محاولة اعتماد تسوية بدون تحديد حساب المقابلة المحاسبي يرجع خطأ تحقق البيانات.
PERMISSION_RULES: تطلب صلاحية `manage:stocktake`.
TENANT_ISOLATION_REQUIREMENT: عزل تسويات الجرد بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: NO
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/integration/inventory/adjustments.test.ts`
RISK_LEVEL: P1
NOTES: حماية حسابات متوسط التكلفة وحركات الجرد.

---

### SCENARIO_ID: SCN-HR-001
MAIN_SECTION: Human Resources
SUB_SECTION: Employee Directory & Contracts
PAGE_OR_ROUTE: `/hr/employees`
API_ROUTE: `PUT /api/hr/contracts`
USER_ROLE: أخصائي موارد بشرية (HR Specialist)
BUTTON_OR_ACTION: زر تحديث العقد (Update Contract)
FORM_FIELDS: الموظف، المسمى الوظيفي، الراتب الأساسي، البدلات، تاريخ سريان العقد
PRECONDITIONS: موظف معرف في النظام وله ملف شخصي نشط.
SAFE_TEST_DATA: ملف موظف برقم وظيفي EMP-200.
STEPS:
1. البحث عن الموظف والدخول لملفه الشخصي.
2. تعديل تفاصيل العقد (الراتب الأساسي أو البدلات) والضغط على حفظ.
3. التحقق من حفظ العقد الجديد كنسخة سارية وحفظ القديم في الأرشيف التاريخي وتعديل قائمة مسيرة الرواتب القادمة.
EXPECTED_RESULT: تحديث بيانات الموظف والعقد بنجاح وإرجاع 200 OK.
NEGATIVE_CASES: محاولة إدخال راتب بالسالب أو تاريخ سريان يسبق تاريخ مباشرة العمل يرجع خطأ تحقق 400.
PERMISSION_RULES: تطلب صلاحية `manage:employee_contracts`.
TENANT_ISOLATION_REQUIREMENT: عزل بيانات الموظفين وعقودهم بالكامل بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/hr/employees.test.ts`
RISK_LEVEL: P2
NOTES: يتم التحقق من عزل البيانات بالكامل لمنع تسريب الموظفين.

---

### SCENARIO_ID: SCN-COMP-001
MAIN_SECTION: Wages Protection System
SUB_SECTION: Mudad Compliance
PAGE_OR_ROUTE: `/saudi/mudad`
API_ROUTE: `GET /api/hr/payroll/mudad-file`
USER_ROLE: محاسب رواتب (Payroll Accountant)
BUTTON_OR_ACTION: زر توليد ملف حماية الأجور (Generate Mudad File)
FORM_FIELDS: الشهر المستهدف، مسيرة الرواتب المعتمدة
PRECONDITIONS: اعتماد مسيرة رواتب الشهر الحالي واحتساب كافة البدلات والاستقطاعات والموظفين المسجلين في التأمينات.
SAFE_TEST_DATA: مسيرة رواتب معتمدة اختبارية.
STEPS:
1. تحديد الشهر ومسيرة الرواتب.
2. الضغط على زر توليد ملف حماية الأجور.
3. تنزيل الملف والتحقق من تطابقه البرمجي مع هيكل ملف مدد والمواصفات السعودية لحماية الأجور.
EXPECTED_RESULT: توليد الملف متوافقاً بالكامل وإرجاع كود 200 OK.
NEGATIVE_CASES: محاولة توليد ملف لمسيرة رواتب غير معتمدة أو تحتوي أخطاء هيكلية يرجع خطأ 400.
PERMISSION_RULES: تطلب صلاحية `manage:wps`.
TENANT_ISOLATION_REQUIREMENT: عزل مسيرة الرواتب وملفات مدد بالـ tenantId.
DB_WRITE_ALLOWED: NO (معزول API)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-compliance.test.ts`
RISK_LEVEL: P2
NOTES: مأتمت كعقد API للتحقق من هيكل البيانات بدون حفظ حقيقي أو إرسال لجهة خارجية.

---

### SCENARIO_ID: SCN-ASST-001
MAIN_SECTION: Fixed Assets
SUB_SECTION: Asset Depreciation
PAGE_OR_ROUTE: `/fixed-assets/depreciation`
API_ROUTE: `POST /api/fixed-assets/depreciate`
USER_ROLE: محاسب أصول (Assets Accountant)
BUTTON_OR_ACTION: زر تشغيل الإهلاك (Run Depreciation)
FORM_FIELDS: تاريخ معالجة الإهلاك، تصنيفات الأصول المستهدفة
PRECONDITIONS: تسجيل أصل رأسمالي وتاريخ تشغيله نشط وخطط إهلاكه محتسبة.
SAFE_TEST_DATA: أصل اختباري بقيمة 10000 ريال، عمر إنتاجي 5 سنوات، إهلاك قسط ثابت.
STEPS:
1. اختيار تاريخ المعالجة (نهاية الشهر).
2. الضغط على تشغيل إهلاك الأصول.
3. التحقق من توليد قيود إهلاك الأصول متوازنة تلقائياً وتحديث مجمع الإهلاك والقيمة الدفترية للأصل.
EXPECTED_RESULT: توليد القيود بنجاح وتحديث الأصول وإرجاع 200 OK.
NEGATIVE_CASES: محاولة إهلاك أصول خارج تاريخ سريانها أو أصول تم إهلاكها بالكامل يرجع خطأ معالجة 400.
PERMISSION_RULES: تطلب صلاحية `manage:assets_depreciation`.
TENANT_ISOLATION_REQUIREMENT: عزل الأصول والقيود بالـ tenantId.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول مالي)
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: NO
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
RELATED_TEST_FILE: `tests/integration/fixed-assets/depreciation.test.ts`
RISK_LEVEL: P1
NOTES: يتم التحقق من عدم تخطي مجمع الإهلاك لقيمة الأصل الكلية.

---

### SCENARIO_ID: SCN-APP-001
MAIN_SECTION: Document Approvals
SUB_SECTION: Document Workflow Approvals
PAGE_OR_ROUTE: `/approvals`
API_ROUTE: `GET /api/approvals/pending`
USER_ROLE: مدير معتمد (Approver)
BUTTON_OR_ACTION: زر عرض الطلبات المعلقة (View Pending Approvals)
FORM_FIELDS: None
PRECONDITIONS: وجود طلبات موافقة (أمر شراء، إجازة) تنتظر اعتماد المستخدم الحالي.
SAFE_TEST_DATA: مستند معلق بالمعرف APPROVAL-900.
STEPS:
1. الدخول لشاشة الموافقات المعلقة.
2. التحقق من قائمة الطلبات التي تنتظر موافقة المستخدم الحالي وتصفيتها بالـ tenantId.
EXPECTED_RESULT: إرجاع قائمة الموافقات المعلقة بترميز 200 OK وتصفيتها وفقاً للأدوار.
NEGATIVE_CASES: محاولة جلب الموافقات بدون مصادقة يرجع 401 Unauthorized.
PERMISSION_RULES: تطلب صلاحية `view:approvals`.
TENANT_ISOLATION_REQUIREMENT: منع تسريب الموافقات والمستندات بين المستأجرين.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-procurement.test.ts`
RISK_LEVEL: P2
NOTES: مأتمت كعقد API آمن للتحقق من التصفية والفرز.

---

### SCENARIO_ID: SCN-AI-001
MAIN_SECTION: AI Copilots
SUB_SECTION: AI CFO Financial Auditor
PAGE_OR_ROUTE: `/ai-cfo`
API_ROUTE: `POST /api/ai/cfo-insights`
USER_ROLE: مدير مالي (CFO)
BUTTON_OR_ACTION: زر استشارة الذكاء الاصطناعي (Get Financial Insights)
FORM_FIELDS: المعاملات المالية، الحسابات الملخصة
PRECONDITIONS: وجود أرصدة وحركات مالية مسجلة للمستأجر الحالي.
SAFE_TEST_DATA: ملخص حركات وأرصدة الدليل المالي.
STEPS:
1. الدخول للوحة الـ AI CFO والضغط على استخراج تحليلات الأرباح والخسائر.
2. التحقق من محاكاة الطلب وإرجاع الاقتراحات المالية والتحذيرات بـ 200 OK.
EXPECTED_RESULT: إرجاع النص التحليلي وتوصيات CFO بنجاح.
NEGATIVE_CASES: محاولة استدعاء التحليلات بدون ترويسة المصادقة يرجع 401.
PERMISSION_RULES: تطلب صلاحية `view:ai_insights`.
TENANT_ISOLATION_REQUIREMENT: منع إدراج أي بيانات تخص مستأجرين آخرين في مدخلات الـ LLM.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-ai-cfo.test.ts`
RISK_LEVEL: P3
NOTES: محاكاة الـ LLM بشكل كامل لمنع استدعاء API حقيقي يسبب تزايد تكلفة الخدمة أثناء الفحص والتطوير.

---

### SCENARIO_ID: SCN-CMMS-001
MAIN_SECTION: Facilities
SUB_SECTION: CMMS Preventive Maintenance
PAGE_OR_ROUTE: `/maintenance`
API_ROUTE: `POST /api/maintenance/schedule`
USER_ROLE: مسؤول صيانة (Maintenance Planner)
BUTTON_OR_ACTION: زر جدولة الصيانة (Schedule PM)
FORM_FIELDS: المعدة، خطة الصيانة الوقائية، جدول التكرار، تاريخ الفحص
PRECONDITIONS: تسجيل المعدات والأصول الرأسمالية في النظام.
SAFE_TEST_DATA: معدة تكييف اختبارية.
STEPS:
1. فتح جدول الصيانة واختيار المعدة.
2. تعيين خيارات التكرار وتاريخ الفحص وحفظ.
3. التحقق من توليد أوامر الصيانة الدورية وتنبيه الفني وتحديث حالة المعدة وجدول العمل الوقائي.
EXPECTED_RESULT: حفظ الجدول بنجاح وتوليد أوامر العمل المقابلة وإرجاع 201 Created.
NEGATIVE_CASES: محاولة حفظ خطة صيانة بدون اختيار معدة يرجع خطأ تحقق 400.
PERMISSION_RULES: تطلب صلاحية `manage:maintenance`.
TENANT_ISOLATION_REQUIREMENT: عزل منشآت ومعدات المستأجر الحالي.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: YES
MOCK_ALLOWED: YES
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/maintenance/pm.test.ts`
RISK_LEVEL: P3
NOTES: لا يتم حساب أي تكاليف قطع غيار حية أو فواتير صيانة.

---

### SCENARIO_ID: SCN-SEC-001
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Cross-Tenant Isolation
PAGE_OR_ROUTE: `/api/**`
API_ROUTE: `/api/**`
USER_ROLE: مستأجر خبيث أو متسلل (Malicious Actor)
BUTTON_OR_ACTION: محاولة قراءة بيانات مستأجر آخر (Cross-Tenant Request)
FORM_FIELDS: None
PRECONDITIONS: تسجيل الدخول بصلاحيات مستأجر أ، محاولة جلب مستند تابع لمستأجر ب.
SAFE_TEST_DATA: معرف مستند يتبع لـ tenantId آخر.
STEPS:
1. إرسال طلب API لجلب الفواتير مع تغيير معرف المستأجر في الترويسة أو رابط الطلب.
EXPECTED_RESULT: رفض الطلب بالكامل برمز 401 Unauthorized أو 403 Forbidden، أو تصفية النتائج بحيث ترجع قائمة فارغة.
NEGATIVE_CASES: محاولة الوصول للـ API بدون مصادقة ترجع 401.
PERMISSION_RULES: تطلب مصادقة صالحة للـ tenant المعني.
TENANT_ISOLATION_REQUIREMENT: عزل تام ومطلق للبيانات.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-security.test.ts`
RISK_LEVEL: P0 (ثغرة أمنية حرجة)
NOTES: مأتمت بالكامل كبوابة أمان لمنع تسريب البيانات وعزل المستأجرين.

---

### SCENARIO_ID: SCN-SEC-002
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Server Access Control
PAGE_OR_ROUTE: `/api/**`
API_ROUTE: `/api/**`
USER_ROLE: موظف عادي بدون صلاحيات محاسبية
BUTTON_OR_ACTION: محاولة ترحيل قيد يومية (Unauthorized Post Attempt)
FORM_FIELDS: None
PRECONDITIONS: تسجيل الدخول بمستشار صيانة أو كاشير بدون صلاحية `create:journal_entry`.
SAFE_TEST_DATA: طلب ترحيل قيد يومية منسق.
STEPS:
1. إرسال طلب ترحيل قيد يومية إلى `/api/accounting/journal` من حساب غير مصرح له.
EXPECTED_RESULT: رفض الطلب من الخادم فوراً برمز 403 Forbidden ومنع الحفظ.
NEGATIVE_CASES: محاولة إرسال الطلب بصلاحيات غير كاملة ترجع 403.
PERMISSION_RULES: تطلب التحقق من صلاحيات الأدوار وربطها بالـ tenantId.
TENANT_ISOLATION_REQUIREMENT: إجبارية التحقق من الصلاحيات تحت سياق المستأجر.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-security.test.ts`
RISK_LEVEL: P0
NOTES: بوابة الأمان مصممة للتحقق من عزل الصلاحيات ومنع bypass للمسارات البرمجية.

---

### SCENARIO_ID: SCN-PERF-001
MAIN_SECTION: Code Quality & Performance
SUB_SECTION: Sync Blockers Check
PAGE_OR_ROUTE: `src/**`
API_ROUTE: None
USER_ROLE: المطور / فحص سلامة البناء
BUTTON_OR_ACTION: فحص كود المشروع (AST Parser Audit)
FORM_FIELDS: None
PRECONDITIONS: ملفات الكود المصدري مهيئة.
SAFE_TEST_DATA: كود تطبيق الخادم.
STEPS:
1. تشغيل أداة التحليل الثابت لقراءة الكود والتحقق من عدم استخدام دوال متزامنة.
EXPECTED_RESULT: تأكيد خلو الكود من معوقات الـ Event Loop مثل `readFileSync` أو `writeFileSync` في مسارات الطلبات.
NEGATIVE_CASES: وجود دالة متزامنة في مسار طلب يرجع فشل الفحص البرمجي.
PERMISSION_RULES: فحص برمجي للمطورين.
TENANT_ISOLATION_REQUIREMENT: لا ينطبق
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: NO
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/sync-blockers.test.ts`
RISK_LEVEL: P2
NOTES: فحص نحوي استاتيكي آمن 100%.

---

### SCENARIO_ID: SCN-FIN-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entry Calculation
PAGE_OR_ROUTE: `/api/accounting/journal`
API_ROUTE: `/api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: إرسال قيد غير متوازن (Post Unbalanced Entry)
FORM_FIELDS: المدين، الدائن، المبالغ
PRECONDITIONS: تسجيل الدخول بمحاسب.
SAFE_TEST_DATA: قيد يحتوي خطين مدين بقيمة 100 ريال ودائن بقيمة 90 ريال (غير متوازن).
STEPS:
1. إرسال قيد محاسبي غير متوازن للخادم.
EXPECTED_RESULT: رفض الخادم للطلب فوراً وإرجاع رمز 400 Bad Request مع رسالة خطأ تفيد بعدم توازن القيد.
NEGATIVE_CASES: عدم تطابق المدين مع الدائن يرجع 400.
PERMISSION_RULES: تطلب صلاحية `create:journal_entry`.
TENANT_ISOLATION_REQUIREMENT: التحقق تحت سياق المستأجر.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
RISK_LEVEL: P1
NOTES: مأتمت كبوابة أمان محاسبية لعقود الـ API.

---

### SCENARIO_ID: SCN-FIN-002
MAIN_SECTION: General Ledger
SUB_SECTION: Posted Journal Entry
PAGE_OR_ROUTE: `/api/accounting/journal`
API_ROUTE: `/api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: محاولة تعديل قيد مرحل (Modify Posted Entry)
FORM_FIELDS: معرف القيد
PRECONDITIONS: وجود قيد مرحل مسبقاً حالته Posted.
SAFE_TEST_DATA: معرف القيد المرحل.
STEPS:
1. إرسال طلب PUT لتعديل قيم أو تفاصيل قيد حالته Posted.
EXPECTED_RESULT: رفض الطلب من الخادم فوراً وإرجاع رمز 500 أو 409 لمنع خرق عدم قابلية التعديل للدفاتر المرحلة.
NEGATIVE_CASES: محاولة تعديل قيد Posted يرجع خطأ تجميد الدفاتر.
PERMISSION_RULES: تطلب صلاحية `manage:journal_entry`.
TENANT_ISOLATION_REQUIREMENT: التحقق تحت سياق المستأجر.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
RISK_LEVEL: P1
NOTES: قاعدة محاسبية ثابتة لحماية الدفاتر المالية والامتثال.

---

### SCENARIO_ID: SCN-FIN-003
MAIN_SECTION: General Ledger
SUB_SECTION: Closed Period Verification
PAGE_OR_ROUTE: `/api/accounting/journal`
API_ROUTE: `/api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: ترحيل في فترة محاسبية مغلقة (Post in Closed Period)
FORM_FIELDS: تاريخ الحركة، المبالغ
PRECONDITIONS: إغلاق الفترة المالية للربع الأول مثلاً.
SAFE_TEST_DATA: تاريخ حركة يقع في الفترة المحاسبية المغلقة.
STEPS:
1. محاولة إرسال قيد مالي بتاريخ يقع ضمن نطاق فترة محاسبية مغلقة.
EXPECTED_RESULT: رفض الطلب وإرجاع رمز 409 LOCKED أو خطأ منع التعديل في فترة مغلقة.
NEGATIVE_CASES: محاولة إرسال حركة في تاريخ مغلق يرجع 409.
PERMISSION_RULES: تطلب صلاحية `create:journal_entry`.
TENANT_ISOLATION_REQUIREMENT: التحقق تحت سياق المستأجر.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: NO
TEST_DB_REQUIRED: NO
MOCK_ALLOWED: YES
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
RISK_LEVEL: P1
NOTES: حماية حيوية ضد إفساد الميزانيات المعتمدة والمغلقة سنوياً أو دورياً.
