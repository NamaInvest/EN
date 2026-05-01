# Namasoft ERP — AI Agent Context

> **هذا الملف يُقرأ تلقائياً من قبل Claude Code وأي AI يعمل على هذا المشروع.**
> **يحتوي على كل القرارات المعمارية والقواعد الإلزامية.**

---

## 1. هوية المشروع

**Namasoft ERP** — نظام تخطيط موارد المؤسسات السعودي متعدد المستأجرين.
- **Stack:** Next.js 16 + Prisma + PostgreSQL + TypeScript + Tailwind + Clerk
- **Platform:** Web SaaS + Desktop (Electron) + PWA
- **Region:** Saudi Arabia (primary), GCC (secondary)
- **Compliance:** ZATCA Phase 2, SOCPA, Saudi Labor Law, PDPL, GOSI

**اللغة:**
- الكود: إنجليزي
- التعليقات والـ commit messages: إنجليزي (للوضوح التقني)
- النصوص للمستخدم: عربي (RTL) + إنجليزي
- المحادثة مع المستخدم في Claude: عربي

---

## 2. الوثائق المرجعية الإلزامية

> **يجب الرجوع لها قبل أي تغيير معماري أو ميزة جديدة.**

| الوثيقة | استخدمها عند | المسار |
|---------|---------------|---------|
| **GLOBAL_ERP_GAP_ANALYSIS.md** | تطوير ميزة محاسبية/مالية | `./GLOBAL_ERP_GAP_ANALYSIS.md` |
| **BUSINESS_FLOWS_GUIDE.md** | فهم منطق دورة الأعمال | `./BUSINESS_FLOWS_GUIDE.md` |
| **WHAT_YOU_STILL_NEED.md** | قرارات الفريق والميزانية | `./WHAT_YOU_STILL_NEED.md` |
| **COMPLETE_ARTIFACTS_CHECKLIST.md** | قبل البدء بميزة جديدة | `./COMPLETE_ARTIFACTS_CHECKLIST.md` |
| **104_modules_checklist.md** | قائمة الموديولات الكاملة | `./104_modules_checklist.md` |
| **SYSTEM_MASTER_GUIDE.md** | دليل التشغيل | `./SYSTEM_MASTER_GUIDE.md` |
| **prisma/schema.prisma** | قاعدة البيانات | `./prisma/schema.prisma` |

---

## 3. القواعد الإلزامية (لا تتجاوزها)

### 3.1 المحاسبة
- ❌ **لا تكتب على الحسابات الرقابية يدوياً** (RECEIVABLES, PAYABLES, INVENTORY, GR/IR)
- ✅ كل قيد يجب أن يكون متوازناً (Debit = Credit) بـ tolerance 0.01
- ✅ كل ميزة محاسبية جديدة تستخدم `src/lib/auto-journal.ts` — لا تكتب SQL مباشر للقيود
- ✅ عند تعديل auto-journal: اعرض المنطق المحاسبي للمستخدم للتأكيد قبل الكود
- ❌ لا تعدّل قيد POSTED — أنشئ reversal entry بدلاً من ذلك
- ❌ لا تعدّل فاتورة بعد ZATCA clearance — أصدر credit note

### 3.2 ZATCA E-Invoicing
- استخدم المسار الموجود `src/app/api/zatca/route.ts`
- **لا تعدّل** على XML signing logic بدون اختبار في sandbox أولاً
- ICV و PIH **يجب** أن يبقيا متسلسلين بدون فجوات
- استخدم `zatca_invoice_counter` و `zatca_last_pih` من Settings

### 3.3 Multi-tenant
- كل query يجب أن يستخدم `tenantId` من الـ middleware
- **لا تستخدم الـ Master DB من API routes للـ tenant data**
- الـ Master DB فقط للـ tenant routing وللـ system-wide settings

### 3.4 Database
- استخدم **Prisma transactions** للعمليات التي تشمل أكثر من جدول
- استخدم `SERIALIZABLE` isolation level للـ counters و numbering
- **لا تكسر الـ migrations الموجودة** — أنشئ migration جديد
- كل field رقمي مالي يستخدم `Decimal` (مع scale: 4 على الأقل)
- لا تستخدم `Float` للمبالغ المالية

### 3.5 الأمان
- ❌ لا تخزن كلمات سر في الكود
- ✅ كل API route يتحقق من الـ session
- ✅ Validate inputs بـ Zod
- ❌ لا raw SQL إلا بعد escape كامل (استخدم Prisma بدلاً)
- ✅ Rate limiting على الـ public APIs

### 3.6 الأداء
- استخدم `select` و `include` بحكمة في Prisma (لا تجلب كل البيانات)
- استخدم indexes للحقول التي تُفلتر/تُرتب عليها
- pagination إجبارية لأي list endpoint
- avoid N+1 queries

