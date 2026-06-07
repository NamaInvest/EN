# سيناريوهات الأمان وفحص السلامة لقاعدة بيانات وجاهزية الاختبار (NAMA_INVEST_ERP_TEST_DB_AND_FINANCE_SAFE_SCENARIOS_AR)

يوثق هذا المستند كافة سيناريوهات العمل للأقسام الرئيسية والفرعية في نظام Nama Invest ERP مع تحديد متطلبات أمان الأتمتة والسلامة المالية وعزل المستأجرين.

---

### SCENARIO_ID: SCN-GL-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entries & Period Close
PAGE_OR_ROUTE: `/accounting/journal/new`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: زر ترحيل (Post Journal)
PRECONDITIONS: أن تكون الفترة المالية مفتوحة، دليل الحسابات مهيأ.
SAFE_TEST_DATA: قيد متوازن بقيمة 1000 ريال (مدين حساب الصندوق، دائن حساب المبيعات).
STEPS:
1. فتح شاشة إدخال قيود اليومية.
2. تعبئة الحسابات والمبالغ المتوازنة وتحديد tenantId.
3. الضغط على زر حفظ وترحيل.
EXPECTED_RESULT: ترحيل القيد بنجاح وتأثيره على الأستاذ العام وتعديل حالة المستند إلى Posted وتجميده.
DB_WRITE_ALLOWED: YES (في بيئة Test DB المعزولة فقط)
FINANCIAL_POSTING_ALLOWED: YES (محاكاة أو معزول فقط، ممنوع ترحيل حقيقي للإنتاج)
TENANT_ISOLATION_REQUIREMENT: إجبارية عزل القيد وخطوطه بالـ tenantId.
RISK_LEVEL: P1 (حرج مالي)
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/finance-isolated-db-smoke.test.ts`
NOTES: يتم التحقق من حظر التعديل أو الحذف بعد الترحيل.

---

### SCENARIO_ID: SCN-GL-002
MAIN_SECTION: General Ledger
SUB_SECTION: Chart of Accounts (COA)
PAGE_OR_ROUTE: `/accounting/coa`
USER_ROLE: مدير مالي (CFO)
BUTTON_OR_ACTION: زر إضافة حساب فرعي (Add Child Account)
PRECONDITIONS: وجود الحسابات الأب الرئيسية (Assets, Liabilities... إلخ) للمستأجر.
SAFE_TEST_DATA: حساب فرعي جديد تحت الأصول المتداولة باسم "ذمم اختبارية".
STEPS:
1. فتح شجرة الحسابات واستعراض الهيكل.
2. الضغط على حساب أب واختيار "إضافة حساب فرعي".
3. تعبئة الاسم والرمز المالي وحفظ.
EXPECTED_RESULT: إدراج الحساب بنجاح وتحديث شجرة الحسابات فوراً.
DB_WRITE_ALLOWED: YES (في بيئة Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل الدليل بالكامل بالـ tenantId.
RISK_LEVEL: P1
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/accounting/coa.test.ts`
NOTES: التحقق من تفرد الرموز المالية للحسابات.

---

