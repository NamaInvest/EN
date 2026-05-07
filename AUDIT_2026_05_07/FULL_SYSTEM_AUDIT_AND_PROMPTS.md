# Namasoft ERP — تقرير الفحص الشامل + مكتبة البرومنت الموحّدة

> **التاريخ:** 2026-05-07
> **النطاق:** فحص مباشر للكود (لم يُستند لأي تقارير سابقة)
> **الفرع:** `hardening/critical-fixes-2026-05-07`

---

## الجزء الأول: ما هو غير مربوط + المشاكل (Findings)

### 1) Backend / API Layer

**أرقام الواقع:**
- **661** ملف `route.ts` — حجم ضخم وغير مدار
- **474 POST** / **418 GET** / **75 PUT** / **51 DELETE** / **6 PATCH**
- **15 فقط (2.3%)** من الـ routes تستدعي `auth()` من Clerk
- **59 فقط (8.9%)** من الـ routes تفلتر بـ `tenantId`
- **3 فقط** من routes تستخدم `auto-journal`

**ثغرات حرجة:**
| الملف | المشكلة |
|------|---------|
| `api/employees/route.ts` | بدون auth |
| `api/salaries/route.ts` | بدون auth — خطر تسريب رواتب |
| `api/banks/route.ts`, `banks/[id]/transactions/route.ts` | بدون auth — خطر مالي |
| `api/fixed-assets/**` | بدون auth |
| `api/tenant/create/route.ts` | بدون auth — أي زائر يقدر ينشئ tenant! |
| `api/auth/sync/route.ts` | بدون auth |
| `api/webhooks/zid/route.ts` | فحص توقيع HMAC معطّل (commented) |
| `api/cron/**` (16 endpoint) | بدون token/IP whitelist — أي شخص يقدر يطلقها |

**Duplicate Routes (31 موضع):**
- `api/sales` ↔ `api/sales-orders` ↔ `api/v3/sales`
- `api/finance/payment-run` ↔ `api/finance/payment-runs` ↔ `api/accounting/payment-runs`
- `api/purchases` ↔ `api/purchasing` ↔ `api/purchase-orders`

**Stub/فاضي:**
- `api/copa/value-fields/route.ts` (0 bytes!)
- 21 ملف < 30 سطر بدون منطق

---

### 2) Frontend / UI Layer

**فوضى الـ UI (5 أنظمة متوازية):**
```
src/app/design1/  ← demo ميت
src/app/design2/  ← demo ميت
src/app/design3/  ← demo ميت
src/app/design4/  ← demo ميت
src/app/v3/       ← الإنتاج الحالي
src/app/_landing.tsx (34KB)         ← قديم
src/app/page_backup.tsx (41KB)      ← باكب
src/app/globals_backup.css (66KB)   ← باكب
```

**32 API module بدون UI dashboard:**
`copa, cmms, dms, lms, pdpl, saudi, wht, zakat, fng, shl, rem, inv, b2b, banks, budgeting, cpq, delivery-platforms, payments, purchasing, rebates, stock-movements, warranty, zatca` ... وغيرها

**صفحات بمعطيات وهمية (mock):**
- كل صفحات `(dashboard)/v3/**` تعرض أرقام hardcoded ("84.5% dropout"، "1204 class size")
- لا يوجد `useEffect + fetch` — مجرد قشرة UI

**Sidebar / Navigation:**
- **لا يوجد** ملف navigation config مركزي
- الروابط مبعثرة في الكود → مستحيل تدقيقها

**i18n:**
- `src/locales/ar.json` (228KB) و `en.json` (185KB) موجودة
- لكن صفحات مثل `ai-copilot/page.tsx` و `settings/import-export` تكتب عربي مباشرة (hardcoded)

**Forms:**
- `FormWrapper` موجود (react-hook-form + zod) — لكن **نادراً يُستخدم**
- معظم الصفحات `useState` يدوي بدون validation

**Accessibility:**
- `aria-label` في **2 ملفات فقط** (0.1%) من الـ dashboard
- `dir="rtl"` صحيح في 158 ملف

**استخدام مفرط لـ `'use client'`:**
- كل الـ dashboard pages client — ضرب أداء RSC

---

### 3) Database / Prisma Layer

**Numbers:**
- **491 model** في schema.prisma
- **2 migration فقط** بعد أبريل (وكلاهما seed insert، ليس DDL) → النظام يعتمد على `db:push` بدلاً من migrations
- **8 schema-backups** متعارضة (`schema_hetzner`, `schema_merged`, `schema_old_server`, ...)
- `server_schema.prisma` (107KB) في root — drift واضح

