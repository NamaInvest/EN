# GL ↔ Treasury Consistency Audit Report (Phase 1)
**Date:** 2026-05-14
**Mode:** ENTERPRISE ARCHITECTURAL AUDIT MODE (DEEP SCAN LEVEL 3)
**Domain:** Financial Integrity (Treasury & General Ledger)

## 1. ما فهمته (Understanding of the Task)
المطلوب هو إجراء تدقيق شامل على مستوى معمارية النظام (Consistency Audit) للتأكد من التوافق التام بين حركات الخزينة/البنوك (Treasury) والقيود المحاسبية (Journal Entries). الهدف هو رصد أي حالات (Split-Brain) حيث يتم تسجيل حركة مالية في أحد الطرفين دون الآخر، أو وجود ثغرات في الـ Atomicity و Idempotency التي قد تؤدي إلى تكرار الحركات أو غياب المرجعية المالية.

## 2. الملفات التي تم فحصها (Files Scanned)
- `prisma/schema.prisma` (Architecture mapping)
- `src/app/api/treasury/route.ts` (Manual Treasury Entries)
- `src/app/api/sales/route.ts` (Sales Invoices & split payments)
- `src/app/api/purchases/route.ts` (Purchase Invoices & partial payments)
- `src/app/api/sales-returns/route.ts` (Sales Returns refunds)
- `src/lib/auto-journal.ts` (Journal Entry engine)
- `src/lib/payment-run-engine.ts` (Batch payments)
- `src/lib/open-items.ts` (Atomic payment apps & FX)

## 3. الملفات المحتمل تعديلها (Potential Target Files)
- `src/app/api/purchases/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/sales-returns/route.ts`
- `src/app/api/purchase-returns/route.ts`
- `src/lib/idempotency.ts` (If applying missing wrappers)

## 4. الدومينات المتأثرة (Affected Domains)
- **Treasury (Cash/Bank Management)**
- **Accounting (General Ledger)**
- **Accounts Payable (AP)**
- **Accounts Receivable (AR)**
- **Tenant Isolation**

## 5. المخاطر والثغرات المكتشفة (Findings & Root Causes)

### A. Critical Gap: Purchase Invoice Partial Payments (Split-Brain)
- **المكان:** `src/app/api/purchases/route.ts` (Method: `_PUT`)
- **وصف الثغرة:** عند قيام المستخدم بتسديد دفعة جزئية (Partial Payment) لفاتورة مشتريات عبر `PUT`، يتم إنشاء حركة `Treasury` (`type: 'out'`, `referenceType: 'purchase_payment'`) **ولكن لا يتم استدعاء محرك القيود `createJournalEntry` نهائياً!**
- **الخطر (Financial Risk):** انخفاض رصيد الصندوق/البنك في واجهة الخزينة دون تسجيل القيد الدائن في الـ GL ودون تسجيل القيد المدين في حساب الدائنين (AP). هذا يسبب فرقاً مباشراً في ميزان المراجعة (Trial Balance) وانفصالاً بين الواقع المحاسبي وواقع الخزينة.
- **Root Cause:** غياب ربط الـ `_PUT` مع `auto-journal.ts` (missing `postPurchasePayment` function).

### B. Missing Idempotency on Critical Endpoints
- **المكان:** `src/app/api/purchases/route.ts`
- **وصف الثغرة:** الـ `PUT` endpoint الخاص بدفعات المشتريات غير محمي بـ `withIdempotency`، بينما الـ `POST` محمي. 
- **الخطر (Security/Concurrency Risk):** قد يؤدي النقر المزدوج (Double-click) إلى تسجيل الدفعة نفسها مرتين في الخزينة وخصم المبلغ مرتين من رصيد الفاتورة (Double-Spend).

### C. Missing Hard Link between Treasury and JournalEntry
- **وصف الثغرة:** لا يوجد مفتاح أجنبي مباشر `journalEntryId` داخل جدول `Treasury`. يتم الربط حالياً عبر الـ `reference` (مثال: `TREAS-123` أو `SALE-456`).
- **الخطر (Architectural Risk):** يجعل من الصعب (أو البطيء جداً) استخراج تقارير مطابقة سريعة (Reconciliation) لاكتشاف الـ Orphans. الـ Payment Run هو الوحيد الذي يخزن `journalEntryId` في الـ `PaymentRun` model، لكن الـ Treasury rows الفردية تفتقر لهذا الرابط الصريح.

### D. Sales Returns & Purchase Returns Treasury Isolation
- **المكان:** `src/app/api/sales-returns/route.ts`
- **وصف الثغرة:** يتم تسجيل الـ Treasury row بمبلغ إجمالي الـ Return، ثم يتم استدعاء `postSalesReturn` الذي ينشئ القيد. العملية محاطة بـ `prisma.$transaction` وهذا ممتاز، ولكن الـ Treasury uses `referenceType: 'salesReturn'` والقيد يستخدم `reference: SRET-<id>`. لا توجد ثغرة Split-Brain هنا بفضل الـ Transaction، لكن يوجد ضعف في التتبع المرجعي المباشر.

## 6. خطة التنفيذ (Small Safe Plan)
بناءً على المبدأ المعماري الصارم، يجب معالجة أخطر ثغرة أولاً (ثغرة الدفعات الجزئية للمشتريات)، قبل إجراء أي تغييرات معمارية على الداتا بيز.

**المرحلة المقترحة (Phase 1.1): سد ثغرة الـ Purchase Payments**
1. إنشاء دالة `postPurchasePayment(params)` داخل `src/lib/auto-journal.ts` لتوليد القيد المحاسبي المباشر (Dr. AP / Cr. Cash-Bank).
2. تعديل الـ `_PUT` في `src/app/api/purchases/route.ts` لاستدعاء هذه الدالة ضمن نفس الـ `prisma.$transaction`.
3. حماية الـ `PUT` endpoint في المشتريات باستخدام `withIdempotency` لمنع تكرار الدفع.
4. عدم المساس بباقي الملفات حالياً التزاماً بقاعدة "أصغر تعديل آمن" (Small Patch).

## 7. خطة الاختبار (Testing Plan)
- **Unit/Integration Test:** التحقق من أن عمل `PUT` لدفعة جزئية (مثلاً 500 ريال) على فاتورة مشتريات ينشئ صفاً في `Treasury` + صفاً في `JournalEntry` بنفس اللحظة.
- **Idempotency Test:** إرسال طلبين متطابقين بنفس الـ Idempotency Key والتأكد من تسجيل دفعة واحدة فقط.
- **Financial Balance Test:** ميزان المراجعة قبل وبعد الدفعة يجب أن يظل متوازناً.

---
**الرجاء المراجعة وإعطاء الموافقة (Approval) للبدء في تنفيذ Phase 1.1.**
