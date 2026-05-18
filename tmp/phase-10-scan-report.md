# Phase 10 — Financial Tracing Engine Integration
# SCAN REPORT

**Date:** 2026-05-18
**Status:** SCAN ONLY — No code written yet

---

## 1. ما تم فحصه

### ملفات Observability Layer
- `src/lib/observability/financial-trace.ts` ✅ موجود، كامل
- `src/lib/observability/logger.ts` ✅ موجود، يحتوي logger.financial(), logger.override()
- `src/lib/observability/correlation.ts` ✅ موجود، يحتوي getCorrelationId(), generateTraceId()
- `src/lib/observability/request-context.ts` ✅ موجود، AsyncLocalStorage

### ملفات المحركات
- `src/lib/auto-journal.ts` — 1387 سطر، نقطة دخول مركزية لكل القيود المحاسبية
- `src/lib/services/accounting-journal.service.ts` — 185 سطر، service مُستدعى من createJournalEntry
- `src/lib/services/treasury-posting.service.ts` — 83 سطر، يستدعي createJournalEntry
- `src/lib/governance/period-lock.ts` — 143 سطر، assertPeriodWritable، يرمي PeriodLockViolation

### ملفات الاختبارات
- `tests/integration/accounting/journal-posting.test.ts` — 56 سطر، اختبارات أساسية
- `tests/integration/treasury/payments.test.ts` — 42 سطر، اختبارات أساسية
- `tests/integration/accounting/period-lock.test.ts` — محتاج فحص

---

## 2. تحليل البنية

### 2.1 نقطة الدخول المثلى للـ Tracing

```
createJournalEntry() في auto-journal.ts
    │
    ├─→ assertPeriodWritable() ← period state check
    │
    └─→ AccountingJournalService.createEntry() ← actual DB write
```

**القرار:** الـ tracing يُضاف في `createJournalEntry()` فقط لأنها:
- نقطة دخول وحيدة لكل قيود المحاسبة (postSalesInvoice, postPurchaseInvoice, postGRN…)
- تحتوي بالفعل على assertPeriodWritable()
- تستقبل overrideContext

### 2.2 Treasury Tracing

`TreasuryPostingService.createTreasuryEntry()` يستدعي `createJournalEntry()` مباشرة.
الـ tracing على `createJournalEntry` يغطيها تلقائياً.
لكن يجب إضافة treasury-level trace منفصل لأن:
- مرحلة إنشاء treasury record منفصلة عن مرحلة journal
- قد تفشل treasury.create بدون أن تصل إلى createJournalEntry

### 2.3 Period Lock Tracing

`assertPeriodWritable()` تستخدم `logger` القديم وليس `logger.override()`
الهدف: إضافة `tracePeriodLockRejection()` عند الـ PeriodLockViolation + `traceOverrideUsed()` عند ALLOWED_WITH_OVERRIDE

---

## 3. الملفات المرشحة للتعديل

| الملف | التغيير | الأثر |
|-------|---------|-------|
| `src/lib/auto-journal.ts` | إضافة traceFinancialOperation wrapper حول createJournalEntry | ✅ آمن — فقط حول المنطق الموجود |
| `src/lib/governance/period-lock.ts` | استبدال logger.warn بـ tracePeriodLockRejection / traceOverrideUsed | ✅ آمن — فقط logging |
| `src/lib/services/treasury-posting.service.ts` | إضافة traceFinancialOperation wrapper | ✅ آمن |

### ما لن يتغير:
- منطق الحسابات (debit/credit/balance updates)
- assertPeriodWritable logic
- Transaction boundaries
- Prisma queries
- Schema

---

## 4. المعلومات المتاحة في كل عملية

### createJournalEntry (auto-journal.ts)
- ✅ operationType — معروف (createJournalEntry أو تُمرر من المستدعي)
- ✅ module — معروف (Accounting أو تُمرر)
- ✅ tenantId — activeTenant (من resolveTenant())
- ✅ actorId — params.userId
- ✅ postingDate — targetDate
- ✅ reference — params.reference (مثل SALE-123, PUR-456)
- ✅ overrideContext — متوفر
- ❌ currency — غير متوفر في createJournalEntry (متوفر في params.currencyId)

### TreasuryPostingService
- ✅ operationType — TREASURY_RECEIPT أو TREASURY_PAYMENT
- ✅ tenantId — body.tenantId
- ✅ actorId — userId
- ✅ amount — body.amount (لا نسجل القيمة نفسها بل وجودها فقط)
- ✅ reference — TREAS-{id}

---

## 5. المخاطر

1. **auto-journal.ts يستخدم `resolveTenant()`** — لا يعتمد على AsyncLocalStorage مباشرة
   - الحل: نستخدم activeTenant المُحسوب محلياً
   
2. **treasury-posting.service.ts يأخذ tenantId من body** — ليس من header
   - ممنوع تغيير هذا السلوك، نُوثّقه فقط

3. **period-lock.ts تستخدم logger قديم** — آمن استبداله بـ logger الجديد

4. **createJournalEntry تعيد `{ success, entryId, error }`** — لن نغير هذا الـ API

---

## 6. خطة التنفيذ (صغيرة وآمنة)

### المرحلة 10.A — createJournalEntry Tracing
- إضافة `traceFinancialOperation()` wrapper في `createJournalEntry()`
- يُسجل: operationType, module, tenantId, actorId, reference, postingDate, overrideUsed, periodState
- لا يُسجل: amounts, line details, customer names

### المرحلة 10.B — Period Lock Tracing
- استبدال logging في `assertPeriodWritable()` بـ `traceOverrideUsed()` و `tracePeriodLockRejection()`
- يُحتفظ بكل المنطق الحالي كما هو

### المرحلة 10.C — Treasury Tracing
- إضافة `traceFinancialOperation()` wrapper في `createTreasuryEntry()`
- يُسجل: TREASURY_RECEIPT/PAYMENT, tenantId, actorId, reference

### المرحلة 10.D — اختبارات
- اختبارات في `tests/integration/accounting/journal-tracing.test.ts`
- اختبارات في `tests/integration/treasury/treasury-tracing.test.ts`
- اختبار: tracing يبدأ قبل journal posting
- اختبار: SUCCESS عند النجاح
- اختبار: REJECTED عند PeriodLockViolation
- اختبار: overrideUsed عند override
- اختبار: لا PII في payload

### المرحلة 10.E — وثائق + Report

---

## 7. قائمة الفحص الأمني

- [x] لا تعديل على assertPeriodWritable logic
- [x] لا تعديل على AccountingJournalService.createEntry
- [x] لا تعديل على debit/credit calculations  
- [x] لا تغيير على Transaction boundaries
- [x] لا تسجيل amounts (فقط hasAmount: boolean إن وجد)
- [x] لا تسجيل customer names أو employee names
- [x] لا تسجيل line details
- [x] reference field آمن (SALE-123, TREAS-456)
