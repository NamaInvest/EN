# تقرير فحص وتخطيط - Phase 2.5.4: Treasury Posting Service Contract

## 1. الهدف (Objective)
استخراج مسار `Treasury` في `api/treasury/route.ts` إلى Service Contract يُدعى `TreasuryPostingService`. الخدمة ستشترط وجود `FinancialTxClient` لضمان أن كل حركات الخزينة وقيود اليومية الخاصة بها (Journal Entries) تُسجل معاً داخل نفس الـ Transaction.

## 2. المسار المختار (Target Route)
المسار: `src/app/api/treasury/route.ts`
يحتوي على `POST` لإنشاء حركة خزينة مع `createJournalEntry` بداخل `prisma.$transaction`.

## 3. خطة التنفيذ (Execution Plan)

### أ. بناء الخدمة (Service Contract)
- إنشاء ملف `src/lib/services/treasury-posting.service.ts`.
- بناء الكلاس `TreasuryPostingService`.
- إضافة الدالة `createTreasuryEntry(tx: FinancialTxClient, body: any, userId: number | null, branchId: number | null)`.
- الدالة ستقوم بإنشاء `treasury` ثم استدعاء `createJournalEntry` مع تمرير `tx`.

### ب. تحديث الـ API Route
- في `src/app/api/treasury/route.ts` سنستبدل `prisma.$transaction` بـ `runFinancialTx`.
- سيستدعي الـ Route الخدمة الجديدة ويمرر لها الـ `tx`.

## 4. القيود المعمارية الجديدة (New Architectural Bounds)
بمجرد تنفيذ هذا:
1. لن تُقبل أي حركة خزينة مخصصة دون قيود مالية بـ `FinancialTxClient`.
2. حماية كاملة من الـ Partial commits إذا فشل قيد اليومية.

## 5. مخرجات الفحص
آمن؟ نعم. الـ Idempotency موجود بالفعل حول الـ Route، والـ Service Contract سيقوي الـ Atomicity.