**Float بدلاً من Decimal على حقول مالية (19+ مكان):**
```
SalesInvoice.subtotal / discountValue / taxValue / total / paid    ← Float
SalesInvoiceDetail.price / quantity                                ← Float
Expense.amount                                                     ← Float
Manufacturing.totalCost / costPerHour                              ← Float
FixedAsset.purchasePrice / rentAmount                              ← Float
```
**كل واحد منها مخالف للقاعدة 3.4 في CLAUDE.md.**

**TenantId مفقود في 488 من 491 model!**
- النظام يعتمد على **database-per-tenant** فقط، بدون عمود tenantId للحماية
- أي bug واحد في routing يُسرّب بيانات بين العملاء
- لا توجد Row-Level Security كطبقة دفاع ثانية

**98 Cascade Delete على وثائق مالية:**
```
SalesInvoice → SalesInvoiceDetail   (Cascade)  ← يكسر audit trail
JournalEntry → JournalLine          (Cascade)  ← خطر ضريبي
PurchaseInvoice → PurchaseInvoiceDetail (Cascade)
```
**مخالف لقانون الاحتفاظ السعودي (6 سنوات).**

**Indexes ناقصة:**
- 51 `@@index` فقط على 491 model
- لا يوجد index على `(tenantId, status, createdAt)` في الموديلات الحرجة

**Prisma Client Pool:**
- Map<string, PrismaClient> per-tenant — لكن **بدون `disconnect()`** ولا حد أعلى → memory leak
- `embedded-postgres beta` في dependencies لكن **غير مستخدم** فعلياً

---

### 4) AI / LangChain / RAG / Vector Layer

**Status: 40% production-ready**

| المكوّن | الحالة |
|--------|--------|
| **Gemini integration** | ✅ يعمل (CFO, OCR, Copilot, Fraud) |
| **Prompt Registry** | ✅ DB-versioned مع `PromptUsageLog` |
| **LangChain Tools** | ⚠️ معرّفة (8 tools) لكن **لا تُستدعى أبداً** — Orchestrator موجود لكن endpoints تتجاوزه |
| **RAG Pipeline** | ❌ هيكل فقط — `KnowledgeDocument` فاضي، لا upload UI |
| **Vector Store** | ❌ JSON column + cosine برute-force → O(n) لكل query، لا pgvector |
| **Embeddings** | ✅ `text-embedding-004` (768 dim) جاهز |
| **MCP Server** | ⚠️ `mcp-server.mjs` كامل لكن **معزول** — لا client يطلبه |
| **Ollama** | ❌ مذكور في deps لكن لا server يعمل — `/api/explain` فقط (dev) |
| **Streaming (SSE)** | ⚠️ `src/lib/streaming.ts` جاهز لكن **لا endpoint يستخدمه** |
| **BullMQ jobs** | ❌ in-process queue فقط — يضيع مع كل restart |
| **Rate limiting / Cost cap** | ❌ غير موجود — خطر تكلفة Gemini |
| **Cache على AI responses** | ❌ غير موجود |

**AI Endpoints (10):**
- ✅ يعمل: `copilot`, `cfo`, `bank-reconciliation`, `purchases/ocr`
- ⚠️ stub: `rag`, `nlq`, `fraud-monitoring`, `demand-forecast`, `sales-coach`, `predictive-scm`

---

### 5) Infrastructure / DevOps / CI/CD

**كارثة سرّية (Critical):**
- ملف `.env` **مرفوع في git** ويحوي:
  - `CLERK_SECRET_KEY`, `GEMINI_API_KEY`, `ZEPTOMAIL_PASS`, `DATABASE_URL` بكلمة سر `root`
  - بيانات SSH للسيرفر على Hetzner
- لا يوجد `.env.example`
- لا `husky` ولا `lint-staged`

**Deploy Anarchy:**
- **39+ سكربت deploy** في root (`deploy_100.js`, `deploy_clean.js`, `deploy_force.js`, ...)
- `deploy_100.js` يحوي `host: '46.4.188.170'`، `password: '_ee4SWbxLVfH9b'` **plaintext**
- لا أحد يعرف أيهما الحالي

**CI/CD (`.github/workflows/ci.yml`):**
- ✅ يعمل: lint → typecheck → vitest → build → deploy
- ⚠️ **baseline يسمح بـ 95 خطأ TypeScript** (تقنية تجاهل)
- ⚠️ Production deploy يستخدم `prisma db push` (بدون migrations!) في CI
- ❌ لا staging environment
- ❌ لا canary
- ❌ لا upload sourcemaps لـ Sentry

**Tests:**
- jest **و** vitest كلاهما مثبّت — تعارض
- 11 ملف اختبار فقط (`auto-journal`, `zatca`, `validations`, `quotaGuard`, `money`, `gosi-engine`, `wps-generator`, `saudi-eos-engine`)
- ❌ **لا اختبار لـ `src/lib/costing.ts`** (FIFO/LIFO/WAVG غير مغطى)
- ❌ **لا اختبار لـ `src/app/api/zatca/**`** (المسار الحرج بدون اختبار)
- ❌ لا E2E tests (Playwright/Cypress غير موجود)

