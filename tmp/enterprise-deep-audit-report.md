# Enterprise Deep Audit Extension Report
**Date:** 2026-05-14
**Type:** LEVEL 3 DEEP ARCHITECTURAL AUDIT EXTENSION
**Target:** Nama Invest ERP (Core Engines & Messaging)

بناءً على بروتوكول الحوكمة الجديد (Enterprise Architectural Audit Mode)، قمت بالغوص في الطبقات المعمارية العميقة للـ Core Engines (مثل `event-bus.ts`, `idempotency.ts`, `document-state-machine.ts`) لتحليل الـ 15 نقطة المطلوبة.

النتيجة أظهرت عيوباً معمارية خطيرة (Architectural Flaws) في طبقة التزامن والتوسعية المخفية تحت السطح، والتي قد تتسبب في كوارث مالية إذا تم تفعيل النظام على بيئة Multi-Pod (Load Balanced).

---

### 1. Dependency Graph (مصفوفة الاعتماديات)
الترابط بين محركات الأعمال (Business Engines) و `EventBus` يعتمد على استدعاءات مباشرة. الـ `EventBus` يستورد `syncQueue` ديناميكيًا لحل الـ Circular Dependency، ولكن طبقة الـ EventHandlers يتم تسجيلها في الذاكرة الحية (In-Memory Map) مما يعني أن أي Engine يجب أن يكون محملًا بالذاكرة لتسجيل الـ Handler، وهذا يخلق Tight Coupling غير مرئي.

### 2. End-to-End Workflows (مسارات العمل الشاملة)
تغيير حالة المستندات عبر `document-state-machine.ts` يفصل بين الـ Validation (التحقق) والـ Mutation (تنفيذ التغيير عبر `apply()`). هذا ممتاز، لكن إذا نجحت `apply()` في تغيير الحالة المحاسبية وفشل الـ `EventBus.publish` (الذي يعمل خارج نفس הـ DB Transaction)، سنصل إلى **Inconsistent State** (فاتورة رحّلت، ولكن لم يرسل تنبيه للمخزن).

### 3. Event Flow Integrity (سلامة تدفق الأحداث)
يستخدم النظام نمط (Outbox Pattern) بكتابة الحدث في جدول `EventLog` ثم وضعه في `BullMQ`.
**الخطر الحرج:** الـ `EventBus.publish` لا يأخذ `Prisma Transaction Client` كمعامل. هذا يعني أن كتابة الحدث تتم في استعلام منفصل عن العملية الأصلية. (Breaks the Transactional Outbox guarantee).

### 4. State Machine Integrity (سلامة آلة الحالة)
الـ `document-state-machine.ts` يمنع تحريك القيود المرحّلة (POSTED) بشكل ممتاز. لكنه يحتوي على ضعف أمني: الـ `AuditLog` مغلف بـ `try/catch` تتجاهل الفشل (Best-effort audit). في نظام مالي، **فشل الـ Audit يجب أن يوقف العملية فوراً**، التجاهل هنا يعتبر خرقاً للامتثال المالي (Compliance Violation).

### 5. Cross-Domain Coupling (التشابك بين النطاقات)
الـ `EventBus` يحتوي على Fallback كارثي: إذا كان `BullMQ` (Redis) غير متاح، يقوم بإطلاق الحدث برمجياً عبر `setImmediate`. هذا يعني أن معالجات ثقيلة (مثل إنشاء PDF لـ ZATCA) ستعمل على نفس הـ Event Loop لـ Node.js، مما سيؤدي إلى تجميد الخادم (Node Lockup) وانهيار النظام بأكمله إذا زاد الحمل.

### 6. Operational Risks (المخاطر التشغيلية)
ملف `idempotency.ts` يعتمد على `Map<string, StoredResponse>` في **الذاكرة العشوائية (RAM)** وبنظام TTL محلي.
**الخطر:** في بيئة إنتاجية (Production) تحتوي على أكثر من خادم (Multiple Pods / Instances)، هذا الـ Map لا يُشارك بينها. يمكن لطلبين مكررين أن يذهبا لخادمين مختلفين وينفذا دفعة مالية مرتين بنجاح تام!

### 7. AI-generated Inconsistencies (تراكمات الذكاء الاصطناعي)
الاستخدام المفرط لـ `any` (مثال: `catch (e: any)` و `payload: Record<string, any>`) في الطبقات الأساسية هو Shortcut برمجي يفقدنا ميزة الـ Type-Safety، مما يؤدي إلى أخطاء وقت التشغيل (Runtime Errors) خصوصاً في الـ Event Payloads التي يجب أن تكون Strongly Typed.

