# جرد الأقسام الرئيسية والفرعية للنظام (NAMA_INVEST_ERP_MAIN_SUBSECTION_INVENTORY_AR)

يوثق هذا المستند الجرد التفني والتشغيلي الشامل لكافة مكونات نظام Nama Invest ERP وصلاحياتها ونطاق أمانها.

---

### SCENARIO_ID: SCN-GL-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entries & Period Close
PAGE_PATH: `/accounting/journal/new`
API_ROUTE: `POST /api/accounting/journal`
COMPONENTS: `JournalForm`, `JournalLinesTable`
BUTTONS: زر ترحيل قيد، زر حفظ كمسودة
FORMS: نموذج تفاصيل قيد اليومية
LINKS: `/accounting/journal`
ACTIONS: ترحيل القيد المحاسبي وحساب التأثير المالي
EXPECTED_USER_ROLES: محاسب عام (General Accountant)، مدير مالي
PERMISSION_REQUIREMENTS: `create:journal_entry`
DB_WRITE_RISK: YES (كتابة قيود محاسبية وخطوط قيود)
FINANCIAL_RISK: YES (ترحيل مباشر لدفاتر الأستاذ العام)
TENANT_RISK: YES (يتطلب عزل tenantId لمنع الخلط المالي)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1 (مرتفع جداً)
HAS_SCENARIO: YES
SCENARIO_ID: SCN-GL-001
HAS_TEST: YES
TEST_FILE: `tests/finance-isolated-db-smoke.test.ts`
NOTES: يتم فحصه في بيئة اختبار معزولة فقط.

---

### SCENARIO_ID: SCN-GL-002
MAIN_SECTION: General Ledger
SUB_SECTION: Chart of Accounts (COA)
PAGE_PATH: `/accounting/coa`
API_ROUTE: `POST /api/accounting/coa`
COMPONENTS: `COATreeView`, `AccountModal`
BUTTONS: زر إضافة حساب فرعي، زر تعديل حساب
FORMS: نموذج حساب جديد (الرمز المالي، الاسم، النوع، الأب)
LINKS: None
ACTIONS: حفظ الحساب الجديد وتحديث الشجرة
EXPECTED_USER_ROLES: مدير مالي (CFO)، مسؤول النظام
PERMISSION_REQUIREMENTS: `manage:coa`
DB_WRITE_RISK: YES (إضافة أسطر حسابات جديدة)
FINANCIAL_RISK: NO (لا يمثل ترحيل أرقام، بل بناء هيكل)
TENANT_RISK: YES (عزل هيكل دليل الحسابات بالكامل)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-GL-002
HAS_TEST: YES
TEST_FILE: `tests/integration/accounting/coa.test.ts`
NOTES: التحقق من تفرد الرموز المالية.

---

### SCENARIO_ID: SCN-BANK-001
MAIN_SECTION: Cash & Banks
SUB_SECTION: Bank Reconciliation
PAGE_PATH: `/treasury/bank-reconciliation`
API_ROUTE: `POST /api/banks/reconcile`
COMPONENTS: `BankStatementUploader`, `ReconciliationGrid`
BUTTONS: زر رفع ملف كشف الحساب، زر مطابقة وتسوية
FORMS: نموذج رفع ملف كشف الحساب البنكي
LINKS: `/treasury/checks`
ACTIONS: مطابقة حركات البنك والتحقق حسابياً
EXPECTED_USER_ROLES: محاسب خزينة (Treasury Accountant)
PERMISSION_REQUIREMENTS: `manage:bank_recon`
DB_WRITE_RISK: YES (تعديل حالة الحركة إلى reconciled)
FINANCIAL_RISK: NO (مطابقة تسوية فقط)
TENANT_RISK: YES (عزل حركات المطابقة)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-BANK-001
HAS_TEST: YES
TEST_FILE: `tests/integration/accounting/bank-recon.test.ts`
NOTES: لا يسمح بأي اتصال مع APIs بنكية حقيقية.

---

