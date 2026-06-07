# جرد الأقسام الرئيسية والفرعية للنظام (NAMA_INVEST_ERP_MAIN_SUBSECTION_INVENTORY_AR)

يوثق هذا المستند الجرد الفني والتشغيلي لكافة واجهات وشاشات وأزرار وواجهات البرمجة (API) لنظام Nama Invest ERP مع توضيح الصلاحيات والسيناريوهات وملفات الاختبارات المرتبطة.

---

### 🏛️ 1. الموديول المالي والمحاسبي (Accounting & General Ledger)

* **MAIN_SECTION:** General Ledger
* **SUB_SECTION:** Journal Entries & Period Close
* **PAGE_PATH:** `/accounting/journal/new`
* **API_ROUTE:** `POST /api/accounting/journal`
* **COMPONENTS:** `JournalForm`, `JournalLinesTable`
* **BUTTONS:** زر حفظ، زر ترحيل قيد
* **FORMS:** نموذج إدخال القيد (التاريخ، الفرع، العملة، الأسطر)
* **LINKS:** `/accounting/journal`
* **ACTIONS:** ترحيل القيد، إلغاء الحفظ، الحفظ المؤقت
* **EXPECTED_USER_ROLES:** محاسب عام (General Accountant)، مدير حسابات
* **RISK_LEVEL:** P1 (مرتفع جداً)
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-GL-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/finance-isolated-db-smoke.test.ts`
* **NOTES:** يمنع كتابة حقيقية على الإنتاج، ويفحص فترات الإغلاق.

* **MAIN_SECTION:** General Ledger
* **SUB_SECTION:** Chart of Accounts (COA)
* **PAGE_PATH:** `/accounting/coa`
* **API_ROUTE:** `GET /api/accounting/coa`, `POST /api/accounting/coa`
* **COMPONENTS:** `COATreeView`, `AccountModal`
* **BUTTONS:** زر إضافة حساب أب، زر إضافة حساب فرعي، زر تعديل حساب
* **FORMS:** نموذج إضافة حساب (الرمز المالي، الاسم عربي/إنجليزي، النوع، الأب)
* **LINKS:** None
* **ACTIONS:** إضافة وتعديل الحسابات وتحديث هيكل الشجرة
* **EXPECTED_USER_ROLES:** مدير مالي (CFO)، مسؤول النظام
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-GL-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/accounting/coa.test.ts`
* **NOTES:** حارس عزل البيانات بالـ tenantId مفعل افتراضياً.

---

### 🏦 2. موديول النقدية والبنوك والتحصيل (Cash, Banks & Accounts Receivable)

* **MAIN_SECTION:** Cash & Banks
* **SUB_SECTION:** Bank Reconciliation
* **PAGE_PATH:** `/treasury/bank-reconciliation`
* **API_ROUTE:** `GET /api/banks/transactions`, `POST /api/banks/reconcile`
* **COMPONENTS:** `BankStatementUploader`, `ReconciliationGrid`
* **BUTTONS:** زر رفع ملف كشف الحساب، زر مطابقة وتسوية، زر إلغاء التسوية
* **FORMS:** نموذج رفع ملفات (CSV/Excel)
* **LINKS:** `/treasury/checks`
* **ACTIONS:** مطابقة القيود المسجلة بالدوال مع كشف الحساب البنكي
* **EXPECTED_USER_ROLES:** محاسب خزينة (Treasury Accountant)
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-BANK-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/accounting/bank-recon.test.ts`
* **NOTES:** يمنع أي اتصال حقيقي بـ API بنكي.

* **MAIN_SECTION:** Accounts Receivable
* **SUB_SECTION:** Dunning Engine V2
* **PAGE_PATH:** `/accounting/dunning`
* **API_ROUTE:** `GET /api/accounting/dunning-rules`, `POST /api/accounting/dunning/run`
* **COMPONENTS:** `DunningDashboard`, `DunningRulesForm`
* **BUTTONS:** زر تشغيل المحرك، زر تعديل قواعد المتابعة
* **FORMS:** نموذج قواعد المتابعة (فترات التأخير، نسب الفائدة، صياغة الرسائل)
* **LINKS:** None
* **ACTIONS:** تشغيل الجدولة وإصدار تنبيهات المتابعة وفواتير الفوائد
* **EXPECTED_USER_ROLES:** مدير ائتمان (Credit Manager)
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-GL-003
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/accounting/dunning.test.ts`
* **NOTES:** إجبارية عمل Mock لرسائل SMS والبريد لتفادي رسائل حقيقية للعملاء.

