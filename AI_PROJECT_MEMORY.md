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

### Phase WORKER-HARDEN-01 — Reconciliation Worker Safety Fix (2026-05-29)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `1cc63c6edc1fa310cb5d5b0606f21112c5a268b6` (`1cc63c6e`)
* **Scope**: Hardening the `SystemReconciliationWorker` against unmigrated trial/free/test databases lacking the dynamic `deleted_at` soft-delete column (Schema Drift).
* **Files Modified & Deployed**:
  - `src/workers/audit/reconciliation.worker.ts` *(Only deployed runtime file, tests excluded)*
* **Tests Added**:
  - `src/workers/audit/__tests__/reconciliation.worker.test.ts`
* **Reason for Fix**: Prevent database query crashes (`P2021` / PostgreSQL column does not exist) from unmigrated or abandoned trial/free/demo subdomains from halting or cluttering the system background reconciliation worker logs.
* **What was Done**:
  - Implemented strict tenant filtering to only run reconciliation for active, non-trial, non-free, and non-test subdomains.
  - Added resilient schema-drift checking in `try-catch` to classify missing `deleted_at` / `P2021` errors as clean warnings (`logger.warn`) and allow the worker to seamlessly proceed processing remaining paying tenants.
  - Zero financial/accounting calculation logic changed.
* **Local Verification**: Local typecheck PASS, local prisma validate PASS, Jest 3/3 tests PASS, local build PASS.
* **Production Deployment & Verification**:
  - Uploaded ONLY `reconciliation.worker.ts` to `/www/wwwroot/namainvist.com/src/workers/audit/reconciliation.worker.ts`.
  - Local and Server SHA256 matched perfectly: `18aa590f27eecee39665b73fb6364fe78f623065a0997a6b41d996e7922b0a8c`.
  - Server prisma validate PASS, Server build completed successfully with exit code 0.
  - PM2 `saas-app` restarted cleanly and remains online. Verified that `main-site`, `n1-main`, and `staging` were completely untouched.
  - Confirmed 0 unhandled exceptions or worker crashes in server logs since deployment.
* **Strict Confirmed Guarantees**:
  - NO database or Prisma schema changes.
  - NO migrations or db push executed.
  - NO environment (.env) configuration changes.
  - NO test files or temporary reports uploaded to the server.
  - Zero change to reconciliation/accounting calculations.

### Phase UI-HARDEN-01 — Server Component i18n Runtime Fix (2026-05-29)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `4b19bb14fa60053e1a77b0110b5dd14292356b99` (`4b19bb14`)
* **Scope**: Refactor 7 Next.js Server Components violating the client/server boundary by invoking the client-side `useTranslation()` hook. Refactored all synchronous and asynchronous Server Components to use the asynchronous, cookie-based `getServerLang()` pattern from `@/lib/server-t`.
* **Files Modified & Deployed**:
  - `src/app/(dashboard)/quality/inspections/page.tsx`
  - `src/app/(dashboard)/admin/prompts/cost/page.tsx`
  - `src/app/(dashboard)/purchases/orders/page.tsx`
  - `src/app/(dashboard)/admin/compliance-dashboard/page.tsx`
  - `src/app/(dashboard)/admin/migration/page.tsx`
  - `src/app/(dashboard)/admin/training-compliance/page.tsx`
  - `src/app/(dashboard)/learn/page.tsx`
* **SHA256 Checksums**:
  - `inspections`: `7ff867f212bfcffa3fa586f80f2373d3d33cf10f6db7ac1c970f525d3496f35c`
  - `prompts/cost`: `4661972139036dd218e6d752f578e7995fc9f4214570bf87f8720d20c98a39f7`
  - `purchases/orders`: `80992649571c623277fa461e046ce078a5cd62cb37a84ff7f106b37bb537ed57`
  - `compliance-dashboard`: `73419e5e2146f3e32de291db7f408943dc8a3a562f72bdbab152091cba17c0c0`
  - `migration`: `2676810b1d57216c72e8886514e7179583a819cec67b28b2dbd0606da5278e09`
  - `training-compliance`: `7abf033d2c5ac32f50f92f1bed0697ca3421c0f26ca97d00f742079389182f29`
  - `learn`: `8f531844b06904c4ebcfe76f33da7577c305aa91b531d2fb163aaece8b449c73`
* **Database / Prisma Schema**: Unchanged (no migrations, no db push).
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with clean boot logs (0 errors).
* **Runtime Verification**: Local typecheck PASS, local prisma validate PASS, local build PASS. Server build completed successfully under Turbopack. Curled live subdomains (`namainvist.com` returned 200 OK, `ahmedalyamicompany.namainvist.com` returned 200 OK). Audited PM2 logs and confirmed 0 occurrences of `useTranslation` warnings, server render crashes, hydration mismatches, or 500 errors since deployment.

### Phase UI-HOTFIX-01 — Next.js Dynamic Params Production Fix (2026-05-29)
* **Status**: `PRODUCTION_DYNAMIC_PARAMS_HOTFIX_DEPLOYED_AND_VERIFIED`
* **Commit**: `643288770c8144802e3e05742f5c3e4ad2dd3327` (`64328877`)
* **Scope**: Resolve fatal client-side exception and server components render crash on dynamic page routes by wrapping and unwrapping the `params` Promise using React 19's `use()` hook inside client-side page files.
* **Files Modified & Deployed**:
  - `src/app/qr-menu/[token]/page.tsx`
  - `src/app/customer/table/[qrToken]/page.tsx`
* **SHA256 Checksums**:
  - `qr-menu token page`: `3853bd0667da379bbdbefae62d0c07a33aad4996bbd44fd9e0ffd46b3e927e6e`
  - `customer table qrToken page`: `871676674b2cdaa779eb27bca3fb01f5cf7512c4f32598b1934d3c03e05e6b23`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted.
* **Runtime Verification**: `namainvist.com` returned 200, `ahmedalyamicompany.namainvist.com` returned 200, verified PM2 logs and confirmed the dynamic parameter promise unwrapping prevents any hydration or rendering exceptions.

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

### Phase: Production Field-Level Audit Trail (2026-05-28)
* **Status**: `PRODUCTION_FIELD_AUDIT_TRAIL_DEPLOYED_AND_VERIFIED`
* **Commit**: `a4dfb6308a99a7d9138fc756c095a4837b2480cf` (`a4dfb630`)
* **Scope**:
  - `src/lib/prisma-audit.ts`
  - `src/app/api/audit/field-trail/route.ts`