### SCENARIO_ID: SCN-GL-003
MAIN_SECTION: Accounts Receivable
SUB_SECTION: Dunning Engine V2
PAGE_PATH: `/accounting/dunning`
API_ROUTE: `POST /api/accounting/dunning/run`
COMPONENTS: `DunningDashboard`, `DunningRulesForm`
BUTTONS: زر تشغيل محرك المتابعة
FORMS: نموذج إعداد وتعديل قواعد المتابعة
LINKS: None
ACTIONS: تشغيل الجدولة وإصدار تنبيهات المتابعة وفواتير الفوائد
EXPECTED_USER_ROLES: مدير ائتمان (Credit Manager)
PERMISSION_REQUIREMENTS: `manage:dunning`
DB_WRITE_RISK: YES (تسجيل حركات المتابعة)
FINANCIAL_RISK: YES (توليد فواتير فوائد المتابعة المحتسبة)
TENANT_RISK: YES (عزل فواتير المتابعة)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-GL-003
HAS_TEST: YES
TEST_FILE: `tests/integration/accounting/dunning.test.ts`
NOTES: عمل Mock لخوادم الرسائل والبريد.

---

### SCENARIO_ID: SCN-POS-001
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Cashier Checkout & Printing
PAGE_PATH: `/pos`
API_ROUTE: `POST /api/pos/invoices`
COMPONENTS: `ProductCatalogGrid`, `CartPanel`, `PaymentModal`
BUTTONS: زر الدفع النقدي والطباعة، زر الدفع بالشبكة
FORMS: شاشة الدفع السريع (المبلغ المدفوع، المتبقي)
LINKS: `/sales/terminal`
ACTIONS: ترحيل الفاتورة وتوليد رمز QR الخاص بهيئة الزكاة
EXPECTED_USER_ROLES: كاشير (Cashier)
PERMISSION_REQUIREMENTS: `create:pos_invoice`
DB_WRITE_RISK: YES (إنشاء مستند الفاتورة وخصم المخازن)
FINANCIAL_RISK: YES (ترحيل مالي فوري وإثبات مبيعات ونقدية)
TENANT_RISK: YES (عزل حركات المبيعات والوردية بالمستأجر)
ZATCA_OR_WPS_OR_HR_SENSITIVE: YES (حساس زكاة ZATCA)
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-POS-001
HAS_TEST: YES
TEST_FILE: `tests/e2e/pos/checkout.test.ts`
NOTES: يتطلب محاكاة ZATCA وبوابات الدفع.

---

### SCENARIO_ID: SCN-SAL-002
MAIN_SECTION: Sales Operations
SUB_SECTION: Sales Returns
PAGE_PATH: `/sales-returns`
API_ROUTE: `POST /api/sales/returns`
COMPONENTS: `InvoiceFinder`, `ReturnLinesForm`
BUTTONS: زر ترحيل المرتجع
FORMS: نموذج كميات الأصناف المسترجعة والسبب
LINKS: None
ACTIONS: ترحيل مرتجع المبيعات وعكس القيد المحاسبي والأرصدة والVAT
EXPECTED_USER_ROLES: موظف مبيعات (Sales Officer)
PERMISSION_REQUIREMENTS: `create:sales_return`
DB_WRITE_RISK: YES (إضافة مرتجع مبيعات وتعديل رصيد المخزن)
FINANCIAL_RISK: YES (عكس مبيعات وVAT)
TENANT_RISK: YES (عزل مستند المرتجع)
ZATCA_OR_WPS_OR_HR_SENSITIVE: YES (VAT والزكاة)
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-SAL-002
HAS_TEST: YES
TEST_FILE: `tests/integration/sales/returns.test.ts`
NOTES: فحص منع إرجاع كميات تفوق المبيعات الأصلية.

---

### SCENARIO_ID: SCN-POS-002
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Restaurant POS & Tables
PAGE_PATH: `/v3/restaurant/tables`
API_ROUTE: `POST /api/restaurant/orders`
COMPONENTS: `FloorMap`, `TableCard`, `OrderDetails`
BUTTONS: زر إرسال الطلب للمطبخ (KOT)
FORMS: نموذج طلبات الصالة
LINKS: `/v3/restaurant/kds`
ACTIONS: إرسال المطبخ وتغيير حالة الطاولة لـ busy
EXPECTED_USER_ROLES: كابتن صالة (Waiter)
PERMISSION_REQUIREMENTS: `create:restaurant_order`
DB_WRITE_RISK: YES (حفظ مسودة الطلب وتعديل حالة الطاولة)
FINANCIAL_RISK: NO (طلب صالة غير مدفوع بعد)
TENANT_RISK: YES (عزل الصالة والطلبات بالمستأجر)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-POS-002
HAS_TEST: YES
TEST_FILE: `tests/e2e/pos/restaurant.test.ts`
NOTES: محاكاة اتصالات WebSocket بالكامل.

