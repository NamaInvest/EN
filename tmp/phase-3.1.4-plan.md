# Phase 3.1.4 — Safe Expansion Mode & Tenant P0 Hardening Plan

## 1. الهدف من Phase 3.1.4
استكمال الإغلاق المحكم للـ Tenant Isolation (إصلاح بقية الـ 294 حالة P0_CONFIRMED المتبقية) وتأمين حدود المعاملات (Transaction Boundaries) بالكامل لوحدات **التصنيع (Manufacturing)**، **الموارد البشرية (HR/Payroll)**، و**الصيدلة (Pharmacy)**، مع تفعيل بنية الـ Outbox Pattern للأحداث غير المتزامنة فيها.

## 2. المجالات المتأثرة
- **Manufacturing:** أوامر الإنتاج (Production Orders)، الاستهلاك (BOM Consumption)، والهدر (Scrap).
- **HR / Payroll:** مسيرات الرواتب وتأثيرها على القيود اليومية.
- **Pharmacy:** صرف الوصفات الطبية (Prescriptions)، سحب المخزون الدوائي، وتاريخ الصلاحية (Batches).

## 3. الجداول المتأثرة
- `ProductionOrder`, `ProductionScrap`, `BillOfMaterial`
- `Payroll`, `Employee`
- `Prescription`, `StockMovement`, `ItemBatch`
- `OutboxEvent` (الجداول التي تم إضافتها حديثًا)

## 4. طبيعة المرحلة
المرحلة هي مزيج معقد من:
- **Inventory:** سحب وإضافة مخزون (تصنيع وصيدلة).
- **Financial:** تسجيل قيود الرواتب واستهلاك التصنيع.
- **Async / Integration:** تسجيل أحداث (Events) للـ Outbox لمعالجتها لاحقاً (مثل تزامن الصيدلة أو تنبيهات التصنيع).

## 5. تحليل المخاطر المعمارية
- **مخاطر Atomicity:** عالية. فشل استهلاك المخزون في التصنيع يجب أن يلغي حركة الإنتاج بأكملها (All-or-Nothing).
- **مخاطر Tenant Isolation:** حرجة (CRITICAL). تسرب وصفات طبية أو أوامر تصنيع لـ Tenant آخر كارثة أمنية وعملية.
- **مخاطر Rollback:** تتطلب Transactions قوية. إذا تم خصم الرواتب يجب ضمان قيد المحاسبة، وإلا الـ Rollback إلزامي.
- **Race Conditions:** موجودة بقوة في سحب المخزون (Inventory Allocation) خصوصاً للصيدلة والتصنيع وقت الضغط.

## 6. المتطلبات التقنية للمرحلة
- **هل تحتاج Outbox events؟** نعم، لتخفيف الحمل الزمني. أوامر التصنيع وصرف الأدوية يجب أن تصدر Outbox Event لاعتماد القيود والمزامنة الخارجية.
- **هل تحتاج Idempotency Keys؟** نعم، ضرورية في الـ Payroll Run وفي صرف الـ Prescriptions لمنع الصرف المزدوج.
- **هل تحتاج Distributed Locks؟** يفضّل تطبيقها (أو DB row-level locks) عند سحب كميات من نفس الـ Item Batch لمنع الـ Race Condition.
- **هل توجد API contracts يجب تثبيتها؟** نعم، أي مسار للتصنيع والصيدلة سيتم تأمينه ولن تتغير بنيته الخارجية (Response/Request shape).
- **هل نحتاج Service extraction؟** نعم، فصل منطق سحب المخزون إلى `inventory-allocation.service.ts` لضمان مركزية الـ Tenant-check والـ Locks.
- **هل توجد Schema migrations؟** قد نحتاج فقط لضمان تواجد حقل `idempotency_key` في الجداول الحساسة (مثل `Payroll` و `Prescription`) إذا لم يكن موجوداً.

## 7. تقييم مستوى الخطورة
🚨 **CRITICAL (حرج جداً)** - لأنها تمس المخزون بشكل مباشر (Costing & Quantities) وتمس الرواتب والبيانات الطبية (Compliance).

---

## 8. Implementation Sequence (تسلسل التنفيذ)

تم تقسيم التنفيذ إلى مراحل صارمة لا تتداخل:

1. **Schema & Planning:**
   - فحص وجود حقول الـ Idempotency، وتحضير `tenant-guard` للوحدات المتبقية.
2. **Services (The Core):**
   - تعزيز `inventory-allocation.service.ts` بـ Idempotency و Tenant Isolation.
   - تعزيز `payroll.service.ts`.
3. **Routes (API Security):**
   - تطبيق `requireTenantId` وإصلاح P0_CONFIRMED لـ `/api/manufacturing/*`.
   - إصلاح `/api/hr/*`.
   - إصلاح `/api/pharmacy/*`.
4. **Workers:**
   - تجهيز `outbox-relay.worker.ts` لالتقاط أحداث `PAYROLL_GENERATED` و `INVENTORY_CONSUMED`.
5. **Integrations:**
   - تأمين الـ Endpoints الخاصة بتزامن بيانات الصيدلة الخارجية.
6. **Tests:**
   - تشغيل `npm run audit:tenant-p0` للتأكد من نزول الرقم من 294 إلى صفر في هذه الوحدات.
7. **Docs:**
   - تحديث الـ AI Brain بخريطة الخدمات الجديدة.
