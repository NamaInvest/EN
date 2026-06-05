# تقرير تحليل الأثر البرمجي والتشغيلي (Impact Analysis Report) - Phase 4

## 1. الملفات المتوقع تعديلها (Files to be Modified)
* **ملفات الكود (Runtime Code)**:
  * [src/lib/approval-engine.ts](file:///d:/namasoft9-3-main/src/lib/approval-engine.ts): دعم استقبال عميل Prisma ممرر مباشرة في الـ constructor.
  * [src/lib/workflow/saga/purchase-sagas.ts](file:///d:/namasoft9-3-main/src/lib/workflow/saga/purchase-sagas.ts): استدعاء محرك الموافقات لخطوات الـ PO Saga.
  * [src/app/api/accounting/journal/route.ts](file:///d:/namasoft9-3-main/src/app/api/accounting/journal/route.ts): توجيه القيود المحاسبية اليدوية لمحرك الموافقات وتعديل الحالة الافتراضية.

* **ملفات الاختبارات (New Test Files)**:
  * `tests/unit/approval-engine.test.ts` (جديد): لاختبارات الوحدة لمحرك الموافقات.
  * `tests/integration/procurement/purchase-approval.test.ts` (جديد): لاختبارات تدفق الشراء مع الموافقات.
  * `tests/integration/accounting/journal-approval.test.ts` (جديد): لاختبارات قيود اليومية مع الموافقات.

---

## 2. تقييم التأثير على الأنظمة والوظائف (Impact Matrix)

* **تأثير وقت التشغيل (Runtime Impact)**:
  * سيتغير سلوك إنشاء قيود اليومية اليدوية وأوامر الشراء. بدلاً من حفظها كـ `posted` فوراً، ستخضع لفحص القواعد. إذا انطبقت القواعد، ستتغير حالتها إلى `pending_approval` أو `pending` ولن تؤثر على أرصدة الحسابات إلا بعد الاعتماد النهائي وتغيير الحالة إلى `posted`.
  * التغييرات متوافقة رجعياً 100% لأنها لا تغير سلوك الفواتير التلقائية أو الرواتب أو الإهلاك التي تنشأ آلياً بحالة `posted`.

* **تأثير قاعدة البيانات والمخطط (Database / Schema Impact)**:
  * **لا يوجد (DB_CHANGED: NO)**. جداول الموافقات والاعتمادات موجودة ومعدة مسبقاً في مخطط Prisma وقاعدة البيانات. لن نقوم بتشغيل أي migrations أو db push.

* **التأثير المالي والأمني (Financial & Security Impact)**:
  * تأثير إيجابي حاسم. يمنع التعديل مخاطر قيام موظفين بترحيل قيود مالية مغلوطة أو التزامات شراء ضخمة مباشرة دون موافقة الإدارة المالية والمدراء المعتمدين.

* **أمن عزل المستأجرين (Tenant Isolation)**:
  * خاضع للتأمين الكامل. يعتمد `ApprovalEngine` على `tenantId` المستخلص أمنياً من واجهة الطلبات والـ Middleware، ويتم مطابقة القواعد والخطوات وطلب الموافقات لكل شركة بشكل معزول فيزيائياً أو منطقياً.

* **مخاطر تسريب الأسرار (Secrets Risk)**:
  * **لا يوجد**. لن يتم لمس ملفات التكوين البيئي `.env` أو التعامل مع أسرار أو مفاتيح تشفير خاصة.

* **مخاطر الامتثال الحساس (ZATCA/WPS/HR/AI Sensitive Risk)**:
  * لا توجد أي مخاطر. الموافقات تتم محلياً وتاريخياً قبل أي محاولة تصدير ملفات WPS أو ZATCA XML، مما يضمن أمان الامتثال القانوني.

* **أثر البناء والترميز (Build & TypeScript Impact)**:
  * تغيير طفيف في التوقيع لا يؤثر على بناء الموديولات الأخرى. سيتم تشغيل فحوصات الجودة البرمجية والتأكد من نجاح `npm run build` و `npm run typecheck` بالكامل.

---

## 3. استراتيجية التراجع الفوري (Rollback Strategy)

في حال رصد أي مشكلة أو تراجع في بيئة التطوير المحلية أثناء الاختبارات:
1. التراجع عن الملفات المعدلة:
   ```bash
   git checkout HEAD -- src/lib/approval-engine.ts src/lib/workflow/saga/purchase-sagas.ts src/app/api/accounting/journal/route.ts
   ```
2. حذف ملفات الاختبار المضافة لضمان رجوع المستودع للجاهزية ونظافته التامة.
