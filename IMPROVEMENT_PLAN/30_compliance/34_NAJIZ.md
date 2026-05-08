# 34 — Najiz | المنصة القضائية

## 🟡 الأولوية: متوسط

## 🔍 الفجوات (لا تكامل حالياً)
- لا تحصيل قضائي
- لا متابعة قضايا
- لا تنفيذ أحكام
- لا توثيق عقود

## 🎯 الخطة

### 34.1 — Najiz API Integration (10 أيام)
```typescript
export class NajizService {
  async fileExecutionRequest(debtor): Promise<CaseId>;
  async getCaseStatus(caseId): Promise<CaseStatus>;
  async submitEvidence(caseId, docs): Promise<void>;
  async getJudgments(): Promise<Judgment[]>;
}
```

### 34.2 — Collection Workflow (6 أيام)
- إنذارات → مطالبات → قضائي
- Auto-escalation
- Documentation requirements

### 34.3 — Judgments Tracking (4 أيام)
- Outstanding judgments
- Settlement plans
- Compliance with court orders

### 34.4 — Contracts Notarization (5 أيام)
- Online notarization
- Document storage
- E-signatures legal validity

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Collection success rate | غير متابع | tracked |
| Time to judgment | غير متابع | < 90 يوم |

## ⏱️ المدة: 25 يوم عمل
