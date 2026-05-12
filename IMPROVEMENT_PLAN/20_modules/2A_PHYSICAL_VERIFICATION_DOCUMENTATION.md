# توثيق محرك الجرد المادي للأصول الثابتة (Asset Physical Verification Engine)

تم إنجاز **المرحلة 2A.7** (من وحدة الأصول الثابتة - Fixed Assets) لأتمتة عملية الجرد السنوي للأصول (Physical Audit) والتخلص من الجرد الورقي المعرض للأخطاء والتلاعب.

## 🛠️ ما تم إنجازه تقنياً:

### 1. إطلاق حملات الجرد (Verification Campaigns)
يقوم المحرك (من خلال دالة `startVerificationCampaign`) بإنشاء "حملة جرد" مخصصة لموقع معين (مثلاً: مقر الإدارة الرئيسية)، ويقوم بإنشاء سجلات (Records) بحالة `PENDING` لجميع الأصول المتوقع وجودها في هذا الموقع.

### 2. معالجة المسح الضوئي (Barcode/QR Processing)
من خلال دالة `processScan` (والتي صممت ليتم استدعاؤها عبر واجهة تطبيقات الجوال Mobile App API):
- يتم مسح الباركود، ويقارن المحرك "الموقع الفعلي الذي تم المسح فيه" مع "الموقع الدفتري المتوقع".
- إذا تطابق الموقع وكانت الحالة سليمة، يتم تحديث الأصل لحالة `VERIFIED`.
- إذا اختلف الموقع، يتم تصنيف الأصل كـ `MISPLACED` (في غير مكانه).
- يمكن أيضاً تحديد حالة الأصل كـ `DAMAGED` أثناء المسح إذا وجد تالفاً.

### 3. تقرير الفروقات الآلي (Variance Report)
عند إغلاق الحملة عبر `closeCampaignAndGenerateReport`، يقوم المحرك برصد جميع الأصول التي لم يتم مسحها وتحويلها إلى حالة `MISSING` (مفقودة)، ويُصدر تقرير الفروقات (Variance Report) للإدارة لاتخاذ الإجراءات المالية المناسبة (مثل شطب الأصل أو تحميل الموظف التكلفة).

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لإطلاق حملة وإغلاقها وطباعة الفروقات:**
```typescript
import { AssetPhysicalVerificationEngine } from '@/lib/asset-physical-verification-engine';

// 1. بدء الحملة
const campaignId = await AssetPhysicalVerificationEngine.startVerificationCampaign('tenant-1', 10);

// 2. محاكاة المسح من الجوال (يتم استدعاء هذا الـ API مئات المرات أثناء الجرد)
await AssetPhysicalVerificationEngine.processScan(campaignId, {
    assetId: 505,
    scannedBarcode: 'ASSET-505',
    scannedLocationId: 12, // الأصل مكانه المفترض 10 ولكنه وجد في 12
    conditionStatus: 'GOOD',
    scannedBy: 99,
    scanDate: new Date(),
    tenantId: 'tenant-1'
});

// 3. إغلاق الحملة واستخراج التقرير
const report = await AssetPhysicalVerificationEngine.closeCampaignAndGenerateReport(campaignId);
console.log(report);
/*
  سيطبع الأصول المفقودة والموجودة في غير مكانها والتالفة.
*/
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
