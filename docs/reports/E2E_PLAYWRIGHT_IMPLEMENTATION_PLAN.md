# E2E PLAYWRIGHT EXPANSION IMPLEMENTATION PLAN
# خطة تنفيذ وتوسيع اختبارات واجهات الاستخدام الشاملة (Playwright E2E)

---

> [!IMPORTANT]
> - **TRACK ID**: `E2E_READINESS_TRACK` / `GLOBAL_EVALUATION_GAPS_CLOSURE`
> - **GATE STATE**: `GO_FOR_E2E_PLAYWRIGHT_IMPLEMENTATION_PLAN_ONLY` (Planning Gate)
> - **COMPLIANCE ASSURANCES**: Zero runtime code modifications, zero database schema mutations, and zero plaintext credentials. Strictly read-only analysis and design format.

---

## 1. Executive Summary / الملخص التنفيذي

تعد ممارسة اختبارات واجهات الاستخدام الشاملة (**End-to-End Testing**) عبر إطار العمل **Playwright** ركيزة أساسية لضمان نضج وجودة النظام والجاهزية التسويقية للمؤسسات الكبرى (**ENTERPRISE_MARKET_READINESS_TRACK**). يهدف هذا المستند إلى رسم خريطة طريق وهيكلية تقنية تفصيلية لتوسيع اختبارات الواجهات التلقائية لضمان استقرار العمليات المالية والتشغيلية والأمنية لنظام نما ERP، دون إدخال أي مخاطر أو تعديلات تشغيلية على البيئات المباشرة.

---

## 2. Current E2E Baseline / الوضع الحالي لاختبارات الواجهات

بموجب فحص بيئة العمل الحالية:
* **Playwright Configuration**: الملف `playwright.config.ts` نشط ومكتمل ويدعم التشغيل المتوازي وثلاثة مشاريع قياسية (Chromium, iPhone 13 Mobile, and ar-SA RTL).
* **Existing Tests**: الملف `e2e/critical-paths.spec.ts` متواجد ويحتوي على **25 مسار اختبار حرج** تغطي عمليات الـ Auth والـ Dashboard ومسارات الـ APIs الخلفية للمبيعات والمشتريات والمخازن والـ ZATCA والـ SRE Telemetry.

---

## 3. Existing Playwright Config Review / مراجعة إعدادات Playwright

ملف `playwright.config.ts` مصمم بكفاءة عالية:
- يستدعي بيئة التطوير محلياً تلقائياً عبر `npm run dev` عند التشغيل.
- يحتوي على مهلة سخية `120_000ms` لبدء التشغيل لضمان عدم حدوث تعليق (timeouts).
- يسجل لقطات شاشة (Screenshots) وفيديو وتقفي أثر (Traces) تلقائياً عند حدوث أي فشل لتسهيل التنقيح (Debugging).

---

## 4. Existing Critical Paths Review / مراجعة المسارات الحرجة القائمة

تغطي الـ 25 مساراً الحالية الجوانب التشغيلية الأساسية والـ API endpoints، ولكن ينقصها التفاعل الكامل للبصريات في الواجهات (Front-end Visual User Interactions) مثل النقرات الحقيقية في شاشة الكاشير وتتبع النوافذ المنبثقة (Modals) وعزل الكيانات البصري للـ Multi-tenant.

---

## 5. E2E Testing Principles / المبادئ التوجيهية للاختبارات

لتأمين جودة لا تشوبها شائبة:
1. **عزل الاختبارات**: يجب تشغيل كل اختبار في سياق مستقل (Isolated Context) تماماً.
2. **عدم مس كود الإنتاج (Zero-Mutation)**: تُشغل الاختبارات بالكامل محلياً أو على خوادم الاستضافة التجريبية (Staging) مع استبعاد تام لأي تعديلات تشغيلية.
3. **سلامة البيانات المحاسبية**: يمنع منعاً باتاً ترحيل أي معاملات مالية حقيقية أو استدعاء خوادم ZATCA المباشرة.

---

## 6. Proposed E2E File Structure / الهيكلية المقترحة لملفات الاختبار

لتنظيم مستودع الاختبارات بنظام ناضج ومحكم:

```text
e2e/
├── auth/
│   └── auth.spec.ts                 # اختبارات صفحات الدخول والخروج وحماية الجلسات
├── rbac/
│   └── protected-routes.spec.ts     # اختبارات صلاحيات المستخدمين والمسارات المغلقة
├── tenant/
│   └── tenant-isolation-smoke.spec.ts # اختبارات كشف ومنع تسريب بيانات المستأجرين بصرياً
├── observability/
│   └── health-siem-metrics.spec.ts # اختبارات صحة المؤشرات وسجلات SIEM
└── commercial/ (Future Wave 2)
    ├── sales-invoice.spec.ts        # اختبارات دورة الفواتير والمبيعات الكاملة
    └── pos-cashier.spec.ts          # اختبارات شاشة الكاشير اللوحية ونقاط البيع
```

---

## 7. Priority Flows Table / جدول تدفقات واجهات العمل ذات الأولوية

