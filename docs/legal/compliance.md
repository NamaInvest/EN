# Legal & Compliance Docs — Namasoft ERP

> **آخر تحديث:** 2026-05-10
> **⚠️ Disclaimer:** هذا الملف مرجع تقني للفريق. اللوائح الرسمية والعقود يجب مراجعتها مع مستشار قانوني سعودي قبل التطبيق على عميل حقيقي.

---

## 1. السلطات والجهات المرجعية (KSA)

| الجهة | الاختصاص | الموقع |
|------|----------|--------|
| **ZATCA** | الفوترة الإلكترونية، VAT | zatca.gov.sa |
| **الهيئة العامة للضريبة والزكاة** | Zakat (سابقاً GAZT, الآن جزء من ZATCA) | zatca.gov.sa |
| **GOSI** | التأمينات الاجتماعية | gosi.gov.sa |
| **وزارة الموارد البشرية (HRSD)** | نظام العمل | hrsd.gov.sa |
| **Qiwa** | عقود العمل، نظام الحماية | qiwa.sa |
| **Mudad** | حماية الأجور (WPS) | mudad.com.sa |
| **سدد** | السداد الحكومي | sadad.com |
| **Saudi Data Authority (SDAIA)** | PDPL — حماية البيانات | sdaia.gov.sa |
| **SOCPA** | معايير المحاسبة السعودية | socpa.org.sa |
| **هيئة السوق المالية (CMA)** | للشركات المدرجة | cma.org.sa |
| **هيئة الزكاة (Zakat)** | الزكاة 2.5% | zatca.gov.sa |

---

## 2. ZATCA (Phase 2 E-Invoicing)

### 2.1 المرحلتان

| Phase | تاريخ | المتطلبات |
|-------|------|-----------|
| Phase 1 (Generation) | 2021-12-04 | فاتورة إلكترونية + QR + UUID |
| Phase 2 (Integration) | 2023-01-01 | تكامل مباشر مع ZATCA + Cryptographic stamp |

### 2.2 المتطلبات الفنية
- UBL 2.1 XML format
- توقيع رقمي بـ ECDSA (شهادة من ZATCA)
- ICV (Invoice Counter Value) — متسلسل، بدون فجوات، per device
- PIH (Previous Invoice Hash) — chain integrity
- QR code (Base64-encoded TLV)
- إرسال خلال 24 ساعة (B2B Standard) / Real-time (B2B Tax Invoice)

### 2.3 أنواع الفواتير
- **Tax Invoice (B2B)** — clearance قبل التسليم
- **Simplified Tax Invoice (B2C)** — reporting بعد الإصدار
- **Credit Note / Debit Note** — للتصحيح

### 2.4 العقوبات (للمنشأة عند المخالفة)
- 5,000 SAR لكل فاتورة لا تستوفي المتطلبات (التكرار = ضعف).
- إيقاف رقم VAT في حالات متكررة.

---

## 3. VAT (الضريبة المضافة)

| Item | Rate |
|------|------|
| Standard rate | 15% |
| Zero-rated (تصدير، خدمات صحية بشروط) | 0% |
| Exempt (إيجار سكني، تعليم، صحة) | معفى |

### الإقرار
- شهري إذا الإيرادات > 40 مليون SAR
- ربع سنوي خلاف ذلك
- المهلة: 30 يوماً من نهاية الفترة
- Format: ZATCA portal (XML upload أو manual entry)

---

## 4. Zakat (الزكاة)

- **2.5%** من الوعاء الزكوي
- يطبق على الشركات السعودية / مواطنين سعوديين
- الشركات الأجنبية المرتبطة → ضريبة دخل 20% (وليس Zakat)
- الإقرار سنوي خلال 120 يوماً من نهاية السنة المالية

---

## 5. GOSI (التأمينات الاجتماعية)

| Component | السعودي | غير السعودي |
|-----------|---------|--------------|
| Employee | 9% | 0% |
| Employer | 9% | 2% (مهنية فقط) |
| **SANED** (تأمين البطالة) | 1% (employee) + 1% (employer) | غير مطبق |

- الإقرار شهري (قبل 15 من الشهر التالي)
- الراتب الأقصى للحساب: 45,000 SAR
- المتأخرة عقوبتها 2% شهرياً

---

## 6. WPS / Mudad (حماية الأجور)

- إجباري لكل المنشآت ≥ 1 موظف
- يجب إيداع الرواتب عبر بنك سعودي
- ملف SIF يُرسل للبنك قبل تاريخ الصرف
- المتأخرة → suspension on Qiwa، غرامات تصاعدية

### تنسيق SIF (مبسّط)

```
HEADER row
  - Employer ID, Bank ID, Pay date, Total amount

DETAIL rows (per employee)
  - Employee ID (Iqama)
  - Bank account / IBAN
  - Net salary
  - Currency (SAR)

TRAILER row
  - Total records, Hash
```

---

## 7. نظام العمل السعودي (Saudi Labor Law)