### 3.7 الكود
- TypeScript strict mode
- لا `any` (استخدم `unknown` ثم تحقق)
- React Server Components افتراضياً (Client فقط عند الحاجة)
- استخدم `'use client'` صراحة
- اتبع conventions الموجودة في الكود (لا تخترع style جديد)

---

## 4. منهجية تطوير الميزات (Feature Development Methodology)

### الترتيب الإجباري لأي ميزة جديدة:

```
1. اقرأ الـ Gap Analysis للموديول المعني
   ↓
2. ارسم/راجع الـ Business Flow
   ↓
3. تحقق من المنطق المحاسبي (مع المستخدم/CPA)
   ↓
4. صمم Prisma schema changes (مع migration plan)
   ↓
5. حدد API endpoints (RESTful)
   ↓
6. اكتب unit tests أولاً (TDD حيث أمكن)
   ↓
7. اكتب الكود
   ↓
8. اكتب integration tests
   ↓
9. وثّق في README الموديول
   ↓
10. اعرض diff للمستخدم قبل commit
```

### للأخطاء (Bug Fixes):
1. اعد إنتاج الخطأ
2. اكتب test يكشف الخطأ (failing test)
3. أصلح الكود
4. تأكد أن الـ test يمر
5. تحقق من عدم كسر اختبارات أخرى
6. وثّق في git commit message

---

## 5. أولويات التطوير الحالية

استند للترتيب من **GLOBAL_ERP_GAP_ANALYSIS.md → القسم 6: خارطة الطريق**

### المرحلة 0 — Foundation (الأهم الآن)
- [ ] Numbering Sequences Engine
- [ ] Document State Machine
- [ ] Field-Level Audit Trail
- [ ] Period Close Engine
- [ ] Approval Workflow Engine

> **عند البدء بأي ميزة من هذه:** اقرأ البرومنت المتعلق في `GLOBAL_ERP_GAP_ANALYSIS.md`.

---

## 6. الفلوهات المرجعية

> **استند لها لفهم منطق العمل قبل الكود.**

في `BUSINESS_FLOWS_GUIDE.md` ستجد 18 فلو رسومي:
- Quote-to-Cash, Procure-to-Pay, Hire-to-Retire, Record-to-Report
- Plan-to-Produce, Acquire-to-Retire, POS Flow
- Approval workflows (JE, PO, Vendor, Leave)
- State machines (Invoice, MO, Check, Asset)
- Period Close, ZATCA, WPS, Three-Way Match, Bank Recon

**عند تطوير ميزة:** افتح الـ guide → ابحث عن الـ flow المعني → اتبعه حرفياً.

---

## 7. الفجوات المعروفة (للتركيز)

من الـ Gap Analysis، هذه أكبر الفجوات (نسبة الاكتمال):

| الموديول | الاكتمال | الأولوية |
|----------|----------|----------|
| الأصول الثابتة | 18% | 🔴 |
| الخزينة والبنوك | 25% | 🔴 |
| الامتثال السعودي (غير ZATCA) | 18% | 🔴 |
| AR/AP وإدارة الائتمان | 35% | 🟠 |
| المخزون المتقدم | 34% | 🟠 |
| التصنيع | 40% | 🟠 |
| HR والرواتب | 45% | 🟠 |
| التقارير المالية | 50% | 🟡 |
| المحاسبة الأساسية | 65% | 🟡 |

**عند سؤال المستخدم "ما التالي؟":** اقترح من القائمة العلوية + اربط بالـ business value.

---

## 8. السياق التقني المهم

### قاعدة البيانات
- 157 نموذج Prisma
- Multi-tenant (database-per-tenant) عبر Master DB
- Schema متعدد المستويات (شجرة حسابات، BOM، إلخ)

### المسارات الرئيسية
```
src/app/api/accounting/        ← شجرة الحسابات، القيود، التقارير
src/app/api/finance/           ← الشيكات، العهد، التسويات البنكية
src/app/api/manufacturing/     ← BOM, MRP, WO, QC, WIP
src/app/api/hr/                ← الموظفين، الإجازات، التدريب
src/app/api/payroll/           ← الرواتب، GOSI
src/app/api/sales/             ← المبيعات، POS
src/app/api/purchases/         ← المشتريات، GRN، RFQ، PR
src/app/api/zatca/             ← الفوترة الإلكترونية
src/app/api/inventory/         ← المخزون، التقييم
src/app/api/reports/           ← التقارير
src/lib/auto-journal.ts        ← محرك القيود التلقائية
src/lib/costing.ts             ← FIFO/LIFO/Average
prisma/schema.prisma           ← المخطط
```

### المكتبات الأساسية
- ORM: Prisma 5.22
- Auth: Clerk 7
- UI: Tailwind 4 + shadcn/ui patterns
- Forms: react-hook-form (إن وجد)
- Validation: Zod 4
- Tables: tanstack/react-table (إن وجد)
- Charts: Recharts 3
- AI: Google Gemini (CFO, OCR, Bank Analysis)

