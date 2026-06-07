# خريطة ربط السيناريوهات بحامل الاختبار المتوازي (SCENARIO_TO_PARALLEL_HARNESS_MAPPING_AR)

يوضح هذا المستند كيفية ربط كل سيناريو برمجي متبقي يتطلب قاعدة بيانات اختبار معزولة بالحزم (Groups) المتوازية المناسبة وموجة التنفيذ القادمة، مع توضيح متطلبات التهيئة والتراجع وصلاحيات الأمان.

---

## 📊 جدول ربط السيناريوهات بالـ Harness المتوازي (Parallel Harness Mapping Table)

| المعرف (ID) | الموديول (Module) | الحزمة المتوازية (Group) | طبقة الـ Harness | متطلب التهيأة (Seed) | متطلب التراجع (Rollback) | الحالة الحالية | الموجة القادمة | ملاحظات الأمان والتحقق |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SCN-GL-001** | Accounting | GROUP_A_FINANCE_ACCOUNTING | Integration Test DB | نعم (دليل الحسابات والأرصدة) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H3 (Finance) | FINANCE_PURE_ASSERTIONS_READY - يتطلب فترة مالية مفتوحة وصلاحيات محاسب |
| **SCN-GL-003** | Accounting | GROUP_A_FINANCE_ACCOUNTING | Integration Test DB | نعم (فواتير مستحقة متأخرة) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H3 (Finance) | FINANCE_PURE_ASSERTIONS_READY - يجب محاكاة خوادم إرسال SMS/Email بالكامل |
| **SCN-ASST-001** | Assets | GROUP_A_FINANCE_ACCOUNTING | Integration Test DB | نعم (أصول رأسمالية وقيمة خردة) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H3 (Finance) | FINANCE_PURE_ASSERTIONS_READY - يتطلب معالجة الإهلاك والتأكد من مجمع الإهلاك |
| **SCN-POS-001** | Sales | GROUP_B_SALES_POS | Integration Test DB | نعم (أصناف ووردية كاشير نشطة) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H4 (Sales/POS) | FINANCE_PURE_ASSERTIONS_READY - يجب محاكاة websocket واتصالات طابعة QZ Tray |
| **SCN-SAL-002** | Sales | GROUP_B_SALES_POS | Integration Test DB | نعم (فاتورة أصلية مرحلة مسبقاً) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H4 (Sales/POS) | FINANCE_PURE_ASSERTIONS_READY - التحقق من عدم تجاوز كمية المرتجع للكمية المباعة |
| **SCN-POS-002** | Sales | GROUP_B_SALES_POS | Integration Test DB | نعم (طاولات صالة وقائمة طعام) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H4 (Sales/POS) | FINANCE_PURE_ASSERTIONS_READY - محاكاة websocket الخاص بـ KDS وحالة الطاولات |
| **SCN-INV-001** | Inventory | GROUP_C_INVENTORY_WAREHOUSE | Integration Test DB | نعم (مستودعين وأرصدة بضائع) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H5 (Inventory) | FINANCE_PURE_ASSERTIONS_READY - التحقق من صحة atomic stock transfer ومنع السالب |
| **SCN-INV-002** | Inventory | GROUP_C_INVENTORY_WAREHOUSE | Integration Test DB | نعم (أوراق جرد وكميات دفترية) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H5 (Inventory) | FINANCE_PURE_ASSERTIONS_READY - حساب أثر فروقات متوسط التكلفة وضريبة الفروق |
| **SCN-PUR-002** | Purchases | GROUP_D_PURCHASES_APPROVALS | Integration Test DB | نعم (سند استلام مخزني GRN مرحل) | نعم (Prisma transaction) | NEEDS_ISOLATED_TEST_DB | Wave H6 (Purchases) | FINANCE_PURE_ASSERTIONS_READY - التحقق من صلاحية أمين المستودع وتخفيض الكميات |
| **SCN-COMP-WPS** | Compliance | GROUP_E_COMPLIANCE_EXTERNAL | Manual / Mock only | لا يوجد | لا يوجد | NOT_STARTED | Wave H7 (Compliance) | فحص يدوي / محاكاة الاتصال الفعلي الخارجي فقط |
| **SCN-ZATCA-REAL**| Compliance | GROUP_E_COMPLIANCE_EXTERNAL | Manual / Mock only | لا يوجد | لا يوجد | NOT_STARTED | Wave H7 (Compliance) | فحص يدوي / تجنب الإرسال الفعلي لبيئة إنتاج هيئة الزكاة |
