# ما تحتاجه إضافة للبرومنت لإنجاز العمل 100%
# Complete Implementation Requirements Guide

> **الهدف:** قائمة كاملة بكل العناصر غير التقنية والتقنية الإضافية التي يحتاجها مشروعك لينجح بنسبة 100% عند تطبيق برومنت تطوير ERP.

---

## 🎯 ملخص سريع: 12 عنصر أساسي

| # | العنصر | الأهمية | بدونه ماذا يحدث |
|---|--------|---------|------------------|
| 1 | فريق البشر المؤهل | 🔴 حاسم | لا يمكن البناء |
| 2 | محاسب قانوني سعودي SOCPA | 🔴 حاسم | منطق محاسبي خاطئ |
| 3 | بيئات منفصلة (Dev/Stg/Prod) | 🔴 حاسم | تكسر بيانات العملاء |
| 4 | استراتيجية الاختبارات | 🔴 حاسم | bugs في الإنتاج |
| 5 | استراتيجية ترحيل البيانات | 🔴 حاسم | فقد بيانات العملاء الحاليين |
| 6 | التوثيق والمعرفة المرجعية | 🟠 مهم جداً | قرارات خاطئة |
| 7 | مراجعة قانونية وامتثال | 🟠 مهم جداً | غرامات حكومية |
| 8 | بيئة CI/CD وأدوات DevOps | 🟠 مهم جداً | فوضى في النشر |
| 9 | خطة الأمان السيبراني | 🟠 مهم جداً | اختراق وفقد ثقة |
| 10 | دليل المستخدم والتدريب | 🟡 مهم | عملاء لا يستخدمون |
| 11 | برنامج العملاء التجريبي | 🟡 مهم | تكتشف المشاكل متأخراً |
| 12 | خطة الميزانية والوقت | 🟡 مهم | مشروع بلا نهاية |

---

## 1️⃣ الفريق البشري المطلوب

### الحد الأدنى (لإنجاز 60% من البرومنت في 12 شهراً)

| الدور | عدد | متوسط الراتب الشهري (SAR) | المسؤوليات |
|------|------|---------------------------|------------|
| **Backend Senior Developer** | 2 | 18,000 - 25,000 | Prisma, Next.js API, business logic |
| **Frontend Developer** | 1 | 12,000 - 18,000 | Dashboard pages, forms, reports |
| **Full-Stack Mid-level** | 1 | 10,000 - 14,000 | Integration work |
| **DevOps Engineer (Part-time)** | 0.5 | 8,000 - 12,000 | CI/CD, deployments, monitoring |
| **QA Engineer** | 1 | 8,000 - 12,000 | Testing, regression |
| **Saudi CPA (SOCPA)** | 0.3 (مستشار) | 5,000 - 10,000 | مراجعة المنطق المحاسبي |
| **Project Manager** | 1 | 12,000 - 16,000 | إدارة الفرق والمواعيد |
| **UI/UX Designer (Part-time)** | 0.5 | 7,000 - 10,000 | تصميم الشاشات الجديدة |
| **Business Analyst** | 1 | 10,000 - 14,000 | تحليل المتطلبات والمواصفات |

**إجمالي شهري:** ~110,000 - 160,000 ريال
**إجمالي سنوي:** ~1.3 - 1.9 مليون ريال (للحد الأدنى)

### الفريق المثالي (لإنجاز 100% خلال 12-15 شهراً)
أضف:
- مهندس قواعد بيانات (Database Architect)
- خبير أمان سيبراني (Security Engineer)
- خبير ZATCA و TaxEngineer
- Mobile Developer (إذا تريد تطبيق جوال)
- Technical Writer (للتوثيق)
- 2 Customer Success Engineers

### البدائل
- **Outsourcing:** فريق هندي/مصري عن بُعد بنصف التكلفة
- **AI-augmented:** استخدام Claude/Cursor لمضاعفة إنتاجية الفريق الصغير
- **Freelancers:** للمهام المتخصصة (ZATCA expert, Lease accounting expert)

---

## 2️⃣ المحاسب القانوني السعودي (SOCPA Certified) — حاسم

