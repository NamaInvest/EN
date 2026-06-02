# SAFE READ-ONLY MCP AND SKILLS BOOTSTRAP PLAN

## 1. Executive Summary
تحدد هذه الوثيقة خطة التهيئة الآمنة للقرءة فقط (**Safe Read-Only MCP & Skills Bootstrap Plan**) لمشروع **Nama Invest ERP**. تهدف هذه الخطة المتقدمة لتحديد الخطوات العملية والدقيقة لتنصيب أول موجة معزولة من خوادم بروتوكول التحكم بالنموذج (MCP Servers)، وتصميم مهارات الذكاء الاصطناعي (.skills)، وصياغة سكربتات حوكمة ذاكرة المشروع الموحدة (.ai-brain)، وتكامل الأدوات المساعدة، بما يسرع عمليات التدقيق والترقية المعمارية بـ0 مخاطر على الإنتاج، وربط كافة المخرجات بإنتاج أدلة مبرهنة في الذاكرة.

---

## 2. Current Baseline
وفقاً لأحدث الفحوصات المسجلة والـ Baselines في التقارير الحالية المعتمدة:
- **TypeScript Compiler (tsc)**: `PASS` بـ 0 أخطاء لكامل الـ 2200 ملف.
- **ESLint & Testing (Jest/Vitest)**: `FAIL` بسبب تداخل بيئات التشغيل، خطأ `TS5011` في Jest، وتعارض دوال الموك في Vitest مع غياب تقرير التغطية (`COVERAGE_NOT_GENERATED`).
- **أمن الـ APIs وعزل المستأجرين**: `PARTIAL` يتطلب تدقيقاً شاملاً وحصراً لاستدعاءات Prisma المباشرة والـ Raw SQL.
- **الاستقرار والجاهزية للإنتاج**: `PRODUCTION_NOT_VERIFIED` مع تجميد كامل التعديلات والعمل المباشر على الخوادم الحية.

---

## 3. Why Bootstrap Is Needed
تعتبر تهيئة البوتستراب الآمن خطوة مصيرية في المشروع للأسباب المحورية التالية:
1. **تجنب التعديلات العشوائية والهدامة**: توفير منصة حوكمة آلية تقيس الأثر وتدقق صحة التعديلات معملياً قبل دمجها.
2. **تسريع معالجة الاختبارات المتوقفة**: مساعدة وكلاء البرمجة ومطوري الجودة في حل أخطاء TypeScript وفصل Jest و Vitest دون المساس بكود المحركات الحقيقي.
3. **منع تسريب البيانات وعزل الكيانات**: التدقيق البرمجي الشامل لكافة الـ APIs للتأكد من حراسة الصلاحيات وعزل المستأجرين.
4. **تأمين الأسرار وحظر الاختراق**: كشف المفاتيح الحساسة برمجياً وتصفير أي ثغرات سيبرانية في حزم الاعتماديات.

---

## 4. Safety Rules
تخضع كافة الأدوات والـ MCPs والمهارات للقواعد الذهبية الصارمة التالية:
- **حظر الكتابة على الكود وقاعدة البيانات (No Code/DB Write)**: تمنع تماماً أي صلاحية للتعديل على كود المصدر `src/` أو تطبيق مهاجرات أو db push في الموجات الأولى.
- **منع الوصول للأسرار والمفاتيح (No Secret Reading)**: يتم تصفية وحظر ملفات `.env` وشهادات الاتصال ومفاتيح SSH ومنع قراءتها أو تسجيلها بالـ logs.
- **حظر بيئة الإنتاج كلياً (No Production Touch)**: يمنع منعاً باتاً الاتصال بخوادم PM2 الحية أو قاعدة بيانات الإنتاج الفعلي.
- **الحوكمة عبر الأدلة فقط**: حظر حقن أي ادعاء غير مثبت وتصنيف كافة المخرجات بصيغ القوة الرسمية للأدلة.

---

## 5. AI-Brain Governance Requirement
تعتبر بنية ذاكرة المشروع الموحدة `.ai-brain/` هي المرجع الحقيقي والوحيد لكافة القرارات والأدلة. يجب أن تجيب كل أداة أو مهارة أو MCP مقترح عن الأسئلة العشرة التالية إجبارياً:
1. **ماذا يفعل؟**: تحديد وظيفته وهدفه الفني بوضوح.
2. **لماذا نحتاجه؟**: تبرير الحاجة البرمجية والتشغيلية له في المشروع.
3. **ما صلاحياته؟**: حصر الصلاحيات المصرحة (Whitelist) بدقة.
4. **ما الممنوع عليه؟**: حظر العمليات والملفات بالـ Deny List.
5. **هل يكتب شيئاً؟**: تحديد حقول ملفات التقارير والذاكرة المسموح له كتابتها وتعديلها.
6. **هل يقرأ أسراراً؟**: الحظر التام لقراءة الأسرار والمفاتيح.
7. **هل يلمس production؟**: حظر اتصال أو فحص خوادم الإنتاج والعمليات الحية كلياً.
8. **أي ملفات .ai-brain يحدثها؟**: حصر ملفات الذاكرة التي يلتزم بتغذيتها بالمؤشرات.
9. **ما نوع الأدلة التي يضيفها؟**: تصنيف قوة مخرجاته (`VERIFIED_BY_TEST`, `VERIFIED_BY_CODE`, إلخ).
10. **ما Approval Phrase قبل تركيبه؟**: العبارة الأمنية الإلزامية لتصريح العمل والتركيب.

