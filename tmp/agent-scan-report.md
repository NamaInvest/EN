# Phase 1.7 - Agent Scan & Plan Report

## النطاق المفحوص (Scan Scope)
تم إجراء مسح شامل على مسارات تعديل المخزون والقيود المحاسبية للموديلات التالية:
1. المبيعات (`api/sales`)
2. مردودات المبيعات (`api/sales-returns`)
3. سندات التسليم (`api/sales/delivery-notes`)
4. أوامر التصنيع (`api/manufacturing/work-orders`)
5. المرتجعات الشرائية (`api/purchase-returns`)

## تحليل الوضع الحالي
1. **مسارات المبيعات والمردودات (Sales & Returns):**
   * تعمل بشكل سليم من ناحية الـ Transaction. جميع القيود المحاسبية (`postSalesInvoice`, `postSalesReturn`) وحركات المخزون تمرر `txClient: tx`.
   * **التقييم:** ACID Compliant.

2. **مسار سندات التسليم (Delivery Notes):**
   * **المشكلة:** يقلل `product.currentStock` وينشئ `StockMovement` برقم مستودع ثابت (`stockId: 1`) ويتجاهل تماماً تحديث `ProductStock`.
   * **الخطر:** Split-Brain بين الرصيد الإجمالي ورصيد المستودع (بضاعة تخرج من العدم).

3. **مسار أوامر التصنيع (Manufacturing Work Orders):**
   * **المشكلة 1 (خطيرة جداً):** استدعاء القيود المحاسبية (`postMaterialIssueToWIP` و `postManufacturingCompletion`) يتم **خارج** الـ Transaction `prisma.$transaction`.
   * **المشكلة 2:** عند استلام المنتج التام (`status === 'completed'`)، يتم تحديث `currentStock` بدون تحديث `ProductStock` الخاص بالمستودع.
   * **الخطر:** إذا فشل إنشاء القيد المحاسبي لأي سبب (مثل نقص إعدادات الحسابات)، سيتم خصم الخامات وإضافة المنتج التام فعلياً في النظام دون أي أثر مالي (أرصدة وهمية معمارية، وفقدان تام للمواد الخام).

## أعلى المخاطر المتبقية بالترتيب
1. **Manufacturing Work Orders (Critical):** تحويل الخامات إلى منتج تام يتم مالياً خارج المعاملة، وتحديثات المستودعات مبتورة.
2. **Sales Delivery Notes (High):** خروج البضاعة يتم بدون خصم من أرصدة المستودع الحقيقية (`ProductStock`) برقم مستودع ثابت `1`.
3. **Products Bulk Import (Medium):** لم يتم بناء مسار لإدخال الأرصدة الافتتاحية بشكل آمن محاسبياً.

## التوصية (Phase 1.7)
يجب توجيه الضربة القادمة إلى **`api/manufacturing/work-orders` (Manufacturing Atomicity Fix)** نظراً لحساسيته المالية (تحويل أصول من حسابات لأخرى).

**خطة العمل (Manufacturing):**
1. إدخال `postMaterialIssueToWIP` و `postManufacturingCompletion` داخل `tx`.
2. ربط استلام المنتج التام بـ `ProductStock.upsert` و `StockMovement`.
3. ربط صرف الخامات بـ `tx.product.update` و `ProductStock.upsert` و `StockMovement`.

انتظر توجيهك لبدء Phase 1.7 بناءً على ما سبق.