**TypeScript Errors:**
- `tsc-errors.txt` (634 سطر)، `tsc_errors.log` (193)، `ts_errors_2.txt` ...
- كلها في root → fix-on-the-side instead of fix-the-root
- معظمها Next.js 15+ async `params` — كل route handler `[id]` مكسور

**Monitoring:**
- Sentry DSN موجود لكن **لا upload sourcemaps** → stack traces عديمة الفائدة
- `instrumentation.ts` فاضي (33 سطر، captureRequestError = no-op)
- لا OpenTelemetry، لا metrics، لا distributed tracing

**Docker:**
- ✅ Dockerfile متعدد المراحل، non-root user
- ❌ `docker-compose.yml` يحوي passwords مكتوبة (`namasoft_password`)

---

### 6) Compliance / Critical Logic

**Auto-Journal (`src/lib/auto-journal.ts`):**
- ✅ Balance Debit==Credit (tolerance 0.01)
- ✅ `prisma.$transaction()` كامل
- ✅ يفحص الفترة المالية قبل الترحيل
- ❌ **لا يوجد guard على Posted-Entry Immutability** — يقدر أحد يعدّل قيد مرحّل
- ❌ **مفقود:** Payment Receipts, Bank Reconciliation, Fixed Asset Depreciation, Accruals

**ZATCA (`src/app/api/zatca/route.ts`, `sales/route.ts:412`):**
- 🔴 **Race Condition في ICV Counter:**
  ```typescript
  const currentCounter = parseInt(s[counterKey] || '0') + 1;  // قراءة
  // ... معالجة شبكة طويلة ...
  await prisma.setting.upsert(...)                              // كتابة لاحقة
  ```
  → طلبان متزامنان يقدران يقفزان رقم في التسلسل!
- 🔴 **Private Key plaintext في `Setting` table** — لا encryption-at-rest، لا HSM
- ✅ Phase 2 Reporting + Clearance كلاهما مُطبّق
- ✅ Sandbox/Production switch صحيح

**Costing (`src/lib/costing.ts`):**
- ✅ FIFO/LIFO/WAVG كلهم صحيح حسابياً
- ❌ **لا توجد aقفال (locks) على stock movements** — تنافس ممكن

**State Machine (`src/lib/state-machine-engine.ts`):**
- ✅ مركزي، rule-based
- ⚠️ **API endpoints تتجاوزه** وتعدّل status مباشرة (مثل `sales/route.ts:203`)

**PDPL / Saudi Privacy:**
- ❌ **لا يوجد** `api/pdpl/export` ولا `api/pdpl/delete`
- لا تنفيذ لحق الوصول/الحذف للبيانات الشخصية
- مخالفة لـ نظام حماية البيانات الشخصية السعودي

**Document Numbering, Approval Engine, Field Audit, GOSI:**
- ✅ كلها سليمة ومُختبرة

---

### الخلاصة بنظرة سريعة

| الطبقة | درجة الجاهزية | أكثر مشكلة حرجة |
|--------|---------------|-------------------|
| Backend API | 🟠 50% | 97.7% بدون auth + 91% بدون tenantId scoping |
| Frontend UI | 🟠 45% | 5 أنظمة UI متعارضة + 32 module بلا واجهة |
| Database | 🔴 35% | 488 model بلا tenantId + 19 Float مالي + 2 migration فقط |
| AI / RAG | 🟠 40% | RAG هيكل فاضي + tools لا تُستدعى |
| DevOps / CI | 🔴 30% | `.env` في git + 39 deploy script + 95 TS errors مسموحة |
| Compliance | 🟡 70% | ZATCA race condition + لا PDPL endpoints |
| Tests | 🔴 25% | jest+vitest مزدوجة + costing/zatca بلا اختبار |

---

---

## الجزء الثاني: مكتبة البرومنت الموحّدة (Prompt Library)

> **استخدم كل برومنت كمدخل مستقل لـ Claude/Cursor عند تشغيل مرحلة معينة.**
> **كل برومنت يحوي: System / Context / Constraints / Output Spec.**

---

### 🎯 PROMPT 1 — Prompt Engineering & System Prompt

