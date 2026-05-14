# Nama Invest ERP - Agent Rules

## قاعدة إلزامية
لا تبدأ كتابة الكود قبل تنفيذ مرحلة الفحص.

هذا مشروع Enterprise ERP، وليس مشروع CRUD عادي.

---

## 1. قبل أي تعديل

يجب عليك أولًا قراءة:

- 00-index.md
- 01-architecture.md
- 02-database.md
- 05-business-logic.md
- 14-modules-map.md
- 17-gap-analysis.md
- 19-claude-rules.md
- /project-governance/*
- /project-ops/*

إذا كان الطلب متعلقًا بقسم معين، اقرأ ملفه:
- accounting → 20-accounting-domain.md
- sales / pos → 21-sales-pos.md
- purchases → 22-purchases.md
- inventory → 23-inventory.md
- manufacturing → 24-manufacturing.md
- hr / payroll → 25-hr-payroll.md
- assets → 26-assets.md
- treasury → 27-treasury-banks.md
- ai → 28-ai-features.md و 36-ai-architecture.md
- desktop → 29-electron-desktop.md و 38-electron-internals.md
- ice → 30-master-ice.md

---

## 2. لا تفحص ربع الكود فقط

قبل التنفيذ، أنشئ ملفًا مؤقتًا:

`/tmp/agent-scan-report.md`

واكتب فيه:

1. الملفات التي قرأتها
2. الملفات المرشحة للتعديل
3. الدومينات المتأثرة
4. المخاطر
5. خطة التنفيذ
6. خطة الاختبار

إذا لم تقرأ الملفات المرتبطة، لا تنفذ.

---

## 3. طريقة الفحص الإجباري

نفذ هذه الخطوات:

### أ. افهم الطلب
اكتب:
- ما المطلوب؟
- ما المشكلة؟
- أين الدومين؟
- هل هو مالي أو أمني أو Tenant أو Desktop؟

### ب. ابحث في المشروع
استخدم البحث عن:
- اسم الصفحة
- اسم API
- اسم model
- اسم route
- اسم component
- اسم engine
- الكلمات المفتاحية المتعلقة بالمشكلة

### ج. اقرأ الملفات المرتبطة
لا تعتمد على أول نتيجة فقط.

### د. ابنِ خريطة تأثير
حدد:
- frontend
- backend
- database
- permissions
- tenant
- tests
- docs

### هـ. نفذ أصغر تعديل آمن
لا تعد كتابة module كامل.

---

## 4. ممنوعات

ممنوع نهائيًا:

- تعديل posted journals
- تعديل ZATCA cleared invoices
- حذف قيود مالية
- query بدون tenant
- cache بدون tenant
- event بدون tenant
- bypass permissions
- direct PrismaClient جديد
- destructive migration
- rewrite كامل بدون إذن
- تعديل أكثر من نطاق الطلب
- إضافة feature غير مطلوبة
- استخدام any بدون سبب
- استخدام Float للأموال
- ترك TODO أو placeholder
- تشغيل أوامر حذف خطيرة

---

## 5. أوامر خطيرة ممنوعة بدون موافقة صريحة

لا تشغل أبدًا بدون موافقة:

```bash
rm -rf
del /s
rmdir /s
git reset --hard
git clean -fd
dropdb
DROP DATABASE
DROP TABLE
prisma db push --force-reset
docker system prune
```

إذا احتجت حذف شيء، اشرح السبب وانتظر موافقة.

---

## 6. قبل تعديل أي ملف مالي

إذا التعديل يمس:

- accounting
- invoices
- ZATCA
- payroll
- treasury
- inventory valuation
- period close

يجب أن تكتب أولًا:

هذا تعديل مالي عالي الخطورة.
لن أعدل الكود قبل تحديد:
- الأثر المحاسبي
- الجداول المتأثرة
- القيود المتأثرة
- الاختبارات المطلوبة
- طريقة rollback

---

## 7. طريقة التنفيذ

نفذ على مراحل:

1. scan
2. plan
3. implement small patch
4. run tests
5. report

بعد كل مرحلة اكتب ملخصًا.

---

## 8. الاختبارات

بعد التعديل شغّل المناسب:

```bash
npm run typecheck
npm run lint
npm run test:unit
```

إذا مالي:

```bash
npm run test:financial
```

إذا واجهة:

```bash
npm run test:e2e
```

إذا API:

```bash
npm run test:integration
```

إذا لم تستطع تشغيل اختبار، اذكر السبب بوضوح.

---

## 9. بعد الانتهاء

اكتب تقريرًا:

تم التنفيذ.

الملفات التي قرأتها:
- ...

الملفات المعدلة:
- ...

ما تغير:
- ...

الأقسام المتأثرة:
- ...

الاختبارات:
- ...

المخاطر المتبقية:
- ...

هل يحتاج تحديث Brain؟
- نعم/لا

---

## 10. قاعدة ذهبية

لا تخمّن.

إذا لم تفهم النظام:

- اقرأ أكثر
- ابحث أكثر
- اسأل قبل التعديل

الهدف ليس إنهاء المهمة بسرعة.
الهدف حماية نظام ERP مالي متعدد الشركات.

---

# Workflow للمهام الكبيرة (Prompt for User)

انسخ هذا البرومبت وأعطه للذكاء الصناعي عند بداية أي مهمة كبيرة:

```text
لا تبدأ بالكود الآن.

نفذ أولًا مرحلة SCAN ONLY.

المطلوب:
1. اقرأ ملفات الـ Brain والقواعد المرتبطة بالمهمة.
2. ابحث في المشروع عن كل الملفات المتعلقة بالطلب.
3. لا تعدل أي ملف.
4. أنشئ تقرير:
   - ما فهمته
   - الملفات التي قرأتها
   - الملفات المحتمل تعديلها
   - الدومينات المتأثرة
   - المخاطر
   - خطة تنفيذ صغيرة وآمنة
   - خطة اختبار
5. توقف بعد التقرير وانتظر موافقتي.

ممنوع كتابة كود في هذه المرحلة.
```

**بعد الموافقة، استخدم هذا البرومبت:**

```text
وافقنا على الخطة.

نفذ المرحلة الأولى فقط من الخطة.
لا تعدل أي شيء خارج الملفات المذكورة.
بعد التنفيذ:
- اذكر الملفات المعدلة
- شغّل الاختبارات المناسبة
- اذكر أي فشل
- لا تنتقل للمرحلة الثانية بدون موافقتي
```

# Nama Invest ERP - Mandatory Operating Mode

## القاعدة الأساسية

هذا مشروع Enterprise ERP عالي التعقيد.

أي مهمة يجب أن تعامل كالتالي:

- Architectural task
- Multi-domain task
- Financially sensitive task
- Multi-tenant task

ممنوع الفحص السطحي.

---

# الوضع الافتراضي الإجباري

أي طلب من المستخدم يعني تلقائيًا:

```text
DEEP SCAN LEVEL 3

إلا إذا طلب المستخدم صراحة:

Quick Fix
Small UI Change
Tiny Refactor
أي مهمة يجب أن تبدأ تلقائيًا بـ:
قراءة ملفات الـ Brain
قراءة ملفات Governance
البحث في كامل المشروع
تحليل الـ Architecture
تحليل الـ Impact
تحليل الـ Risks
تحليل الـ Dependencies
تحليل الـ Workflows
تحليل الـ Events
تحليل الـ Permissions
تحليل Tenant Isolation
تحليل Financial Safety

قبل كتابة أي كود.

ممنوع
الفحص الجزئي
الاعتماد على أول search result
كتابة تقرير سطحي
افتراضات بدون Evidence
إصلاح موضعي بدون فهم التأثير
تعديل بدون Impact Analysis
تجاهل الـ workflows
تجاهل الـ events
تجاهل الـ permissions
تجاهل tenant logic
أي تقرير يجب أن يحتوي تلقائيًا:
Scope
Files scanned
Related domains
Architecture flow
Root cause
Secondary risks
Technical debt
Security risks
Tenant risks
Financial risks
Performance risks
Suggested fixes
Safer alternatives
Required tests
Rollback considerations
قبل أي تعديل

يجب إنشاء:

/tmp/agent-scan-report.md

ويحتوي:

ما تم فحصه
ما تم فهمه
الملفات المتأثرة
المخاطر
خطة التنفيذ
أي تعديل يجب أن يمر بالمراحل التالية
SCAN
↓
ARCHITECTURE ANALYSIS
↓
ROOT CAUSE ANALYSIS
↓
IMPACT ANALYSIS
↓
PLAN
↓
SMALL SAFE IMPLEMENTATION
↓
TESTING
↓
DOCUMENTATION UPDATE
↓
FINAL REPORT
Enterprise Audit Rule

إذا كانت المهمة تمس:

Accounting
ZATCA
Payroll
Tenant Isolation
Desktop Sync
Permissions
Subscriptions
EventBus
APIs
Database

فيجب تلقائيًا تشغيل:

ENTERPRISE AUDIT MODE

ويشمل:

Cross-domain analysis
Workflow analysis
Event flow analysis
Performance analysis
Security analysis
Financial analysis
Tenant isolation analysis
Large Project Rule

هذا المشروع ضخم جدًا.

إذا كان عدد الملفات المفحوصة قليلًا:
فالفحص غالبًا ناقص.

لا يعتبر الفحص مكتملًا حتى يتم:

تحليل الـ frontend
تحليل الـ backend
تحليل الـ database
تحليل الـ workflows
تحليل الـ events
تحليل الـ permissions
تحليل الـ tests
تحليل الـ docs
Root Cause Rule

ممنوع الاكتفاء بالأعراض.

يجب دائمًا تحديد:

السبب الجذري
سبب وجوده
لماذا لم يُكتشف سابقًا
ما الأنظمة المتأثرة
ما المخاطر المستقبلية
Financial Protection Rule

أي تعديل مالي يعتبر:
CRITICAL CHANGE

ممنوع:

تعديل posted records
تعديل closed periods
تعديل cleared invoices
bypass accounting engine
Tenant Protection Rule

أي احتمال cross-tenant leakage يعتبر:
CRITICAL SECURITY INCIDENT

AI Governance Rule

ممنوع على AI:

rewrite شامل بدون إذن
duplicate logic
architectural drift
inconsistent naming
bypass workflows
Golden Rule

الهدف ليس:
"إنهاء المهمة بسرعة"

الهدف:

حماية النظام
حماية البيانات
حماية المحاسبة
حماية الـ architecture
تقليل التعقيد
تحسين الاستقرار
تحسين maintainability

---

# 3. الآن أهم خطوة

في بداية كل جلسة معه قل فقط:

```text
اتبع AGENTS.md بالكامل.
```

## 27. ENTERPRISE ARCHITECTURAL AUDIT MODE ONLY

Quick Mode is permanently forbidden in this project.

Every task, even small UI or bug fixes, must follow:

1. SCAN ONLY
2. ROOT CAUSE ANALYSIS
3. IMPACT ANALYSIS
4. CROSS-DOMAIN AUDIT
5. RISK REPORT
6. PLAN ONLY
7. USER APPROVAL
8. IMPLEMENTATION
9. VERIFY + GIT SAFETY
10. FINAL REPORT

Mandatory checks:
- Financial Integrity impact
- Tenant Isolation impact
- Security impact
- API impact
- Database impact
- Workflow/Event Flow impact
- AI Brain consistency impact

Rules:
- Never write code before scan and plan.
- Never expand scope without approval.
- Never claim success without evidence.
- Never use quick fixes in financial, tenant, security, or inventory flows.
- Always update AI Brain after successful implementation.