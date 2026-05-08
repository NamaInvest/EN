# 31 — GOSI | التأمينات الاجتماعية

## 🔴 الأولوية: حرج

## 🔍 الموجود
- GOSIContribution model
- GOSI calculator (9% + 9% + 2%)
- محرك اختباري `gosi-engine.test.ts`

## 🔴 الفجوات
- لا GOSI API integration (manual upload فقط)
- لا employee onboarding مع GOSI
- لا salary changes notification
- لا occupation hazards (للأجانب 2%)
- لا SANED (نظام إعانات البطالة)
- لا GOSI ceiling (45,000 SAR maximum)
- لا exemptions handling
- Reconciliation شهري ضعيف

## 🎯 الخطة

### 31.1 — GOSI API Integration (8 أيام)
```typescript
// src/lib/gosi/api.ts
export class GOSIService {
  async registerEmployee(employee): Promise<GOSIRegistration>;
  async updateSalary(employeeId, newSalary, effectiveDate): Promise<void>;
  async deregisterEmployee(employeeId, reason): Promise<void>;
  async submitMonthlyContributions(month): Promise<SubmissionResult>;
  async getEmployeeStatus(nationalId): Promise<EmployeeStatus>;
  async syncEmployees(): Promise<SyncResult>;
}
```

### 31.2 — Onboarding Flow (4 أيام)
- New employee → auto-register GOSI
- Saudi vs Non-Saudi flow
- Iqama validation
- Effective date

### 31.3 — Saudi vs Non-Saudi Rates (3 أيام)
| النوع | الموظف | المنشأة | إجمالي |
|------|-------|---------|--------|
| سعودي | 9% | 9% + 2% SANED | 20% |
| غير سعودي | 0% | 2% (occupation hazards) | 2% |

### 31.4 — Salary Ceiling (2 أيام)
- Apply 45,000 SAR max
- Per component (basic + housing only typically)
- Track for compliance

### 31.5 — Monthly Reconciliation (5 أيام)
- ERP register vs GOSI portal
- Variance investigation
- Adjustment entries

### 31.6 — Year-End Settlement (3 أيام)
- Annual reconciliation
- Refunds / additional payments
- Certificates

### 31.7 — Reports (3 أيام)
- Monthly contribution register
- Per employee breakdown
- Year-over-year
- Audit trail

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| GOSI submission accuracy | manual | 100% auto |
| Reconciliation variance | غير متابع | < 0.5% |
| Late submissions | غير متابع | 0 |

## ⏱️ المدة: 28 يوم عمل