### SCENARIO_ID: SCN-BANK-001
MAIN_SECTION: Cash & Banks
SUB_SECTION: Bank Reconciliation
PAGE_OR_ROUTE: `/banks/reconciliation`
USER_ROLE: محاسب خزينة (Treasury Accountant)
BUTTON_OR_ACTION: زر مطابقة وتسوية (Reconcile)
PRECONDITIONS: استيراد كشف حساب بنكي اختبار وحركات بنك مسجلة في النظام.
SAFE_TEST_DATA: كشف بنكي يحتوي حركة بقيمة 500 ريال تطابق قيداً مسجلاً.
STEPS:
1. الدخول لشاشة التسوية البنكية.
2. اختيار البنك الحركات المستوردة.
3. ربط حركة كشف البنك مع القيد المطابق والضغط على تسوية.
EXPECTED_RESULT: تعديل حالة الحركة إلى reconciled وتحديث أرصدة المطابقة البنكية.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل الحركات البنكية للمستأجر الحالي.
RISK_LEVEL: P2
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/accounting/bank-recon.test.ts`
NOTES: لا يسمح بأي اتصال مباشر مع APIs بنكية حقيقية.

---

### SCENARIO_ID: SCN-GL-003
MAIN_SECTION: Accounts Receivable
SUB_SECTION: Dunning Engine V2
PAGE_OR_ROUTE: `/accounting/dunning`
USER_ROLE: مدير ائتمان (Credit Manager)
BUTTON_OR_ACTION: زر تشغيل الجدولة (Run Dunning Engine)
PRECONDITIONS: وجود فواتير مبيعات آجلة ومستحقة متجاوزة لفترة السداد.
SAFE_TEST_DATA: فاتورة مستحقة متأخرة 35 يوماً.
STEPS:
1. تشغيل محرك تحصيل الديون يدوياً أو جدولياً.
2. التحقق من رصد الفواتير المتأخرة وتحديد مستوى الإنذار المناسب.
3. إنشاء مستند إجراء المتابعة.
EXPECTED_RESULT: توليد إخطارات المتابعة وتحديث مستويات المتابعة للفواتير المتأخرة.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: منع تسريب الفواتير بين المستأجرين.
RISK_LEVEL: P2
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/integration/accounting/dunning.test.ts`
NOTES: يجب عمل Mock كامل لخوادم إرسال الرسائل القصيرة والبريد الإلكتروني.

---

### SCENARIO_ID: SCN-POS-001
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Cashier Checkout & Printing
PAGE_OR_ROUTE: `/pos`
USER_ROLE: كاشير (Cashier)
BUTTON_OR_ACTION: زر الدفع النقدي والطباعة (Pay & Print)
PRECONDITIONS: فتح وردية كاشير، وجود سلع مسعرة في المخزن.
SAFE_TEST_DATA: فاتورة بيع سريعة لسلعة اختبارية بقيمة 50 ريال.
STEPS:
1. اختيار السلع وتنزيلها في سلة المبيعات.
2. الضغط على الدفع النقدي وإدخال المبلغ المستلم.
3. إرسال الطلب وحفظ الفاتورة وطباعة الإيصال المالي المبسط.
EXPECTED_RESULT: حفظ الفاتورة بنجاح وتوليد رمز QR الخاص بهيئة الزكاة وحركة سداد الصندوق وتحديث المخزون.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (عبر Test DB ومحاكاة ZATCA)
TENANT_ISOLATION_REQUIREMENT: عزل حركات الكاشير والوردية بالمستأجر.
RISK_LEVEL: P1
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/e2e/pos/checkout.test.ts`
NOTES: لا يتم إجراء أي دفع حقيقي أو اتصال مع بوابات دفع حية مثل Stripe.

---

### SCENARIO_ID: SCN-SAL-002
MAIN_SECTION: Sales Operations
SUB_SECTION: Sales Returns
PAGE_OR_ROUTE: `/sales-returns`
USER_ROLE: موظف مبيعات (Sales Officer)
BUTTON_OR_ACTION: زر ترحيل المرتجع (Post Sales Return)
PRECONDITIONS: وجود فاتورة مبيعات أصلية مرحلة مسبقاً.
SAFE_TEST_DATA: فاتورة أصلية برقم S-INV-100 تحتوي 5 حبات من سلعة اختبارية.
STEPS:
1. اختيار الفاتورة الأصلية المستهدفة بالمرتجع.
2. تحديد كمية المرتجع (حبة واحدة مثلاً).
3. الضغط على ترحيل المرتجع.
EXPECTED_RESULT: إنشاء فاتورة مرتجع مبيعات مرحلة، إرجاع السلع للمخزون، توليد قيد اليومية العكسي للمبيعات وتعديل أرصدة العميل.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول محاسبياً)
TENANT_ISOLATION_REQUIREMENT: إجبارية عزل فواتير المرتجعات بالـ tenantId.
RISK_LEVEL: P1
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/integration/sales/returns.test.ts`
NOTES: فحص منع إرجاع كميات أكبر من الكميات المباعة أصلياً.

