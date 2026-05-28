# AI PROJECT MEMORY
*Nama Invest ERP - Master Technical Knowledge Base*
*Last Update: 2026-05-18*

## Welcome, AI Agent
You are operating within **Nama Invest ERP**, a massive multi-tenant, financially critical enterprise system built on Next.js, Prisma, and PostgreSQL. 
This file is the **Root Memory**. It serves as your index and operating manual.

**MANDATORY RULE**: Do NOT rely on guessing. Do NOT rely on standard CRUD patterns. This system has highly specialized, strictly enforced rules regarding financial atomicity, tenant isolation, and asynchronous event processing. 

### How to use this Memory System
Before modifying any code, you MUST perform a **DEEP SCAN LEVEL 3**:
1. Read the relevant links below based on the user's request.
2. Formulate a safe, transactional execution plan.
3. Treat all previously stabilized phases (Treasury, Sales/Purchase Returns, FX Gains, ZATCA Phase 2, Pharmacy Outbox, **Financial Period Lock Architecture Phase 1-4**) as **Baseline Stable**. Do not propose rewrites for them unless a true regression is found (Incremental Consistency Audit Mode).

---

## 📚 Project Brain Index
All detailed documentation resides in `docs/ai-brain/`. Read these files when touching their respective domains:

### Core Architecture
- [PROJECT_BRAIN.md](./docs/ai-brain/PROJECT_BRAIN.md) - Executive overview and critical risks.
- [SYSTEM_MAP.md](./docs/ai-brain/SYSTEM_MAP.md) - Folder structure, entry points, and runtime flow.
- [DOMAIN_MAP.md](./docs/ai-brain/DOMAIN_MAP.md) - Complete list of business domains (Accounting, Pharmacy, Manufacturing, etc.).
- [DATABASE_MAP.md](./docs/ai-brain/DATABASE_MAP.md) - Prisma ORM patterns, relations, and strict isolation rules.
- [API_MAP.md](./docs/ai-brain/API_MAP.md) - Next.js App Router rules and `requireTenantId` guardrails.
- [WORKFLOWS.md](./docs/ai-brain/WORKFLOWS.md) - Step-by-step guides for Outbox, Inventory, and Financial workflows.

### Security, Integrity, & Operations
- [SECURITY_AND_TENANT_ISOLATION.md](./docs/ai-brain/SECURITY_AND_TENANT_ISOLATION.md) - The inviolable rules of `tenantId` checking and RBAC.
- [FINANCIAL_INTEGRITY.md](./docs/ai-brain/FINANCIAL_INTEGRITY.md) - Rules for `runFinancialTx`, double-entry balancing, and ledger immutability.
- [INTEGRATIONS.md](./docs/ai-brain/INTEGRATIONS.md) - ZATCA, BullMQ background jobs, and Desktop Sync.
- [ENVIRONMENT_AND_CONFIG.md](./docs/ai-brain/ENVIRONMENT_AND_CONFIG.md) - Environment variables and secrets handling.
- [TESTING_STRATEGY.md](./docs/ai-brain/TESTING_STRATEGY.md) - Testing requirements and Baseline Stable features.
- [PERFORMANCE_AND_SCALING.md](./docs/ai-brain/PERFORMANCE_AND_SCALING.md) - Bottlenecks and Redis caching strategy.

### Auditing & Future Work
- [ERP_GAP_ANALYSIS.md](./docs/ai-brain/ERP_GAP_ANALYSIS.md) - Architectural benchmarking against Tier-1 enterprise systems.
- [ENTERPRISE_UPGRADE_ROADMAP.md](./docs/ai-brain/ENTERPRISE_UPGRADE_ROADMAP.md) - The strategic modernization phases.
- [KNOWN_RISKS_AND_TECH_DEBT.md](./docs/ai-brain/KNOWN_RISKS_AND_TECH_DEBT.md) - Unstable areas and dangerous patterns.
- [OPEN_QUESTIONS.md](./docs/ai-brain/OPEN_QUESTIONS.md) - Ambiguities requiring human clarification.

### Governance
- [AI_AGENT_RULES.md](./docs/ai-brain/AI_AGENT_RULES.md) - The absolute laws you must follow.
- [CHANGELOG_AI_BRAIN.md](./docs/ai-brain/CHANGELOG_AI_BRAIN.md) - History of this documentation.

---

## 🔄 The Permanent Documentation Rule
**This is the most critical instruction for your operation:**
After ANY implementation task, you must automatically update THIS FILE (`/AI_PROJECT_MEMORY.md`) and any relevant files inside `/docs/ai-brain/` to reflect the changes you made. 
**The Project Brain must NEVER become outdated.**

---

## 🚀 Completed Modernization Phases