### 8. Hidden Technical Debt (الديون التقنية المخفية)
آلية الـ `Cleanup` في `idempotency.ts` تعمل عبر `setInterval`. رغم استخدام `unref()`، إلا أن الاعتماد على In-memory caching لضمان عدم التكرار المالي هو "دين تقني قنبلة" سيتطلب إعادة كتابة كاملة ليستخدم Redis (Distributed Lock & Cache).

### 9. Race Conditions (سباق المزامنة)
في `EventBus.replayPending()`، يجلب النظام أول 50 حدث عالق بدون (Pessimistic Locking مثل `FOR UPDATE SKIP LOCKED`). إذا عمل اثنان من الـ Cron Jobs أو الـ Workers في نفس اللحظة، سيقومان بتنفيذ نفس الـ 50 حدثاً مرتين في نفس الوقت.

### 10. Concurrency Risks (مخاطر التزامن المباشر)
الـ `document-state-machine` لا يطبق (Optimistic Concurrency Control - OCC) كالتحقق من `version` أو `updatedAt`. يمكن لطلبين API سريعين لتأكيد نفس الفاتورة (DRAFT → POSTED) اجتياز فحص `canTransition` في نفس اللحظة (قبل حفظ أحدهما)، مما يؤدي لترحيل فاتورة مرتين.

### 11. Queue Failure Scenarios (سيناريوهات انهيار الطوابير)
إذا فشل معالج في `BullMQ`، الـ EventBus يسجل حالة `FAILED` في `EventLog`. ولكن لا توجد آلية Circuit Breaker؛ إذا كان هناك عطل مستمر في API خارجي (مثل منصة ZATCA)، سيستمر الطابور في محاولة الإرسال وتوليد ملايين الإدخالات الفاشلة حتى تمتلئ قاعدة البيانات.

### 12. Rollback Safety (أمان التراجع)
لا توجد آلية Rollback للمقاطعات الخارجية (External Side Effects). إذا قام Event Handler بخصم رصيد بوابات الدفع ثم تعطل بسبب خطأ في كود الـ DB، لن يتم إرجاع المبلغ لعدم وجود Saga Compensation logic.

### 13. Idempotency Gaps (فجوات في عدم التكرار)
الـ Event Handlers نفسها غير مصممة لتكون Idempotent. الـ `eventId` يُمرر لها، ولكن لا يتم استخدامه للتحقق داخل الـ Handler مما إذا كان هذا الـ Event قد نُفذ سابقاً على هذا المستند. إذا أُعيد تشغيل الـ Queue سيتم تنفيذ اللوجيك مرة أخرى.

### 14. Observability Gaps (قصور المراقبة)
نظام التتبع (Tracing) ينقطع عند الـ EventBus. عندما يخرج الطلب من الـ API وينتقل للـ Queue، يضيع الـ `traceId` (Request ID). مما يجعل من المستحيل تتبع دورة حياة طلب مالي واحد عبر الـ Logs من لحظة نقرة المستخدم وحتى إتمام مهمة الخلفية.

### 15. Long-term Scalability Risks (عقبات التوسع المستقبلي)
هيكلية `In-memory Idempotency` + `In-memory Event Handlers` + `Synchronous Fallbacks` تجعل النظام **غير قابل للتوسع الأفقي (Not Horizontally Scalable)**. النظام مصمم ليعمل على Single Node Monolith. بمجرد توزيعه على أكثر من خادم للتعامل مع الـ Load العالي، ستنهار جميع آليات الحماية (Idempotency & Queues).

---

### التوصيات المعمارية الحتمية (Mandatory Fixes):
1. **استبدال In-Memory Idempotency**: يجب نقل `idempotency.ts` ليستخدم Redis كطبقة Caching موزعة.
2. **Transactional Outbox**: يجب ربط `EventBus.publish` ليعمل حصرياً داخل `Prisma.TransactionClient` لضمان الـ Atomicity.
3. **Pessimistic Locking**: دمج استراتيجيات القفل الموزع (`FOR UPDATE SKIP LOCKED`) للـ Cron Jobs لتجنب الـ Race Conditions في الـ Replay.
4. **Optimistic Concurrency (OCC)**: إضافة حقل `@version` في Prisma لجدول الفواتير والقيود لرفض التعديلات المتزامنة التي قد تسبب حسابات مضاعفة.