---

### 🛒 3. نقاط البيع والمبيعات (POS & Sales)

* **MAIN_SECTION:** Point of Sale (POS)
* **SUB_SECTION:** Cashier Checkout & Printing
* **PAGE_PATH:** `/pos`
* **API_ROUTE:** `POST /api/pos/invoices`
* **COMPONENTS:** `ProductCatalogGrid`, `CartPanel`, `PaymentModal`
* **BUTTONS:** زر اختيار صنف، زر الدفع النقدي، زر الدفع بالبطاقة، زر طباعة الإيصال
* **FORMS:** شاشة الدفع السريع (المبلغ المدفوع، المتبقي، طريقة الدفع)
* **LINKS:** `/sales/terminal`
* **ACTIONS:** ترحيل فاتورة POS مبسطة وتوليد رمز الاستجابة السريع QR
* **EXPECTED_USER_ROLES:** كاشير (Cashier)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-POS-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/e2e/pos/checkout.test.ts`
* **NOTES:** حارس عزل الكاشير والوردية مع محاكاة ZATCA.

* **MAIN_SECTION:** Point of Sale (POS)
* **SUB_SECTION:** Restaurant POS & Tables
* **PAGE_PATH:** `/v3/restaurant/tables`
* **API_ROUTE:** `POST /api/restaurant/orders`
* **COMPONENTS:** `FloorMap`, `TableCard`, `OrderDetails`
* **BUTTONS:** زر حجز طاولة، زر إرسال الطلب KOT، زر دمج طاولات
* **FORMS:** نموذج طلبات الصالة
* **LINKS:** `/v3/restaurant/kds`
* **ACTIONS:** إرسال المطبخ، تسوية الفاتورة للطاولة
* **EXPECTED_USER_ROLES:** كابتن صالة (Waiter)، مدير الصالة
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-POS-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/e2e/pos/restaurant.test.ts`
* **NOTES:** محاكاة اتصالات WebSocket الخاصة بالمطبخ والصالة بالكامل.

* **MAIN_SECTION:** Sales Operations
* **SUB_SECTION:** Sales Returns
* **PAGE_PATH:** `/sales-returns`
* **API_ROUTE:** `POST /api/sales/returns`
* **COMPONENTS:** `InvoiceFinder`, `ReturnLinesForm`
* **BUTTONS:** زر بحث عن فاتورة أصلية، زر ترحيل المرتجع
* **FORMS:** نموذج الفاتورة المسترجعة وكميات الأصناف
* **LINKS:** None
* **ACTIONS:** ترحيل مرتجع المبيعات وعكس القيد المحاسبي
* **EXPECTED_USER_ROLES:** موظف مبيعات (Sales Officer)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-SAL-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/sales/returns.test.ts`
* **NOTES:** فحص منع تخطي الكمية المباعة أصلياً.

---

### 📦 4. المشتريات والمخازن وسلاسل الإمداد (Procurement, Inventory & SCM)

* **MAIN_SECTION:** Procurement
* **SUB_SECTION:** Purchase Orders
* **PAGE_PATH:** `/sales/orders/create`
* **API_ROUTE:** `POST /api/purchases/orders`
* **COMPONENTS:** `VendorSelect`, `ItemRateTable`
* **BUTTONS:** زر حفظ كمسودة، زر إرسال للاعتماد
* **FORMS:** نموذج إدخال أمر الشراء (المورد، المنتجات، معدل الضريبة)
* **LINKS:** None
* **ACTIONS:** حفظ كمسودة ومطابقة احتساب ضريبة القيمة المضافة
* **EXPECTED_USER_ROLES:** موظف مشتريات (Purchasing Officer)
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-PUR-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-procurement.test.ts`
* **NOTES:** مأتمت كعقد API آمن بدون لمس قاعدة البيانات.

