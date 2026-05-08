# 36 — SAMA Open Banking | البنك المركزي السعودي

## 🟡 الأولوية: متوسط (مستقبل قريب)

## 🔍 الفجوات (لا تكامل حالياً)
- لا account aggregation
- لا payment initiation
- لا transaction history
- لا balance checking

## 🎯 الخطة

### 36.1 — Open Banking Compliance (10 أيام)
- SAMA Open Banking framework
- mTLS authentication
- FAPI security profile
- Consent flow

### 36.2 — Account Information Service (AIS) (8 أيام)
```typescript
export class OpenBankingService {
  async listAccounts(consentId): Promise<Account[]>;
  async getBalance(accountId): Promise<Balance>;
  async getTransactions(accountId, fromDate, toDate): Promise<Transaction[]>;
}
```

### 36.3 — Payment Initiation Service (PIS) (10 أيام)
- Single immediate payment
- Bulk payments
- Scheduled payments
- Payment status

### 36.4 — Account Aggregation (6 أيام)
- Multiple banks in one view
- Cash position across banks
- Consolidated statements
- Reconciliation

### 36.5 — Use Cases (5 أيام)
- Auto bank reconciliation
- Cash flow forecasting (real-time)
- Fraud detection
- AP automation

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Connected banks | 0 | 5+ |
| Auto-recon | لا | يومي |
| Payment initiation | لا | متاح |

## ⏱️ المدة: 39 يوم عمل
