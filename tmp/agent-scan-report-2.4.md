# تقرير فحص وتخطيط - Phase 2.4: Background Reconciliation Jobs

## 1. هل يوجد نظام jobs/cron/scheduler حالي؟
نعم، المشروع يعتمد بشكل أساسي على **BullMQ** مدعوماً بـ **Redis (IORedis)** لمعالجة المهام الخلفية (Background Jobs). 
توجد إعدادات الـ Queue والـ Workers في:
- `src/lib/queue/index.ts`
- يتم تشغيل الـ Workers في Process منفصل عبر `src/scripts/start_workers.ts`.

## 2. ما هي التقنيات المستخدمة للـ Queues؟
يُستخدم **BullMQ** مع **Redis**، ويوجد حالياً عدة Queues مجهزة مسبقاً (مثل `emailQueue`, `pdfQueue`, `syncQueue`, `reportQueue` و `aiAuditQueue`). يمكننا استخدام BullMQ Repeatable Jobs (والتي تمثل Cron Jobs في BullMQ) لتشغيل مهام دورية.

## 3. أين أفضل مكان لوضع الـ job؟
أفضل معمارية مقترحة لفصل الـ Business Logic عن الـ Routing والـ Workers:
1. **Core Logic**: يتم نقله إلى `src/lib/system-audit.ts` كدالة `runSystemReconciliation(prisma, tenantId)`.
2. **Worker Definition**: يتم تعريف الـ Worker الجديد في مجلد مخصص (مثل `src/workers/audit/reconciliation.worker.ts`).
3. **Queue Registration**: تضاف الـ Queue الخاصة به في `src/lib/queue/index.ts`، ويتم إضافة إعداد Repeatable Job (Cron) لتعمل يومياً عند منتصف الليل.

## 4. كيف يمكن إعادة استخدام منطق `/api/admin/system-audit`؟
سيتم فصل المنطق البرمجي (استخراج الفواتير المعلقة، فحص المخزون، التأكد من فواتير الخزينة) المتواجد حالياً داخل مسار الـ API (`route.ts`) ووضعه داخل دالة منفصلة:
```typescript
export async function runSystemReconciliation(prisma: PrismaClient) {
    // ... logic ...
    return { summary, findings };
}
```
بهذا الشكل:
- مسار الـ API سيستدعي `runSystemReconciliation` ويعيد النتيجة للمستخدم كـ JSON (للفحص اليدوي السريع).
- الـ BullMQ Worker سيستدعي نفس الدالة بالضبط لكن في الخلفية (Background)، وبدون تكرار أي كود.

## 5. مقترح التصميم وخطة التنفيذ (Design & Plan)

**أ. استخراج الدالة:**
- إنشاء `src/lib/system-audit.ts`.
- نقل الكود الحالي من الـ API Route إليها.

**ب. بناء الـ Job وتسجيل النتيجة:**
- تعريف Worker جديد لجدولة الدالة الدورية (مثلاً `systemReconciliationQueue` بتردد `cron: '0 0 * * *'`).
- عند الانتهاء من الفحص الخلفي، بدلاً من تعديل هيكلة قاعدة البيانات (Schema) وإضافة جداول جديدة، يمكننا **استخدام جدول `AuditLog` الحالي** الذي تم تصميمه في Phase 2.3.1.
- سيسجل الـ Job تدقيقاً بنوع الحدث `action: 'SYSTEM_RECONCILIATION'`, `entityType: 'System'`, ويتم وضع النتائج (summary) داخل الحقل `newData` بصيغة JSON. وإذا كانت هناك مشاكل حرجة، يتم تسجيل `status` أو إرسال تنبيه عبر `emailQueue` للمدير (Admin).

**ج. مخاطر الأداء (Performance Risks):**
- مسح جميع الفواتير والمخزون بدون تحديد `tenantId` (إن وجد) قد يؤدي إلى استهلاك عالي للذاكرة مع زيادة حجم البيانات.
- *الحل:* تقسيم الفحص لكل `tenant` إذا كان النظام Multi-Tenant بشكل عميق، أو وضع `Pagination/Batches` في استعلامات الـ Prisma حتى لا يحدث `Memory Overflow`.

## 6. تعريف الإنجاز (Definition of Done)
1. منطق الفحص مفصول تماماً في `src/lib/system-audit.ts`.
2. مسار `api/admin/system-audit` يعمل بشكل طبيعي ويعتمد على الدالة المفصولة.
3. تم إعداد BullMQ Job لتشغيل `runSystemReconciliation` بشكل دوري (مثلاً كل 24 ساعة).
4. نتائج الفحص الدوري تُحفظ في جدول `AuditLog` دون الحاجة إلى تعديل الـ Schema.
5. لا يوجد أي تكرار للكود بين الـ Job والـ API.
