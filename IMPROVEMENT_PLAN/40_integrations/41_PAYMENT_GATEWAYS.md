# 41 — Payment Gateways | بوابات الدفع

## 🔴 الأولوية: حرج

## 🎯 البوابات المستهدفة
| البوابة | الاستخدام |
|---------|----------|
| **HyperPay** | Mada, Visa, MC, Apple Pay |
| **Moyasar** | Mada, STC Pay, Apple Pay |
| **PayTabs** | عام |
| **Mada** | البطاقة المدفوعة |
| **STC Pay** | Wallet |
| **Tabby** | Buy Now Pay Later |
| **Tamara** | BNPL |
| **Apple Pay / Google Pay** | mobile |

## 🎯 الخطة

### 41.1 — Unified Payment Gateway Abstraction (5 أيام)
```typescript
export interface PaymentGateway {
  charge(amount, currency, customer, options): Promise<ChargeResult>;
  refund(chargeId, amount?): Promise<RefundResult>;
  authorize(amount): Promise<AuthorizationResult>;
  capture(authId, amount?): Promise<CaptureResult>;
  void(chargeId): Promise<void>;
  webhook(payload, signature): Promise<WebhookEvent>;
}

class HyperPayGateway implements PaymentGateway { ... }
class MoyasarGateway implements PaymentGateway { ... }
```

### 41.2 — HyperPay Integration (5 أيام)
- COPYandPAY widget
- Server-to-server API
- 3D Secure
- Tokenization (recurring)
- Webhooks

### 41.3 — Moyasar Integration (4 أيام)
- Mada cards
- STC Pay
- Recurring subscriptions
- Webhook verification

### 41.4 — Tabby/Tamara (BNPL) (6 أيام)
- Eligibility check
- Application flow
- Order tracking
- Refund handling
- Settlement reconciliation

### 41.5 — Apple Pay / Google Pay (4 أيام)
- Domain verification
- Merchant ID setup
- Web payments
- Mobile SDK

### 41.6 — Subscription Management (6 أيام)
- Recurring billing (saved cards)
- Failed payment retries
- Dunning emails
- Cancellation flow

### 41.7 — Reconciliation (4 أيام)
- Daily settlement file
- Match transactions to bank
- Identify chargebacks
- Auto-JE for fees

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Payment success rate | غير مقاس | > 95% |
| Chargeback rate | غير متابع | < 0.5% |
| Settlement delay | manual | T+1 auto |

## ⏱️ المدة: 34 يوم عمل
