# كل الوثائق والمواد التي تحتاجها لبناء نظام ERP عالمي
# Complete Artifacts Checklist for Building World-Class ERP

> **سؤالك:** "وش احتاج غير الفلو؟"
>
> **الجواب:** البرومنت والفلو لوحدهما لا يكفيان. تحتاج **18 نوعاً** من الوثائق والمواد المختلفة لإنجاز نظام بمستوى SAP/Oracle.

---

## 🎯 الخريطة الكاملة للوثائق المطلوبة

```
┌─────────────────────────────────────────────────────────┐
│                    البرومنت (لديك)                      │
│  Master Implementation Prompt                            │
└─────────────────────────────────────────────────────────┘
                           +
┌─────────────────────────────────────────────────────────┐
│                    الفلوهات (لديك)                      │
│  Business Process Flows                                  │
└─────────────────────────────────────────────────────────┘
                           +
┌─────────────────────────────────────────────────────────┐
│              16 وثيقة إضافية تحتاجها 👇                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 القائمة الكاملة (18 وثيقة)

| # | الوثيقة | تحتاجها لـ | حالتك | الأولوية |
|---|---------|------------|-------|----------|
| 1 | **Prompt** (البرومنت) | البرمجة | ✅ | — |
| 2 | **Business Flows** (الفلوهات) | فهم العملية | ✅ | — |
| 3 | **Wireframes & Mockups** | تصميم الشاشات | ❌ | 🔴 عالية |
| 4 | **Database ERD** | بنية قاعدة البيانات | ❌ | 🔴 عالية |
| 5 | **API Specifications (OpenAPI)** | توثيق الـ APIs | ❌ | 🔴 عالية |
| 6 | **User Stories & Acceptance Criteria** | متطلبات واضحة | ❌ | 🔴 عالية |
| 7 | **Test Cases & Test Plan** | الاختبارات | ❌ | 🔴 عالية |
| 8 | **Data Dictionary** | فهم كل حقل | ❌ | 🟠 متوسطة |
| 9 | **Architecture Document** | البنية العامة | ❌ | 🟠 متوسطة |
| 10 | **Security Plan** | الأمان | ❌ | 🔴 عالية |
| 11 | **Deployment Plan** | النشر | ❌ | 🟠 متوسطة |
| 12 | **Style Guide / Design System** | التصميم الموحد | ❌ | 🟠 متوسطة |
| 13 | **i18n Translation Files** | الترجمة | ⚠ جزئي | 🟠 متوسطة |
| 14 | **Sample Data / Seeders** | بيانات تجريبية | ⚠ جزئي | 🟡 منخفضة |
| 15 | **Migration Scripts** | ترحيل بيانات العملاء | ❌ | 🔴 عالية |
| 16 | **User Manual** | دليل المستخدم | ❌ | 🟠 متوسطة |
| 17 | **Training Videos** | تدريب العملاء | ❌ | 🟡 منخفضة |
| 18 | **Legal & Compliance Docs** | الالتزام القانوني | ❌ | 🔴 عالية |

---

## 1️⃣ Wireframes & Mockups (تصميم الشاشات)

### ما هو؟
رسومات للشاشات قبل برمجتها — **كيف تبدو الشاشة وأين كل زر**.

### لماذا تحتاجه؟
بدون wireframe:
- المطور يصنع شاشة قبيحة وغير مفيدة
- العميل يقول "ليس هذا ما أردت" بعد البرمجة
- يعاد الكود 5 مرات

### مثال: شاشة فاتورة مبيعات

```
┌─────────────────────────────────────────────────────┐
│  فاتورة بيع جديدة                    [حفظ] [إلغاء] │
├─────────────────────────────────────────────────────┤
│  العميل: [▼ ابحث عن عميل]    رقم الفاتورة: INV-001 │
│  التاريخ: [📅 2026-05-01]      الفرع: [▼ الرياض]    │
├─────────────────────────────────────────────────────┤
│ # │ المنتج    │ الكمية │ السعر │ الخصم │ الإجمالي │
│ 1 │ منتج 1   │ 2      │ 100   │ 0     │ 200      │
│ 2 │ منتج 2   │ 1      │ 50    │ 5     │ 45       │
│   │ [+ إضافة سطر جديد]                            │
├─────────────────────────────────────────────────────┤
│                          الإجمالي: 245            │
│                    ضريبة 15%: 36.75               │
│                   الإجمالي الكلي: 281.75          │
├─────────────────────────────────────────────────────┤
│ طريقة الدفع: [▼ نقد]    المدفوع: [281.75]         │
└─────────────────────────────────────────────────────┘
```

### الأدوات
- **Figma** (مجاني، الأفضل) — figma.com
- **Balsamiq** (مدفوع، 90$ مرة واحدة) — للـ wireframing السريع
- **Adobe XD** (مجاني)
- **Whimsical** (سهل وسريع)

### كم شاشة تحتاج؟
نظامك عنده ~60 صفحة Dashboard. يجب رسم wireframe لكل شاشة جديدة (ليس بالضرورة الموجودة).
**الجديدة المهمة:** ~80-100 شاشة (أصول، إيجار، إقفال، إلخ)

---

## 2️⃣ Database ERD (مخطط قاعدة البيانات)

### ما هو؟
رسم لكل الجداول والعلاقات بينها — قبل تعديل Prisma schema.

### مثال جزئي

```
┌─────────────┐       ┌─────────────┐      ┌─────────────┐
│  Account    │←──────│ JournalLine │──────→│ CostCenter │
└─────────────┘  many │             │ many └─────────────┘
                      └──────┬──────┘
                             │ many
                             ↓
                      ┌─────────────┐
                      │JournalEntry │
                      └─────────────┘
                             │
                             ↓ many
                      ┌─────────────┐
                      │FiscalPeriod │
                      └─────────────┘
