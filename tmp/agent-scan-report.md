# SCAN + PLAN REPORT: Phase 1.6 (Direct Stock Mutation Audit)
**Date:** 2026-05-15
**Focus:** `api/stocktake`, `api/products/import`, and uncontrolled mutations of `currentStock`.

## 🚨 أبرز 5 مخاطر متبقية (Top 5 Risks):

1. **الخطر الأول: اختراق المستودعات في الجرد (`api/stocktake`)**
   * **المشكلة:** عند تفعيل الجرد (`applyAdjustment`)، النظام يحدّث الـ `currentStock` بـ `for` loop بدون `transaction`، **ويتجاهل تماماً** تحديث الـ `ProductStock` (رصيد المستودع)!
   * **الأثر المالي والرقابي:** لا يتم تسجيل حركة `StockMovement` للفرق، ولا يتم إنشاء قيد تسوية جردية `postInventoryAdjustment`، ممّا يُحدث فجوة مالية فورية بين المخزون المادي والمحاسبي.

2. **الخطر الثاني: أرصدة وهمية عبر الاستيراد (`api/products/import`)**
   * **المشكلة:** استيراد المنتجات بملف Excel يسمح بإدخال `currentStock > 0`. يتم إدراج هذا الرقم في الـ `Product` مباشرة دون إنشاء `ProductStock`.
   * **الأثر المالي والرقابي:** بضاعة تظهر في النظام بدون مستودع، بدون حركة `StockMovement` (رصيد افتتاحي)، وبدون قيد محاسبي يثبت رأس المال (Dr Inventory / Cr Opening Balance).

3. **الخطر الثالث: غياب طبقة `InventoryService` الموحدة**
   * **المشكلة:** كل مسار (`purchases`, `stocktake`, `import`, `manufacturing`) يقوم بكتابة الـ `update` الخاص بالمخزون بشكل يدوي ومختلف. 
   * **الأثر:** أي تحديث مستقبلي سيتطلب تتبع عشرات الملفات، ويزيد من احتمالية سقوط الـ Atomicity.

4. **الخطر الرابع: مسارات التصنيع (Manufacturing & MRP)**
   * **المشكلة:** مسارات إهلاك المواد الخام وإضافة المنتج التام (`manufacturing/work-orders`) مرشحة بشدة لاحتواء نفس ثغرات التحديث المباشر للمخزون بدون قيود تصنيع دقيقة أو بدون `transaction`.

5. **الخطر الخامس: تحديثات الـ API الخارجية (E-Commerce Sync)**
   * **المشكلة:** إذا كانت نقاط المزامنة مع Zid/Salla تحدث المخزون مباشرة، فهذا سيخلق فروقات بدون أثر تدقيق (Audit Trail).

---

## 📁 الملفات المتأثرة بشكل مباشر (للإصلاح الفوري):
* `src/app/api/stocktake/route.ts` (يحتوي على تدمير للـ Atomicity والـ Warehouse sync).
* `src/app/api/products/import/route.ts` (يسمح بإدخال مخزون دون قيود).

---

## 💡 التوصية (أيهما نبدأ؟):
نوصي بالبدء بـ **`api/stocktake` (الجرد)**. 
**السبب:** الجرد عملية مالية وتشغيلية دورية حرجة تُستخدم تحديداً لـ "تصحيح" الأرصدة. إذا كانت أداة التصحيح نفسها معيبة (تحدث فجوة بين `currentStock` و `ProductStock` ولا تسجل قيوداً)، فإنها تدمر موثوقية النظام المالي بالكامل.

---

## 🛠️ خطة تنفيذ مصغرة وآمنة لـ `stocktake`:
1. في `api/stocktake/route.ts`: عندما يكون `body.applyAdjustment = true`، نقوم بفتح `prisma.$transaction`.
2. بداخل الـ Transaction: 
   * نحدث `tx.product.update`.
   * نحدث `tx.productStock.upsert` للمستودع الافتراضي أو المحدد.
   * ننشئ `tx.stockMovement.create` لإثبات فرق الجرد.
   * نستدعي `postInventoryAdjustment` لتسجيل التسوية المحاسبية مالياً.
