# توثيق محرك تقييم الأداء (Employee Performance Engine)

تم إنجاز **المرحلة 26.3** (من وحدة الموارد البشرية - HR) والمتعلقة بإدارة الأهداف، تقييمات الأداء الدورية (Appraisals)، وتحديد العلاوات والمكافآت بناءً على الإنتاجية الفعلية للموظف.

## 🛠️ ما تم إنجازه تقنياً:

### 1. دورة حياة التقييم (Appraisal Lifecycle)
تمت هندسة المحرك ليدعم مسار التقييم المعتمد عالمياً (360 Degree Feedback) بحالات واضحة:
- `DRAFT` (إعداد الأهداف).
- `SELF_EVALUATION` (التقييم الذاتي للموظف).
- `MANAGER_REVIEW` (تقييم المدير المباشر).
- `HR_CALIBRATION` (المعايرة من قبل الموارد البشرية لضمان العدالة).
- `COMPLETED` (اعتماد التقييم النهائي).

### 2. الأهداف الذكية والأوزان (Weighted SMART Goals)
عند بدء التقييم (`initiateAppraisal`)، يتحقق المحرك برمجياً من أن مجموع أوزان الأهداف (`weights`) للموظف يساوي בדיוק 100%. إذا كان أقل أو أكثر، يرفض النظام إنشاء دورة التقييم لضمان الدقة الرياضية في حساب التقييم النهائي.

### 3. حساب النتيجة النهائية آلياً (Automated Final Scoring)
تقوم دالة `finalizeAppraisal` بالدخول في عملية حسابية تمر عبر كافة درجات التقييم التي أدخلها المدير المباشر، وتضرب كل درجة في "وزن الهدف" للوصول للنتيجة النهائية العادلة (Weighted Average). كما يُتاح للموارد البشرية عمل (Calibration / تعديل يدوي) إذا لزم الأمر قبل الاعتماد.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لفتح دورة تقييم ربع سنوية جديدة لموظف:**
```typescript
import { EmployeePerformanceEngine } from '@/lib/employee-performance-engine';

await EmployeePerformanceEngine.initiateAppraisal({
    employeeId: 101,
    managerId: 45,
    cycleName: 'Q3 2026 Performance Review',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-09-30'),
    tenantId: 'tenant-1',
    goals: [
        { title: 'زيادة المبيعات', description: 'تحقيق مبيعات بقيمة مليون', weight: 60, dueDate: new Date('2026-09-30') },
        { title: 'التدريب', description: 'اجتياز دورة المبيعات المتقدمة', weight: 40, dueDate: new Date('2026-08-15') }
    ]
});
// هذا الإجراء سيفتح الدورة للموظف للبدء في التقييم الذاتي
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
