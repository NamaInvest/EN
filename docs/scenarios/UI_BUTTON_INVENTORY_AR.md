# سجل وجرد العناصر التفاعلية والأزرار (UI Button Inventory)

يحتوي هذا الملف على حصر شامل ودقيق للعناصر التفاعلية والأزرار الرئيسية في واجهات نظام نما إنفست ERP، مع تحديد مستوى الخطر التقني والربط البرمجي لكل عنصر.

| الموديول الرئيسي | الصفحة / المسار | نص العنصر التفاعلي | نوع العنصر | اسم الـ Handler / الـ API المرتبط | الحالة الفعلية | مستوى الخطر | معرف السيناريو |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **المحاسبة** | `/accounting/journal/new` | ترحيل القيد | Button | `POST /api/accounting/journal` | مكتمل | خطر (كتابة مالية) | SCN-ACCOUNTING-001 |
| **المحاسبة** | `/accounting/journal` | عكس القيد اليومي | Button | `POST /api/accounting/reversal` | مكتمل | خطر (عكس مالي) | SCN-ACCOUNTING-001 |
| **المحاسبة** | `/accounting/period-lock` | قفل الفترة المالية المحاسبية | Button | `POST /api/accounting/period-lock` | مكتمل | خطر حرج (قفل نظام) | SCN-ACCOUNTING-001 |
| **المبيعات** | `/sales/orders` | إصدار واعتماد الفاتورة | Button | `POST /api/sales/orders` | مكتمل | خطر (فاتورة زكاة) | SCN-SALES-001 |
| **المبيعات** | `/sales/orders` | طباعة الفاتورة | Button | `GET /api/sales/orders/generate-pdf`| مكتمل | آمن (عرض فقط) | SCN-SALES-001 |
| **المشتريات** | `/purchases/orders` | مطابقة وأرشفة GR/IR | Button | `POST /api/purchases/matching` | مكتمل | خطر متوسط | SCN-PURCHASES-001 |
| **المشتريات** | `/purchases/orders` | موافقة وتدشين أمر شراء | Button | `POST /api/purchases/orders` | مكتمل | خطر متوسط | SCN-PURCHASES-001 |
| **المخزون** | `/inventory` | اعتماد تسوية كميات الجرد | Button | `POST /api/stock/adjustments` | مكتمل | خطر (كتابة مخزنية) | SCN-INVENTORY-001 |
| **المخزون** | `/inventory` | مسح باركود المنتج | Scanner Input| `onInput / Barcode scan` | مكتمل | آمن | SCN-INVENTORY-001 |
| **الخزينة** | `/treasury/petty-cash` | اعتماد صرف عهدة نقدية | Button | `POST /api/treasury/petty-cash` | مكتمل | خطر (صرف مالي) | SCN-TREASURY-001 |
| **الخزينة** | `/accounting/banks/recon` | تأكيد المطابقة البنكية | Button | `POST /api/accounting/banks/recon/match` | مكتمل | خطر (تسوية بنكية) | SCN-TREASURY-001 |
| **نقاط البيع**| `/pos` | دفع وإصدار الفاتورة | Button | `POST /api/pos/checkout` | مكتمل | خطر (بيع نقدي) | SCN-POS-001 |
| **نقاط البيع**| `/pos` | إغلاق الوردية وترحيل الوردية| Button | `POST /api/pos/accountant` | مكتمل | خطر متوسط | SCN-POS-001 |
| **الموارد البشرية**| `/hr/leaves` | إرسال طلب إجازة | Button | `POST /api/hr/leaves` | مكتمل | آمن | SCN-HR-001 |
| **الموارد البشرية**| `/hr/leaves` | موافقة على طلب إجازة | Button | `PUT /api/approvals` | مكتمل | آمن | SCN-HR-001 |
| **الرواتب** | `/payroll` | اعتماد مسير الرواتب وتوليد WPS | Button | `POST /api/payroll` | مكتمل | خطر حرج (رواتب) | SCN-PAYROLL-001 |
| **الرواتب** | `/payroll` | إعادة احتساب فروقات موظف | Button | `POST /api/payroll/calculate` | مكتمل | خطر متوسط | SCN-PAYROLL-001 |
| **التأسيس** | `/company-setup` | تأكيد وبدء التأسيس | Button | `POST /api/tenant/provision` | مكتمل | خطر حرج (بناء DB) | SCN-ONBOARDING-001 |
| **الذكاء الاصطناعي**| `/ai/bank-fraud` | بدء الفحص والتحليل الذكي | Button | `POST /api/ai/bank-fraud` | مكتمل | آمن (استعلام) | SCN-AI-001 |
| **لوحة التحكم**| `/admin/siem` | تصدير سجلات SIEM الأمنية | Button | `GET /api/admin/audit-logs` | مكتمل | آمن (استعلام) | SCN-SUPERADMIN-001 |
| **الإعدادات** | `/settings/custom-fields` | حفظ وتعريف الحقل المخصص | Button | `POST /api/settings/custom-fields` | مكتمل | آمن | SCN-SETTINGS-001 |
| **الدعم الفني**| `/support/help-desk` | إرسال تذكرة دعم فني جديدة | Button | `POST /api/crm/tickets` | مكتمل | آمن | SCN-SUPPORT-001 |
| **مشغل النظام**| `/desktop/verify-license`| تأكيد وتفعيل الترخيص محلياً | Button | `POST /api/desktop/verify-license`| مكتمل | آمن | SCN-DESKTOP-001 |

---

## تصنيف مخاطر الأزرار التفاعلية (Risk Categorization)

1. **آمن (Safe/Query only):** أزرار الاستعلام، التصدير إلى PDF/Excel، العرض، البحث، والفلترة. يمكن تشغيلها واختبارها بحرية في كل البيئات (بما في ذلك الإنتاج).
2. **خطر متوسط (Medium Risk/Data Mutation):** أزرار الحفظ المبدئي، إنشاء حساب موظف، تعديل ملف عميل، وتقديم طلب إجازة. تسبب تعديلاً على البيانات ولكنها لا تسبب ترحيلاً مالياً أو تأثيراً على البنية التحتية.
3. **خطر (High Risk/Financial & Infrastructure):** أزرار الترحيل المحاسبي، إصدار فواتير الزكاة المعتمدة، اعتماد الرواتب، وتأسيس قواعد البيانات. يمنع اختبارها نهائياً على بيئات الإنتاج ويجب حصر اختبارها في بيئات التطوير الآمنة (`DANGEROUS_NEEDS_SAFE_TEST`).
