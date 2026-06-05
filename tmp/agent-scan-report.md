# تقرير الفحص والتحليل الأمني - تفعيل وتحصين موديول حماية الأجور (HR/WPS Module Hardening)

تم إجراء فحص شامل للوقوف على البنية الحالية لموديولات الموارد البشرية والرواتب وبخاصة نظام حماية الأجور (WPS) والتأمينات الاجتماعية (GOSI)، وتحديد الثغرات والمخاطر الأمنية والهيكلية.

---

## 1. الملفات التي تم قراءتها وفحصها
- **ملفات الذاكرة والقواعد**:
  - `.ai-brain/25-hr-payroll.md` (دليل الموارد البشرية والرواتب).
  - `.agent/workflows/add-new-modules.md` (دليل تفعيل الوحدات في القائمة الجانبية).
  - `AGENTS.md` (قواعد التطوير والحوكمة للمشروع).
- **ملفات الواجهات (Frontend)**:
  - `src/components/Sidebar.tsx` (التحقق من روابط WPS و GOSI).
  - `src/app/(dashboard)/hr/wps/page.tsx` (صفحة لوحة تحكم WPS).
- **ملفات الخدمات والـ APIs الخلفية**:
  - `src/lib/wps-generator.ts` (محرك توليد ملفات SIF v3).
  - `src/app/api/hr/wps/route.ts` (مسار WPS للموارد البشرية).
  - `src/app/api/payroll/wps/route.ts` (مسار WPS للرواتب).
  - `src/app/api/payroll/wps/generate/route.ts` (مسار توليد ملف WPS للرواتب).
  - `src/app/api/payroll/wps/history/route.ts` (مسار سجل الدفعات للرواتب).
  - `src/app/api/payroll/wps/[batchId]/download/route.ts` (مسار تحميل الملف).
  - `src/app/api/payroll/wps/[batchId]/mark-uploaded/route.ts` (مسار تحديث حالة الدفعة).
  - `src/app/api/hr/gosi/route.ts` (مسار التأمينات الاجتماعية GOSI).
- **قاعدة البيانات والاختبارات**:
  - `prisma/schema.prisma` (مخططات WPSBatch و WPSBatchItem و Employee).
  - `tests/wps-generator.test.ts` (اختبارات محرك WPS).
  - `tests/unit/services/hr/payroll.test.ts` (اختبارات خدمة الرواتب).
  - `tests/e2e/golden-paths/02-payroll-run.spec.ts` (سيناريوهات أتمتة الرواتب).

---

