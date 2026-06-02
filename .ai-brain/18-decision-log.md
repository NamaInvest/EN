# 18 - سجل القرارات المعمارية والبرمجية (Architectural Decision Log - ADR)

> **آخر تحديث:** 2026-06-02 | **سجل توثيق القرارات المعمارية الحساسة** | **ثابت معتمد**

---

## 📌 فلسفة القرارات المعمارية (ADR Philosophy)
تمثل هذه الوثيقة سجل القرارات الهندسية والمعمارية الكبرى المتخذة لتطوير وصيانة البنية التحتية والمحركات المالية في مشروع **Nama Invest ERP**. تدوين القرارات يمنع الانحراف المعماري (Architectural Drift) ويحافظ على اتساق البناء البرمجي عبر دورة حياة النظام.

---

## 🗺️ سجل وتفاصيل القرارات المعمارية الموثقة (ADR Logs)

### 1. ADR-TEST-001 — Separate Jest and Vitest Responsibilities

- **التاريخ**: 2026-06-02
- **القرار**: فصل كامل للمسؤوليات وبيئات التشغيل والموكس لكل من Jest و Vitest بشكل قاطع، وإنشاء ملف تكوين `tsconfig.test.json` مستقل لتجميع الاختبارات الخارجة عن مجلد `src`.
- **السبب الفني**:
  - تسبب خلط المترجمين في ظهور الخطأ التجمعي الحاد `TS5011` وتداخل استدعاءات Jest Mocks (`jest.fn()`) داخل بيئة تشغيل Vitest المغايرة، مما تسبب في توقف 69 اختباراً حاسماً للمحركات ووحدات الأمان.
  - إبقاء التكوين العام لبناء التطبيق `tsconfig.json` معزولاً عن ملفات الاختبار لضمان عدم حدوث مشاكل بناء للإنتاج.
- **النتائج والآثار**:
  - يلتزم المطورون بكتابة اختبارات الـ Unit للمحركات المعزولة تحت Vitest حصرياً واستبدال دوال Jest بـ `vi.fn()` و `vi.mock()`.
  - يلتزم المطورون بتوجيه اختبارات الـ API والتكامل والـ Database لبيئة Jest.
  - نجاح تجميع الاختبارات بنسبة 100% وإمكانية توليد تقرير التغطية الموحد بنجاح.
- **الحالة**: `PROPOSED` (بانتظار موافقة مرحلة 1)

---

### 2. ADR-TEST-002 — Resolve prisma-audit Require Bypasses

- **التاريخ**: 2026-06-02
- **القرار**: إعادة هيكلة وتعديل استيراد ملف التدقيق `prisma-audit` في ملفات التكامل البرمجية وتوفير مسار تصفية وحل ديناميكي معتمد (Bypass) عوضاً عن الاستدعاءات الخام أو الكومن جي إس (CommonJS require) لتفادي أخطاء الاختفاء.
- **السبب الفني**:
  - توقفت بعض اختبارات التكامل الحساسة لتعذر تحديد وحل مسار ملف `./prisma-audit` الديناميكي عند استدعائه عبر مترجمات بيئة الفحص.
- **النتائج والآثار**:
  - توحيد استدعاءات الاستيراد البرمجي ومطابقة الصياغة البرمجية لتوافق المترجم بنجاح تام وسرعة تتبع الاستعلامات.
- **الحالة**: `PROPOSED` (بانتظار موافقة مرحلة 1)

---

### 3. ADR-FIN-001 — Consolidation Elimination Request Snapshots

- **التاريخ**: 2026-06-02
- **القرار**: فرض وتفعيل تجميد لقطة الأرصدة البينية (Snapshots) للمستأجر والشركات التابعة برمجياً وقاعدة بيانات عند تقديم طلب الاستبعاد، وحظر أي ترحيل مالي مباشر دون مطابقة الأرصدة الحالية للقطة المجمدة.
- **السبب الفني**:
  - منع انحراف الأرصدة البينية بين لحظة تقديم طلب الاستبعاد والاعتماد والترحيل المالي النهائي في حال حدوث معاملات تجارية جديدة للشركات التابعة خلال دورة الموافقات المحاسبية الطويلة.
- **النتائج والآثار**:
  - دقة ونزاهة مالية تامة بنسبة 100% لميزان المراجعة الموحد للمجموعات وتفادي الأخطاء وفروقات المطابقة البينية.
- **الحالة**: `APPROVED`

---

### 4. ADR-MCP-001 — Read-Only First MCP Strategy with AI-Brain Governance

- **التاريخ**: 2026-06-02
- **القرار**:
  All MCP integrations must start as read-only or report/.ai-brain-write only. Production write, DB write, deploy, migration, and financial posting actions are forbidden unless a later explicit approval gate allows them. Every MCP/Skill/Add-on must update or feed `.ai-brain` with evidence, risks, gaps, decisions, or next actions.
- **السبب الفني**:
  Nama Invest ERP is a financial multi-tenant system. Tooling must accelerate audits and governance without risking production, tenant isolation, financial integrity, or secrets. `.ai-brain` must remain the official project memory and evidence register.