```

### لماذا تحتاجه؟
- يكشف العلاقات الناقصة قبل البرمجة
- يجبرك على التفكير في normalization
- يوضح الـ tenant isolation
- ضروري لـ DBA reviews

### الأدوات
- **dbdiagram.io** (مجاني، الأبسط) — DBML syntax
- **DrawSQL** — مشترك
- **prisma-erd-generator** — يولد ERD تلقائياً من Prisma schema!

### كيف تولد ERD من نظامك الحالي تلقائياً
```bash
npm install --save-dev prisma-erd-generator @mermaid-js/mermaid-cli
# أضف في schema.prisma:
generator erd {
  provider = "prisma-erd-generator"
  output = "./ERD.svg"
}
npx prisma generate
```
**ينتج لك مخطط ERD لكل الـ 157 جدول الموجود!**

---

## 3️⃣ API Specifications (OpenAPI/Swagger)

### ما هو؟
وثيقة تصف كل API endpoint بالتفصيل — الـ request, response, errors.

### مثال
```yaml
/api/accounting/journal:
  post:
    summary: إنشاء قيد يومي جديد
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [entryDate, lines]
            properties:
              entryDate: { type: string, format: date }
              description: { type: string }
              lines:
                type: array
                items:
                  type: object
                  required: [accountId, debit, credit]
                  properties:
                    accountId: { type: integer }
                    debit: { type: number }
                    credit: { type: number }
                    costCenterId: { type: integer }
    responses:
      201: { description: تم الإنشاء }
      400: { description: قيد غير متوازن }
      403: { description: ليس له صلاحية }
