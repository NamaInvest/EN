# Agent Scan Report (تقرير فحص الوكيل) - Phase 5 Part 2A

---

## 1. الملفات التي قرأتها (Files Scanned)
- [siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)
- [with-route.ts](file:///d:/namasoft9-3-main/src/lib/api/with-route.ts)
- [schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma)

---

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- [siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)
  - تصحيح رسم وتعيين حقل الـ `ipAddress` لسجلات `AuditLog` بدلاً من فرضها كـ `null`.
  - تحديث وتوسيع تصنيفات الأنواع الأمنية الموحدة `SiemEventType` بإدراج `AUTH_FAIL`, `RBAC_DENIED`, `ADMIN_BYPASS`.
  - تحديث معالج التحويل لـ `AuditLog` لتعيين الأنواع الجديدة وتمرير البيانات المناسبة.
  - تحديث الدالة المساعدة `deriveSeverity` لدعم تصنيفات الشدة للأحداث الثلاثة الحساسة.

---

## 3. الدومينات المتأثرة (Affected Domains)
- **SIEM Telemetry Pipeline & GRC Monitoring API**

---

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
- **خطر التعديل غير المقصود على الـ Schema:** التعديل معزول تماماً ومستقر، ولن يتم إجراء أي تعديل للـ Schema.
- **خطر استقرار الـ UI:** لن نلمس واجهات الـ UI حالياً في هذه المرحلة لحين استقرار الـ Types والبيانات بالكامل في الـ API.

---

## 5. خطة التنفيذ (Implementation Plan - Phase 5 Part 2A)
1. **تحديث الأنواع `SiemEventType` في `siem/route.ts`:**
   * إضافة الأنواع `'AUTH_FAIL' | 'RBAC_DENIED' | 'ADMIN_BYPASS'` للـ union type.
2. **تحديث معالجة وتحويل سجلات `AuditLog`:**
   * قراءة حقل الـ `a.ipAddress` الفعلي بدلاً من القيمة `null` (السطر 345).
   * التحقق من `a.action` ومطابقته للـ actions الجديدة وتعيين الـ `type` الصحيح.
3. **تحديث دالة `deriveSeverity`:**
   * مطابقة `AUTH_FAIL` بـ `MEDIUM`.
   * مطابقة `RBAC_DENIED` بـ `HIGH`.
   * مطابقة `ADMIN_BYPASS` بـ `MEDIUM`.

---

## 6. خطة الاختبار (Testing Plan)
- تشغيل فحص الأنواع للتأكد من خلو التعديل من المشاكل النوعية:
  ```bash
  npm run typecheck
  ```
- التحقق من مطابقة قاعدة البيانات Prisma:
  ```bash
  npx prisma validate
  ```