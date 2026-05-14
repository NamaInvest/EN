# 35 - التكاملات الحكومية السعودية (Saudi Government Integrations)

> ZATCA + Mudad + Qiwa + GOSI + SAMA + Najiz + Bayan (الجمارك)

---

## 🇸🇦 خريطة التكاملات الحكومية

| الجهة | الموقع | الغرض | الحالة في النظام |
|---|---|---|---|
| **ZATCA** | zatca.gov.sa | الفوترة + VAT + Zakat | ✅ Phase 2 مفعّل |
| **Mudad** | mudad.com.sa | حماية الأجور (WPS) | 🟡 SIF generator فقط |
| **Qiwa** | qiwa.sa | منصة العمل | 🟡 stub |
| **GOSI** | gosi.gov.sa | التأمينات الاجتماعية | 🟡 ملف شهري يدوي |
| **Najiz** | najiz.sa | البوابة القضائية | 🟡 stub |
| **SAMA** | sama.gov.sa | البنك المركزي / Open Banking | 🟡 framework |
| **Bayan** | bayan.gov.sa | الجمارك | 🟡 framework |
| **Absher** | absher.sa | التحقق من الهوية | ❌ غير منفذ |
| **Saudi Post** | sa.com.sa | العناوين | ❌ غير منفذ |

---

## 1️⃣ ZATCA (هيئة الزكاة والضريبة والجمارك)

### المسارات (`src/lib/zatca*`):
| الملف | الغرض |
|---|---|
| `zatca.ts` | TLV + QR + XML core |
| `zatca-signer.ts` | ECDSA signing |
| `zatca-qr-engine.ts` | QR generation |
| `zatca-qr-validator.ts` | التحقق من QR |
| `zatca-fatoora.ts` | ZATCA API client |
| `zatca-counter-service.ts` (في `src/lib/zatca/`) | ICV management |
| `zatca-onboarding-engine.ts` | CSID onboarding |
| `zatca-java.ts` | Java SDK wrapper |
| `zatca-vault.ts` | تخزين الشهادات |

### الـ Java SDK (في `electron/zatca-sdk/`):
- النسخة الرسمية من ZATCA
- يُستخدم بدلاً من الـ TypeScript implementation في بعض الحالات
- يحتوي: Apps, Configuration, Data, Lib, install scripts

### راجع: `15-saudi-compliance.md` للتفاصيل الكاملة

---

## 2️⃣ Mudad (نظام حماية الأجور)

### المسارات:
| الملف | الغرض |
|---|---|
| `mudad-api.ts` | API client |
| `mudad-compliance.ts` | الامتثال |
| `mudad-sync-engine.ts` | مزامنة |
| `wps-generator.ts` | SIF generator |
| `src/lib/wps/mudad-integration-engine.ts` | تكامل عام |
| `src/lib/wps/wps-sif-generator.ts` | SIF v3 generator |
| `src/lib/saudi-gov/mudad.ts` | Helpers |

### السيناريو:
```
1. الشركة تسجل في Mudad portal
2. تحصل على Mudad Employer ID
3. في النظام: تحدد bankCode + EmployerID في Settings
4. كل شهر:
   - generatePayrollRun()
   - generateSIF() — يولد ملف نصي
   - رفع SIF على Mudad portal (يدوياً حالياً)
   - أو عبر API (قيد التطوير)
5. Mudad يتحقق ويرفع للبنك
```

### الـ SIF v3 Format:
```
HDR|v3|{employerId}|{bankCode}|{month}-{year}|{count}|{totalNet}
EMP|{nationalId}|{iban}|{basic}|{housing}|{transport}|{otherAllow}|{deductions}|{net}|{bankCode}
EMP|...
DED|{nationalId}|{deductionType}|{amount}|{reason}
TRL|{totalBasic}|{totalAllowances}|{totalDeductions}|{totalNet}|{empCount}
```

### الـ Validation:
- IBAN: `^SA[0-9]{22}$` (24 char)
- Bank Codes: RJHI, SNB, BSFR, ANB, ALBI, RIBL, SIBR, BAJZ, BSAU, INMA
- National ID: 10 digits, Saudi/GCC validation
- Iqama (للأجانب): يبدأ بـ 1, 2 + 10 digits

---

## 3️⃣ Qiwa (وزارة الموارد البشرية)

### الغرض:
- إدارة عقود العمل
- إصدار تأشيرات العمل
- نقل الكفالات
- استخراج التأمينات الصحية
- متابعة السعودة (Nitaqat)

### الـ Endpoints:
| المسار | الغرض |
|---|---|
| `/api/saudi/qiwa` | Qiwa endpoints |
| `/hr/qiwa` | UI |

### الـ Files:
| الملف | الغرض |
|---|---|
| `src/lib/qiwa/qiwa-engine.ts` | الـ engine |
| `qiwa-engine.ts` (root) | wrapper |