```text
ROLE: You are a senior Prompt Engineer for Namasoft ERP (Saudi multi-tenant SaaS, Next.js 16 + Prisma).

CONTEXT:
- Project at d:\namasoft9-3-main has 10 Gemini-backed AI endpoints with NO unified system prompt strategy.
- Prompt registry exists in DB (PromptTemplate model + getPrompt() in src/lib/prompts/registry.ts) but NO admin UI and NO governance.
- Each endpoint hand-crafts its own prompt inline — drift, no testing, no version pinning.

TASK:
1. Audit every prompt currently used across:
   - src/app/api/ai/copilot/route.ts
   - src/app/api/ai/cfo/route.ts
   - src/app/api/ai/rag/route.ts
   - src/app/api/ai/nlq/route.ts
   - src/app/api/ai/fraud-monitoring/route.ts
   - src/app/api/ai/bank-reconciliation/route.ts
   - src/app/api/ai/demand-forecast/route.ts
   - src/app/api/ai/sales-coach/route.ts
   - src/app/api/ai/predictive-scm/route.ts
   - src/app/api/purchases/ocr/route.ts
2. Migrate every inline prompt into PromptTemplate rows (key, version=1, scope=global, locale=ar/en).
3. Define ONE shared system prompt for the platform that includes:
   - Identity: "You are Nama AI, the Saudi-Arabic-first ERP assistant."
   - Compliance: ZATCA, SOCPA, PDPL, GOSI awareness rules.
   - Tone: Concise Arabic primary; English secondary; numbers in SAR.
   - Refusal: Refuse modifying posted journal entries, cleared ZATCA invoices, closed periods.
4. Build a prompt linting checklist (output format, hallucination guards, tool-call signatures).

OUTPUT:
- Markdown: prompts/SYSTEM_PROMPT.md
- 10 PromptTemplate seed rows in prisma/seed-prompts.ts
- One prompt-eval suite (vitest) in tests/prompts/eval.test.ts that asserts each prompt produces parseable JSON / valid markdown.
- Naming convention: `<domain>.<intent>.<version>` (e.g. `ai.cfo.daily.v1`).
```

---

### 🎯 PROMPT 2 — Context Management & RAG

```text
ROLE: You are an LLM Context Engineer.

CONTEXT:
- KnowledgeDocument table exists with embedding:Json field. KnowledgeChunk has Float[768] but no ingestion pipeline.
- Brute-force cosine search in src/lib/vector-store.ts loads ALL docs into memory — fails at scale.
- No document upload UI, no chunking, no metadata filtering.
- ERP needs: Saudi tax rulings, IFRS standards, internal SOPs, vendor docs, contracts.

TASK:
1. Add pgvector extension to Postgres (migration: CREATE EXTENSION vector).
2. Replace Float[768] in KnowledgeChunk with `vector(768)` type via prisma raw.
3. Implement chunking pipeline (LangChain RecursiveCharacterTextSplitter, chunkSize=800, overlap=120).
4. Implement /api/ai/rag/ingest (POST) accepting:
   - file (PDF/DOCX/MD/TXT) → parse → chunk → embed → store
   - metadata: { tenantId, source, docType, lang, expiresAt }
5. Refactor /api/ai/rag/route.ts retrieval:
   - top-k=8 with HNSW index
   - tenantId filter (CRITICAL)
   - Re-rank with Gemini (optional)
   - Returns chunks + citations
6. Build RAG admin UI at /(dashboard)/ai/knowledge with: upload, list, delete, re-index.

CONSTRAINTS:
- Embed via existing GoogleGenerativeAIEmbeddings (text-embedding-004, 768).
- Cost guard: max 100 documents/tenant unless plan upgraded.
- PDPL: respect data residency (no upload to non-KSA cloud without consent flag).

OUTPUT:
- 1 Prisma migration
- 4 API routes (/ingest, /query, /list, /delete)
- 1 dashboard page
- vitest suite covering ingest+query roundtrip
```

---

### 🎯 PROMPT 3 — Workflow & Orchestration (LangChain Chaining)

```text
ROLE: You are a LangChain Architect.

CONTEXT:
- src/lib/langchain-orchestrator.ts has 8 tools defined (get_erp_metrics, get_customer_balance, get_invoice_by_id, search_products, get_account_balance, list_open_invoices, list_pending_approvals, get_cash_position) but they are NEVER invoked — chain bypasses tool calls.
- Endpoints (copilot, cfo, fraud) call Gemini directly without orchestration.
- No agentic loop, no ReAct pattern, no streaming.

TASK:
1. Refactor src/lib/langchain-orchestrator.ts into a true ReAct agent:
   - Use `createToolCallingAgent` from langchain
   - Bind all 8 tools
   - Add 6 new tools: createDraftInvoice, runZATCAClearance, postJournalEntry, requestApproval, runDemandForecast, generateBankReconciliation
2. Wire all AI endpoints through the orchestrator:
   - /api/ai/copilot → orchestrator.invoke({ input, tenantId, userId })
   - /api/ai/cfo → orchestrator.stream(...)
3. Add tool authorization layer: each tool checks user's RBAC role before executing (e.g. only CFO can call list_pending_approvals).
4. Implement streaming via src/lib/streaming.ts (already exists, unused).
5. Add observability: log every tool call to PromptUsageLog with toolName, args, result, latencyMs.
6. Add circuit breaker: if Gemini fails 3 times in 60s, fallback to a deterministic response.

CONSTRAINTS:
- Every tool MUST validate tenantId from AsyncLocalStorage context.
- No tool may execute write operations without `requireWriteApproval=true` flag in the agent's run.
- Cost cap: max 20 tool calls per chain run.

OUTPUT:
- Refactored src/lib/langchain-orchestrator.ts
- New src/lib/ai-tools/* (one file per tool)
- Streaming-enabled endpoints
- Integration test that runs a full agent loop end-to-end
```

