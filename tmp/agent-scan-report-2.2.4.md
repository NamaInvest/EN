# DEEP SCAN LEVEL 3: Phase 2.2.4 — Treasury Idempotency & Replay Protection

## 1. Scope & Understanding
**المطلوب**: توسيع نطاق حماية الـ Idempotency باستخدام Redis ليشمل عمليات الخزينة (Treasury) بالكامل (القبض، الصرف، التحويلات، التسويات)، لضمان أن كل مسار مالي يصبح Atomic و Idempotent و Observable.

**لماذا؟** التكرار في الخزينة يؤدي إلى ازدواجية في الأرصدة النقدية والقيود المالية، وهو أخطر من تكرار المخزون.

## 2. Files Scanned (الملفات التي تم فحصها)
1. `src/app/api/treasury/route.ts` (Receipts/Payments - already has partial lock logic, needs review)
2. `src/app/api/finance/treasury/route.ts` (Realized FX posting)
3. `src/app/api/smart-transfers/route.ts` (Stock transfers, lacks idempotency)
4. `src/app/api/finance/petty-cash/[id]/process/route.ts` (Petty Cash settlements)
5. `src/app/api/accounting/open-items/apply-payment/route.ts` (Already uses `withIdempotency`)

## 3. Impact Analysis & Affected Domains (الدومينات المتأثرة)
- **Treasury / Finance**: Receipts, Payments, FX Posting, Settlements.
- **Inventory / Smart Transfers**: Transit in/out operations.
- **Accounting**: Journal entries generated from treasury movements.
- **Database**: No schema changes required (Redis lock strategy).

## 4. Risks (المخاطر)
- تطبيق Idempotency بشكل خاطئ قد يمنع العمليات المشروعة إذا لم يتم مسح الـ key عند الفشل.
- بعض الـ Endpoints القديمة تستخدم transaction logic معقد، يجب التأكد من عدم حجب الـ Error Propagation.

## 5. Implementation Plan (خطة التنفيذ الصغيرة والآمنة)
- **مرحلة 1**: تطبيق/تحسين الـ `withIdempotency` wrapper على `src/app/api/finance/treasury/route.ts` لحماية عمليات الـ FX Posting.
- **مرحلة 2**: تطبيق الـ `withIdempotency` على عمليات التحويل `src/app/api/smart-transfers/route.ts`.
- **مرحلة 3**: تطبيق الـ `withIdempotency` على تسويات العهد `src/app/api/finance/petty-cash/[id]/process/route.ts`.
- **مرحلة 4**: المراجعة الشاملة لـ `src/app/api/treasury/route.ts` وتوحيده مع `withIdempotency` wrapper لضمان التناسق.

## 6. Testing Plan (خطة الاختبار)
- محاولة إرسال طلبات مزدوجة (Double Clicks) ومراقبة تصرف Redis والـ HTTP Status.
- التأكد من أن القيود المالية لا تتكرر.
- تشغيل أوامر TypeScript و Linter.
