# توثيق محرك ربحية المشاريع والقيمة المكتسبة (Project Profitability & EVM Engine)

تم إنجاز **المرحلة 2B.6** (من وحدة إدارة المشاريع - Projects) لمراقبة الأداء المالي والزمني للمشاريع باستخدام نظام إدارة القيمة المكتسبة (Earned Value Management - EVM).

## 🛠️ ما تم إنجازه تقنياً:

### 1. تحليل الربحية الإجمالية (Gross Profit Analysis)
يقوم المحرك (من خلال دالة `calculateProfitability`) بحساب "إجمالي الربح" و"هامش الربح" عن طريق مقارنة "الإيرادات المثبتة" (Recognized Revenue) بـ "إجمالي التكاليف الفعلية" (Actual Costs). 

### 2. تحليل القيمة المكتسبة (EVM - Earned Value Management)
يعتبر EVM المعيار الذهبي العالمي في إدارة المشاريع الهندسية والإنشائية، وقد تم برمجته بشكل كامل لإنتاج المؤشرات التالية:
- **القيمة المخططة (Planned Value - PV):** التكلفة المعتمدة للعمل المجدول إنجازه حتى اليوم.
- **القيمة المكتسبة (Earned Value - EV):** قيمة العمل الذي تم إنجازه فعلياً على أرض الواقع.
- **التكلفة الفعلية (Actual Cost - AC):** النفقات الحقيقية التي تم دفعها.

### 3. مؤشرات الانحراف (Variances & Indices)
بناءً على معطيات EVM، يستنتج النظام ما يلي:
- **انحراف التكلفة (Cost Variance - CV):** (EV - AC). إذا كان موجباً، فالمشروع يوفر ميزانية (Under Budget).
- **انحراف الجدول الزمني (Schedule Variance - SV):** (EV - PV). إذا كان موجباً، فالمشروع متقدم على الجدول الزمني (Ahead of Schedule).
- **مؤشر أداء التكلفة (CPI) ومؤشر أداء الجدول الزمني (SPI):** مؤشرات دقيقة لقياس كفاءة مدير المشروع.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لجلب تقرير أداء المشروع لمدير المشاريع:**
```typescript
import { ProjectProfitabilityEngine } from '@/lib/project-profitability-engine';

const report = await ProjectProfitabilityEngine.calculateProfitability('tenant-1', 101);

console.log(`هامش الربح: ${report.profitMarginPercentage}%`);
console.log(`انحراف التكلفة: ${report.evmMetrics.costVariance} (موجب = توفير)`);
console.log(`مؤشر الجدول الزمني: ${report.evmMetrics.schedulePerformanceIndex} (أكبر من 1 = متقدم)`);
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
