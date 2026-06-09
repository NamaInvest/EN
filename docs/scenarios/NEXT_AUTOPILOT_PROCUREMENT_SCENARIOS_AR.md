SCENARIO_ID: SCN-PUR-REQS
MAIN_SECTION: المشتريات
SUB_SECTION: طلبات الاحتياج (Purchase Requisitions - PR)
PAGE_OR_ROUTE: /purchases/requisitions
API_ROUTE: /api/purchases/requisitions
USER_ROLE: employee
BUTTON_OR_ACTION: View requisitions list
PRECONDITIONS:
- وجود مستخدم مسجل دخول وتابع لمستأجر نشط.
SAFE_TEST_DATA:
- tenantId: 'tenant_test_123'
STEPS:
1. الانتقال إلى شاشة طلبات الاحتياج.
2. مراجعة الطلبات المقدمة مسبقاً وتفاصيلها.
EXPECTED_RESULT:
- عرض جدول يحتوي على طلبات الاحتياج الخاصة بالمستأجر الحالي فقط وموزعة حسب الحالة والتواريخ.
NEGATIVE_CASES:
- محاولة الوصول للمستندات دون تسجيل دخول؛ يتم إرجاع 401.
- محاولة الاستعلام عن مستندات تابعة لمستأجر آخر؛ يتم حظر الطلب وإرجاع 404 أو 403.
PERMISSION_RULES:
- يجب أن يمتلك المستخدم صلاحية 'view' على موديول 'purchases'.
TENANT_ISOLATION_REQUIREMENT:
- التحقق التلقائي والكامل من هوية ومستأجر المستخدم لمنع أي تسريب للبيانات.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: YES
TEST_DB_REQUIRED: NO
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: tests/purchases-requisitions.test.ts
RISK_LEVEL: LOW
NOTES:
- شاشة الاستعراض مرتبطة بمحرك الصلاحيات المركزي لـ ERP.

SCENARIO_ID: SCN-PUR-ORDERS-GRID
MAIN_SECTION: المشتريات
SUB_SECTION: جدول أوامر الشراء (Purchase Orders Listing Grid)
PAGE_OR_ROUTE: /purchases/orders
API_ROUTE: /api/purchase-orders
USER_ROLE: purchases_manager
BUTTON_OR_ACTION: View Purchase Orders List
PRECONDITIONS:
- وجود أوامر شراء مسجلة في قاعدة البيانات للمستأجر الحالي.
SAFE_TEST_DATA:
- tenantId: 'tenant_test_123'
STEPS:
1. الانتقال إلى شاشة أوامر الشراء (/purchases/orders).
2. النظام يسترجع أول 50 أمر شراء حسب التاريخ تنازلياً.
EXPECTED_RESULT:
- عرض شبكة البيانات والملخصات المالية (KPIs) بشكل سليم دون مشاكل واجهة أو ترجمة.
NEGATIVE_CASES:
- محاولة تحميل الصفحة دون تسجيل دخول؛ يتم التوجيه لصفحة تسجيل الدخول.
PERMISSION_RULES:
- يجب أن يمتلك المستخدم صلاحية 'view' على موديول 'purchases'.
TENANT_ISOLATION_REQUIREMENT:
- تصفية الاستعلام إجبارياً على مستوى خادم قاعدة البيانات باستخدام معرف المستأجر الحالي (tenantId).
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: YES
TEST_DB_REQUIRED: NO
AUTOMATION_STATUS: AUTOMATED
RELATED_TEST_FILE: tests/purchase-orders-ui.test.ts
RISK_LEVEL: MEDIUM
NOTES:
- شاشة أوامر الشراء مستقرة بالكامل ومرتبطة بترميز وحوكمة المستندات.
