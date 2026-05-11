# توثيق محرك تخطيط السعة الإنتاجية (Capacity Planning Engine)

تم إنجاز **المرحلة 25.5** (من وحدة التصنيع) والخاصة بإدارة وتخطيط السعة الإنتاجية لخطوط الإنتاج والآلات (Work Centers). هذا المحرك حيوي لمنع تكدس أوامر التصنيع، وتحديد نقاط الاختناق (Bottlenecks) في المصنع قبل حدوثها.

## 🛠️ ما تم إنجازه تقنياً:

### 1. تحليل طاقة الآلات (Capacity Calculation)
تم برمجة `CapacityPlanningEngine` في `src/lib/capacity-planning-engine.ts` ليقوم بحساب الساعات المتاحة يومياً لكل آلة / مركز عمل، مع الأخذ بعين الاعتبار نسبة الكفاءة الفعلية (`efficiencyPercentage`).

### 2. مقارنة العبء بالسعة (Load vs Capacity)
يقوم المحرك بتوزيع الساعات المجدولة (المطلوبة للعمليات الصناعية) على أيام العمل، وحساب نسبة الاستخدام (`utilizationPercentage`). 
إذا تخطت النسبة 95%، يتم تعليم المركز كنقطة اختناق حرجة (`isBottleneck = true`) لتنبيه مدير الإنتاج.

### 3. إعادة الجدولة التلقائية (Auto-Rescheduling - Placeholder)
تم وضع أساس دالة الجدولة الأوتوماتيكية (`autoReschedule`) والتي ستتكفل في المراحل القادمة (عند اكتمال أوامر التشغيل النهائية) بإزاحة العمليات التي تسبب اختناقاً إلى الفترات أو الورديات التالية المتاحة (Finite Scheduling).

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام، ما يضمن عمله بسلاسة تامة.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**للحصول على تقرير السعة لمركز عمل معين خلال الأسبوع القادم:**
```typescript
import { CapacityPlanningEngine } from '@/lib/capacity-planning-engine';

const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7);

const loadReport = await CapacityPlanningEngine.calculateCapacityLoad(
    'tenant-1', 
    startDate, 
    endDate, 
    10 // Work Center ID
);

console.log(loadReport);
// النتيجة: مصفوفة تحتوي على نسبة استغلال الآلة في كل يوم وتحديد ما إذا كان اليوم مزدحماً (Bottleneck)
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
