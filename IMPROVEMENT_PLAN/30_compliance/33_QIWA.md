# 33 — Qiwa | منصة قوى

## 🟠 الأولوية: عالي

## 🔍 الموجود
- لا تكامل

## 🔴 الفجوات
- لا API integration
- لا visa quota tracking
- لا contract management
- لا employee mobility (نقل الكفالة)
- لا Nitaqat (السعودة) integration
- لا occupation classification
- لا professional licenses

## 🎯 الخطة

### 33.1 — Qiwa API Integration (10 أيام)
```typescript
// src/lib/qiwa/api.ts
export class QiwaService {
  async getEstablishmentInfo(): Promise<Establishment>;
  async getEmployees(): Promise<QiwaEmployee[]>;
  async getNitaqat(): Promise<NitaqatStatus>;
  async getVisaQuota(): Promise<VisaQuota>;
  async submitContract(contract): Promise<ContractResult>;
  async transferEmployee(employeeId, newEmployer): Promise<void>;
  async terminateContract(contractId, reason): Promise<void>;
}
```

### 33.2 — Visa Quota Management (5 أيام)
- Available quota by occupation
- Used vs available
- Renewal tracking
- Quota requests

### 33.3 — Contract Management (8 أيام)
- Contract types (limited, unlimited)
- Bilingual contracts (Arabic + English)
- Salary, allowances, benefits
- E-signature integration
- Auto-sync to Qiwa

### 33.4 — Employee Mobility (5 أيام)
- Transfer kafalah requests
- Track status
- Documentation
- Final settlement

### 33.5 — Nitaqat Tracking (4 أيام)
- Real-time Saudization %
- Color zones (Platinum, Green, Yellow, Red)
- Improvement suggestions
- Hiring constraints

### 33.6 — Occupations + Licenses (4 أيام)
- ISCO 8 occupations classification
- Professional licenses tracking
- Renewal alerts

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Qiwa sync frequency | manual | real-time |
| Contract upload time | manual | تلقائي |
| Nitaqat color | غير متابع | tracked |
| Visa quota utilization | غير متابع | tracked |

## ⏱️ المدة: 36 يوم عمل
