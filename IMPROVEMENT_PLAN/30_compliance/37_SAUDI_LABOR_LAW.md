# 37 — Saudi Labor Law | نظام العمل السعودي

## 🔴 الأولوية: حرج

## 🔍 الموجود
- EOS calculator basic
- Vacation tracking

## 🔴 الفجوات
- Edge cases في EOS غير مغطّاة
- Probation period rules غير مطبّقة
- لا Maternity / Paternity / Hajj / Marriage leave
- لا Working hours compliance (48h/week)
- لا Overtime calculation (1.5x)
- لا Eid bonuses (per Cabinet decisions)
- لا Notice period enforcement
- لا End of Service for Limited vs Unlimited contracts
- Saudization rules غير مطبّقة في hiring

## 🎯 الخطة

### 37.1 — EOS Engine المتكامل (8 أيام)
```typescript
// Article 84-85 of Saudi Labor Law
export class EOSCalculator {
  calculate({
    contractType,    // 'limited' | 'unlimited'
    serviceYears,
    monthlySalary,   // basic + housing typically
    terminationReason, // 'resignation' | 'termination' | 'mutual' | 'death'
    serviceMonths,
  }): EOSResult {
    if (contractType === 'unlimited') {
      // First 5 years: half month per year
      // After 5 years: full month per year
      const firstFive = Math.min(serviceYears, 5);
      const afterFive = Math.max(0, serviceYears - 5);
      let eos = (firstFive * 0.5 + afterFive * 1) * monthlySalary;
      
      // Resignation reductions
      if (terminationReason === 'resignation') {
        if (serviceYears < 2) eos = 0;
        else if (serviceYears < 5) eos *= (1/3);
        else if (serviceYears < 10) eos *= (2/3);
      }
      return { amount: eos, ... };
    }
    // Limited contract: full payment if terminated by employer
    // ...
  }
}
```

### 37.2 — Probation Period (3 أيام)
- Max 90 days (extendable to 180)
- Termination during probation rules
- Easier termination process

### 37.3 — Leave Types (5 أيام)
| النوع | المدة | المرجع |
|------|------|-------|
| سنوية | 21-30 يوم | المادة 109 |
| مرضية (1st 30 days) | كامل الأجر | المادة 117 |
| مرضية (next 60 days) | 75% | المادة 117 |
| مرضية (last 30) | بدون أجر | المادة 117 |
| أمومة | 10 أسابيع | المادة 151 |
| حداد (وفاة زوج) | 4 أشهر و10 أيام | المادة 160 |
| حج | 10-15 يوم (مرة كل 5 سنوات) | المادة 114 |
| زواج | 5 أيام | المادة 113 |
| ولادة | 3 أيام (للأب) | المادة 113 |
| وفاة قريب | 5 أيام (الدرجة الأولى) | المادة 113 |

### 37.4 — Working Hours + Overtime (4 أيام)
- 48 hours/week (8h/day × 6d)
- Ramadan: 6 hours/day for Muslims
- Overtime: 1.5x basic salary
- Friday/Holiday: 1.5x or compensatory
- Max overtime regulation

### 37.5 — Notice Period (2 أيام)
- 30 days (monthly salary)
- 60 days (negotiated)
- Payment in lieu of notice

### 37.6 — Cabinet Decisions Engine (4 أيام)
- Eid bonuses (per Cabinet)
- Salary increases (mandated)
- Compliance reports

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| EOS calculation accuracy | basic | comprehensive |
| Leave compliance | manual | enforced |
| Overtime calculation | manual | تلقائي |
| Notice period tracking | لا | enforced |

## ⏱️ المدة: 26 يوم عمل
