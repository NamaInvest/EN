# توثيق محركات هيئة الزكاة والضريبة والجمارك - المرحلة الثانية (ZATCA Phase 2 Engines)

تم إنجاز **المرحلة 30** من خريطة التطوير (Phase 30.1, 30.2, 30.7) للالتزام التام بمتطلبات الفوترة الإلكترونية (المرحلة الثانية - الربط والتكامل).

## 🛠️ ما تم إنجازه تقنياً:

### 1. تحصين سلسلة القيم (ICV & PIH Hardening - Phase 30.1)
تم بناء محرك `ZatcaCounterService` لضمان تسلسل تشفيري صارم:
- **ICV (Invoice Counter Value):** تم استخدام تقنية `Serializable isolation` بقاعدة البيانات لمنع التكرار (Race conditions) في أوقات الذروة، ما يضمن تسلسلاً بدون ثغرات (Gapless).
- **PIH (Previous Invoice Hash):** يقوم المحرك باستدعاء الهاش (Hash) الخاص بآخر فاتورة معتمدة وربطه بالفاتورة الجديدة، مكوناً سلسلة كتل (Blockchain-like) لا يمكن العبث بها.

### 2. محرك التشفير وإنشاء QR (QR TLV Engine - Phase 30.7)
تم بناء محرك `ZatcaQrEngine` لإنشاء كود الـ QR المعقد الخاص بالمرحلة الثانية، والذي لا يدعم النصوص العادية، بل يجب أن يكون بصيغة TLV (Tag-Length-Value) ومشفر بـ Base64، متضمناً:
- اسم البائع، الرقم الضريبي، الوقت، إجمالي الفاتورة، وقيمة الضريبة.
- **إضافات المرحلة الثانية:** الهاش (Hash) للفاتورة، والتوقيع الرقمي (ECDSA Signature)، والمفتاح العام (Public Key).

### 3. أتمتة الربط والتهيئة (Onboarding Engine - Phase 30.2)
يقوم `ZatcaOnboardingEngine` بتسيير عملية التهيئة التلقائية عبر 3 خطوات:
1. توليد مفاتيح التشفير (ECDSA 256-bit) وملف الـ CSR (Certificate Signing Request).
2. إرسال CSR مع كود الـ OTP إلى بوابة "فاتورة" لاستخراج رخصة الامتثال (Compliance CSID).
3. استخراج رخصة الإنتاج (Production CSID) لحقنها لاحقاً في التوقيع الرقمي للفواتير.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لجلب كود الـ QR الخاص بالفاتورة وطباعته:**
```typescript
import { ZatcaQrEngine } from '@/lib/zatca/zatca-qr-engine';

const qrBase64 = ZatcaQrEngine.generateBase64Qr({
    sellerName: 'Nama Invest',
    vatRegistrationNumber: '310122393500003',
    timestamp: '2026-05-12T03:15:25Z',
    invoiceTotal: 1150.00,
    vatTotal: 150.00,
    invoiceHash: 'NjBkOWJiOGVl...',
    ecdsaSignature: 'MEQCIDl...',
    publicKey: 'MFkwEwYHKo...'
});

console.log(`QR Code Base64: ${qrBase64}`);
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