### Phase: Production Credit Control Enforcement (2026-05-28)
* **Status**: `PRODUCTION_CREDIT_LIMIT_BLOCK_DEPLOYED_AND_VERIFIED`
* **Commit**: `513b3d59e9a4f4efb79435b6fa72e0d7c71dcf87` (`513b3d59`)
* **Scope**: Enforce automatic customer inactive and credit hold checks, plus credit limit validations across Sales API and POS checkout route.
* **Tests**: `src/__tests__/credit-limit-block.test.ts` (9/9 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com`.
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, protected admin APIs returned 401, roles endpoint sanitized with no sensitive field leakage. SHA256 checksums verified perfectly against local files.

### Phase: Production Stock Adjustment Tolerances Enforcement (2026-05-28)
* **Status**: `PRODUCTION_STOCK_ADJUSTMENT_TOLERANCE_DEPLOYED_AND_VERIFIED`
* **Commit**: `5c51e56d634476d7912acd788a9ed1c403e780ec` (`5c51e56d`)
* **Scope**: Enforce automatic absolute stock variance cost limit validations (5,000 SAR) across inventory adjustments and stocktake adjustments, restricting bypass only to admins/owners.
* **Tests**: `src/__tests__/stock-adjustment-tolerances.test.ts` (8/8 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files excluded).
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, protected admin APIs returned 401, roles endpoint sanitized with no sensitive field leakage. SHA256 checksums matched perfectly character-for-character between local and production.

### Phase: Production Tax Group Validation Enforcement (2026-05-28)
* **Status**: `PRODUCTION_TAX_GROUP_VALIDATION_DEPLOYED_AND_VERIFIED`
* **Commit**: `6d32440d899566c44ceee8d121c1339ee78f1935` (`6d32440d`)
* **Scope**: Implement dynamic and standard-based tax rate validation to meet ZATCA rules across Sales, POS, Purchase Orders, and Sales Returns APIs, returning HTTP 422 for unauthorized rates.
* **Tests**: `src/__tests__/tax-group-validation.test.ts` (8/8 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  * `tax-validation`: `d7518e35d7a0f9866d79066a6e4dbb07058a78e9535364146eb48b423ee287f4`
  * `sales route`: `e827d8ea320aaa6ab91e26bbdf5aa24ee9d5d038066a6da489b7fea3a56b15ef`
  * `POS checkout route`: `1748225b7d54758a45d787af6e7a971faf4e1a2ecb970aa8f1ba626321a191ba`
  * `purchase-orders route`: `026c3a67edd392d900316bd62e173e1b27b10cd292c32c346ba13ee51c12dc88`
  * `sales-returns route`: `e628aaade06d3c70fab5918784b053d4f5f5984d9617f780e8eb3a49c3b9edfc`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **ZATCA/accounting calculation changed**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage.

### Phase: Production Document State Machine Enforcement (2026-05-28)
* **Status**: `PRODUCTION_DOCUMENT_STATE_MACHINE_DEPLOYED_AND_VERIFIED`
* **Commit**: `1dd88889eda08a71d8b96b1a7dcdfa7432eef200` (`1dd88889`)
* **Scope**:
  - `src/app/api/sales/route.ts`
  - `src/app/api/purchases/route.ts`
  - `src/app/api/purchase-orders/[id]/route.ts`
* **Tests**: `src/__tests__/document-state-machine-enforcement.test.ts` (13/13 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `sales route`: `ed11c8379a8ea1b2167265181f072b6cd7e85a0079602cc48db90c65e867f732`
  - `purchases route`: `bb18509cabe936dec19a0af436dc008f08ee0f656f42d9c4e3353a91ca056f38`
  - `purchase-orders [id] route`: `6c1bdeccb3855b789a91d8757dd57a3b6ea1fc9cf009fc73232635d6b4987130`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage.

### Phase: Production Document Sequences Enforcement (2026-05-28)
* **Status**: `PRODUCTION_DOCUMENT_SEQUENCE_DEPLOYED_AND_VERIFIED`
* **Commit**: `6371c947351d3332a88feca0d6f6a92b2b914045` (`6371c947`)
* **Scope**:
  - `src/app/api/sales/route.ts`
  - `src/app/api/purchases/route.ts`
* **Tests**: `src/__tests__/dynamic-number-sequences.test.ts` (6/6 passed), full suite (1041/1041 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `sales route`: `1a4b61fb8310fc76213d8b326552d3185953f5d214b47a1648c94ff259fcf17d`
  - `purchases route`: `472eeea7b870521ccd8ba031e4e9463c927d974b8e7933ec645b3959ed5d63b0`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage (MFA secrets, passwordHash, and session/device tokens perfectly secure).