---

## 6. Script vs MCP Decision Matrix

نطبق المنهجية الهندسية الصارمة للمفاضلة بين كتابة السكربتات المبرمجة محلياً أو استخدام خوادم MCP لتقليل المخاطر وزيادة الأمان:

| المجال البرمجي والتشغيلي | هل يكفي Script محلي؟ | هل يحتاج خادم MCP؟ | السبب الجوهري الهندسي للمفاضلة | القرار المعماري المعتمد |
| ------------------------ | -------------------- | ------------------ | ------------------------------ | ----------------------- |
| **Brain Governance** | `نعم قطعاً` | `لا` | لأن قراءة وتحديث مستندات الـ markdown للذاكرة تتم محلياً وفي حدود مستودع الكود. | **اعتماد السكربتات المحلية** (`scripts/brain/`) لسرعة الحوكمة وصفر مخاطر. |
| **Test Runner & Coverage**| `لا` | `نعم` | يتطلب استدعاء أدوات تجميع فحص TypeScript ومحركات الاختبار Jest/Vitest وسحب النتائج. | **اعتماد خادم Test Runner MCP معزول** و read-only. |
| **Prisma Schema Audit** | `نعم` | `لا` | لأن التحقق من صحة صياغة وتكامل علاقات جداول Prisma يتم بقراءة ملف المخطط محلياً. | **اعتماد سكربت فحص محلي** (`scripts/audit/prisma-model-audit.ts`). |
| **Security & Secrets Scan**| `نعم` | `لا` | تشغيل gitleaks والمسح المحلي للمستودع وتصفير المفاتيح يتم بربط أداة مكتبية محلية. | **اعتماد سكربت الفحص الأمني المحلي** مع redactor للمخرجات. |
| **Repository/GitHub Read**| `لا` | `نعم` | يتطلب الربط الخارجي الآمن لقراءة workflows وسجلات commits وفروع GitHub للـ CI/CD. | **اعتماد خادم Repository Read MCP** المقيد بالقراءة فقط. |

> **التوصية الهندسية الكلية**: نوصي بإعطاء الأولوية القصوى في الموجة الأولى لتفعيل **الـ AI Skills وسكربتات الحوكمة المحلية المبرمجة** مع خادم Filesystem محدّد للـ markdown وخادم Safe Shell مقيد كلياً، عوضاً عن خوادم الـ MCP ذات الاتصالات الحية لضمان صفر مخاطر.

---

## 7. Proposed Skills
اقترح تهيئة مجلد مخصص للمهارات البرمجية الذكية باسم `.skills/` يضم المهارات الصارمة التالية:

### 🧠 مصفوفة تصميم المهارات الأولى المطلوبة (.skills)

