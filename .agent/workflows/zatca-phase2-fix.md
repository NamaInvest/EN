---
description: Complete ZATCA Phase 2 integration from scratch - CSR generation, onboarding, and QR code setup
---

# ربط زاتكا المرحلة الثانية - من الألف إلى الياء
# ZATCA Phase 2 Complete Integration Guide

هذا الدليل يشرح كل خطوات ربط نظامك مع هيئة الزكاة والضريبة والجمارك (ZATCA) للفوترة الإلكترونية المرحلة الثانية.

---

## المتطلبات الأساسية

1. **Node.js** + **Next.js** project مع **Prisma** (أو أي ORM)
2. **OpenSSL** مثبت على السيرفر
3. **npm package**: `zatca-xml-js` + `qrcode`
4. جدول `Setting` في قاعدة البيانات لحفظ الإعدادات
5. بيانات الشركة: الاسم، الرقم الضريبي (15 رقم)، السجل التجاري، العنوان

---

## الملفات المطلوبة

| الملف | الوظيفة |
|-------|---------|
| `src/lib/zatca.ts` | مكتبة TLV + XML + التوقيع + توليد QR |
| `src/lib/zatca-fatoora.ts` | الاتصال بـ ZATCA APIs (Compliance, Production, Reporting) |
| `src/scripts/zatca-sign-invoice.js` | سكربت فرعي لتوقيع الفواتير باستخدام zatca-xml-js SDK |
| `src/app/api/settings/generate-keys/route.ts` | توليد Private Key + CSR |
| `src/app/api/zatca/route.ts` | API الربط: Compliance CSID → فحص → Production CSID |
| `src/app/api/zatca/qr/route.ts` | توليد QR Code للفاتورة (Phase 1 أو Phase 2) |
| `src/app/api/sales/route.ts` | إنشاء الفاتورة + QR تلقائي |

---

## الخطوات بالتفصيل

### الخطوة 1: إعداد بيانات الشركة (صفحة الإعدادات)

يحتاج النظام هذه الإعدادات محفوظة في جدول `Setting`:

```
company_name       = اسم الشركة بالعربي (مثال: نما انفست)
company_name_en    = اسم الشركة بالإنجليزي (مثال: Nama Invest)
tax_number         = الرقم الضريبي 15 رقم (مثال: 314122115700003)
zatca_crn           = رقم السجل التجاري
zatca_street        = اسم الشارع
zatca_building      = رقم المبنى
zatca_district      = الحي
zatca_city           = المدينة
zatca_city_en        = المدينة بالإنجليزي (مهم!) 
zatca_postal_code   = الرمز البريدي
zatca_industry       = نوع النشاط
zatca_environment   = simulation أو production
```

### الخطوة 2: توليد المفتاح الخاص + CSR

**API:** `POST /api/settings/generate-keys`

هذا يعمل تلقائياً:
1. يولد **ECDSA Private Key** على منحنى `secp256k1` (متطلب زاتكا)
2. يبني **OpenSSL config** بالـ OIDs المطلوبة من زاتكا:
   - `1.3.6.1.4.1.311.20.2` = `ZATCA-Code-Signing`
   - `SN` = Serial Number (format: `1-NamaSoft|2-1.0|3-UUID`)
   - `UID` = VAT Number
   - `title` = `0100` (invoice type)
3. يولد **PKCS#10 CSR** باستخدام OpenSSL
4. يحفظ في قاعدة البيانات:
   - `zatca_private_key` = base64 body بدون PEM headers
   - `zatca_certificate` = CSR كامل بالـ PEM headers

> ⚠️ **مهم:** كل القيم في الـ CSR لازم تكون **إنجليزي** (ASCII فقط). الكود يترجم العربي تلقائياً.

### الخطوة 3: الحصول على Compliance CSID

**API:** `POST /api/zatca` مع `action: 'compliance-csid'`