---

### SCENARIO_ID: SCN-POS-002
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Restaurant POS & Tables
PAGE_OR_ROUTE: `/restaurant-pos`
USER_ROLE: كابتن صالة (Waiter)
BUTTON_OR_ACTION: زر إرسال الطلب للمطبخ (Send to KOT)
PRECONDITIONS: وردية نشطة، طاولات معرفة في الصالة.
SAFE_TEST_DATA: طاولة رقم 5، طلب وجبة اختبارية بقيمة 30 ريال.
STEPS:
1. اختيار طاولة رقم 5 في لوحة المطعم.
2. إضافة الطلبات وتحديد خيارات الخدمة.
3. الضغط على إرسال للمطبخ للطباعة التلقائية في طابعة التحضير.
EXPECTED_RESULT: طباعة تطلب KOT وتحديث حالة الطاولة إلى مشغولة وتخزين مسودة الطلب.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل صالة المطعم والطلبات بالـ tenantId.
RISK_LEVEL: P2
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/e2e/pos/restaurant.test.ts`
NOTES: يتم محاكاة اتصالات WebSocket للمطعم بشكل كامل.

---

### SCENARIO_ID: SCN-PUR-001
MAIN_SECTION: Procurement
SUB_SECTION: Purchase Orders
PAGE_OR_ROUTE: `/purchase-orders`
USER_ROLE: موظف مشتريات (Purchasing Officer)
BUTTON_OR_ACTION: زر حفظ المسودة (Save PO Draft)
PRECONDITIONS: موردين معرفين في النظام، أصناف مهيئة.
SAFE_TEST_DATA: مورد اختباري، صنف بقيمة 100 ريال مع ضريبة 15%.
STEPS:
1. الدخول لشاشة أمر الشراء.
2. اختيار المورد وتحديد الأصناف والكميات.
3. الضغط على حفظ كمسودة.
EXPECTED_RESULT: حساب الضريبة بشكل صحيح وحفظ المسودة برقم تسلسلي مؤقت وإرجاع 201 Created.
DB_WRITE_ALLOWED: NO (محاكاة كاملة في الاختبارات البرمجية)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل أوامر الشراء لكل مستأجر.
RISK_LEVEL: P2
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-procurement.test.ts`
NOTES: مأتمت بالكامل كعقد API آمن بدون لمس قاعدة البيانات.

---

### SCENARIO_ID: SCN-PUR-002
MAIN_SECTION: Supply Chain
SUB_SECTION: Purchase Returns
PAGE_OR_ROUTE: `/purchase-returns`
USER_ROLE: أمين مخزن (Storekeeper)
BUTTON_OR_ACTION: زر ترحيل المرتجع (Post Purchase Return)
PRECONDITIONS: وجود سند استلام مخزني (GRN) مرحل وصالح.
SAFE_TEST_DATA: صنف مستلم سابقاً بالـ GRN برقم GRN-500.
STEPS:
1. استدعاء مستند الاستلام الأصلي.
2. تعبئة كميات الصنف المرتجع للمورد.
3. الضغط على زر ترحيل مرتجع المشتريات.
EXPECTED_RESULT: تخفيض أرصدة المخزون، عكس القيد المحاسبي للمشتريات وضريبة القيمة المضافة، وتسجيل التزام عكسي على المورد.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول)
TENANT_ISOLATION_REQUIREMENT: عزل مستند المرتجع بالكامل.
RISK_LEVEL: P1
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/integration/purchases/returns.test.ts`
NOTES: التحقق من عدم قبول إرجاع أصناف أكثر مما تم استلامه فعلياً في الـ GRN.

---

### SCENARIO_ID: SCN-INV-001
MAIN_SECTION: Stock Management
SUB_SECTION: Stock Transfers
PAGE_OR_ROUTE: `/stock-transfers`
USER_ROLE: أمين مخزن (Storekeeper)
BUTTON_OR_ACTION: زر ترحيل التحويل (Post Transfer)
PRECONDITIONS: وجود مخزنين مختلفين يحتوي الأول منهما على رصيد صنف كافٍ.
SAFE_TEST_DATA: صنف اختبار بكمية رصيد 10 حبات في مخزن أ، مخزن ب فارغ.
STEPS:
1. فتح شاشة تحويل المخزون.
2. اختيار مخزن أ (المصدر) ومخزن ب (الهدف).
3. إدخال الكمية المراد تحويلها (حبتين) وحفظ القيد وترحيله.
EXPECTED_RESULT: خصم حبتين من رصيد صنف مخزن أ، إضافتهما لمخزن ب، وتوليد القيد المحاسبي لحسابات وسيط نقل المخزون.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول مخزونياً ومحاسبياً)
TENANT_ISOLATION_REQUIREMENT: عزل المخازن وعمليات النقل بالمستأجر الحالي.
RISK_LEVEL: P1
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/integration/inventory/transfers.test.ts`
NOTES: التحقق الصارم من منع التحويل برصيد سالب في حال كانت إعدادات المخزون تمنع البيع بالسالب.

