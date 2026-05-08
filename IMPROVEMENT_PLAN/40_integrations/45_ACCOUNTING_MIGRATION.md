# 45 — Accounting Migration | الهجرة من الأنظمة الأخرى

## 🟠 الأولوية: عالي (للنمو)

## 🎯 الأنظمة المستهدفة (لجذب العملاء)
- **QuickBooks** (Online + Desktop)
- **Tally** (شائع في الخليج والهند)
- **Xero**
- **SAP** (للشركات الكبيرة)
- **Onyx Pro** (سعودي)
- **Al-Motamem** (سعودي)
- **Zoho Books**
- **Wafeq**
- **Daftra**

## 🎯 الخطة

### 45.1 — Migration Framework (5 أيام)
```typescript
export interface SourceSystemAdapter {
  connect(credentials): Promise<ConnectionResult>;
  exportChartOfAccounts(): Promise<Account[]>;
  exportCustomers(): Promise<Customer[]>;
  exportSuppliers(): Promise<Supplier[]>;
  exportProducts(): Promise<Product[]>;
  exportOpeningBalances(): Promise<Balance[]>;
  exportTransactions(fromDate, toDate): Promise<Transaction[]>;
  exportAttachments(): Promise<Attachment[]>;
}
```

### 45.2 — QuickBooks Adapter (8 أيام)
- OAuth2 connection
- IIF file import (desktop)
- API import (online)
- Field mapping wizard
- Test migration (sandbox)

### 45.3 — Tally Adapter (5 أيام)
- XML export reading
- Voucher mapping
- Multi-currency handling

### 45.4 — Xero / Zoho (5 أيام each)
- API integration
- Smart mapping
- Bulk import

### 45.5 — Mapping Wizard UI (8 أيام)
- Field-to-field mapping
- Preview migration
- Validation
- Test run
- Commit
- Rollback option

### 45.6 — Data Transformation Engine (5 أيام)
- Currency conversion
- Date format normalization
- Account hierarchy mapping
- Tax code mapping

### 45.7 — Verification Tools (4 أيام)
- Trial balance match
- Customer balance match
- Supplier balance match
- Inventory count match

### 45.8 — Migration Service Tier (5 أيام)
- White-glove migration
- Implementation team
- Project management
- SLAs

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Migration tools | لا | 5+ systems |
| Migration success rate | manual | > 95% auto |
| Avg migration time | weeks | days |
| Customer churn from migration | غير متابع | < 5% |

## ⏱️ المدة: 45 يوم عمل
