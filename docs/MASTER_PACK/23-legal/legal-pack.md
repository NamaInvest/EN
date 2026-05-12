---
version: 1.0
last_updated: 2026-05-12
---

# Legal & Compliance Pack

> النماذج القانونية والامتثالية اللازمة لتشغيل نماسوفت SaaS وفقاً للقانون السعودي.

## الوثائق

| # | الوثيقة | الجمهور | ملف |
|---|---|---|---|
| 1 | Terms of Service | عملاء SaaS | [terms-of-service.md](terms-of-service.md) |
| 2 | Privacy Policy | عملاء + زوار | [privacy-policy.md](privacy-policy.md) |
| 3 | Data Processing Agreement | عملاء enterprise | [dpa.md](dpa.md) |
| 4 | Cookie Policy | زوار | [cookie-policy.md](cookie-policy.md) |
| 5 | Acceptable Use Policy | كل المستخدمين | [aup.md](aup.md) |
| 6 | Customer License Agreement | enterprise مشترك | [cla.md](cla.md) |
| 7 | Service Level Agreement | enterprise | [sla.md](sla.md) |
| 8 | Reseller Agreement | شركاء | [reseller.md](reseller.md) |
| 9 | NDA (Mutual) | شركاء + عملاء | [nda.md](nda.md) |
| 10 | Vendor Agreement | موردي نماسوفت | [vendor-agreement.md](vendor-agreement.md) |
| 11 | Employment Contract (Saudi) | موظفي نماسوفت | [employment-contract-sa.md](employment-contract-sa.md) |
| 12 | DPIA Template | فرق التطوير | [dpia-template.md](dpia-template.md) |
| 13 | Incident Notification | عمليات | [incident-notification.md](incident-notification.md) |
| 14 | Refund Policy | عملاء | [refund-policy.md](refund-policy.md) |

## Terms of Service (نموذج مختصر)

```markdown
# شروط الخدمة - نظام نماسوفت

**التاريخ السريان:** 2026-01-01
**آخر تحديث:** 2026-05-12

## 1. القبول
باستخدامك خدمة نماسوفت، فإنك توافق على هذه الشروط.

## 2. تعريف الخدمة
نماسوفت يقدم نظام تخطيط موارد المؤسسات (ERP) كخدمة SaaS متعدد المستأجرين
يستهدف الشركات الصغيرة والمتوسطة في المملكة العربية السعودية ودول الخليج.

## 3. الحسابات
- المستخدم الرئيسي مسؤول عن إدارة المستخدمين الفرعيين
- يجب الحفاظ على سرية كلمات المرور
- إخطار فوري عند الاشتباه باختراق

## 4. الاشتراك والدفع
- الباقات: Starter (199 ر.س/شهر) / Pro (499) / Enterprise (1499)
- الدفع: شهري أو سنوي (مع خصم)
- التجديد: تلقائي ما لم يتم الإلغاء قبل 7 أيام
- الإلغاء: من /settings/billing — يسري نهاية فترة الفوترة الحالية

## 5. ملكية البيانات
- بياناتك ملكك الكاملة
- نماسوفت لا يدّعي ملكيتها
- يحق لك التصدير في أي وقت (PDPL — حق نقل البيانات)
- عند إنهاء الخدمة: بياناتك متاحة للتنزيل لمدة 90 يوم

## 6. الاستخدام المسموح
- استخدام تجاري مشروع
- منع: spam, محتوى مخالف، اختراق، عبء غير معقول على البنية التحتية

## 7. التوافر
- نهدف 99.5% (Starter/Pro) و 99.9% (Enterprise)
- صيانة مجدولة: نخطر قبل 48 ساعة
- في حال خرق SLA: credit آلي

## 8. الدعم
- Starter: email خلال 24 ساعة
- Pro: email + chat خلال 4 ساعات
- Enterprise: 24/7 phone + dedicated CSM

## 9. الامتثال السعودي
- ZATCA Phase 2: نضمن الالتزام
- PDPL: نلتزم بقواعد حماية البيانات
- SOCPA: شجرة الحسابات افتراضية متوافقة

## 10. حدود المسؤولية
- نماسوفت ليس مسؤولاً عن: خسائر تشغيلية ناتجة عن أخطاء في إدخال البيانات
  من قبل المستخدم، أو قرارات عمل مبنية على البيانات
- الحد الأقصى للمسؤولية: قيمة الاشتراك السنوي

## 11. حل النزاعات
القانون المعمول به: قانون المملكة العربية السعودية
المحكمة المختصة: محاكم الرياض

## 12. التعديلات
نخطركم قبل 30 يوماً من أي تعديل جوهري.
```

## Privacy Policy (PDPL-Compliant)