### لماذا تحتاجه؟
البرومنت يصف **التقنية** لكن المحاسب يحدد:
- شجرة الحسابات المعتمدة سعودياً (SOCPA)
- معدلات الإهلاك المسموحة ضريبياً
- طريقة حساب الزكاة والضريبة
- منطق نهاية الخدمة بالضبط
- حدود الـ tolerance في الـ matching
- ما هي الحسابات الرقابية المسموح إدخالها يدوياً
- متى يطبق reverse charge VAT
- معالجة العملات الأجنبية بالضبط

### ما يجب أن يقدمه
1. **Chart of Accounts Template SOCPA-compliant**
2. **مراجعة كل auto-journal logic** قبل البرمجة
3. **مراجعة دورية للـ outputs** من النظام
4. **شهادة امتثال** في النهاية
5. **توقيع على Test Cases** للقيود المعقدة

### من أين تجده؟
- موقع SOCPA الرسمي: socpa.org.sa
- مكاتب: KPMG, PwC, EY, Deloitte (غالي - 2000-5000 ريال/ساعة)
- مكاتب محلية أصغر: 200-500 ريال/ساعة (الأفضل لك)
- consultant مستقل عبر LinkedIn

### عقد ينصح به
- **Retainer شهري:** 8,000 - 15,000 ريال (10-20 ساعة شهرياً)
- **Project-based:** 50,000 - 150,000 ريال للمراجعة الكاملة

---

## 3️⃣ البيئات والبنية التحتية

### البيئات المطلوبة (3 بيئات منفصلة)

```
┌─────────────────────────────────────────────────┐
│  Development (Dev)                              │
│  - PostgreSQL محلي + Prisma migrate dev         │
│  - بيانات وهمية / test data                    │
│  - كل مطور بيئته                                │
└─────────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  Staging / UAT (Pre-Production)                 │
│  - نسخة كاملة من Production schema              │
│  - عميل تجريبي واحد فقط                        │
│  - يستخدمه CPA للمراجعة قبل الإطلاق            │
│  - ZATCA Sandbox                                │
└─────────────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  Production                                     │
│  - عملاؤك الفعليون                              │
│  - ZATCA Production                             │
│  - مع backup يومي                              │
│  - مع monitoring                                │
└─────────────────────────────────────────────────┘
```

### التكاليف الشهرية للبنية التحتية

| المكوّن | الموفر المقترح | تكلفة شهرية |
|---------|----------------|-------------|
| Database (PostgreSQL Managed) | Hetzner Cloud / DigitalOcean / AWS RDS | $30 - $200 |
| Application Server | Hetzner / Vercel / AWS | $30 - $150 |
| File Storage (S3) | AWS S3 / Cloudflare R2 | $5 - $50 |
| CDN | Cloudflare | $0 - $20 |
| Monitoring (Sentry) | موجود | $0 - $80 |
| Email (SendGrid/AWS SES) | SES | $5 - $30 |
| WhatsApp Cloud API | Meta (per message) | $50 - $500 |
| SMS Gateway (Saudi) | Unifonic / Yamamah | $50 - $200 |
| Backup Storage | Backblaze B2 / S3 Glacier | $5 - $30 |
| **إجمالي تقديري** | | **$175 - $1,260** |

---

## 4️⃣ استراتيجية الاختبارات (Testing Strategy)

البرومنت يبني الكود لكنه **لا يضمن صحته**. تحتاج:

### مستويات الاختبار

#### 4.1 Unit Tests (للوحدات الصغيرة)
```
ملفات حرجة يجب اختبارها 100%:
✓ src/lib/auto-journal.ts (8 سيناريوهات × 5 حالات)
✓ src/lib/depreciation/*.ts (6 طرق × 5 حالات)
✓ src/lib/cost-allocation.ts
✓ src/lib/numbering.ts
✓ src/lib/payment-terms.ts (Net 30, 2/10 Net 30, EOM)
✓ src/lib/tax-engine.ts (VAT, WHT, Reverse charge)
✓ src/lib/eos-calculator.ts (Saudi labor law)
✓ src/lib/fx-revaluation.ts
✓ src/lib/three-way-match.ts

أداة: Jest 30 (موجود بالفعل)
الهدف: 80%+ code coverage
```

#### 4.2 Integration Tests
```
سيناريوهات end-to-end:
1. إنشاء فاتورة بيع → posting → AR → cash receipt → reconciliation
2. PR → RFQ → PO → GRN → 3-way match → AP → payment
3. MO → consume materials → produce → close → WIP cleared
4. Asset acquisition → monthly depreciation → disposal → P/L correct
5. Hire employee → payroll run → WPS file → GL posting
6. Period close: revaluation → allocations → depreciation → close → reopen

أداة: Playwright / Vitest
```

