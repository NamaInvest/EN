# توثيق محرك مقارنة عروض أسعار الموردين (RFQ & Vendor Comparison Engine)

تم إنجاز **المرحلة 29.2** (من وحدة المشتريات - Purchases) وهي المعنية بأتمتة قرارات الشراء (Procure-to-Pay) وتحقيق أعلى توفير ممكن (Cost Savings) عبر تقييم آلي لعروض الموردين.

## 🛠️ ما تم إنجازه تقنياً:

### 1. استقبال عروض الأسعار (Quote Submission)
توفر الدالة `submitQuote` بوابة خلفية لاستقبال عروض أسعار الموردين (Vendor Quotes) وربطها برقم طلب التسعير (RFQ). يتم تسجيل التكلفة ومدة التوريد (Lead Time) وفترة الصلاحية بشكل منظم.

### 2. محرك الترسية الذكي (Smart Awarding Engine)
تقوم دالة `compareAndAward` بمقارنة كافة العروض المقدمة لـ RFQ معين وفق ثلاث استراتيجيات يمكن لمدير المشتريات اختيارها:
- **`LOWEST_PRICE` (الأقل سعراً):** ترسية الطلب على المورد الأرخص بغض النظر عن وقت التوريد (مناسب للمشتريات الروتينية غير المستعجلة).
- **`BEST_LEAD_TIME` (الأسرع توريداً):** ترسية الطلب على المورد الذي يسلم البضاعة في أسرع وقت (مناسب للمواد الخام الحرجة لخطوط الإنتاج).
- **`BALANCED_MATRIX` (المصفوفة المتوازنة):** يقوم المحرك بحساب (Score) من 100، حيث يمنح السعر وزن 60٪ ووقت التوريد 40٪، مما يضمن اختيار عرض متوازن بين التكلفة والسرعة.

### 3. أتمتة الإغلاق (State Machine Automation)
فور اختيار المحرك للفائز (`isWinner: true`)، يتم فتح قاعدة البيانات في `prisma.$transaction` واحد ويقوم بالتالي:
- تحويل حالة الـ RFQ إلى `AWARDED`.
- تحويل حالة المورد الفائز إلى `AWARDED` لتجهيز فاتورة الشراء (PO).
- تحويل كافة عروض الموردين الخاسرين إلى `REJECTED`.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لإغلاق RFQ والمقارنة واختيار المورد الأفضل بناءً على المصفوفة المتوازنة:**
```typescript
import { RfqVendorComparisonEngine } from '@/lib/rfq-vendor-comparison-engine';

const results = await RfqVendorComparisonEngine.compareAndAward(
    1005, // RFQ ID
    'BALANCED_MATRIX', // استراتيجية المقارنة
    'tenant-1'
);

console.log(results);
/*
[
  {
    vendorName: 'Global Tech Supplies',
    totalScore: 95.5,
    isWinner: true,
    metrics: { priceScore: 100, leadTimeScore: 88.75 }
  },
  {
    vendorName: 'Fast Parts Logistics',
    totalScore: 82.3,
    isWinner: false, ...
  }
]
*/
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
