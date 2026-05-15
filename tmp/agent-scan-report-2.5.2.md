# تقرير فحص وتخطيط - Phase 2.5.2: Typed Transaction Helpers

## 1. الهدف (Objective)
توفير دوال مساعدة (Helpers) للعمليات المالية والمخزنية تكون **Strongly Typed** لتمرير الـ Transaction `tx` إجبارياً إلى الطبقات الأدنى. هذا التوجه أفضل وأأمن من تطبيق `Prisma Extensions` فوراً لأنه:
- يعتمد على الـ Compiler (Compile-time enforcement).
- لا يكسر الـ Runtime بأخطاء مفاجئة.
- يسمح بالانتقال التدريجي (Incremental Adoption).

## 2. فحص الوضع الحالي (Current State)
- ملف `src/lib/db/transaction.ts` موجود مسبقاً، ويحتوي على دالة `withTransaction` و `atomically`.
- المشكلة: الدالة تعرّف `tx` كـ `any` هكذا: `fn: (tx: any) => Promise<T>`. هذا يلغي فائدة الـ TypeScript ويسمح بتمرير أي كائن أو الاعتماد على `prisma` الداخلي.
- يوجد العديد من مسارات API تعتمد على `prisma.$transaction(async (tx: any) => {...})` بشكل مباشر.

## 3. الخطة المقترحة للتنفيذ (Proposed Plan)

### الخطوة الأولى: بناء Typed Helpers
سنقوم بتحديث ملف `src/lib/db/transaction.ts` لإضافة:
1. استيراد أنواع Prisma: `import { Prisma } from '@prisma/client'`.
2. إنشاء النوع `TxClient = Prisma.TransactionClient` لسهولة الاستخدام.
3. بناء الدوال المخصصة كالتالي:
   ```typescript
   export async function runFinancialTx<T>(
     prisma: any,
     fn: (tx: Prisma.TransactionClient) => Promise<T>,
     operationName: string = 'financial-tx'
   ): Promise<T> { ... }

   export async function runInventoryTx<T>(
     prisma: any,
     fn: (tx: Prisma.TransactionClient) => Promise<T>,
     operationName: string = 'inventory-tx'
   ): Promise<T> { ... }
   ```
4. تحديث الدالة القديمة `withTransaction` لتستخدم `Prisma.TransactionClient` كنوع افتراضي بدلاً من `any`.

### الخطوة الثانية: تحويل Types لخدمات المحاسبة (Accounting Engine)
(في ملف `auto-journal.ts` أو غيره لاحقاً) سيتم تغيير توقيع الدوال لتطلب `tx: Prisma.TransactionClient` إجبارياً، بدلاً من الاعتماد على إنشائه داخلياً، مما يجبر الـ Route على تمريره.

## 4. الفوائد الأمنية (Security & Architecture Benefits)
- المترجم (TypeScript) سيرفض بناء الكود `npx tsc` إذا حاول المطور إرسال `any` أو `prisma` عادي إلى الخدمات المالية.
- التوافقية: الدالة القديمة ستظل تعمل ولكن سيتم تفضيل استخدام `runFinancialTx` في المسارات الحساسة.
- تمهد الطريق للخطوة 2.5.3 حيث ستتحول الـ Repositories إلى مساحات لا تتنفس إلا بوجود `tx`.

## 5. نطاق التعديل القادم (Scope of the Next Execution)
- سيتم تعديل **فقط** ملف `src/lib/db/transaction.ts`.
- لن يتم كسر أي API Route موجود حالياً.
- سنتحقق من خلو المشروع من أخطاء الـ TS عبر `npx tsc --noEmit`.