```markdown
# سياسة الخصوصية

## 1. البيانات التي نجمعها
- معلومات الحساب: اسم، إيميل، هاتف
- معلومات الفوترة: طريقة الدفع (مشفّر، نخزن آخر 4 أرقام فقط)
- معلومات الاستخدام: logs, IPs, browser
- المحتوى المُخزّن: بياناتك التشغيلية (يبقى ملكك)

## 2. كيف نستخدم البيانات
- تقديم الخدمة
- الفوترة
- الدعم الفني
- تحسين النظام (analytics مجهولة الهوية)
- التواصل (إشعارات الخدمة)

## 3. المشاركة مع أطراف ثالثة
نشارك بشكل محدود مع:
- مزود البنية التحتية (Hetzner - معالج بيانات)
- مزود الدفع (Stripe / Tap / HyperPay)
- مزود الإيميل (AWS SES)
- مزود الـ AI (Anthropic / OpenAI - بيانات مشفرة)
- ZATCA (للفواتير الإلكترونية فقط)

## 4. حقوقك بموجب PDPL
- حق الوصول إلى بياناتك
- حق التصحيح
- حق الحذف
- حق نقل البيانات
- حق سحب الموافقة
- حق الاعتراض على المعالجة

كيفية الممارسة: /settings/privacy → اكتب طلباً
أو راسل dpo@namasoft.sa
نرد خلال 30 يوماً (PDPL).

## 5. الاحتفاظ بالبيانات
- بيانات الحساب النشطة: مدة الاشتراك
- بيانات الحساب غير النشط: 5 سنوات ثم anonymization
- Audit logs: 7 سنوات (SOCPA)
- معاملات مالية: 10 سنوات
- Backups: 90 يوم

## 6. النقل خارج المملكة
بياناتك مخزّنة في المملكة العربية السعودية (Hetzner Frankfurt قد يكون قيد التقييم
حسب PDPL transition rules).

## 7. الأمان
- تشفير at rest (AES-256) و in transit (TLS 1.3)
- MFA إجباري للحسابات الإدارية
- backups مشفرة
- pen test سنوي

## 8. ملفات Cookies
انظر [Cookie Policy](cookie-policy.md).

## 9. القاصرون
خدمتنا للشركات. ليست مخصصة لمن دون الـ18.

## 10. التحديثات
نخطر قبل 30 يوماً من أي تغيير جوهري.

## 11. التواصل
- DPO: dpo@namasoft.sa
- العنوان: [العنوان الرسمي]
- شكاوي PDPL: SDAIA Saudi Data Authority
```

## Data Processing Agreement (DPA - مختصر)

```markdown
# اتفاقية معالجة البيانات

**الطرفان:**
- Controller: العميل (الشركة المشتركة)
- Processor: نماسوفت

## 1. مدى المعالجة
- البيانات: عملاء، موظفون، موردون، معاملات
- الغرض: تقديم خدمة ERP فقط

## 2. التزامات Processor (نماسوفت)
- معالجة وفق توجيهات Controller فقط
- ضمان السرية
- تدابير أمنية ملائمة (TOMs - Annex 1)
- إخطار بأي اختراق خلال 24 ساعة
- مساعدة Controller في الامتثال لـ PDPL
- حذف/إعادة البيانات عند انتهاء العقد
- خضوع للمراجعة (audit) السنوية

## 3. Sub-processors
ملحق Annex 2 يسرد جميع sub-processors.
نخطر قبل 30 يوماً من إضافة أي جديد.

## 4. النقل الدولي
حالياً البيانات تبقى داخل دول GCC.

## 5. أمن البيانات (TOMs - Annex 1)
- تشفير
- التحكم بالوصول
- المراجعة والتسجيل
- الفصل المنطقي بين العملاء
- النسخ الاحتياطي
- خطة استمرارية الأعمال
- التدريب الأمني

## 6. مدة الاتفاقية
سارية طوال مدة العقد + 3 سنوات بعد انتهائه (لأغراض الاحتفاظ القانوني).

## 7. الإنهاء
عند الإنهاء: تصدير البيانات للعميل + حذف من أنظمة نماسوفت خلال 90 يوماً.
```

## SLA (Enterprise Tier)

```markdown
# اتفاقية مستوى الخدمة - Enterprise

## التوافر (Uptime)
- 99.9% شهرياً (يسمح بـ 43 دقيقة downtime/شهر)
- الحساب: الـ App + API فقط (لا يشمل صيانة مجدولة < 4 ساعات/شهر)
- في حال الخرق:
  - 99.0% - 99.9%: 10% credit
  - 95.0% - 99.0%: 25% credit
  - < 95.0%: 50% credit + خيار الإلغاء بدون عقوبة

## وقت الاستجابة (Response Time)
| Severity | Response | Resolution |
|---|---|---|
| Critical (P1) | 15 دقيقة | 4 ساعات |
| High (P2) | 30 دقيقة | 8 ساعات |
| Medium (P3) | 2 ساعة | 24 ساعة |
| Low (P4) | 8 ساعة | best effort |

## الدعم
- 24/7 phone + email + chat
- Dedicated Customer Success Manager
- Quarterly business reviews

## النسخ الاحتياطي
- يومي إلى تخزين منفصل
- نسخة أسبوعية off-site
- اختبار استعادة شهري آلي
- RPO: 1 ساعة · RTO: 4 ساعات

## الأداء
- API response p95 < 500ms
- Page load p95 < 2s
- Search response p95 < 500ms

## التحسينات المضمونة
- 4 major releases سنوياً
- نشر صباح الجمعة (الراحة الأسبوعية)
- maintenance window 02:00-04:00 (GMT+3)

## القياس والتقارير
- شهري: تقرير uptime + incidents + responses
- ربعي: business review
- سنوي: roadmap planning

## الإنهاء بدون عقوبة
إذا خُرق SLA لـ 3 أشهر متتالية أو 4 أشهر في 12 شهر.
```

