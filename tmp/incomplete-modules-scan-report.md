# تقرير فحص الأقسام غير المكتملة (Incomplete Modules Scan Report)

بناءً على الفحص المعمق باستخدام `DEEP SCAN LEVEL 3`، تم تحديد الأقسام التي تظهر كغير مكتملة (تستخدم `FeatureDisabledPanel` أو مشابه) وتصنيفها حسب الأثر والمخاطر.

## 1. ملخص الفحص
تم العثور على **31** قسماً غير مكتمل في النظام، جميعها تستخدم مكون `FeatureDisabledPanel` لمنع المستخدمين من الدخول إليها، حيث تتراوح بين غياب كامل للـ API أو واجهة قيد التطوير رغم وجود الـ API.

---

## 2. التصنيف وخطة الإصلاح

### 🔴 أولاً: أقسام خطرة مالياً/مخزونياً/تصنيعياً (تحتاج حوكمة صارمة)
هذه الأقسام تمتلك API مبدئي (`apiExists: true`) لكنها غير مربوطة بالواجهة أو معطلة، وتتطلب حوكمة دقيقة (Period Lock, Tenant Isolation, Idempotency) قبل التفعيل:

| اسم القسم | مسار الواجهة (UI) | مسار API | حالة الاكتمال | درجة الخطورة | خطة الإصلاح (PLAN) | متطلبات الحوكمة / الاختبار |
|---|---|---|---|---|---|---|
| **Accounting Inter-Company** | `/accounting/inter-company` | `/api/accounting/inter-company` | API موجود، UI معطل | 🔴 عالية جداً (مالي) | 1. تدقيق الـ API للتأكد من تطبيق `runInventoryTx`/`runFinancialTx`. 2. استكمال الـ UI. | Tenant Isolation + Period Lock |
| **POS Accountant** | `/pos/accountant` | `/api/pos/accountant` | API موجود، UI معطل | 🔴 عالية جداً (مالي) | 1. التأكد من معالجة قيود الـ POS والتسويات. 2. بناء واجهة المراجعة. | Period Lock + Idempotency |
| **Treasury Cash Forecast** | `/treasury/cash-forecast` | `/api/treasury/cash-forecast` | API موجود، UI معطل | 🟠 عالية (مالي) | 1. تفعيل الواجهة للاستعلام فقط (Read-only). | لا تحتاج Period lock إذا كانت قراءة فقط، لكن Tenant ID الزامي. |
| **Manufacturing APS** | `/manufacturing/aps` | `/api/manufacturing/aps` | API موجود، UI معطل | 🔴 عالية جداً (تصنيع) | 1. ربط الواجهة بمحرك الجدولة. 2. التأكد من فصل المستأجرين. | Tenant Isolation + Transactional Integrity |
| **WMS Waves** | `/wms/waves` | `/api/wms/waves` | API موجود، UI معطل | 🔴 عالية (مخزون) | 1. التحقق من تخصيص المخزون (Allocation). 2. ربط الواجهة. | Tenant Isolation + Idempotency |
| **Pharmacy** | `/pharmacy` | `/api/pharmacy` | API موجود، UI معطل | 🔴 عالية (طبي/مخزون) | 1. استكمال شاشات الصرف. | Tenant Isolation + Strict Validation |

---

### 🟡 ثانياً: أقسام API موجودة ويمكن تفعيلها بأمان (لا تمس Business Logic مالي)
هذه الأقسام تحليلية أو تشغيلية لا تؤثر على القيود المحاسبية أو المخزون، ويمكن تفعيلها بمجرد ربط الـ UI:

| اسم القسم | مسار الواجهة (UI) | مسار API | حالة الاكتمال | درجة الخطورة | خطة الإصلاح (PLAN) | متطلبات الحوكمة |
|---|---|---|---|---|---|---|
| **AI Demand Forecast** | `/ai/demand-forecast` | `/api/ai/demand-forecast` | API موجود، UI معطل | 🟢 منخفضة (تحليلي) | بناء الواجهة لطلب التوقعات وعرضها. | قراءة فقط (Read-only) + Tenant ID |
| **AI NLQ** | `/ai/nlq` | `/api/ai/nlq` | API موجود، UI معطل | 🟢 منخفضة (تحليلي) | تفعيل المحادثة لطلب تقارير قواعد البيانات. | Tenant ID + RLS (Row Level Security) |
| **AI Sales Coach** | `/ai/sales-coach` | `/api/ai/sales-coach` | API موجود، UI معطل | 🟢 منخفضة (تحليلي) | تفعيل الواجهة لتدريب المناديب. | Tenant ID |
| **Preventive Maintenance** | `/maintenance/preventive` | `/api/maintenance/preventive` | API موجود، UI معطل | 🟡 متوسطة (تشغيلي) | بناء واجهة جدولة الصيانة وربطها بالـ API. | Tenant ID |
| **Spend Analytics** | `/procurement/spend-analytics` | `/api/procurement/spend-analytics` | API موجود، UI معطل | 🟢 منخفضة (تحليلي) | عرض الرسوم البيانية للإنفاق. | Tenant ID |
| **Supplier Contracts** | `/procurement/supplier-contracts` | `/api/procurement/supplier-contracts` | API موجود، UI معطل | 🟡 متوسطة (تشغيلي) | بناء واجهة إدارة العقود والموافقات. | Tenant ID + Workflow Auth |
| **State Machine Builder**| `/settings/state-machine` | `/api/settings/state-machine` | API موجود، UI معطل | 🟠 عالية (حوكمة) | ربط واجهة بناء سير العمل بالـ API. | Super Admin Auth + Tenant ID |

