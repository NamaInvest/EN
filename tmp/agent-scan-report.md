# Agent Scan Report (تقرير فحص الوكيل) - Phase 5 Part 2B

---

## 1. الملفات التي قرأتها (Files Scanned)
- [siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)

---

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- [siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)
  - تحديث وتوسيع واجهة `SiemPattern` لدعم أنواع الأنماط الجديدة: `RBAC_CRAWL` و `API_BRUTE_FORCE` و `OFF_HOURS_BYPASS`.
  - تحديث دالة التحليل `detectPatterns` لإضافة القواعد الثلاث الجديدة بالثوابت والشروط المحددة.

---

## 3. الدومينات المتأثرة (Affected Domains)
- **SIEM Detection Rules Engine**

---

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)
- **مخاطر الأداء (Performance Risks):** عمليات التكرار والبحث قد تكون مكثفة.
  - *الحل:* استخدام تصفية زمنية باستخدام نافذة فلترة سريعة ومجموعات Records مجمعة بالـ Hashmaps (مصفوفات التجميع الفورية).

---

## 5. خطة التنفيذ (Implementation Plan - Phase 5 Part 2B)
1. **تحديث واجهة `SiemPattern` في `siem/route.ts`:**
   * إضافة `'RBAC_CRAWL' | 'API_BRUTE_FORCE' | 'OFF_HOURS_BYPASS'` للـ union type لـ `patternType`.
2. **إضافة القواعد الثلاث في `detectPatterns`:**
   * **RBAC_CRAWL**: تجميع `RBAC_DENIED` حسب الـ `actorId` وفلترة الـ 5 دقائق للأعداد $\ge 3$ بشدة `HIGH`.
   * **API_BRUTE_FORCE**: تجميع `AUTH_FAIL` حسب الـ `ipAddress` وفلترة الـ 10 دقائق للأعداد $\ge 5$ بشدة `HIGH`.
   * **OFF_HOURS_BYPASS**: الكشف عن أحداث `ADMIN_BYPASS` التي تتم خارج ساعات العمل الرسمية (22:00 - 06:00 بتوقيت الرياض).

---

## 6. خطة الاختبار (Testing Plan)
- تشغيل فحص الأنواع البرمجية:
  ```bash
  npm run typecheck
  ```
- التحقق من مطابقة قاعدة البيانات Prisma:
  ```bash
  npx prisma validate
  ```
- تشغيل اختبارات backend-rbac:
  ```bash
  npx jest src/__tests__/permissions/backend-rbac.test.ts --runInBand --forceExit
  ```