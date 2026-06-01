# Agent Scan & Plan Report — Phase F-09: Trial Balance & Financial Statements Audit Engine

## 1. الملفات التي قرأتها (Files Scanned)
- [financial-statements-engine.ts](file:///d:/namasoft9-3-main/src/lib/financial-statements-engine.ts) (محرك القوائم المالية وميزان المراجعة الحالي)
- [route.ts (trial-balance)](file:///d:/namasoft9-3-main/src/app/api/accounting/trial-balance/route.ts) (مسار API لميزان المراجعة)
- [route.ts (financial-statements)](file:///d:/namasoft9-3-main/src/app/api/accounting/financial-statements/route.ts) (مسار API للقوائم المالية)
- [financial-statements-engine.test.ts](file:///d:/namasoft9-3-main/src/lib/__tests__/financial-statements-engine.test.ts) (اختبارات محرك القوائم المالية)
- [PROJECT_BRAIN.md](file:///d:/namasoft9-3-main/PROJECT_BRAIN.md) (السياق العام وهياكل الفروع)
- [LIVE_GAP_ANALYSIS.md](file:///d:/namasoft9-3-main/LIVE_GAP_ANALYSIS.md) (تحليل الثغرات الكلي ومعالجتها)
- [00-INDEX.md](file:///d:/namasoft9-3-main/BUILD_PACK/00-INDEX.md) (الفهرس والـ Build Pack)
- [MASTER_ROADMAP_TO_GLOBAL.md](file:///d:/namasoft9-3-main/MASTER_ROADMAP_TO_GLOBAL.md) (خارطة الطريق المعتمدة للأقسام)

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- `src/lib/financial-statements-engine.ts` (إضافة دعم الأبعاد: مراكز التكلفة، الفروع، المشروعات، قطاعات الأعمال + فحوصات الامتثال الآلية).
- `src/app/api/accounting/trial-balance/route.ts` (تمرير معاملات الأبعاد والتصفية للـ API).
- `src/app/api/accounting/financial-statements/route.ts` (توسيع المسار لدعم الأبعاد لتقارير الشركات القابضة والمستويات التفصيلية).
- `src/lib/__tests__/financial-statements-engine.test.ts` (إضافة اختبارات الأبعاد والتحقق من فحوصات الحوكمة وتوازن القيود).

## 3. الدومينات المتأثرة (Affected Domains)
- **General Ledger & Subledger Accounting (SLA)** (تكامل وتدقيق الترحيلات).
- **Financial Governance & Audit Trail** (التحقق من توازن القيود، مطابقة النقدية مع التدفقات، وتتبع قيود الحسابات الرقابية).
- **Multi-Tenant & Dimension Separation** (عزل البيانات الصارم وتأمين الأداء).

## 4. المخاطر (Risks)
- **مخاطر تراجع الأداء (Performance Regression)**: مع استعلام `journalLine` مصفى بالأبعاد المتعددة، قد يتباطأ الاستعلام.
  *   *الحل وتخفيف الأثر*: استغلال الفهارس (Indexes) الافتراضية على قاعدة البيانات وتطبيق استعلامات تجميعية ذكية دون تعقيد العمليات.
- **مخاطر تسرب البيانات (Data Leakage)**: احتمال تسرب بيانات الأبعاد بين Tenants.
  *   *الحل وتخفيف الأثر*: فرض فحص وتصفية `tenantId` القادم من الـ Auth Middleware بشكل إلزامي ومطلق.
- **مخاطر السلامة المحاسبية**:
  *   *الحل وتخفيف الأثر*: المكون بالكامل قراءة فقط (Read-only) تقارير وتدقيق، فلا توجد أي مخاطر تعديل أو ترحيل غير مصرح به.

## 5. خطة التنفيذ (Execution Plan)
- **مرحلة أولى (Scan & Plan)**: فحص دقيق للبيئة والحصول على موافقة خطية من المستخدم (المرحلة الحالية).
- **مرحلة ثانية (Engine Hardening)**: تحديث `src/lib/financial-statements-engine.ts` لإدماج الأبعاد وفحوصات الحوكمة.
- **مرحلة ثالثة (API & Integration)**: تحديث نقاط نهاية الـ API وتوسيعها لمعاملات الفلترة بالأبعاد.
- **مرحلة رابعة (Verification)**: تحديث وتشغيل اختبارات Jest والتحقق من عدم وجود أي خطأ TypeScript أو تراجع محاسبي.

## 6. خطة الاختبار والتحقق (Verification Plan)
1. تشغيل `npx tsc --noEmit` للتحقق من عدم وجود أي خطأ TypeScript.
2. تشغيل كافة اختبارات المحرك واختبارات الذرية:
   * `npx jest src/lib/__tests__/financial-statements-engine.test.ts`
   * `npx jest src/lib/__tests__/sales-atomicity.test.ts`
   * `npx jest src/lib/__tests__/purchase-atomicity.test.ts`
3. التحقق من جودة الكود المحدث عبر Linter.

## 7. ضمانات السلامة المطلقة (Strict Assurances)
```text
SCAN_AND_PLAN_ONLY: True
NO_CODE_CHANGE: True
NO_COMMIT: True
NO_PUSH: True
NO_DEPLOY: True
NO_DB_CHANGE: True
NO_ENV_CHANGE: True
NO_PRODUCTION_TOUCH: True
NO_LIVE_FINANCIAL_POSTING: True
```