#### 4.3 Accounting Validation Tests
**الأهم:** تتأكد من سلامة المنطق المحاسبي

```
✓ Trial Balance دائماً صفر (Debit = Credit)
✓ AR balance = Sum(Open Customer Invoices)
✓ AP balance = Sum(Open Vendor Invoices)
✓ Inventory account balance = Sum(Stock × Cost)
✓ Bank balance = Last reconciled + unreconciled
✓ Fixed Asset NBV = Cost - Accumulated Depreciation
✓ Retained Earnings movement = Net Income - Dividends
✓ ZATCA invoice signing valid (signature verifies)
✓ Multi-currency: Foreign balance × rate = local balance
```

#### 4.4 Performance Tests
```
- 1000 invoice posting/sec
- 10000 stock movements/sec
- Period close on 100,000 transactions في < 5 دقائق
- Trial Balance generation في < 3 ثواني لمليون قيد

أداة: k6 / Artillery
```

#### 4.5 Security Tests
```
- SQL injection
- XSS
- CSRF
- IDOR (Insecure Direct Object Reference) — هل tenant A يصل لبيانات tenant B؟
- Authentication bypass
- Privilege escalation

أداة: OWASP ZAP / Burp Suite
```

### قواعد الجودة (Definition of Done)
كل ميزة جديدة لا تُعتبر "مكتملة" إلا إذا:
- ✅ Unit tests بـ 80% coverage
- ✅ Integration test سيناريو end-to-end
- ✅ مراجعة من مطور آخر (Code Review)
- ✅ مراجعة من CPA (إن كان منطق محاسبي)
- ✅ توثيق في الـ docs
- ✅ تجربتها على staging
- ✅ مراجعة UX/UI

---

## 5️⃣ استراتيجية ترحيل البيانات (Data Migration)

عملاؤك الحاليون لديهم بيانات. عند تطبيق التغييرات الكبيرة، **بياناتهم في خطر**.

### المراحل

#### المرحلة 1: التخطيط (قبل أي تغيير)
```
✓ كامل backup لكل tenant
✓ خريطة من الجداول القديمة للجديدة
✓ استراتيجية للحقول التي تتغير schema
✓ طريقة rollback إذا فشل migration
```

#### المرحلة 2: السكريبتات
```
كل migration يجب أن يكون له:
✓ migration script (forward)
✓ rollback script (backward)
✓ validation script (يتأكد البيانات سليمة بعد الترحيل)
✓ dry-run mode للاختبار
```

#### المرحلة 3: الترحيل الفعلي
```
1. أبلغ العملاء قبل 7 أيام
2. حدد maintenance window (خارج ساعات العمل)
3. أوقف النظام
4. خذ backup كامل
5. شغل migration على tenant واحد كاختبار
6. validate
7. شغل على باقي الـ tenants واحد تلو الآخر
8. validate كل واحد
9. أعد تشغيل النظام
10. راقب لمدة 24 ساعة
```

### مثال على بيانات حساسة في نظامك
- شجرة الحسابات لكل عميل (تتغير schema لإضافة tags جديدة)
- الفواتير المرتبطة بـ ZATCA (لا يجوز تعديلها)
- القيود المرحلة (يمكن إضافة dimensions لكن لا تغير المبلغ)
- أرصدة العملاء (يجب أن تبقى كما هي بالضبط)

---

## 6️⃣ المعرفة المرجعية المطلوبة

### معايير محاسبية يجب امتلاكها
| المعيار | الموضوع | المصدر |
|---------|---------|--------|
| IFRS 15 | اعتراف الإيراد | ifrs.org (paid) |
| IFRS 16 | عقود الإيجار | ifrs.org |
| IFRS 9 | الأدوات المالية | ifrs.org |
| IAS 2 | المخزون | ifrs.org |
| IAS 16 | الأصول الثابتة | ifrs.org |
| IAS 36 | انخفاض القيمة | ifrs.org |
| IAS 21 | تأثيرات تغير العملات | ifrs.org |
| IAS 19 | منافع الموظفين (EOS) | ifrs.org |
| **SOCPA Saudi GAAP** | المعايير السعودية | socpa.org.sa |
| **ZATCA E-invoicing Specs** | الفوترة الإلكترونية | zatca.gov.sa |
| **Saudi Labor Law** | نظام العمل السعودي | mhrsd.gov.sa |
| **GOSI Specs** | التأمينات الاجتماعية | gosi.gov.sa |
| **WPS / Mudad** | حماية الأجور | mudad.com.sa |