---

### 🎯 PROMPT 4 — Backend / Logic / API Hardening

```text
ROLE: You are a Backend Security Engineer for a Saudi multi-tenant SaaS.

CONTEXT — REAL ISSUES IN d:\namasoft9-3-main:
- 661 route.ts files; only 15 (2.3%) call Clerk auth().
- Only 59 (8.9%) filter Prisma queries by tenantId.
- 16 cron endpoints (/api/cron/**) accept calls from anyone — no token check.
- Webhook /api/webhooks/zid/route.ts has signature check commented out.
- /api/tenant/create/route.ts is publicly callable.
- 31 duplicate route patterns (sales vs sales-orders vs v3/sales).

TASK:
1. Build src/lib/api-guard.ts that wraps every route handler:
   ```ts
   withGuard(handler, { auth: true, tenantScoped: true, allowedRoles: [], rateLimit: '60/min' })
   ```
2. Codemod (using ts-morph, already in deps): rewrite ALL 661 routes to use withGuard with sane defaults.
3. Add cron secret token: every /api/cron/** must verify `x-cron-token` header against env.CRON_SECRET.
4. Re-enable HMAC verification on /api/webhooks/zid (use SALLA pattern as reference).
5. Lock down /api/tenant/create — only system admins (role=ROOT) may call.
6. Generate a deduplication report: for each duplicate group (sales, purchases, finance), pick canonical and mark others @deprecated with redirect to canonical.
7. Add OpenAPI generator: scan all routes via ts-morph and emit src/app/api/openapi/route.ts (already exists — populate it).

CONSTRAINTS:
- DO NOT break existing frontend calls — emit deprecation warnings, not 410.
- Rate-limiting via in-memory LRU + Redis (BullMQ Redis already configured).
- Multi-tenant isolation MUST be enforced at the guard layer, not trusted from middleware alone.

OUTPUT:
- src/lib/api-guard.ts
- scripts/codemod-add-guard.ts
- 1 markdown report listing 31 duplicate groups + canonical choice
- New tests/integration/api-guard.test.ts covering auth + tenant + role + rate-limit
```

---

### 🎯 PROMPT 5 — Data & Storage / Vector / Schema

```text
ROLE: You are a Database Architect, Saudi ERP domain.

CONTEXT — REAL ISSUES:
- prisma/schema.prisma: 491 models. 488 lack tenantId. Multi-tenancy depends purely on database-per-tenant routing — no defense-in-depth.
- 19+ financial fields use Float (SalesInvoice.subtotal, total, paid; Expense.amount; Manufacturing.totalCost; FixedAsset.purchasePrice; ...). VIOLATES CLAUDE.md rule 3.4.
- Only 2 migration directories — project is on `prisma db push`. server_schema.prisma in root + 8 schema-backups → drift evidence.
- 98 cascade deletes on financial documents — breaks 6-year retention rule.
- Only 51 @@index across 491 models.
- embedded-postgres beta in deps but unused.

TASK — Phase 1 (data integrity):
1. Generate a Prisma migration that converts every Float on a financial field to `Decimal(19, 4)`. Provide a Postgres data-migration step that re-casts existing values.
2. For every model containing `customerId`, `vendorId`, `invoiceNo`, `accountId`, or `productId`: add `tenantId Int` + `@@index([tenantId])` + composite indexes `(tenantId, status, createdAt)`.
3. Replace cascade deletes on financial docs with `onDelete: Restrict`. Add `isDeleted Boolean @default(false)` + soft-delete middleware.

TASK — Phase 2 (vector search):
4. Add pgvector extension. Convert KnowledgeChunk.embedding from Float[768] to `Unsupported("vector(768)")`. Add HNSW index.
5. Remove embedded-postgres dependency (unused).

TASK — Phase 3 (governance):
6. Move project from `db push` to migrations: lock package.json, document policy in HARDENING.md, add `prisma migrate diff` check to CI.
7. Delete schema-backups/ once consolidated; archive to S3.

CONSTRAINTS:
- Zero-downtime migration plan: dual-write for tenantId backfill → switch reads → drop old paths.
- Every change atomic per migration; never combine schema + data.
- Preserve referential integrity for ZATCA-cleared invoices (≥6 years retention).

OUTPUT:
- 5 Prisma migrations (numbered)
- src/lib/prisma-soft-delete-middleware.ts
- HARDENING.md addition
- One report: "Data Integrity Score" before/after
```