**المتطلبات:**
- `otp`: كود OTP من بوابة فاتورة (https://fatoora.zatca.gov.sa)
- `csrBase64`: الـ CSR (يُرسل كـ `base64(PEM text)` للـ ZATCA API)

**العملية:**
1. فتح بوابة فاتورة → Onboard New Solution → استخراج OTP
2. إرسال CSR + OTP لـ ZATCA Compliance API
3. ZATCA ترجع: `binarySecurityToken` + `secret` + `requestID`
4. يُحفظ في:
   - `zatca_compliance_token` = binarySecurityToken (⚠️ هذا base64 مزدوج)
   - `zatca_compliance_secret` = secret
   - `zatca_compliance_request_id` = requestID

### الخطوة 4: فحص المطابقة (Compliance Check)

**API:** `POST /api/zatca` مع `action: 'compliance-invoice'`

يرسل **3 فواتير اختبار** مطلوبة من زاتكا:
1. ✅ فاتورة مبسطة (كود 388)
2. ✅ إشعار دائن (كود 381)
3. ✅ إشعار مدين (كود 383)

**العملية لكل فاتورة:**
1. بناء بيانات الفاتورة (EGS info + line items)
2. تشغيل `zatca-sign-invoice.js` subprocess:
   - ⚠️ **الشهادة:** `Buffer.from(compliance_token, 'base64').toString()` ← فك base64 مزدوج
   - يوقع الفاتورة ويرجع: `signed_invoice_string` + `invoice_hash` + `qr`
3. إرسال الفاتورة الموقعة لـ ZATCA Compliance Invoice API
4. ZATCA تفحص وترجع: `PASS` / `WARNING` / `ERROR`

> ⚠️ **أهم خطأ شائع:** الشهادة من ZATCA (`binarySecurityToken`) تكون `base64(PEM_body)`. لازم تفك base64 أول قبل لفها بـ PEM headers.

### الخطوة 5: الحصول على Production CSID

**API:** `POST /api/zatca` مع `action: 'production-csid'`

**بعد نجاح فحص المطابقة:**
1. إرسال `compliance_request_id` لـ ZATCA Production CSID API
2. ZATCA ترجع: `binarySecurityToken` (شهادة إنتاجية) + `secret` جديد
3. يُحفظ في:
   - `zatca_production_token` = binarySecurityToken الإنتاجي
   - `zatca_production_secret` = secret الإنتاجي

**بعد هذه الخطوة:** كل فاتورة جديدة تطلع تلقائياً بـ QR Code المرحلة الثانية! 🎉

### الخطوة 6: توليد QR Code المرحلة الثانية (تلقائي)

**API:** `POST /api/zatca/qr` مع `invoiceId`

**كيف يشتغل:**
1. يتحقق من وجود: `zatca_production_token` + `zatca_private_key` + `tax_number`
2. إذا موجودة (Phase 2):
   - ⚠️ **يفك base64 المزدوج:** `Buffer.from(production_token, 'base64').toString('ascii')`
   - يلف بـ PEM: `-----BEGIN CERTIFICATE-----\n{decoded}\n-----END CERTIFICATE-----`
   - يشغل `zatca-sign-invoice.js` → يرجع QR مع 9 TLV tags
3. إذا ما موجودة (Phase 1):
   - يولد QR بسيط (5 TLV tags فقط)
4. يحول لصورة QR باستخدام `qrcode` library

---

## ⚠️ الأخطاء الشائعة وحلولها

### خطأ: `error:068000A8:asn1 encoding routines::wrong tag`

**السبب:** الشهادة من ZATCA مشفرة base64 مرتين. لفها مباشرة بـ PEM headers بدون فك التشفير.

**الحل:**
```typescript
// ❌ خطأ
const cert = `-----BEGIN CERTIFICATE-----\n${s['zatca_production_token']}\n-----END CERTIFICATE-----`;

// ✅ صحيح 
const certBody = Buffer.from(s['zatca_production_token'], 'base64').toString('ascii');
const cert = `-----BEGIN CERTIFICATE-----\n${certBody}\n-----END CERTIFICATE-----`;
```

### خطأ: `Certificate parsing error: DECODER routines::unsupported`

**السبب:** استخدام `zatca_certificate` (هذا CSR مو شهادة!) بدل الشهادة الإنتاجية.

**الحل:**
```typescript
// ❌ خطأ - هذا CSR وليس certificate
certificateBase64: s['zatca_certificate']

// ✅ صحيح - استخدم الشهادة الإنتاجية المفكوكة
let certificateBase64 = s['zatca_certificate'] || undefined;
if (s['zatca_production_token']) {
    certificateBase64 = Buffer.from(s['zatca_production_token'], 'base64').toString('ascii');
}
```

### خطأ: `Invalid CSR` من ZATCA API

**السبب:** OpenSSL config خطأ أو القيم فيها عربي.

**الحل:**
- تأكد كل القيم في CSR config **إنجليزي** (ASCII)
- استخدم `secp256k1` (مو `prime256v1`)
- استخدم نفس format الـ SDK: `1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:ZATCA-Code-Signing`

---

## هيكل TLV في الـ QR Code

### المرحلة الأولى (5 tags):
| Tag | الوصف | مثال |
|-----|-------|------|
| 1 | اسم البائع | nama invest |
| 2 | الرقم الضريبي | 314122115700003 |
| 3 | التاريخ والوقت | 2026-03-06T06:00:00Z |
| 4 | الإجمالي شامل الضريبة | 115.00 |
| 5 | مبلغ الضريبة | 15.00 |

### المرحلة الثانية (9 tags):
| Tag | الوصف | النوع |
|-----|-------|------|
| 1-5 | نفس المرحلة الأولى | نص UTF-8 |
| 6 | Invoice Hash (SHA-256) | binary |
| 7 | ECDSA Signature | binary |
| 8 | Public Key (SPKI DER) | binary |
| 9 | Certificate Signature | binary |

---

## سكربت الاختبار

للتأكد أن الـ QR يحتوي كل الـ tags:

```javascript
// فك TLV من base64
const buf = Buffer.from(qrBase64, 'base64');
let offset = 0;
while (offset < buf.length) {
    const tag = buf[offset++];
    const len = buf[offset++];
    const value = buf.slice(offset, offset + len);
    console.log(`Tag ${tag} (${len} bytes):`, tag <= 5 ? value.toString('utf-8') : '[binary]');
    offset += len;
}
// المفترض يطلع 9 tags
```

---

## ملخص سريع للتطبيق على مشروع جديد

```
1. ثبت: npm install zatca-xml-js qrcode
2. انسخ الملفات: zatca.ts, zatca-fatoora.ts, zatca-sign-invoice.js
3. أضف API routes: generate-keys, zatca (onboard), zatca/qr
4. أدخل بيانات الشركة في الإعدادات
5. ولّد المفاتيح (generate-keys)
6. افتح بوابة فاتورة → خذ OTP
7. أرسل CSR + OTP (compliance-csid)
8. اعمل فحص المطابقة (compliance-invoice)
9. خذ شهادة الإنتاج (production-csid)
10. كل فاتورة الآن تطلع بـ QR المرحلة الثانية تلقائياً ✅
```
