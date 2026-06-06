# تقرير اكتشاف المرحلة التجارية التالية (Next Business Phase Discovery Report) - Phase 2 (Wave P3-C)

يوثق هذا التقرير اكتشاف وتحليل وتحديد المرحلة البرمجية والتشغيلية التالية بناءً على سجلات الفجوات المتبقية وخريطة الطريق للمشروع بعد نجاح مسار Wave P3-B.

---

## 1. تحليل مخرجات المراحل السابقة (Previous Phases Audit)

- **آخر مرحلة مكتملة ودُفعت**: **Wave P3-B: E2E Staging Environment Setup & Playwright Wave 2 Write Tests** (الالتزام الموثق: `80c76459`).
- **حالة خادم الإنتاج**: يقف عند الالتزام `80c76459` (نشر مستندات واختبارات E2E Staging الآمنة).
- **حالة الفجوات السابقة (P1 & P2 & P3-A/B)**: تم معالجة وإغلاق كافة المشاكل الفورية والحرجة (P1)، ومشاكل الأداء والواجهة المتوسطة (P2)، وتوثيق عمال BullMQ وضريبة WHT، وفحوصات الضغط k6، وتأسيس اختبارات Staging Wave 2 بنجاح بنسبة 100%.
- **الفجوات المتبقية**: الفجوة المتبقية التالية في خط الائتمان والمحاسبة والمقاصة هي **Dunning Automation (Gap 05)**.

---

## 2. تحديد المرحلة التالية (Next Business Phase Selection)

بناءً على فحص سجل المشاكل والفجوات الموثقة في [فهرس النواقص](file:///d:/namasoft9-3-main/docs/gaps/README.md) وفي [خارطة طريق الفجوات الـ 20](file:///d:/namasoft9-3-main/docs/ai-brain/operational_roadmap_20_gaps.md)، نحدد المرحلة التالية كالتالي:

- **اسم المرحلة المختارة**: **Wave P3-C: Dunning Automation Implementation & Integration (Gap 05)**
- **الأولوية**: متوسطة/منخفضة (رمز النقص المحدد: `Gap 05`).
- **الوصف**:
  1. ترقية كود نقطة النهاية للتشغيل اليومي للمطالبات `/api/accounting/dunning/daily-run` ليعتمد كلياً على محرك الحوكمة والتحصين المالي المتقدم `DunningEngineV2` مع تفعيل ربطه بالقيود التلقائية لرسوم وفوائد التأخير ماليًا.
  2. دمج المحرك مع معاملات العزل لكل مستأجر `tenantId` لضمان استحالة تداخل بيانات العملاء أو المستندات ماليًا بين الفروع والشركات الفرعية.
  3. ربطه بمهام الكرون الدورية في `src/app/api/cron/ar-collection-dunning/route.ts` لضمان جدولة تشغيل آلي للمطالبات أسبوعياً.
- **الملفات المستهدفة للفحص والتخطيط والتعديل**:
  - [src/app/api/accounting/dunning/daily-run/route.ts](file:///d:/namasoft9-3-main/src/app/api/accounting/dunning/daily-run/route.ts)
  - [src/lib/dunning-engine-v2.ts](file:///d:/namasoft9-3-main/src/lib/dunning-engine-v2.ts)
  - [src/app/api/cron/ar-collection-dunning/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/ar-collection-dunning/route.ts)

---

## 3. تقييم المخاطر والأثر (Risk & Impact Evaluation)

- **الأثر المالي/المحاسبي**: متوسط (يتعلق باحتساب القيود التلقائية لرسوم وفوائد التأخير ماليًا عند استحقاق الفواتير، ويتطلب التحقق التام من ربطها بحسابات الدليل الصحيحة).
- **أثر الأمان وعزل البيانات (Tenant Isolation)**: يتطلب التحقق المطلق لمنع أي تداخل أو تسريب لرسائل البريد الإلكتروني أو كشوف الحسابات بين المستأجرين.
- **تأثير قاعدة البيانات والمخطط**: لا يوجد (DB_CHANGED: NO، المخطط جاهز بالكامل لجدول `PromiseToPay` و `DunningLevel` و `DunningCampaign` وغيرها).
- **المستندات المطلوبة للتحديث**:
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - ذاكرة المشروع `AI_PROJECT_MEMORY.md`

---

## 4. قرار البوابة والجاهزية (Gate Decision)

المرحلة التالية واضحة تماماً وتخص معالجة سد فجوة Dunning Automation وهي آمنة تماماً وخالية من أي مخاطر تخص قاعدة البيانات.

**القرار**: الانتقال التلقائي إلى **Phase 3 — Scan + Plan Only**.