---

### SCENARIO_ID: SCN-INV-002
MAIN_SECTION: Stocktake Operations
SUB_SECTION: Stocktake & Adjustment
PAGE_OR_ROUTE: `/stocktake`
USER_ROLE: مدير مخازن (Inventory Manager)
BUTTON_OR_ACTION: زر اعتماد التسوية (Approve Adjustment)
PRECONDITIONS: مسودة جرد مخزني معبأة بالكميات الفعلية المغايرة للكميات الدفترية.
SAFE_TEST_DATA: عجز بمقدار حبة واحدة في صنف اختبار (الكمية الدفترية 5، الفعلية 4).
STEPS:
1. فتح مستند تسوية الجرد.
2. مراجعة العجز أو الزيادة والتأكد من احتساب فروق التكلفة.
3. الضغط على زر اعتماد وترحيل التسوية.
EXPECTED_RESULT: تعديل الأرصدة الدفترية لتطابق الفعلية، إثبات تكلفة الفاقد/الزيادة في حساب فروق الجرد المقابل في الأستاذ العام وتعديل متوسط التكلفة المتحرك للصنف.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول مالي ومخزني)
TENANT_ISOLATION_REQUIREMENT: عزل الجرد وتسوياته بالـ tenantId.
RISK_LEVEL: P1
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/integration/inventory/adjustments.test.ts`
NOTES: مخاطر التعديل العشوائي على متوسط التكلفة المتحرك يجب معالجتها بقيم اختبار معزولة.

---

### SCENARIO_ID: SCN-HR-001
MAIN_SECTION: Human Resources
SUB_SECTION: Employee Directory & Contracts
PAGE_OR_ROUTE: `/hr/employees`
USER_ROLE: أخصائي موارد بشرية (HR Specialist)
BUTTON_OR_ACTION: زر تحديث العقد (Update Contract)
PRECONDITIONS: موظف معرف في النظام وملف شخصي نشط.
SAFE_TEST_DATA: موظف برقم وظيفي EMP-200.
STEPS:
1. البحث عن ملف الموظف EMP-200.
2. الانتقال لتبويب العقود وإجراء تعديل على المسمى الوظيفي أو الراتب الأساسي.
3. الضغط على حفظ.
EXPECTED_RESULT: حفظ العقد الجديد كنسخة سارية وحفظ القديم في الأرشيف التاريخي وتعديل تفاصيل الراتب في قائمة الرواتب القادمة.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل بيانات الموظفين وعقودهم بالكامل بالـ tenantId.
RISK_LEVEL: P2
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/hr/employees.test.ts`
NOTES: لا يتم حساب الرواتب الحية أو تحديث ملفات التأمينات الاجتماعية الفعلية.

---