## 2. الملفات المرشحة للتعديل
1. **[wps-generator.ts](file:///d:/namasoft9-3-main/src/lib/wps-generator.ts)**:
   - إلغاء الاستدعاء المباشر لـ `new PrismaClient()` وتمرير كائن الـ `prisma` من سياق الطلب.
   - إصلاح المسميات الخاطئة لحقول الموظف للالتزام بمخطط قاعدة البيانات الحقيقي:
     - استبدال `emp.fullName` بـ `emp.name`.
     - استبدال `emp.bankIban` بـ `emp.iban`.
     - استبدال `emp.basicSalary` بـ `emp.salary`.
     - إزالة حقل `emp.contractType` غير الموجود بالمخطط واستخدام قيمة افتراضية أو حقل بديل متوفر.
   - فرض فلترة وتدقيق الـ `tenantId` لجميع عمليات الجلب والتحديث لمنع تسريب العمليات.
2. **[generate/route.ts](file:///d:/namasoft9-3-main/src/app/api/payroll/wps/generate/route.ts)**:
   - تفعيل القيود الأمنية والتحقق من هوية المستأجر (`requireTenantId`).
   - تصحيح استدعاء `generateSIF` بتمرير المعاملات الخمسة المطلوبة.
3. **[[batchId]/mark-uploaded/route.ts](file:///d:/namasoft9-3-main/src/app/api/payroll/wps/[batchId]/mark-uploaded/route.ts)**:
   - فرض المصادقة والتحقق من الصلاحيات وربطه بالـ `tenantId`.
4. **[route.ts (payroll/wps)](file:///d:/namasoft9-3-main/src/app/api/payroll/wps/route.ts)**:
   - تفعيل قيود الأمان وعزل المستأجرين.
5. **[route.ts (hr/wps)](file:///d:/namasoft9-3-main/src/app/api/hr/wps/route.ts)**:
   - توحيد الـ APIs وحظر التكرار البرمجي وإحالتها للمحرك الرئيسي آمن التفاصيل وعازل المستأجرين.
6. **[page.tsx (hr/wps)](file:///d:/namasoft9-3-main/src/app/(dashboard)/hr/wps/page.tsx)**:
   - إصلاح وتنسيق الاستدعاءات الخلفية وربطها بالـ APIs الصحيحة وحظر التعطل التفاعلي في علامات التبويب (مثل فحص الـ IBAN وحفظ الدفعات).

---

## 3. الدومينات المتأثرة
- **HR & Payroll / Salaries**: موديول معالجة وحساب مستحقات الموظفين وصرفها.
- **Tenant Isolation & Security**: دومين عزل البيانات وحماية الخصوصية للمستأجرين.
- **Financial Integrity**: المحاسبة والقيود المرتبطة بصرف رواتب الموظفين وتسجيل التزامات التأمينات.

---

## 4. المخاطر المرصودة
- ⚠️ **خطر تسريب بيانات المستأجرين (Cross-Tenant Leakage)**: محرك توليد ملفات WPS يقوم بالاستعلام والتحديث والإنشاء دون التحقق من الـ `tenantId` ويستخدم اتصال قاعدة بيانات عام بدلاً من الاتصال الخاص بسياق الطلب.
- ⚠️ **خطر انهيار وقت التشغيل (Runtime Crashes)**: استخدام حقول وهمية وغير صحيحة بملف الموظف (مثل `fullName` و `bankIban`) سيؤدي لـ `TypeError: Cannot read properties of undefined` فورا عند تشغيل توليد ملف حماية الأجور.
- ⚠️ **ثغرات صلاحيات مكشوفة (Unprotected Endpoints)**: بعض مسارات الـ APIs الخلفية (مثل `mark-uploaded` و `generate`) لا تتحقق من صحة جلسة المستخدم أو صلاحياته أو هويته وتسمح بالوصول المباشر.

---

## 5. خطة التنفيذ المقترحة (آمنة ومرحلية)
- **المرحلة 1: تحصين محرك WPS الأساسي**:
  - تعديل `wps-generator.ts` لقبول كائن الـ `prisma` والـ `tenantId` إجبارياً في جميع العمليات، وتصحيح مسميات الحقول بما يتطابق تماماً مع مخطط الـ Prisma الفعلي.
- **المرحلة 2: تأمين مسارات الـ APIs الخلفية**:
  - تفعيل حارس عزل المستأجرين والمصادقة في جميع مسارات `/api/payroll/wps/*` بالاعتماد على `requireTenantId` و `getUserFromRequest`.
- **المرحلة 3: مواءمة واجهة الاستخدام وإصلاح الخلل**:
  - تعديل الاستدعاءات الخلفية بصفحة لوحة تحكم WPS لتتطابق تماماً مع المعاملات الصحيحة، وإلغاء التعارض الذي يعطل فحص الـ IBAN أو رفع الدفعات.
- **المرحلة 4: كتابة اختبارات السلامة**:
  - إضافة اختبارات وحدة آلية للتأكد من أن توليد ملف WPS وحوكمة GOSI ترفض العمل نهائياً عند محاولة تداخل المستأجرين.

---

## 6. خطة الاختبار
- تشغيل `npm run typecheck` للتحقق من مطابقة الحقول والأنواع بعد التصحيح.
- تشغيل `npm run build` للتأكد من تجميع المشروع بنجاح.
- تشغيل اختبارات E2E المستهدفة للرواتب `npx playwright test tests/e2e/golden-paths/02-payroll-run.spec.ts` للتحقق من سلامة الواجهة.