- **النتائج والآثار**:
  MCP rollout will be phased:
  1. Read-only repo/files/test/reporting.
  2. Brain governance automation.
  3. Security and quality scanners.
  4. DB/CI read-only.
  5. Production health read-only.
  6. Controlled write automation only after full release gates.
- **الحالة**: `PROPOSED`

---

## ADR-SKILL-001 — Nama AI Skill Files Bootstrap

### Date
2026-06-02

### Decision
Create dedicated AI Skill instruction files under `.skills/` for Brain Governance, QA Stabilization, API/Tenant Isolation, Prisma Governance, and Security/Compliance.

### Reason
Nama Invest ERP requires repeatable, governed agent behavior before enabling MCP or automation. Skills define allowed actions, forbidden actions, evidence tags, stop conditions, and `.ai-brain` update requirements.

### Consequence
Future AI-assisted work must load and respect the relevant Skill before performing audits, planning, or safe implementation tasks.

### Status
IMPLEMENTED

---

## ADR-BRAIN-001 — Brain Governance Scripts Bootstrap

### Date
2026-06-02

### Decision
Create local safe TypeScript scripts under `scripts/brain/` to validate and update `.ai-brain` without touching runtime code, database, production, deploy scripts, secrets, or MCP external configuration.

### Reason
Nama Invest ERP requires a reliable official project memory. `.ai-brain` must remain synchronized with reports, risks, gaps, decisions, approvals, evidence, and next actions.

### Consequence
Future phases can use these scripts to keep `.ai-brain` consistent before enabling read-only MCP foundation.

### Status
IMPLEMENTED

---

## ADR-BRAIN-002 — Full AI Brain Inventory and Classification

### Date
2026-06-02

### Decision
Perform a comprehensive recursive inventory and structural classification of all 85 files in `.ai-brain/` to define their truth levels and scope, rather than limiting the checks to the 20 core required files.

### Reason
The project memory expanded to 85 files during development, creating a potential gap where auxiliary or historical files were not audited or verified. Scanning all files ensures absolute consistency, zero false claims, and robust evidence tag validation across the entire `.ai-brain/` space.

### Consequence
All 85 files are cataloged, classified, and audited recursively. The diagnostics tools `check-brain-consistency.ts` and `validate-evidence-tags.ts` are upgraded to dynamically scan the entire `.ai-brain/` recursively.

### Status
IMPLEMENTED

---

## ADR-PROD-001 — Production Readiness Requires Read-Only Health, Backup, Rollback, and Monitoring Evidence

### Date
2026-06-02

### Decision
Nama Invest ERP must remain `WORLD_CLASS_CANDIDATE` until production health, backup/restore, rollback, monitoring, alerting, incident response, and production-like E2E evidence are collected through separately approved gates.

### Reason
World-class readiness cannot be claimed from code quality alone. Production operations require evidence for uptime, recoverability, observability, and incident handling.

### Consequence
Production checks must start as read-only. No PM2 restart, deploy, DB write, migration, or secret access is allowed without explicit approval.

### Status
PROPOSED

---

## ADR-WORLD-001 — World-Class Verification Requires Operational Evidence

### Decision
Nama Invest ERP remains `WORLD_CLASS_CANDIDATE` until E2E, production health, backup/restore, rollback, monitoring, security final verification, performance, and UAT evidence are captured.

### Reason
Code quality and coverage alone are not enough to claim global readiness. World-class ERP readiness requires operational proof, recovery proof, observability proof, and user acceptance evidence.

### Consequence
No report may mark the project as `WORLD_CLASS_VERIFIED` until the final release gate confirms all evidence.

### Status
IMPLEMENTED

---

## ADR-TEST-003 — Pause for Tenant Isolation Timeout Failure Analysis (Phase 1)

### Date
2026-06-02

### Decision
إيقاف التقدم في بوابات الجودة والتوسعة مؤقتاً عند بوابة الفحص الأولى (`FULL_TEST_RAW_EVIDENCE_CAPTURE_ONLY`) بسبب تعطل وفشل اختبار عزل المستأجرين `US-SECURITY-002` نتيجة تجاوزه مهلة الانتظار 5000ms، وتحويل المسار فوراً إلى مرحلة تحليل الفشل واستكشاف الأخطاء وتصحيحها (`GO_FOR_TEST_FAILURE_ANALYSIS_ONLY`).

### Reason
عزل المستأجرين (Tenant Isolation) وحماية البيانات في موديولات ERP متعدد المستأجرين هي ركيزة أمنية وسيادية حرجة جداً ولا تقبل أي تسامح أو تهاون. أي تعطل أو بطء أو فشل في اختبارات عزل الكيانات يمثل خطورة تستدعي الإيقاف الكامل والفحص المعماري لضمان عدم وجود أي تسريب للبيانات.

### Consequence
حظر الانتقال للموجات القادمة حتى يتم حل الفشل وتصفيره تماماً بنسبة نجاح 100%.

### Status
APPROVED

