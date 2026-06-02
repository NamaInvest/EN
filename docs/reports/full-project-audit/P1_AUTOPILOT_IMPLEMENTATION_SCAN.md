# P1 Autopilot Implementation Scan Report
# تقرير الفحص المبدئي لبوابة معالجة مشاكل P1

> **STATUS**: `FULL_PROJECT_DEEP_AUDIT_SCAN_COMPLETED`  
> **GATE**: `GO_FOR_P1_FIX_APPROVAL_ONLY`  
> **REMEDIATION STATE**: Pre-implementation Audit Scan Complete  

تم إجراء فحص شامل وكامل للمشروع بالتركيز على المشاكل الثلاث الكبرى المصنفة كـ P1 High، وتم تحديد الدومينات المتأثرة والمخاطر الفنية وخطة تنفيذ اختبارية معزولة تماماً:

---

## 1. الملفات التي تم فحصها (Scanned Files)

1. **دومين الكرون وعزل المستأجرين (Cron Jobs / ISS-01)**:
   - [daily-audit/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/daily-audit/route.ts) (يستعلم من `prisma.auditLog` و `prisma.journalEntry` بدون `withTenant`)
   - [zatca-batch-submit/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/zatca-batch-submit/route.ts) (يستعلم من `prisma.salesInvoice` و `prisma.zatcaSubmissionLog` بدون `withTenant`)
   - [fx-revaluation/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/fx-revaluation/route.ts) (يستدعي محرك التقييم بدون تهيئة `withTenant`)
   - [vat-return-reminder/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/vat-return-reminder/route.ts) (يستعلم عبر المستأجرين داخل حلقة تكرارية دون `withTenant` منفصل لكل دورة)
   - [with-route.ts](file:///d:/namasoft9-3-main/src/lib/api/with-route.ts) (يتحقق من كيفية ربط سياق المستأجر ديناميكياً)
   - [prisma.ts](file:///d:/namasoft9-3-main/src/lib/prisma.ts) (يتحقق من عمل `smartPrisma` و `withTenant`)

2. **دومين التحقق الثنائي للمشرفين (MFA Recovery / ISS-02)**:
   - [schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma) (تحليل جدول `MfaRecoveryRequest` وحقوله)
   - [mfa-engine.ts](file:///d:/namasoft9-3-main/src/lib/mfa-engine.ts) (تحليل دالة `MfaEngine.disable(userId)`)
   - [disable/route.ts](file:///d:/namasoft9-3-main/src/app/api/auth/mfa/disable/route.ts) (تحليل واجهة إلغاء التفعيل الفردية)

3. **دومين الحركات المخزنية بأثر رجعي (Inventory / ISS-03)**:
   - [stocktake/route.ts](file:///d:/namasoft9-3-main/src/app/api/stocktake/route.ts) (يقوم بالتحقق عبر `new Date()` الحالي متجاوزاً التاريخ المدخل)
   - [adjustments/route.ts](file:///d:/namasoft9-3-main/src/app/api/stock/adjustments/route.ts) (يقوم بالتحقق عبر `new Date()` الحالي متجاوزاً التاريخ المدخل)
   - [route.ts](file:///d:/namasoft9-3-main/src/app/api/inventory/stocktake/route.ts) (يفتقر لبروتوكول التحقق من الفترات تماماً)
   - [period-lock.ts](file:///d:/namasoft9-3-main/src/lib/governance/period-lock.ts) (تحليل دالة `assertPeriodWritable`)

---

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)

- [daily-audit/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/daily-audit/route.ts) (تغليف بالـ `withTenant`)
- [zatca-batch-submit/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/zatca-batch-submit/route.ts) (تغليف بالـ `withTenant`)
- [fx-revaluation/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/fx-revaluation/route.ts) (تغليف بالـ `withTenant`)
- [vat-return-reminder/route.ts](file:///d:/namasoft9-3-main/src/app/api/cron/vat-return-reminder/route.ts) (تغليف بالـ `withTenant` داخل الحلقة)
- [recovery/route.ts](file:///d:/namasoft9-3-main/src/app/api/auth/mfa/recovery/route.ts) (إنشاء واجهة برمجية جديدة تدعم التوقيع الثنائي)
- [stocktake/route.ts](file:///d:/namasoft9-3-main/src/app/api/stocktake/route.ts) (تصحيح تاريخ فحص الفترة المالية)
- [adjustments/route.ts](file:///d:/namasoft9-3-main/src/app/api/stock/adjustments/route.ts) (تصحيح تاريخ فحص الفترة المالية)
- [route.ts](file:///d:/namasoft9-3-main/src/app/api/inventory/stocktake/route.ts) (إضافة فحص الفترة المالية)

---

## 3. الدومينات المتأثرة (Affected Domains)

- **Security & Authorization (MFA / Tenancy)**: أمان المستأجرين واسترداد كلمات المرور وإلغاء تفعيل المصادقة الثنائية.
- **Financial Compliance (Inventory Valuation & Fiscal Periods)**: حوكمة الحسابات وحظر التعديل بأثر رجعي في فترات مقفلة.
- **Automation Background Services (Cron Workers / ZATCA integration)**: معالجة البيانات الدورية بشكل معزول كلياً.

---

## 4. المخاطر الفنية (Secondary Risks)

- **دقة عزل المستأجرين**: في حال فشل استخراج معرف المستأجر، قد تتوقف الكرونات تماماً. تم تقليل الخطر بإرجاع 400 Bad Request بشكل مبكر لحماية النظام.
- **توافق المخطط (Schema Compatibility)**: تم تفادي أي تغيير في المخطط (Schema) أو قاعدة البيانات كلياً عبر استخدام حقول `status` و `reviewedByUserId` و `reviewNotes` بشكل هندسي مرن وموثق بالـ `AuditLog`.
- **التوافقية الرجعية للحركات المخزنية**: تفادي التسبب في قفل الحركات الحالية عبر حصر الفحص فقط في التواريخ الرجعية التي تمس فترات مالية مغلقة جزئياً أو كلياً (`SOFT_LOCKED` / `HARD_LOCKED`).

---

## 5. خطة التنفيذ المقترحة (Implementation Steps)

1. **المرحلة الأولى**: تعديل ملفات الكرون الأربعة (`daily-audit`, `zatca-batch-submit`, `fx-revaluation`, `vat-return-reminder`) لتغليف عمليات قاعدة البيانات داخل `withTenant`.
2. **المرحلة الثانية**: إنشاء واجهة الـ MFA Recovery الجديدة بالكامل (`/api/auth/mfa/recovery`) وتدعيمها ببروتوكول الموافقة الثنائية (Dual-Officer Consensus Approval).
3. **المرحلة الثالثة**: دمج فحص التاريخ الفعلي للحركات المخزنية بأثر رجعي في تسويات المستودعات وحركات الجرد.
4. **المرحلة الرابعة**: كتابة اختبارات آلية شاملة لتغطية كل الحالات.

---

## 6. خطة الاختبار والتحقق (Test Plan)

- **اختبارات عزل الكرون**:
  - التحقق من رفض الطلبات غير المصرحة (401 Unauthorized).
  - التحقق من رفض الطلبات دون معرف مستأجر (400 Bad Request).
  - التحقق من أن بيانات المستأجر A لا تتسرب للمستأجر B عند استخدام `withTenant`.
- **اختبارات الـ MFA Recovery**:
  - التحقق من إنشاء الطلب بالحالة PENDING.
  - التحقق من أن المشرف الأول يحول الحالة إلى PENDING_SECOND_OFFICER.
  - التحقق من رفض قيام نفس المشرف بالاعتماد الثاني.
  - التحقق من رفض قيام نفس المستخدم طالب الاسترداد بالاعتماد.
  - التحقق من تفعيل إلغاء الـ MFA بنجاح بعد اعتماد المشرف الثاني.
- **اختبارات الفترات المالية للمخزون**:
  - التحقق من قبول الحركة بالتاريخ الحالي في فترة مفتوحة (`OPEN`).
  - التحقق من رفض الحركة بالتاريخ الرجعي في فترة مقفلة نهائياً (`HARD_LOCKED`).
  - التحقق من رفض الحركة بالتاريخ الرجعي في فترة مقفلة جزئياً (`SOFT_LOCKED`) إلا بوجود تصريح وتجاوز إداري.

---

## 7. تأكيد الحوكمة البرمجية (Governance Declarations)

- **لا يوجد أي تعديل على ملفات البيئة (`.env`)**.
- **لا يوجد أي نشر للإنتاج (`No Production Deploy`)**.
- **لا يوجد أي استعلامات مباشرة (`No direct SQL queries`)**.
- **لا يوجد أي دفع للمخطط أو ترحيل لقاعدة البيانات (`No schema.prisma push/migrate`)**.
