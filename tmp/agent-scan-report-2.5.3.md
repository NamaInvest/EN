# تقرير فحص وتخطيط - Phase 2.5.3: First Service Contract Migration

## 1. الهدف (Objective)
بدء المرحلة الأولى من تفعيل `Compile-Time Enforcement` داخل الـ Business Layer. 
سنأخذ مسار `API` حرج ونقوم بفصل منطق الأعمال (Business Logic) الخاص به إلى خدمة (Service) مستقلة. هذه الخدمة ستشترط وجود `InventoryTxClient` ولا تقبل الـ `PrismaClient` العام، مما يمنع أي مطور من استدعاء هذه الخدمة خارج الـ Transaction.

## 2. المسار المختار (Target Route)
المسار: `src/app/api/inventory/stocktake/[id]/approve/route.ts`
يحتوي حالياً على كود يقوم بـ:
- تحديث `stocktakeItem`
- تحديث `product.currentStock`
- إنشاء `stockMovement`
كل ذلك بداخل `prisma.$transaction(async (tx: any) => {...})`.

## 3. خطة التنفيذ (Execution Plan)

### أ. بناء الخدمة (Service Contract)
- إنشاء ملف `src/lib/services/inventory-adjustment.service.ts`.
- بناء الكلاس `InventoryAdjustmentService`.
- بناء دالة `approveStocktake(tx: InventoryTxClient, stocktakeId: number, tenantId: string, ipAddress: string | null)`:
  - هذه الدالة تأخذ `tx` **مُعرّف بدقة** `InventoryTxClient`.
  - الدالة لا تقوم بفتح Transaction، بل تتوقع أن يكون مفتوحاً ومُمرراً لها.
  - سيتم نقل الكود من المسار إلى داخل هذه الدالة.

### ب. تحديث الـ API Route
- في `src/app/api/inventory/stocktake/[id]/approve/route.ts` سنستبدل `prisma.$transaction` بـ `runInventoryTx`.
- سيصبح المسار عبارة عن `Controller` رفيع جداً (Thin Controller).
- سيقوم باستدعاء `InventoryAdjustmentService.approveStocktake(tx, ...)`.

## 4. القيود المعمارية الجديدة (New Architectural Bounds)
بمجرد تنفيذ هذا:
1. لن يستطيع أحد تعديل مخزون الجرد إلا عبر `InventoryAdjustmentService.approveStocktake`.
2. لن يستطيع أحد استدعاء `approveStocktake` دون تمرير `tx` من نوع `InventoryTxClient`.
3. سيفشل الـ `tsc` لو حاول أحد تمرير `prisma` عام.

## 5. مخرجات الفحص
هل التعديل آمن؟ نعم، نحن فقط ننقل الـ Logic ونفرض Type Constraint جديد دون كسر طريقة العمل، بل نجعلها مدعومة بالـ Compiler بشكل كامل.