```

### لماذا تحتاجه؟
- للمطورين الجدد: يفهمون النظام في يوم
- للعملاء الذين يريدون التكامل
- للاختبارات الآلية
- لتوليد SDKs

### الأدوات
- **Swagger UI** (مجاني)
- **Stoplight** (مدفوع)
- **next-swagger-doc** — توليد تلقائي من تعليقات الكود

---

## 4️⃣ User Stories & Acceptance Criteria

### الفرق بين البرومنت والـ User Story

**البرومنت (تقني):**
> "أنشئ نموذج CWIP مع capitalization function..."

**User Story (تجاري):**
> **As a** مدير مالي
> **I want** أتتبع تكاليف بناء مبنى جديد كـ CWIP
> **So that** أحوّله لأصل ثابت تلقائياً عند الانتهاء وأبدأ إهلاكه

**Acceptance Criteria:**
1. أستطيع إنشاء مشروع CWIP بميزانية مقدرة
2. أستطيع إضافة فواتير وعمالة عليه
3. النظام يجمع كل التكاليف
4. عند تعليم المشروع كـ "مكتمل":
   - يولد أصلاً ثابتاً جديداً
   - ينقل المبلغ من CWIP إلى Asset
   - يبدأ جدول الإهلاك
5. القيد المحاسبي صحيح
6. أستطيع رؤية تاريخ كل التكاليف

### لماذا تحتاجه؟
- يضمن أن البرمجة تطابق ما يريده المستخدم
- معيار للقبول/الرفض
- أساس للاختبارات

### الأدوات
- **Jira** (الصناعي)
- **Linear** (المفضل للشركات الناشئة)
- **Notion** (الأبسط)
- **GitHub Issues** (مجاني)

---

## 5️⃣ Test Cases & Test Plan

### ما هو؟
قائمة بكل الحالات التي يجب اختبارها يدوياً وآلياً.

### مثال — Test Plan لـ Period Close

```
TC-PC-001: إغلاق فترة بدون فواتير معلقة
  Given: لا توجد فواتير draft
  When: نشغل period close
  Then: 
    - يكتمل في < 5 دقائق
    - Trial Balance balanced
    - الفترة تصبح locked

TC-PC-002: إغلاق فترة مع revaluation
  Given: حساب USD برصيد 1000$ وسعر صرف نهاية الفترة 3.85
  When: نشغل FX revaluation
  Then:
    - JE تلقائي يعكس الفرق
    - الرصيد المحلي = 3,850 SAR

TC-PC-003: محاولة إغلاق فترة فيها فاتورة draft
  Given: فاتورة status = draft
  When: نحاول إغلاق
  Then:
    - رفض مع رسالة واضحة
    - عرض قائمة الـ drafts

TC-PC-004: Year-end closing
  Given: 31 ديسمبر، الإيرادات 1M، المصروفات 700K
  When: نشغل year-end close
  Then:
    - JE: Revenue → Income Summary
    - JE: Expenses → Income Summary
    - JE: Income Summary 300K → Retained Earnings
    - السنة الجديدة تبدأ بـ Retained Earnings الجديدة
```

### الأدوات
- **TestRail** (احترافي)
- **Excel/Google Sheets** (الأبسط)
- **Jest** (للـ automated)
- **Playwright** (للـ end-to-end)

---

## 6️⃣ Data Dictionary

### ما هو؟
جدول يشرح **كل حقل في كل جدول** — معناه، نوعه، قيمه المسموحة.

### مثال
| الجدول | الحقل | النوع | إلزامي؟ | الوصف | القيم المسموحة |
|--------|-------|------|---------|--------|-----------------|
| Account | id | int | ✓ | المعرف الفريد | auto |
| Account | code | string(20) | ✓ | كود الحساب | format: 1110, 1110-01 |
| Account | nameAr | string(100) | ✓ | الاسم بالعربية | — |
| Account | type | enum | ✓ | نوع الحساب | asset, liability, equity, revenue, expense |
| Account | parentId | int | لا | الحساب الأب | يجب أن يكون id موجود |
| Account | level | int | ✓ | المستوى | 1-5 |
| Account | controlAccount | bool | ✓ | حساب رقابة؟ | إذا true: يمنع manual JE |
| Account | currencyId | int | لا | العملة | إذا null: تستخدم functional currency |

### لماذا تحتاجه؟
- المحاسب يفهم ما يدخل أين
- المطور الجديد لا يضل
- يكشف الحقول الناقصة

### الأدوات
- **dbdocs.io** (يولد تلقائياً من DBML)
- **Confluence**
- **Notion**

---

## 7️⃣ Architecture Document

### ما يحتويه؟
1. **System Context Diagram** (نظرة عامة)
2. **Container Diagram** (الخوادم/البيئات)
3. **Component Diagram** (المكونات الداخلية)
4. **Sequence Diagrams** (لأهم العمليات)
5. **Deployment Diagram**
6. **Data Flow Diagrams**

### مثال — Sequence Diagram لإنشاء فاتورة

```
User    → UI       → API        → AutoJournal → Prisma  → ZATCA
 │         │           │              │            │         │
 │ POST   │           │              │            │         │
 │───────→│           │              │            │         │
 │        │ POST /api │              │            │         │
 │        │──────────→│              │            │         │
 │        │           │ validate     │            │         │
 │        │           │ inventory    │            │         │
 │        │           │ check credit │            │         │
 │        │           │ generateJE   │            │         │
 │        │           │─────────────→│            │         │
 │        │           │              │ INSERT     │         │
 │        │           │              │───────────→│         │
 │        │           │              │            │ ZATCA   │
 │        │           │ generateXML  │            │ submit  │
 │        │           │─────────────────────────────────────→│
 │        │           │              │            │ accept  │
 │        │           │←─────────────────────────────────────│
 │        │ 201       │              │            │         │
 │        │←──────────│              │            │         │
 │ resp   │           │              │            │         │
 │←───────│           │              │            │         │
