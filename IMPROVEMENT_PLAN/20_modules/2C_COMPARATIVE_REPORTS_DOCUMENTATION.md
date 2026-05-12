# توثيق محرك التقارير المالية المقارنة (Comparative Financial Report Engine)

تم إنجاز **المرحلة 2C.1** (من وحدة التقارير المالية - Financial Reporting) والتي تمثل أداة تحليلية قوية للإدارة العليا والمستثمرين، حيث تتيح مقارنة الأداء المالي بين الفترات المختلفة واكتشاف الاتجاهات (Trend Analysis).

## 🛠️ ما تم إنجازه تقنياً:

### 1. تقارير متعددة الفترات (Multi-Period Analysis)
تقوم الدالة `generateComparativeReport` بإنتاج تقارير الميزانية العمومية أو قائمة الدخل مع مقارنة فورية بين فترتين (مثل الربع الحالي مقارنة بالربع السابق، أو السنة الحالية مقارنة بالسنة السابقة).

### 2. حساب الفروقات المطلقة والنسبية (Variance Calculation)
لكل بند مالي (Line Item)، يقوم المحرك بحساب:
- **مقدار الانحراف (Variance Amount):** الزيادة أو النقص المالي بين الفترتين.
- **نسبة الانحراف (Variance Percentage):** معدل النمو أو التراجع (Growth/Decline Rate)، مما يسهل على المحللين الماليين اكتشاف التغيرات المفاجئة في النفقات أو الإيرادات.

### 3. دعم التقارير الأساسية
المحرك يدعم مقارنة:
- **الميزانية العمومية (BALANCE_SHEET):** لمقارنة نمو الأصول أو زيادة الالتزامات.
- **قائمة الدخل (INCOME_STATEMENT):** لمقارنة نمو المبيعات وارتفاع أو انخفاض المصروفات التشغيلية.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لجلب تقرير قائمة الدخل المقارنة للعامين 2025 و 2026:**
```typescript
import { ComparativeFinancialReportEngine } from '@/lib/comparative-financial-report-engine';

const report = await ComparativeFinancialReportEngine.generateComparativeReport(
    'tenant-1',
    'INCOME_STATEMENT',
    new Date('2026-01-01'), new Date('2026-12-31'), // السنة الحالية
    new Date('2025-01-01'), new Date('2025-12-31')  // السنة السابقة
);

console.table(report.lineItems, [
    'accountName', 
    'currentPeriodBalance', 
    'priorPeriodBalance', 
    'variancePercentage'
]);
/*
ستعرض الحسابات مع نسب النمو أو التراجع مقارنة بالعام الماضي.
*/
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
