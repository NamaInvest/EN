# توثيق محركات حماية الأجور ومُدد (WPS & Mudad Engines)

تم إنجاز **المرحلة 32** لحماية المنشآت من إيقاف الخدمات من قبل وزارة الموارد البشرية (HRSD) بسبب التأخر أو الخطأ في تسليم مسيرات الرواتب لمنصة "مُدد" ونظام حماية الأجور (WPS).

## 🛠️ ما تم إنجازه تقنياً:

### 1. محرك التوليد الآلي للصيغ البنكية (WPS SIF Generator - Phase 32.1)
تم بناء `WpsSifGenerator` القادر على تحويل مسير الرواتب المعتمد (Payroll Batch) إلى ملف `SIF` (Salary Information File) بصيغ مختلفة حسب البنك المعتمد للمنشأة.
يدعم المحرك حالياً:
- بنك الراجحي (Rajhi V2)
- البنك الأهلي السعودي (SNB V3)
- مع إمكانية التوسع لبقية البنوك بتوسيع دالة `format...`.

### 2. محرك التوثيق (Validation Engine - Phase 32.3)
قبل إصدار الملف، يقوم النظام بالآتي:
- التحقق من طول وصحة رقم الآيبان (IBAN) ويبدأ بـ (SA).
- التحقق من رقم الهوية أو الإقامة لضمان مطابقته لمواصفات البنك.
- استبعاد أي موظف بمعلومات بنكية ناقصة لتجنب رفض الملف بالكامل (Rejection).

### 3. الربط المباشر مع مُدد (Mudad Integration - Phase 32.2)
يقوم محرك `MudadIntegrationEngine` بأتمتة الخطوة التي كانت تأخذ أياماً من الرفع اليدوي:
- رفع الملف المولد مباشرة إلى واجهة مُدد.
- تخزين رقم التتبع المرجعي (`MudadReferenceNumber`).
- الاستعلام الآلي عن حالة المعالجة (`checkSubmissionStatus`) لتحديث حالة الدفعة من `PENDING` إلى `ACCEPTED` تلقائياً.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لتوليد ملف البنك الراجحي وإرساله لمُدد تلقائياً:**
```typescript
import { WpsSifGenerator } from '@/lib/wps/wps-sif-generator';
import { MudadIntegrationEngine } from '@/lib/wps/mudad-integration-engine';

// 1. توليد الملف
const sifContent = await WpsSifGenerator.generateSif('tenant-1', 1050, 'RAJHI_V2');

// 2. الرفع المباشر
const mudadResult = await MudadIntegrationEngine.submitPayrollBatch('tenant-1', 1050, sifContent);

console.log(`تم الرفع برقم مرجعي: ${mudadResult.mudadReferenceNumber}`);
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
