# تقرير فحص العميل - تفعيل المعالج الخلفي بوضع المحاكاة الصامتة (المرحلة 4E)

## 1. الملفات التي قرأتها (Files Read)
- [instrumentation.ts](file:///d:/namasoft9-3-main/instrumentation.ts)
- [src/lib/tenant/provisioning-worker.ts](file:///d:/namasoft9-3-main/src/lib/tenant/provisioning-worker.ts)
- [src/lib/tenant/provisioning-guard.ts](file:///d:/namasoft9-3-main/src/lib/tenant/provisioning-guard.ts)
- [src/lib/tenant/provisioning-queue.ts](file:///d:/namasoft9-3-main/src/lib/tenant/provisioning-queue.ts)
- [src/lib/queue/index.ts](file:///d:/namasoft9-3-main/src/lib/queue/index.ts)
- [deploy.js](file:///d:/namasoft9-3-main/deploy.js)

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- [instrumentation.ts](file:///d:/namasoft9-3-main/instrumentation.ts) (لإضافة استدعاء `startProvisioningWorker` لتهيئة المعالج الخلفي أثناء بدء تشغيل التطبيق).

## 3. الدومينات المتأثرة (Affected Domains)
- **معالج التأسيس الخلفي (Tenant Provisioning System):** تفعيل محرك الاستماع الصامت (Dry-Run) للمستأجرين الجدد لمراقبة تدفق المهام.
- **إدارة خادم الإنتاج / PM2:** بدء تشغيل عملية الاستماع الخلفية داخل العمليات النشطة.

## 4. المخاطر والحلول (Risks & Mitigations)
- **خطر استدعاء عمليات كتابة حقيقية (Accidental Writes):**
  - **الحل:** تم حسم هذا برمجياً وبيئياً؛ تظل أعلام `CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED` معطلة بالكامل، وعلم `CUSTOMER_ONBOARDING_WORKER_DRY_RUN` مفعل افتراضياً (`true`). لا يتم إطلاق أي استعلامات SQL حقيقية أو إنشاء قواعد بيانات.
- **خطر التداخل في الذاكرة لعمليات التأسيس المتوازية:**
  - **الحل:** تحديد Concurrency بـ 1 كحد أقصى لحماية خادم قواعد البيانات.

## 5. خطة التنفيذ (Execution Plan)
1. **تحديث الكود المحلي:** تعديل [instrumentation.ts](file:///d:/namasoft9-3-main/instrumentation.ts) لاستيراد واستدعاء `startProvisioningWorker()`.
2. **التحقق المحلي:** التأكد من تجميع TypeScript عبر `npm run typecheck` ومرور الفحوصات.
3. **الدفع والمزامنة:** عمل التزام ودفع برمجيات الحماية المستكملة للمستودع.
4. **النشر للإنتاج (وضع Dry-Run):**
   - مزامنة كود `instrumentation.ts` مع السيرفر وإعادة البناء.
   - ضبط الأعلام البيئية على خادم الإنتاج/Staging:
     - `CUSTOMER_ONBOARDING_WORKER_ENABLED=true`
     - `CUSTOMER_ONBOARDING_WORKER_DRY_RUN=true`
   - إعادة تشغيل تطبيقات PM2 لتنشيط الاستماع الصامت.
5. **المراقبة:** فحص السجلات والتأكد من بدء المعالج الخلفي بوضع المحاكاة دون أخطاء.

## 6. خطة الاختبار (Testing Plan)
- تشغيل اختبارات التكامل المحلية للتأكد من سلامة الحمايات.
- فحص استجابة مسار الحالة `GET /api/tenant/provision/status` للتحقق من قراءة الأعلام البيئية الجديدة.
- مراقبة سجلات PM2 على السيرفر للتأكد من خلوها من الأخطاء.