### وثائق تقنية حاسمة
- ZATCA Phase 2 Technical Specification (UBL 2.1, ICV, PIH, CSR)
- ZATCA Sandbox API documentation
- Mada Payment Integration Guide
- SADAD Integration Guide
- SAMA (البنك المركزي) requirements

---

## 7️⃣ المراجعة القانونية والامتثال

### قبل الإطلاق العلني للنظام، تحتاج:

#### 7.1 امتثال PDPL (نظام حماية البيانات السعودي)
- معالجة البيانات الشخصية للعملاء والموظفين
- موافقة (consent) من المستخدمين
- حق الوصول والتعديل والحذف
- إشعار خرق البيانات خلال 72 ساعة
- **عقوبة المخالفة:** حتى 5 ملايين ريال

#### 7.2 امتثال ZATCA
- شهادة CSID Production
- اختبار on-boarding
- الالتزام بـ Phase 2 timeline حسب تصنيفك

#### 7.3 شروط الاستخدام (Terms of Service)
- محامي يكتبها (تكلفة 5000-15000 ريال)
- اشتراطات السحاب السعودي إن كنت تخزن داخل المملكة
- SLA مع العملاء

#### 7.4 سياسة الخصوصية (Privacy Policy)
- ما البيانات التي تجمعها
- كيف تستخدمها
- مع من تشاركها

#### 7.5 ترخيص النشاط
- سجل تجاري نشاط برمجة وتقنية معلومات
- ضريبة القيمة المضافة (إذا تجاوزت 375,000 ريال سنوياً)
- اشتراك في غرفة التجارة

---

## 8️⃣ DevOps و CI/CD

البرومنت يكتب كود، لكن **النشر** قصة أخرى.

### الحد الأدنى المطلوب

#### 8.1 Git Workflow
```
main (production)
  └─ staging
       └─ develop
            ├─ feature/period-close-engine
            ├─ feature/eos-calculator
            └─ fix/zatca-icv-bug
```

#### 8.2 CI/CD Pipeline (GitHub Actions / GitLab CI)
```yaml
# على كل push:
1. Lint check (eslint)
2. TypeScript compilation
3. Run unit tests (Jest)
4. Build Next.js
5. Run integration tests
6. Security scan (npm audit, Snyk)
7. Deploy to staging (auto)

# على merge to main:
8. Deploy to production (manual approval)
9. Run smoke tests
10. Notify team on Slack
```

#### 8.3 Monitoring & Observability
- **Sentry** (موجود) — لتتبع الأخطاء
- **Better Stack / Datadog** — لـ logs وtraces
- **Uptime Robot** — لمراقبة up/down
- **PostHog / Plausible** — analytics للاستخدام

#### 8.4 Backup Strategy
- يومي: pg_dump → S3 (احتفاظ 30 يوم)
- أسبوعي: full snapshot (احتفاظ 12 أسبوع)
- شهري: archive (احتفاظ سنتين)
- اختبر استعادة backup شهرياً!

---

## 9️⃣ الأمان السيبراني

### قائمة فحص لازمة قبل الإطلاق

#### 9.1 المصادقة والتفويض
- [ ] كل API endpoint يتحقق من session
- [ ] كل query يتحقق من tenantId
- [ ] لا يوجد user/admin افتراضي بكلمة سر معروفة
- [ ] 2FA إجباري للحسابات الإدارية
- [ ] session timeout: 30 دقيقة على الأقل
- [ ] لا حفظ JWT tokens في localStorage (httpOnly cookies)

#### 9.2 إدارة الأسرار
- [ ] لا توجد كلمات سر في الكود
- [ ] استخدم .env + dotenv
- [ ] في Production: استخدم vault (Doppler, AWS Secrets Manager)
- [ ] دور (rotate) المفاتيح الحرجة كل 90 يوم