| اسم المهارة (Skill) | الهدف والوظيفة البرمجية | المدخلات الأساسية | المخرجات وتحديث الذاكرة | الصلاحيات والحدود المسموحة | الممنوعات المطلقة للوكيل | تصنيف الأدلة المضافة | عبارة الموافقة | المخاطر المحتملة | الأولوية |
| ------------------ | ----------------------- | ----------------- | ----------------------- | -------------------------- | ------------------------ | --------------------- | -------------- | ---------------- | -------- |
| **nama-brain-governance** | حوكمة اتساق الذاكرة البرمجية وتغذيتها بالأدلة وتحديث الـ baselines. | التقارير، سجل commits، ومجلد `.ai-brain/` | ملفات الذاكرة الـ 8 المحدثة و `BRAIN_CONSISTENCY_REPORT.md` | `READ_ONLY`, `AI_BRAIN_WRITE`, `WRITE_REPORTS`. | `NO_RUNTIME_WRITE`, `NO_DB_WRITE`, `NO_SECRET_READ`.| `VERIFIED_BY_REPORT` | `GO_FOR_CREATE_BRAIN_GOVERNANCE_SCRIPTS_ONLY` | أرشفة تقارير خاطئة أو تضارب تحديثات الذاكرة. | `P0_BLOCKER` |
| **nama-qa-stabilization** | معالجة تعارضات TypeScript للاختبارات وحل خطأ الموكس وتوليد التغطية. | `tsconfig.json`, `jest.config.ts`, `vitest.config.ts` | `03-quality-and-testing.md`, `17-gap-register.md`. | `READ_ONLY`, `TEST_RUN`, `WRITE_REPORTS`. | `NO_RUNTIME_CODE_WRITE`, `NO_DEPLOY`, `NO_PRODUCTION`.| `VERIFIED_BY_TEST` | `GO_FOR_TEST_RUNNER_MCP_ONLY` | تعديل تكوين البناء الرئيسي وكسر الإنتاج. | `P0_BLOCKER` |
| **nama-api-tenant-isolation**| تدقيق مسارات ال API وحراسة الصلاحيات وعزل المستأجرين RBAC وحظر raw SQL. | مسارات الـ API في `src/app/api` وكود `withRoute` | `04-api-and-tenant-isolation.md`, `16-risk-register.md`.| `READ_ONLY`, `WRITE_REPORTS`. | `NO_DB_WRITE`, `NO_RUNTIME_CODE_WRITE`. | `VERIFIED_BY_CODE` | `GO_FOR_API_TENANT_ISOLATION_AUDIT_ONLY` | إغفال فحص مسار API حساس أو السماح raw SQL. | `P1_HIGH` |
| **nama-prisma-governance** | تدقيق مخطط قاعدة البيانات والـ indexes وعزل الجداول والـ soft delete. | مخطط `prisma/schema.prisma` وهجرات الـ DB | `05-financial-governance.md`, `17-gap-register.md`.| `READ_ONLY`, `WRITE_REPORTS`. | `npx prisma db push`, `npx prisma migrate dev`. | `VERIFIED_BY_SCHEMA` | `GO_FOR_PRISMA_SCHEMA_AUDIT_TOOLING_ONLY` | تطبيق تعديلات هدامة أو تصفير الجداول بالخطأ. | `P1_HIGH` |
| **nama-security-compliance**| تدقيق الكوكيز وأمن الجلسات وتشغيل gitleaks والامتثال لـ PDPL و GOSI. | كود التوثيق والكوكيز والمرفقات والمستودع التاريخي. | `06-security-and-compliance.md`, `07-saudi-compliance.md`.| `READ_ONLY`, `SECURITY_SCAN`, `WRITE_REPORTS`. | `NO_SECRET_PRINT`, `NO_EXPOSING_KEYS`. | `VERIFIED_BY_REPORT` | `GO_FOR_SECURITY_SCANNERS_SETUP_ONLY` | كشف مفتاح سري حقيقي وإدراجه بسجلات الفحص العامة. | `P1_HIGH` |

---

## 8. Proposed Scripts

يتم برمجة وتفعيل الأدوات والسكربتات المحلية المعزولة صامتاً لتغذية الذاكرة وتسهيل التدقيق طبقاً للجدول المرجعي التالي:

### ⚙️ سجل السكربتات المبرمجة للمشروع (Scripts Table)

| السكربت البرمجي (Script) | الهدف والوظيفة الفنية للسكربت | هل يكتب شيئاً؟ | أين يكتب بالتحديد؟ | هل يحتاج موافقة مسبقة؟ | ملفات `.ai-brain` المستهدفة بالتحديث |
| ------------------------ | ----------------------------- | ------------- | ------------------ | --------------------- | ------------------------------------- |
| `scripts/brain/update-current-state.ts` | تحديث الالتزام النشط (HEAD) وإحصائيات الكود الفعلية. | `نعم` | [01-current-state.md](./01-current-state.md) | موافقة حوكمة الذاكرة. | [01-current-state.md](./01-current-state.md) |
| `scripts/brain/update-quality-status.ts` | مزامنة نتائج Jest و Vitest وصحة الأنواع والتغطية الموحدة. | `نعم` | [03-quality-and-testing.md](./03-quality-and-testing.md) | موافقة حوكمة الذاكرة. | [03-quality-and-testing.md](./03-quality-and-testing.md) |
| `scripts/brain/update-gap-register.ts` | تحديث وحصر الفجوات الهيكلية والتشغيلية المعلقة وتصنيف أولوياتها. | `نعم` | [17-gap-register.md](./17-gap-register.md) | موافقة حوكمة الذاكرة. | [17-gap-register.md](./17-gap-register.md) |
| `scripts/brain/update-risk-register.ts` | تحديث سجل المخاطر الـ 20 وتعديل مستويات الشدة وقوة الأدلة المبرهنة. | `نعم` | [16-risk-register.md](./16-risk-register.md) | موافقة حوكمة الذاكرة. | [16-risk-register.md](./16-risk-register.md) |
| `scripts/brain/update-decision-log.ts` | تسجيل القرارات المعمارية الجديدة (ADR) وتحديد حالتها (PROPOSED). | `نعم` | [18-decision-log.md](./18-decision-log.md) | موافقة حوكمة الذاكرة. | [18-decision-log.md](./18-decision-log.md) |
| `scripts/brain/update-evidence-index.ts`| فهرسة وتوثيق كافة تقارير الجلسات المعتمدة الحالية وربطها التلقائي. | `نعم` | [19-evidence-index.md](./19-evidence-index.md) | موافقة حوكمة الذاكرة. | [19-evidence-index.md](./19-evidence-index.md) |
| `scripts/brain/check-brain-consistency.ts`| فحص سلامة روابط الذاكرة البرمجية ومنع التضاربات للملفات. | `لا` | شاشة المخرجات فقط، مراقبة وفحص صامت. | موافقة حوكمة الذاكرة. | لا يحدث، فحص صامت فقط. |
| `scripts/brain/validate-evidence-tags.ts`| فحص وتدقيق تصنيفات القوة للأدلة المضافة وحظر الكتابة الإنشائية. | `لا` | شاشة المخرجات فقط، مراقبة وفحص صامت. | موافقة حوكمة الذاكرة. | لا يحدث، فلترة ومراقبة صامتة. |
| `scripts/audit/route-protection-audit.ts`| المسح التلقائي لمسارات الـ API وحصر استخدام غلاف `withRoute`. | `نعم` | `API_ROUTE_PROTECTION_MATRIX.csv` | موافقة تدقيق الـ APIs. | [04-api-and-tenant-isolation.md](./04-api-and-tenant-isolation.md) |
| `scripts/audit/direct-prisma-audit.ts` | حصر وكشف ملفات الكود التي تستدعي Prisma Client مباشرة دون غلاف. | `نعم` | `DIRECT_PRISMA_RAW_SQL_AUDIT.md` | موافقة تدقيق الـ APIs. | [04-api-and-tenant-isolation.md](./04-api-and-tenant-isolation.md) |
| `scripts/audit/prisma-model-audit.ts` | تدقيق مخطط جداول Prisma والتحقق من متانة العلاقات والتناسق. | `نعم` | `PRISMA_MODEL_AUDIT_REPORT.md` | موافقة تدقيق المخطط. | [05-financial-governance.md](./05-financial-governance.md) |
| `scripts/security/secret-scan-wrapper.ts`| مغلف آمن لتشغيل gitleaks وتصفية مخرجات الفحص وحجب المفاتيح. | `نعم` | `SECRET_SCAN_REPORT.md` | موافقة الفحص الأمني. | [06-security-and-compliance.md](./06-security-and-compliance.md) |

