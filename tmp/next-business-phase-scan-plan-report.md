# تقرير فحص وتخطيط المرحلة التطويرية (Scan & Plan Report) - Phase 3

## 1. تفاصيل النطاق والفحص التفصيلي (Scope & Detailed Scan)
تم فحص الكود البرمجي للملف المستهدف للترقية الأمنية والمعمارية:

* **الملف المستهدف**: `src/lib/material-issuance.ts`
* **الموديلات المتأثرة في قاعدة البيانات (Models Reviewed)**:
  * `ManufacturingOrder`
  * `Product`
  * `ProductStock`
  * `StockMovement`
  * `ManufacturingCost`

### أ. السلوك الحالي للكود (Current Behavior)
1. ينشئ نسخة مستقلة من PrismaClient في السطر 6: `const prisma = new PrismaClient();` مما يستهلك اتصالات قاعدة بيانات زائدة ويخالف القوانين.
2. الدوال `generatePicklist` و `executeBackflushing` تستعلم وتعدل البيانات باستخدام الـ IDs المباشرة فقط بدون فحص أو تصفية `tenantId` المالك للبيانات.
3. دالة `executeBackflushing` تسمح بالخصم المباشر والتحديث لـ `ManufacturingOrder` والـ `Product` بدون أي حماية ضد إعادة المحاولة (Idempotency) أو فحص ما إذا كان أمر التصنيع مغلقاً بالفعل أو ملغياً.

### ب. المخاطر المترتبة (Risks Identified)
1. **تسريب وتلاعب بالبيانات بين المستأجرين (Cross-Tenant Data Leakage)**: يمكن لمستأجر (Tenant A) معرفة أو تعديل أو خصم مخزون مستأجر آخر (Tenant B) بمجرد تخمين معرف أمر التصنيع `moId` أو معرف المنتجات.
2. **الخصم المزدوج للمواد الخام (Double Deducting)**: في حالة انقطاع الشبكة وإعادة إرسال طلب الخصم التلقائي، سيقوم المحرك بخصم المخزون وتكرار قيود التكاليف وحركات المخازن لنفس أمر التصنيع بشكل مكرر وخاطئ.

---

## 2. التغييرات المقترحة وخطة التنفيذ (Proposed Changes & Execution Plan)

### أ. التعديلات البرمجية في [material-issuance.ts](file:///d:/namasoft9-3-main/src/lib/material-issuance.ts):
1. إزالة `new PrismaClient()` بالكامل وتفويض الدوال لاستقبال سياق `prisma` كأول معامل لها.
2. تعديل التوقيع للدوال وإضافة `tenantId: string` كمعامل إلزامي:
   - `static async generatePicklist(prisma: any, moId: number, tenantId: string)`
   - `static async executeBackflushing(prisma: any, moId: number, completedQty: number, userId: number, stockId: number, tenantId: string)`
3. تصفية جميع عمليات الاستعلام والتحديث والتعديل في المعاملات (Transactions) باستخدام شرط `tenantId` المالك:
   - فحص وجود MO: `where: { id: moId, tenantId }`
   - فحص وتحديث المنتجات والمخزون: `where: { id: rawProductId, tenantId }`
   - إدراج حركات المخازن والتكاليف مع إرفاق `tenantId` المالك.
4. **حارس منع التكرار والتزامن (Idempotency Guard)**:
   - التحقق من حالة أمر التصنيع: إذا كانت الحالة `COMPLETED` أو `CANCELLED` يتم رفض العملية فوراً.
   - التحقق من الكمية المطلوب إنتاجها: إذا تم تلبية الكمية المطلوبة بالكامل مسبقاً، يتم حظر العملية لمنع الخصم المزدوج.

---

## 3. خطة الاختبار والتحقق (Test Plan)
سنقوم بإنشاء ملف اختبارات وحدة شامل في `tests/unit/material-issuance.test.ts` (باستخدام Vitest) لتغطية الحالات التالية:
1. **اختبار تصفية المستأجرين**: التحقق من أن الدوال ترفض استرجاع أو خصم مخزون مستندات تابعة لمستأجر آخر وتلقي استثناءً واضحاً.
2. **اختبار حارس التكرار**: التحقق من رفض عمليات الخصم التلقائي لأوامر التصنيع المغلقة أو الملغية.
3. **اختبار تكامل العمليات وسحب المخزون**: التحقق من صحة الخصم وحركات المخازن عند استدعائها بشكل سليم لنفس المستأجر.

---

## 4. خطة التراجع (Rollback Plan)
في حال فشل أي اختبار أو حدوث تراجع أثناء التطوير المحلي، سنقوم باسترجاع الملف الأصلي عبر Git:
`git checkout HEAD -- src/lib/material-issuance.ts`
