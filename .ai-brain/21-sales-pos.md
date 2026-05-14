# 21 - المبيعات والـ POS (Sales & POS Deep Dive)

> Sales flow + POS scenarios + ZATCA + Returns + Loyalty

---

## 📦 دورة Quote-to-Cash الكاملة

```
1. Lead → CRM
   POST /api/crm/leads
   
2. Opportunity → CRM
   POST /api/crm/opportunities
   ↓ تحويل
   
3. Price Quote
   POST /api/price-quotes
   - حالة: DRAFT → SENT → ACCEPTED/REJECTED
   - صلاحية: حتى تاريخ معين
   ↓ تحويل بعد الموافقة
   
4. Sales Order
   POST /api/sales/orders
   - حالة: CONFIRMED
   - يحجز المخزون (نظرياً)
   ↓ تجهيز
   
5. Picking (تجميع البضاعة)
   POST /api/inventory/picking
   - يخفض المخزون (نظرياً)
   
6. Delivery Note
   POST /api/sales/delivery-notes
   - يُسلم البضاعة
   - يخفض ProductStock فعلياً
   
7. Sales Invoice
   POST /api/sales (invoice)
   ↓ تلقائي:
   - تخفيض المخزون (إذا لم يحدث في DN)
   - JE: Dr AR / Cr Revenue + VAT Out
   - JE: Dr COGS / Cr Inventory
   - توليد ZATCA QR + Hash + XML
   - إرسال لـ ZATCA
   
8. Payment Receipt
   POST /api/finance/payments
   ↓ تلقائي:
   - JE: Dr Cash / Cr AR
   - تحديث Customer.balance
   - تحديث Invoice.paidAmount + status
   - إذا الـ outstanding = 0 → status: PAID
   
9. إذا متأخر:
   → Dunning (3 مستويات إنذار)
   → Credit Hold
   → Legal Hold
```

---

## 🛒 نقطة البيع (POS Retail)

### دورة الجلسة:

```
1. الكاشير يفتح الجلسة
   POST /api/pos/session/open
   Body: { userId, branchId, openingCash }
   ↓
   PosSession created
   status: OPEN
   
2. خلال الجلسة:
   • مسح المنتج (بالباركود أو بحث)
   • إضافة للسلة (POSCart)
   • تعديل الكمية، الخصم، الضريبة
   • اختيار العميل (افتراضي: نقدي)
   • طريقة الدفع:
     - نقد
     - شبكة (mada/Visa/MC)
     - آجل (للعملاء المعتمدين فقط)
     - تقسيط (Tabby/Tamara)
     - مختلط (cash + card)
     - بطاقة هدية
     - نقاط ولاء
   
3. إصدار الفاتورة
   POST /api/pos (invoice)
   ↓
   - تسجيل البيع
   - JE تلقائي
   - QR ZATCA Phase 1 على الفاتورة
   - في الخلفية: إرسال Phase 2
   - طباعة (Thermal printer 80mm عادة)
   
4. إذا مرتجع:
   POST /api/pos/returns
   - مسح الفاتورة الأصل
   - اختيار البنود
   - تحديد سبب (Defective / Wrong Item / Customer Changed Mind)
   - استرداد:
     a. نقد
     b. نفس البطاقة
     c. رصيد متجر (Store Credit)
   - JE عكسي
   
5. عمليات إضافية:
   • سحب من الصندوق (Cash Withdrawal)
   • إيداع للصندوق (Cash Deposit)
   • تحويل للخزينة الرئيسية
   • مصاريف صغيرة (Petty Cash)
   
6. إغلاق الجلسة
   POST /api/pos/session/close
   Body: { sessionId, declaredCash }
   ↓
   النظام يحسب:
     Expected Cash = OpeningCash 
                   + Sales (نقد)
                   - Returns (نقد)
                   + Deposits
                   - Withdrawals
   
   Variance = DeclaredCash - ExpectedCash
   
   إذا |Variance| > tolerance (مثلاً 5 SAR):
     → سجل في AuditLog
     → ينبه المدير
     → يلزم تفسير
   
   ↓ ترحيل المحاسبة
   JE: Dr Cash / Cr POS Sessions
   
   status: CLOSED
```

### النموذج:
```prisma
PosSession {
    userId, branchId, openingCash
    expectedCash, declaredCash, variance
    openedAt, closedAt
    status: 'OPEN' | 'CLOSED'
    salesTotal, returnsTotal
}
```

---

## 🍽️ POS مطعم (Restaurant)

### المميزات الخاصة:
- **خريطة الطاولات (Floor Plan):** `RestaurantFloorPlan.tsx`
- **حالات الطاولة:** Available / Occupied / Cleaning / Reserved
- **KDS (Kitchen Display System):** عرض الطلبات للطباخ
- **Split bills:** قسمة الفاتورة بين أكثر من زبون
- **Tabs:** فتح حساب مفتوح للزبون
- **Modifiers:** بدون بصل، إضافة جبنة، إلخ

