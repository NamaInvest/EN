# 22 — AP | الذمم الدائنة

## 🔴 الأولوية: حرج | الاكتمال: 35%

## 🔍 الموجود
- Supplier model
- PurchaseInvoice
- بسيط

## 🔴 الفجوات
- **لا 3-Way Match مؤتمت** (PO + GRN + Invoice)
- لا Payment Runs (Batch payments)
- لا WHT (Withholding Tax) automation
- لا Vendor Aging
- لا Vendor Statements reconciliation
- لا Early Payment Discount tracking
- لا Vendor Performance Scorecard
- لا Vendor Portal
- لا Approval Workflow على المدفوعات
- لا PPV (Purchase Price Variance) analysis

## 🎯 الخطة

### 22.1 — 3-Way Match Engine (8 أيام)
```typescript
export class ThreeWayMatchService {
  async match({ poId, grnId, invoiceId }): Promise<MatchResult> {
    // 1. Quantity match (PO vs GRN vs Invoice)
    // 2. Price match (PO vs Invoice within tolerance)
    // 3. Item match (SKU consistency)
    // 4. Tax match
    // 5. Date validation
    return { status: 'matched|exception', exceptions: [...] };
  }
}
```

### 22.2 — Payment Runs (6 أيام)
- Batch payment selection (due, priority, discount)
- Approval workflow
- Bank file generation (SARIE, SWIFT)
- Cheque printing

### 22.3 — WHT Engine (5 أيام)
- Saudi WHT rates (5-20% per service type)
- Auto-deduction on payment
- WHT certificate generation
- ZATCA WHT filing

### 22.4 — Vendor Aging + Statements (4 أيام)

### 22.5 — Vendor Portal (8 أيام)
- View POs، invoices، payments
- Submit invoices
- Update bank info
- Document upload

### 22.6 — PPV Analysis (3 أيام)
- Variance reports
- Auto-allocate to inventory or COGS

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| 3-way match automation | يدوي | > 80% auto |
| WHT compliance | يدوي | تلقائي |
| Payment run time | غير محدد | < 30 min |
| Vendor disputes | غير متابع | tracked |

## ⏱️ المدة: 34 يوم عمل
