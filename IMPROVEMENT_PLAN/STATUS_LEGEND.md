# 📊 دليل الحالة | Status Legend

> **توضيح مهم:** الملفات في الـ IMPROVEMENT_PLAN تحتوي **3 أنواع** من المحتوى.
> هذا الملف يوضح كيف تقرأها.

---

## 🟢 ماذا يوجد فعلاً في النظام (✅ موجود)

### مكوّنات يستخدمها النظام الآن
| الفئة | ما هو موجود |
|------|------------|
| **Backend** | 661 API route، Prisma schema بـ 157 model، multi-tenant، auto-journal.ts |
| **AI** | LangChain orchestrator مع 8 tools، Gemini integration، RAG endpoint، prompt registry |
| **Workflow** | 4 BullMQ queues (email, pdf, sync, report)، 16 cron routes |
| **Security** | Clerk auth، Sentry، rate limiting (Redis)، encryption |
| **Storage** | PostgreSQL، embedded-postgres للـ desktop |
| **UI** | 441 page، i18n، RTL Arabic، Tailwind v4 |
| **Testing** | 571 test files (محركات GOSI، WPS، EOS، ZATCA) |
| **Compliance** | ZATCA Phase 2 basic، GOSI calculator، WPS generator، EOS calculator |
| **Mobile** | PWA setup، Electron desktop |
| **DevOps** | GitHub Actions (lint، test، build، deploy)، Docker، Hetzner |

### Modules الموجودة (نسب الاكتمال من CLAUDE.md)
- ✅ Sales (60%)
- ✅ Purchases (50%)
- ✅ Payroll (50%) — مع GOSI، WPS، EOS
- ✅ HR (45%)
- ✅ Manufacturing (40%)
- ✅ Inventory (34%)
- ✅ AR/AP (35%)
- ⚠️ Treasury (25%)
- ⚠️ Fixed Assets (18%)
- ⚠️ Financial Reporting (50%)

---

## 🔴 ماذا ينقص فعلاً (❌ مفقود تماماً)

### Layers مفقودة كاملة
| الطبقة | الملف المتعلق |
|--------|---------------|
| ❌ E2E Tests (Playwright) | [19](19_INTEGRATION_TESTING.md) |
| ❌ OpenAPI documentation | [09](09_API.md) |
| ❌ API versioning (`/v1/`) | [09](09_API.md) |
| ❌ Idempotency keys | [09](09_API.md) |
| ❌ Service Layer (المنطق مبعثر) | [08](08_BACKEND_LOGIC.md) |
| ❌ State Machine enforcement | [04](04_WORKFLOW_ORCHESTRATION.md) |
| ❌ Approval Workflow Runtime | [04](04_WORKFLOW_ORCHESTRATION.md) |
| ❌ Saga Pattern | [04](04_WORKFLOW_ORCHESTRATION.md) |
| ❌ Vector DB HNSW (الموجود brute-force) | [11](11_VECTOR_DATABASES.md) |
| ❌ RAG Citations | [12](12_RAG.md) |
| ❌ RAGAS Evaluation | [12](12_RAG.md) |
| ❌ tanstack/react-table | [13](13_FRONTEND_UIUX.md) |
| ❌ react-hook-form adoption | [13](13_FRONTEND_UIUX.md) |
| ❌ Dark mode (معطّل) | [13](13_FRONTEND_UIUX.md) |
| ❌ Soft deletes | [10](10_DATA_STORAGE.md) |
| ❌ Doppler/Vault secrets | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| ❌ OpenTelemetry tracing | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| ❌ Prometheus + Grafana | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| ❌ pgBackRest | [10](10_DATA_STORAGE.md) |

### Modules مفقودة
- ❌ Customer Portal
- ❌ Vendor Portal
- ❌ Bank Reconciliation Engine
- ❌ LC / BG management
- ❌ Cash Flow Forecasting
- ❌ Lease Accounting (IFRS 16)
- ❌ Construction features
- ❌ Custom Report Builder
- ❌ Loyalty Program
- ❌ Promotions Engine
- ❌ ATS / Recruitment
- ❌ Performance Management

### تكاملات مفقودة
- ❌ Mudad API (only SIF generation موجود)
- ❌ Qiwa API
- ❌ Najiz
- ❌ Banks API (Open Banking)
- ❌ HyperPay / Moyasar / Tabby / Tamara
- ❌ Aramex / SMSA / DHL
- ❌ Salla / Zid / Shopify
- ❌ Microsoft 365 / Google Workspace SSO

---

## 🟡 ماذا موجود **لكن لا يعمل أو يعمل جزئياً** (⚠️ معطّل/جزئي)

