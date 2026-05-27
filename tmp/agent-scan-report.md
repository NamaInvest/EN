# 🛡️ Agent Scan & Impact Analysis Report
**Phase 3 Part 1 — Permissions, RBAC & Granular Audit UX**

## 1. الملفات التي تمت قراءتها وفحصها (Files Scanned)
- `AGENTS.md` — ملف قواعد الحوكمة والتحكم المحاسبي والسيبراني.
- `tmp/phase-3-part-1-rbac-audit-scan-plan.md` — الخطة المرجعية المعتمدة.
- `prisma/schema.prisma` — بنية جدول صلاحيات المستخدمين وسجلات التدقيق.
- `src/app/api/auth/me/route.ts` — الـ endpoint المسؤول عن استخراج `permissionsMap`.
- `src/hooks/useUserPermissions.ts` — خطاف الصلاحيات الموحد (مكتمل بالكامل في الخطوات السابقة).
- `src/components/security/PermissionGate.tsx` — مكون التحقق البصري لتشغيل conditional rendering.
- `src/components/security/SensitiveValue.tsx` — مكون حجب وتعمية البيانات المالية الحساسة.
- لوحات التحكم السبعة في الدومينات المختلفة:
  1. الرواتب والأجور: `src/app/(dashboard)/payroll/page.tsx`
  2. الموارد البشرية: `src/app/(dashboard)/hr/page.tsx`
  3. المبيعات: `src/app/(dashboard)/sales/page.tsx`
  4. المشتريات والتوريد: `src/app/(dashboard)/purchases/page.tsx`
  5. الأصول الثابتة: `src/app/(dashboard)/fixed-assets/page.tsx`
  6. إدارة علاقات العملاء (CRM): `src/app/(dashboard)/crm/page.tsx`
  7. المشاريع والـ PMO: `src/app/(dashboard)/projects/page.tsx`

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- `src/app/(dashboard)/payroll/page.tsx` (تطبيق حجب رواتب المسير واشتراكات التأمينات وجدول المسير المعاين)
- `src/app/(dashboard)/hr/page.tsx` (تطبيق حجب تعداد الموظفين وجدول آخر التعيينات)
- `src/app/(dashboard)/sales/page.tsx` (تطبيق حجب مبيعات اليوم وإجمالي مبيعات الدورة وقيمة الفواتير في الجدول)
- `src/app/(dashboard)/purchases/page.tsx` (تطبيق حجب إجمالي نفقات الشراء وقيم فواتير الشراء في الجدول)
- `src/app/(dashboard)/fixed-assets/page.tsx` (تطبيق حجب إجمالي تكلفة الأصول والقيمة الدفترية والإهلاك وجدول الأصول)
- `src/app/(dashboard)/crm/page.tsx` (تطبيق حجب إجمالي الإيرادات المتوقعة وقيم صفقات العملاء بالجدول)
- `src/app/(dashboard)/projects/page.tsx` (تطبيق حجب ميزانيات المحفظة والـ EVM المصروف وتفاصيل المشروع والجدول)

## 3. الدومينات المتأثرة (Affected Domains)
- **دومين الرواتب (Payroll)**
- **دومين الموارد البشرية (HR)**
- **دومين المبيعات (Sales)**
- **دومين المشتريات (Purchases/Procurement)**
- **دومين الأصول الثابتة (Fixed Assets)**
- **دومين علاقات العملاء (CRM)**
- **دومين المشاريع (Projects)**

## 4. المخاطر والاحتياطات (Risks & Mitigations)
- **الخطر 1: Hydration Mismatch في Next.js**
  - *الوصف:* اختلاف الحالة في خادم العرض الأولي عن المتصفح بسبب تأخر الصلاحيات.
  - *الاحتياط:* عرض حالة تحميل هيكلية `...` آمنة أو تعمية افتراضية `••••••` لحين تحميل الصلاحيات.
- **الخطر 2: كسر المنطق المالي المترابط**
  - *الوصف:* التأثير على عمليات الاحتساب أو القيود المحاسبية.
  - *الاحتياط:* تعديلات بصرية صرفة على مستوى العرض (`UI-only masking`) دون المساس بالبيانات المخزنة أو منطق الـ API الخلفي أو الحسابات.
- **الخطر 3: تعطل المتصفح بسبب عدم تحميل كائن الصلاحيات**
  - *الوصف:* عدم وجود صلاحية معينة مسبقاً مما يؤدي لـ `NullReferenceException`.
  - *الاحتياط:* معالجة آمنة بـ `Optional Chaining` في الخطاف والمكونات المانعة، مع الافتراض الصارم بالرفض والتعمية كحالة افتراضية.

## 5. خطة التنفيذ البصرية الصارمة (Safe Implementation Plan)
- **المرحلة 1:** تعديل لوحة الرواتب (`payroll/page.tsx`) لحجب إجمالي المسير والجدول.
- **المرحلة 2:** تعديل لوحة الموارد البشرية (`hr/page.tsx`) لحجب التعداد والجدول عند الحاجة.
- **المرحلة 3:** تعديل لوحة المبيعات (`sales/page.tsx`) لحجب أرقام الأرباح والإيرادات ومبالغ الجدول الفردية.
- **المرحلة 4:** تعديل لوحة المشتريات (`purchases/page.tsx`) لحجب إجمالي الشراء ومبالغ الجدول الفردية.
- **المرحلة 5:** تعديل لوحة الأصول الثابتة (`fixed-assets/page.tsx`) لحجب القيم التكلفية والدفترية والإهلاكية.
- **المرحلة 6:** تعديل لوحة علاقات العملاء (`crm/page.tsx`) لحجب قيم الفرص المتوقعة.
- **المرحلة 7:** تعديل لوحة المشاريع (`projects/page.tsx`) لحجب الميزانيات التقديرية والتكاليف الفعلية ومؤشرات EVM.

## 6. خطة الاختبار والتحقق الفني (Testing & Verification Plan)
- تشغيل `npm run typecheck` لضمان عدم وجود أخطاء في أنواع TypeScript بعد إدراج المكونات المانعة.
- تشغيل `npx prisma validate` للتأكد التام من سلامة نموذج البيانات وخلوه من التغيرات.
- تشغيل `npm run build` لضمان صحة البناء النهائي وخلو التطبيق من أي ثغرات أو placeholders.
- اختبار العرض والتعمية بالمتصفح لكل الأدوار للتأكد من فاعلية التعتيم.