---

## 9. القرارات الإلزامية للسعودية

### 9.1 شجرة الحسابات
- استخدم SOCPA template كنقطة بداية
- 4 أرقام للحسابات الرئيسية + sub-codes
- التصنيف: 1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Revenue, 5xxx Expenses

### 9.2 ZATCA
- Phase 2 إجباري لجميع الفواتير
- استخدم `Settings.zatca_environment` للتبديل sandbox/production
- ICV يبدأ من 1 ولا يتوقف
- PIH للفاتورة الأولى = 64-char zero hash

### 9.3 الرواتب
- GOSI: 9% موظف + 9% منشأة + 2% SANED
- WPS: SIF format للبنك السعودي
- EOS: حسب نظام العمل السعودي (المادة 84-85)
- نهاية الأسبوع: الجمعة + السبت

### 9.4 الضرائب
- VAT: 15% الافتراضي
- Zakat: 2.5% (للسعوديين)
- WHT: 5-20% حسب نوع الخدمة (للموردين الأجانب)

### 9.5 العملة
- العملة الأساسية: SAR (Saudi Riyal)
- ExchangeRate يومي
- FX Revaluation شهرياً

---

## 10. أنماط التواصل مع المستخدم

### 10.1 المستخدم الرئيسي (مالك المشروع)
- **اللغة:** عربي
- **المستوى التقني:** متوسط (يفهم البرمجة لكنه ليس مطوراً سينيور)
- **الأسلوب المفضل:** عملي، خطوات واضحة، أمثلة ملموسة
- **يكره:** الإفراط في التفاصيل النظرية بدون تطبيق

### 10.2 قبل أي تغيير كبير
1. اشرح ما ستفعله (3 جمل)
2. اذكر التأثير على الكود الموجود
3. اطلب موافقة (نعم/لا)
4. ثم نفّذ

### 10.3 بعد التغيير
- أعرض diff/summary موجز
- اذكر اختبارات يدوية مقترحة
- اقترح الخطوة التالية المنطقية

---

## 11. أوامر السلاش المفيدة (Custom Commands)

> **مُكوّنة في `.claude/commands/`**

- `/erp-build-feature [feature-name]` — اتباع المنهجية الكاملة لبناء ميزة
- `/erp-check-gap [module]` — فحص الفجوة لموديول معين
- `/erp-validate-je [code]` — التحقق من صحة المنطق المحاسبي
- `/erp-saudi-check [feature]` — التحقق من الامتثال السعودي
- `/erp-flow [flow-name]` — استعراض فلو معين

---

## 12. الوكلاء المتخصصون (Specialized Agents)

> **مُكوّنون في `.claude/agents/`**

- **erp-architect** — لقرارات معمارية كبيرة (schema، APIs)
- **accounting-validator** — للتحقق من المنطق المحاسبي
- **saudi-compliance** — للامتثال السعودي (ZATCA, GOSI, WPS, EOS)
- **prisma-schema-reviewer** — لمراجعة تغييرات schema
- **test-writer** — لكتابة test cases شاملة

استخدمهم عبر:
```
استخدم وكيل accounting-validator للتحقق من...
استخدم وكيل saudi-compliance للتأكد من...
```

---

## 13. سياسات الـ Git

- ❌ لا commit بدون اختبار
- ❌ لا commit مباشر على `main` — استخدم branch
- ✅ Commit messages بالإنجليزية، format: `feat|fix|refactor|docs(module): description`
- ✅ كل commit مرتبط بـ task/issue إن وجد
- ✅ قبل push: `npm run lint && npm run typecheck`

---

## 14. متى تسأل المستخدم؟

**اسأل دائماً قبل:**
- تعديل أكثر من 5 ملفات في PR واحد
- تغيير schema (Prisma migration)
- إضافة dependency جديد
- تعديل المنطق المحاسبي
- تعديل ZATCA logic
- حذف كود
- إعادة هيكلة (refactor) كبيرة

**نفّذ مباشرة (مع تلخيص):**
- أخطاء واضحة (typos, bugs صغيرة)
- إضافة tests
- تحسين تعليقات
- تحديث documentation
- تحسين أداء بسيط

---

## 15. ملاحظات نهائية

> **هدف المشروع:** الوصول إلى مستوى SAP/Oracle/NetSuite في 12-18 شهراً عبر تطبيق ممنهج.
>
> **الفلسفة:** البرمجة 25% من العمل. الباقي: تصميم + توثيق + اختبار + امتثال.
>
> **القاعدة الذهبية:** "اقرأ الفلو، استشر المحاسب، اكتب الـ test، ثم اكتب الكود."

---

**آخر تحديث:** 2026-05-01
**المؤلف:** نظام التخطيط المعماري لـ Namasoft ERP
**يُحدّث:** عند إضافة موديول جديد أو تغيير قاعدي
