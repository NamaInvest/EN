# مصفوفة ربط الواجهات البرمجية (UI/API Wiring Matrix)

توضح هذه المصفوفة مستوى الترابط البرمجي بين واجهات المستخدم الأمامية (Frontend pages/buttons) ونقاط النهاية الخلفية (Backend API Routes)، مع استعراض مستوى الأمان والحراسة المطبق لكل منها.

| الصفحة الأمامية | الزر / النموذج | مسار الـ API المرتبط | طريقة الطلب (Method) | يتطلب مصادقة (Auth) | عزل المستأجر (Tenant Id) | حارس الصلاحيات (RBAC) | الحارس المالي (GL Guard) | الحالة البرمجية | معرف السيناريو |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/sign-up` | نموذج التسجيل | `/api/auth/sign-up` | POST | لا | لا | لا | لا | مكتمل | SCN-PUBLIC-001 |
| `/company-setup` | زر بدء التأسيس | `/api/tenant/provision` | POST | نعم | نعم (عبر المعالج) | لا | لا | مكتمل | SCN-ONBOARDING-001 |
| `/login` | نموذج الدخول | `/api/auth/login` | POST | لا | لا | لا | لا | مكتمل | SCN-AUTH-001 |
| `/admin/siem` | لوحة مراقبة الأمان | `/api/admin/audit-logs` | GET | نعم | لا (منصة عليا) | نعم (SuperAdmin) | لا | مكتمل | SCN-SUPERADMIN-001 |
| `/settings/roles` | زر حفظ الدور والصلاحية | `/api/settings/roles` | POST | نعم | نعم | نعم (TenantAdmin) | لا | مكتمل | SCN-TENANTADMIN-001 |
| `/accounting/journal/new` | زر ترحيل قيد يومية | `/api/accounting/journal` | POST | نعم | نعم | نعم (Accountant) | نعم (فحص القفل المالي) | مكتمل | SCN-ACCOUNTING-001 |
| `/sales/orders` | زر اعتماد وإرسال فاتورة | `/api/sales/orders` | POST | نعم | نعم | نعم (Sales User) | نعم (ترحيل مالي تلقائي) | مكتمل | SCN-SALES-001 |
| `/purchases/orders` | زر تأكيد ومطابقة GR/IR | `/api/purchases/matching` | POST | نعم | نعم | نعم (Purchases User)| نعم (مطابقة الأسعار) | مكتمل | SCN-PURCHASES-001 |
| `/inventory` | زر تسوية جرد المستودع | `/api/stock/adjustments` | POST | نعم | نعم | نعم (Inventory User)| نعم (القيود التلقائية) | مكتمل | SCN-INVENTORY-001 |
| `/treasury/petty-cash` | زر صرف عهدة نقدية | `/api/treasury/petty-cash` | POST | نعم | نعم | نعم (Treasury User)| نعم (حسابات الصندوق) | مكتمل | SCN-TREASURY-001 |
| `/pos` | زر إتمام البيع السريع | `/api/pos/checkout` | POST | نعم | نعم | نعم (Cashier User) | نعم (قيد مبيعات POS) | مكتمل | SCN-POS-001 |
| `/hr/leaves` | نموذج تقديم طلب إجازة | `/api/hr/leaves` | POST | نعم | نعم | نعم (Employee) | لا | مكتمل | SCN-HR-001 |
| `/payroll` | زر تشغيل الرواتب وإصدار WPS | `/api/payroll` | POST | نعم | نعم | نعم (Payroll User) | نعم (قيد الاستحقاق) | مكتمل | SCN-PAYROLL-001 |
| `/crm/leads` | زر تحويل العميل المحتمل | `/api/crm/leads/[id]/convert` | POST | نعم | نعم | نعم (CRM User) | لا | مكتمل | SCN-CRM-001 |
| `/enterprise/projects` | زر حفظ لقطة أداء المشروع | `/api/enterprise/projects` | POST | نعم | نعم | نعم (Project Manager)| لا | مكتمل | SCN-PROJECTS-001 |
| `/manufacturing/boms` | زر اعتماد شجرة التصنيع | `/api/manufacturing/boms` | POST | نعم | نعم | نعم (Manufacturing) | نعم (التكلفة المعيارية) | مكتمل | SCN-MANUFACTURING-001 |
| `/pharmacy` | نموذج استعلام تداخل أدوية | `/api/pharmacy/drug-interact` | POST | نعم | نعم | نعم (Pharmacy User) | لا | مكتمل | SCN-PHARMACY-001 |
| `/enterprise/wms` | زر تحويل البضائع للرفوف | `/api/enterprise/wms` | POST | نعم | نعم | نعم (Warehouse User) | لا | مكتمل | SCN-WMS-001 |
| `/reports/cashflow` | زر استعلام الأرصدة المالية | `/api/accounting/trial-balance` | GET | نعم | نعم | نعم (Accountant) | نعم (قفل الفحص للتقارير) | مكتمل | SCN-REPORTS-001 |
| `/ai/bank-fraud` | زر فحص الأنماط الاحتيالية | `/api/ai/bank-fraud` | POST | نعم | نعم | نعم (Audit Role) | لا | مكتمل | SCN-AI-001 |
| `/settings/custom-fields`| زر حفظ الحقل المخصص | `/api/settings/custom-fields` | POST | نعم | نعم | نعم (TenantAdmin) | لا | مكتمل | SCN-SETTINGS-001 |
| `/support/help-desk` | زر إرسال تذكرة فنية | `/api/crm/tickets` | POST | نعم | نعم | نعم (Active User) | لا | مكتمل | SCN-SUPPORT-001 |
| `/desktop/verify-license`| زر تفعيل الرخصة محلياً | `/api/desktop/verify-license` | POST | نعم | نعم | نعم (Active User) | لا | مكتمل | SCN-DESKTOP-001 |

---

## تفاصيل آليات الربط والحماية البرمجية (Security Integration Details)

1. **حراسة معرف المستأجر (Tenant Id Guard):** يتم تأمين جميع مسارات الـ APIs الخلفية عن طريق استخلاص الـ `tenantId` من الجلسة الموثقة (JWT Session) وليس من الـ Payload المرسل من العميل، مما يمنع نهائياً ثغرات الـ IDOR وتسريب البيانات بين الشركات (Cross-tenant Data Leakage).
2. **عزل الماستر (Master Bypass Prevention):** لا يمكن للـ Tenant Admin استدعاء أي من الـ API Routes المخصصة للإدارة العليا للماستر (مثل `/api/admin/audit-logs`) حيث تخضع لفحص صارم للـ `role == 'SUPER_ADMIN'` على مستوى خادم الويب الأساسي.
3. **حماية الفترات المحاسبية المقفلة (Period Lock Checks):** تخضع كافة مسارات الـ APIs التي تسبب ترحيلاً محاسبياً أو حركات قيود في الدفتر العام لفلتر فحص تلقائي للتاريخ المرسل يمنع معالجة المعاملة إذا كانت الفترة مغلقة.