```

### الأدوات
- **C4 Model** (المعيار الذهبي) — c4model.com
- **Structurizr** (للـ C4)
- **Mermaid** (للـ sequence diagrams)
- **PlantUML**

---

## 8️⃣ Security Plan

### يجب أن يحتوي

#### Threat Model
- ما هي البيانات الحساسة؟
- من المهاجمون المحتملون؟
- ما السيناريوهات؟

#### Security Controls Checklist
```
✓ Authentication
  - Password policy (12+ chars, complexity)
  - 2FA for admin accounts
  - Session timeout 30 min
  - Failed login lockout (5 attempts)
  
✓ Authorization
  - RBAC matrix documented
  - SoD rules
  - Field-level permissions
  - Tenant isolation tested
  
✓ Data Protection
  - Encryption at rest (PostgreSQL TDE)
  - Encryption in transit (TLS 1.3 only)
  - PII fields encrypted
  - Backups encrypted
  
✓ Audit
  - All actions logged
  - Logs immutable
  - Retention 7 years (Saudi requirement)
  
✓ Network
  - WAF (Web Application Firewall)
  - DDoS protection (Cloudflare)
  - VPN for admin access
  - Whitelisted IPs for ZATCA
  
✓ Compliance
  - PDPL Saudi compliant
  - ZATCA compliant
  - Annual penetration test
```

#### Incident Response Plan
```
في حال اختراق:
1. خلال 1 ساعة: عزل النظام المتأثر
2. خلال 4 ساعات: تحديد نطاق الاختراق
3. خلال 24 ساعة: إبلاغ العملاء
4. خلال 72 ساعة: إبلاغ السلطات (PDPL)
5. تحقيق Forensic
6. تطبيق الإصلاحات
7. تقرير ما بعد الحادثة
```

---

## 9️⃣ Deployment Plan

### المحتوى

#### Pre-deployment Checklist
```
□ كل الـ tests نجحت
□ Code review completed
□ Database migrations dry-run on staging
□ Backup created
□ Rollback plan documented
□ Maintenance window approved
□ Customer notification sent (T-24h)
□ Team on standby
```

#### Deployment Runbook
```
T-00:00: Maintenance mode ON
T-00:05: Final backup
T-00:10: Run migrations
T-00:25: Deploy new code
T-00:30: Run smoke tests
T-00:35: Verify critical paths:
  - Login works
  - Invoice creation works
  - ZATCA submission works
  - Reports generate