| Topic | Rule |
|-------|------|
| ساعات العمل | 8/day, 48/week (45 في رمضان) |
| إجازة سنوية | 21 يوم بعد سنة، 30 يوم بعد 5 سنوات |
| إجازة مرضية | 30 يوم 100% + 60 يوم 75% + 30 يوم 0% (per year) |
| إجازة أمومة | 10 أسابيع |
| إجازة أبوة | 3 أيام |
| نهاية الخدمة (EOS) | Article 84-85: 0.5 month/year first 5y, 1 month/year after |
| الفصل التعسفي | تعويض ≥ 60 يوماً |
| الإيقاف عن العمل | يجب إثبات السبب أمام Qiwa |

---

## 8. PDPL (نظام حماية البيانات الشخصية)

### 8.1 المبادئ
1. **Lawfulness** — أساس قانوني للمعالجة (موافقة، عقد، التزام قانوني).
2. **Purpose limitation** — استخدام محدد ومُعلن.
3. **Data minimization** — جمع الحد الأدنى فقط.
4. **Accuracy** — البيانات صحيحة وحديثة.
5. **Storage limitation** — لا تحتفظ أكثر من اللازم.
6. **Integrity** — حماية مناسبة.

### 8.2 حقوق الفرد
- الحق في المعرفة (Right to be informed)
- الحق في الوصول (Right to access)
- الحق في التصحيح (Right to rectification)
- الحق في النقل (Right to portability)
- الحق في النسيان (Right to erasure)
- الحق في الاعتراض (Right to object)

### 8.3 التزامات المنشأة
- تعيين **DPO** (Data Protection Officer) إذا كانت معالجات حساسة
- سجل المعالجة (RoPA — Record of Processing Activities)
- تقييم أثر الخصوصية (DPIA) للمعالجات الحساسة
- إشعار بالاختراق خلال **72 ساعة**
- توطين البيانات الحساسة داخل المملكة (Data residency)

### 8.4 العقوبات
- غرامات تصل لـ 5 مليون SAR
- إيقاف نشاط
- مصادرة الأرباح من بيانات منتهكة

---

## 9. التزامات Namasoft كـ DPO/Processor

```
كـ Processor:
  - عقد معالجة (DPA) مع كل tenant
  - فصل بيانات tenants (multi-tenant isolation guarantees)
  - حذف عند انتهاء العقد (tenant.purged state)
  - الإفصاح عند subpoena أو ZATCA audit (مع إخطار العميل)
  - السماح للـ tenant بـ export + deletion عبر self-service
```

---

## 10. شروط الخدمة المقترحة (Terms of Service — Outline)

1. **التعريفات** — Tenant, User, Service, Data Controller/Processor
2. **الاشتراك** — الباقة، السعر، التجديد، الإلغاء
3. **حدود الاستخدام** — Acceptable use policy
4. **البيانات** — ملكية البيانات، الـ DPA، التصدير
5. **الأمان** — معايير، sanitization، حذف
6. **التوفر** — SLA (99.9%)، تعويضات
7. **التسعير** — العملة (SAR)، VAT، التغيير
8. **الإلغاء** — إشعار 30 يوم، الاحتفاظ 90 يوم بعد الإلغاء
9. **حدود المسؤولية** — Cap to 12 months fees
10. **القانون الحاكم** — أنظمة المملكة، محاكم الرياض

> **TODO:** صياغة كاملة من محامٍ سعودي.

---

## 11. سياسة الخصوصية المقترحة — Outline

1. ما البيانات التي نجمعها
2. كيف نستخدمها
3. مع من نشاركها (sub-processors)
4. أين نخزّنها (KSA only)
5. كم نحتفظ بها
6. حقوقك (PDPL rights)
7. كيف تتواصل معنا (DPO contact)
8. الكوكيز
9. Children's data
10. تحديثات السياسة

---

## 12. عقد المعالجة (DPA — Data Processing Agreement) Outline

1. الأطراف (Controller = Tenant, Processor = Namasoft)
2. الموضوع (نوع البيانات، الغرض، المدة)
3. التزامات Processor
4. الـ sub-processors (قائمة محدّثة)
5. حقوق Audit
6. أمن البيانات
7. حذف / إعادة عند الإنهاء
8. الإشعار بالاختراق

---

## 13. Compliance Calendar (تقويم الالتزامات)

| Frequency | What |
|-----------|------|
| Daily | ZATCA submission queue health |
| Weekly | Backup verification |
| Monthly | GOSI + WPS submissions; VAT (if monthly) |
| Quarterly | VAT (if quarterly); Pen-test review; DR drill (limited) |
| Yearly | Zakat / Income tax; Full DR drill; Pen-test full; Compliance audit |
| Per-incident | Breach notification (72h); ZATCA recovery |

---

## 14. References

- [Multi-Tenant Architecture](../architecture/multi-tenant.md) — isolation guarantees relevant to PDPL
- [Security Plan](../security/security-plan.md)
- [ZATCA_GUIDE.md](../../ZATCA_GUIDE.md)
- ZATCA Phase 2 spec: https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx
- PDPL full text (Arabic): SDAIA portal
- نظام العمل السعودي