* **MAIN_SECTION:** Supply Chain
* **SUB_SECTION:** Purchase Returns
* **PAGE_PATH:** `/purchase-returns`
* **API_ROUTE:** `POST /api/purchases/returns`
* **COMPONENTS:** `GRNSelector`, `ReturnQuantitiesGrid`
* **BUTTONS:** زر اختيار سند الاستلام GRN، زر ترحيل مرتجع المشتريات
* **FORMS:** نموذج مستند المرتجع
* **LINKS:** None
* **ACTIONS:** خصم المخزون وعكس مديونية المورد وقيد المشتريات والضريبة
* **EXPECTED_USER_ROLES:** أمين مخزن (Storekeeper)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-PUR-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/purchases/returns.test.ts`
* **NOTES:** فحص إرجاع كميات صالحة وعدم تجاوز كمية الاستلام المخزني.

* **MAIN_SECTION:** Stock Management
* **SUB_SECTION:** Stock Transfers
* **PAGE_PATH:** `/stock-transfers`
* **API_ROUTE:** `POST /api/inventory/transfers`
* **COMPONENTS:** `WarehouseSelector`, `TransferLines`
* **BUTTONS:** زر ترحيل سند التحويل المخزني
* **FORMS:** نموذج التحويل (مخزن المصدر، مخزن الهدف، الكميات)
* **LINKS:** `/stock`
* **ACTIONS:** ترحيل حركة تحويل مخزني وتعديل أرصدة المخازن وتوليد القيود
* **EXPECTED_USER_ROLES:** أمين مخزن (Storekeeper)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-INV-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/inventory/transfers.test.ts`
* **NOTES:** منع تحويل مخازن غير تابعة لنفس المستأجر.

* **MAIN_SECTION:** Stocktake Operations
* **SUB_SECTION:** Stocktake & Adjustment
* **PAGE_PATH:** `/stocktake`
* **API_ROUTE:** `POST /api/inventory/adjustments`
* **COMPONENTS:** `PhysicalCountSheet`, `AdjustmentVerifier`
* **BUTTONS:** زر استدعاء الكميات الدفترية، زر اعتماد التسوية
* **FORMS:** نموذج الجرد الفعلي وفروق الجرد
* **LINKS:** `/stocktake/vision`
* **ACTIONS:** اعتماد تسوية الفروق واحتساب التغير في متوسط التكلفة المتحرك
* **EXPECTED_USER_ROLES:** مدير مخازن (Inventory Manager)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-INV-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/inventory/adjustments.test.ts`
* **NOTES:** حماية التكلفة واختبارات الجرد محليا فقط.

---

### 👥 5. الموارد البشرية والامتثال والأصول (HR, Compliance & Fixed Assets)

* **MAIN_SECTION:** Human Resources
* **SUB_SECTION:** Employee Directory & Contracts
* **PAGE_PATH:** `/hr/employees`
* **API_ROUTE:** `POST /api/hr/employees`, `PUT /api/hr/contracts`
* **COMPONENTS:** `EmployeeProfile`, `ContractDetailsForm`
* **BUTTONS:** زر تحديث العقد، زر إنهاء العقد
* **FORMS:** نموذج بيانات الموظف وراتبه الأساسي والبدلات
* **LINKS:** `/vacations`
* **ACTIONS:** تعديل وتحديث بيانات الموظف وعقده
* **EXPECTED_USER_ROLES:** أخصائي موارد بشرية (HR Specialist)
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-HR-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/hr/employees.test.ts`
* **NOTES:** معزول بالـ tenantId تماماً.

* **MAIN_SECTION:** Wages Protection System
* **SUB_SECTION:** Mudad Compliance
* **PAGE_PATH:** `/saudi/mudad`
* **API_ROUTE:** `GET /api/hr/payroll/mudad-file`
* **COMPONENTS:** `MudadFileGenerator`
* **BUTTONS:** زر توليد ملف مدد، زر تنزيل مسيرة الرواتب
* **FORMS:** شاشة تحديد الشهر ومسيرة الرواتب المستهدفة
* **LINKS:** None
* **ACTIONS:** تنزيل مسيرة حماية الأجور
* **EXPECTED_USER_ROLES:** محاسب رواتب (Payroll Accountant)
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-COMP-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-compliance.test.ts`
* **NOTES:** اختبار عقد هيكلية البيانات للـ XML/TXT بدون ترحيل مالي أو إرسال لجهة خارجية.

* **MAIN_SECTION:** Fixed Assets
* **SUB_SECTION:** Asset Depreciation
* **PAGE_PATH:** `/fixed-assets/depreciation`
* **API_ROUTE:** `POST /api/fixed-assets/depreciate`
* **COMPONENTS:** `AssetsDepreciationDashboard`
* **BUTTONS:** زر تشغيل الإهلاك الشهري، زر استعراض الأصول
* **FORMS:** نموذج تحديد شهر المعالجة وتحديد الأصول
* **LINKS:** None
* **ACTIONS:** حساب قيود إهلاك الأصول ومجمع الإهلاك وتخفيض القيمة الدفترية للأصل
* **EXPECTED_USER_ROLES:** محاسب أصول (Assets Accountant)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-ASST-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/integration/fixed-assets/depreciation.test.ts`
* **NOTES:** التحقق من عدم تخطي مجمع الإهلاك لقيمة الإهلاك الكلية.