#### 9.3 حماية API
- [ ] Rate limiting (مثلاً 100 req/min لكل IP)
- [ ] Input validation بـ Zod (موجود)
- [ ] SQL injection: Prisma آمن لكن تحقق من raw queries
- [ ] CSRF tokens

#### 9.4 حماية البيانات
- [ ] Encryption at rest (PostgreSQL TDE)
- [ ] Encryption in transit (HTTPS فقط)
- [ ] PII data masking في logs
- [ ] Audit log لا يُمحى

#### 9.5 اختبارات اختراق
- توظف pentester مرة سنوياً (10,000-30,000 ريال)
- bug bounty program (اختياري)

---

## 🔟 الوثائق والتدريب

### وثائق المستخدم
| النوع | الجمهور | الشكل |
|------|---------|------|
| دليل المستخدم الأساسي | مستخدم عادي | PDF / online (عربي) |
| دليل المسؤول | admin | PDF |
| دليل المحاسب | accountant | PDF + video |
| فيديوهات تدريبية | الكل | YouTube (5-10 دقائق لكل ميزة) |
| FAQ | الكل | online |
| Changelog | الكل | online |

### الوثائق الفنية
- **API Documentation** (Swagger / OpenAPI)
- **Database Schema Diagram** (dbdiagram.io)
- **Architecture Diagrams** (draw.io)
- **Runbooks** (للحوادث: ماذا تفعل عند X)
- **Onboarding Guide** للمطورين الجدد

### مكان الوثائق
- **الخارجية (للعملاء):** docs.namasoft.sa
- **الداخلية (للفريق):** Notion / Confluence / GitBook
- **الكود:** README.md + JSDoc

---

## 1️⃣1️⃣ برنامج العملاء التجريبي (Beta Program)

### قبل الإطلاق العام:

#### المرحلة 1: Alpha Testing (داخلي)
- 2-3 موظفين من شركتك يستخدمون النظام
- مدة: شهر
- هدف: اكتشاف الأخطاء الواضحة

#### المرحلة 2: Closed Beta (5-10 عملاء)
- اختر عملاء **مختلفين**:
  - شركة تجارة (retail)
  - مقاول/مشاريع
  - مصنع
  - مكتب خدمي
  - مطعم/مقهى
- اعرض عليهم النظام **مجاناً** لمدة 3-6 أشهر مقابل التغذية الراجعة
- اجتماع أسبوعي معهم
- channel على WhatsApp / Slack للدعم السريع

#### المرحلة 3: Open Beta (50-100 عميل)
- بسعر مخفض 50%
- يجب توقيعهم على beta agreement (لا ضمانات كاملة)

#### المرحلة 4: General Availability (GA)
- بسعر كامل
- SLA 99.5% uptime على الأقل
- دعم فني خلال ساعات العمل

### مقاييس النجاح
- Net Promoter Score (NPS) > 50
- Daily Active Users / Monthly Active Users > 60%
- Churn rate < 5% شهرياً
- Time to first transaction < 1 ساعة

---

## 1️⃣2️⃣ الميزانية والجدول الزمني

### تقدير ميزانية واقعية (12-15 شهر)

| البند | تقدير |
|------|-------|
| رواتب الفريق (1.5 سنة) | 1,800,000 - 2,800,000 ريال |
| استشارات (CPA, محامي, security) | 100,000 - 200,000 ريال |
| البنية التحتية (سحابة) | 30,000 - 60,000 ريال |
| الأدوات والاشتراكات | 30,000 - 50,000 ريال |
| التسويق والمبيعات | 100,000 - 300,000 ريال |
| طوارئ (15%) | 300,000 - 500,000 ريال |
| **الإجمالي** | **2,360,000 - 3,910,000 ريال** |

### كيف توفر؟
- ابدأ بفريق صغير (3 أشخاص + AI)
- استخدم Claude/GPT بكثافة لمضاعفة الإنتاجية
- outsource المهام البسيطة
- لا توظف full-time إلا بعد إيراد فعلي
- استهدف seed funding من مستثمر مهتم بـ SaaS

### الجدول الزمني الموصى به (Roadmap)

