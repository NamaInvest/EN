# 2A — Fixed Assets | الأصول الثابتة

## 🔴 الأولوية: حرج | الاكتمال: 18% (الأقل!)

## 🔍 الموجود
- Asset, FixedAsset models
- AssetDepreciationLog
- AssetTransferRecord
- AssetImpairmentRecord
- بنية أساسية فقط

## 🔴 الفجوات (الأكبر في النظام)
- Depreciation methods محدودة
- لا Component depreciation (IFRS)
- لا Capitalization workflow
- Disposal workflow ضعيف
- لا Transfer between locations workflow
- Impairment ضعيف (IFRS 36)
- لا Insurance tracking
- لا Maintenance scheduling
- لا Asset Register reports كاملة
- لا Barcode/QR على الأصول
- لا Physical verification (annual)
- لا Lease accounting (IFRS 16)
- لا Revaluation (IFRS)

## 🎯 الخطة

### 2A.1 — Depreciation Methods (✅ مكتمل)
Methods supported:
- Straight-line
- Declining balance (DDB, 150%)
- Units of production (implemented stub, requires integration with `AssetUsageLog`)
- Component-based (IFRS — different parts depreciate differently)
- Tax depreciation (different from book)

### 2A.2 — Capitalization Workflow (✅ مكتمل)
```
Capital Expenditure (PR/PO)
   ↓
Receive + Setup
   ↓
Capitalization (in service)
   ↓
Depreciation begins
```

### 2A.3 — Asset Lifecycle Management (8 أيام)
- Acquisition
- In-service date
- Transfer (location, department, custodian)
- Disposal (sale, scrap, donation)
- Write-off
- Reactivation

### 2A.4 — Impairment Testing (IFRS 36) (6 أيام)
- Triggering events identification
- Recoverable amount calculation
- Impairment loss recognition
- Reversal (where allowed)

### 2A.5 — Lease Accounting (IFRS 16) (10 أيام)
- Right-of-Use Asset
- Lease Liability
- Lease term, discount rate
- Modifications, terminations
- ROU depreciation
- Interest on liability

### 2A.6 — Maintenance + Insurance (5 أيام)
- Scheduled maintenance
- Maintenance costs tracking
- Insurance policies linked
- Renewal alerts
- Claims tracking

### 2A.7 — Physical Verification (4 أيام)
- Barcode/QR labels printing
- Mobile app for verification
- Variance reports
- Reconciliation

### 2A.8 — Asset Register Reports (3 أيام)
- Movement schedule
- Depreciation schedule
- Net book value report
- Disposal report
- By category, location, custodian

### 2A.9 — Revaluation Model (IFRS) (4 أيام)
- Periodic revaluation
- Revaluation surplus/deficit
- Subsequent depreciation on revalued amount

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Asset register completeness | غير مقاس | > 99% |
| Physical verification coverage | لا | annual |
| Depreciation accuracy | يدوي | تلقائي |
| IFRS 16 compliance | لا | كامل |

## ⏱️ المدة: 51 يوم عمل
