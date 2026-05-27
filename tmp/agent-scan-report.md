# Agent Scan Report — Phase 5 Part 3A — SIEM Detection Verification Tests

## 1. الملفات التي قرأتها (Files Scanned)
- [src/app/api/admin/siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)
- [src/__tests__/permissions/backend-rbac.test.ts](file:///d:/namasoft9-3-main/src/__tests__/permissions/backend-rbac.test.ts)

## 2. الملفات المرشحة للتعديل (Files to Modify)
- [src/app/api/admin/siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts) (لإضافة `export` لدالة الكشف للتحقق منها)
- [src/__tests__/permissions/siem-detection.test.ts](file:///d:/namasoft9-3-main/src/__tests__/permissions/siem-detection.test.ts) [NEW] (ملف اختبارات مخصص ومنعزل للـ SIEM)

## 3. الدومينات المتأثرة (Affected Domains)
- محرك كشف التهديدات الأمني (SIEM Detection Engine)

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
- **منخفضة جداً**: جميع الاختبارات تستخدم بيانات محاكاة مزيفة (Mocks) في الذاكرة دون الوصول الفعلي إلى قواعد البيانات الحية أو خوادم الإنتاج، ودون تشغيل أي حركة مرور شبكية ضارة.

## 5. خطة التنفيذ (Implementation Plan)
1. **تعديل `route.ts`**: إضافة كلمة `export` قبل تعريف دالة `detectPatterns` لجعلها قابلة للاستيراد والاختبار.
2. **إنشاء ملف اختبارات جديد `siem-detection.test.ts`**:
   - اختبارات إيجابية لتنبيهات: `RBAC_CRAWL`, `API_BRUTE_FORCE`, `OFF_HOURS_BYPASS`.
   - اختبارات سلبية للتأكد من عدم توليد تنبيهات تحت الشروط المحددة (Thresholds).
   - اختبارات عزل وتجميع البيانات للتأكد من عدم تداخل عناوين الـ IP أو المستخدمين المختلفين.
3. **التشغيل والتحقق**: تشغيل `npm run typecheck` و `npx prisma validate` واختبارات الـ Jest.

## 6. خطة الاختبار (Testing Plan)
- تشغيل اختبارات الـ SIEM الجديدة:
  ```bash
  npx jest src/__tests__/permissions/siem-detection.test.ts --runInBand --forceExit
  ```