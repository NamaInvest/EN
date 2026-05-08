# 21 — AR | الذمم المدينة

## 🔴 الأولوية: حرج | الاكتمال: 35%

## 🔍 الموجود
- Customer model
- SalesInvoice + payment tracking
- بسيط

## 🔴 الفجوات
- **لا Credit Limit enforcement حقيقي**
- لا Aging Reports متقدمة (30/60/90/120+)
- لا Dunning Process مؤتمت (إنذارات تلقائية)
- لا Customer Statements مولّدة تلقائياً
- لا Bad Debt Provision (IFRS 9)
- لا Customer Credit Score
- لا Collection Workflow
- لا Disputes & Adjustments management
- لا Customer Portal (للعميل يرى فواتيره)
- لا Auto-application of payments

## 🎯 الخطة

### 21.1 — Credit Management (6 أيام)
```typescript
export class CreditManagementService {
  async checkCreditLimit(customerId, amount): Promise<CreditDecision>;
  async calculateCreditScore(customerId): Promise<number>; // 300-850
  async holdOrderIfOverLimit(order): Promise<HoldDecision>;
}
```

### 21.2 — Aging & Dunning (8 أيام)
- Aging buckets (0-30, 31-60, 61-90, 91-120, 120+)
- Dunning levels (gentle reminder, firm, demand, legal)
- Auto-email + WhatsApp + SMS
- Escalation rules

### 21.3 — Customer Statements (4 أيام)
- Monthly auto-generation
- PDF + email
- Multi-language

### 21.4 — Bad Debt Provision IFRS 9 (5 أيام)
- ECL (Expected Credit Loss) model
- Stage 1, 2, 3 classification
- Auto-provision JE

### 21.5 — Customer Portal (10 أيام)
- View invoices, statements, payments
- Pay online (HyperPay/Mada)
- Dispute submission
- Document download

### 21.6 — Auto Cash Application (5 أيام)
- Match incoming payments to invoices
- Multiple invoices per payment
- ML-assisted matching

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Aging accuracy | يدوي | تلقائي |
| Dunning automation | لا | تلقائي |
| DSO (Days Sales Outstanding) | غير مقاس | tracked |
| Customer portal adoption | 0% | > 60% |

## ⏱️ المدة: 38 يوم عمل