---

### SCENARIO_ID: SCN-PUR-001
MAIN_SECTION: Procurement
SUB_SECTION: Purchase Orders
PAGE_PATH: `/sales/orders/create`
API_ROUTE: `POST /api/purchases/orders`
COMPONENTS: `VendorSelect`, `ItemRateTable`
BUTTONS: زر حفظ كمسودة، زر إرسال للاعتماد
FORMS: نموذج إدخال أمر الشراء (المورد، الأصناف، التكلفة والVAT)
LINKS: None
ACTIONS: حفظ كمسودة ومطابقة احتساب الضريبة
EXPECTED_USER_ROLES: موظف مشتريات (Purchasing Officer)
PERMISSION_REQUIREMENTS: `create:purchase_order`
DB_WRITE_RISK: NO (محاكاة كاملة في فحص API Contract)
FINANCIAL_RISK: NO (مسودة أمر شراء لا ترحل)
TENANT_RISK: YES (عزل أوامر الشراء)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-PUR-001
HAS_TEST: YES
TEST_FILE: `tests/api-contract-procurement.test.ts`
NOTES: مأتمت بالكامل كعقد API آمن بدون لمس قاعدة البيانات.

---

### SCENARIO_ID: SCN-PUR-002
MAIN_SECTION: Supply Chain
SUB_SECTION: Purchase Returns
PAGE_PATH: `/purchase-returns`
API_ROUTE: `POST /api/purchases/returns`
COMPONENTS: `GRNSelector`, `ReturnQuantitiesGrid`
BUTTONS: زر ترحيل المرتجع للمورد
FORMS: نموذج أسطر الأصناف المرجعة والكميات
LINKS: None
ACTIONS: خصم المخزون وعكس مديونية المورد وتوليد القيد العكسي
EXPECTED_USER_ROLES: أمين مخزن (Storekeeper)
PERMISSION_REQUIREMENTS: `create:purchase_return`
DB_WRITE_RISK: YES (تعديل رصيد المخزن)
FINANCIAL_RISK: YES (عكس التزامات المورد وحساب المشتريات والضريبة)
TENANT_RISK: YES (عزل مستند المرتجع)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-PUR-002
HAS_TEST: YES
TEST_FILE: `tests/integration/purchases/returns.test.ts`
NOTES: فحص منع إرجاع كميات أكبر مما تم استلامه في الـ GRN.

---

### SCENARIO_ID: SCN-INV-001
MAIN_SECTION: Stock Management
SUB_SECTION: Stock Transfers
PAGE_PATH: `/stock-transfers`
API_ROUTE: `POST /api/inventory/transfers`
COMPONENTS: `WarehouseSelector`, `TransferLines`
BUTTONS: زر ترحيل التحويل
FORMS: نموذج التحويل (مخزن المصدر، مخزن الهدف، الكميات)
LINKS: `/stock`
ACTIONS: خصم مخزن أ وإضافة مخزن ب وتوليد القيد المحاسبي للوسيط
EXPECTED_USER_ROLES: أمين مخزن (Storekeeper)
PERMISSION_REQUIREMENTS: `create:stock_transfer`
DB_WRITE_RISK: YES (تعديل رصيد المخازن)
FINANCIAL_RISK: YES (ترحيل لحسابات وسيط النقل)
TENANT_RISK: YES (عزل المخازن وعملية التحويل)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-INV-001
HAS_TEST: YES
TEST_FILE: `tests/integration/inventory/transfers.test.ts`
NOTES: فحص منع التحويل برصيد سالب.

---

### SCENARIO_ID: SCN-INV-002
MAIN_SECTION: Stocktake Operations
SUB_SECTION: Stocktake & Adjustment
PAGE_PATH: `/stocktake`
API_ROUTE: `POST /api/inventory/adjustments`
COMPONENTS: `PhysicalCountSheet`, `AdjustmentVerifier`
BUTTONS: زر اعتماد التسوية
FORMS: نموذج الجرد الفعلي وفروق الجرد
LINKS: `/stocktake/vision`
ACTIONS: تعديل الرصيد الدفتري وموازنة فروق الجرد ومتوسط التكلفة المتحرك
EXPECTED_USER_ROLES: مدير مخازن (Inventory Manager)
PERMISSION_REQUIREMENTS: `manage:stocktake`
DB_WRITE_RISK: YES (تسوية أرصدة وتكاليف الأصناف)
FINANCIAL_RISK: YES (إثبات فروق الجرد مجمع الخسائر/الأرباح)
TENANT_RISK: YES (عزل الجرد بالمستأجر)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-INV-002
HAS_TEST: YES
TEST_FILE: `tests/integration/inventory/adjustments.test.ts`
NOTES: فحص حماية التكلفة.

