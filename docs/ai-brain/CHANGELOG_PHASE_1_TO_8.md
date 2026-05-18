# Changelog: Phases 1 to 8

This document summarizes the architectural evolution and stabilization of the Nama Invest ERP system.

## Phase 1: Architectural Foundation & Scaffolding
- **Actions:** Defined the initial Next.js + Prisma monorepo structure. Established basic routing, database schemas, and modular boundaries (Sales, HR, Treasury).
- **Risks Closed:** Eliminated architectural ambiguity.
- **Architectural Decisions:** Chose Prisma for ORM, Next.js API routes for backend execution.

## Phase 2: Tenant Isolation & Authentication
- **Actions:** Implemented `withRoute` to unify request handling. Enforced `requireTenantId` across all API controllers.
- **Risks Closed:** Closed severe cross-tenant data leakage vulnerabilities. Eliminated blind trust in client-provided `tenantId` payloads.
- **Architectural Decisions:** Tenant isolation must be strictly enforced at the Edge (Header/Auth Token extraction) and never trusted from the JSON Body.

## Phase 3: Financial Atomicity & Core Engine
- **Actions:** Built the `auto-journal` engine to guarantee double-entry accounting. Wrapped all ledger, inventory, and payment mutations in `runFinancialTx` (Prisma `$transaction`).
- **Risks Closed:** Prevented partial database updates, orphaned records, and unbalanced financial ledgers.
- **Architectural Decisions:** Database queries must fail-fast and rollback entirely if any constraint (e.g., negative stock, credit limit) is violated.

## Phase 4: FX Realization & Treasury Governance
- **Actions:** Automated realized FX gain/loss journal entries during multi-currency payment applications. Set materiality thresholds.
- **Risks Closed:** Prevented manual calculation errors in FX accounting and closed audit gaps in Treasury operations.
- **Architectural Decisions:** Materiality threshold set at `0.01` to filter out floating-point noise.

## Phase 5: Manufacturing & Idempotency
- **Actions:** Integrated Redis-backed idempotency (`lockIdempotencyKey`) across heavy mutation routes (Manufacturing, Sales, Purchases).
- **Risks Closed:** Prevented duplicate inventory backflushing and double-billing caused by network retries.
- **Architectural Decisions:** Idempotency must lock strictly by `tenantId` and `aggregateType` to prevent cross-tenant lock collisions.

## Phase 6: ZATCA Compliance & Outbox Pattern
- **Actions:** Integrated ZATCA Phase 1 (QR codes). Established the `OutboxEvent` architecture to decouple ZATCA Phase 2 reporting from the main user request loop.
- **Risks Closed:** Prevented external API timeouts (ZATCA servers) from failing internal POS checkout flows.
- **Architectural Decisions:** Compliance reporting must be asynchronously handled via background workers.

## Phase 7: Period Locking & Controlled Overrides
- **Actions:** Developed the `FinancialPeriod` state machine (`OPEN`, `SOFT_LOCKED`, `HARD_LOCKED`). Created the `OverrideContext` to allow secure, audited bypasses of soft locks by Master Admins.
- **Risks Closed:** Blocked unauthorized backdating of financial records. Eliminated API injection vulnerabilities by sourcing override context strictly from headers.
- **Architectural Decisions:** `HARD_LOCKED` periods are absolutely immutable. Overrides must generate a permanent `AuditLog`.

## Phase 8: Project Brain & Governance Consolidation
- **Actions:** Consolidated all architectural decisions, governance policies, and testing strategies into the `/docs/ai-brain` directory. Formalized the Project Maturity Scorecard.
- **Risks Closed:** Addressed knowledge silos and "bus factor" risks by institutionalizing the system's architecture.
- **Architectural Decisions:** Codebase must be completely self-documenting and auditable by external architectural teams.

## Technical Debt & Pending Items
- **E2E Testing Coverage:** Needs expansion using Playwright.
- **Distributed Tracing:** OpenTelemetry integration pending.
- **Advanced RBAC:** Need to implement attribute-based access controls for granular module permissions.
