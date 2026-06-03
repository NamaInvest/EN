# RAG TENANT ISOLATION DEEP SCAN REPORT

## 1. Git Baseline
* **Branch**: main
* **HEAD**: 82f622c0e7ef2591428d8513149044a17cfd89a8
* **origin/main**: 82f622c0e7ef2591428d8513149044a17cfd89a8
* **Working Tree**: Clean (contains only uncommitted Graphify analysis files, no source code changes)
* **Latest Commit**: 82f622c0e feat(ui): connect wave B quick win pages to existing APIs

## 2. الملفات التي تم فحصها
1. `src/lib/rag-pipeline.ts`
2. `src/lib/vector-store.ts`
3. `src/app/api/ai/chat/route.ts`
4. `src/app/api/ai/rag/route.ts`
5. `src/app/api/ai/ingest/route.ts`

## 3. مسار تدفق البيانات RAG Data Flow

**مسار الإدخال (Ingest):**
```text
User Request → /api/ai/ingest
→ Auth (withRoute)
→ Extract ctx.auth.tenantId (Fallback to 'default'!)
→ ragPipeline.ingest() (Fallback to 'default'!)
→ getPrisma().knowledgeDocument.upsert()
```

**مسار الاستعلام (Query):**
```text
User Request → /api/ai/chat أو /api/ai/rag
→ Auth (withRoute) أو resolveTenant()
→ queryRAG(tenantId) أو ragPipeline.query(tenantId)
→ searchVectorMine() أو vectorSearch()
→ Raw SQL (WHERE tenant_id = $1)
```

## 4. جدول مسارات الـ API والخدمات

| الملف / المسار | الخدمة | هل `tenantId` إجباري؟ | هل توجد Raw Queries؟ | هل توجد Silent Fallbacks؟ |
|---------------|-------|---------------------|----------------------|---------------------------|
| `/api/ai/ingest` | Ingest API | ❌ لا (يقبل default) | لا | 🔴 نعم (`?? 'default'`) |
| `/api/ai/chat` | Chat API | ✅ نعم (يمرر `ctx.auth.tenantId`) | لا | لا |
| `/api/ai/rag` | RAG API | ✅ نعم (`resolveTenant`) | لا | لا |
| `rag-pipeline.ts`| Pipeline Logic| ❌ لا | ✅ نعم (`$queryRawUnsafe`) | 🔴 نعم (`tenantId = 'default'`, `?? 'default'`) |
| `vector-store.ts`| Vector Query | ✅ نعم (معامل إلزامي) | ✅ نعم (`$queryRaw`) | لا |

## 5. تحليل المخاطر (Tenant Leakage Risk)
* **هل يوجد query بدون `tenant_id`؟** لا، كل الـ Raw SQL queries تستخدم `WHERE tenant_id = $1`.
* **هل يوجد Fallback صامت؟** **نعم وبشكل خطير.** 
  في ملف `src/lib/rag-pipeline.ts` (الأسطر 221، 266، 318) يوجد fallback صامت لقيمة `'default'`.
  وفي مسار `src/app/api/ai/ingest/route.ts` (السطر 36) يتم تمرير `'default'` إذا كان الـ `tenantId` مفقوداً.
* **الخطر (Tenant Leakage):** إذا قام أحد مسؤولي النظام (Admin) برفع مستندات وكانت جلسته لسبب ما تفتقر للـ `tenantId`، سيتم رفعها تحت الـ `default` tenant. وإذا تم استدعاء `ragPipeline.query` مستقبلاً من خدمة داخلية بدون تحديد `tenantId`، فسيقرأ من الـ `default` tenant. هذا يعني اختلاط أو تسريب محتمل لبيانات الـ Admin أو النظام لجهات لا ينبغي لها ذلك (Shared Tenant Data).
* **هل الـ Raw Queries معزولة؟** نعم، الاستعلامات نفسها مبنية بطريقة آمنة تقنياً (`WHERE tenant_id = $1`)، لكن مشكلة العزل تكمن في قيم المتغير المُمرر وليس في بنية الـ SQL.

## 6. الحكم النهائي
**CRITICAL_TENANT_LEAK_RISK**
يوجد خطر حقيقي بسبب الاعتماد على "Silent Fallback" لقيمة `'default'` في جوهر خدمة RAG (في الـ Pipeline والـ Ingest API). نظام الـ ERP يجب أن يمنع تماماً أي وصول لقاعدة البيانات إذا كان الـ `tenantId` غير محدد، ولا ينبغي أبداً افتراض `default`.

## 7. التوصية التالية
يجب إزالة كافة قيم الـ Fallback (`'default'`) من ملف `rag-pipeline.ts` و `api/ai/ingest/route.ts`، واستبدالها برمي خطأ صريح (Throw Error) أو استخدام `requireTenantId()`. يجب أن تخضع هذه التعديلات لبوابة اختبارات العزل أولاً.
