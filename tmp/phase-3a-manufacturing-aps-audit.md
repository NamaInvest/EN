# Phase 3A — Manufacturing APS Architectural Audit

## 1. Scope & Models
تم إجراء مسح معماري شامل لمكونات نظام الـ **APS (Advanced Planning and Scheduling)** الخاص بجدولة التصنيع.
الجداول (Prisma Models) المرتبطة بالنظام والتي تم فحصها:
- **`ManufacturingOrder`**: يحمل معلومات أمر التصنيع الأساسي (المنتج، الكمية، الحالة).
- **`WorkCenter`**: مراكز العمل (الآلات أو خطوط الإنتاج) والـ Capacity الخاصة بها.
- **`RecipeOperation`**: العمليات الأساسية المحددة في وصفة التصنيع (الوقت المطلوب).
- **`ScheduledOperation`**: الجداول الزمنية الناتجة عن الـ APS (البداية، النهاية، مركز العمل).
- **`ScheduleRun`**: سجل لتتبع عمليات الجدولة المجمعة (Run) وتوثيق النطاق الزمني لها.

## 2. API & Service Analysis (`src/app/api/manufacturing/aps`)
- يعتمد الـ API حالياً على خدمة فرعية اسمها `APSEngine` (`src/lib/aps-engine.ts`).
- **حماية الـ Tenant:** موجودة ويتم استخدام `tenantRequired: true` عبر `withRoute`، وتمرير الـ `tenantId` للوظائف بشكل سليم.

## 3. Risks & Architectural Violations (المخاطر المكتشفة)
تم رصد عدة مخالفات لقواعد الـ Enterprise Governance يجب إصلاحها قبل كتابة أي كود جديد:
1. **Direct Prisma Client Usage:** خدمة `APSEngine` تقوم باستيراد `prisma` بشكل مباشر وتقوم بعمليات الحفظ. هذا **مخالف جداً**، يجب أن تستقبل الدالة معامل `Prisma.TransactionClient` لتسمح بتطويق العملية بـ Transaction.
2. **Missing Transaction Wrapper:** عمليات الجدولة (Schedule) ترتبط مباشرة بأوامر التصنيع (Manufacturing). يجب أن تتم كافة العمليات داخل `runInventoryTx` لضمان تكامل البيانات وعدم ترك سجلات معلقة في حال الفشل.
3. **No Idempotency:** مسار الـ `POST` الخاص بإنشاء الجدولة لا يحتوي على التحقق من `x-idempotency-key`، مما يعرض النظام لخطر تشغيل عدة جلسات جدولة (Runs) في نفس اللحظة لنفس المصنع، ما يؤدي لتضارب أوقات الآلات.
4. **UI Placeholder:** الشاشة الحالية تستخدم `FeatureDisabledPanel` وهذا متوافق مع الحماية، ولكن لا يوجد أي ربط للواجهة الأمامية حتى الآن.

## 4. خطة الإصلاح والتنفيذ (Phase 3B - Plan)
قبل تفعيل الواجهة أو بناء الشاشة، يجب تنفيذ التالي في البنية التحتية الخلفية:
- تحويل دوال `APSEngine` (أو إنشاء Service مخصصة مثل `ManufacturingApsService`) لتقبل `prisma: TransactionClient`.
- استخدام `runInventoryTx` لتغليف عمليات الـ `scheduleOperation` والـ `runSchedule`.
- إضافة `lockIdempotencyKey` إلى المسار `POST /api/manufacturing/aps`.
- عدم تعديل الجداول (`schema.prisma`) لأنها تفي بالغرض ومكتملة أساسياً لدعم الـ APS.

**جاهز لموافقتك على خطة إصلاح الـ Backend (Phase 3B) بناءً على هذه المخرجات.**