---

### SCENARIO_ID: SCN-HR-001
MAIN_SECTION: Human Resources
SUB_SECTION: Employee Directory & Contracts
PAGE_PATH: `/hr/employees`
API_ROUTE: `PUT /api/hr/contracts`
COMPONENTS: `EmployeeProfile`, `ContractDetailsForm`
BUTTONS: زر تحديث العقد
FORMS: نموذج بيانات الموظف والراتب والبدلات
LINKS: `/vacations`
ACTIONS: تحديث العقد وتفاصيل الراتب
EXPECTED_USER_ROLES: أخصائي موارد بشرية (HR Specialist)
PERMISSION_REQUIREMENTS: `manage:employee_contracts`
DB_WRITE_RISK: YES (تعديل تفاصيل العقد والأرشيف المرفق)
FINANCIAL_RISK: NO (طلب تعديل راتب سارٍ ولا يمثل ترحيل مباشر)
TENANT_RISK: YES (عزل بيانات الموظفين بالكامل)
ZATCA_OR_WPS_OR_HR_SENSITIVE: YES (حساس للموارد البشرية والرواتب)
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-HR-001
HAS_TEST: YES
TEST_FILE: `tests/integration/hr/employees.test.ts`
NOTES: التحقق من عزل البيانات بالكامل لمنع تسريب الموظفين.

---

### SCENARIO_ID: SCN-COMP-001
MAIN_SECTION: Wages Protection System
SUB_SECTION: Mudad Compliance
PAGE_PATH: `/saudi/mudad`
API_ROUTE: `GET /api/hr/payroll/mudad-file`
COMPONENTS: `MudadFileGenerator`
BUTTONS: زر توليد ملف مدد، زر تنزيل مسيرة الرواتب
FORMS: شاشة اختيار الشهر ومسيرة الرواتب المعتمدة
LINKS: None
ACTIONS: تنزيل ملف حماية الأجور
EXPECTED_USER_ROLES: محاسب رواتب (Payroll Accountant)
PERMISSION_REQUIREMENTS: `manage:wps`
DB_WRITE_RISK: NO (معزول API)
FINANCIAL_RISK: NO (ملف امتثال للتصدير)
TENANT_RISK: YES (عزل مسيرات رواتب الموظفين بالمستأجر)
ZATCA_OR_WPS_OR_HR_SENSITIVE: YES (حساس حماية أجور WPS)
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-COMP-001
HAS_TEST: YES
TEST_FILE: `tests/api-contract-compliance.test.ts`
NOTES: فحص توافق هيكلية ملف حماية الأجور السعودي.

---

### SCENARIO_ID: SCN-ASST-001
MAIN_SECTION: Fixed Assets
SUB_SECTION: Asset Depreciation
PAGE_PATH: `/fixed-assets/depreciation`
API_ROUTE: `POST /api/fixed-assets/depreciate`
COMPONENTS: `AssetsDepreciationDashboard`
BUTTONS: زر تشغيل الإهلاك
FORMS: نموذج تحديد تاريخ الإهلاك وتحديد الأصول
LINKS: None
ACTIONS: حساب قيود إهلاك الأصول ومجمع الإهلاك وتخفيض القيمة الدفترية للأصل
EXPECTED_USER_ROLES: محاسب أصول (Assets Accountant)
PERMISSION_REQUIREMENTS: `manage:assets_depreciation`
DB_WRITE_RISK: YES (تسجيل قيود الإهلاك)
FINANCIAL_RISK: YES (ترحيل مباشر لمصروف الإهلاك)
TENANT_RISK: YES (عزل أصول المستأجر الحالي)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-ASST-001
HAS_TEST: YES
TEST_FILE: `tests/integration/fixed-assets/depreciation.test.ts`
NOTES: التحقق من عدم تخطي مجمع الإهلاك لقيمة الأصل الكلية.

---

