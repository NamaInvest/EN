# تقرير فحص وتخطيط المرحلة التطويرية (Scan & Plan Report) - Phase 3

## 1. تفاصيل النطاق والفحص التفصيلي (Scope & Detailed Scan)
تم فحص الكود البرمجي للملفات والمنافذ المستهدفة للترقية المعمارية والأمنية لنظام الموافقات:

* **الملفات المستهدفة (Files Reviewed)**:
  * [src/lib/approval-engine.ts](file:///d:/namasoft9-3-main/src/lib/approval-engine.ts): محرك الموافقات متعدد المستويات.
  * [src/lib/workflow/saga/purchase-sagas.ts](file:///d:/namasoft9-3-main/src/lib/workflow/saga/purchase-sagas.ts): المعالج التدفقي لأوامر الشراء (Saga).
  * [src/app/api/accounting/journal/route.ts](file:///d:/namasoft9-3-main/src/app/api/accounting/journal/route.ts): واجهة القيود اليومية اليدوية.
  * [src/app/api/approvals/[id]/approve/route.ts](file:///d:/namasoft9-3-main/src/app/api/approvals/[id]/approve/route.ts): واجهة معالجة الموافقة.

* **الصفحات المستهدفة (Pages Reviewed)**:
  * `/settings/approvals`: صفحة إعداد قواعد الاعتمادات (Approval Rules).
  * `/approvals/inbox`: صندوق اعتمادات المعتمدين والموافقة/الرفض.

* **الأزرار المستهدفة (Buttons Reviewed)**:
  * زر "Approve" (موافق) و "Reject" (رفض) في صندوق الوارد للاعتمادات.
  * زر "Submit" (حفظ وإرسال) في واجهة إدخال قيد يدوي أو أمر شراء.

* **واجهات الـ API المستهدفة (APIs Reviewed)**:
  * `POST /api/accounting/journal`
  * `POST /api/approvals/[id]/approve`
  * `POST /api/approvals/[id]/reject`

* **الموديلات المتأثرة في قاعدة البيانات (Models Reviewed)**:
  * `ApprovalRule` (قواعد الاعتماد)
  * `ApprovalRequest` (طلبات الاعتماد)
  * `ApprovalStep` (خطوات الاعتماد لكل مستوى)
  * `JournalEntry` (قيود اليومية)
  * `PurchaseOrder` (أوامر الشراء)

---

## 2. السلوك الحالي والسلوك المفقود والمخاطر (Behavior & Risks Analysis)

### أ. السلوك الحالي (Current Behavior)
1. **محرك الموافقات**: ينشئ `ApprovalEngine` نسخة من PrismaClient عبر `getPrisma(req)` في الـ constructor، مما يتطلب إرسال Request ويمنع تشغيله داخل عمليات المعاملات المالية المشتركة (Transactions) التي تملك عميل Prisma محلي ومقيد (`tx`).
2. **تدفق أوامر الشراء (Purchase Order Saga)**: في الخطوة 3 (`submit_approval`)، تقوم الـ Saga بإدراج سجل `ApprovalRequest` يدوياً ومباشرة في قاعدة البيانات دون استدعاء `ApprovalEngine.submit()`، مما يتخطى فحص قواعد المبالغ (`ApprovalRule`) ولا ينشئ أي خطوات اعتماد (`ApprovalStep`).
3. **تدفق القيود اليومية اليدوية (Manual Journal Entries)**: في منفذ `POST /api/accounting/journal`، يتم ترحيل القيد فوراً وحفظه كـ `posted` (مع تحديث أرصدة الحسابات) أو `draft` بناءً على طلب العميل في الـ body، دون أي تدقيق أو مطابقة لقواعد الاعتمادات اليدوية المفروضة.

### ب. السلوك المفقود (Missing Behavior)
1. **تمرير Prisma Client**: عدم قدرة `ApprovalEngine` على قبول عميل Prisma ممرر مباشرة (مثل `tx` في المعاملات المالية).
2. **مطابقة القواعد ديناميكياً**: عدم استخلاص وتوليد مستويات الاعتماد بناءً على إجمالي المبالغ وقواعد المستأجر المحددة.
3. **منع الترحيل المباشر**: السماح بتعديل أرصدة الحسابات مباشرة للقيود اليدوية عالية القيمة دون المرور ببوابة صانع القرار والمدقق (Maker-Checker).

### ج. المخاطر المترتبة (Risks Identified)
1. **مخاطر النزاهة المالية والحوكمة**: ترحيل قيود يدوية أو أوامر شراء بملايين الريالات دون رقابة أو اعتماد من أصحاب الصلاحيات.
2. **مخاطر تسريب وتداخل البيانات (Tenant Leakage)**: تشغيل الموافقات دون التحقق الصارم من عزل المستأجرين للخطوات والقواعد.
3. **مخاطر تكرار الاعتماد**: فقدان التزامن وتكرار الخطوات لنفس الوثيقة عند حدوث طلبات متزامنة.

---

## 3. خطة التنفيذ المقترحة (Proposed Execution Plan)

### أ. التعديلات البرمجية المطلوبة:
1. **محرك الموافقات**: تعديل constructor الخاص بـ `ApprovalEngine` في [src/lib/approval-engine.ts](file:///d:/namasoft9-3-main/src/lib/approval-engine.ts) ليقبل معاملاً اختيارياً كعميل Prisma:
   ```typescript
   constructor(reqOrPrisma?: Request | ReturnType<typeof getPrisma>) {
     if (reqOrPrisma && typeof (reqOrPrisma as any).$transaction === 'function') {
       this.prisma = reqOrPrisma as any;
     } else {
       this.prisma = getPrisma(reqOrPrisma as Request) as any;
     }
   }
   ```
2. **أوامر الشراء**: تعديل الخطوة 3 (`submit_approval`) في [src/lib/workflow/saga/purchase-sagas.ts](file:///d:/namasoft9-3-main/src/lib/workflow/saga/purchase-sagas.ts):
   - احتساب إجمالي مبلغ أمر الشراء (`subtotal + taxValue`).
   - استدعاء `ApprovalEngine.submit()` مع تمرير سياق المعاملة `prisma`.
   - إذا تم الاعتماد التلقائي (`auto_approved`)، يتم تحديث حالة أمر الشراء مباشرة إلى `'approved'`.
   - إذا تطلب الاعتماد، يتم تحديث الحالة إلى `'pending'` وحفظ معرف الطلب في `approvalRequestId`.
3. **القيود اليومية**: تعديل POST في [src/app/api/accounting/journal/route.ts](file:///d:/namasoft9-3-main/src/app/api/accounting/journal/route.ts):
   - التحقق من قواعد الموافقات للقيود اليومية عبر `ApprovalEngine`.
   - إذا انطبقت قواعد اعتماد، يتم حفظ القيد بحالة `'pending_approval'` بدلاً من `'posted'` ويتم إنشاء طلب الموافقة.
   - يمنع تحديث أرصدة الحسابات إلا عند انتقال القيد إلى حالة `'posted'` (التي تتم لاحقاً عند اعتماد القيد بالكامل).

---

## 4. خطة الاختبار والتحقق والتراجع (Test & Rollback Plan)

### أ. الاختبارات المطلوبة (Test Plan):
* **اختبارات وحدة (Unit Tests)**: إنشاء `tests/unit/approval-engine.test.ts` لاختبار استدعاءات `ApprovalEngine` وتمرير Prisma Client المخصص.
* **اختبارات تكاملية (Integration Tests)**:
  * إنشاء `tests/integration/procurement/purchase-approval.test.ts` لاختبار تدفق Saga مع قواعد الموافقات.
  * إنشاء `tests/integration/accounting/journal-approval.test.ts` لاختبار القيود اليومية ودورة الموافقات.

### ب. خطة التراجع والتأمين (Rollback Plan):
في حال رصد أي خلل، سيتم التراجع فوراً عبر Git:
```bash
git checkout HEAD -- src/lib/approval-engine.ts src/lib/workflow/saga/purchase-sagas.ts src/app/api/accounting/journal/route.ts
```

### ج. شروط عدم المتابعة (No-Go Conditions):
* أي فشل في اختبارات عزل المستأجرين (Tenant Isolation).
* كسر استدعاءات الترحيل التلقائي للفواتير أو الرواتب.
* عدم توازن القيود المحاسبية أو التأثير الخاطئ على الأرصدة.