### SCENARIO_ID: SCN-COMP-001
MAIN_SECTION: Wages Protection System
SUB_SECTION: Mudad Compliance
PAGE_OR_ROUTE: `/saudi/mudad`
USER_ROLE: محاسب رواتب (Payroll Accountant)
BUTTON_OR_ACTION: زر توليد ملف حماية الأجور (Generate Mudad File)
PRECONDITIONS: مسودة مسيرة رواتب معتمدة ومحتسبة للشهر الحالي للموظفين السعوديين.
SAFE_TEST_DATA: رواتب شهر اختبار مصنفة بالراتب والبدلات والاستقطاعات.
STEPS:
1. الدخول لشاشة حماية الأجور Mudad.
2. اختيار الشهر ومسيرة الرواتب المعنية.
3. الضغط على زر توليد الملف المتوافق مع شروط مدد وحماية الأجور.
EXPECTED_RESULT: توليد ملف XML/TXT متطابق بالكامل مع مواصفات نظام حماية الأجور السعودي وتحميله للاستيراد.
DB_WRITE_ALLOWED: NO (معزول API فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل مسيرات رواتب الموظفين بالمستأجر الحالي.
RISK_LEVEL: P2
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-compliance.test.ts`
NOTES: مأتمت كعقد API للتحقق من هيكل البيانات بدون حفظ حقيقي أو إرسال خارجي.

---

### SCENARIO_ID: SCN-ASST-001
MAIN_SECTION: Fixed Assets
SUB_SECTION: Asset Depreciation
PAGE_OR_ROUTE: `/fixed-assets/depreciation`
USER_ROLE: محاسب أصول (Assets Accountant)
BUTTON_OR_ACTION: زر تشغيل الإهلاك (Run Depreciation)
PRECONDITIONS: أصول رأسمالية مسجلة وتاريخ تشغيلها نشط وخطط إهلاكها محتسبة.
SAFE_TEST_DATA: أصل اختباري بقيمة 10,000 ريال، عمره الإنتاجي 5 سنوات، طريقة القسط الثابت.
STEPS:
1. الدخول لشاشة إهلاك الأصول.
2. اختيار تاريخ المعالجة (نهاية الشهر).
3. تشغيل إهلاك الأصول وحساب الأقساط الشهرية.
EXPECTED_RESULT: توليد قيود إهلاك أصول متوازنة تلقائياً (مدين مصروف إهلاك الأصل، دائن مجمع إهلاك الأصل)، وتحديث القيمة الدفترية للأصل.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: YES (معزول مالي)
TENANT_ISOLATION_REQUIREMENT: عزل الأصول الرأسمالية بالمستأجر الحالي.
RISK_LEVEL: P1
AUTOMATION_STATUS: NEEDS_ISOLATED_TEST_DB
RELATED_TEST_FILE: `tests/integration/fixed-assets/depreciation.test.ts`
NOTES: التحقق من عدم تخطي قيمة مجمع الإهلاك للقيمة القابلة للإهلاك للأصل.

---

### SCENARIO_ID: SCN-APP-001
MAIN_SECTION: Approvals
SUB_SECTION: Document Workflow Approvals
PAGE_OR_ROUTE: `/approvals`
USER_ROLE: مدير معتمد (Approver)
BUTTON_OR_ACTION: زر عرض الطلبات المعلقة (View Pending Approvals)
PRECONDITIONS: وجود طلبات (أمر شراء، طلب إجازة) تنتظر موافقة المستخدم.
SAFE_TEST_DATA: مستند معلق بالمعرف APPROVAL-900.
STEPS:
1. الدخول للوحة اعتمادات المستندات.
2. عرض قائمة الطلبات التي تنتظر موافقة المستخدم الحالي.
EXPECTED_RESULT: إرجاع قائمة الطلبات المعلقة بترميز 200 OK للمستأجر الحالي وتصفيتها حسب الأدوار والصلاحيات.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: منع ظهور اعتمادات مستندات مستأجرين آخرين.
RISK_LEVEL: P2
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-procurement.test.ts`
NOTES: مأتمت كعقد API آمن للتحقق من الاسترجاع السليم.

---

### SCENARIO_ID: SCN-AI-001
MAIN_SECTION: CFO Auditor
SUB_SECTION: AI Financial Insights
PAGE_OR_ROUTE: `/ai-cfo`
USER_ROLE: مدير مالي (CFO)
BUTTON_OR_ACTION: زر استشارة الذكاء الاصطناعي (Get Financial Insights)
PRECONDITIONS: وجود بيانات مالية وأرصدة للحسابات مسجلة للمستأجر.
SAFE_TEST_DATA: بيانات أرصدة عامة ملخصة.
STEPS:
1. الدخول للوحة الاستشارات المالية للـ AI CFO.
2. الضغط على استخراج التحليلات الذكية للأرباح والخسائر.
EXPECTED_RESULT: استدعاء Gemini API محاكاة، وتوليد اقتراحات وتنبيهات مالية وإرجاع البيانات بـ 200 OK.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: منع تضمين أي بيانات تخص مستأجر آخر في طلب الـ LLM.
RISK_LEVEL: P3
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-ai-cfo.test.ts`
NOTES: محاكاة الـ LLM بشكل كامل لمنع استدعاء API حقيقي يسبب تزايد تكلفة الخدمة أثناء الفحص والتطوير.

---

### SCENARIO_ID: SCN-CMMS-001
MAIN_SECTION: Facilities
SUB_SECTION: CMMS Preventive Maintenance
PAGE_OR_ROUTE: `/maintenance`
USER_ROLE: مسؤول صيانة (Maintenance Planner)
BUTTON_OR_ACTION: زر جدولة الصيانة (Schedule PM)
PRECONDITIONS: معدات معرفة في الأصول، وجود خطة صيانة وقائية مجدولة.
SAFE_TEST_DATA: معدة تكييف مركزية.
STEPS:
1. فتح جدول الصيانة الوقائية.
2. اختيار المعدة وتعيين تاريخ الفحص وجدول التكرار وحفظ.
EXPECTED_RESULT: توليد أوامر الصيانة الدورية وتنبيه الفني وتحديث خطة الصيانة.
DB_WRITE_ALLOWED: YES (Test DB فقط)
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل منشآت ومعدات المستأجر الحالي.
RISK_LEVEL: P3
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: `tests/integration/maintenance/pm.test.ts`
NOTES: لا يتم حساب أي تكاليف قطع غيار حية أو فواتير صيانة خارجية حقيقية.

---

### SCENARIO_ID: SCN-SEC-001
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Cross-Tenant Isolation
PAGE_OR_ROUTE: `/api/**`
USER_ROLE: مستأجر خبيث أو متسلل (Malicious Actor)
BUTTON_OR_ACTION: محاولة قراءة بيانات مستأجر آخر (Cross-Tenant Request)
PRECONDITIONS: تسجيل الدخول بصلاحيات مستأجر أ، محاولة جلب مستند تابع لمستأجر ب.
SAFE_TEST_DATA: معرف مستند يتبع لـ tenantId آخر.
STEPS:
1. إرسال طلب API لجلب الفواتير مع تغيير معرف المستأجر في الترويسة أو رابط الطلب.
EXPECTED_RESULT: رفض الطلب بالكامل برمز 401 Unauthorized أو 403 Forbidden، أو تصفية النتائج بحيث ترجع قائمة فارغة.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: عزل تام ومطلق للبيانات.
RISK_LEVEL: P0 (ثغرة أمنية حرجة)
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-security.test.ts`
NOTES: مأتمت بالكامل كبوابة أمان لمنع تسريب البيانات وعزل المستأجرين.

---

### SCENARIO_ID: SCN-SEC-002
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Server Access Control
PAGE_OR_ROUTE: `/api/**`
USER_ROLE: موظف عادي بدون صلاحيات محاسبية
BUTTON_OR_ACTION: محاولة ترحيل قيد يومية (Unauthorized Post Attempt)
PRECONDITIONS: تسجيل الدخول بمستشار صيانة أو كاشير بدون صلاحية `create:journal_entry`.
SAFE_TEST_DATA: طلب ترحيل قيد يومية منسق.
STEPS:
1. إرسال طلب ترحيل قيد يومية إلى `/api/accounting/journal` من حساب غير مصرح له.
EXPECTED_RESULT: رفض الطلب من الخادم فوراً برمز 403 Forbidden ومنع الحفظ.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: إجبارية التحقق من الصلاحيات وربطها بالـ tenantId.
RISK_LEVEL: P0
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-security.test.ts`
NOTES: بوابة الأمان مصممة للتحقق من عزل الصلاحيات ومنع bypass للمسارات البرمجية.

---

### SCENARIO_ID: SCN-PERF-001
MAIN_SECTION: Code Quality & Performance
SUB_SECTION: Sync Blockers Check
PAGE_OR_ROUTE: `src/**`
USER_ROLE: المطور / فحص سلامة البناء
BUTTON_OR_ACTION: فحص كود المشروع (AST Parser Audit)
PRECONDITIONS: ملفات الكود المصدري مهيئة.
SAFE_TEST_DATA: كود تطبيق الخادم.
STEPS:
1. تشغيل أداة التحليل الثابت لقراءة الكود والتحقق من عدم استخدام دوال متزامنة.
EXPECTED_RESULT: تأكيد خلو الكود من معوقات الـ Event Loop مثل `readFileSync` أو `writeFileSync` في مسارات الطلبات.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: لا ينطبق
RISK_LEVEL: P2
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/sync-blockers.test.ts`
NOTES: آمن 100% ويعمل كتحليل هيكلي للتعليمات البرمجية.

---

### SCENARIO_ID: SCN-FIN-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entry Calculation
PAGE_OR_ROUTE: `/api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: إرسال قيد غير متوازن (Post Unbalanced Entry)
PRECONDITIONS: تسجيل الدخول بمحاسب.
SAFE_TEST_DATA: قيد يحتوي خطين مدين بقيمة 100 ريال ودائن بقيمة 90 ريال (غير متوازن).
STEPS:
1. إرسال قيد محاسبي غير متوازن للخادم.
EXPECTED_RESULT: رفض الخادم للطلب فوراً وإرجاع رمز 400 Bad Request مع رسالة خطأ تفيد بعدم توازن القيد.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: التحقق تحت سياق المستأجر.
RISK_LEVEL: P1
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
NOTES: مأتمت كبوابة أمان محاسبية لعقود الـ API.

---

### SCENARIO_ID: SCN-FIN-002
MAIN_SECTION: General Ledger
SUB_SECTION: Posted Journal Entry
PAGE_OR_ROUTE: `/api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: محاولة تعديل قيد مرحل (Modify Posted Entry)
PRECONDITIONS: وجود قيد مرحل مسبقاً حالته Posted.
SAFE_TEST_DATA: معرف القيد المرحل.
STEPS:
1. إرسال طلب PUT لتعديل قيم أو تفاصيل قيد حالته Posted.
EXPECTED_RESULT: رفض الطلب من الخادم فوراً وإرجاع رمز 500 أو 409 لمنع خرق عدم قابلية التعديل للدفاتر المرحلة.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: التحقق تحت سياق المستأجر.
RISK_LEVEL: P1
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
NOTES: قاعدة محاسبية ثابتة لحماية الدفاتر المالية والامتثال.

---

### SCENARIO_ID: SCN-FIN-003
MAIN_SECTION: General Ledger
SUB_SECTION: Closed Period Verification
PAGE_OR_ROUTE: `/api/accounting/journal`
USER_ROLE: محاسب عام (General Accountant)
BUTTON_OR_ACTION: ترحيل في فترة محاسبية مغلقة (Post in Closed Period)
PRECONDITIONS: إغلاق الفترة المالية للربع الأول مثلاً.
SAFE_TEST_DATA: تاريخ حركة يقع في الفترة المحاسبية المغلقة.
STEPS:
1. محاولة إرسال قيد مالي بتاريخ يقع ضمن نطاق فترة محاسبية مغلقة.
EXPECTED_RESULT: رفض الطلب وإرجاع رمز 409 LOCKED أو خطأ منع التعديل في فترة مغلقة.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
TENANT_ISOLATION_REQUIREMENT: التحقق تحت سياق المستأجر.
RISK_LEVEL: P1
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
NOTES: حماية حيوية ضد إفساد الميزانيات المعتمدة والمغلقة سنوياً أو دورياً.
