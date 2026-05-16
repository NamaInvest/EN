# Nama Invest ERP - System Brain & Project Memory
*Created: May 15, 2026*
*Last Update: Phase 1.1 + Phase 2.1 Enterprise Hardening*

## 1. System Architecture
Nama Invest ERP is a multi-tenant Enterprise ERP system supporting physical POS terminals, Web Dashboards, and external integrations (like ZATCA). The application relies on Next.js App Router for API boundaries and UI rendering, while background processing and asynchronous tasks are delegated to Redis-backed BullMQ workers.

## 2. Financial Integrity & Immutability
**Objective:** Prevent data corruption and fraudulent manipulation of financial records.
- **Immutable Ledger:** All posted `JournalEntry` records are strictly immutable. We use PostgreSQL-level triggers (`immutable_posted_journal_entries`) to prevent `UPDATE` and `DELETE` operations on any entry where `status = 'posted'`.
- **Atomicity:** All complex accounting operations (Sales, Purchases, Treasury) MUST be executed within a `runFinancialTx` wrapper. This ensures that invoice creation, inventory adjustments, and GL journal postings commit or rollback as a single ACID transaction.
- **Strict Reference Deletion:** When reverting unposted or draft entries, we rely on exact string references (e.g., `reference: 'EXP-123'`) rather than generic metadata fields to prevent accidental bulk-deletion.

## 3. Tenant Isolation & Data Security
**Objective:** Ensure zero cross-tenant data leakage across the entire platform.
- **Physical Databases:** Phase 2 introduces `[tenant]_db` physical database isolation instead of just RLS.
- **Prisma Tenant Guard:** A Layer 2 Prisma Client Extension (`tenant-guard`) acts as a global fail-safe. It intercepts all sensitive operations (`findMany`, `updateMany`, etc.) and forcibly throws a `[CRITICAL SECURITY] TENANT ISOLATION VIOLATION` error if a `tenantId` is omitted from the `where` clause.
- **`withTenant` Global Wrapper:** Any background worker (e.g., PDF generation, AI Audit, Reconciliations) MUST wrap its Prisma calls inside `withTenant(tenantId, async () => { ... })` to inherit the `AsyncLocalStorage` context.

## 4. The Outbox Pattern (Asynchronous Event Dispatch)
**Objective:** Decouple external API calls (e.g., ZATCA) and long-running tasks from synchronous financial transactions.
- We utilize the `OutboxEvent` table to register external side-effects atomically alongside the business transaction.
- Example: Generating a ZATCA invoice creates an `OutboxEvent` with `eventType: 'ZATCA_REPORT_JOB'` and `status: 'PENDING'` inside the exact same Prisma transaction as the `SalesInvoice`.
- An **Outbox Relay Worker** (`outbox-relay.worker.ts`) continually polls this table and safely dispatches the events to BullMQ queues (`syncQueue`) for external processing.

## 5. Development Guidelines for AI Agents
- **NO Quick Mode:** Always perform Deep Scan Level 3 for financial, UI, and security issues.
- **Always use `runFinancialTx`:** Never create invoices or treasury documents without it.
- **Always use `withTenant` in Background Jobs:** Cron jobs and BullMQ workers must declare the active tenant to safely query or mutate data.
- **Respect Idempotency:** Endpoints must validate `x-idempotency-key` via the HTTP header to prevent double-charging or duplicated inventory actions during network timeouts.