### دورة الطلب:
```
1. النادل يفتح طاولة:
   POST /api/restaurant/table/{tableId}/open
   - حالة: OCCUPIED
   - يفتح RestaurantSession
   
2. أخذ الطلب:
   POST /api/restaurant/table/{tableId}/order
   Body: { items: [{ productId, quantity, modifiers }] }
   - حالة الـ items: PLACED
   - تُعرض في KDS
   
3. المطبخ يعالج:
   PUT /api/restaurant/items/{itemId}/status
   - PLACED → COOKING → READY → SERVED
   
4. الزبون يطلب الفاتورة:
   GET /api/restaurant/table/{tableId}/bill
   - يعرض كل الـ items
   - يحسب الضريبة 15%
   - يطبع الـ Pre-bill
   
5. الدفع:
   POST /api/pos (invoice)
   - إصدار فاتورة ZATCA
   - تحويل الطاولة: OCCUPIED → CLEANING
   
6. التنظيف ثم:
   PUT /api/restaurant/table/{tableId}/clean
   - حالة: AVAILABLE
```

### الـ Endpoints:
- `/api/restaurant/table` — إدارة الطاولات
- `/api/pos/restaurant` — POS مطعم

---

## 🇸🇦 ZATCA Integration

### الـ Trigger:
عند `INSERT` في `SalesInvoice` → trigger في `auto-journal.ts` → `processZatcaInvoice()`

### التعامل:

**B2C (Simplified):**
- ينتج XML + Hash + Signature + QR
- يحفظ في DB مع `zatcaStatus = 'pending'`
- الـ cron `/api/cron/zatca-batch-submit` يرسلها (within 24h)
- على الـ Frontend: QR + Hash متاحان فوراً للطباعة

**B2B (Standard):**
- ينتج XML + Hash + Signature + QR
- يرسل فوراً للـ Clearance (synchronous)
- ينتظر استجابة ZATCA (~5 ثوانٍ)
- إذا CLEARED → يحفظ `clearanceUuid` + `cleared: true`
- إذا REJECTED → يحفظ السبب → ينبه المسؤول

### الفرق B2B vs B2C:
| المعيار | B2C (Simplified) | B2B (Standard) |
|---|---|---|
| **متى** | فاتورة < 1000 SAR، عميل لا VAT | عميل بـ VAT |
| **الإرسال** | Reporting (async, 24h) | Clearance (sync, before delivery) |
| **QR** | إلزامي | إلزامي |
| **التوقيع** | إلزامي | إلزامي + Certificate |
| **التعديل** | لا — Credit Note | لا — Credit Note |

---

## 🔁 المرتجعات (Returns Management)

### Sales Return:
```
1. العميل يطلب الإرجاع
2. POST /api/sales-returns
   Body: {
       originalInvoiceId,
       lines: [{ productId, quantity, reason }],
       restockingFee: optional,
       returnMethod: 'CASH' | 'CARD_REVERSE' | 'STORE_CREDIT'
   }
3. النظام:
   a. يتحقق أن البنود من الفاتورة الأصل
   b. يتحقق أن الكميات لا تتجاوز المباع
   c. يعكس المخزون (Increase ProductStock)
   d. JE:
      Dr  Sales Returns (4111)         100.00
      Dr  VAT Output (2310)             15.00
          Cr  AR or Cash                  115.00
      
      Dr  Inventory (1330)              60.00
          Cr  COGS (5110)                 60.00
   e. توليد Credit Note بـ ZATCA
   f. إرسال للـ ZATCA
   g. تحديث Customer.balance
```

### Credit Note (إشعار دائن):
- نوع خاص من ZATCA invoice
- مرتبط بالفاتورة الأصل (BillingReference)
- ICV متسلسل (لا يتوقف)

---

## 💎 برامج الولاء (Loyalty)

### النموذج:
```prisma
LoyaltyProgram {
    name, pointsPerSAR, tiers: Json
}
LoyaltyMember {
    customerId, programId
    pointsBalance, tier, totalEarned, totalRedeemed
}
LoyaltyTransaction {
    memberId, points (+/-), source: 'EARN' | 'REDEEM' | 'EXPIRE' | 'BONUS'
    invoiceId, expiresAt
}
```

### Tiers مثال:
```
Bronze:    0-999 points    → 1 point per 1 SAR
Silver:    1000-4999       → 1.5 point per 1 SAR
Gold:      5000-19999      → 2 point per 1 SAR
Platinum:  20000+          → 3 point per 1 SAR
```

