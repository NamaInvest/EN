# تقرير فحص وتخطيط - Phase 2.5.5: Accounting Journal Contract Isolation

## 1. الهدف (Objective)
استخراج وعزل المنطق المحاسبي المركزي (القيود المحاسبية) إلى Service Contract جديد `AccountingJournalService`.
يمنع هذا العقد الإنشاء المباشر للقيود خارج سياق `FinancialTxClient`، ويشترط استدعاء هذا الـ Service من خلال الـ Financial Services الأخرى (مثل Treasury, POS, Purchases) التي تعمل بالفعل ضمن `runFinancialTx`.

## 2. النطاق المختار (Target Scope)
- مراجعة استدعاءات `createJournalEntry` (الموجودة في `src/lib/auto-journal.ts` حالياً) أو `prisma.journalEntry.create` المباشرة.
- إنشاء `src/lib/services/accounting-journal.service.ts`.
- تحديث التبعيات في النظام المالي للبدء في استخدام الخدمة الجديدة بدلاً من المنطق القديم المبعثر.

## 3. خطة التنفيذ المقترحة (Execution Plan)

### أ. بناء الخدمة (Service Contract)
- إنشاء `AccountingJournalService` يحتوي على `createEntry(tx: FinancialTxClient, data: CreateJournalEntryDTO)`.
- الدالة تأخذ `tx` وتنفذ جميع مهام إنشاء القيد (التحقق من التوازن، إدراج الـ Lines، حفظ الـ Journal Entry) باستخدام `FinancialTxClient`.

### ب. النقل والدمج (Migration)
نظراً لحجم العمل الذي يمس (POS, Purchases, Treasury, Sales, Expenses) فإننا سنحتاج إلى:
1. نقل `createJournalEntry` الحالي من `src/lib/auto-journal.ts` إلى `AccountingJournalService.createEntry` وتحديث الـ Typing ليجبر الـ `FinancialTxClient`.
2. البحث في المسارات (Routes) والخدمات (Services) عن استدعاءات الجورنال وتعديلها لتستخدم `AccountingJournalService`.

## 4. القيود المعمارية الجديدة
- **المعمارية النهائية:** `Route` -> `Financial Service` -> `AccountingJournalService` -> `FinancialTxClient` -> `Prisma`.
- الـ Controller لا يستطيع إنشاء قيد محاسبي بنفسه.

هل نبدأ بتنفيذ الخطوة الأولى وإنشاء `src/lib/services/accounting-journal.service.ts` وتحديث `auto-journal.ts` ليعمل كواجهة قديمة (Legacy Interface) تحيل إلى الخدمة الجديدة، أم نعدل كل شيء دفعة واحدة؟