## Employment Contract (Saudi - متوافق مع نظام العمل السعودي)

```markdown
# عقد عمل

**الطرف الأول (صاحب العمل):** نماسوفت، شركة سعودية ذات مسؤولية محدودة
**الطرف الثاني (الموظف):** [الاسم] / [الإقامة/الهوية]

## 1. تاريخ المباشرة
[تاريخ]

## 2. مدة العقد
☐ غير محددة المدة (Saudi national)
☐ محددة المدة: 2 سنوات (مجدد تلقائياً) — للأجانب

## 3. الوظيفة
المسمى: [...]
الإدارة: [...]
المرؤوس إلى: [...]

## 4. الأجور
- الراتب الأساسي: [...] ريال شهرياً
- بدل سكن: 25% (إذا لم يوفر سكن)
- بدل نقل: [...] ريال
- بدلات أخرى: [...]
- إجمالي: [...] ريال

## 5. ساعات العمل
- 8 ساعات يومياً، 48 ساعة أسبوعياً
- يوما العطلة: الجمعة والسبت
- شهر رمضان: 6 ساعات يومياً (مسلمين)

## 6. الإجازات
- سنوية: 21 يوم (≤ 5 سنوات خدمة) → 30 يوم (> 5 سنوات)
- العطلات الرسمية الإسلامية والوطنية
- مرضية: 30 يوم بأجر كامل + 60 يوم بـ 75% + 30 يوم بدون أجر
- وفاة: 5 أيام (من الدرجة الأولى)
- زواج: 5 أيام
- مولود: 3 أيام
- حج: 10 أيام (مرة واحدة)

## 7. التأمينات الاجتماعية (GOSI)
- المؤسسة تساهم بـ 9% + 2% (SANED)
- الموظف يساهم بـ 9% (السعوديين فقط)
- الأجانب: 2% (الأخطار المهنية فقط)

## 8. التأمين الصحي
وفقاً لمجلس الضمان الصحي التعاوني (CCHI).

## 9. السرية والملكية الفكرية
- الموظف يحفظ سرية المعلومات
- كل الـ IP المنتجة أثناء العمل ملك للمؤسسة
- بنود استمرار بعد انتهاء العقد لمدة سنتين

## 10. الإنهاء
- إشعار: 60 يوم (الموظف) / 60 يوم (الشركة)
- مكافأة نهاية الخدمة: حسب المادة 84-85 من نظام العمل
- أسباب الفصل الفوري: المادة 80
- التزام: تسليم العهدة والملفات قبل المغادرة

## 11. القانون المعمول به
نظام العمل السعودي ولوائحه.

## 12. النزاعات
محاكم العمل بالمملكة.

التوقيع: ______________   التاريخ: ______________
```

## Checklist امتثال

```
## PDPL Compliance Checklist

### إدارة الموافقة
- [x] PdplConsent model exists
- [x] Consent banner on signup
- [x] Granular per-purpose consent
- [x] Withdrawal mechanism (1-click)
- [x] Consent audit log

### حقوق أصحاب البيانات
- [x] Access request endpoint
- [x] Rectification UI in /profile
- [x] Deletion request workflow
- [x] Portability (full export ZIP)
- [x] DPO contact published
- [x] 30-day SLA per request

### الأمان
- [x] Encryption at rest
- [x] Encryption in transit
- [x] MFA available
- [x] Access logs
- [x] Breach detection
- [x] Field-level encryption for PII

### الاحتفاظ والحذف
- [x] DataRetentionPolicy model
- [x] Auto-anonymization cron
- [x] Manual purge tooling

### الاختراق
- [x] PdplBreachIncident model
- [x] 72-hour notification mechanism
- [x] Internal escalation
- [x] Affected user notification
- [x] SDAIA notification template

### مقدمي الخدمات (Sub-processors)
- [x] DPA with all sub-processors
- [x] Public list of sub-processors
- [x] Notification before changes

### النقل الدولي
- [x] Data residency policy
- [x] Customer-controlled region (Enterprise)
- [x] Cross-border transfer assessment

### المراجعة والتدقيق
- [x] Annual privacy audit
- [x] DPIA template
- [x] Privacy by Design checklist for new features
```
