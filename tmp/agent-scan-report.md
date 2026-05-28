# Agent Scan Report — Security Hotfix — Sanitize Settings Roles API Response

## 1. الملفات التي قرأتها (Files Scanned)
- [src/app/api/settings/roles/route.ts](file:///d:/namasoft9-3-main/src/app/api/settings/roles/route.ts)

## 2. الملفات المرشحة للتعديل (Files to Modify)
- [src/app/api/settings/roles/route.ts](file:///d:/namasoft9-3-main/src/app/api/settings/roles/route.ts)
- [src/__tests__/permissions/security-sanitization.test.ts](file:///d:/namasoft9-3-main/src/__tests__/permissions/security-sanitization.test.ts) [NEW]

## 3. الدومينات المتأثرة (Affected Domains)
- الحماية والأمن السيبراني (Security & Cybersecurity)
- حوكمة الوصول والصلاحيات (RBAC & Settings Roles)

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
- **المخاطر**: تعطل واجهة إعدادات الأدوار في لوحة التحكم (Settings/Roles UI) إذا غابت بعض الحقول الأساسية المتوقعة من الفرونت إند.
- **المعالجة**: الاحتفاظ بكامل الحقول البنيوية الآمنة التي تعتمد عليها الواجهة (`id`, `username`, `fullName`, `role`, `active`, `branchId`, `defaultPage`) مع استعلام الصلاحيات المقترنة (`permissions`) بالحقول غير الحساسة فقط، مع العزل المطبق للـ Tenant.

## 5. خطة التنفيذ (Implementation Plan)
1. تعديل استعلام Prisma في ملف `src/app/api/settings/roles/route.ts` لاستخدام `select` صريح يتجنب جلب أو إعادة الحقول الحساسة (`passwordHash` وما جاورها).
2. كتابة اختبار وحدة محدد `security-sanitization.test.ts` يتحقق بشكل صارم من خلو رد الـ API من أي هاشات أو توكنات.
3. تشغيل الفحوصات الفنية والتثبت من نجاح البناء (Typecheck) وتمرير الاختبارات.

## 6. خطة الاختبار (Testing Plan)
- تشغيل `npm run typecheck` للتحقق من سلامة البناء البرمجي.
- تشغيل `npx jest src/__tests__/permissions/security-sanitization.test.ts` للتأكد من نجاح العزل الأمني.