### الحالة:
- 🟡 Schema موجود
- 🟡 UI placeholder
- ❌ API integration ناقص

### الـ Features المتوقعة:
```
1. إنشاء عقد رسمي في Qiwa عند توظيف موظف
2. تحديث Qiwa عند تعديل العقد
3. متابعة status الكفالة
4. تحويل التأشيرات (مهنة → مهنة)
5. مزامنة بيانات الموظف
6. متابعة الـ Nitaqat الحالي
```

---

## 4️⃣ GOSI (المؤسسة العامة للتأمينات الاجتماعية)

### الـ Files:
| الملف | الغرض |
|---|---|
| `src/lib/gosi/gosi-engine.ts` | core (تفاصيل في 25-hr-payroll.md) |
| `src/lib/gosi-service.ts` | الخدمات |

### الـ Integration الحالي:
- ✅ حساب الاشتراكات (Saudi/GCC/Expat)
- ✅ ملف شهري (`GOSIMonthlyFile`)
- 🟡 الرفع لـ GOSI portal (يدوي)
- ❌ تكامل API مباشر

### الـ API المتوقع (للمستقبل):
```
POST https://api.gosi.gov.sa/v1/contributions
{
    employerId, period,
    employees: [{ nationalId, contribution, salary }]
}
```

---

## 5️⃣ SAMA (مؤسسة النقد العربي السعودي)

### الغرض:
**SAMA Open Banking** — منصة للبنوك للتكامل المباشر

### الـ Engine:
- `src/lib/sama/sama-open-banking-engine.ts`

### الـ Features (مخططة):
```
1. ربط الحسابات البنكية (Account Aggregation):
   - Read account balance لحظياً
   - Read transactions
2. تنفيذ التحويلات (Payment Initiation):
   - من النظام مباشرة بدون portal البنك
3. تحقق من البيانات (Identity Verification)
4. كشف الـ Beneficiary
```

### الحالة:
- 🟡 Framework موجود
- ❌ التكامل الفعلي ناقص
- ينتظر التراخيص من SAMA

### البنوك المعتمدة في Open Banking SA:
- مصرف الراجحي ✅
- البنك الأهلي السعودي 🟡
- البنك الفرنسي 🟡
- (المزيد قيد الإضافة)

---

## 6️⃣ Najiz (البوابة القضائية السعودية)

### الغرض:
- تقديم الدعاوى ضد العملاء المتعثرين
- الاستفسار عن حالة القضايا
- استخراج المستندات القضائية
- متابعة التنفيذ

### الـ Engine:
- `src/lib/najiz/najiz-engine.ts`

### الـ Features (مخططة):
```
1. عميل في dunning level 3 (90+ يوم):
   - System يقترح فتح قضية في Najiz
   - يجمع المستندات تلقائياً:
     - الفواتير المتأخرة
     - كشف الحساب
     - العقد
     - الشيكات المرتدة
   - يقدم للـ Najiz عبر API
2. متابعة الحالة:
   - مفتوحة / قيد النظر / حكم / تنفيذ
3. عند الحكم:
   - إذا لصالحنا: محاولة التحصيل
   - إذا ضدنا: إغلاق الـ AR
```

### الحالة:
- 🟡 Framework
- ❌ API integration ناقص (Najiz لا تقدم API علني حالياً)
- يمكن للمحامي رفع المستندات يدوياً

### الـ Workflow المقترح:
```typescript
// في collection-workflow-engine.ts:
async function escalateToLegal(customer) {
    if (customer.dunningLevel >= 3 && customer.outstandingDays > 90) {
        await najizEngine.openCase({
            customerId: customer.id,
            documents: await collectCustomerDocuments(customer),
            amount: customer.outstandingBalance
        });
    }
}
```

---

## 7️⃣ Bayan (الجمارك السعودية)

### الغرض:
- إدارة وارد/صادر البضائع عبر الجمارك
- البيانات الجمركية
- حساب الرسوم
- الإفراج الجمركي

### الـ Engine:
- `src/lib/customs/customs-bayan-engine.ts`

### الـ Features (مخططة):
```
1. عند استيراد بضاعة:
   - تقديم بيان جمركي عبر Bayan
   - يحتوي:
     - وصف البضاعة
     - HS Code (Harmonized System)
     - القيمة CIF
     - بلد المنشأ
2. حساب الرسوم:
   - Customs Duty (5-15% عادة)
   - VAT 15%
   - Excise Duty (للسلع المحددة)
3. الإفراج:
   - بعد الدفع → استخراج البضاعة
4. تسجيل في النظام:
   - GRN خاص للاستيراد
   - تكاليف Landed Cost:
     - Customs duty
     - Freight
     - Insurance
     - Handling
```

