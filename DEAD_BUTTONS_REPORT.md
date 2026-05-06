# 🔘 تقرير الأزرار المعطلة — Namasoft ERP

> **40+ صفحة** بأزرار بدون handlers أو forms بدون submit.
> **خبر سار:** APIs سليمة (180+ endpoint موجود) — استثناء واحد فقط.

---

## TOP 20 وحدة بأكثر أزرار معطلة

| # | الوحدة | عدد الأزرار | نوع المشكلة |
|---|--------|-------------|-------------|
| 1 | `accounting/page.tsx` | **18** | Account Tree navigation buttons |
| 2 | `coupons/page.tsx` | 9 | Coupon action buttons |
| 3 | `enterprise/projects/[id]/page.tsx` | 8 | Form buttons w/o submit |
| 4 | `expenses/page.tsx` | 7 | Expense action buttons |
| 5 | `enterprise/wms/page.tsx` | 7 | WMS buttons |
| 6 | `enterprise/mrp/recipes/page.tsx` | 6 | Recipe management |
| 7 | `customers/page.tsx` | 6 | Customer actions |
| 8 | `branches/page.tsx` | 6 | Branch actions |
| 9 | `bookings/page.tsx` | 6 | Booking actions |
| 10 | `batches/page.tsx` | 6 | Batch actions |
| 11 | `ai-copilot/page.tsx` | 6 | AI copilot actions |
| 12 | `accounting/banks/page.tsx` | 6 | Bank reconciliation |
| 13 | `enterprise/projects/page.tsx` | 5 | Project form buttons |
| 14 | `enterprise/mrp/page.tsx` | 5 | MRP actions |
| 15 | `employees/page.tsx` | 5 | Employee actions |
| 16 | `clinic/lab/page.tsx` | 5 | Lab test buttons |
| 17 | `clinic/erx/page.tsx` | 5 | eRx prescription |
| 18 | `finance/assets/page.tsx` | 4 | Asset actions |
| 19 | `enterprise/legal/page.tsx` | 4 | Legal documents |
| 20 | `crm/opportunities/page.tsx` | 4 | Opportunity actions |

---

## مشاكل حرجة محددة

| الموقع | السطر | الزر | المشكلة |
|--------|------|------|---------|
| `finance/cfo-ai/page.tsx` | 111 | "تطبيق" (Apply) | لا onClick — توصية تسعير معطلة |
| `finance/cfo-ai/page.tsx` | 147 | "تفعيل التجميد الآلي" | لا handler |
| `ai/bank-fraud/page.tsx` | 154 | Submit | لا onClick |
| `com/rules/page.tsx` | 26 | إدارة قواعد | لا onClick |
| `finance/assets/page.tsx` | 73 | Print | لا onClick |
| `enterprise/wms/page.tsx` | 211, 254 | WMS actions | لا handlers |

---

## أنماط معروفة (للبحث/الإصلاح الآلي)

```regex
# Pattern 1: زر بدون onClick
<button(?![^>]*onClick)[^>]*>

# Pattern 2: handler فاضي
onClick={\(\) => \{\s*\}\}

# Pattern 3: console.log only
onClick={\(\) => console\.log
```

---

## APIs (سليمة بشكل عام)

### ✅ موجودة (180+ endpoint)
- `/api/admin/bi/query`
- `/api/approvals/inbox`
- `/api/v3/retail/pos`
- `/api/finance/cfo`
- `/api/sales/*`, `/api/purchases/*`, `/api/hr/*`, `/api/inventory/*`

### ❌ مفقودة (واحد فقط)
- `https://namainvist.com/api/ice/desktop-register` — يبدو endpoint خارجي للـ desktop app

---

## خطة الإصلاح

### المرحلة 1 (أولوية عاجلة — 2-3 أيام):
1. `accounting/page.tsx` — 18 زر (Account Tree)
2. `finance/cfo-ai/page.tsx` — 4 أزرار (توصيات تسعير + تجميد)
3. `ai-copilot/page.tsx` — 6 أزرار

### المرحلة 2 (أسبوع):
4. enterprise modules (projects, wms, mrp) — ~25 زر
5. clinic modules (lab, erx) — 10 أزرار
6. باقي الـ CRM modules

### المرحلة 3 (شهر):
7. تنظيف `coupons`, `bookings`, `batches`, etc.

---

## برومت جاهز للإصلاح

```
أصلح كل الأزرار المعطلة في DEAD_BUTTONS_REPORT.md. لكل ملف:

1. ابحث في الملف عن `<button` بدون `onClick`.
2. ابحث في الـ API folder المقابل عن endpoint منطقي للزر (مثلاً زر "حفظ" → POST endpoint).
3. لو وُجد API:
   - أضف onClick handler يستدعي fetch
   - أضف toast notification (success/error)
   - أضف disabled state أثناء loading
4. لو ما وُجد API:
   - افحص هل الزر له معنى (UI mock أم feature ناقص)؟
   - لو UI mock: احذف الزر أو أضف disabled + tooltip "قريباً"
   - لو feature ناقص: أنشئ stub API ثم اربط

ابدأ بـ accounting/page.tsx (18 زر) لأنه الأكبر تأثيراً.

استثناءات:
- لا تلمس v3 modules (قوالب جديدة - صفحات عرض)
- لا تلمس docs/, profile/ (informational)
```

---

## ملاحظات

✅ **APIs سليمة بنسبة 99%** — هذا يعني الـ backend شغّال، الفجوة في الـ UI wiring.

⚠️ **40+ صفحة** فيها أزرار معطلة، لكن معظمها **ثانوية** (أزرار "View", "Print", "Export" مش مربوطة).

🎯 **الأولوية:** اصلاحات الـ accounting و finance/cfo-ai أولاً — هذه مسارات مالية حرجة.