---

### 🎯 PROMPT 6 — Frontend / UI-UX (Next.js 16 + RSC + RTL)

```text
ROLE: You are a Senior Next.js 16 / RSC / Tailwind 4 frontend engineer for an Arabic-first ERP.

CONTEXT — REAL ISSUES:
- src/app/ contains 5 competing UI systems: design1, design2, design3, design4, v3 + _landing.tsx + page_backup.tsx + globals_backup.css. Only v3 is alive.
- 32 API modules have NO dashboard page (copa, cmms, dms, lms, pdpl, saudi, wht, zakat, fng, shl, rem, inv, b2b, banks, budgeting, cpq, ...).
- All v3 pages render mock data (hardcoded "84.5% dropout") — no fetch.
- Sidebar/navigation has NO central config file — links scattered.
- 'use client' overused on every dashboard page (forces client bundle bloat).
- aria-* in only 2 files of 80+ dashboard pages.
- FormWrapper (react-hook-form + zod) exists but rarely used; pages roll their own useState forms.
- 3 pages still hard-code Arabic strings outside i18n (ai-copilot, settings/import-export, settings/roles).

TASK:
1. Delete: src/app/design1, design2, design3, design4, _landing.tsx, page_backup.tsx, globals_backup.css.
2. Create src/config/navigation.ts as a single source of truth for sidebar (groups, items, role, icon, href, badge).
3. For each of the 32 orphan API modules, scaffold a dashboard page under src/app/(dashboard)/<module>/page.tsx using:
   - Server Component by default (async function, fetch from internal API)
   - DataTable from existing components
   - Standard layout: PageHeader + StatCards + DataTable + ActionDrawer
4. Migrate all forms to FormWrapper + zod schemas (auto-generate schemas from API zod schemas).
5. Audit RTL: verify all flexbox `space-x-*` use logical `gap-*`; replace `pl-/pr-` with `ps-/pe-`.
6. Add a11y: every interactive element gets aria-label; every form input gets aria-required/invalid.
7. Move hardcoded strings into src/locales/{ar,en}.json under namespace `app.<module>.<key>`.

CONSTRAINTS:
- Default to RSC; only use 'use client' when component uses hooks/state/event handlers.
- All currency rendered via formatSAR() helper (already exists in src/utils).
- Every page must support light AND dark mode (Tailwind 4 variants).
- Every list page must have skeleton loaders + empty state + error boundary.

OUTPUT:
- 32 new pages
- src/config/navigation.ts
- Cleanup commit deleting legacy folders
- Lighthouse a11y score ≥ 95 on 5 sampled pages
```

---

### 🎯 PROMPT 7 — Infrastructure / DevOps / CI/CD

```text
ROLE: You are a DevOps SRE working on a Next.js + Postgres + Electron ERP.

CONTEXT — REAL DISASTERS:
- .env is committed to the repo with real secrets: CLERK_SECRET_KEY, GEMINI_API_KEY, ZEPTOMAIL_PASS, DATABASE_URL (password: root), Hetzner SSH password.
- 39+ legacy deploy scripts in root (deploy_100.js, deploy_force.js, deploy_clean.js, ...). deploy_100.js literally has `password: '_ee4SWbxLVfH9b'` plaintext.
- CI baseline allows 95 TypeScript errors. tsc-errors.txt is 634 lines — Next.js 15 async params not migrated.
- Sentry DSN configured but NO sourcemap upload step → unreadable stack traces in prod.
- instrumentation.ts is a stub — onRequestError is empty.
- No staging environment. CI deploys directly to prod main on push.
- jest + vitest both installed; CI uses vitest, but jest.config.ts still around → confusion.
- No husky / lint-staged → secrets can be committed.

TASK:
1. ROTATE every secret in .env (Clerk, Gemini, Zeptomail, DB, SSH). New secrets go to GitHub Actions + Hetzner secret manager.
2. Run `git filter-repo` to purge .env, .env.local.backup, deploy_100.js (and anything with hardcoded creds) from history. Force push to a new orphan branch + retire the old one.
3. Commit .env.example with all keys (no values) and a README block explaining each.
4. Add husky + lint-staged + git-secrets pre-commit hook to block .env/.pem/.key/secret patterns.
5. Delete every deploy_*.js / deploy_*.ps1 / deploy_*.sh in root. Replace with single canonical .github/workflows/deploy.yml using OIDC to AWS or SSH with managed key.
6. Set up staging environment: branch `staging` → auto-deploy to staging.namainvist.com.
7. Add Sentry sourcemap upload step in CI (after `next build`, before deploy).
8. Migrate to OpenTelemetry: instrumentation.ts → @vercel/otel + traces+metrics+logs to honeycomb/grafana.
9. Drive TypeScript errors from 95 baseline → 0 in 4 batches: route handlers (Next 15 params) → prisma client generics → form types → cleanup.
10. Remove jest entirely; standardize on vitest. Remove jest config + ts-jest + @types/jest.

CONSTRAINTS:
- DO NOT delete history without first taking a full backup snapshot.
- Provide a 1-day rollback procedure for every change.
- Document everything in HARDENING.md.

OUTPUT:
- New .env.example
- Single .github/workflows/{ci,deploy,security-scan}.yml
- HARDENING.md updated
- A "secrets rotation log" markdown listing every key, when rotated, by whom
```

