# Agent Scan & Plan Report — Phase F-08B: SLA Runtime Integration

## 1. الملفات التي قرأتها (Files Scanned)
- [PROJECT_BRAIN.md](file:///d:/namasoft9-3-main/PROJECT_BRAIN.md) (architecture & port map context)
- [LIVE_GAP_ANALYSIS.md](file:///d:/namasoft9-3-main/LIVE_GAP_ANALYSIS.md) (semantic analysis of engines)
- [03-FINANCIAL_INVARIANTS.md](file:///d:/namasoft9-3-main/project-governance/03-FINANCIAL_INVARIANTS.md) (absolute financial laws)
- [auto-journal.ts](file:///d:/namasoft9-3-main/src/lib/auto-journal.ts) (legacy distribution hooks)
- [route.ts (sales)](file:///d:/namasoft9-3-main/src/app/api/sales/route.ts) (sales API endpoint)
- [route.ts (purchases)](file:///d:/namasoft9-3-main/src/app/api/purchases/route.ts) (purchases API endpoint)
- [sales-atomicity.test.ts](file:///d:/namasoft9-3-main/src/lib/__tests__/sales-atomicity.test.ts) (sales ledger atomicity tests)
- [purchase-atomicity.test.ts](file:///d:/namasoft9-3-main/src/lib/__tests__/purchase-atomicity.test.ts) (purchase ledger atomicity tests)

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- `src/lib/auto-journal.ts` (تفويض الترحيل لخدمة المحاسبة الفرعية وحذف الأكواد المكررة)
- `src/app/api/sales/route.ts` (تكامل مسار المبيعات وتأمين ذرية القيود)
- `src/app/api/purchases/route.ts` (تكامل مسار المشتريات وتأمين المعاملات والـ GRNI)
- `src/lib/__tests__/sales-atomicity.test.ts` (تعديل استثناءات اختبارات ذرية المبيعات)
- `src/lib/__tests__/purchase-atomicity.test.ts` (تعديل استثناءات اختبارات ذرية المشتريات)
- `.gitignore` (استبعاد ملفات العمل وتعديلات الأنواع المحلية)
- `deploy.js` (إضافة دعم مسارات SSH الخارجية للمرونة البرمجية)

## 3. الدومينات المتأثرة (Affected Domains)
- General Ledger & Subledger Accounting (SLA) (توحيد المعالجة).
- Sales POS & Purchasing flows (تكامل نقاط النهاية).
- Financial Governance & Period Locks (حماية توازن القيود ومنع التعديل).

## 4. المخاطر (Risks)
- **مخاطر تراجع توازن القيود**: تم تأمينها بالكامل عبر اختبارات التكامل المعزولة واختبارات الذرية التي تغطي حالات عدم التوازن وتمنع حفظ الفواتير إطلاقاً في حالة عدم توازن القيد.
- **مخاطر الحوكمة وفترات الإقفال**: تم ربط المسارات بـ `SubledgerAccountingService` التي تجري فحصاً إلزامياً لـ Period Lock قبل أي ترحيل مالي.
- **التراجع الكامل**: لا توجد أي تغييرات على مخطط قاعدة البيانات أو المتغيرات البيئية، مما يجعل عملية التراجع اللحظي (rollback) آمنة وسهلة.

## 5. خطة التنفيذ (Execution Plan)
- مرحلة أولى: دمج وتعديل `src/lib/auto-journal.ts` لتفويض الترحيل للـ SLA Engine.
- مرحلة ثانية: تكامل مسارات الفواتير في `src/app/api/sales/route.ts` و `src/app/api/purchases/route.ts`.
- مرحلة ثالثة: تهيئة اختبارات التراجع والذرية القديمة في `src/lib/__tests__/...` لتتوافق مع معيار الـ SLA الملقي للاستثناءات.

## 6. خطة الاختبار والتحقق (Verification Plan)
1. تشغيل `npx tsc --noEmit` للتحقق من زوال كافة أخطاء TypeScript.
2. تشغيل كافة اختبارات الذرية والتكامل للتأكد من سلامة التراجع:
   * `npx vitest run src/lib/__tests__/sales-atomicity.test.ts`
   * `npx vitest run src/lib/__tests__/purchase-atomicity.test.ts`
   * `npx vitest run tests/integration/accounting/subledger-accounting.test.ts`
3. التحقق من صحة وصلاحية Prisma schema: `npx prisma validate`.
4. التحقق من جودة الكود المعدل: `npx eslint src/lib/auto-journal.ts src/app/api/sales/route.ts src/app/api/purchases/route.ts`.

## 7. ضمانات السلامة المحاسبية (Strict Assurances)
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