T-00:45: Maintenance mode OFF
T-01:00: Monitor for 1 hour
T-02:00: Send "all clear" to customers
```

#### Rollback Plan
```
إذا فشل النشر:
1. Maintenance mode ON
2. Restore database from backup
3. Deploy previous version
4. Verify
5. Maintenance mode OFF
6. Investigate root cause
7. Plan retry
```

---

## 🔟 Style Guide / Design System

### المحتوى
- **Color Palette** (الألوان الموحدة)
- **Typography** (الخطوط — حجم وعرض ووزن)
- **Spacing** (المسافات بين العناصر)
- **Components** (Buttons, Cards, Forms — موحدة)
- **Icons** (مكتبة الأيقونات)
- **Logo Usage** (متى وكيف يستخدم الشعار)

### أمثلة Design Systems معروفة
- **Material Design** (Google)
- **Ant Design** (Alibaba)
- **Tailwind UI** (للـ Tailwind)
- **shadcn/ui** (المفضل للـ Next.js — موجود غالباً عندك)

### الأدوات
- **Figma** + **Tokens Studio**
- **Storybook** (لعرض المكونات الموحدة)

---

## 1️⃣1️⃣ i18n Translation Files (الترجمة)

عندك جزئياً (all_ar.json, all_en.json) لكن تحتاج:
- مفتاح موحد لكل نص
- تنظيم بالـ namespace (sales.invoice.title بدلاً من sales_invoice_title)
- دعم للجمع (plurals)
- دعم للتنسيق (numbers, dates, currencies)
- مراجعة لغوية احترافية للترجمات

### الأدوات
- **i18next** (موجود غالباً)
- **Crowdin** (لإدارة الترجمات مع مترجمين)
- **Lokalise**

---

## 1️⃣2️⃣ Sample Data / Seeders

### ما تحتاجه
- بيانات تجريبية جاهزة للـ Development
- بيانات للـ Demo (لعرض النظام للعملاء المحتملين)
- بيانات للـ Tutorial (لتدريب المستخدمين)

### مثال
```javascript
// scripts/seed-demo.js
- 1 شركة وهمية (شركة المخزن الذكي)
- 50 عميل
- 30 مورد
- 200 منتج (مع variants, batches, serials)
- 3 مستودعات
- 100 فاتورة بيع تاريخية
- 80 فاتورة شراء
- 30 موظف مع رواتب 12 شهر
- 10 أصول ثابتة (متنوعة)
- 5 آلات تصنيع
- شجرة حسابات SOCPA كاملة
```

---

## 1️⃣3️⃣ Migration Scripts (لعملائك الحاليين)

### ما تحتاجه
- استيراد من Excel
- استيراد من Onyx Pro
- استيراد من Aliphia
- استيراد من DEXEF
- استيراد من QuickBooks
- استيراد من SAP B1

### قالب لكل migration
```typescript
// migrations/from-excel/customers.ts
export async function migrateCustomersFromExcel(filePath: string, tenantId: string) {
  // 1. Read Excel
  // 2. Validate each row
  // 3. Map to your schema
  // 4. Insert with transaction
  // 5. Return success/failed report
}
```

---

## 1️⃣4️⃣ User Manual

### للمستخدم النهائي (المحاسب)
```
1. مقدمة
2. تسجيل الدخول
3. شجرة الحسابات
   3.1 إضافة حساب جديد
   3.2 تعديل حساب
   3.3 إلغاء حساب
4. القيود اليومية
   4.1 قيد يدوي
   4.2 قيد تلقائي
   4.3 عكس قيد
5. الفواتير
6. ...إلخ
```

### للمدير (CFO)
```
1. الـ Dashboard
2. التقارير المالية
3. الميزانيات
4. تحليلات AI CFO
```

### للمسؤول (Admin)
```
1. إدارة المستخدمين
2. الصلاحيات
3. الإعدادات
4. النسخ الاحتياطي
5. ZATCA setup
```

### الأدوات
- **GitBook** (الأفضل لـ Saudi)
- **Mintlify** (حديث وجميل)
- **Docusaurus** (مفتوح المصدر)
- **Word/PDF** (الأبسط للبدء)

---

## 1️⃣5️⃣ Training Videos

### الفيديوهات الأساسية المطلوبة
1. مقدمة (5 دقائق) — نظرة عامة
2. كيف تنشئ شركتك الأولى (10 دقائق)
3. كيف تعد شجرة الحسابات (10 دقائق)
4. كيف تنشئ فاتورة (5 دقائق)
5. كيف تعد ZATCA (15 دقائق)
6. كيف تشغل الرواتب (15 دقائق)
7. كيف تقفل الفترة (20 دقائق)
8. كيف تستخرج التقارير (10 دقائق)
9. كيف تستخدم AI CFO (10 دقائق)
10. كيف تتعامل مع الأخطاء الشائعة (15 دقائق)

**~10 فيديوهات × 10 دقائق = ساعة ونصف**

### الأدوات
- **Loom** (الأسهل)
- **Camtasia** (احترافي)
- **OBS Studio** (مجاني)

### النشر
- **YouTube** (قناة الشركة)
- **داخل النظام** (help section)
- **Knowledge base** (gitbook/intercom)

---

## 1️⃣6️⃣ Legal & Compliance Documents

### الوثائق المطلوبة
1. **Terms of Service (شروط الخدمة)**
   - من محامي
   - بالعربية والإنجليزية
   - 5,000-15,000 ريال

2. **Privacy Policy (سياسة الخصوصية)**
   - متوافقة مع PDPL سعودي
   - تذكر كل أنواع البيانات المجمّعة

3. **Data Processing Agreement (DPA)**
   - للعملاء الشركات
   - تحدد مسؤوليات حفظ البيانات

4. **SLA (Service Level Agreement)**
   - وعود الـ uptime (مثلاً 99.5%)
   - زمن الاستجابة للدعم
   - تعويضات في حال الفشل

5. **Cookie Policy**
   - إذا الموقع يستخدم cookies

6. **Refund Policy**
   - متى يحق للعميل الاسترداد
   - الإجراءات

7. **Compliance Certificates**
   - ZATCA
   - GOSI registration
   - SOCPA endorsement
   - SAMA compliance (إذا ينطبق)

---

## 📊 ملخص: ماذا تفعل الآن؟

### للمشروع الواحد، الترتيب المثالي:

```
1. اختر ميزة واحدة من البرومنت (مثلاً Period Close Engine)
   ↓