### SCENARIO_ID: SCN-APP-001
MAIN_SECTION: Document Approvals
SUB_SECTION: Document Workflow Approvals
PAGE_PATH: `/approvals`
API_ROUTE: `GET /api/approvals/pending`
COMPONENTS: `WorkflowApprovalsDashboard`
BUTTONS: زر عرض الطلبات المعلقة
FORMS: None
LINKS: None
ACTIONS: عرض واعتماد مستندات الموافقات المعلقة
EXPECTED_USER_ROLES: مدير معتمد (Approver)
PERMISSION_REQUIREMENTS: `view:approvals`
DB_WRITE_RISK: NO (قراءة موافقات معلقة)
FINANCIAL_RISK: NO (لا يمثل ترحيل مالي بل اعتماد مستندي)
TENANT_RISK: YES (عزل الموافقات والطلبات)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-APP-001
HAS_TEST: YES
TEST_FILE: `tests/api-contract-procurement.test.ts`
NOTES: مأتمت بالكامل كعقد API آمن.

---

### SCENARIO_ID: SCN-AI-001
MAIN_SECTION: AI Copilots
SUB_SECTION: AI CFO Financial Auditor
PAGE_PATH: `/ai-cfo`
API_ROUTE: `POST /api/ai/cfo-insights`
COMPONENTS: `CFODashboard`
BUTTONS: زر استشارة الذكاء الاصطناعي
FORMS: None
LINKS: None
ACTIONS: استدعاء نموذج Gemini محاكاة وإرجاع التوصيات المالية
EXPECTED_USER_ROLES: مدير مالي (CFO)
PERMISSION_REQUIREMENTS: `view:ai_insights`
DB_WRITE_RISK: NO
FINANCIAL_RISK: NO
TENANT_RISK: YES (عزل كامل البيانات المالية المرسلة)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P3
HAS_SCENARIO: YES
SCENARIO_ID: SCN-AI-001
HAS_TEST: YES
TEST_FILE: `tests/api-contract-ai-cfo.test.ts`
NOTES: محاكاة الـ LLM بشكل كامل.

---

### SCENARIO_ID: SCN-CMMS-001
MAIN_SECTION: Facilities
SUB_SECTION: CMMS Preventive Maintenance
PAGE_PATH: `/maintenance`
API_ROUTE: `POST /api/maintenance/schedule`
COMPONENTS: `MaintenanceScheduler`
BUTTONS: زر جدولة الصيانة
FORMS: نموذج جدولة الصيانة الوقائية والتكرار
LINKS: None
ACTIONS: توليد أوامر الصيانة الدورية وتنبيه الفني
EXPECTED_USER_ROLES: مسؤول صيانة (Maintenance Planner)
PERMISSION_REQUIREMENTS: `manage:maintenance`
DB_WRITE_RISK: YES (جدولة صيانة وقائية وتعديل حالات الأجهزة)
FINANCIAL_RISK: NO (لا يمثل ترحيل مالي مباشر)
TENANT_RISK: YES (عزل المنشآت والمعدات)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P3
HAS_SCENARIO: YES
SCENARIO_ID: SCN-CMMS-001
HAS_TEST: YES
TEST_FILE: `tests/integration/maintenance/pm.test.ts`
NOTES: لا يتم احتساب أي تكاليف قطع غيار حية أو فواتير صيانة.

---

### SCENARIO_ID: SCN-SEC-001
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Cross-Tenant Isolation
PAGE_PATH: `/api/**`
API_ROUTE: `/api/**`
COMPONENTS: `TenantIsolationGuard`
BUTTONS: None
FORMS: None
LINKS: None
ACTIONS: حظر أي Bypass للـ tenantId وحماية خصوصية البيانات
EXPECTED_USER_ROLES: نظام / مستأجر خبيث
PERMISSION_REQUIREMENTS: مصادقة صالحة للمستأجر
DB_WRITE_RISK: NO (حارس أمان للقراءة والكتابة)
FINANCIAL_RISK: NO
TENANT_RISK: YES (ثغرة عزل مستأجرين)
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P0 (حرج للغاية)
HAS_SCENARIO: YES
SCENARIO_ID: SCN-SEC-001
HAS_TEST: YES
TEST_FILE: `tests/api-contract-security.test.ts`
NOTES: بوابة أمان حرجة ومأتمتة.

---

