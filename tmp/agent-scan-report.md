# تقرير الفحص والتحليل (Agent Scan Report)

> **المشروع:** Nama Invest ERP  
> **تاريخ الفحص:** 2026-05-31  
> **الهدف:** فحص معمارية محرك القيود التلقائية (Universal Journal) ونظام إقفال الفترات (16-Step Period Close Engine) وصياغة خطة عمل.

---

## 1. الملفات التي تم فحصها وقراءتها (Scanned Files)

تم فحص ومراجعة الملفات الهيكلية والتنظيمية والمحاسبية التالية:

### أ. ملفات معمارية وقواعد النظام (Brain & Governance):
- `.ai-brain/00-index.md` (فهرس الذاكرة الكامل)
- `.ai-brain/01-architecture.md` (المعمارية وعزل البيانات)
- `.ai-brain/02-database.md` (قواعد وجداول قاعدة البيانات)
- `.ai-brain/05-business-logic.md` (منطق دورات الأعمال والسيناريوهات)
- `.ai-brain/14-modules-map.md` (خريطة الموديولات والـ APIs)
- `.ai-brain/17-gap-analysis.md` (تحليل الفجوات وخطط التطوير)
- `.ai-brain/19-claude-rules.md` (تلخيص قواعد CLAUDE.md المُلزمة)
- `.ai-brain/20-accounting-domain.md` (معمارية موديول المحاسبة)
- `.ai-brain/53-period-end-procedures.md` (خطوات وإجراءات إقفال الفترات)
- `project-governance/03-FINANCIAL_INVARIANTS.md` (الثوابت المالية المحمية)
- `project-governance/06-ACCOUNTING_LOCK_RULES.md` (قواعد إقفال الحسابات والفترات)

### ب. ملفات الكود الفعلي (Source Code Files):
- `prisma/schema.prisma` (نموذج بيانات المستخدمين والمحاسبة والفترات)
- `src/lib/auto-journal.ts` (محرك توليد القيود المحاسبية التلقائية)
- `src/lib/services/accounting-journal.service.ts` (الخدمة المركزية لإنشاء القيود وتحديث الأرصدة)
- `src/lib/governance/period-lock.ts` (ضابط ومحقق أمان قفل الفترات الحالية `assertPeriodWritable`)
- `src/lib/period-close.ts` (المحرك الداخلي لـ PeriodCloseEngine)
- `src/lib/period-close-engine.ts` (محول checklist ومثبت مهام SOCPA)
- `src/lib/close/index.ts` (الواجهة الموحدة `closeApi` لاستدعاء عمليات الإقفال)
- `src/app/api/accounting/period-close/route.ts` (مستقبل طلبات إقفال الفترة للمحاسبة)
- `src/app/api/finance/period-close/route.ts` (مستقبل طلبات إقفال الفترة للمالية)
- `src/app/api/finance/period-close/[id]/step/route.ts` (تعديل حالة خطوات Checklist)

---

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)

لإنجاز المعمارية الموحدة بالكامل وحل الفجوات، نحدد الملفات التالية للتعديل في مرحلة التنفيذ (بعد الموافقة):

1. **`prisma/schema.prisma`** (تعديل طفيف لربط `PeriodCloseChecklist` بـ `FinancialPeriod` وحل الازدواجية مع `FiscalPeriod` إن لزم الأمر، أو إنشاء واجهة توافقية).
2. **`src/lib/auto-journal.ts`** (تحسين الكود لتوحيد أبعاد القيود وتوجيهها بالكامل عبر `AccountingJournalService` المركزي لتقليل التكرار، وتأصيل Document Types).
3. **`src/lib/period-close-engine.ts`** (ترقية مصفوفة `SOCPA_CLOSE_STEPS` من 14 خطوة إلى **16 خطوة متكاملة** متوافقة مع NetSuite/SAP ومطابقة لدليل التشغيل).
4. **`src/lib/governance/period-lock.ts`** (توسيع فحص `assertPeriodWritable` ليتكامل تلقائياً مع نتائج وحالة خطوات Checklist الإقفال).
5. **`src/lib/close/index.ts`** (تحديث واجهة `closeApi` لتعكس خطوات الـ 16 الجديدة وتدعم التحقق البرمجي التلقائي لكل خطوة).

---

## 3. الدومينات المتأثرة (Impacted Domains)

