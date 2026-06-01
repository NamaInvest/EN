# Agent Scan & Plan Report — TYPECHECK_STABILIZATION_BEFORE_F08_PUSH

## 1. الملفات التي قرأتها (Files Scanned)
- [auto-journal.test.ts](file:///d:/namasoft9-3-main/src/lib/auto-journal.test.ts) (legacy logic contract tests)
- [auto-journal.ts](file:///d:/namasoft9-3-main/src/lib/auto-journal.ts) (modernized posting hooks)
- [subledger-accounting.ts](file:///d:/namasoft9-3-main/src/lib/services/subledger-accounting.ts) (F-08 subledger accounting engine)
- [sales-atomicity.test.ts](file:///d:/namasoft9-3-main/src/lib/__tests__/sales-atomicity.test.ts) (legacy sales integration tests)
- [purchase-atomicity.test.ts](file:///d:/namasoft9-3-main/src/lib/__tests__/purchase-atomicity.test.ts) (legacy purchase integration tests)
- [route.ts](file:///d:/namasoft9-3-main/src/app/api/sales/route.ts) (sales API endpoint)

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- [auto-journal.test.ts](file:///d:/namasoft9-3-main/src/lib/auto-journal.test.ts): إصلاح أخطاء TypeScript المكتشفة بسبب اختلاف نوع الإرجاع لـ `postSalesInvoice` من النوع القديم `{ success: boolean }` إلى كائن `JournalEntry` الفعلي للـ Prisma (أو إلقاء استثناء عند الفشل).

## 3. الدومينات المتأثرة (Affected Domains)
- Subledger Accounting (SLA) testing boundary.
- General Ledger & Auto-journal contracts verification.

## 4. المخاطر (Risks)
- لا توجد مخاطر على الكود الإنتاجي (Production Code) لأن التعديل مقتصر بالكامل على ملف اختبارات برمجية (`auto-journal.test.ts`).
- لا يتم لمس ملفات F-08.
- لا يتم تعديل أي منطق مالي أو محاسبي.

## 5. خطة التنفيذ (Execution Plan)
- تعديل استدعاءات `postSalesInvoice` في `src/lib/auto-journal.test.ts` بإضافة مغلف `.then(() => ({ success: true })).catch(() => ({ success: false }))` ليتطابق بالكامل مع الفحص القديم المعتمد على وجود خاصية `success`.
- تشغيل `npx tsc --noEmit` للتحقق من زوال كافة أخطاء TypeScript على مستوى المشروع بالكامل.

## 6. خطة الاختبار والتحقق (Verification Plan)
1. تشغيل `npx tsc --noEmit` للتأكد من نجاح الـ typecheck بنسبة 100%.
2. تشغيل اختبارات F-08 الموجهة: `npx vitest run tests/integration/accounting/subledger-accounting.test.ts`.
3. التحقق من صحة Prisma schema: `npx prisma validate`.
4. التحقق من جودة الكود المطور: `npx eslint src/lib/services/subledger-accounting.ts tests/integration/accounting/subledger-accounting.test.ts`.

## 7. ضمانات السلامة المحاسبية والبيئية (Strict Assurances)
```text
NO_PUSH: True
NO_DEPLOY: True
NO_DB_CHANGE: True
NO_ENV_CHANGE: True
NO_PRODUCTION_TOUCH: True
NO_LIVE_FINANCIAL_POSTING: True
```