---

### ⚪ ثالثاً: أقسام ناقصة بالكامل (UI موجود كمسار لكن لا يوجد API)
تتطلب بناء الـ Backend والـ Frontend بالكامل، وهي تعتبر Placeholder:

| اسم القسم | مسار الواجهة (UI) | مسار API (غير متوفر) | درجة الخطورة | خطة الإصلاح |
|---|---|---|---|---|
| **Marketing Analytics** | `/marketing/analytics` | `/api/marketing/analytics` | 🟢 منخفضة | بناء Schema إن لزم، و API للاستعلامات، ثم بناء الـ UI. |
| **CRM CX/NPS** | `/crm/cx-nps` | `/api/crm/cx-nps` | 🟢 منخفضة | بناء نظام استطلاعات الرأي والتقييمات. |
| **CRM Key Accounts** | `/crm/key-accounts` | `/api/crm/key-accounts` | 🟢 منخفضة | بناء هيكل حسابات العملاء الرئيسية. |
| **Enterprise Portfolio** | `/enterprise/portfolio` | `/api/enterprise/portfolio` | 🟡 متوسطة | بناء نظام المحافظ الاستثمارية (يحتاج دراسة هيكلية). |
| **Enterprise EVM** | `/enterprise/projects/evm` | `/api/enterprise/projects/evm` | 🟡 متوسطة | بناء محرك القيمة المكتسبة للمشاريع (Earned Value). |
| **Fleet Tracking** | `/fleet/tracking` | `/api/fleet/tracking` | 🟡 متوسطة | بناء تكامل مع أجهزة GPS وخرائط حية. |
| **Pharmacy Manager** | `/pharmacy/manager` | `/api/pharmacy/manager` | 🔴 عالية | بناء شاشات إدارة المخزون الدوائي والصلاحيات. |
| **Price Comparison** | `/procurement/price-comparison` | `/api/procurement/price-comparison` | 🟢 منخفضة | بناء أداة المقارنة التلقائية لعروض الموردين. |
| **Vendor Scorecard** | `/procurement/vendor-scorecard` | `/api/procurement/vendor-scorecard` | 🟢 منخفضة | بناء نظام تقييم الموردين (KPIs). |
| **BI Cube Reports** | `/reports/bi-cube` | `/api/reports/bi-cube` | 🟢 منخفضة | بناء مستودع البيانات وربط أداة OLAP. |
| **CPQ Sales** | `/sales/cpq` | `/api/sales/cpq` | 🟠 عالية | بناء محرك تسعير المنتجات المعقدة. |
| **Smart Map Sales** | `/sales/smart-map` | `/api/sales/smart-map` | 🟢 منخفضة | تكامل الخرائط لتوزيع المناديب. |
| **SSO Settings** | `/settings/sso` | `/api/settings/sso` | 🟠 عالية | ربط SAML/OIDC. |
| **Webhooks Settings** | `/settings/webhooks` | `/api/settings/webhooks` | 🟠 عالية | بناء محرك إدارة Webhooks والتسليم. |
| **Shifts Monitor** | `/shifts/monitor` | `/api/shifts/monitor` | 🟡 متوسطة | بناء لوحة مراقبة الورديات الحية. |
| **Help Desk** | `/support/help-desk` | `/api/support/help-desk` | 🟢 منخفضة | بناء نظام التذاكر. |
| **SLA Support** | `/support/sla` | `/api/support/sla` | 🟢 منخفضة | محرك تتبع الـ SLA والمخالفات. |

---

## 3. التوصيات العامة قبل التنفيذ المستقبلي
1. **عدم إزالة `FeatureDisabledPanel` من أي قسم مالي أو مخزوني (مثل APS أو WMS أو POS)** إلا بعد إجراء اختبارات شاملة مع محركات الـ `runInventoryTx` و `runFinancialTx`.
2. الأقسام التحليلية (التي تبدأ بـ `AI` أو تخص الـ `Analytics`) تعتبر **منخفضة الخطورة** (Low Hanging Fruits)، ويمكن البدء بها لتحقيق مكاسب سريعة للمستخدمين.
3. الأقسام التي تفتقر لـ API يجب تصميم **Schema** خاص بها واعتماده قبل كتابة أي كود.
