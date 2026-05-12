# توثيق محرك تكاليف المشاريع (Project Costing Engine)

تم إنجاز **المرحلة 2B.4** (من وحدة إدارة المشاريع - Projects) لمراقبة التكاليف المباشرة وغير المباشرة للمشاريع وإصدار إنذارات تجاوز الميزانية (Budget Overruns).

## 🛠️ ما تم إنجازه تقنياً:

### 1. تجميع تكاليف العمالة (Direct Labor Costs)
يقوم المحرك (من خلال دالة `calculateProjectCost`) بالدخول إلى الجداول الزمنية المعتمدة (Timesheets) الخاصة بموظفي المشروع، وحساب التكلفة عن طريق ضرب (ساعات العمل × أجر الموظف في الساعة).

### 2. تجميع تكاليف المواد (Material Costs)
يتم الربط التلقائي بوحدة المخازن (Inventory)، بحيث يتم جلب كافة "صرفيات المواد" (Material Issues) التي تم ربطها بمركز تكلفة المشروع، وتحسب بناءً على متوسط التكلفة (Average Cost) وقت الصرف.

### 3. تجميع تكاليف المعدات (Equipment Costs)
يتم استيراد سجلات استخدام المعدات (Equipment Logs) واحتساب التكلفة بناءً على معدل الاستهلاك أو التأجير بالساعة.

### 4. التقرير المالي الحي (Real-time Variance Report)
يتم جمع التكاليف الثلاثة ومقارنتها بالميزانية المعتمدة للمشروع (`allocatedBudget`)، ويتم إنتاج حقل `variance` و `isOverBudget` لاتخاذ القرارات الإدارية الاستباقية في واجهة النظام.

### 5. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لجلب الموقف المالي لمشروع في واجهة لوحة التحكم:**
```typescript
import { ProjectCostingEngine } from '@/lib/project-costing-engine';

const report = await ProjectCostingEngine.calculateProjectCost('tenant-1', 101);

console.log(report);
/*
{
  projectId: 101,
  projectName: 'Riyadh Metro Station A1',
  totalBudget: 5000000.00,
  actualLaborCost: 1200000.00,
  actualMaterialCost: 2500000.00,
  actualEquipmentCost: 400000.00,
  totalActualCost: 4100000.00,
  variance: 900000.00,
  isOverBudget: false
}
*/
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