### مشاكل نشطة (HARDENING.md + الفحص)
| البند | المشكلة |
|------|---------|
| ⚠️ pgvector | في الكود لكن **يقع في fallback لـ JS cosine** (HARDENING.md H-02) |
| ⚠️ MCP Server | [mcp-server.mjs](../mcp-server.mjs) موجود لكن **غير متصل بأي AI flow** |
| ⚠️ AI Job Queue | [src/lib/ai-job-queue.ts](../src/lib/ai-job-queue.ts) **stub فقط** (placeholders) |
| ⚠️ ai-cfo (3 نسخ) | 3 endpoints مختلفة لـ CFO، **لا اتساق** |
| ⚠️ Copilot chat | يحفظ المحادثات لكن **لا يستخدم Orchestrator** |
| ⚠️ ZATCA ICV/PIH | موجود لكن **chain غير محصّن** (محتمل gaps) |
| ⚠️ Theme Switcher | **معطّل** (display: none) — 9 themes معرّفة لكن غير قابلة للتفعيل |
| ⚠️ TypeScript | **`ignoreBuildErrors: true`** يخفي 91 خطأ |
| ⚠️ Sentry | sampling = 1.0 في prod = **مكلف جداً** |
| ⚠️ Ghost PostgreSQL | على Hetzner (Unix socket 5433) = **خطر** |
| ⚠️ DataTable | مخصصة بسيطة — **بدون sorting/virtualization** |
| ⚠️ FieldAuditTrail + FieldAuditLog | **نموذجين متضاربين** |
| ⚠️ NumberSequence + NumberingSequence | نفس الفكرة، **migration ناقص** |
| ⚠️ Health endpoint | `/api/health` يفحص DB فقط، **Redis/ZATCA placeholders** |
| ⚠️ RBAC | في UI فقط، **ليس في API layer** |

### Routes خطيرة (ضمن 297 بدون auth)
| Route | الخطر |
|-------|------|
| `/api/system/reset` | **إعادة تعيين النظام بدون auth!** |
| `/api/check-env` | **يكشف environment variables!** |
| `/api/upload` | **رفع ملفات مفتوح!** |
| `/api/tenant/provision` | إنشاء tenant بدون حماية |
| `/api/accounting/balance-sheet` | بيانات مالية مكشوفة |

### حقول معطّلة
- 🔴 **251 حقل Float لمبالغ مالية** — مخالف صريح لـ CLAUDE.md
- 🔴 الـ migrations **2 فقط** لـ 157 model
- 🔴 **0 E2E tests** رغم وجود Playwright في الخطط

### Buttons معطّلة
- 🔴 **109 زر معطّل** (16% من 674) في accounting / finance / cfo-ai

---

## 📚 كيف تقرأ كل ملف

كل ملف في `IMPROVEMENT_PLAN/` يحتوي **3 أقسام**:

```markdown
# اسم الموضوع

## 🔍 الموجود              ← ✅ ما هو حاضر فعلاً (مع روابط للملفات)
- مكوّن X في src/lib/...
- تكامل Y جزئي

## 🔴 الفجوات              ← ❌/⚠️ ما المفقود أو المعطّل
- ميزة A غير موجودة
- ميزة B موجودة لكن لا تعمل
- ميزة C جزئية

## 🎯 الخطة                ← 📋 ما يجب إضافته/إصلاحه
- المرحلة 1: ...
- المرحلة 2: ...
```

---

## 💡 مثال عملي — كيف تستخدم ملف

**خذ ملف [01_PROMPT_ENGINEERING.md](01_PROMPT_ENGINEERING.md):**

| القسم | المحتوى | المعنى |
|------|---------|-------|
| ✅ الموجود | Prompt Registry في `src/lib/prompts/registry.ts` | **عندك فعلاً** |
| ✅ الموجود | جدول `promptTemplate` في DB | **عندك فعلاً** |
| ✅ الموجود | Admin UI في `/admin/prompts` | **عندك فعلاً** |
| 🔴 الفجوة | 6 برومبتات Hardcoded تتجاوز الـ Registry | **مشكلة موجودة لازم تحلها** |
| 🔴 الفجوة | لا A/B Testing | **ميزة ناقصة لازم تضيفها** |
| 🔴 الفجوة | Token Budget غير مُستخدم | **موجود لكن ما يُستخدم** |

---

## 🎯 الخلاصة

### في الملفات اللي عملتها:
- 🟢 **ما يخص النظام الحالي:** الأقسام تحت "الموجود" — هذا ما عندك فعلاً
- 🔴 **المفقود/المعطّل:** الأقسام تحت "الفجوات"
- 📋 **خطة الإصلاح:** تحت "الخطة"

### الأرقام الإجمالية للنظام (من الفحص):
- **NA Routes: 661** — منها 297 بدون auth، 650 بدون Zod
- **Models: 157** — مع 251 حقل Float مالي يجب تحويلها
- **Pages: 441** — مع 109 dead button، 70 بدون i18n
- **Tests: 571** — لكن **لا coverage measurement**، **0 E2E**
- **Migrations: 2** فقط — لـ 157 model 🚨
- **AI Tools: 8** — مع orchestrator مستخدم في endpoint واحد فقط

### نسبة الاكتمال الإجمالية: **~30-35%**

---

## 📋 خطوة بخطوة

1. **اقرأ STATUS_LEGEND.md (هذا الملف)** — لتفهم البنية
2. **اقرأ [00_OVERVIEW.md](00_OVERVIEW.md)** — للفهرس
3. **ابدأ بـ [KICKOFF.md](KICKOFF.md)** — للأسبوع الأول (P0)
4. **لكل ميزة:** اقرأ الملف المخصص → "الموجود" يوضح حالتك → "الفجوات" يوضح ما تحتاج → "الخطة" تنفّذ خطوة بخطوة

---

**خلاصة الإجابة على سؤالك:**

> "هل تعملها لأنها موجودة عندي، أم تقصد إنها ناقصة، أم في أشياء لا تعمل؟"

**الجواب: كل الثلاث معاً!** 🟢 + 🔴 + 🟡

كل ملف يفصل:
- ✅ ماذا موجود (الجزء 🟢)
- ❌ ماذا ناقص (الجزء 🔴)
- ⚠️ ماذا موجود لكن معطّل/جزئي (الجزء 🟡)

والخطة تشمل **إصلاح المعطّل** + **إكمال الناقص** + **تحسين الموجود**.
