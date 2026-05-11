# توثيق محرك هيكلة الرواتب (Salary Structure Engine)

تم إنجاز **المرحلة 27.4** (من وحدة الرواتب - Payroll) والخاصة ببناء الهيكل الدقيق لراتب الموظف (Multi-Component Salary) بما يتوافق مع أنظمة العمل وقوانين التأمينات الاجتماعية (GOSI).

## 🛠️ ما تم إنجازه تقنياً:

### 1. التقسيم المعياري للراتب (Standard Breakdowns)
تم دعم دالة `generateStandardSaudiStructure` لتقوم بتقسيم الراتب الإجمالي (Gross Salary) فورياً للموظف بناءً على المعايير الشائعة في السعودية:
- **60% أساسي (Basic Salary)**.
- **25% بدل سكن (Housing Allowance)**.
- **15% بدل نقل (Transportation Allowance)**.

### 2. التمييز بين البدلات الخاضعة للتأمينات
يحمل كل مكوّن مالي خصائص ضريبية (Flags) مثل `isSubjectToGosi` و `isTaxable`. 
على سبيل المثال:
- الراتب الأساسي وبدل السكن تخضع لاقتطاعات التأمينات (`isSubjectToGosi: true`).
- بدل النقل يُعفى من التأمينات (`isSubjectToGosi: false`).

### 3. حساب الأجر الخاضع للتأمينات بدقة (GOSI Applicable Salary)
تم توفير الدالة `calculateGosiApplicableSalary` والتي تقوم بجمع جميع المكونات التي تخضع للتأمينات فقط. هذا الرقم هو ما سيتم إرساله لمحرك (GOSI Engine) لحساب نسبة الـ 10% والـ 12% آلياً وبدون أخطاء.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لاسترجاع أو توليد الهيكل المالي لموظف تم تعيينه براتب 10,000 ريال:**
```typescript
import { SalaryStructureEngine } from '@/lib/salary-structure-engine';

const structure = SalaryStructureEngine.generateStandardSaudiStructure(201, 10000);
console.log(structure);
/*
النتيجة:
{
  employeeId: 201,
  grossSalary: 10000,
  components: [
    { type: 'BASIC', amount: 6000, isSubjectToGosi: true },
    { type: 'HOUSING', amount: 2500, isSubjectToGosi: true },
    { type: 'TRANSPORT', amount: 1500, isSubjectToGosi: false }
  ]
}
*/

const gosiSalary = SalaryStructureEngine.calculateGosiApplicableSalary(structure);
console.log(gosiSalary); // النتيجة 8500
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