### SCENARIO_ID: SCN-SEC-002
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Server Access Control
PAGE_PATH: `/api/**`
API_ROUTE: `/api/**`
COMPONENTS: `RBACGuard`
BUTTONS: None
FORMS: None
LINKS: None
ACTIONS: التحقق من الصلاحيات ورفض الطلبات غير المصرح بها برمز 403 Forbidden
EXPECTED_USER_ROLES: موظف عادي بدون صلاحيات محاسبية
PERMISSION_REQUIREMENTS: التحقق من صلاحيات الأدوار وربطها بالـ tenantId
DB_WRITE_RISK: NO (حارس صلاحيات)
FINANCIAL_RISK: NO
TENANT_RISK: YES
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P0
HAS_SCENARIO: YES
SCENARIO_ID: SCN-SEC-002
HAS_TEST: YES
TEST_FILE: `tests/api-contract-security.test.ts`
NOTES: حارس حماية الوصول على APIs.

---

### SCENARIO_ID: SCN-PERF-001
MAIN_SECTION: Code Quality & Performance
SUB_SECTION: Sync Blockers Check
PAGE_PATH: `src/**`
API_ROUTE: None
COMPONENTS: AST check scripts
BUTTONS: None
FORMS: None
LINKS: None
ACTIONS: التحليل الاستاتيكي للتعليمات البرمجية للتأكد من عدم حظر الـ Event Loop
EXPECTED_USER_ROLES: مطور
PERMISSION_REQUIREMENTS: فحص للمطورين
DB_WRITE_RISK: NO
FINANCIAL_RISK: NO
TENANT_RISK: NO
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P2
HAS_SCENARIO: YES
SCENARIO_ID: SCN-PERF-001
HAS_TEST: YES
TEST_FILE: `tests/sync-blockers.test.ts`
NOTES: فحص برمجي استاتيكي آمن 100%.

---

### SCENARIO_ID: SCN-FIN-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entry Calculation
PAGE_PATH: `/api/accounting/journal`
API_ROUTE: `/api/accounting/journal`
COMPONENTS: `JournalBalanceValidator`
BUTTONS: None
FORMS: None
LINKS: None
ACTIONS: التحقق الحسابي من توازن قيود اليومية ورفض غير المتوازن بـ 400 Bad Request
EXPECTED_USER_ROLES: محاسب عام
PERMISSION_REQUIREMENTS: `create:journal_entry`
DB_WRITE_RISK: NO (التحقق حسابي)
FINANCIAL_RISK: YES (حماية توازن الدفاتر)
TENANT_RISK: YES
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-FIN-001
HAS_TEST: YES
TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
NOTES: مأتمت كبوابة أمان محاسبية لعقود الـ API.

---

### SCENARIO_ID: SCN-FIN-002
MAIN_SECTION: General Ledger
SUB_SECTION: Posted Journal Entry
PAGE_PATH: `/api/accounting/journal`
API_ROUTE: `/api/accounting/journal`
COMPONENTS: `ImmutabilityValidator`
BUTTONS: None
FORMS: None
LINKS: None
ACTIONS: منع تعديل القيود المحاسبية بعد ترحيلها Posted برمز 500 أو 409
EXPECTED_USER_ROLES: محاسب عام
PERMISSION_REQUIREMENTS: `manage:journal_entry`
DB_WRITE_RISK: NO
FINANCIAL_RISK: YES
TENANT_RISK: YES
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-FIN-002
HAS_TEST: YES
TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
NOTES: قاعدة التثبيت والامتثال.

---

### SCENARIO_ID: SCN-FIN-003
MAIN_SECTION: General Ledger
SUB_SECTION: Closed Period Verification
PAGE_PATH: `/api/accounting/journal`
API_ROUTE: `/api/accounting/journal`
COMPONENTS: `PeriodLockValidator`
BUTTONS: None
FORMS: None
LINKS: None
ACTIONS: منع الحركات في الفترات المحاسبية المغلقة برمز 409 LOCKED
EXPECTED_USER_ROLES: محاسب عام
PERMISSION_REQUIREMENTS: `create:journal_entry`
DB_WRITE_RISK: NO
FINANCIAL_RISK: YES
TENANT_RISK: YES
ZATCA_OR_WPS_OR_HR_SENSITIVE: NO
RISK_LEVEL: P1
HAS_SCENARIO: YES
SCENARIO_ID: SCN-FIN-003
HAS_TEST: YES
TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
NOTES: قاعدة الحماية السنوية والدورية.
