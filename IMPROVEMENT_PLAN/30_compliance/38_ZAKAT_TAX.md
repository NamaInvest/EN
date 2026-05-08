# 38 — Zakat & Tax | الزكاة والضرائب

## 🔴 الأولوية: حرج

## 🔍 الموجود
- VAT 15% basic
- WHT جزئي

## 🔴 الفجوات
- VAT Returns مؤتمتة غير موجودة
- لا VAT Reconciliation Engine
- Zakat calculation منفصل (للسعوديين)
- WHT certificates manual
- لا CIT (Corporate Income Tax) للشركات الأجنبية
- لا Transfer Pricing documentation
- لا Excise Tax (للسلع المختارة)
- لا Real Estate Transaction Tax (RETT)

## 🎯 الخطة

### 38.1 — VAT Returns Automation (8 أيام)
```typescript
export class VATReturnService {
  async generateMonthly(month): Promise<VATReturn> {
    // Standard VAT (15%): sales + purchases
    // Zero-rated: exports
    // Exempt: financial services, real estate
    // Adjustments: bad debts, returns
  }
  
  async submitToZATCA(return_): Promise<SubmissionResult>;
  async paySettlement(amount): Promise<PaymentResult>;
}
```

### 38.2 — VAT Reconciliation (5 أيام)
- VAT in invoices vs GL VAT account
- Input VAT vs Output VAT
- Adjustments (bad debts, returns, mixed)

### 38.3 — Zakat Calculation (10 أيام)
For Saudi/GCC entities:
- 2.5% of Zakat base
- Zakat base = (Equity + Long-term liabilities + Adjustments) - (Fixed assets + Long-term investments)
- For 354/355 day Hijri year
- Adjustments per ZATCA Zakat manual
- Auto-generation of Zakat form

### 38.4 — WHT Engine (6 أيام)
```typescript
const WHT_RATES = {
  // For non-resident
  rent: 5,
  royalty: 15,
  technical_services: 5,
  management_fees: 20,
  dividends: 5,
  interest: 5,
  insurance: 5,
  international_telecoms: 5,
};

export class WHTService {
  async deductOnPayment(payment): Promise<{ wht: Decimal, net: Decimal }>;
  async generateCertificate(deduction): Promise<PDF>;
  async fileMonthly(month): Promise<WHTFiling>;
}
```

### 38.5 — Corporate Income Tax (CIT) (8 أيام)
For non-Saudi entities:
- 20% on net profit
- Deductible expenses rules
- Loss carry-forward (5 years)
- Quarterly advance payments
- Annual return

### 38.6 — Transfer Pricing (6 أيام)
- Related party transactions
- Arm's length principle
- Master file + Local file (per OECD)
- Country-by-country reporting (large MNEs)

### 38.7 — Excise Tax (4 أيام)
- 50% on sweetened drinks
- 100% on tobacco, energy drinks
- Auto-calculation on invoice

### 38.8 — RETT (Real Estate Transaction Tax) (3 أيام)
- 5% on real estate transactions
- Exemptions
- Filing within 30 days

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| VAT return accuracy | manual | auto + reconciled |
| Zakat compliance | manual | auto |
| WHT certificates | manual | auto-generated |
| Tax filing time | days | hours |

## ⏱️ المدة: 50 يوم عمل