### الكسب والاستبدال:
- **Earn:** عند الشراء، تلقائياً
- **Redeem:** عند POS، خصم بالنقاط (مثلاً 100 نقطة = 1 SAR)
- **Expiry:** افتراضياً 12 شهر من آخر activity

### المسارات:
- `/api/loyalty/[customerId]`
- `/loyalty` — UI

---

## 🎟️ القسائم والترويج (Coupons & Promotions)

### Coupon:
```prisma
Coupon {
    code: 'SAVE20'
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BOGO'
    value: 20  // 20%
    minPurchase: 100
    maxDiscount: 50
    usageLimit: 1000
    usedCount: 245
    validFrom, validUntil
    applicableProducts: Json?
}
```

### Promotion (تلقائية، بدون كود):
```prisma
Promotion {
    name: 'Eid Sale 2026'
    type: 'CATEGORY_DISCOUNT' | 'TIERED' | 'BUNDLE'
    rules: Json  // قواعد معقدة
    priority: number
    active: Boolean
}
```

### الـ Apply:
```typescript
function applyDiscounts(cart) {
    // 1. Promotions تلقائية (الأعلى أولوية)
    const promos = await getActivePromotions();
    for (const promo of promos) {
        if (matchesRules(cart, promo.rules)) {
            applyDiscount(cart, promo);
        }
    }
    
    // 2. Coupons (يدخلها المستخدم)
    if (couponCode) {
        const coupon = await getCoupon(couponCode);
        if (validateCoupon(coupon, cart)) {
            applyDiscount(cart, coupon);
        }
    }
    
    // 3. Loyalty points (اختياري)
    // ...
}
```

---

## 🎫 بطاقات الهدايا (Gift Cards)

### النموذج:
```prisma
GiftCard {
    code: 'GC-XXXX-XXXX'
    initialValue, currentBalance
    purchasedBy, purchasedAt
    recipient: { name, email, phone }
    status: 'ACTIVE' | 'USED' | 'EXPIRED'
    expiresAt
}
GiftCardTransaction {
    cardId, type: 'ISSUE' | 'REDEEM' | 'REFUND'
    amount, invoiceId
}
```

### الـ Flow:
```
1. الشراء:
   POST /api/gift-cards
   - عميل يشتري بطاقة بـ 500 SAR
   - JE: Dr Cash / Cr Gift Card Liability (2390)
   
2. الاستخدام:
   POST /api/pos with paymentMethod: 'GIFT_CARD'
   - خصم المبلغ من البطاقة
   - JE: Dr Gift Card Liability / Cr Revenue + VAT
```

---

## 💳 BNPL (Buy Now Pay Later)

### المزودون:
- **Tabby:** تقسيط 4 مرات بدون فوائد
- **Tamara:** تقسيط 3-12 مرة

### الـ Flow:
```
1. عند checkout، الزبون يختار Tabby/Tamara
2. POST /api/bnpl/tabby/create-session
3. النظام يرسل للـ Tabby API:
   { amount, customer, items, callback_url }
4. Tabby يرجع redirect URL
5. الزبون يكمل التقسيط على موقع Tabby
6. Tabby يرسل webhook بـ approved/rejected
7. عند approved:
   - إصدار الفاتورة
   - الـ Cash من Tabby (سيتم استلامها بعد 1-3 أيام)
   - JE: Dr Tabby Receivable (1215) / Cr Revenue + VAT
8. عند استلام المال من Tabby:
   - JE: Dr Bank / Cr Tabby Receivable
   - رسوم Tabby (3-7%):
     Dr Bank Fees (5710) / Cr Tabby Receivable
```

---

## 📊 التقارير الرئيسية

### Sales Analytics:
- **Daily Sales:** بـ ساعات، شركاء، طرق دفع
- **Top Products:** بالكمية والإيرادات
- **Top Customers:** بالقيمة
- **Sales by Region/Branch**
- **Sales Trends:** مقارنة شهرية/سنوية
- **Conversion Rate:** Quotes → Invoices

### Salesperson Performance:
- **عمولات** (Commissions)
- **Targets vs Actuals**
- **Customer Coverage**

### الـ Endpoints:
- `/api/sales/analytics`
- `/api/sales/history`
- `/api/sales/targets`
- `/api/sales/commissions`

---

## ✅ Sales Best Practices

1. ✅ كل sale يجب أن يولد JE تلقائياً
2. ✅ ZATCA QR قبل الطباعة
3. ✅ POS Session يجب أن تُغلق يومياً
4. ✅ المرتجعات مع reference للأصل
5. ✅ Cash variance يُسجل في Audit
6. ✅ Customer credit limit يُفحص قبل البيع الآجل
7. ✅ المخزون يُخفض في الـ DN أو الفاتورة (ليس كلاهما)
