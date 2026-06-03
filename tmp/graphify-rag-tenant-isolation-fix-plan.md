# GRAPHIFY RAG TENANT ISOLATION FIX PLAN

## 1. عنوان المرحلة
GRAPHIFY_RAG_TENANT_ISOLATION_FIX_PLAN_ONLY

## 2. Approval المستخدم
`GO_FOR_GRAPHIFY_RAG_TENANT_ISOLATION_FIX_PLAN_ONLY`

## 3. Git Baseline
* **الفرع الحالي**: `main`
* **HEAD المحلي**: `82f622c0e7ef2591428d8513149044a17cfd89a8`
* **origin/main**: `82f622c0e7ef2591428d8513149044a17cfd89a8`
* **حالة المطابقة**: HEAD يطابق origin/main تماماً.
* **شجرة العمل**: نظيفة باستثناء ملفات الفحص والتقارير والاختبار (`tests/integration/ai/rag-tenant-isolation.test.ts`) المضافة في المرحلة السابقة.

## 4. ملخص الخطر المؤكد (Tenant Leakage Risk)
تم إثبات أن دوال حقن واسترجاع البيانات عبر RAG (`rag-pipeline.ts`) ومسار (`/api/ai/ingest`) تستخدم السلوك `tenantId = 'default'` كخيار احتياطي (Silent Fallback) إذا لم يتوفر الـ Tenant الحقيقي. هذا التصميم يفتح ثغرة خطيرة تؤدي إلى خلط البيانات أو تسريبها بين المشتركين إذا فشلت طبقة الـ Auth في توفير الـ Tenant.

## 5. الملفات التي تمت قراءتها
* `tmp/graphify-rag-tenant-isolation-deep-scan-report.md`
* `tmp/graphify-rag-tenant-isolation-tests-report.md`
* `src/lib/rag-pipeline.ts`
* `src/lib/vector-store.ts`
* `src/app/api/ai/ingest/route.ts`
* `src/app/api/ai/chat/route.ts`
* `src/app/api/ai/rag/route.ts`

## 6. السبب الجذري (Root Cause)
الاعتماد على القيم الافتراضية في معلمات الدوال (`tenantId = 'default'`) وعمليات التحقق (`?? 'default'`) بدلاً من تطبيق مبدأ **Fail Closed**. غياب الحواجز (Guards) الصارمة التي تمنع تنفيذ الاستعلامات في قاعدة البيانات بدون `tenantId` فعلي، والاعتماد بشكل حصري على أن طبقة الـ Auth لن تفشل أبداً.

## 7. استراتيجية الإصلاح المقترحة (Proposed Fix Strategy)
اعتماد مبدأ **Fail Closed, Never Default Tenant**:
* إزالة جميع القيم الافتراضية `'default'` من توقيعات الدوال ومنطق الـ Fallback.
* رمي أخطاء صريحة (Throw Error) أو إرجاع استجابات (403 Forbidden) في حال غياب `tenantId`.
* إضافة `Guards` أمنية في `vector-store.ts` و مسارات الـ API قبل تنفيذ أي استعلام على Prisma لضمان أن `tenantId` ليس فارغاً وليس `'default'`.

## 8. جدول الملفات المتأثرة
| الملف | نوع التعديل | الخطورة |
|------|------------|--------|
| `src/lib/rag-pipeline.ts` | حذف القيم الافتراضية + إضافة Guards ترمي خطأ | 🔴 حرج |
| `src/app/api/ai/ingest/route.ts`| إزالة Fallback + إرجاع 403 إذا غاب Tenant | 🔴 حرج |
| `src/lib/vector-store.ts` | إضافة Guards احترازية في أوائل الدوال | 🟠 متوسط |
| `src/app/api/ai/chat/route.ts` | إضافة تحقق Guard قبل `queryRAG` | 🟡 منخفض (وقائي) |
| `src/app/api/ai/rag/route.ts` | إضافة تحقق Guard قبل `queryRAG` | 🟡 منخفض (وقائي) |

## 9. التعديلات المقترحة لكل ملف
### `src/lib/rag-pipeline.ts`
* **ingest**: تغيير `tenantId = 'default'` إلى `tenantId: string`. إضافة:
  `if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach: tenantId is strictly required.');`
* **query**: استبدال `const tenantId = options.tenantId ?? 'default';` بـ:
  `const tenantId = options.tenantId; if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach...');`
* **stats**: إزالة الـ default parameters وإضافة الـ Guard.

### `src/app/api/ai/ingest/route.ts`
* إزالة: `const tenantId = (ctx.auth.tenantId as string) ?? 'default';`
* استبدال بـ:
  `const tenantId = ctx.auth.tenantId as string;`
  `if (!tenantId || tenantId === 'default') return NextResponse.json({ error: 'Tenant Context Required' }, { status: 403 });`

### `src/lib/vector-store.ts`
* إضافة السطر التالي في بداية كل دالة استعلام (مثل `searchVectorMine`, `queryRAG`, `addDocumentToVectorMine`, `searchChunksPgVector`):
  `if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach in vector-store');`

### `src/app/api/ai/chat/route.ts` & `src/app/api/ai/rag/route.ts`
* إضافة تحقق بعد فك الـ auth:
  `if (!tenantId || tenantId === 'default') return NextResponse.json({ error: 'Tenant context required' }, { status: 403 });`

## 10. ما الذي لن يتم تعديله
* استعلامات Raw SQL (`WHERE tenant_id = $1`) لن تتغير لأن هيكلها آمن طالما المتغير آمن.
* لن يتم المساس بتعريف `Prisma schema`.
* لن يتم تعديل آليات تضمين Gemini.
* مسارات الـ UI والـ Backend الأخرى خارج نطاق الـ RAG.

## 11. خطة الاختبارات بعد الإصلاح
بعد تنفيذ هذا الإصلاح (في المرحلة القادمة)، يجب تشغيل:
1. `npx vitest run tests/integration/ai/rag-tenant-isolation.test.ts`
   * السلوك المتوقع: يجب أن تنجح الاختبارات بحيث يتم رصد الخطأ المنبثق `throw` عند غياب الـ Tenant، بدلاً من الفشل الصامت.
2. `npx prisma validate` لضمان عدم كسر أي Types.
3. التأكد من أن دوال API ترجع 403.

## 12. مخاطر التنفيذ
* **كسر الاستدعاءات الشرعية**: قد توجد سكربتات إدارية (Admin Scripts) تعتمد على ترك الـ `tenantId` فارغاً لتتصل بـ `default`. في حال وجودها، ستتوقف عن العمل ويجب إعطائها `tenantId` صريحاً (مثل النظام الوهمي).
* تعقيد أقل من المتوسط. لا توجد مخاطر على قاعدة البيانات.

## 13. Rollback plan
بما أن التغييرات تتم محلياً وبشكل منطقي، الـ Rollback سيكون بسيطاً:
* تنفيذ `git checkout -- <الملفات>` أو `git reset --hard` للرجوع للحالة السابقة قبل تنفيذ الـ Push للإنتاج.

## 14. التأكيدات الصارمة
* **Runtime code modified?** NO (لا، في هذه المرحلة).
* **DB/schema modified?** NO (لا).
* **Env modified?** NO (لا).
* **Commit/push/deploy?** NO (لا).

## 15. التوصية النهائية
تم إعداد الخطة. نوصي بتنفيذها بشكل معزول وآمن.
البوابة اللاحقة: `GO_FOR_GRAPHIFY_RAG_TENANT_ISOLATION_FIX_IMPLEMENTATION_ONLY`
