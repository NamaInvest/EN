# 19 - قواعد CLAUDE.md المُلزمة (Consolidated Mandatory Rules)

> هذا الملف تلخيص لـ `CLAUDE.md` في الجذر — اقرأه قبل أي قرار

---

## 🎯 هوية المشروع

- **الاسم:** Namasoft ERP (Nama Invest)
- **النوع:** Multi-Tenant SaaS ERP
- **الجمهور:** السعودية + الخليج (SMEs → Enterprise)
- **الإصدار:** 2.4.8
- **Stack:** Next.js 16 + Prisma 5.22 + PostgreSQL + TypeScript + Tailwind 4 + Clerk 7

---

## 📚 الوثائق الإلزامية

| الوثيقة | متى ترجع إليها |
|---|---|
| `GLOBAL_ERP_GAP_ANALYSIS.md` | قبل ميزة محاسبية/مالية |
| `BUSINESS_FLOWS_GUIDE.md` | لفهم منطق دورة الأعمال |
| `WHAT_YOU_STILL_NEED.md` | لقرارات الفريق والميزانية |
| `COMPLETE_ARTIFACTS_CHECKLIST.md` | قبل ميزة جديدة |
| `104_modules_checklist.md` | لقائمة الموديولات (قديم، الفعلي 109+) |
| `SYSTEM_MASTER_GUIDE.md` | لدليل التشغيل |
| `prisma/schema.prisma` | للنماذج (607 جدول) |

---

## 🛑 القواعد الإلزامية (لا تتجاوزها)

### المحاسبة:
- ❌ **لا تكتب يدوياً على الحسابات الرقابية:** RECEIVABLES, PAYABLES, INVENTORY, GR/IR
- ✅ كل قيد متوازن (Dr = Cr) بـ tolerance 0.01
- ✅ كل ميزة محاسبية تستخدم `src/lib/auto-journal.ts`
- ✅ عرض المنطق المحاسبي قبل التطبيق
- ❌ لا تعدل قيد POSTED — أنشئ reversal entry
- ❌ لا تعدل فاتورة بعد ZATCA clearance — أصدر credit note

### ZATCA:
- ✅ استخدم `src/app/api/zatca/route.ts` الموجود
- ❌ لا تعدل XML signing بدون اختبار sandbox
- ✅ ICV و PIH متسلسلين بدون فجوات
- ✅ استخدم `zatca_invoice_counter` و `zatca_last_pih`

### Multi-tenant:
- ✅ كل query يستخدم `tenantId` من الـ middleware
- ❌ لا تستخدم Master DB من API routes للـ tenant data
- ✅ Master DB فقط للـ routing و system settings

### Database:
- ✅ Prisma transactions للعمليات متعددة الجداول
- ✅ SERIALIZABLE للـ counters
- ❌ لا تكسر migrations موجودة
- ✅ Decimal(18,4) للمبالغ المالية — لا Float
- ✅ `prisma db push` فقط (لا migrate dev)

### الأمان:
- ❌ لا تخزن كلمات سر في الكود
- ✅ كل API route يتحقق من الـ session
- ✅ Validate inputs بـ Zod
- ❌ لا raw SQL — استخدم Prisma
- ✅ Rate limiting على الـ public APIs

### الأداء:
- ✅ `select` و `include` بحكمة
- ✅ Indexes للحقول المُفلترة
- ✅ Pagination إجبارية
- ❌ تجنب N+1 queries

### الكود:
- ✅ TypeScript strict
- ❌ لا `any` (استخدم `unknown` ثم تحقق)
- ✅ React Server Components افتراضياً
- ✅ `'use client'` صراحة عند الحاجة
- ✅ اتبع conventions الموجودة

---

## 🔄 منهجية تطوير الميزة الجديدة

```
1. اقرأ الـ Gap Analysis
       ↓
2. ارسم/راجع الـ Business Flow
       ↓
3. تحقق من المنطق المحاسبي
       ↓
4. صمم Prisma schema changes
       ↓
5. حدد API endpoints (RESTful)
       ↓
6. اكتب unit tests أولاً (TDD)
       ↓
7. اكتب الكود
       ↓
8. integration tests
       ↓
9. وثّق في README
       ↓
10. اعرض diff قبل commit
```

### للـ Bug Fix:
1. أعد إنتاج الـ bug
2. اكتب failing test
3. أصلح الكود
4. تأكد أن test يمر
5. تحقق من عدم كسر اختبارات أخرى
6. وثّق في commit message

---

## 🚀 أولويات التطوير (Phase 0 — الآن)

- [ ] Numbering Sequences Engine (تحسين)
- [ ] Document State Machine الموحد
- [ ] Field-Level Audit Trail
- [ ] Period Close Engine الكامل
- [ ] Approval Workflow Engine

---

## 📊 الفجوات الكبرى (للتركيز)