```
الأشهر 1-3: المرحلة 0 (الأساسات)
├─ Numbering Engine
├─ Document State Machine
├─ Field-Level Audit
├─ Period Close Engine
└─ Approval Workflow Engine

الأشهر 4-6: المرحلة 1 + 2 (المحاسبة + AR/AP)
├─ Recurring/Reversing JE
├─ Open Items + Cash Application
├─ Three-Way Matching
├─ Payment Terms Engine
├─ Customer Statements + Dunning

الأشهر 7-9: المرحلة 3 + 4 (الخزينة + الأصول)
├─ Bank Statement Import
├─ Auto Reconciliation
├─ Asset Master Refactor
├─ Multi-Method Depreciation
├─ Asset Disposal/Impairment

الأشهر 10-12: المرحلة 5 + 6 (المخزون + التصنيع)
├─ Product Variants
├─ Reorder Planning + ABC
├─ Standard Costing + Variance
├─ Multi-Level BOM
├─ Subcontracting

الأشهر 13-15: المرحلة 7-11 (HR + Sales + Reports + AI)
├─ EOS + WPS + Mudad
├─ Org Chart + Leave Engine
├─ Price Lists Engine
├─ Custom Report Builder
├─ AI-Powered Modules
└─ Beta Launch
```

---

## 📋 قائمة الفحص النهائية قبل الإطلاق

### قبل أول عميل دافع، يجب اكتمال:

#### قانوني وامتثال
- [ ] سجل تجاري وشهادة ضريبة
- [ ] شروط استخدام مكتوبة من محامي
- [ ] سياسة خصوصية متوافقة مع PDPL
- [ ] شهادة ZATCA Production CSID للجميع
- [ ] التزام بـ SOCPA review

#### تقني
- [ ] 3 بيئات منفصلة (Dev/Stg/Prod) تعمل
- [ ] CI/CD يعمل
- [ ] Backup يومي مختبر
- [ ] Monitoring + alerting
- [ ] Disaster Recovery plan موثق
- [ ] HTTPS فقط
- [ ] 2FA متاح للحسابات الحرجة
- [ ] Rate limiting

#### وظيفي
- [ ] 80% test coverage على business logic
- [ ] 5 سيناريوهات end-to-end تعمل
- [ ] Trial Balance دائماً يوازن
- [ ] ZATCA invoices تنجح في Production
- [ ] WPS file يقبله البنك
- [ ] EOS calculation موافق عليه من CPA

#### تجربة المستخدم
- [ ] دعم RTL كامل بدون أخطاء
- [ ] الترجمة العربية مكتملة
- [ ] الشاشات responsive (موبايل، تابلت، شاشة كبيرة)
- [ ] performance: pageload < 3 ثواني

#### دعم العملاء
- [ ] دليل مستخدم عربي
- [ ] 10+ فيديوهات تدريبية
- [ ] قناة دعم (WhatsApp Business + Email)
- [ ] SLA معلن
- [ ] FAQ منشور

#### تجاري
- [ ] صفحة pricing
- [ ] طريقة الاشتراك مؤتمتة (Mada/Visa)
- [ ] فواتير ZATCA لاشتراكاتك أنت
- [ ] خطة تسويق
- [ ] 5+ عملاء beta راضون

---

## 🎓 خلاصة: أنت تحتاج 3 أشياء للنجاح بـ 100%

### 1. **بشر** (الأهم)
لا تعتمد على نفسك وحدك + AI. تحتاج:
- مطور سينيور واحد على الأقل غيرك
- محاسب SOCPA
- مصمم UX

### 2. **منهجية**
- Git workflow صارم
- Code reviews دائماً
- Tests قبل الـ merge
- بيئات منفصلة
- Deploy تدريجي

### 3. **مال**
- ميزانية تكفي 18 شهراً (لا 12)
- احتياط للطوارئ (20%)
- لا توقف الرواتب أبداً (يدمر الفريق)

---

## ✅ نصيحة ختامية

**لا تحاول إنجاز كل البرومنت دفعة واحدة.**

التطبيق المثالي:
1. ابدأ بالمرحلة 0 (الأساسات) — 3 أشهر
2. أطلق نسخة "محسنة من الحالي" لعملائك الحاليين
3. اجمع feedback → اكتشف ما هو فعلاً مهم لهم
4. طبق المرحلة التي يطلبونها أولاً (وليس الترتيب النظري)
5. كرر

**أنظمة العالمية لم تُبنى في سنة. SAP عمرها 50 سنة. Odoo عمرها 18 سنة.**
لا تتسرع. ابنِ بقوة. اكسب ثقة العملاء.

---

**انتهى الدليل**
