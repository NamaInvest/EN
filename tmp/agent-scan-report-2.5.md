# تقرير فحص وتخطيط - Phase 2.5: Architecture Enforcement Layer

## 1. الوضع الحالي (Lint & Build Settings)
- **ESLint**: الإعدادات الحالية (`eslint.config.mjs`) بسيطة جداً وتعتمد على `eslint-config-next` الأساسي. لا توجد أي قواعد متعلقة بـ `no-restricted-imports` أو `boundaries`.
- **TypeScript**: `tsconfig.json` مفعل به `strict: true`، وهو يعطي حماية جيدة من ناحية الأنواع (Types) ولكن لا يمنع التجاوزات المعمارية.
- **Service/Repository Layer**: يوجد مجلد ضخم `src/lib/` يحتوي على `engines` (مثل `auto-journal.ts`, `inventory-engine.ts`, `treasury-cash-position-engine.ts`)، ولكن المشكلة أن الـ API Routes لا تعتمد عليها بشكل حصري، بل تكتب الـ Business Logic مباشرة داخل الـ Route باستخدام `prisma.$transaction`.

## 2. قائمة أخطر ثغرات التجاوز (Bypass Points) في المسارات الحالية
من خلال فحص `src/app/api/pos/route.ts` والمسارات الأخرى:
1. **Direct Prisma Writes in API Routes**: الـ API يقوم بتنفيذ `tx.salesInvoice.create` و `tx.productStock.upsert` مباشرة. هذا يعني أن أي مطور جديد يمكنه كتابة Route جديد ينسى فيه إضافة `StockMovement` أو `AuditLog`.
2. **ProductStock vs StockMovement**: يتم تحديث `ProductStock` عبر `upsert` يدوياً ثم يُنشأ `StockMovement` يدوياً. غياب أي `Engine` يربطهما برمجياً يجعله عرضة لـ Split-Brain.
3. **Treasury vs JournalEntry**: يتم إنشاء سندات الخزينة (`tx.treasury.create`) في الـ Route، بينما القيود المحاسبية (`JournalEntry`) تُنفذ عبر `postSalesInvoice`. 
4. **Idempotency & Audit**: الاعتماد على المطور لتذكر استدعاء `lockIdempotencyKey` و `logAuditEvent` في بداية ونهاية كل ملف.

## 3. أسئلة حول Enforcement
- **هل ESLint enforcement ممكن بدون packages؟**
  نعم، يمكننا استخدام القاعدة المدمجة `no-restricted-imports` (أو الخاصة بـ TypeScript `@typescript-eslint/no-restricted-imports`) لمنع استيراد `getPrisma` أو `@prisma/client` داخل مجلدات محددة، أو استخدام `no-restricted-syntax` لمنع استدعاءات معينة داخل הـ Routes.
- **هل نحتاج package جديد؟**
  لا. أدوات ESLint المدمجة مع `eslint-config-next` و Prisma Client Extensions (المدمجة في Prisma) تكفي لفرض هذه القيود.

## 4. مقترح الـ Enforcement التدريجي الآمن (Safe Enforcement Plan)

### Phase 2.5.1: ESLint Architectural Guards
- إضافة قاعدة `no-restricted-imports` في `eslint.config.mjs` لمنع استيراد `prisma` داخل مسارات مالية محددة. 
- *ملاحظة*: نظراً لوجود مئات الملفات حالياً، سنجعل القاعدة `warn` أو نطبقها على المجلدات الجديدة/الحرجة فقط لمنع كسر الـ Build (Gradual Rollout).

### Phase 2.5.2: Prisma Client Extensions (The Ultimate Guard)
- استخدام **Prisma Client Extensions** `prisma.$extends` لتكوين (Middleware) يراقب أي عملية `update` على `ProductStock` ويرفضها برمجياً (Throws Error) إذا لم تكن مصحوبة بإنشاء `StockMovement` في نفس العملية.
- مراقبة إنشاء `Treasury` ورفضه إذا لم يكن مرتبطاً بـ `JournalEntry`.

### Phase 2.5.3: Typed Service Boundaries
- إنشاء `InventoryService.decrementStock(tx, ...)` بحيث تكون المعاملة `tx` إجبارية.
- تحويل الـ API routes للاعتماد على الـ Services بدلاً من التعامل مع الـ `tx.productStock` مباشرة.

## 5. أول خطوة تنفيذية آمنة (First Actionable Step)
الخطوة الأكثر أماناً والأعلى قيمة هي **Phase 2.5.2 (Prisma Guard for ProductStock & Treasury)**. يمكننا إضافة Extension خفيف لـ Prisma Client (مثلاً يعمل في وضع الـ `development` فقط في البداية) يُطلق تحذيرات (Logs) في الكونسول إذا اكتشف تعديلاً للمخزون بدون حركة، أو يمكننا البدء بـ **Phase 2.5.1** لإعداد ESLint Rules وتطبيقها كـ `warn`.

## 6. المخاطر (Risks)
- تفعيل ESLint بشكل صارم (Error) على كامل مجلد `api/` سيؤدي إلى فشل الـ CI/CD (Next build) نظراً لأن 90% من المسارات القديمة تستخدم Prisma بشكل مباشر.
- *الحل*: تطبيق قواعد الـ Lint كـ `warn` أو حصرها في `overrides` لمسارات معينة، وبناء Prisma Guard كـ "Logging only" قبل تحويله إلى "Strict Throw".

## 7. Definition of Done للمرحلة
- وجود قاعدة ESLint تمنع الممارسات الخاطئة مع إنذارات واضحة.
- وجود طبقة اعتراض (Interceptor/Extension) في Prisma تمنع فقدان الترابط (Split-Brain) بين الجداول الحرجة.
- لا توجد أخطاء في الـ TypeScript `tsc` عند بناء المشروع.
