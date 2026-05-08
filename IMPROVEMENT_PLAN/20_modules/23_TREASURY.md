# 23 — Treasury & Banks | الخزينة والبنوك

## 🔴 الأولوية: حرج | الاكتمال: 25%

## 🔍 الموجود
- BankAccount, Cheque models
- Treasury basic operations

## 🔴 الفجوات (الأكبر في النظام!)
- **لا Bank Reconciliation تلقائي**
- لا Cash Flow Forecasting
- لا Cash Pooling (multi-account)
- لا LC (Letter of Credit) management كامل
- لا BG (Bank Guarantee) tracking
- لا Cheque lifecycle (issued → cleared → bounced → reissued)
- لا PDC (Post-Dated Cheques) management
- لا Multi-currency wallets
- لا Bank statement import (MT940، CSV، Camt)
- لا Auto-matching transactions

## 🎯 الخطة

### 23.1 — Bank Reconciliation Engine (10 أيام)
```typescript
export class BankReconciliationService {
  async importStatement(file: File): Promise<ImportedTransactions>;
  async autoMatch(transactions): Promise<MatchResult> {
    // 1. Exact match (amount + date + reference)
    // 2. Fuzzy match (amount ±0.01, date ±3d)
    // 3. ML-assisted (description pattern)
    // 4. Manual review queue
  }
  async createMatchingJE(matches): Promise<JournalEntry>;
}
```

### 23.2 — Cash Flow Forecast (8 أيام)
- 13-week rolling forecast
- AR collections forecast
- AP payments forecast
- Payroll, taxes, fixed expenses
- Scenario analysis (best/likely/worst)

### 23.3 — LC & BG Management (10 أيام)
- LC issuance, amendment, presentation
- LC cash margin tracking
- BG types (bid, performance, advance)
- Expiry alerts
- Documents library

### 23.4 — Cheque Management (6 أيام)
- Cheque book inventory
- Issued cheques tracking
- PDC schedule + auto-matching
- Bounced cheques workflow

### 23.5 — Bank Statement Import (5 أيام)
- MT940 parser
- CSV (per bank format: AlRajhi, SNB, Riyad)
- Camt.053 (ISO 20022)
- Auto-categorization

### 23.6 — Cash Pooling (6 أيام)
- Multi-account positions
- Sweep rules (auto-transfer to main)
- Notional pooling
- Inter-account FX

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Bank reconciliation time | يدوي/أسبوعي | يومي تلقائي |
| Cash forecast accuracy | غير مقاس | > 85% (4 weeks ahead) |
| LC tracking | manual | full lifecycle |
| Auto-match rate | 0% | > 80% |

## ⏱️ المدة: 45 يوم عمل
