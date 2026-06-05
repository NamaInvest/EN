# سجل وجرد العناصر التفاعلية والأزرار (UI Button Inventory)

يحتوي هذا الملف على حصر شامل ودقيق للعناصر التفاعلية والأزرار الرئيسية في واجهات نظام نما إنفست ERP، مع تحديد متطلبات ومخاطر واجهة الاستخدام والـ API المرتبط بها.

| Module | Page | Element | Type | Handler/API | Expected Behavior | Safety Class | Scenario ID | Status | Missing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| المحاسبة | /accounting/journal/new | ترحيل القيد | Button | POST /api/accounting/journal | حفظ وترحيل قيد اليومية في الحسابات | خطر (كتابة مالية) | SCN-ACCOUNTING-001 | مكتمل | لا يوجد |
| المحاسبة | /accounting/journal | عكس القيد اليومي | Button | POST /api/accounting/reversal | إلغاء وعكس القيد اليومي المحدد وإنشاء قيد عكسي | خطر (عكس مالي) | SCN-ACCOUNTING-001 | مكتمل | لا يوجد |
| المحاسبة | /accounting/period-lock | قفل الفترة المالية المحاسبية | Button | POST /api/accounting/period-lock | إغلاق الفترة ومنع أي تعديل أو كتابة قيود فيها | خطر حرج (قفل نظام) | SCN-ACCOUNTING-001 | مكتمل | لا يوجد |
| المبيعات | /sales/orders | إصدار واعتماد الفاتورة | Button | POST /api/sales/orders | ترحيل الفاتورة للزكاة واعتمادها رسمياً | خطر (فاتورة زكاة) | SCN-SALES-001 | مكتمل | لا يوجد |
| المبيعات | /sales/orders | طباعة الفاتورة | Button | GET /api/sales/orders/generate-pdf | توليد ملف PDF للفاتورة وعرضه للطباعة | آمن (عرض فقط) | SCN-SALES-001 | مكتمل | لا يوجد |
| المشتريات | /purchases/orders | مطابقة وأرشفة GR/IR | Button | POST /api/purchases/matching | مطابقة إيصالات المخازن وفواتير الموردين | خطر متوسط | SCN-PURCHASES-001 | مكتمل | لا يوجد |
| المشتريات | /purchases/orders | موافقة وتدشين أمر شراء | Button | POST /api/purchases/orders | اعتماد أمر الشراء وإرساله للمورد | خطر متوسط | SCN-PURCHASES-001 | مكتمل | لا يوجد |
| المخزون | /inventory | اعتماد تسوية كميات الجرد | Button | POST /api/stock/adjustments | حفظ الفروقات وتعديل كميات المخازن الفعلية | خطر (كتابة مخزنية) | SCN-INVENTORY-001 | مكتمل | لا يوجد |
| المخزون | /inventory | مسح باركود المنتج | Scanner Input | onInput / Barcode scan | البحث التلقائي وإدخال المنتج عبر الباركود | آمن | SCN-INVENTORY-001 | مكتمل | لا يوجد |
| الخزينة | /treasury/petty-cash | اعتماد صرف عهدة نقدية | Button | POST /api/treasury/petty-cash | صرف وتسجيل عهدة مالية للموظف | خطر (صرف مالي) | SCN-TREASURY-001 | مكتمل | لا يوجد |
| الخزينة | /accounting/banks/recon | تأكيد المطابقة البنكية | Button | POST /api/accounting/banks/recon/match | مطابقة كشف الحساب الفعلي مع السجلات المالية للشركة | خطر (تسوية بنكية) | SCN-TREASURY-001 | مكتمل | لا يوجد |
| نقاط البيع | /pos | دفع وإصدار الفاتورة | Button | POST /api/pos/checkout | إجراء البيع الفوري وترحيل العملية نقدياً للزكاة | خطر (بيع نقدي) | SCN-POS-001 | مكتمل | لا يوجد |
| نقاط البيع | /pos | إغلاق الوردية وترحيل الوردية | Button | POST /api/pos/accountant | إنهاء الوردية وترحيل المبالغ المستلمة للنظام المالي | خطر متوسط | SCN-POS-001 | مكتمل | لا يوجد |
| الموارد البشرية | /hr/leaves | إرسال طلب إجازة | Button | POST /api/hr/leaves | إرسال الطلب للاعتماد في النظام الخاص بالموظفين | آمن | SCN-HR-001 | مكتمل | لا يوجد |
| الموارد البشرية | /hr/leaves | موافقة على طلب إجازة | Button | PUT /api/approvals | اعتماد الإجازة وتحديث رصيد أيام الموظف | آمن | SCN-HR-001 | مكتمل | لا يوجد |
| الرواتب | /payroll | اعتماد مسير الرواتب وتوليد WPS | Button | POST /api/payroll | إقفال حسابات الرواتب وإنشاء ملف حماية الأجور السعودي | خطر حرج (رواتب) | SCN-PAYROLL-001 | مكتمل | لا يوجد |
| الرواتب | /payroll | إعادة احتساب فروقات موظف | Button | POST /api/payroll/calculate | احتساب المستحقات الإضافية أو الخصومات للشهر الحالي | خطر متوسط | SCN-PAYROLL-001 | مكتمل | لا يوجد |
| التأسيس | /company-setup | تأكيد وبدء التأسيس | Button | POST /api/tenant/provision | بناء قاعدة بيانات العميل وتخصيص بيئة المستأجر | خطر حرج (بناء DB) | SCN-ONBOARDING-001 | مكتمل | لا يوجد |
| الذكاء الاصطناعي | /ai/bank-fraud | بدء الفحص والتحليل الذكي | Button | POST /api/ai/bank-fraud | تحليل سلوك المعاملات وكشف الحركات المشبوهة | آمن (استعلام) | SCN-AI-001 | مكتمل | لا يوجد |
| لوحة التحكم | /admin/siem | تصدير سجلات SIEM الأمنية | Button | GET /api/admin/audit-logs | جلب سجلات مراقبة الدخول ومحاولات الاختراق الأمني | آمن (استعلام) | SCN-SUPERADMIN-001 | مكتمل | لا يوجد |
| الإعدادات | /settings/custom-fields | حفظ وتعريف الحقل المخصص | Button | POST /api/settings/custom-fields | تخزين تعريفات الحقول الديناميكية الجديدة | آمن | SCN-SETTINGS-001 | مكتمل | لا يوجد |
| الدعم الفني | /support/help-desk | إرسال تذكرة دعم فني جديدة | Button | POST /api/crm/tickets | فتح تذكرة ومتابعة شكاوى المستخدمين وعملاء النظام | آمن | SCN-SUPPORT-001 | مكتمل | لا يوجد |
| مشغل النظام | /desktop/verify-license | تأكيد وتفعيل الترخيص محلياً | Button | POST /api/desktop/verify-license | التحقق من صلاحية مفتاح الترخيص للنسخة المكتبية | آمن | SCN-DESKTOP-001 | مكتمل | لا يوجد |

---

## تصنيف مخاطر الأزرار التفاعلية (Risk Categorization)

1. **آمن (Safe/Query only):** أزرار الاستعلام، التصدير إلى PDF/Excel، العرض، البحث، والفلترة. يمكن تشغيلها واختبارها بحرية في كل البيئات (بما في ذلك الإنتاج).
2. **خطر متوسط (Medium Risk/Data Mutation):** أزرار الحفظ المبدئي، إنشاء حساب موظف، تعديل ملف عميل، وتقديم طلب إجازة. تسبب تعديلاً على البيانات ولكنها لا تسبب ترحيلاً مالياً أو تأثيراً على البنية التحتية.
3. **خطر (High Risk/Financial & Infrastructure):** أزرار الترحيل المحاسبي، إصدار فواتير الزكاة المعتمدة، اعتماد الرواتب، وتأسيس قواعد البيانات. يمنع اختبارها نهائياً على بيئات الإنتاج ويجب حصر اختبارها في بيئات التطوير الآمنة (`DANGEROUS_NEEDS_SAFE_TEST`).
