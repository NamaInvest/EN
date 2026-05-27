# Agent Scan Report — Phase 5 Part 3C — Staging / Production Smoke Test Checklist

## 1. الملفات التي قرأتها (Files Scanned)
- [docs/security/siem_runbook.md](file:///d:/namasoft9-3-main/docs/security/siem_runbook.md)

## 2. الملفات المرشحة للتعديل (Files to Modify)
- [docs/security/siem_smoke_test.md](file:///d:/namasoft9-3-main/docs/security/siem_smoke_test.md) [NEW] (قائمة التحقق واختبارات الدخان الإنتاجية الآمنة)

## 3. الدومينات المتأثرة (Affected Domains)
- وثائق اختبار التحقق الإنتاجي (Production Verification Documentation)

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
- **معدومة**: التعديل يقتصر تماماً على كتابة قائمة التحقق للتحقق الآمن (Staging / Production Smoke Test Checklist) دون تعديل أي ملف برمجي، ودون المساس بقواعد البيانات أو العمليات المالية.

## 5. خطة التنفيذ (Implementation Plan)
1. **إنشاء ملف التوثيق الأمني `docs/security/siem_smoke_test.md`**:
   - تحديد خطوات التحقق الفعلي والآمن على Staging / Production.
   - تحديد خطوات توليد أحداث `AUTH_FAIL` و `RBAC_DENIED` و `ADMIN_BYPASS` بطرق آمنة ومحدودة لا تؤثر على النظام.
   - التحقق من دقة التصفية الزمنية وسلوك الأنماط التلقائية في الواجهة.
   - توثيق إجراءات التراجع وخطة السلامة (Safety & Rollback plan).
2. **التحقق التقني**: تشغيل `npm run typecheck` و `npx prisma validate`.

## 6. خطة الاختبار (Testing Plan)
- التحقق التقني للتأكد من عدم وجود أي خطأ بالبناء:
  ```bash
  npm run typecheck
  npx prisma validate
  ```