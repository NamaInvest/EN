SCENARIO_ID: SCENARIO_PROC_001
MAIN_SECTION: المشتريات وسلسلة التوريد
SUB_SECTION: استلام البضائع (Goods Receipt Note - GRN)
PAGE_OR_ROUTE: /purchases/grn
API_ROUTE: /api/purchases/grn
USER_ROLE: inventory_manager
BUTTON_OR_ACTION: Create GRN from Purchase Order
PRECONDITIONS:
- وجود أمر شراء معتمد (Purchase Order - Status: APPROVED).
- وجود مستأجر نشط ومسجل دخول بالصلاحية المناسبة.
SAFE_TEST_DATA:
- tenantId: 'tenant_test_123'
- purchaseOrderId: 'po_test_456'
STEPS:
1. الانتقال إلى صفحة استلام البضائع.
2. الضغط على زر "إنشاء استلام من أمر شراء".
3. إدخال رقم أمر الشراء أو اختياره من القائمة المنسدلة.
4. مراجعة الكميات المستلمة وتحديثها وفق الفاتورة الفعلية.
5. الضغط على زر "حفظ واعتماد".
EXPECTED_RESULT:
- إنشاء مستند استلام البضاعة وحفظه بنجاح وتحديث كميات المخزون في المستودع المحدد.
NEGATIVE_CASES:
- محاولة استلام كمية أكبر من كمية أمر الشراء (تظهر رسالة خطأ تمنع الحفظ).
- محاولة إنشاء استلام بدون تحديد مستودع (تظهر رسالة خطأ).
PERMISSION_RULES:
- يجب أن يمتلك المستخدم صلاحية 'add' على موديول 'inventory' أو 'purchases'.
TENANT_ISOLATION_REQUIREMENT:
- يمنع تماماً استلام بضائع أو الاستعلام عن أوامر شراء تابعة لمستأجر آخر (Strict Tenant Isolation).
DB_WRITE_ALLOWED: YES
FINANCIAL_POSTING_ALLOWED: NO (لا يتم إجراء قيد مالي حتى صدور فاتورة المورد، أو يتم إجراء قيد مخزني وسيط فقط)
PRODUCTION_ALLOWED: NO (في بيئة الاختبار فقط)
TEST_DB_REQUIRED: YES
AUTOMATION_STATUS: NOT_STARTED
RELATED_TEST_FILE: tests/purchases-grn.test.ts
RISK_LEVEL: HIGH (يؤثر على كميات المخزون وتقييم المخازن)
NOTES:
- يجب التأكد من تطبيق data normalization لبيانات الاستلام قبل حفظها في قاعدة البيانات.

SCENARIO_ID: SCENARIO_PROC_002
MAIN_SECTION: المشتريات وسلسلة التوريد
SUB_SECTION: تفاصيل أمر الشراء (Purchase Order Details View)
PAGE_OR_ROUTE: /purchase-orders/[id]
API_ROUTE: /api/purchase-orders/[id]
USER_ROLE: procurement_officer
BUTTON_OR_ACTION: View Purchase Order Details
PRECONDITIONS:
- وجود أمر شراء مسجل مسبقاً في قاعدة البيانات للمستأجر الحالي.
SAFE_TEST_DATA:
- tenantId: 'tenant_test_123'
- purchaseOrderId: 'po_test_789'
STEPS:
1. الانتقال إلى جدول أوامر الشراء.
2. الضغط على زر "عرض التفاصيل" أو الضغط على رقم أمر الشراء.
3. مراجعة بنود وتفاصيل أمر الشراء والأسعار والضرائب المطبقة.
EXPECTED_RESULT:
- عرض تفاصيل أمر الشراء والبنود والضرائب والكميات بدقة بدون أي أخطاء ترجمة أو مشاكل عرض.
NEGATIVE_CASES:
- محاولة عرض تفاصيل أمر شراء غير موجود (يعاد توجيهه إلى صفحة 404 أو تظهر رسالة تنبيه).
- محاولة عرض أمر شراء تابع لمستأجر آخر (يتم حظر الطلب وإرجاع 403 أو 404).
PERMISSION_RULES:
- يجب أن يمتلك المستخدم صلاحية 'view' على موديول 'purchases'.
TENANT_ISOLATION_REQUIREMENT:
- التحقق الإجباري من تطابق tenantId للمستأجر الحالي مع tenantId الخاص بأمر الشراء المطلوب.
DB_WRITE_ALLOWED: NO
FINANCIAL_POSTING_ALLOWED: NO
PRODUCTION_ALLOWED: YES (للقراءة فقط)
TEST_DB_REQUIRED: NO
AUTOMATION_STATUS: PARTIALLY_AUTOMATED
RELATED_TEST_FILE: tests/purchase-orders-ui.test.ts
RISK_LEVEL: MEDIUM
NOTES:
- تم تأمين هذا العرض للتأكد من عدم حدوث أخطاء runtime أثناء تعبئة الحقول والضرائب.
