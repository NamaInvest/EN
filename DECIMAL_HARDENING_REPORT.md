# 🔧 تقرير إصلاح الحسابات العشرية — NamaSoft ERP
# Decimal Arithmetic Hardening Report

**التاريخ:** 2026-05-08  
**الفرع:** `hardening/critical-fixes-2026-05-07`  
**الحالة:** ✅ مكتمل — تم الدفع إلى GitHub والنشر على الخوادم  

---

## 📊 ملخص النتائج

| المقياس | قبل | بعد | التحسن |
|---|---|---|---|
| أخطاء TypeScript | **240** | **~40** | **-83%** |
| ملفات معالجة | 0 | **35+** | — |
| وحدات مالية محمية | 0 | **20+** | — |

---

## 🎯 المشكلة الأصلية

نظام Prisma ORM يُعيد الحقول الرقمية من قاعدة البيانات كـ `Decimal` objects بدلاً من أرقام JavaScript عادية (`number`). هذا يسبب:

1. **أخطاء بناء (Build Errors):** TypeScript يرفض عمليات حسابية مثل `price * quantity` لأن `Decimal` ليس `number`
2. **أخطاء وقت التشغيل (Runtime Errors):** `NaN` values تظهر في الفواتير والتقارير
3. **فشل `.toFixed()` و `.toString()`** عند عرض المبالغ في الواجهة

## 🔑 الحل المطبق

### الأداة الأساسية: `n()` Wrapper
```typescript
// src/lib/decimal-utils.ts
export function n(val: any): number {
    if (val == null) return 0;
    return Number(val);
}
```

هذه الدالة تحوّل أي قيمة `Decimal | null | undefined` إلى `number` بأمان.

---

## 📁 الملفات المعدلة

### مكتبات النظام (Libraries)
| الملف | التعديل |
|---|---|
| `src/lib/decimal-utils.ts` | ✅ المرجع الرئيسي (لم يُعدل) |
| `src/lib/auto-decompose.ts` | تغليف `currentStock` بـ `n()` |
| `src/lib/telegram-bot.ts` | تغليف مجاميع الفواتير والكميات |
| `src/lib/customer-statement.ts` | تغليف `subtotal`, `taxValue`, `remaining` |
| `src/lib/pos-session-engine.ts` | تغليف `mov.amount`, `openingFloat` |
| `src/lib/subscription-engine.ts` | تغليف `plan.price`, `plan.setupFee` |
| `src/lib/saudi-eos-engine.ts` | تغليف `salary`, `housingAllowance`, إلخ |
| `src/lib/credit-check.ts` | تغليف نتائج التجميع `_sum` |
| `src/lib/fx-revaluation.ts` | تغليف `inv.total` لحساب إعادة التقييم |
| `src/lib/ifrs9-ecl.ts` | إصلاح null guard + fallback defaults |
| `src/lib/wht-engine.ts` | تغليف `invoice.subtotal` |

### مسارات API (Routes)
| الملف | التعديل |
|---|---|
| `finance/petty-cash/[id]/process` | تغليف `pc.amount` |
| `hr/gosi` | تغليف `emp.salary` |
| `hr/payroll/run` | تغليف حسابات GOSI + صافي الراتب |
| `cron/hr` | تغليف خصومات الرواتب الآلية |
| `cron/scheduled-reports` | تغليف نتائج التجميع |
| `reports/customer-statement` | تغليف حسابات الأرصدة |
| `manufacturing/mrp` | تغليف `quantity * quantityToProduce` |
| `purchase-orders/[id]` | تغليف `subtotal`, `taxValue`, `total` |
| `purchase-returns` | تغليف حقول المرتجع |
| `sales-returns` | تغليف مقارنة الكميات + حقول القيد |
| `treasury/balance` | تغليف نتائج `aggregate` |
| `bookings/invoice` | تغليف حقول فاتورة الحجوزات |
| `smart-transfers` | تغليف `Math.abs(tr.quantity)` |
| `procurement/rfq/.../award` | تغليف `winningBid.amount` |
| `procurement/rfq/.../comparison` | تغليف الترتيب بالمبلغ |
| `finance/checks/.../process` | تغليف مبلغ الشيك |
| `finance/cfo` | تغليف نتائج التجميع |
| `finance/cfo-dashboard` | تغليف مبالغ الخزينة |
| `payroll/calculate` | تغليف الراتب والبدلات |
| `invoice/[id]/page.tsx` | `Number()` casting للعرض |

---

## 🚀 خطوات النشر المنفذة

1. ✅ **Git Commit** — 5 دفعات متتالية على فرع `hardening/critical-fixes-2026-05-07`
2. ✅ **GitHub Push** — https://github.com/NamaInvest/EN/tree/hardening/critical-fixes-2026-05-07
3. ✅ **Fleet Deploy** — النشر عبر `deploy_decimal_hardening.js` إلى:
   - `main-site` (namainvist.com:3000)
   - `n1-main` (n1.namainvist.com:3001)
   - `saas-app` (n11.namainvist.com:3011)

---

## ⚠️ أخطاء متبقية (~40)

### تصنيف الأخطاء المتبقية:
| النوع | العدد | الأولوية |
|---|---|---|
| `design1/page.tsx` (صفحة عرض) | 6 | منخفضة — ليست مالية |
| `.next/types/` (ملفات مولدة) | 4 | لا تحتاج إصلاح |
| حقول أخرى (POS, Stock, Cron) | ~30 | متوسطة |

### الملفات المتبقية للإصلاح:
- `src/app/api/pos/checkout/route.ts`
- `src/app/api/pos/products/route.ts`
- `src/app/api/pos/pending-orders/route.ts`
- `src/app/api/stock-movements/route.ts`
- `src/app/api/stock-transfers/route.ts`
- `src/app/api/stocktake/route.ts`
- `src/app/api/stocktake/vision/route.ts`
- `src/app/api/sales/commissions/calculate/route.ts`
- `src/app/api/sales/pricing/calculate/route.ts`
- `src/app/api/cron/reorder-alerts/route.ts`
- `src/app/api/cron/predictive-po/route.ts`
- `src/app/api/cron/trigger-invoices/route.ts`
- `src/app/api/expenses/route.ts`
- `src/app/api/ai-cfo/report/route.ts`
- `src/app/api/public/order/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/purchases/route.ts`

---

## 📋 توصيات المتابعة

1. **دمج الفرع:** `git merge hardening/critical-fixes-2026-05-07` في `main`
2. **إصلاح الـ 30 ملف المتبقي** بنفس نمط `n()` wrapper
3. **مراجعة Prisma Schema** لتحويل حقول `Float` إلى `Decimal` أصلياً
4. **فرض قاعدة Code Review** لمنع إضافة عمليات حسابية جديدة بدون `n()`
