# Agent Scan Report — Phase 5 Part 2C — SIEM UI Dashboard Alignment

## 1. الملفات التي قرأتها (Files Scanned)
- [src/app/(dashboard)/admin/siem/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/siem/page.tsx)
- [src/app/api/admin/siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)

## 2. الملفات المرشحة للتعديل (Files to Modify)
- [src/app/(dashboard)/admin/siem/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/siem/page.tsx)

## 3. الدومينات المتأثرة (Affected Domains)
- واجهة لوحة تحكم مراقبة الأمان (SIEM Dashboard UI)

## 4. المخاطر (Risks)
- **منخفضة جداً**: التعديل يقتصر على واجهة المستخدم (Frontend) ومحاذاة الأنواع (Typescript types) لتتوافق مع المدخلات الجديدة القادمة من الواجهة البرمجية (API). لا يوجد أي تعديل على قاعدة البيانات (Prisma) أو محرك كشف الأنماط، ولا يمس أي منطق مالي أو محاسبي.

## 5. خطة التنفيذ (Implementation Plan)
1. **تحديث أنواع أحداث الأمان `SiemEventType`**: إضافة أنواع الأحداث الجديدة (`AUTH_FAIL` و `RBAC_DENIED` و `ADMIN_BYPASS`) في [page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/siem/page.tsx).
2. **تحديث أنواع الأنماط المكتشفة `SiemPattern['patternType']`**: إضافة الأنماط الجديدة (`RBAC_CRAWL` و `API_BRUTE_FORCE` و `OFF_HOURS_BYPASS`) في [page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/siem/page.tsx).
3. **تحديث ثوابت عرض الأنماط `PATTERN_META`**: إضافة تعريفات الأيقونات والترجمة (العربية والإنجليزية) للأنماط الجديدة في [page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/siem/page.tsx).
4. **فحص الأنواع والتحقق**: تشغيل `npm run typecheck` للتأكد من المحاذاة الكاملة.

## 6. خطة الاختبار (Testing Plan)
- تشغيل `npm run typecheck` للتحقق من عدم وجود أي خطأ TypeScript.
- تشغيل `npx prisma validate` للتأكد من سلامة مخطط قاعدة البيانات.