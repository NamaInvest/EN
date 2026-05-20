# Security & Governance Map

## Overview
This document maps the security perimeters, defensive mechanisms, and governance layers implemented across the Nama Invest ERP system. The system employs a "Defense in Depth" strategy prioritizing Financial Integrity, Tenant Isolation, and Atomicity.

## 1. Request & Network Layer Security
- **Edge Routing (`withRoute`):** Centralized Next.js route wrapper enforcing standard error handling, authentication, and context extraction.
- **Rate Limiting:**
  - `FINANCIAL` profile: Strict rate limiting for transaction endpoints (e.g., invoices, payments, GRNs) to prevent abuse and race conditions.
  - `DEFAULT` profile: Standard limits for reads/configurations.
- **Idempotency Locks (`x-idempotency-key`):** Prevents duplicate financial or inventory mutation requests due to client retries or network latency. Handled via Redis-backed `lockIdempotencyKey`.

## 2. Authentication & Identity Layer
- **Token Verification:** User identity and authorization is extracted strictly from verifiable tokens (e.g., Next-Auth Session or `jwt.verify`).
- **Tenant Context (`x-tenant`):** The target tenant is asserted globally using `requireTenantId()`, rejecting any requests missing valid tenant context.
- **Injection Protection:** Sensitive context variables (`tenantId`, `userId`, `role`) are **never** trusted from the request body. They are exclusively derived from server-side verified tokens.

## 3. Data & Service Layer Governance
- **Tenant Guard (`requireTenantContext`):** Every service call validates and injects `tenantId` into queries, preventing cross-tenant data leakage.
- **Atomic Transactions (`runFinancialTx`):** All financial, inventory, and ledger mutations execute within strict Prisma database transactions (`$transaction`).
- **Pessimistic Locking (`FOR UPDATE`):** Critical counters (e.g., ZATCA counters, sequence generators) use pessimistic locks to prevent race conditions during concurrent access.

## 4. Financial & Compliance Governance
- **Period Locks (`SOFT_LOCK`, `HARD_LOCK`):** Enforcement of accounting period immutability via `assertPeriodWritable`.
- **Controlled Override Context:** A secure mechanism for authorized users (`MASTER_ADMIN`) to bypass `SOFT_LOCK` under strict audit constraints. Overrides are sourced strictly from HTTP headers (`X-Soft-Lock-Override-Reason`).
- **Immutable Audit Trails:** Every state transition, financial override, or critical entity creation emits an immutable log (`logAuditEvent`, `auditLog` schema).

## 5. Background & Outbox Processing
- **Outbox Pattern:** Heavy or external compliance tasks (e.g., ZATCA Phase 2 reporting) are deferred to background workers via `OutboxEvent`.
- **Event-Driven Architecture:** System decouples direct integrations via `EventBus` for scalable processing without blocking the primary user request loop.
