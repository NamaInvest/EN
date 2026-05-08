# 29 — Purchases | المشتريات

## 🟠 الأولوية: عالي | الاكتمال: 50%

## 🔍 الموجود
- PurchaseRequisition, RFQ, PO, GRN
- Supplier model
- 3-way match جزئي

## 🔴 الفجوات
- لا P2P (Procure-to-Pay) flow كامل
- RFQ workflow ضعيف
- لا Vendor Comparison
- لا Contract Management
- لا Vendor Performance Scorecard
- Approval Workflow على PO ضعيف
- لا Catalog Management (preferred items)
- لا Spend Analysis
- Procurement KPIs غير متابعة

## 🎯 الخطة

### 29.1 — P2P Flow Complete (8 أيام)
```
PR (Purchase Requisition) → Approval
   ↓
RFQ → Vendor Quotes → Comparison → Award
   ↓
PO → Approval → Send to Vendor
   ↓
GRN (Goods Receipt) → Quality Check
   ↓
Invoice → 3-Way Match → Payment
```

### 29.2 — RFQ + Vendor Comparison (6 أيام)
- Bulk RFQ to multiple vendors
- Quote comparison matrix (price, lead time, quality)
- Award criteria (lowest price, best quality, mixed)
- Auto-PO generation

### 29.3 — Contract Management (8 أيام)
- Vendor contracts repository
- Validity tracking
- Auto-alerts before expiry
- Linked to POs (rates from contract)
- Renewal workflow

### 29.4 — Vendor Performance Scorecard (5 أيام)
- On-time delivery %
- Quality rejection rate
- Price variance
- Documentation accuracy
- Response time
- Composite score

### 29.5 — Catalog Management (4 أيام)
- Preferred vendors per item
- Standard pricing
- Punch-out catalogs (للموردين الرقميين)
- Auto-suggest in PR

### 29.6 — Approval Workflow متقدم (4 أيام)
- Multi-level (based on amount)
- Department-specific
- Delegation
- Escalation
- Recall

### 29.7 — Spend Analysis (5 أيام)
- By category, vendor, department
- Maverick spend identification
- Savings opportunities
- ABC analysis
- Trend over time

### 29.8 — Procurement KPIs Dashboard (3 أيام)
- PR-to-PO cycle time
- PO accuracy
- Savings achieved
- Vendor compliance

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| PR-to-PO cycle | غير مقاس | < 3 يوم |
| Vendor on-time delivery | غير متابع | > 90% |
| Maverick spend | غير معلوم | < 10% |
| 3-way match auto-rate | جزئي | > 80% |

## ⏱️ المدة: 43 يوم عمل
