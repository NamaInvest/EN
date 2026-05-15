# SCAN + PLAN REPORT: Financial & Inventory Integrity
**Date:** 2026-05-15
**Focus:** Residual Atomicity, Isolation, and Workflow Gaps.

---

## 🛑 Top 5 Remaining Risks

1. **[CRITICAL] Goods Receipt (GRN) & Purchase Receiving Atomicity:**
   * **المشكلة:** في مسارات استلام البضاعة (`POST /api/grn` و `PUT /api/purchases/[id]/receive`)، يتم إنشاء سجل الاستلام وتحديث المخزون `product.update`، لكن القيد المحاسبي `postGRN` يتم إنشاؤه خارج الـ transaction ومحاط بـ `.catch()` لابتلاع الأخطاء! هذا يعني أنه إذا فشل النظام المحاسبي (مثلاً: فترة مغلقة)، سيزيد المخزون الفعلي بينما لا تسجل قيمته في ميزان المراجعة (Stock-to-GL Desync حاد).
2. **[HIGH] Direct Stock Updates without GL Binding:**
   * **المشكلة:** بعض المسارات مثل `api/stocktake/route.ts` وعمليات استيراد المنتجات `api/products/import` تحدث `product.currentStock` مباشرة بدون أي تزامن محاسبي أو تحديث لـ `ProductStock`.
3. **[MEDIUM] Sales & Purchase Returns Workflows:**
   * **المشكلة:** مسارات إرجاع المبيعات (`api/sales/returns`) تنشئ طلبات الإرجاع `salesReturn` وتحديثات الـ `DocumentStateLog` خارج أي إطار معاملي (Transaction)، ولا ترتبط بشكل صلب مع قيود الاسترجاع المحاسبية في نفس اللحظة.
4. **[MEDIUM] Audit Logging Escaping Transactions:**
   * **المشكلة:** التحديث اليدوي للقيود (`PATCH /api/accounting/journal/[id]`) يستدعي `logFieldChanges` لتوثيق تغييرات التدقيق، لكنه يتم في `try/catch` خارج הـ `$transaction` الرئيسي. إذا فشل القيد قد يسجل خطأً أنه تم، وإذا نجح القيد قد لا يُسجل بسب خطأ برمجي في التدقيق دون عمل Rollback.
5. **[LOW] Tenant/Branch Isolation Consistency:**
   * **المشكلة:** بعض المسارات تعتمد على Fallback بـ `null` للفرع، ولا تفرض `tenantId` (إن وجد) في استعلامات الـ `findUnique`، مما يترك ثغرة نظرية إذا كان هناك Tenants متعددين بقواعد بيانات مشتركة.

---

## ⚠️ هل يوجد خطر Critical يستحق Phase 1.5؟
**نعم وبكل تأكيد.** ثغرة **استلام البضائع (GRN)** مطابقة تماماً للمشكلة التي حللناها للتو في الـ Adjustments. السماح بابتلاع أخطاء المحاسبة أثناء استلام البضائع سيدمر قيمة المخزون (Inventory Valuation) في الـ GL.

## 🎯 التوصية الواضحة: المحور القادم
**Phase 1.5: GRN & Receiving Atomicity**
يجب دمج `postGRN` داخل الـ `$transaction` الخاص بـ `POST /api/grn`، وإزالة הـ `try/catch` التي تبتلع الأخطاء، ونقل الـ `txClient: tx` إلى دالة المحاسبة للحفاظ على سلامة المخزون ↔ المحاسبة عند الاستلام.

## 🛠 خطة تنفيذ مصغرة وآمنة (Phase 1.5)
1. **تعديل `src/lib/auto-journal.ts`:** إضافة دعم `txClient` لدالة `postGRN`.
2. **تعديل `src/app/api/grn/route.ts`:** نقل استدعاء `postGRN` إلى داخل كتلة `prisma.$transaction`.
3. **التخلص من `.catch(...)`:** السماح للخطأ المحاسبي بإجهاض كامل الـ transaction ورفض استلام البضاعة فيزيائياً إن لم تترجم محاسبياً.
4. **توحيد `ProductStock`:** التأكد من تحديث رصيد المستودع (تم البدء به في GRN، يحتاج تنقيح ليصبح `await tx.productStock...` بدل الابتلاع بـ `catch`).