| الموديول | الاكتمال | الأولوية |
|---|---|---|
| الأصول الثابتة | 18% | 🔴 |
| الخزينة والبنوك | 25% | 🔴 |
| الامتثال السعودي (غير ZATCA) | 18% | 🔴 |
| AR/AP وإدارة الائتمان | 35% | 🟠 |
| المخزون المتقدم | 34% | 🟠 |
| التصنيع | 40% | 🟠 |
| HR والرواتب | 45% | 🟠 |
| التقارير المالية | 50% | 🟡 |
| المحاسبة الأساسية | 65% | 🟡 |

---

## 🌐 السياق التقني المهم

### قاعدة البيانات:
- 607 نموذج Prisma
- Multi-tenant (database-per-tenant) — **Phase 2 active**
- Schema متعدد المستويات

### المسارات الرئيسية:
```
src/app/api/accounting/        ← شجرة الحسابات، القيود
src/app/api/finance/           ← الشيكات، التسويات
src/app/api/manufacturing/     ← BOM, MRP, WO, QC
src/app/api/hr/                ← الموظفين، الإجازات
src/app/api/payroll/           ← الرواتب، GOSI
src/app/api/sales/             ← المبيعات، POS
src/app/api/purchases/         ← المشتريات، GRN
src/app/api/zatca/             ← الفوترة الإلكترونية
src/app/api/inventory/         ← المخزون
src/app/api/reports/           ← التقارير
src/lib/auto-journal.ts        ← محرك القيود
src/lib/costing.ts             ← FIFO/LIFO/Average
prisma/schema.prisma           ← المخطط
```

---

## 🇸🇦 القرارات الإلزامية للسعودية

### COA:
- استخدم SOCPA template
- 4 أرقام للحسابات الرئيسية
- 1xxx Assets, 2xxx Liabilities, 3xxx Equity, 4xxx Revenue, 5xxx Expenses

### ZATCA:
- Phase 2 إجباري
- `Settings.zatca_environment` للتبديل sandbox/production
- ICV من 1 بدون توقف
- PIH للأولى = 64 صفر

### الرواتب:
- GOSI: 9% موظف + 9% منشأة + 2% SANED
- WPS: SIF format
- EOS: نظام العمل المادة 84-85
- نهاية الأسبوع: جمعة + سبت

### الضرائب:
- VAT: 15% افتراضي
- Zakat: 2.5%
- WHT: 5-20% للأجانب

### العملة:
- الأساسية SAR
- ExchangeRate يومي
- FX Revaluation شهرياً

---

## 💬 أنماط التواصل

### المستخدم الرئيسي:
- **اللغة:** عربي
- **المستوى:** متوسط (يفهم البرمجة لكنه ليس senior)
- **التفضيل:** عملي، خطوات واضحة
- **يكره:** الإفراط في النظرية

### قبل تغيير كبير:
1. اشرح ما ستفعله (3 جمل)
2. اذكر التأثير
3. اطلب موافقة
4. نفّذ

### بعد التغيير:
- اعرض diff/summary موجز
- اقترح اختبارات يدوية
- اقترح الخطوة التالية

---

## 🔔 متى تسأل؟

### اسأل قبل:
- تعديل > 5 ملفات
- تغيير schema
- إضافة dependency
- تعديل منطق محاسبي
- تعديل ZATCA
- حذف كود
- Refactor كبير

### نفّذ مباشرة:
- typos / bugs صغيرة
- إضافة tests
- تحسين تعليقات
- تحديث docs
- تحسين أداء بسيط

---

## 🛠 الأوامر المفيدة

```bash
# /erp-build-feature [feature-name] — منهجية كاملة
# /erp-check-gap [module] — فحص الفجوة
# /erp-validate-je [code] — صحة المنطق المحاسبي
# /erp-saudi-check [feature] — الامتثال السعودي
# /erp-flow [flow-name] — استعراض فلو
# /erp-status — حالة المشروع
```

---

## 🤖 الوكلاء المتخصصون

- **erp-architect** — قرارات معمارية كبيرة
- **accounting-validator** — التحقق من المنطق المحاسبي
- **saudi-compliance** — الامتثال السعودي
- **prisma-schema-reviewer** — مراجعة schema
- **test-writer** — كتابة tests

---

## 📜 سياسات Git

- ❌ لا commit بدون اختبار
- ❌ لا commit مباشر على main
- ✅ Commit messages إنجليزي: `feat|fix|refactor|docs(module): description`
- ✅ كل commit مرتبط بـ task
- ✅ قبل push: `npm run lint && npm run typecheck`

---

## 🌟 الفلسفة

> **"البرمجة 25% من العمل. الباقي: تصميم + توثيق + اختبار + امتثال."**

> **القاعدة الذهبية:** "اقرأ الفلو، استشر المحاسب، اكتب الـ test، ثم اكتب الكود."

> **هدف المشروع:** الوصول لمستوى SAP/Oracle/NetSuite في 12-18 شهراً.
