# Agent Scan Report (تقرير فحص الوكيل)

---

## 1. الملفات التي قرأتها (Files Scanned)
- [with-route.ts](file:///d:/namasoft9-3-main/src/lib/api/with-route.ts)
- [audit-trail.ts](file:///d:/namasoft9-3-main/src/lib/audit-trail.ts)
- [schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma)
- [backend-rbac.test.ts](file:///d:/namasoft9-3-main/src/__tests__/permissions/backend-rbac.test.ts)
- [phase-5-rbac-operational-monitoring-plan.md](file:///d:/namasoft9-3-main/tmp/phase-5-rbac-operational-monitoring-plan.md)

---

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- [with-route.ts](file:///d:/namasoft9-3-main/src/lib/api/with-route.ts)
  - تحسين وتدقيق دالة `recordSecurityEvent` لالتقاط الـ IP والـ UserAgent بشكل تلقائي وجميل وحفظهم مباشرة في حقول `ipAddress` و `userAgent` في قاعدة البيانات.
  - تمرير معلومات الـ IP والـ UserAgent المناسبة في جميع نقاط الاستدعاء للأحداث الثلاثة: `AUTH_FAIL`, `RBAC_DENIED`, `ADMIN_BYPASS`.
- [backend-rbac.test.ts](file:///d:/namasoft9-3-main/src/__tests__/permissions/backend-rbac.test.ts)
  - إضافة mock لـ `prisma.auditLog.create` والتحقق من أنه يتم استدعاء التسجيل للأحداث الثلاثة بالأرقام والحقول الصحيحة.
  - اختبار أن فشل التسجيل لا يؤثر على رد خادم الـ API للمستخدم.

---

## 3. الدومينات المتأثرة (Affected Domains)
- **Backend Routing Security & RBAC Boundary:** معالج `withRoute` المركزي.
- **Audit Logs / SIEM:** تسجيل البيانات الرقابية لـ GRC Dashboard والـ SIEM دون التأثير على بيئة التشغيل أو التسبب في بطء استجابة الـ API.

---

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
- **أثر الأداء واستجابة الطلب (Performance Impact):** عمليات الكتابة في قاعدة البيانات قد تضيف تأخيراً (Latency).
  - *الحل:* استدعاء دالة `recordSecurityEvent` بشكل غير متزامن بالكامل (Fire-and-forget) باستخدام `.catch(...)` وعدم انتظار الـ Promise (`await`) قبل إرجاع رد الـ API للعميل.
- **فشل الاتصال بقاعدة البيانات (DB Write Failure):** إذا فشلت قاعدة البيانات أو جدول الـ AuditLog، فقد يتسبب ذلك في انهيار الـ API.
  - *الحل:* إحاطة عملية الإدراج بـ `try/catch` داخلي آمن يقوم بتسجيل الخطأ في الـ Pino logger كاحتياط دون التسبب في تعطيل أو تغيير سلوك الـ API الأساسي للمستخدم.
- **تسريب البيانات الحساسة (Sensitive Data Leakage):** خطر تسجيل كلمات المرور أو الـ Tokens أو معلومات سرية في حقل الـ metadata.
  - *الحل:* حظر تسجيل أي معلومات حساسة، وتقتصر البيانات في الـ JSON على: `method`, `path`, `reason`, `statusCode`, `requiredRoles`, `userRole`, `module`, `permission` فقط.

---

## 5. خطة التنفيذ (Implementation Plan)
1. **تحديث دالة `recordSecurityEvent` في `with-route.ts`:**
   - تعديل الدالة لاستقبال واستخلاص الـ `ipAddress` والـ `userAgent` بشكل ديناميكي من الطلب `NextRequest` أو تمريرهم صراحة وحفظهم في حقول الـ AuditLog الخاصة (`ipAddress`, `userAgent`).
   - التأكد من إطلاق الحدث آسنكرون بدون تعطيل الطلب.
2. **تغذية الأحداث الأمنية في `with-route.ts`:**
   - **AUTH_FAIL:** عند الفشل في التحقق من التوكن أو عدم وجود المستخدم.
   - **RBAC_DENIED:** عند فقدان الصلاحية الحركية أو الدور المطلوب.
   - **ADMIN_BYPASS:** عند تمرير المسؤول (admin/owner) وتخطيه للـ RBAC بنجاح.
3. **تحديث اختبارات Backend RBAC:**
   - تعديل ملف الاختبارات `backend-rbac.test.ts` لمحاكاة `prisma.auditLog.create` وإثبات تسجيل الأحداث بالأرقام والحقول الصحيحة.
   - اختبار سيناريو فشل الـ DB للتأكيد على عدم انقطاع الخدمة.

---

## 6. خطة الاختبار (Testing Plan)
- تشغيل فحص الأنواع للتأكد من خلو الكود من أي مشاكل:
  ```bash
  npm run typecheck
  ```
- التحقق من مطابقة قاعدة البيانات Prisma:
  ```bash
  npx prisma validate
  ```
- تشغيل اختبارات backend-rbac للتأكد من نجاح الـ 8 اختبارات الحالية بالإضافة للاختبارات الجديدة:
  ```bash
  npx jest src/__tests__/permissions/backend-rbac.test.ts --runInBand --forceExit
  ```