2. ارسم Flow (لديك القالب)
   ↓
3. اعرضه على CPA → موافقة
   ↓
4. ارسم Wireframes للشاشات
   ↓
5. اعرضها على عميل → تعديلات
   ↓
6. اكتب User Stories + Acceptance Criteria
   ↓
7. صمم الـ Database (إذا حقول جديدة) → ERD
   ↓
8. صمم الـ API endpoints
   ↓
9. اكتب Test Cases
   ↓
10. الآن استخدم البرومنت → كود
   ↓
11. شغل الاختبارات
   ↓
12. اختبر على Staging
   ↓
13. مراجعة المحاسب
   ↓
14. وثّق في User Manual
   ↓
15. اصنع فيديو تدريبي قصير
   ↓
16. أصدر للعميل التجريبي
   ↓
17. اجمع feedback
   ↓
18. كرر للميزة التالية
```

---

## 💎 الحقيقة المُرّة

**الناس يعتقدون أن البرمجة هي 80% من العمل.**
**الحقيقة: البرمجة 20% فقط.**

```
الوقت الفعلي لميزة واحدة:
- 10% فهم المتطلب
- 15% تصميم Flow + Wireframe + ERD
- 10% مراجعة CPA + عميل
- 10% كتابة API specs + Test cases
- 25% البرمجة الفعلية
- 15% الاختبار
- 5% النشر
- 10% التوثيق + التدريب
```

إذا أهملت أي خطوة، تدفع ثمنها لاحقاً **بأضعاف** التكلفة.

---

## 🎯 الخلاصة النهائية

**جدول كل الوثائق:**

| ما لديك ✅ | ما تحتاجه ❌ |
|-----------|-------------|
| Master Prompt | Wireframes (Figma) |
| Business Flows | ERD Diagram |
| What You Need Doc | API Specs (OpenAPI) |
| Code base أساسي | User Stories |
| | Test Cases |
| | Data Dictionary |
| | Architecture Doc |
| | Security Plan |
| | Deployment Plan |
| | Style Guide |
| | i18n كامل |
| | Sample Data |
| | Migration Scripts |
| | User Manual |
| | Training Videos |
| | Legal Docs |

### الأولوية الفورية (هذا الشهر):
1. **Wireframes** للشاشات الجديدة (Figma)
2. **ERD** أوتوماتيكي من Prisma (`prisma-erd-generator`)
3. **API Specs** (Swagger)
4. **Security Plan** (نموذج بسيط)

### بعد ذلك (الأشهر 2-3):
5. **User Stories** لكل ميزة
6. **Test Plan** أساسي
7. **Migration Scripts** للـ Excel
8. **User Manual** (مبدئي)

### قبل الإطلاق العام:
9. **Legal Docs** (محامي)
10. **Training Videos**
11. **Compliance Certificates**

---

**تذكّر:** البرومنت يكتب الكود. الفلو يحدد المنطق. لكن **التصميم والتوثيق هم اللذان يفرقان نظامك عن الفوضى.**

---

**انتهى الدليل**
