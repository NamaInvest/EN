# 📊 تقرير أخطاء TypeScript — TS Error Inventory

> **التاريخ:** 2026-05-08
> **الحالة:** 191 خطأ متبقي (من 240 أصلي)

---

## التوزيع حسب نوع الخطأ

| الكود | الوصف | العدد | الأولوية |
|-------|-------|-------|---------|
| TS2362 | Left-hand side of arithmetic must be number | ~55 | 🔴 عالية |
| TS2363 | Right-hand side of arithmetic must be number | ~40 | 🔴 عالية |
| TS2365 | Operator cannot be applied to types | ~30 | 🔴 عالية |
| TS2322 | Type assignability issues | ~30 | 🟡 متوسطة |
| TS18047 | Possibly 'null' | ~8 | 🟡 متوسطة |
| TS2345 | Argument type mismatch | ~8 | 🟡 متوسطة |
| TS7006 | Parameter implicitly has 'any' type | ~4 | 🟢 منخفضة |
| TS2344 | Type constraint violation | ~3 | 🟢 منخفضة |
| أخرى | TS2367, TS2614, TS2578, TS2554, TS2741 | ~7 | 🟢 منخفضة |

---

## الحل المُتّبع: `n()` wrapper

تم إنشاء `src/lib/decimal-utils.ts` لحل أخطاء Prisma.Decimal:

```typescript
import { n } from '@/lib/decimal-utils';

// قبل (يسبب TS2362/TS2363):
const total = invoice.total - invoice.tax;

// بعد (صحيح):
const total = n(invoice.total) - n(invoice.tax);
```

---

## الملفات المُصلحة ✅

1. `src/app/api/reports/what-if/route.ts` — 13 خطأ
2. `src/app/api/purchases/po/[id]/landed-costs/[costId]/allocate/route.ts` — 12 خطأ
3. `src/app/api/purchases/letters-of-credit/landed-costs/route.ts` — 10 خطأ
4. `src/app/api/reports/[type]/route.ts` — 9 أخطاء
5. `src/app/api/bi/kpis/route.ts` — 8 أخطاء
6. `src/app/api/purchases/matching/route.ts` — 8 أخطاء

---

## الملفات المتبقية (تحتاج إصلاح)

| الملف | الأخطاء المتوقعة |
|-------|-----------------|
| `src/app/api/ai/predictive-scm/route.ts` | ~6 |
| `src/app/api/warehouses/analytics/route.ts` | ~5 |
| `src/app/api/reports/cash-flow/route.ts` | ~4 |
| `src/lib/variance-engine.ts` | ~4 |
| `src/app/api/ai/demand-forecast/route.ts` | ~4 |
| `src/lib/vendor-statement.ts` | ~3 |
| `src/app/api/procurement/auto-draft/route.ts` | ~3 |
| `src/app/api/manufacturing/orders/route.ts` | ~3 |
| `src/lib/crm-engine.ts` | ~3 |
| `src/app/api/sales-returns/route.ts` | ~4 |
| `src/app/api/purchase-orders/[id]/route.ts` | ~4 |
| `src/app/api/purchase-returns/route.ts` | ~3 |
| `src/app/api/bookings/invoice/route.ts` | ~3 |
| باقي الملفات | ~varies |

---

## الخطة لإكمال الإصلاح

1. **المرحلة 1 (هذا الأسبوع):** إصلاح TS2362/TS2363/TS2365 بإضافة `n()` — ~125 خطأ
2. **المرحلة 2 (الأسبوع القادم):** إصلاح TS2322 type assignability — ~30 خطأ
3. **المرحلة 3:** إصلاح null checks (TS18047) + باقي الأخطاء — ~36 خطأ