| Flow Name | Target UI / Page | Type of Check | Success Criteria | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Shield** | `/login` and `/dashboard` | Page Load & Redirection | Redirect unauthenticated to login | High |
| **RBAC Guard** | `/settings` and `/admin` | Authorization Block | Return 403 or block side-nav | High |
| **Tenant Boundary**| Hostname subdomain parser | Data Leak Prevention | Subdomain context binds to session | Critical |
| **SRE Endpoints** | `/api/metrics`, `/api/sys/health` | Security Protection | Returns 401 if token missing | High |
| **POS Cashier** | `/restaurant` | Responsive Usability | Touch layouts load cleanly | Medium |

---

## 8. Test Data Strategy / استراتيجية بيانات الاختبار

* **حسابات تجريبية موحدة**: استخدام حسابات ومستخدمين مسبقين محليين (Admin, Cashier, Guest) بدون كلمات مرور حقيقية.
* **البيانات المالية المحاكاة**: تعبئة المنتجات والحسابات المحاسبية من ملفات Seed المحلية المدمجة (`socpa-coa.json`).

---

## 9. Environment Strategy / استراتيجية البيئات التشغيلية

* **البيئة المستهدفة**: تُشغل الفحوصات حصراً في البيئة المحلية (`http://localhost:3000`) أو Staging المخصصة.
* **الإنتاج معزول كلياً**: يمنع تشغيل أي اختبار كتابة أو مصادقة في بيئة العميل المباشرة.

---

## 10. CI Integration Plan / خطة التكامل المستمر لـ CI

سيتم إدراج فحوصات Playwright ضمن خطة الحوكمة والتحقق لبيئة GitHub Actions (`ci.yml`) لتعمل تلقائياً كبوابة أمان تمنع دمج أي كود لا يجتاز اختبارات الواجهات بنجاح 100%.

---

## 11. Playwright Config Recommendations / توصيات تعديل الإعدادات

* إبقاء الفحص المتوازي (fullyParallel: true) مفعلاً لتقليص زمن الانتظار في خوادم البناء.
* ضبط التباطؤ (slowMo) محلياً بـ 50ms لمحاكاة حركة المستخدم الحقيقية بشكل أكثر وضوحاً.

---

## 12. Security & Tenant Isolation Coverage / تغطية عزل المستأجرين والأمان

* فحص استجابة الواجهة عند تغيير رأس `x-tenant` يدوياً في المتصفح، للتأكد من قيام السيرفر بصد العملية فوراً وعرض شاشة خطأ مخصصة.

---

## 13. Mobile & RTL E2E Coverage / تغطية واجهات الجوال واللغة العربية

* تفعيل مشروع `mobile` في ملف الإعدادات لمحاكاة أجهزة iPhone 13 لتأكيد تجاوب لوحة التحكم وعدم انقطاع النصوص العربية ذات محاذاة RTL.

---

## 14. Risks & Mitigations / المخاطر وحلول التخفيف

* **خطر البطء في خوادم CI**: يتم تخفيفه عبر تجميد الصور الثقيلة وفصل مشاريع المتصفحات غير الأساسية.
* **خطر البيانات الميتة (Stale Data)**: تصفية وتنظيف أي بيانات محلية منشأة بعد كل دورة اختبار باستخدام خطافات `afterAll`.

---

## 15. Implementation Waves / موجات التنفيذ المقررة

1. **Wave 1 (Auth, RBAC, and Observability)**: اختبارات الجدران الأمنية وتأمين المراقبة وعزل المستأجرين قراءة فقط (آمنة تماماً ولا تشوبها شائبة).
2. **Wave 2 (Commercial Flows Plan & Staging)**: اختبارات دورات المبيعات والـ POS والمخازن في بيئات Staging معزولة.
3. **Wave 3 (Mobile & RTL Viewports)**: محاكاة الهواتف واللوحيات والتأكد من ملاءمة المظاهر Cairo/Inter.

---

## 16. Acceptance Criteria / معايير القبول والنجاح للـ E2E

* نجاح تشغيل مسارات الاختبار المعنية بـ 0 فشل.
* خلو كامل لتقارير Git من أي ملفات مؤقتة أو أسرار حساسة.
* نظافة تامة لشجرة العمل بعد عمليات الدفع البرمجي.

---

## 17. Next Gates / البوابات التشغيلية القادمة

1. **`GO_FOR_E2E_PLAYWRIGHT_WAVE1_AUTH_RBAC_IMPLEMENTATION_ONLY`** (تنفيذ اختبارات Wave 1 الأمنية المعزولة)
2. **`GO_FOR_MOBILE_UX_AUDIT_AND_PLAN_ONLY`** (التوقف التشغيلي الحاكم للمسار التجاري)

---

## 18. Final Decision / القرار الفني النهائي المعتمد

> [!NOTE]
> ### COMMERCIAL_READINESS_PLAN_COMPLETED
> ### ENTERPRISE_MARKET_READINESS_TRACK
> ### GLOBAL_EVALUATION_GAPS_CLOSURE