---

### 🎯 PROMPT 8 — Testing & QA (Unit + Integration + E2E)

```text
ROLE: You are a Test Architect.

CONTEXT — REAL STATE:
- 11 test files total in src/. Critical files UNTESTED:
  - src/lib/costing.ts (FIFO/LIFO/WAVG)
  - src/app/api/zatca/** (Saudi tax compliance)
  - src/lib/auto-journal posting paths (only balance is tested)
  - src/app/api/payroll/** (GOSI calculations partially tested)
- jest + vitest both installed → tooling conflict.
- No E2E tests (no Playwright, no Cypress).
- No coverage report in CI.
- Pact / contract tests: none.

TASK:
1. Standardize on vitest. Delete jest.config.ts, jest.setup.ts, ts-jest, @types/jest.
2. Add c8 coverage; set CI fail-if-below: 70% lines, 80% branches on src/lib/** and src/app/api/**.
3. Write unit tests for:
   - src/lib/costing.ts: FIFO consumes oldest first, LIFO newest, WAVG correct math, edge cases (zero stock, negative qty).
   - src/lib/auto-journal: every event type (sales, purchase, expense, return, GRN, manufacturing, transfer, payroll) round-trip + balance check.
   - src/app/api/zatca/route.ts: ICV monotonic under concurrency (use Promise.all of 50 inserts → assert no gaps), PIH chain integrity.
   - src/lib/state-machine-engine.ts: every transition allowed/denied per role.
4. Add integration tests using a testcontainers Postgres:
   - Multi-tenant isolation: create 2 tenants, write to A, assert query as B returns nothing.
   - Period-close: try to post after period closed → 403.
   - PDPL: export+delete flow.
5. Add Playwright E2E:
   - Login → create customer → create invoice → ZATCA simulation → see in dashboard.
   - Inventory transfer → balance updates correctly.
   - Approval workflow happy path.
6. Add property-based tests via fast-check on number-sequence-engine (no gaps under concurrency).
7. Wire all of the above into CI as a separate `test` job.

CONSTRAINTS:
- Tests MUST run against real Postgres (testcontainers), not mocks, for integration suites.
- Every PR must run unit + integration. E2E nightly only.
- No flaky tests allowed: any test failing 2x in 7 days gets quarantined automatically.

OUTPUT:
- 30+ new test files
- vitest.config.ts with coverage thresholds
- playwright.config.ts + fixtures
- CI matrix update
- Coverage badge in README
```

---

### 🎯 PROMPT 9 — Compliance / Auto-Journal / ZATCA Critical Fixes

