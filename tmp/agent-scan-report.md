# Agent Scan Report — Phase 2 Part 3

## 1. الملفات التي قرأتها (Files Read)
* `src/app/(dashboard)/manufacturing/page.tsx`
* `src/app/(dashboard)/hr/page.tsx`
* `src/app/(dashboard)/salaries/page.tsx`
* `src/app/api/manufacturing/stats/route.ts`
* `src/app/api/hr/employees/route.ts`
* `src/app/api/hr/leaves/route.ts`
* `src/app/api/hr/attendance/route.ts`
* `src/app/api/hr/payroll/run/route.ts`
* `src/app/api/hr/gosi/route.ts`
* `src/app/api/hr/wps/route.ts`
* `AGENTS.md` (قواعد الوكلاء والمشروع)

---

## 2. الملفات المرشحة للتعديل (Candidate Files)
* `src/app/(dashboard)/manufacturing/page.tsx` — **تعديل/تحسين**: لرفع مستوى التصميم الجمالي وإضافة حالات التحميل والأخطاء.
* `src/app/(dashboard)/hr/page.tsx` — **تعديل/تحسين**: لربطه بـ APIs حقيقية (موظفين، إجازات، حضور) وإلغاء البيانات الثابتة.
* `src/app/(dashboard)/payroll/page.tsx` — **إنشاء جديد [NEW]**: لبناء لوحة تحكم رواتب راقية ومتكاملة تعرض الـ KPIs الخاصة بالـ payroll والـ GOSI والـ WPS والرواتب المدفوعة.

---

## 3. الدومينات المتأثرة (Affected Domains)
* **دومين الموارد البشرية (HR Core)**: قراءة وعرض أعداد الموظفين والإجازات.
* **دومين الرواتب والأجور (Payroll)**: عرض إحصائيات مسيرات الرواتب وخصومات التأمينات.
* **دومين التصنيع والإنتاج (Manufacturing/MRP)**: عرض إحصائيات أوامر التشغيل والـ BOMs.

---

## 4. المخاطر والاحتياطات (Risks & Mitigations)

| المخاطر المحتملة (Risk) | خطة الحماية والوقاية (Mitigation) |
| :--- | :--- |
| **تسريب بيانات المستأجرين (Tenant Leakage)** | الالتزام الصارم بـ `requireTenantId` في السيرفر وعدم تمرير أي معرف من العميل أو المتصفح. |
| **تعديل غير مقصود للحسابات والقيود (Journal Modification)** | منع إضافة أي كود يخص الكتابة (POST/PUT/PATCH)، والاعتماد 100% على الاستعلامات للقراءة (GET) فقط. |
| **التأثير على منطق تكلفة الإنتاج أو احتساب الرواتب** | الداشبورد للقراءة فقط ولا توجد أي تعديلات في محركات الاحتساب المالي أو المحاسبي. |
| **تعطل النظام بسبب أخطاء نوعية (TypeScript Errors)** | التحقق الصارم بعد التنفيذ باستخدام `npm run typecheck` و `npm run build`. |

---

## 5. خطة التنفيذ (Implementation Plan)
* **المرحلة 1**: عرض تقرير الفحص والـ Pre-Scan والحصول على موافقة المستخدم الصريحة.
* **المرحلة 2**: تحسين صفحة التصنيع لتتوافق مع معايير التصميم الممتازة وإضافة حالات التحميل والخطأ.
* **المرحلة 3**: ربط صفحة الموارد البشرية بـ `fetch` حقيقي لجلب الموظفين والغيابات والإجازات وتجميل التصميم.
* **المرحلة 4**: إنشاء صفحة جديدة كلياً للرواتب `src/app/(dashboard)/payroll/page.tsx` بالاتصال بـ APIs الرواتب المتاحة مع fallback states.
* **المرحلة 5**: تشغيل اختبارات التحقق من البناء والأنواع وقاعدة البيانات (`typecheck`, `prisma validate`, `build`).

---

## 6. خطة الاختبار والتحقق (Verification Plan)
* اختبار التجاوب والتوافق البصري والتأكد من جودة التصميم.
* تشغيل `npm run typecheck` للتأكد من سلامة كود TypeScript.
* تشغيل `npx prisma validate` للتأكد من سلامة علاقات الجداول.
* تشغيل `npm run build` لضمان عدم وجود أخطاء وقت البناء.