---

### 🛡️ 6. الأمن والأداء والموافقات وحوكمة الحسابات (Security, Performance & Governance)

* **MAIN_SECTION:** Security & Tenant Isolation
* **SUB_SECTION:** Cross-Tenant Isolation
* **PAGE_PATH:** `/api/**`
* **API_ROUTE:** `/api/**`
* **COMPONENTS:** `TenantIsolationGuard`
* **BUTTONS:** None
* **FORMS:** None
* **LINKS:** None
* **ACTIONS:** عزل استعلامات المستأجرين وحظر أي Bypass للـ tenantId
* **EXPECTED_USER_ROLES:** نظام / زائر
* **RISK_LEVEL:** P0 (حرج للغاية)
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-SEC-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-security.test.ts`
* **NOTES:** مأتمت وبوابة أمان حرجة.

* **MAIN_SECTION:** Security & Tenant Isolation
* **SUB_SECTION:** Server Access Control
* **PAGE_PATH:** `/api/**`
* **API_ROUTE:** `/api/**`
* **COMPONENTS:** `RBACGuard`
* **BUTTONS:** None
* **FORMS:** None
* **LINKS:** None
* **ACTIONS:** فحص الصلاحيات ورفض الطلبات غير المصرح بها برمز 403 Forbidden
* **EXPECTED_USER_ROLES:** نظام / زائر
* **RISK_LEVEL:** P0
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-SEC-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-security.test.ts`
* **NOTES:** حارس صلاحيات الوصول على APIs.

* **MAIN_SECTION:** Code Quality & Performance
* **SUB_SECTION:** Sync Blockers Check
* **PAGE_PATH:** `src/**`
* **API_ROUTE:** None
* **COMPONENTS:** AST check scripts
* **BUTTONS:** None
* **FORMS:** None
* **LINKS:** None
* **ACTIONS:** التحليل الاستاتيكي للتعليمات البرمجية للتأكد من عدم حظر الـ Event Loop
* **EXPECTED_USER_ROLES:** مطور
* **RISK_LEVEL:** P2
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-PERF-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/sync-blockers.test.ts`
* **NOTES:** فحص بناء برمجي آمن.

* **MAIN_SECTION:** General Ledger
* **SUB_SECTION:** Journal Entry Calculation
* **PAGE_PATH:** `/api/accounting/journal`
* **API_ROUTE:** `/api/accounting/journal`
* **COMPONENTS:** `JournalBalanceValidator`
* **BUTTONS:** None
* **FORMS:** None
* **LINKS:** None
* **ACTIONS:** التحقق الحسابي من توازن قيود اليومية ورفض غير المتوازن بـ 400 Bad Request
* **EXPECTED_USER_ROLES:** محاسب عام (General Accountant)
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-FIN-001
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-accounting-governance.test.ts`
* **NOTES:** توازن حسابي حاسم.

* **MAIN_SECTION:** General Ledger
* **SUB_SECTION:** Posted Journal Entry
* **PAGE_PATH:** `/api/accounting/journal`
* **API_ROUTE:** `/api/accounting/journal`
* **COMPONENTS:** `ImmutabilityValidator`
* **BUTTONS:** None
* **FORMS:** None
* **LINKS:** None
* **ACTIONS:** منع تعديل القيود المحاسبية بعد ترحيلها
* **EXPECTED_USER_ROLES:** محاسب عام
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-FIN-002
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-accounting-governance.test.ts`
* **NOTES:** قاعدة التثبيت والامتثال.

* **MAIN_SECTION:** General Ledger
* **SUB_SECTION:** Closed Period Verification
* **PAGE_PATH:** `/api/accounting/journal`
* **API_ROUTE:** `/api/accounting/journal`
* **COMPONENTS:** `PeriodLockValidator`
* **BUTTONS:** None
* **FORMS:** None
* **LINKS:** None
* **ACTIONS:** منع الحركات في الفترات المحاسبية المغلقة برمز 409 LOCKED
* **EXPECTED_USER_ROLES:** محاسب عام
* **RISK_LEVEL:** P1
* **HAS_SCENARIO:** YES
* **SCENARIO_ID:** SCN-FIN-003
* **HAS_TEST:** YES
* **TEST_FILE:** `tests/api-contract-accounting-governance.test.ts`
* **NOTES:** قاعدة الحماية المالية السنوية والدورية.