### الحالة:
- 🟡 Schema جاهز
- 🟡 Landed Cost manual
- ❌ Bayan API integration ناقص

### Landed Cost Calculation:
```typescript
landedCost = invoicePrice
           + customsDuty
           + freight
           + insurance
           + handling
           + portCharges

// Per item allocation (by weight or value):
itemLandedCost = (itemPrice / totalInvoicePrice) × totalAdditionalCosts
```

---

## 8️⃣ Saudi-Specific Engines (Sub-Library)

### `src/lib/saudi-compliance/`:
- `index.ts` — exports موحدة لكل الـ Saudi engines

### Sub-features:
| Engine | Purpose | Status |
|---|---|---|
| `saudi-eos-engine.ts` | EOS Article 84-85 | ✅ |
| `saudization-nitaqat-engine.ts` | السعودة | ✅ |
| `reverse-charge-vat.ts` | Reverse Charge للأجانب | ✅ |
| `wht-engine.ts` | WHT للأجانب | ✅ |
| `tax-regime-engine.ts` | نظام الضرائب | 🟡 |

---

## 🔮 تكاملات مستقبلية مقترحة

### Absher (التحقق من الهوية):
```
- التحقق من الـ National ID
- التحقق من الـ Iqama
- استرجاع المعلومات الديموغرافية
- مفيد لـ:
  - فحص العميل عند الفتح (KYC)
  - فحص الموظف عند التوظيف
  - منع الاحتيال
```

### Saudi Post (العناوين):
```
- التحقق من العنوان الوطني
- استكمال العناوين تلقائياً
- البحث بالـ short code
- مفيد لـ:
  - إدخال عناوين العملاء
  - شحن الطلبات
  - الفواتير الضريبية (ZATCA يطلب عنوان كامل)
```

### Tameeni (التأمين):
```
- مقارنة وثائق التأمين
- شراء التأمين الصحي للموظفين
- التأمين على المركبات
```

### Etimad (المنصة العامة):
```
- المناقصات الحكومية
- التسجيل كمورد للحكومة
```

### Yakeen (يقين):
```
- التحقق من السجل التجاري
- التحقق من الـ VAT
- معلومات الشركات
```

---

## 📋 Configuration للتكاملات

### في `.env`:
```bash
# ZATCA
ZATCA_ENV=production
ZATCA_API_URL=https://gw-fatoora.zatca.gov.sa/...
ZATCA_API_KEY=...
ZATCA_API_SECRET=...

# Mudad
MUDAD_API_URL=https://api.mudad.com.sa
MUDAD_CLIENT_ID=...
MUDAD_CLIENT_SECRET=...
MUDAD_EMPLOYER_ID=...

# Qiwa
QIWA_API_URL=https://api.qiwa.sa
QIWA_API_KEY=...

# GOSI
GOSI_API_URL=https://api.gosi.gov.sa
GOSI_API_KEY=...
GOSI_EMPLOYER_ID=...

# Bayan
BAYAN_API_URL=https://api.bayan.gov.sa
BAYAN_API_KEY=...
BAYAN_CR_NUMBER=...

# Najiz
NAJIZ_API_URL=https://api.najiz.sa
NAJIZ_API_KEY=...

# SAMA Open Banking
SAMA_OPEN_BANKING_CLIENT_ID=...
SAMA_OPEN_BANKING_CLIENT_SECRET=...
SAMA_REDIRECT_URI=https://namainvist.com/api/sama/callback
```

---

## 🎯 Best Practices

1. ✅ **Cache responses** من الـ APIs الحكومية (rate limits صارمة)
2. ✅ **Audit Trail** لكل تكامل
3. ✅ **Retry policy** مع exponential backoff
4. ✅ **Fallback manual** عند فشل API
5. ✅ **Encrypted credentials** في DB
6. ✅ **OAuth refresh tokens** بشكل آمن
7. ✅ **Webhook signatures** للـ inbound
8. ❌ **لا API key في الكود** — استخدم ENV
9. ❌ **لا تجمع PII غير ضروري** (PDPL)
10. ✅ **متابعة التحديثات** على portal الجهة

---

## 🚨 المخاطر والاعتبارات

### القانونية:
- معظم الـ APIs تحتاج تراخيص خاصة
- العقوبات على عدم الامتثال صارمة
- Mudad / WPS عدم الالتزام = حظر تأشيرات

### التقنية:
- معظم الـ APIs محدودة (rate limits صارمة)
- بعضها يستخدم SOAP وليس REST
- التوثيق العربي قد لا يكون دقيقاً
- التغييرات بدون warning

### الحلول:
- اشترك في القائمة البريدية الرسمية
- اختبر في sandbox أولاً
- احتفظ بـ logs مفصلة
- خطط للـ fallback manual