- **المحاسبة العامة (General Ledger & Journal Entries):** ترحيل الحسابات، توازن القيود، والتحقق التلقائي.
- **التشغيل التجاري (Sub-ledgers):** المبيعات (Sales)، المشتريات (Purchases)، المستودعات (Inventory)، الأصول الثابتة (Fixed Assets)، والرواتب (Payroll) - حيث ستخضع جميعها للتحقق الموحد أثناء مراحل الإقفال.
- **عزل tenants وسرية البيانات (Tenant Isolation):** الحفاظ التام على العزل الفيزيائي لبيانات المستأجرين مع ضمان عدم تسرب الصلاحيات.
- **حماية البيانات المالية (Financial Integrity):** حظر أي تعديل على الفترات المقفلة إلا عبر التجاوز الإداري المعتمد (Master Override).

---

## 4. المخاطر وكيفية معالجتها (Risks & Mitigations)

| الخطر (Risk) | الأثر (Impact) | كيفية التخفيف والمعالجة (Mitigation) |
|---|---|---|
| **تجميد حركات تجارية نشطة عن طريق الخطأ** | تعطل المبيعات/نقاط البيع لدى العميل | تطبيق قفل جزئي (SOFT_LOCK) تدريجي بدلاً من الإقفال التام المباشر، وتوفير التجاوز الإداري الآمن للمسؤولين. |
| **عدم توازن القيود التلقائية المترتبة على خطوات الإقفال** | قيد غير متوازن يفشل برمجياً ويوقف العملية | فرض التحقق الحسابي الدقيق `Math.abs(Dr - Cr) < 0.01` داخل معيار المعاملة المالية (Serializable Transaction). |
| **تعدد قواعد البيانات ومشاكل التوافق الفيزيائي (Multi-tenant)** | فشل Migration أو عدم تحديث Schema على كافة Tenants | الاعتماد التام على `deploy.js --db-push` الذي يقوم بدفع التعديلات التوافقية بشكل جماعي آمن دون فقدان للبيانات. |
| **ازدواجية نموذج الفترات في الكود (Fiscal vs Financial)** | تعارض بين واجهة المستخدم وضوابط الأمان | توحيد الاعتماد في الفحص الأمني على `FinancialPeriod` وربط Checklist المحاسبي به مباشرة لضمان الاتساق المطلق. |

---

## 5. خطة التنفيذ المقترحة (Execution Plan)

سيتم العمل على أربعة محاور أساسية آمنة وتدريجية:

### المحور الأول: ترقية الـ Period Close Engine إلى 16 خطوة (SOCPA Standard)
- تحديث `SOCPA_CLOSE_STEPS` في `period-close-engine.ts` لتشمل الخطوات الـ 16 التفصيلية.
- إضافة فحوصات برمجية تلقائية (Automated Validations) لكل خطوة (مثال: للبنك -> التحقق من وجود فروقات غير مسواة، للأصول -> التحقق من تشغيل إهلاك الشهر).

### المحور الثاني: حل ازدواجية الفترات (Fiscal Period vs Financial Period Alignment)
- توحيد معالجة الفترات المحاسبية بحيث يعتمد Checklist الإقفال على جدول `FinancialPeriod` و `FinancialPeriodModuleLock` ليكون قفل الفترة حقيقياً وصارماً يمنع أي حركة تجارية بشكل فوري.

### المحور الثالث: هيكلة وتوحيد الـ Universal Journal
- إعادة صياغة دوال `auto-journal.ts` لتمر بالكامل عبر أبعاد الـ Universal Journal (Profit Center, Segment, Product, Customer, Vendor, Asset, Project).
- ربط كافة مصادر المعاملات بـ Document Types محددة ومعيارية لتسهيل المراجعة الجنائية والمطابقة.

### المحور الرابع: تدقيق الأمان والامتثال
- تفعيل Field-Level Audit Trail بشكل كامل لتوثيق عمليات تجاوز القفل وإقفال الفترات بالتفصيل.

---

## 6. خطة الاختبار والتحقق (Testing & Verification Plan)

### أ. الاختبارات الآلية (Automated Tests):
- تشغيل اختبارات الوحدة الحالية للتأكد من عدم كسر أي منطق محاسبي:
  `npm run test:unit`
- تشغيل اختبارات السلامة المالية:
  `npm run test:financial`
- كتابة اختبارات وحدة جديدة لـ:
  1. التحقق من توازن الـ 16 خطوة وقدرة واجهة closeApi على تهيئتها.
  2. اختبار محاولة الكتابة على وحدة مغلقة جزئياً للتأكد من إطلاق خطأ `PeriodLockViolation`.

### ب. التحقق اليدوي (Manual Verification):
- فحص استجابة واجهة الـ API من خلال محاكاة طلبات التهيئة والإكمال للخطوات الـ 16.
- مراجعة سجلات الـ AuditLog للتأكد من كتابة بيانات تجاوز الأمان بالتفصيل وصيغ الـ diff التلقائية.
