# 50 — Pricing & Billing | الاشتراكات والفوترة

## 🟠 الأولوية: عالي

## 🔍 الموجود
- Subscription model في DB
- بسيط

## 🔴 الفجوات
- لا plans tiered
- لا usage-based billing
- لا upgrade/downgrade flows
- لا free trial management
- لا coupon codes
- لا dunning للاشتراكات
- لا revenue recognition (للـ SaaS)
- لا invoicing للعملاء بالعربية

## 🎯 الخطة

### 50.1 — Plans Architecture (5 أيام)
```typescript
const PLANS = {
  starter: {
    price: { monthly: 99, yearly: 990 },        // SAR
    features: { invoices: 100, users: 2, branches: 1, ai_credits: 100 },
  },
  pro: {
    price: { monthly: 299, yearly: 2990 },
    features: { invoices: 1000, users: 10, branches: 3, ai_credits: 1000 },
  },
  enterprise: {
    price: 'custom',
    features: { unlimited: true },
  },
};
```

### 50.2 — Usage Metering (5 أيام)
- Track per-tenant: invoices, AI calls, storage, users
- Real-time meter
- Quota enforcement
- Overage pricing

### 50.3 — Subscription Lifecycle (8 أيام)
- Sign-up → Trial → Paid
- Upgrade (immediate)
- Downgrade (end of period)
- Pause / Resume
- Cancel (data retention rules)
- Re-activation

### 50.4 — Billing Engine (8 أيام)
- Monthly/Annual cycles
- Pro-rata calculations
- Invoice generation
- Tax (VAT 15%)
- Multi-currency (SAR, USD)
- Payment retry logic
- Dunning emails

### 50.5 — Coupons & Discounts (3 أيام)
- Percentage / Fixed amount
- Time-limited
- First-time only
- Affiliate codes

### 50.6 — Stripe / Payment Provider (5 أيام)
- Subscription billing
- Saved payment methods
- 3DS support
- Webhooks
- Self-service customer portal

### 50.7 — Revenue Recognition (5 أيام)
- ASC 606 / IFRS 15 compliance
- Deferred revenue
- Monthly recognition
- Reports

### 50.8 — Customer Billing Portal (5 أيام)
- View invoices
- Update payment method
- Download receipts
- Change plan
- Cancel

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| MRR (Monthly Recurring Revenue) | غير محسوب | tracked |
| Churn rate | غير متابع | < 5% |
| LTV/CAC ratio | غير محسوب | > 3 |
| Trial-to-paid conversion | غير متابع | > 25% |

## ⏱️ المدة: 44 يوم عمل
