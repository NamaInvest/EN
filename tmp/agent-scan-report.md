# Agent Scan Report (تقرير فحص الوكيل)

> **تاريخ الفحص:** 2026-06-05
> **المهمة:** تنفيذ ترقية أداء وتصفين التقارير (Wave P2-A: Performance & Report Pagination)

---

## 1. الملفات التي قرأتها (Files Read)
* **ملفات المعرفة والحوكمة (AI Brain & Governance):**
  * [.ai-brain/00-index.md](file:///d:/namasoft9-3-main/.ai-brain/00-index.md) - فهرس ذاكرة النظام وإحصائياته.
  * [.ai-brain/01-architecture.md](file:///d:/namasoft9-3-main/.ai-brain/01-architecture.md) - هيكلية الطلب وعزل المستأجرين (DB per Tenant).
  * [.ai-brain/02-database.md](file:///d:/namasoft9-3-main/.ai-brain/02-database.md) - تصميم النماذج والـ Soft Delete والـ Audit.
  * [.ai-brain/05-business-logic.md](file:///d:/namasoft9-3-main/.ai-brain/05-business-logic.md) - التدفقات المالية والسيناريوهات.
  * [.ai-brain/14-modules-map.md](file:///d:/namasoft9-3-main/.ai-brain/14-modules-map.md) - خريطة موديولات النظام.
  * [.ai-brain/17-gap-analysis.md](file:///d:/namasoft9-3-main/.ai-brain/17-gap-analysis.md) - الفجوات الحالية والـ Roadmap.
  * [.ai-brain/19-claude-rules.md](file:///d:/namasoft9-3-main/.ai-brain/19-claude-rules.md) - القواعد الإلزامية الخاصة بالـ AI.
  * [.ai-brain/20-accounting-domain.md](file:///d:/namasoft9-3-main/.ai-brain/20-accounting-domain.md) - تفاصيل المحاسبة ومراكز التكلفة وإقفال الفترات.
  * [project-governance/03-FINANCIAL_INVARIANTS.md](file:///d:/namasoft9-3-main/project-governance/03-FINANCIAL_INVARIANTS.md) - الثوابت المالية المطلقة لمنع التعديل غير المصرح به.

* **ملفات الكود البرمجي (Source Code Files):**
  * [src/app/api/reports/[type]/route.ts](file:///d:/namasoft9-3-main/src/app/api/reports/%5Btype%5D/route.ts) - نقطة النهاية الرئيسية للتقارير العامة.
  * [src/app/api/reports/returns/route.ts](file:///d:/namasoft9-3-main/src/app/api/reports/returns/route.ts) - نقطة النهاية لتقرير مرتجعات المبيعات.
  * [src/app/api/reports/customer-statement/route.ts](file:///d:/namasoft9-3-main/src/app/api/reports/customer-statement/route.ts) - نقطة النهاية لكشف حساب العميل والتعمير (Aging).
  * [src/app/(dashboard)/reports/page.tsx](file:///d:/namasoft9-3-main/src/app/%28dashboard%29/reports/page.tsx) - الواجهة الأمامية للتقارير العامة.
  * [src/app/(dashboard)/reports/returns/page.tsx](file:///d:/namasoft9-3-main/src/app/%28dashboard%29/reports/returns/page.tsx) - الواجهة الأمامية لتقرير المرتجعات.

---

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
1. `src/app/api/reports/[type]/route.ts` - لإدخال الباغينيشن في استعلامات `least-selling` و `users-list` و `daily-report`.
2. `src/app/api/reports/returns/route.ts` - لتفعيل الباغينيشن الديناميكي بدل `take: 100` الثابت.
3. `src/app/api/reports/customer-statement/route.ts` - لحساب الرصيد المتراكم لكشف الحساب كلياً بالذاكرة للفترة المحددة، ثم تصفية الصفحة المطلوبة ديناميكياً لتجنب بتر البيانات.

---

## 3. الدومينات المتأثرة (Affected Domains)
* **Accounting & Ledger reporting (التقارير المحاسبية والترصيد)**
* **Sales & Returns auditing (تدقيق المبيعات والمرتجع)**
* **Database & Performance (أداء الاستعلامات وقابلية التوسع)**

---

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
* **خطر بتر البيانات المحاسبية (Data Truncation):** الباغينيشن على مستوى الاستعلام في كشف الحساب سيؤدي إلى حساب خاطئ للرصيد المستمر (Running Balance) لأن المعاملات السابقة للصفحة الحالية لن يتم أخذها بالحسبان.
  * *الحل:* جلب معاملات الفترة المحددة بالكامل بدون بتر، ثم حساب الأرصدة في الذاكرة، ثم عمل `slice` للصفحة المطلوبة فقط للاستجابة.
* **خطر كسر الواجهة الأمامية (Breaking UI Contract):** الواجهة تتوقع مصفوفات (Arrays) مباشرة في تقرير المرتجعات وقائمة المستخدمين.
  * *الحل:* الحفاظ على الاستجابة كـ Array في الحالتين، مع فلترتها داخلياً بـ `take` و `skip` بناءً على بارامترات الباغينيشن في الـ URL.
* **خطر الفلاتر الخاطئة في التقرير المعقد (least-selling):** الاستعلام الحالي يبتر المنتجات إلى 100 ويبتر تفاصيل المبيعات إلى 100 مما يعطي بيانات عشوائية تماماً.
  * *الحل:* تقسيم الاستعلام بحيث نجلب قائمة المنتجات المفلترة بالباغينيشن، ثم نستخدم معرفات المنتجات الناتجة `productId: { in: productIds }` لجلب مبيعاتها بدقة تامة.

---

## 5. خطة التنفيذ (Execution Plan)
1. **reports/[type]/route.ts:**
   * تعديل `users-list` لدعم الباغينيشن الديناميكي.
   * تعديل `daily-report` لتطبيق `take: limit` و `skip: skip` على الاستعلامات الفرعية.
   * إعادة صياغة استعلام `least-selling` ليجلب مبيعات المنتجات المحددة للصفحة الحالية بدقة لمنع بتر المنتجات.
2. **reports/returns/route.ts:**
   * قراءة بارامترات الباغينيشن وتمريرها للاستعلام `salesReturn.findMany` مع الحفاظ على نوع الاستجابة كـ Array.
3. **reports/customer-statement/route.ts:**
   * جلب فواتير ومدفوعات الفترة المحددة كاملة، ترتيبها تاريخياً، حساب الرصيد المتراكم، ثم تصفية معاملات الصفحة بـ `slice(skip, skip + limit)` وإرجاعها مع بيانات الباغينيشن الوصفية.

---

## 6. خطة الاختبار (Test Plan)
* **الاختبارات الآلية (Automated Integration Tests):**
  * كتابة ملف اختبار جديد `tests/integration/reports/pagination.test.ts`.
  * اختبار صحة حساب الرصيد المتراكم لكشف حساب العميل والـ Aging.
  * اختبار تصفين قائمة المستخدمين، المرتجعات، والتقارير العامة مع تغيير بارامترات الباغينيشن.
* **الاختبارات المحلية المنهجية (Local Builds):**
  * تشغيل `npm run typecheck` للتأكد من توافقية الأنواع.
  * تشغيل `npx prisma validate` للتحقق من صحة Schema.
  * تشغيل `npm run build` للتأكد من خلو المشروع من أخطاء الترجمة.
