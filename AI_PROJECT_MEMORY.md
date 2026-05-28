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