```text
ROLE: You are a SOCPA-certified accountant + senior backend engineer.

CONTEXT — REAL CRITICAL BUGS:
1. ZATCA ICV/PIH counter has a race condition (sales/route.ts:412): reads counter, processes for seconds (network), THEN writes. Two concurrent invoices CAN skip a number — ZATCA rejects gaps.
2. ZATCA private key stored plaintext in Setting table. No HSM, no encryption-at-rest.
3. Auto-journal has no posted-entry-immutability guard: a developer could call prisma.journalEntry.update on a posted JE and silently destroy audit trail.
4. State-machine bypass: API routes (e.g., sales/route.ts:203) write status directly, ignoring DocumentStateMachine.
5. Auto-journal MISSING events: payment receipts, bank reconciliation, fixed-asset depreciation, accruals.
6. PDPL endpoints completely absent (no export, no delete, no consent log).

TASK:
1. Fix ZATCA ICV race:
   - Wrap counter read+increment+invoice insert in a single prisma.$transaction with `isolationLevel: 'Serializable'`.
   - Or use Postgres SEQUENCE for ICV per tenant (recommended).
2. Encrypt ZATCA private keys:
   - Use AES-256-GCM with master key from env (KMS in prod).
   - Add src/lib/zatca-key-vault.ts: getKey(tenantId), rotateKey(tenantId).
3. Add immutability guard to auto-journal:
   - Prisma middleware: if model=JournalEntry and op=update and current.status='posted' → throw "Posted entries are immutable; create a reversal".
   - Add reverseJournalEntry(jeId) helper.
4. Implement missing events:
   - postPaymentReceipt(paymentId)
   - postBankReconciliation(reconId)
   - postDepreciation(assetId, period)
   - postAccrual(accrualId)
5. Centralize state transitions:
   - Forbid direct status writes in API routes; route everything through DocumentStateMachine.transition().
   - Codemod to find and replace every `status: '...'` write inside api/ files.
6. Build PDPL endpoints:
   - GET /api/pdpl/export?subjectId — returns ZIP of all data tied to the subject (customer/employee/user).
   - POST /api/pdpl/delete — soft-deletes + anonymizes (per Saudi PDPL Article 18).
   - GET /api/pdpl/consents — list consent records (need new table ConsentLog).

CONSTRAINTS:
- Every fix MUST come with a regression test.
- Never destroy historical data (PDPL delete = anonymize, not erase).
- All journal-entry changes are reversible via reversal entries — no in-place edits anywhere in the codebase.

OUTPUT:
- 6 patched files
- 2 new files (zatca-key-vault.ts, pdpl-engine.ts)
- 1 Prisma migration (ConsentLog table, encryption columns)
- 4 new API routes under /api/pdpl/**
- Tests covering each fix
```

---

### 🎯 PROMPT 10 — Master Orchestration Prompt (the "do everything" supervisor)

```text
ROLE: You are the Lead Architect supervising 9 specialist agents (PromptEng, Context, Workflow, Backend, Data, Frontend, DevOps, Testing, Compliance) on the Namasoft ERP hardening sprint.

GOAL:
Bring the system from "prototype" to "production-grade Saudi ERP" in 6 sprints.

KNOWN BASELINE (do not re-audit, this is verified):
- 661 API routes, 2.3% authenticated, 8.9% tenant-scoped
- 491 Prisma models, 488 missing tenantId, 19 Float financial fields
- 5 dead UI namespaces (design1-4 + v3 active), 32 modules without UI
- AI: 40% prod-ready, RAG empty, tools defined but never invoked
- DevOps: .env in git, 39 legacy deploy scripts, 95 TS errors baselined
- Compliance: ZATCA ICV race, no PDPL endpoints

SPRINT PLAN:
- Sprint 1 (Week 1-2): Security & Secrets — PROMPT 7
- Sprint 2 (Week 3-4): Data integrity — PROMPT 5 + PROMPT 9
- Sprint 3 (Week 5-6): API hardening — PROMPT 4
- Sprint 4 (Week 7-8): Frontend cleanup + missing dashboards — PROMPT 6
- Sprint 5 (Week 9-10): AI/RAG/Orchestration — PROMPT 1, 2, 3
- Sprint 6 (Week 11-12): Testing + Observability — PROMPT 8 + monitoring

For each sprint:
1. Load the relevant specialist prompt above as the system prompt for that agent.
2. Run the task to completion with PR-per-deliverable.
3. Block next sprint until: tests pass, code review approved, no regression in /api/health.
4. Report progress in MASTER_ROADMAP.md after each sprint.

EXIT CRITERIA (Definition of Done for the entire program):
- 0 TypeScript errors (no baseline)
- ≥80% coverage on src/lib/** and src/app/api/**
- All routes auth+tenant scoped
- All Float financial fields → Decimal
- ZATCA passes 100-invoice concurrency test with 0 gaps
- PDPL export+delete+consent operational
- RAG ingests 100 docs and answers a 50-question eval set with ≥80% accuracy
- Lighthouse ≥95 on 10 dashboard pages
- Single CI/CD pipeline; staging env active; Sentry sourcemaps live
- HARDENING.md fully updated
```

---

## الخطوات المقترحة الآن (Recommended Next Action)

1. **أوقف تطوير ميزات جديدة لمدة 2-3 أسابيع.**
2. ابدأ بـ **PROMPT 7 (DevOps)** — لأن `.env` في git خطر داهم، وكل ثانية تأخّر = خطر تسريب.
3. ثم **PROMPT 5 + PROMPT 9** — TenantId + Float + ZATCA race condition (تكامل مالي).
4. ثم **PROMPT 4** — API guard موحّد.
5. الباقي (UI، AI، Tests) ممكن يجري بالتوازي بعد ذلك.

---

**ملف هذا التقرير:** `AUDIT_2026_05_07/FULL_SYSTEM_AUDIT_AND_PROMPTS.md`
**يمكن استدعاء أي برومنت بشكل مباشر** كنقطة بداية لجلسة Claude/Cursor جديدة.