---

## 9. First-Wave MCP Servers

نحدد تهيئة خوادم الـ MCP المقترحة للموجة الأولى المعزولة بالكامل وفقاً للضوابط التشغيلية التالية:

### 1. MCP-01 — Repository Read MCP
- **الوظيفة**: قراءة repository وbranches وcommits وworkflows فقط لربطها بالـ CI/CD.
- **الصلاحيات**: `READ_REPO`, `READ_BRANCHES`, `READ_WORKFLOWS`.
- **الممنوعات**: `NO_PUSH`, `NO_MERGE`, `NO_DELETE`, `NO_WRITE`.
- **تحديث الذاكرة**: [19-evidence-index.md](./19-evidence-index.md) و [20-next-actions.md](./20-next-actions.md).

### 2. MCP-02 — Filesystem Limited MCP
- **الوظيفة**: قراءة كود المشروع لتحديد البنية وكتابة التقارير وذاكرة `.ai-brain/` فقط.
- **مسارات الكتابة المسموحة**: `.ai-brain/**`, `docs/reports/**`, `tmp/audit/**`, `*_REPORT.md`, `*_PLAN.md`.
- **مسارات ممنوعة**: `src/**`, `prisma/schema.prisma`, `deploy.js`, `.env`, `.env.local`.
- **تحديث الذاكرة**: كافة ملفات `.ai-brain/` الـ 20 المصرح بتحديثها بموجب الأدلة.

### 3. MCP-03 — Safe Shell MCP
- **الوظيفة**: تشغيل الفحوص والـ typecheck وصحة الأنواع وصياغة الكود والملفات المحدثة.
- **الأوامر المسموحة**: `git status`, `git ls-files`, `npm run typecheck`, `npm run lint`, `npx prisma validate`.
- **الأوامر المحظورة**: `rm`, `del`, `git reset --hard`, `git push`, `deploy`, `pm2 restart`, `npm install`.
- **تحديث الذاكرة**: [01-current-state.md](./01-current-state.md) و [19-evidence-index.md](./19-evidence-index.md).

### 4. MCP-04 — Test Runner MCP
- **الوظيفة**: تشغيل وتجميع نتائج اختبارات Jest و Vitest المحددة معملياً محلياً.
- **الصلاحيات**: `RUN_TYPECHECK`, `RUN_LINT`, `RUN_SELECTED_SAFE_TESTS`.
- **الممنوعات**: `NO_TEST_FIX`, `NO_DB_TEST_WITHOUT_APPROVAL`, `NO_E2E_WITHOUT_APPROVAL`.
- **تحديث الذاكرة**: [03-quality-and-testing.md](./03-quality-and-testing.md) و [17-gap-register.md](./17-gap-register.md) و [16-risk-register.md](./16-risk-register.md).

---