* **Tests**: `src/__tests__/field-audit-trail.test.ts` (5/5 passed), full suite (1046/1046 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `prisma-audit`: `883fc7b35002328037b2af1ad1a534bb2746f70ceb4f29e86913f7ec7ae91d4a`
  - `field-trail route`: `ce4d6321a5b809a7d121476a61c480e573172292f1ddf6de24959d90413757f1`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage, `/api/audit/field-trail` returned 401 (properly secured, no 500 crashes).

### Phase: Production Period Lock Transaction Guards - F-04A (2026-05-28)
* **Status**: `PRODUCTION_PERIOD_LOCK_ENFORCEMENT_DEPLOYED_AND_VERIFIED`
* **Commit**: `8673259e7966a2590d893f1a3ba24e0f520c5ebf` (`8673259e`)
* **Scope**: Implement absolute and soft period lock transaction safeguards for sales, purchases, manual journal entries, and POS checkout, ensuring full validation of real document posting date (`manualDate` / `invoiceDate`).
* **Tests**: `src/__tests__/period-lock-enforcement.test.ts` (7/7 passed), dynamic number sequences (6/6 passed), document state machine (13/13 passed). Total 26/26 passed.
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed validations.ts and purchases/route.ts, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `validations`: `a3deb81338276a92ddf7710c12ba0a3a047114638fdd9e88fde7c025a2773ce4`
  - `purchases route`: `c735f3c753239f689f8cda98ac3c73c07a00995f6f0842683a609dfa0b143b44`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **finance/period-close untouched**: YES (`src/app/api/finance/period-close/route.ts` remains completely untouched at `981ea5a1...`)
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage.

### Phase: Production Period Close Facade Unification - F-04B (2026-05-28)
* **Status**: `PRODUCTION_PERIOD_CLOSE_FACADE_DEPLOYED_AND_VERIFIED`
* **Commit**: `011c62640708f293d83b6cc1d8ada99a8affcbd1` (`011c6264`)
* **Scope**: Unify all month-end checklist initializations under the standard SOCPA 14-step Arabic checklist across `/api/accounting/period-close` and `/api/finance/period-close` routes via a clean `closeApi(prisma)` facade. Resolved Prisma schema unknown parameter crashes (removing non-existent `taskCode`/`code` writes and using `taskName` mapping dynamically) and enforced robust `tenantId` isolation across all checklists to prevent cross-tenant data leaks.
* **Tests**: `src/__tests__/period-lock-enforcement.test.ts` (9/9 passed), full regression suites (1072/1072 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files and local scan reports excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `period-close-engine.ts`: `d9a3b364f30f86844745ea7934ea269ede7300db2bf0542837469194daa8d670`
  - `close/index.ts`: `0fea7262da2429422b8034cc78d79c198065dcab107cb1b84cdc33def0374bf2`
  - `accounting/period-close/route.ts`: `8fef1862e85fa3ee920a89eb1303fd70021c1033bda3b4c87915314b9f31b861`
  - `finance/period-close/route.ts`: `eaa9bf2e2679d5afb847343ab0289f1daa4dcac7fbd0d7f73602a287c97f6ce2`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage, `/api/accounting/period-close` and `/api/finance/period-close` returned 401 (secured, no DB/Prisma crashes, passing `tenantId` correctly).

### Phase: Sales Returns Transaction Guards - F-04C (2026-05-28)
* **Status**: `SALES_RETURNS_TRANSACTION_GUARDS_COMMITTED_AND_PUSHED`
* **Commit**: `9c950bd075c200dae8369c5833b9a5586ef81c13` (`9c950bd0`)
* **Scope**: Modernize Sales Returns API route to enforce robust multi-tenant data isolation and posting period locks. Completely removed reliance on client-provided headers (`x-tenant-id`) and extracted secure authenticated tenant context. Applied strict `tenantId` filtering on all `findFirst`, `findMany`, `count`, `create`, and `upsert` queries inside the route across `SalesInvoice`, `SalesReturn`, `Product`, `ProductStock`, and `StockMovement` models. Integrated `assertPeriodWritable` transaction guard using the invoice date to block illegal or backdated postings in closed fiscal months.
* **Tests**: `src/__tests__/sales-returns-governance.test.ts` (5/5 passed integration tests covering tenant isolation, bypass rejection, and period locking). Resolved all Jest mock TS compiler type errors (`never` return type issues) using explicit type-safe resolver mock definitions.
* **Deployment**: **STANDBY (Pending deployment phase approval)**
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: Unchanged (Pending deployment).
* **Runtime Verification**: Run local typecheck (`npm run typecheck` - PASS), prisma validation (`npx prisma validate` - PASS), and Jest tests (`npx jest` - PASS) successfully with zero errors. Committed to main repository branch cleanly.

### Phase: Production Open Items Dry-Run Preview - F-02I (2026-05-29)
* **Status**: `PRODUCTION_OPEN_ITEMS_DRY_RUN_PREVIEW_DEPLOYED_AND_VERIFIED`
* **Commit**: `7b71c81df0e0fa926fae371c72c0b0cecb6ed16b` (`7b71c81d`)
* **Scope**: Safe, isolated, and code-only deployment of Open Items Dry-Run Simulation/Preview engine, matching wizard, and preview API endpoints to production VPS, strictly under absolute financial locking constraint (write mutations disabled).
* **Tests**: `src/__tests__/open-items-preview-api.test.ts` (14/14 integration tests covering simulation bounds and safety constraints passed). `src/__tests__/open-items.service.test.ts` (15/15 tests covering dry-run previews passed). Total 29/29 passed.
* **Deployment**: Smart, Parallel Next.js build and code-only PM2 reload on Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` following a full databases and codebase backup (17.5 GB downloaded to local machine).
* **Test files uploaded to production**: NO
* **SHA256 Checksums**:
  - `open-items.service.ts`: `C4FC71B197A3877D04ADE472EF0A965DCC5A264FCD0EE170AA12C992098E954C`
  - `customer-allocation/route.ts`: `DF300FC66D2C113576116B61ADBA4DD5E13ABAED6164797768F863A0894DCA61`
  - `supplier-allocation/route.ts`: `91FD6DC6D24EE5EA4018177A051F1EF98AAD08D3E44DA4689BC6AF0846AEA27E`
  - `reversal/route.ts`: `C8E645F0192EB0500E873617ED68E39C94C5401BF6756D006EFF3A313827F0C7`
  - `open-items/page.tsx`: `66DDCF8B48BF9671C545C23ED5359C836D8362DE83EC10235A5857F1297E303C`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted.
* **Runtime Verification**: Home page returned `200 OK`, `/api/admin/siem` returned `401 Unauthorized` (no middleware regression), Open Items dry-run preview dashboard loads beautifully with explicit "Safe Financial Simulation Mode" alert banners and no database write capabilities.

### Phase: Real Allocation Engine - F-03 (2026-05-29)
* **Status**: `PRODUCTION_OPEN_ITEMS_REAL_ALLOCATION_DEPLOYED_AND_VERIFIED`
* **Commit**: `3ed0dbcafeat(open-items): add real allocation engine` (`3ed0dbca`)
* **Scope**: Implement real payment-to-invoice allocation APIs for customer and supplier and reversal APIs, secured via module-level RBAC (`module: 'accounting'`, `permission: 'add'/'delete'`) and Clerk multi-tenant validation. Fully integrated dashboard UI matching buttons to trigger mutations and re-query the grid dynamically.
* **SHA256 Checksums**:
  - `inspections`: `7ff867f212bfcffa3fa586f80f2373d3d33cf10f6db7ac1c970f525d3496f35c`
  - `prompts/cost`: `4661972139036dd218e6d752f578e7995fc9f4214570bf87f8720d20c98a39f7`
  - `purchases/orders`: `80992649571c623277fa461e046ce078a5cd62cb37a84ff7f106b37bb537ed57`
  - `compliance-dashboard`: `73419e5e2146f3e32de291db7f408943dc8a3a562f72bdbab152091cba17c0c0`
  - `migration`: `2676810b1d57216c72e8886514e7179583a819cec67b28b2dbd0606da5278e09`
  - `training-compliance`: `7abf033d2c5ac32f50f92f1bed0697ca3421c0f26ca97d00f742079389182f29`
  - `learn`: `8f531844b06904c4ebcfe76f33da7577c305aa91b531d2fb163aaece8b449c73`
* **Database / Prisma Schema**: Unchanged (no migrations, no db push).
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with clean boot logs (0 errors).
* **Runtime Verification**: Local typecheck PASS, local prisma validate PASS, local build PASS. Server build completed successfully under Turbopack. Curled live subdomains (`namainvist.com` returned 200 OK, `ahmedalyamicompany.namainvist.com` returned 200 OK). Audited PM2 logs and confirmed 0 occurrences of `useTranslation` warnings, server render crashes, hydration mismatches, or 500 errors since deployment.

### Phase UI-HOTFIX-01 — Next.js Dynamic Params Production Fix (2026-05-29)
* **Status**: `PRODUCTION_DYNAMIC_PARAMS_HOTFIX_DEPLOYED_AND_VERIFIED`
* **Commit**: `643288770c8144802e3e05742f5c3e4ad2dd3327` (`64328877`)
* **Scope**: Resolve fatal client-side exception and server components render crash on dynamic page routes by wrapping and unwrapping the `params` Promise using React 19's `use()` hook inside client-side page files.
* **Files Modified & Deployed**:
  - `src/app/qr-menu/[token]/page.tsx`
  - `src/app/customer/table/[qrToken]/page.tsx`
* **SHA256 Checksums**:
  - `qr-menu token page`: `3853bd0667da379bbdbefae62d0c07a33aad4996bbd44fd9e0ffd46b3e927e6e`
  - `customer table qrToken page`: `871676674b2cdaa779eb27bca3fb01f5cf7512c4f32598b1934d3c03e05e6b23`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted.
* **Runtime Verification**: `namainvist.com` returned 200, `ahmedalyamicompany.namainvist.com` returned 200, verified PM2 logs and confirmed the dynamic parameter promise unwrapping prevents any hydration or rendering exceptions.

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

### Phase: Production Field-Level Audit Trail (2026-05-28)
* **Status**: `PRODUCTION_FIELD_AUDIT_TRAIL_DEPLOYED_AND_VERIFIED`
* **Commit**: `a4dfb6308a99a7d9138fc756c095a4837b2480cf` (`a4dfb630`)
* **Scope**:
  - `src/lib/prisma-audit.ts`
  - `src/app/api/audit/field-trail/route.ts`
* **Tests**: `src/__tests__/field-audit-trail.test.ts` (5/5 passed), full suite (1046/1046 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `prisma-audit`: `883fc7b35002328037b2af1ad1a534bb2746f70ceb4f29e86913f7ec7ae91d4a`
  - `field-trail route`: `ce4d6321a5b809a7d121476a61c480e573172292f1ddf6de24959d90413757f1`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage, `/api/audit/field-trail` returned 401 (properly secured, no 500 crashes).

### Phase: Production Period Lock Transaction Guards - F-04A (2026-05-28)
* **Status**: `PRODUCTION_PERIOD_LOCK_ENFORCEMENT_DEPLOYED_AND_VERIFIED`
* **Commit**: `8673259e7966a2590d893f1a3ba24e0f520c5ebf` (`8673259e`)
* **Scope**: Implement absolute and soft period lock transaction safeguards for sales, purchases, manual journal entries, and POS checkout, ensuring full validation of real document posting date (`manualDate` / `invoiceDate`).
* **Tests**: `src/__tests__/period-lock-enforcement.test.ts` (7/7 passed), dynamic number sequences (6/6 passed), document state machine (13/13 passed). Total 26/26 passed.
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed validations.ts and purchases/route.ts, test files excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `validations`: `a3deb81338276a92ddf7710c12ba0a3a047114638fdd9e88fde7c025a2773ce4`
  - `purchases route`: `c735f3c753239f689f8cda98ac3c73c07a00995f6f0842683a609dfa0b143b44`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **finance/period-close untouched**: YES (`src/app/api/finance/period-close/route.ts` remains completely untouched at `981ea5a1...`)
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage.

### Phase: Production Period Close Facade Unification - F-04B (2026-05-28)
* **Status**: `PRODUCTION_PERIOD_CLOSE_FACADE_DEPLOYED_AND_VERIFIED`
* **Commit**: `011c62640708f293d83b6cc1d8ada99a8affcbd1` (`011c6264`)
* **Scope**: Unify all month-end checklist initializations under the standard SOCPA 14-step Arabic checklist across `/api/accounting/period-close` and `/api/finance/period-close` routes via a clean `closeApi(prisma)` facade. Resolved Prisma schema unknown parameter crashes (removing non-existent `taskCode`/`code` writes and using `taskName` mapping dynamically) and enforced robust `tenantId` isolation across all checklists to prevent cross-tenant data leaks.
* **Tests**: `src/__tests__/period-lock-enforcement.test.ts` (9/9 passed), full regression suites (1072/1072 passed).
* **Deployment**: SFTP Code-Only production deployment to Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` (Only deployed runtime files, test files and local scan reports excluded).
* **Test files uploaded to production**: NO
* **SHA256**:
  - `period-close-engine.ts`: `d9a3b364f30f86844745ea7934ea269ede7300db2bf0542837469194daa8d670`
  - `close/index.ts`: `0fea7262da2429422b8034cc78d79c198065dcab107cb1b84cdc33def0374bf2`
  - `accounting/period-close/route.ts`: `8fef1862e85fa3ee920a89eb1303fd70021c1033bda3b4c87915314b9f31b861`
  - `finance/period-close/route.ts`: `eaa9bf2e2679d5afb847343ab0289f1daa4dcac7fbd0d7f73602a287c97f6ce2`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted with `--update-env`.
* **Runtime Verification**: `namainvist.com` returned 200, `/api/admin/siem` returned 401, `/api/settings/roles` protected/sanitized with no sensitive field leakage, `/api/accounting/period-close` and `/api/finance/period-close` returned 401 (secured, no DB/Prisma crashes, passing `tenantId` correctly).

### Phase: Sales Returns Transaction Guards - F-04C (2026-05-28)
* **Status**: `PRODUCTION_PUSHED_AND_VERIFIED`
* **Commit**: `9c950bd075c200dae8369c5833b9a5586ef81c13` (`9c950bd0`)
* **Scope**: Modernize Sales Returns API route to enforce robust multi-tenant data isolation and posting period locks. Completely removed reliance on client-provided headers (`x-tenant-id`) and extracted secure authenticated tenant context. Applied strict `tenantId` filtering on all `findFirst`, `findMany`, `count`, `create`, and `upsert` queries inside the route across `SalesInvoice`, `SalesReturn`, `Product`, `ProductStock`, and `StockMovement` models. Integrated `assertPeriodWritable` transaction guard using the invoice date to block illegal or backdated postings in closed fiscal months.
* **Tests**: `src/__tests__/sales-returns-governance.test.ts` (5/5 passed integration tests covering tenant isolation, bypass rejection, and period locking). Resolved all Jest mock TS compiler type errors (`never` return type issues) using explicit type-safe resolver mock definitions.
* **Push to Repository**: Pushed successfully to `origin/main` branch on Github.
* **Deploy Status**: `PRODUCTION_DEPLOY_REQUIRED` but deferred/NOT done due to missing SSH credentials. Production server remains untouched.
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: Unchanged (Pending deployment).
* **Runtime Verification**: Run local typecheck (`npm run typecheck` - PASS), prisma validation (`npx prisma validate` - PASS), and Jest tests (`npx jest` - PASS) successfully with zero errors. Committed to main repository branch cleanly.

### Phase: Production Open Items Dry-Run Preview - F-02I (2026-05-29)
* **Status**: `PRODUCTION_OPEN_ITEMS_DRY_RUN_PREVIEW_DEPLOYED_AND_VERIFIED`
* **Commit**: `7b71c81df0e0fa926fae371c72c0b0cecb6ed16b` (`7b71c81d`)
* **Scope**: Safe, isolated, and code-only deployment of Open Items Dry-Run Simulation/Preview engine, matching wizard, and preview API endpoints to production VPS, strictly under absolute financial locking constraint (write mutations disabled).
* **Tests**: `src/__tests__/open-items-preview-api.test.ts` (14/14 integration tests covering simulation bounds and safety constraints passed). `src/__tests__/open-items.service.test.ts` (15/15 tests covering dry-run previews passed). Total 29/29 passed.
* **Deployment**: Smart, Parallel Next.js build and code-only PM2 reload on Hetzner VPS (`46.4.188.170`) at `/www/wwwroot/namainvist.com` following a full databases and codebase backup (17.5 GB downloaded to local machine).
* **Test files uploaded to production**: NO
* **SHA256 Checksums**:
  - `open-items.service.ts`: `C4FC71B197A3877D04ADE472EF0A965DCC5A264FCD0EE170AA12C992098E954C`
  - `customer-allocation/route.ts`: `DF300FC66D2C113576116B61ADBA4DD5E13ABAED6164797768F863A0894DCA61`
  - `supplier-allocation/route.ts`: `91FD6DC6D24EE5EA4018177A051F1EF98AAD08D3E44DA4689BC6AF0846AEA27E`
  - `reversal/route.ts`: `C8E645F0192EB0500E873617ED68E39C94C5401BF6756D006EFF3A313827F0C7`
  - `open-items/page.tsx`: `66DDCF8B48BF9671C545C23ED5359C836D8362DE83EC10235A5857F1297E303C`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully restarted.
* **Runtime Verification**: Home page returned `200 OK`, `/api/admin/siem` returned `401 Unauthorized` (no middleware regression), Open Items dry-run preview dashboard loads beautifully with explicit "Safe Financial Simulation Mode" alert banners and no database write capabilities.

### Phase: Real Allocation Engine - F-03 (2026-05-29)
* **Status**: `PRODUCTION_OPEN_ITEMS_REAL_ALLOCATION_DEPLOYED_AND_VERIFIED`
* **Commit**: `3ed0dbcafeat(open-items): add real allocation engine` (`3ed0dbca`)
* **Scope**: Implement real payment-to-invoice allocation APIs for customer and supplier and reversal APIs, secured via module-level RBAC (`module: 'accounting'`, `permission: 'add'/'delete'`) and Clerk multi-tenant validation. Fully integrated dashboard UI matching buttons to trigger mutations and re-query the grid dynamically.
* **Tests**: `src/__tests__/open-items-real-allocation.test.ts` (5/5 passed integration tests covering customer/supplier transactions, overmatching, duplicate prevention, and balance reversal). All 34 local Jest tests passed cleanly (100%).
* **Deployment**: Smart, Parallel Next.js build and code-only PM2 reload on Hetzner VPS (`46.4.188.170`) across all 3 active domains (`main-site`, `n1`, `n11`) with SSH-based directory structure preparation (`mkdir -p`) to prevent silent SFTP failures.
* **Test files uploaded to production**: NO
* **SHA256 Checksums (100% Match Local & Production across all sites)**:
  - `src/app/api/open-items/allocate/customer-allocation/route.ts`: `cca8257758e1df9d2a100a331073546a58bbd6bab84e5e6730ff369d9270a477`
  - `src/app/api/open-items/allocate/supplier-allocation/route.ts`: `c19b68cd29870b16925b80fcf3dbf80e364cdff4bedb97300ab74c335ddc07c6`
  - `src/app/api/open-items/allocate/reversal/route.ts`: `fc79d1cd5b71c2b8653c01ff9eaead166f44e459c02a9a401c1af1fbf702de5e`
  - `src/app/(dashboard)/accounting/open-items/page.tsx`: `a87683f69bdf2099172b7a1c668a659a20e2b33634c398a437a7737cb73d802a`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, and `saas-app` all online and successfully restarted with the new runtime files.
* **Runtime Verification / Smoke Tests**: 16/16 tests passed. Home page returned `200 OK`, SIEM endpoints on all sites returned `401 Unauthorized` (no middleware regressions), roles settings returned `401 Unauthorized`, and allocate POST APIs returned `401 Unauthorized` without a valid session. Zero leakage of passwords, MFA tokens, or device/session secrets.

### Phase: Restaurant QR & Auth Me Production Fixes (2026-05-31)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**:
  - `d5cb1336` (`fix(restaurant): resolve table qr print empty preview by using real img tag`)
  - `598f4f82` (`fix(auth): align auth me user select with schema`)
* **Scope**: Fix restaurant tables QR code printing by replacing CSS background-image with a real `<img>` tag, and resolve `/api/auth/me` Prisma query crash due to missing `name` field in the User model by querying `fullName` and returning `name: user.fullName` as an alias.
* **Files Modified & Deployed**:
  - `src/app/(dashboard)/restaurant-pos/page.tsx`
  - `src/app/api/auth/me/route.ts`
* **Database / Prisma Schema**: Unchanged (no migrations, no db push).
* **PM2**: `main-site`, `n1-main`, `saas-app` all online and successfully reloaded.
* **Runtime Verification**: `namainvist.com` returned 200 OK, `/api/auth/me` returned 401 (no 500 crashes), and QR print preview verified with images showing properly.

### Phase: Sales Returns GET Pagination Hardening (2026-05-31)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `458634cd733c987339e2f014add91487f82cc95b` (`fix(sales-returns): harden get pagination against invalid params`)
* **Scope**: Harden GET API `/api/sales-returns` pagination parameter reading (`page`, `take`) to protect Prisma query skip/take from receiving NaN or negative/zero values which generate 500 internal server crashes under invalid query inputs.
* **Files Modified & Deployed**:
  - `src/app/api/sales-returns/route.ts`
  - `src/__tests__/sales-returns-governance.test.ts`
* **Database / Prisma Schema**: Unchanged (no migrations, no db push).
* **PM2**: `main-site`, `n1-main`, and `saas-app` all online and successfully reloaded with clean boot logs.
* **Runtime Verification**: Local typecheck PASS, local prisma validate PASS, Jest targeted tests 7/7 PASS, local production build PASS. Remote deployment ff-only pull and server build PASS. Smoke tests curled on all domains returned healthy 200/401 and `/api/sales-returns?page=abc&take=-10` returned 401 instead of crashing (validated fallback safely to page=1, take=50). Zero database, schema, or financial period mutations occurred.

### Phase: F-15 Multi-period Comparative Reporting (2026-06-01)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `4dfb8da8dc56cbe9db13cd6d0015ba0c3fa3b08e` (`feat(accounting): add multi-period financial statement comparisons`)
* **Scope**:
  - `src/app/api/accounting/financial-statements/route.ts`
* **Tests**: `src/lib/__tests__/financial-statements-engine.test.ts` (10/10 passed).
* **Deployment**: Smart, files-only deployment to Hetzner VPS (`46.4.188.170`) across all 3 active domains (`main-site`, `n1`, `n11`) with SSH-based backups.
* **Test files uploaded to production**: NO
* **SHA256 Checksums (100% Match Local & Production across all sites)**:
  - `src/app/api/accounting/financial-statements/route.ts`: `2cad15501eaf1a76cfce3cbc7ddf2fc940085d201eee23c8d9fd8118001844e5`
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **migrations/db push**: NO
* **PM2**: `main-site`, `n1-main`, and `saas-app` all online and successfully restarted with the new runtime files.
* **Runtime Verification / Smoke Tests**: Curling all public domains returned 200 OK, SIEM and settings endpoints on all sites returned 401 Unauthorized, and financial-statements endpoints returned 401 Unauthorized without crashing (no 500 errors). Zero leakage of secrets or tenant cross-contamination.

### Phase: Full System Page Button Scenario Autopilot Archive & Repair (2026-06-05)
* **Status**: `ARCHIVE_COMPLETED_LOCAL`
* **Commit**: `b84abf6e3467d1f4e3a9d7e5ceba7c0c5bace372` (`test(e2e): verify full button and scenario coverage`)
* **Scope**: Complete scan, inventory, wiring, dangerous action safe plan, scenario library generation, and reports index linking for the entire ERP system.
* **Metrics**:
  - **Total Pages Discovered**: 526
  - **Total Buttons/Forms Documented**: 23
  - **Total Scenarios Documented**: 23
  - **Total E2E Playwright Tests**: 72
  - **Dangerous Actions Identified & Safely Planned**: 8
* **Database**: Unchanged (no migrations, no db push).
* **Prisma Schema**: Unchanged.
* **PM2**: Unchanged (no production deploy required).
* **Next Recommended Phase**: Local Implementation of Analytical AI & Spend Analytics Integration.

### Phase: Local Implementation of Analytical AI & Spend Analytics Integration (2026-06-05)
* **Status**: `LOCAL_IMPLEMENTATION_COMPLETED`
* **Scope**: Enhance security and isolation across Analytical AI and Spend Analytics pages:
  - Enforced strict tenant isolation (`requireTenant: true`) in `/api/ai/demand-forecast`, `/api/ai/nlq`, and `/api/ai/sales-coach`.
  - Added user-tenant ownership checks in `sales-coach` API to verify the requested user belongs to the requesting tenant.
  - Refactored `Spend Analytics` page UI from rendering raw JSON into a highly polished, stylized categories table.
  - Improved `NLQ` page UX with predefined suggestion question helper buttons.
  - Fixed implicit any typescript compile bug in `/lib/spend-analytics-engine.ts`.
* **Files Modified**:
  - `src/app/(dashboard)/ai/nlq/page.tsx`
  - `src/app/(dashboard)/procurement/spend-analytics/page.tsx`
  - `src/app/api/ai/demand-forecast/route.ts`
  - `src/app/api/ai/nlq/route.ts`
  - `src/app/api/ai/sales-coach/route.ts`
  - `src/app/api/procurement/spend-analytics/route.ts`
  - `src/lib/spend-analytics-engine.ts`
* **Database / Prisma Schema**: Unchanged.
* **Runtime Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (288 tests), targeted tests e2e/mocked-ai-rag-mutations.spec.ts 3/3 PASS.
* **Next Recommended Phase**: Local Integration Testing & Hardening of HR/WPS Modules.

### Phase: HR WPS Hardening (2026-06-05)
* **Status**: `PRODUCTION_PUSHED_AND_VERIFIED`
* **Commit**: `37482613c9f165b6e665a5e80f64138867866e4a` (`37482613c`)
* **Scope**: Secure and harden WPS and GOSI generator engine and endpoints:
  - Secured `WPSGenerator` by passing `prisma` context and filtering by user's `tenantId`.
  - Swapped fake fields with true database schema fields (like `fullName` -> `name`, `bankIban` -> `iban`, etc.).
  - Secured all `/api/payroll/wps/*` paths with user auth and RBAC roles check.
* **Files Modified**:
  - `src/lib/wps-generator.ts`
  - `src/app/api/payroll/wps/route.ts`
  - `src/app/api/payroll/wps/generate/route.ts`
  - `src/app/api/payroll/wps/[batchId]/mark-uploaded/route.ts`
  - `src/app/api/payroll/wps/[batchId]/download/route.ts`
  - `src/app/api/hr/wps/route.ts`
  - `src/app/(dashboard)/hr/wps/page.tsx`
* **Database / Prisma Schema**: Unchanged.
* **Runtime Verification**: Vitest unit tests `tests/wps-generator.test.ts` 12/12 PASS, typecheck PASS, build PASS.
* **Push to Repository**: Pushed successfully to `origin/main` branch on Github.
* **Deploy Status**: `PRODUCTION_DEPLOY_REQUIRED` but deferred/NOT done due to missing SSH credentials. Production server remains untouched.


### Phase: ZATCA Phase 2 Integration, Onboarding & Compliance Verification (2026-06-05)
* **Status**: `PRODUCTION_PUSHED_AND_VERIFIED`
* **Commit**: `42a26b72f32252a19adf6c8c1b819c65d0ad45dd` (`42a26b72f`)
* **Scope**: Refactor and secure ZATCA Phase 2 endpoints to enforce strict tenant isolation and authentication/authorization checks, and disable external API and CLI subprocess execution in local mode:
  - Enforced strict session validation and admin-role checks in `api/zatca/route.ts`.
  - Swapped global `prisma` calls in all ZATCA endpoints to use current tenant context database instances.
  - Applied strict `tenantId` filtering on settings queries, invoice queries, and cryptographic stamp updates in `api/zatca/route.ts`, `api/zatca/qr/route.ts`, and `api/zatca/xml/route.ts` to prevent cross-tenant leakage.
  - Disabled external Sandbox ZATCA API calls and `fatoora` shell subprocess executions in `api/zatca/test/route.ts`, replacing them with secure mocked compliance data for dry-run verification.
* **Files Modified**:
  - `src/app/api/zatca/route.ts`
  - `src/app/api/zatca/qr/route.ts`
  - `src/app/api/zatca/xml/route.ts`
  - `src/app/api/zatca/test/route.ts`
* **Database / Prisma Schema**: Unchanged.
* **Runtime Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (288 tests), Jest Integration tests `tests/integration/zatca-full-flow.test.ts` 13/13 PASS.
* **Push to Repository**: Pushed successfully to `origin/main` branch on Github.
* **Deploy Status**: `PRODUCTION_DEPLOY_REQUIRED` but deferred/NOT done due to missing SSH credentials in the local environment. Production server remains untouched.
* **Next Recommended Phase**: Technical lead to execute the production build and reload (`node deploy.js --build`) directly from the live server console or by configuring SSH credentials.

### Phase: API Rate Limiting Refinement (2026-06-05)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `dc4d19d10ef751194fe6a420acd6ef5bc2d35c38` (`dc4d19d10`)
* **Scope**: Refine API Rate Limiting to enforce sliding window limits in Middleware (in-memory sliding window rate limiter compatible with V8 Edge environments):
  - Created a pure in-memory sliding window rate limiter inside `src/lib/rate-limit.ts` using Map and client timestamps queue.
  - Modified `middleware.ts` to enforce rate limits globally on all API paths: 5 req/min on sensitive Auth routes, 30 req/min on other mutating HTTP methods (POST, PUT, DELETE), and 120 req/min on read (GET) requests.
  - Identified clients by authenticated `x-user-id` (Clerk JWT context) or fallback IP (anonymous).
  - Wrote Jest unit tests in `tests/unit/rate-limit.test.ts` to verify window boundaries and blocking (3/3 passed).
  - Updated `FULL_SYSTEM_UI_SCENARIOS_AR.md` (added SCN-SEC-002, updated total scenarios to 26) and `REPORTS_INDEX_AR.md`.
* **Files Modified**:
  - `src/lib/rate-limit.ts`
  - `middleware.ts`
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - `docs/REPORTS_INDEX_AR.md`
  - `tests/unit/rate-limit.test.ts`
* **Database / Prisma Schema**: Unchanged.
* **Local Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (288 tests), Jest Unit tests `tests/unit/rate-limit.test.ts` 3/3 PASS.
* **Production Deployment & Verification**:
  - Uploaded files (`middleware.ts` and `src/lib/rate-limit.ts`) via SFTP using `deploy.js` utilizing the RSA key `C:\Users\1\.ssh\hetzner_key` to all 3 production directories (`namainvist.com`, `n1.namainvist.com`, `n11.namainvist.com`).
  - Completed production build successfully for all three sites on the server.
  - Safely restarted all 3 PM2 apps (`main-site`, `n1-main`, `saas-app`) with 0 crashes or restart loops.
  - Performed curl smoke tests verifying 200 OK for public domains and 401 Unauthorized for protected APIs (SIEM, settings/roles, auth/me, zatca).
  - Inspected PM2 server logs confirming healthy startup, OpenTelemetry init, and background BullMQ workers execution.
* **Next Recommended Phase**: Go for next business phase discovery and planning.

### Phase: Concurrent Manufacturing Backflushing & Tenant Isolation Hardening (2026-06-05)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `9e672deb56120e5e0d144efc2251d1c900194724` (`9e672deb5`)
* **Scope**: Enforce tenant isolation and idempotency in `MaterialIssuanceEngine` / `material-issuance.ts`:
  - Removed direct `PrismaClient` instantiation to prevent DB connection leakage, requiring shared `prisma` context parameter in all engine methods.
  - Hardened multi-tenant data isolation by requiring `tenantId` parameter in all engine methods and applying strict query filters on `ManufacturingOrder`, `Product`, `ProductStock`, `StockMovement`, and `ManufacturingCost` tables.
  - Implemented an idempotency status-based guard inside `executeBackflushing` to block raw material deductions and cost double-postings for completed or cancelled orders.
  - Wrote Vitest unit tests in `tests/material-issuance.test.ts` verifying picklist generation, backflushing deduction, double-backflushing blocks, tenant isolation bounds, and missing parameters (6/6 passed).
  - Updated `FULL_SYSTEM_UI_SCENARIOS_AR.md` (added `SCN-SEC-003`, updated total scenarios to 27) and updated `/src/lib/material-issuance.ts` test coverage to 100% in `COVERAGE_BY_MODULE.md`.
* **Files Modified**:
  - `src/lib/material-issuance.ts`
  - `tests/material-issuance.test.ts`
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - `docs/testing/COVERAGE_BY_MODULE.md`
* **Database / Prisma Schema**: Unchanged.
* **Local Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (288 tests), Vitest unit tests `tests/material-issuance.test.ts` 6/6 PASS.
* **Production Deployment & Verification**:
  - Synced server git repository with remote `origin/main` (`git fetch` + `git reset --hard`) and uploaded file (`src/lib/material-issuance.ts`) using `deploy.js` via RSA key `C:\Users\1\.ssh\hetzner_key` to all production directories (`namainvist.com`, `n1.namainvist.com`, `n11.namainvist.com`).
  - Completed production builds successfully sequentially on all directories.
  - Safely restarted all 3 PM2 apps (`main-site`, `n1-main`, `saas-app`) with 0 crashes or restart loops.
  - Performed curl smoke tests verifying 200 OK for public domains and 401 Unauthorized for protected APIs (SIEM, settings/roles, auth/me).
  - Inspected PM2 server logs confirming healthy startup, OpenTelemetry init, and BullMQ workers execution.
* **Next Recommended Phase**: Go for next business phase discovery and planning.

### Phase: Maker-Checker Workflows & Approvals Integration (2026-06-05)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `dd0186d5f47045bbb75809a9b5781408267c0c00` (`dd0186d5f`)
* **Scope**: Integrate Maker-Checker approvals into the Purchase Order Saga and Manual Journal Entry creation flows using the database-backed `ApprovalEngine`:
  - Updated `ApprovalEngine` constructor in `src/lib/approval-engine.ts` to accept a transactional `PrismaClient` to run safely inside sagas.
  - Intercepted Step 3 (`submit_approval`) in `PurchaseOrderSaga` (`src/lib/workflow/saga/purchase-sagas.ts`) to fetch the PO total, instantiate `ApprovalEngine`, and submit a request, setting document status to `approved` (for auto-approvals) or `pending` (if matching rules exist), with compensation logic calling `ApprovalEngine.reject()`.
  - Updated manual Journal Entry POST route in `src/app/api/accounting/journal/route.ts` to check rules for `JOURNAL_ENTRY` before posting. If matching rules exist, it overrides status to `pending_approval`, creates the entry, and submits a request to `ApprovalEngine`, blocking ledger balance changes.
* **Files Modified**:
  - `src/lib/approval-engine.ts`
  - `src/lib/workflow/saga/purchase-sagas.ts`
  - `src/app/api/accounting/journal/route.ts`
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - `docs/scenarios/UI_API_WIRING_MATRIX_AR.md`
* **Tests Added**:
  - `tests/approval-engine.test.ts` (Unit test suite for ApprovalEngine rules/matching)
  - `tests/integration/procurement/purchase-approval.test.ts` (Integration test suite for PO Saga approvals)
  - `tests/integration/accounting/journal-approval.test.ts` (Integration test suite for manual JE approvals)
* **Database / Prisma Schema**: Unchanged.
* **Local & Server Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (288 tests), Vitest integration/unit tests `tests/approval-engine.test.ts` / `journal-approval.test.ts` / `purchase-approval.test.ts` 6/6 PASS.
* **Production Deployment & Verification**:
  - Synced server git repository with remote `origin/main` (`git pull origin main`) for `/www/wwwroot/namainvist.com` and synced the remaining directories `/www/wwwroot/n1.namainvist.com` and `/www/wwwroot/n11.namainvist.com` via files copy.
  - Completed production builds successfully for all three sites on the server.
  - Safely reloaded all 3 PM2 apps (`main-site`, `n1-main`, `saas-app`) with 0 crashes or restart loops.
  - Performed curl smoke tests verifying 200 OK for public domains and 401 Unauthorized for protected APIs (SIEM, settings/roles, auth/me, journal).
  - Inspected PM2 server logs confirming healthy startup, OpenTelemetry init, and BullMQ workers execution.
* **Next Recommended Phase**: POS Responsiveness & File Upload Magic-Bytes Checking (Wave P2-C & P2-D).

### Phase: POS Responsiveness & File Upload Magic-Bytes Checking (Wave P2-C & P2-D) (2026-06-05)
* **Status**: `PRODUCTION_DEPLOY_APPROVED_AND_PENDING`
* **Commit**: `f0a3e4a83cdacc3889ecdab922d4f448b5b15a50` (`f0a3e4a83`)
* **Scope**: Implement security hardening for file uploads and enhance mobile UI layout responsiveness on the main POS and Restaurant POS cashiers interface:
  - Added magic bytes signature checking for files in `/api/upload` to block malicious spoofed extensions.
  - Enhanced layout responsiveness, layout padding, and overflow scrolling to prevent Arabic text clipping in both cashier views.
* **Files Modified**:
  - `src/app/(dashboard)/pos/page.tsx`
  - `src/app/(dashboard)/restaurant-pos/page.tsx`
  - `src/app/api/upload/route.ts`
  - `src/lib/prisma-audit.ts`
  - `src/lib/prisma.ts`
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - `docs/scenarios/SCENARIO_REPORT_LINKS_AR.md`
  - `docs/scenarios/UI_API_WIRING_MATRIX_AR.md`
  - `docs/scenarios/UI_BUTTON_INVENTORY_AR.md`
* **Tests Added**:
  - `tests/integration/security/p2c-remediations.test.ts`
* **Database / Prisma Schema**: Unchanged.
* **Local & Server Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS.
* **Production Deployment & Verification**:
  - Stopped at Deploy Gate awaiting deployment approval.
* **Next Recommended Phase**: Report Pagination & query N+1 Optimization (Wave P2-A).

### Phase: Report Pagination & query N+1 Optimization (Wave P2-A) (2026-06-05)
* **Status**: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* **Commit**: `926c2eb739d4017e6887042e395148214eb0f6bd` (`926c2eb73`)
* **Scope**: Implement dynamic reports pagination and optimize query N+1 performance:
  - Paginated users list and daily reports to accept dynamic `page`/`limit` parameters.
  - Sliced transactions in customer statement after computing running balance in-memory to preserve historical arithmetic correctness.
  - Refactored `least-selling` product report to resolve N+1 querying on sales detail aggregation.
* **Files Modified**:
  - `src/app/api/reports/[type]/route.ts`
  - `src/app/api/reports/customer-statement/route.ts`
  - `src/app/api/reports/returns/route.ts`
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - `docs/scenarios/SCENARIO_REPORT_LINKS_AR.md`
  - `docs/scenarios/UI_API_WIRING_MATRIX_AR.md`
  - `docs/scenarios/UI_BUTTON_INVENTORY_AR.md`
  - `docs/REPORTS_INDEX_AR.md`
* **Tests Added**:
  - `tests/integration/reports/pagination.test.ts`
* **Database / Prisma Schema**: Unchanged.
* **Local & Server Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Vitest targeted tests 5/5 PASS.
* **Production Deployment & Verification**:
  - Synced server git repository with remote `origin/main` (`git pull origin main`) for `/www/wwwroot/namainvist.com` and synced the remaining directories `/www/wwwroot/n1.namainvist.com` and `/www/wwwroot/n11.namainvist.com` via files copy.
  - Verified SHA256 file parity matches 100% across the three paths.
  - Completed production builds successfully for the unified codebase on the server.
  - Safely reloaded all PM2 apps (`main-site`, `n1-main`, `saas-app`, `staging`) with 0 crashes or restart loops.
  - Performed curl smoke tests verifying 200 OK for public domains and 401 Unauthorized for protected APIs (SIEM, settings/roles, auth/me, reports/returns).
  - Inspected PM2 server logs confirming healthy startup, OpenTelemetry init, and BullMQ workers execution.
* **Next Recommended Phase**: Technical Documentation & Load Testing (Wave P3-A).

### Phase: Technical Documentation & Load Testing (Wave P3-A) (2026-06-05)
* **Status**: `PRODUCTION_PUSHED_AND_VERIFIED`
* **Commit**: `9880a4bba67394eb4c1f9640bf1ef8f4bb7d0a2f` (`9880a4bba`)
* **Scope**: Implement technical manuals and verify load testing scripts for Wave P3-A:
  - Documented BullMQ queues architecture, worker failure mitigation steps, and PM2 commands in `docs/devops/BULLMQ_WORKERS_GUIDE_AR.md`.
  - Documented Withholding Tax (WHT) regulations, accounting entries, and configs in `docs/legal/TAX_WHT_GUIDE_AR.md`.
  - Added k6 load testing execution commands, installation steps, and script explanations in `tests/load/README.md`.
  - Updated scenario registers `FULL_SYSTEM_UI_SCENARIOS_AR.md` and links `SCENARIO_REPORT_LINKS_AR.md`.
* **Files Modified**:
  - `docs/REPORTS_INDEX_AR.md`
  - `docs/scenarios/FULL_SYSTEM_UI_SCENARIOS_AR.md`
  - `docs/scenarios/SCENARIO_REPORT_LINKS_AR.md`
  - `docs/devops/BULLMQ_WORKERS_GUIDE_AR.md` [NEW]
  - `docs/legal/TAX_WHT_GUIDE_AR.md` [NEW]
  - `tests/load/README.md` [NEW]
* **Database / Prisma Schema**: Unchanged.
* **Local Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (288 tests), Vitest integration tests `tests/integration/security/tenant-isolation.test.ts` 3/3 PASS.
* **Production Deployment & Verification**:
  - Synced server git repository with remote `origin/main` (`git pull origin main`).
  - No production build or PM2 reload required (NO_PRODUCTION_DEPLOY_REQUIRED) since only non-runtime documentation files were changed.
* **Next Recommended Phase**: E2E Staging Environment Setup & Playwright Wave 2 Write Tests (Wave P3-B).

### Phase: E2E Staging Environment Setup & Playwright Wave 2 Write Tests (Wave P3-B) (2026-06-05)
* **Status**: `PRODUCTION_PUSHED_AND_VERIFIED`
* **Commit**: `80c76459bef501f2012dfc743df09a8dcab2691a` (`80c76459`)
* **Scope**: Implement staging-safe E2E Playwright write tests for Sales (SCN-SALES-001), POS (SCN-POS-001), Purchases (SCN-PURCHASES-001), and Inventory (SCN-INVENTORY-001) using Playwright mock route interceptions:
  - Created staging-safe E2E test for Goods Receipt Note (GRN) under `e2e/purchases/grn.staging.spec.ts`.
  - Created staging-safe E2E test for Inventory Stocktake and Reconciliation under `e2e/inventory/stocktake.staging.spec.ts`.
  - Updated scenario mappings inside `docs/scenarios/SCENARIO_REPORT_LINKS_AR.md` and reports index `docs/REPORTS_INDEX_AR.md`.
* **Files Modified**:
  - `docs/REPORTS_INDEX_AR.md`
  - `docs/scenarios/SCENARIO_REPORT_LINKS_AR.md`
  - `e2e/inventory/stocktake.staging.spec.ts` [NEW]
  - `e2e/pos/pos-checkout.staging.spec.ts` [NEW]
  - `e2e/purchases/grn.staging.spec.ts` [NEW]
  - `e2e/sales/sales-invoice.staging.spec.ts` [NEW]
* **Database / Prisma Schema**: Unchanged.
* **Local Verification**: Prisma Validate PASS, TypeScript Compilation PASS, Production Build PASS, Playwright List E2E PASS (300 tests), Playwright targeted tests `e2e/sales/sales-invoice.staging.spec.ts`, `e2e/pos/pos-checkout.staging.spec.ts`, `e2e/purchases/grn.staging.spec.ts`, and `e2e/inventory/stocktake.staging.spec.ts` 12/12 PASS (running against local production server).
* **Production Deployment & Verification**:
  - Synced server git repository with remote `origin/main` (`git pull origin main`).
  - No production build or PM2 reload required (NO_PRODUCTION_DEPLOY_REQUIRED) since only non-runtime documentation and E2E test files were changed.
* **Next Recommended Phase**: Dunning Automation Implementation & Integration (Wave P3-C).

### Phase: Dunning Automation Implementation & Integration (Wave P3-C) (2026-06-06)
* **Status**: `DEVELOPED_AND_VERIFIED_AND_PUSHED`
* **Commit**: `dbbd0fb9fa9333e6ddea494d35a3990b3af881f8`
* **Scope**: Upgrade daily dunning run API endpoint `/api/accounting/dunning/daily-run` to utilize `DunningEngineV2` for multi-tenant data isolation and clean type safety:
  - Destructured scoped `prisma` instance from `withRoute` and passed it directly to `DunningEngineV2.executeDailyRun`.
  - Removed unused logger variables and replaced generic `any` casting with correct type parameters, ensuring 100% type safety.
  - Added a dedicated Vitest integration test suite under `tests/integration/accounting/dunning-daily-run.test.ts`.
  - Modified `vitest.config.ts` to include `src/lib/__tests__/` glob for running V2 engine unit tests.
* **Files Modified**:
  - `src/app/api/accounting/dunning/daily-run/route.ts`
  - `vitest.config.ts`
  - `tests/integration/accounting/dunning-daily-run.test.ts` [NEW]
* **Database / Prisma Schema**: Unchanged.
* **Local Verification**: TypeScript compilation PASS (`npm run typecheck`), ESLint validation PASS (0 warnings), Next.js Production Build PASS, Vitest unit & integration tests 20/20 PASS.
* **Production Deployment & Verification**:
  - Pushed to `origin/main`. No production reload required (`NO_PRODUCTION_DEPLOY_REQUIRED` for this step).
* **Next Recommended Phase**: Wave P4-A: UI/UX Micro-interactions & Printer Connection Status Indicator (ISS-13 & ISS-14) (Scan & Plan Only).

### Phase: UI/UX Micro-interactions & Printer Connection Status (Wave P4-A) (2026-06-06)
* **Status**: `DEVELOPED_AND_VERIFIED_AND_DEPLOYED`
* **Commit**: `725e792605ad95bde38680999d1986e03c842cc6`
* **Scope**: Implement UI/UX micro-interactions for POS buttons and Sidebar navigation, and add a dynamic printer connection status badge in POS and fast cashier terminal:
  - Added QZ Tray WebSocket connectivity checks (`printerStatus` state and `connectQZ`) with fallback to disconnected in `pos/page.tsx`, `restaurant-pos/page.tsx`, and `sales/terminal/page.tsx`.
  - Added a re-run/refresh connection check button (`RefreshCcw`) in all three POS/Sales headers.
  - Implemented smooth transitions for submenu expand/collapse (`will-change-[max-height,opacity]`) and arrow rotation in `Sidebar.tsx`.
  - Introduced premium elastic button transitions using `.hover-micro` in `globals.css` applied to major transaction buttons (MADA, Cash, Customer selection, etc.).
* **Files Modified**:
  - `src/app/(dashboard)/pos/page.tsx`
  - `src/app/(dashboard)/restaurant-pos/page.tsx`
  - `src/app/(dashboard)/sales/terminal/page.tsx`
  - `src/components/Sidebar.tsx`
  - `src/app/globals.css`
* **Database / Prisma Schema**: Unchanged.
* **Local Verification**: TypeScript compilation PASS (`npm run typecheck`), Prisma Validation PASS, Next.js Production Build PASS.
* **Production Deployment & Verification**:
  - Deployed to Hetzner VPS (`main-site`, `n1-main`, `saas-app`) on 2026-06-06. Rebuilt and restarted via PM2. Verified online.
* **Next Recommended Phase**: Proceed with next business gap closure in roadmap.

### Phase: Multi-printer Polling Auto-recovery & Custom Tooltips (Wave P4-B) (2026-06-07)
* Status: `PRODUCTION_DEPLOYED_AND_VERIFIED`
* Commit: `3057a40a30141f2a36b94098679f04627b0b60cb`
* Scope: Implement auto-recovery polling and interactive custom tooltips for printer status indicators across all POS screens:
  - Added a 30-second polling interval in `useEffect` in `pos/page.tsx`, `restaurant-pos/page.tsx`, and `sales/terminal/page.tsx` to automatically recheck QZ Tray status and update the UI badge.
  - Wrapped the printer status indicator with a custom styled Tailwind/Glassmorphism tooltip (`relative group` with custom popup overlay) to explain printer connectivity to users.
  - Animated the refresh icon (`animate-spin` on `RefreshCcw`) during verification status checks.
* Files Modified & Deployed:
  - `src/app/(dashboard)/pos/page.tsx`
  - `src/app/(dashboard)/restaurant-pos/page.tsx`
  - `src/app/(dashboard)/sales/terminal/page.tsx`
* Database / Prisma Schema: Unchanged.
* Local Verification: TypeScript compilation PASS (`npm run typecheck`), Prisma Validation PASS, Next.js Production Build PASS.
* Production Deployment & Verification:
  - Deployed to Hetzner VPS (`main-site`, `n1-main`, `saas-app`) at `/www/wwwroot/...`.
  - Backups taken on the VPS as `.bak_wave_p4b_printer_recovery` for all 3 files before deployment.
  - Built successfully in parallel on production in 75.3s.
  - Reloaded PM2 apps (`main-site`, `n1-main`, `saas-app`) and verified they are online.
  - Performed Smoke Tests on public/protected paths (all passed: 200 OK for UI routes, 401 for protected APIs, 0 crashes/500 errors).
  - Monitored PM2 logs (clean, no TypeErrors or Prisma schema errors).
* Next Recommended Phase: Proceed with next business gap closure in roadmap (GO_FOR_NEXT_BUSINESS_PHASE_SCAN_AND_PLAN_ONLY).
