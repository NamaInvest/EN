# تقرير الفحص والتخطيط للمرحلة التالية (Next Business Phase Scan & Plan Report) - Phase 3 (Wave P3-C)

يوثق هذا التقرير الفحص الشامل للمرحلة البرمجية والتشغيلية المحددة **Wave P3-C: Dunning Automation Implementation & Integration** والتخطيط الدقيق لإنجازها بالكامل دون مخاطر على الكود أو الإنتاج أو عزل البيانات.

---

## 1. تفاصيل المرحلة المحددة (Selected Phase Details)

- **اسم المرحلة**: **Wave P3-C: Dunning Automation Implementation & Integration (Gap 05)**
- **سبب الاختيار**: بعد إغلاق كافة فئات الاستقرار لـ Wave P3-B بنجاح كامل وصفر فجوات برمجية أو أمنية، ننتقل مباشرة لسد النواقص الهيكلية في إدارة الحسابات المدينة والتحصيل التلقائي. يتضمن العمل تفعيل وتكامل محرك الحوكمة والتحصين المالي المتقدم `DunningEngineV2` مع تفعيل القيود التلقائية لرسوم وفوائد التأخير ماليًا.
- **النطاق (Scope)**:
  1. ترقية كود نقطة النهاية للتشغيل اليومي للمطالبات `/api/accounting/dunning/daily-run` ليعتمد كلياً على محرك الحوكمة والتحصين المالي المتقدم `DunningEngineV2` بدلاً من النسخة الأولى الأساسية `DunningEngine`.
  2. دمج المحرك مع معاملات العزل لكل مستأجر `tenantId` لضمان استحالة تداخل بيانات العملاء أو المستندات ماليًا بين الفروع والشركات الفرعية.
  3. ربطه بمهام الكرون الدورية في `src/app/api/cron/ar-collection-dunning/route.ts` لضمان جدولة تشغيل آلي للمطالبات أسبوعياً.
  4. التحقق من تكامل واجهة إدارة المطالبات والموافقات ماليًا.

---

## 2. الملفات المفحوصة والمراجعة (Files & Pages Reviewed)

- **الملفات والمجلدات المفحوصة**:
  - [src/lib/dunning-engine-v2.ts](file:///d:/namasoft9-3-main/src/lib/dunning-engine-v2.ts): الكود الفعلي لمحرك التحصيل المتقدم V2 الداعم لتوليد القيود وعزل المستأجرين.
  - [src/app/api/accounting/dunning/daily-run/route.ts](file:///d:/namasoft9-3-main/src/app/api/accounting/dunning/daily-run/route.ts): الـ API الحالي للتشغيل اليومي للدانينج.
  - [src/app/api/cron/ar-collection-dunning/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/ar-collection-dunning/route.ts): الكرون جوب الدورية.
  - [src/app/(dashboard)/accounting/dunning/page.tsx](file:///d:/namasoft9-3-main/src/app/%28dashboard%29/accounting/dunning/page.tsx): واجهة كاشير المطالبات والمستويات.

---

## 3. التحليل البرمجي والتشغيلى (Behavior Analysis)

### السلوك الحالي (Current Behavior)
- الـ API الحالي `/api/accounting/dunning/daily-run` يستدعي كلاس `DunningEngine` القديم (V1) الذي يفتقر لـ:
  - تمرير سياق `PrismaClient` المشترك الخاص بكل مستأجر.
  - توليد قيود رسوم وفائدة التأخير ماليًا تلقائياً.
  - دعم الوعود بالدفع (Promise-to-Pay) بشكل كامل.
  - حارس التحصين الإجباري للمستندات والعملاء.

### السلوك المطلوب والمستهدف (Target Behavior)
- تحويل الـ API في `/api/accounting/dunning/daily-run` ليعتمد بالكامل على `DunningEngineV2` مع تزويده بالـ `prisma` client المطابق للمستأجر المعزول.
- تصفية الطلب ومطابقة `tenantId` المستخلص من جلسة المستخدم لضمان عزل البيانات الكامل ومنع تسريب التقارير أو كشوف الحسابات.
- تفعيل توليد القيود التلقائية لرسوم وفوائد التأخير ماليًا.

---

## 4. المخاطر والضوابط (Risks & Controls)

- **خطر التعديل المحاسبي/المالي**: توليد قيود رسوم وفوائد التأخير ماليًا تلقائياً يجب أن يمر بحسابات الدليل الصحيحة المحددة في الإعدادات (`dunning_late_fee_account_id` و `dunning_ar_account_id`).
  - *الحل:* التحقق التام من وجود الإعدادات مسبقاً وسقوط العملية صامتاً مع تسجيل تحذير مالي دون كسر تشغيل الخادم.
- **خطر عزل المستأجرين**: استخدام `tenantId` المستخلص من جلسة Clerk للمستأجر الفعلي في جميع استعلامات الـ DB.
- **تأثير قاعدة البيانات**: صفر (لن يتم تغيير prisma schema أو تشغيل prisma migrate).
- **شروط الإيقاف الفوري (No-go Conditions)**:
  - محاولة تعديل ملفات المتغيرات البيئية `.env`.
  - محاولة الاتصال بالإنتاج أو تعديل كود الـ API الفعلي للإنتاج.

---

## 5. خطة التنفيذ والتحقق (Implementation & Verification Plan)

### خطة التطوير (Implementation Plan)
- **تعديل** `src/app/api/accounting/dunning/daily-run/route.ts` لاستخدام `DunningEngineV2.executeDailyRun` وتمرير `prisma` client للمستأجر الفعلي المعزول.

### خطة التحقق والاختبار (Test Plan)
- تشغيل التحقق العام للتجميع والتأكد من عدم كسر أي شيء:
  ```bash
  npm run typecheck
  npm run build
  ```
- تشغيل اختبارات الوحدة للمحرك للتأكد من نجاحها:
  ```bash
  npx vitest run src/lib/__tests__/dunning-engine-v2.test.ts
  ```

---

## 6. خطة التراجع والضمان (Rollback Plan)

- التراجع الفوري يتم ببساطة شديدة عبر التراجع عن التعديلات في Git:
  ```bash
  git checkout -- src/app/api/accounting/dunning/daily-run/route.ts
  ```

**القرار**: **PASS** - الانتقال التلقائي إلى **Phase 4 — Impact Analysis**.
