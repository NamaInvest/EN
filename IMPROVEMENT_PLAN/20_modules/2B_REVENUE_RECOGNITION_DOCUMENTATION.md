# توثيق محرك الاعتراف بالإيرادات (Revenue Recognition Engine - IFRS 15)

تم إنجاز **المرحلة 2B.5** (من وحدة إدارة المشاريع - Projects) لتنظيم عملية إثبات إيرادات المشاريع طويلة الأجل وفقاً لمعيار IFRS 15 (الإيرادات من العقود مع العملاء).

## 🛠️ ما تم إنجازه تقنياً:

### 1. نسبة الإنجاز (Percentage of Completion - POC)
يستخدم المحرك طريقة "التكلفة إلى التكلفة" (Cost-to-Cost Method) لتقدير نسبة إنجاز المشروع بدقة:
`نسبة الإنجاز = (التكاليف الفعلية المتكبدة حتى تاريخه ÷ إجمالي التكاليف المقدرة للمشروع)`

### 2. إثبات الإيراد الدوري (Periodic Revenue Recognition)
تقوم الدالة `recognizeRevenue` بتحديد "الإيراد المتراكم" الذي يحق للشركة إثباته بناءً على نسبة الإنجاز. ثم تقوم بطرح "الإيرادات المثبتة سابقاً" للوصول إلى "إيراد الفترة الحالية" (Current Period Revenue).

### 3. القيود المحاسبية التلقائية (Journal Entries)
حتى لو لم تقم الشركة بإصدار فاتورة نهائية للعميل (Billed)، يقوم النظام بإثبات حق الشركة في الإيراد عبر القيد:
- مدين: أصول العقود (Contract Asset - Unbilled Receivables).
- دائن: إيرادات المشاريع (Project Revenue).
بذلك تظهر القوائم المالية بشكل دقيق وعادل وفقاً للجهد المبذول في المشروع بدلاً من انتظار الدفعة المالية.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لإغلاق حسابات مشروع نهاية الشهر وإثبات الإيراد:**
```typescript
import { ProjectRevenueRecognitionEngine } from '@/lib/project-revenue-recognition-engine';

const report = await ProjectRevenueRecognitionEngine.recognizeRevenue('tenant-1', 101);

console.log(report);
/*
{
  projectId: 101,
  percentageOfCompletion: 50.00, // أنجزنا 50%
  totalContractValue: 10000000.00, // قيمة العقد 10 مليون
  revenueRecognizedToDate: 5000000.00, // يحق لنا 5 مليون
  previouslyRecognizedRevenue: 3000000.00, // أثبتنا 3 مليون الشهر الماضي
  currentPeriodRevenue: 2000000.00 // إذن إيراد هذا الشهر هو 2 مليون
}
*/
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