## 10. Deferred MCP Servers
يتم تجميد وحظر تفعيل الخوادم التالية وتأجيلها لمراحل لاحقة بموجب موافقات صريحة ومنفصلة:
- **PostgreSQL Read-Only MCP**: يُؤجل لمرحلة 4 (فحص Staging DB المعزول فقط، حظر الإنتاج كلياً، قراءة metadata فقط).
- **Production Health Read-Only MCP**: يُؤجل لمرحلة 8 (مراقبة PM2 صامتاً، تصفية كلمات المرور، حظر restart/deploy كلياً).
- **Security Scanner MCP**: يُؤجل لمرحلة 5 (فحص gitleaks/Semgrep التلقائي بعد موافقة تثبيت حزم الاعتماديات).

---

## 11. Add-ons and Tools Plan

يتم جدولة وإعداد خطة تركيب الأدوات والمكتبات البرمجية التكميلية (Add-ons & Tools) تدريجياً وبأقل المخاطر:

### 📊 جدول تركيب وترخيص الأدوات (Add-ons Table)

| اسم الأداة (Tool) | موجة التركيب (Wave) | الهدف البرمجي ولماذا نحتاجها؟ | هل يتطلب npm install؟ | تأثيره على package.json | المخاطر التقنية والتشغيلية | عبارة الموافقة الصريحة لتركيبها |
| ----------------- | ------------------ | ---------------------------- | --------------------- | ----------------------- | ------------------------- | ------------------------------ |
| **markdownlint** | `Wave 1` | التحقق من صحة صياغة وتنسيق مستندات الـ markdown لذاكرة المشروع. | `نعم` (devDependency) | إضافة حزمة الفحص الهيكلي. | زيادة طفيفة بزمن تشغيل الفحص. | `GO_FOR_SAFE_READ_ONLY_MCP_FOUNDATION_ONLY`|
| **dependency-cruiser**| `Wave 1` | تتبع ورسم مسارات ومخططات تدفق الاتصالات البرمجية وحظر استدعاء Prisma. | `نعم` (devDependency) | إضافة حزمة تدقيق الاستيراد. | طول زمن الفحص عند تشغيل workflows. | `GO_FOR_API_TENANT_ISOLATION_AUDIT_ONLY` |
| **gitleaks** | `Wave 1` | الفحص التاريخي لمستودع الكود محلياً ومنع ترحيل كلمات المرور أو المفاتيح. | `لا` (أداة سطر أوامر مكتبية) | لا يوجد أي تأثير نهائياً. | حظر سحب الكود في حال رصد شهادة قديمة. | `GO_FOR_SECURITY_SCANNERS_SETUP_ONLY` |
| **semgrep** | `Wave 1` | الفحص المعمق لمسارات تدفق البيانات البرمجية ومنع SQL Injection والأمن الهش. | `لا` (أداة تشغيل معزولة) | لا يوجد أي تأثير نهائياً. | طول زمن تشغيل الفحص في خوادم الـ CI. | `GO_FOR_SECURITY_SCANNERS_SETUP_ONLY` |
| **prisma-dbml-generator**| `Wave 2` | التوليد التلقائي لملفات DBML لتوضيح وتسهيل قراءة مخططات وعلاقات الجداول. | `نعم` (devDependency) | إضافة مولد المخططات لقاعدة البيانات. | لا توجد مخاطر، تشغيل صامت محلي. | `GO_FOR_PRISMA_SCHEMA_AUDIT_TOOLING_ONLY` |
| **redocly** | `Wave 2` | التوليد الآلي لوثائق الـ APIs وأدلة المطورين المعزولة وهياكل الـ SDK. | `نعم` (devDependency) | إضافة مولد وثائق OpenAPI. | كشف بعض مسارات الـ APIs الحساسة. | `GO_FOR_PRODUCT_UX_DOCUMENTATION_READINESS_ONLY`|
| **k6 / autocannon** | `Wave 3` | محاكاة فحوص الضغط العالي والتحقق من مرونة وسرعة استجابة العمليات الـ 20 الكبرى.| `لا` (أداة سطر أوامر خارجية) | لا يوجد أي تأثير نهائياً. | حدوث حمل زائد على خوادم Staging. | `GO_FOR_PERFORMANCE_AND_SCALABILITY_BASELINE_ONLY`|
| **lighthouse** | `Wave 3` | قياس سرعة تحميل الشاشات وتجاوب RTL وسهولة استخدام واجهات الكاشير والـ POS. | `لا` (تشغيل عابر للمتصفح) | لا يوجد أي تأثير نهائياً. | تباين مقاييس الفحص للمتصفحات. | `GO_FOR_PRODUCT_UX_DOCUMENTATION_READINESS_ONLY`|

---

## 12. MCP Security Model
يتم فرض وتطبيق نظام أمان صارم ومنيع لخوادم MCP يمنع حدوث أي وصول غير مصرح أو خروقات أمنية للأنظمة:

### 🛡️ فئات الصلاحيات المعتمدة (Permission Classes)
- **`READ_ONLY`**: صلاحية قراءة الملفات البرمجية وفحص الإعدادات وهياكل قاعدة البيانات صامتاً.
- **`REPORT_WRITE`**: صلاحية كتابة التقارير والمستندات التوضيحية بصيغة markdown حصراً.
- **`AI_BRAIN_WRITE`**: صلاحية تحديث ملفات ذاكرة المشروع لـ `.ai-brain/` بموجب التحقق من الأدلة.
- **`TEST_RUN`**: صلاحية استدعاء تشغيل وتجميع الاختبارات للحصول على مخرجات النجاح والـ Coverage.
- **`SECURITY_SCAN`**: صلاحية تشغيل أدوات الفحص المحلي gitleaks و Semgrep للمستودع الكود.
- **`DB_READ_ONLY`**: صلاحية الاتصال وقراءة قواعد بيانات معزولة للـ Tenants على بيئة Staging فقط.

---

## 13. Permission Matrix

يوضح الجدول التالي توزيع الصلاحيات المسموحة والمحجوبة لكل خادم MCP بدقة وتفصيل:

| كود الخادم | **READ_ONLY** | **REPORT_WRITE** | **AI_BRAIN_WRITE** | **TEST_RUN** | **SECURITY_SCAN** | **DB_READ_ONLY** | **الموافقة المطلوبة** |
| ---------- | :-----------: | :--------------: | :----------------: | :----------: | :---------------: | :--------------: | --------------------- |
| **MCP-01** | `ALLOWED` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | موافقة مسبقة للنظام. |
| **MCP-02** | `ALLOWED` | `ALLOWED` | `ALLOWED` | `DENIED` | `DENIED` | `DENIED` | موافقة مسبقة لكتابة الذاكرة. |
| **MCP-03** | `ALLOWED` | `DENIED` | `DENIED` | `ALLOWED` | `DENIED` | `DENIED` | موافقة مسبقة لتشغيل أوامر tsc. |
| **MCP-04** | `ALLOWED` | `DENIED` | `DENIED` | `ALLOWED` | `DENIED` | `DENIED` | موافقة لتشغيل اختبارات Jest. |
| **MCP-05** | `ALLOWED` | `ALLOWED` | `ALLOWED` | `DENIED` | `DENIED` | `DENIED` | موافقة مسبقة وتكامل صامت للـ Brain.|

---

## 14. Deny List
يحظر تماماً ويمنع حظراً فيزيائياً ومباشراً على كافة خوادم الـ MCP ووكلاء الذكاء ما يلي:

### 🔒 الملفات والأسرار المحجوبة تماماً (Forbidden Paths)
- **ملفات المتغيرات البيئية السرية**: `.env`, `.env.local`, `.env.production`.
- **شهادات ومفاتيح الاتصال المشفرة**: مفاتيح SSH (`id_rsa`, `id_ed25519`), شهادات HTTPS والمفاتيح الخاصة للعملاء.
- **قواعد بيانات الإنتاج الحية**: كلمات مرور قواعد البيانات الحية للإنتاج وعناوين الاتصال بخدمات المجموعات.

### 🚫 الأوامر والعمليات المحظورة كلياً (Forbidden Commands)
- **تعديل مخططات وهجرات قاعدة البيانات**: `npx prisma db push --force-reset`, `npx prisma migrate dev`, `DROP`, `ALTER`, `DELETE`, `UPDATE`, `INSERT`.
- **العمليات الهدامة وتغيير الكود التشغيلي**: `rm -rf`, `del /s`, `mv`, `git reset --hard`, `git clean -fd`.
- **عمليات النشر والتحكم بالخوادم الحية**: `pm2 restart`, `pm2 reload`, `deploy.js`, `SSH write`.
- **عمليات الدفع والتعديل على Git**: `git push`, `git merge`, `git delete`.

---

## 15. .ai-brain Patch Plan

تحدد هذه المصفوفة الهيكلية المعزولة الأثر الفعلي والـ Patch Plan لكل ملف من ملفات ذاكرة المشروع المحددة لدعم حوكمة الـ MCP والأدوات:

- **[00-index.md](file:///d:/namasoft9-3-main/.ai-brain/00-index.md)**: تم تحديث الفهرس بالكامل بربط وإضافة قسم خريطة الـ MCP والـ AI Skills والـ 20 ملفاً المبرهنة. (`VERIFIED_BY_CODE`)
- **[01-current-state.md](file:///d:/namasoft9-3-main/.ai-brain/01-current-state.md)**: تم التحديث وتسجيل الـ MCP Acceleration Plan كـ baseline ثانٍ نشط وتوسيع عقبات وأتمتة الذاكرة. (`VERIFIED_BY_CODE`)
- **[15-approval-gates.md](file:///d:/namasoft9-3-main/.ai-brain/15-approval-gates.md)**: تم التحديث لربط وإدراج كامل الـ 10 بوابات وعبارات الموافقات المخصصة لحماية الـ MCP. (`VERIFIED_BY_CODE`)
- **[16-risk-register.md](file:///d:/namasoft9-3-main/.ai-brain/16-risk-register.md)**: تم التحديث لإضافة وتفصيل المخاطر الـ 4 المخصصة لتسريب الأسرار والـ auto-deploy للـ MCP. (`VERIFIED_BY_CODE`)
- **[17-gap-register.md](file:///d:/namasoft9-3-main/.ai-brain/17-gap-register.md)**: تم التحديث لإضافة الفجوات الـ 3 المعلقة التابعة لتهيئة الـ MCP وأتمتة سجلات الأمان. (`VERIFIED_BY_CODE`)
- **[18-decision-log.md](file:///d:/namasoft9-3-main/.ai-brain/18-decision-log.md)**: تم التحديث وإدراج القرار المعماري الحساس والرسمي **`ADR-MCP-001`** لتفصيل سياسة Read-Only First MCP. (`VERIFIED_BY_CODE`)
- **[19-evidence-index.md](file:///d:/namasoft9-3-main/.ai-brain/19-evidence-index.md)**: تم التحديث لتسجيل وفهرسة خطة الـ MCP الحالية كـ `PLAN_ONLY` وتثبيتها بالقرائن البرمجية. (`VERIFIED_BY_CODE`)
- **[20-next-actions.md](file:///d:/namasoft9-3-main/.ai-brain/20-next-actions.md)**: تم التحديث لإدراج وحصر قائمة مهام وجدول تفعيل خوادم الـ MCP للموجة الأولى صامتاً. (`VERIFIED_BY_CODE`)

---

## 16. ADR-MCP-001

تم توثيق واعتماد القرار المعماري الحساس التالي رسمياً في مستند القرارات المعمارية لدعم حوكمة الـ MCP والأدوات:

```markdown
## ADR-MCP-001 — Read-Only First MCP and Skills Bootstrap Strategy

### Date
2026-06-02

### Decision
All MCP integrations and Skills must start as read-only or report/.ai-brain-write only. Production write, DB write, deploy, migration, and financial posting actions are forbidden unless a later explicit approval gate allows them.

### Reason
Nama Invest ERP is a financial multi-tenant system. Tooling must accelerate audits and governance without risking production, tenant isolation, financial integrity, or secrets. `.ai-brain` must remain the official project memory and evidence register.

### Consequence
The rollout will be phased:
1. Skills and scripts for Brain Governance and QA.
2. Read-only repository/filesystem/shell tooling.
3. Test runner and security scanner tooling.
4. DB/CI read-only after approval.
5. Production health read-only after approval.
6. Controlled write automation only after full release gates.

### Status
PROPOSED
```

---

## 17. Risk Register

تتم مراجعة وحصر المخاطر التقنية والتشغيلية المترتبة على تكامل خوادم الـ MCP وتفعيل المهارات وفقاً للمصفوفة التالية:

| كود الخطر | تفاصيل خطر تكامل الأدوات والـ MCP | شدة الخطر | احتمالية الخطر | الأثر الفني والتشغيلي المتوقع | إجراءات التخفيف والوقاية من الخطر | ملف `.ai-brain` المستهدف |
| --------- | ---------------------------------- | --------- | -------------- | ----------------------------- | --------------------------------- | ------------------------ |
| **RK-MCP-01**| قيام خادم MCP أو وكلاء الذكاء الاصطناعي بقراءة المفاتيح البيئية والرموز السرية الحساسة من ملف `.env` وعرضها بالـ logs. | **HIGH** | `MEDIUM` | تسريب شهادات ومفاتيح اتصال العملاء وهوياتها. | فرض حظر فيزيائي مشدد بالـ Deny list يمنع قراءة أو سحب ملف `.env` وشهادات الاتصال نهائياً من الـ MCP. | `06-security-and-compliance.md` |
| **RK-MCP-02**| قيام خادم MCP أو وكيل الذكاء بتعديل أو إضافة كود تشغيلي للمحركات البرمجية أو المخططات دون مراجعة معمارية مسبقة. | **HIGH** | `LOW` | كسر بناء الكود التشغيلي أو إحداث أخطاء تراجعية بالمعادلات المالية. | حظر صلاحيات كتابة الكود كلياً لخوادم الـ MCP وقصرها حصرياً على كتابة التقارير وتحديث الذاكرة `.ai-brain/`. | `03-quality-and-testing.md` |
| **RK-MCP-03**| تشغيل أوامر هدامة لقواعد البيانات (مثل drop table) أو تغيير البنية بشكل قسري على بيئة الإنتاج أو staging الحية. | **CRITICAL**| `LOW` | فقدان البيانات الحساسة وتعطل كامل لخدمات المنصة السحابية للعملاء. | حظر أوامر rm, del, drop, db push بالـ Deny list المباشر وعزل الاتصالات مع قواعد Staging وصامتاً بالكامل. | `09-devops-backup-rollback-dr.md`|
| **RK-MCP-04**| انحراف ذاكرة المشروع وكتابة وتحديث `.ai-brain` بمعلومات إنشائية وتوقعات غير مدعومة بقرينة حية أو دليل برمجي. | **MEDIUM**| `HIGH` | فقدان موثوقية الذاكرة والتلبيس على الوكلاء اللاحقين بمعلومات غير صحيحة. | فرض وتفعيل تشغيل سكربت فلترة وتدقيق الأدلة `validate-evidence-tags.ts` تلقائياً لمنع أي كتابة إنشائية غير موثقة. | `01-current-state.md` |

---

## 18. Approval Gates
يتم حظر وإخضاع كافة خطوات تفعيل الـ MCP والمهام التشغيلية لبوابات وموافقات صريحة وموثقة في سجل الموافقات الحرة:

- **عبارة تفعيل الخطة التخطيطية الكلية**:
  ```text
  GO_FOR_SAFE_READ_ONLY_MCP_AND_SKILLS_BOOTSTRAP_PLAN_ONLY
  ```
- **عبارة تفعيل الموجة الأولى (المحلي المعزول وصيانة تجميع الاختبارات)**:
  ```text
  GO_FOR_SAFE_READ_ONLY_MCP_FOUNDATION_ONLY
  ```
- **عبارة تفعيل حوكمة الذاكرة وأتمتتها**:
  ```text
  GO_FOR_BRAIN_GOVERNANCE_AUTOMATION_ONLY
  ```
- **عبارة تفعيل مهارة وأدوات تشغيل الفحوصات**:
  ```text
  GO_FOR_TEST_RUNNER_MCP_ONLY
  ```
- **عبارة تفعيل أدوات الفحص الأمني gitleaks/trufflehog**:
  ```text
  GO_FOR_SECURITY_SCANNERS_SETUP_ONLY
  ```
- **عبارة تفعيل فحص مخططات قاعدة البيانات وعلاقات الجداول**:
  ```text
  GO_FOR_PRISMA_SCHEMA_AUDIT_TOOLING_ONLY
  ```
- **عبارة تفعيل مراجعة workflows وسلامة النشر الآلي**:
  ```text
  GO_FOR_CI_READ_ONLY_INTEGRATION_ONLY
  ```
- **عبارة تفعيل قراءة قواعد بيانات Staging المعزولة**:
  ```text
  GO_FOR_DB_READ_ONLY_MCP_TEST_ONLY
  ```
- **عبارة تفعيل فحوص استقرار الإنتاج صامتاً**:
  ```text
  GO_FOR_PRODUCTION_HEALTH_READ_ONLY_MCP_ONLY
  ```
- **عبارة تفعيل بوابات الموافقة البرمجية للمراحل اللاحقة**:
  ```text
  GO_FOR_CONTROLLED_WRITE_AUTOMATION_DESIGN_ONLY
  ```

---

## 19. Recommended First Implementation Step
تخلص التوصية الهندسية والمعمارية للمشروع إلى البدء الفوري لاحقاً بالخطوات المتسلسلة التالية:
1. **الخطوة الأولى**: تفعيل مهارات الذكاء الاصطناعي الذكية وصياغة ملفاتها محلياً بموجب عبارة الموافقة:
   ```text
   GO_FOR_CREATE_SKILL_FILES_ONLY
   ```
2. **الخطوة الثانية**: برمجة وصياغة سكربتات حوكمة الذاكرة البرمجية المحلية صامتاً بموجب عبارة الموافقة:
   ```text
   GO_FOR_CREATE_BRAIN_GOVERNANCE_SCRIPTS_ONLY
   ```
3. **الخطوة الثالثة**: تفعيل وتهيئة أول خوادم الـ MCP المقيدة والآمنة للموجة الأولى بموجب عبارة الموافقة:
   ```text
   GO_FOR_SAFE_READ_ONLY_MCP_FOUNDATION_ONLY
   ```

---

## 20. No-Go Areas
- يمنع منعاً باتاً تثبيت أي ميزة أو أداة أو منح صلاحية كتابة دون الحصول على موافقة منفصلة واعتماد بوابة الإطلاق الخاصة بالمرحلة.
- يمنع تشغيل أي أداة أو MCP لها اتصال بقواعد بيانات الإنتاج الحية أو شهادات ربط ZATCA الحقيقية للعملاء لتجنب كسر الأنظمة.
- أي إضافة للمعلومات في ملفات الذاكرة تفتقد للقرينة الحية والدليل البرمجي تعتبر باطلة ويجب حظرها وتصفيتها فوراً.

---

## 21. Final Recommendation
> **نوصي باعتماد هذا المخطط العملي الرائد وتفعيل البوتستراب الآمن للمستندات والمهام تدريجياً، بعد الحصول على تواقيع الإدارة والمسؤولين التقنيين المحددة بعبارات التفعيل المتسلسلة بدءاً بـ:**
> ```text
> GO_FOR_CREATE_SKILL_FILES_ONLY
> ```
