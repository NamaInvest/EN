# Enterprise Upgrade Roadmap

## PHASE 1: Critical Protections & Isolation (Months 1-2)
- **PostgreSQL Row-Level Security (RLS)**: Enforce `tenantId` at the database level to mathematically eliminate cross-tenant data leaks.
- **Strict Rate Limiting**: Implement Redis-based rate limiting per tenant/IP to prevent noisy neighbor problems.
- **Database Connection Pooling**: Migrate to PgBouncer or Prisma Accelerate to handle 800+ API concurrent connections gracefully.

## PHASE 2: Financial Hardening (Months 2-3)
- **The Outbox Pattern**: Remove all external API calls (e.g., ZATCA) from inside `runFinancialTx`. Write to an `OutboxEvent` table instead, and process asynchronously.
- **Optimistic Locking**: Add `@updatedAt` / `version` fields to `ProductStock` and `CustomerBalance` to prevent race conditions during concurrent POS sales.
- **Immutable Ledger Enforcement**: Hard database triggers preventing `DELETE` or `UPDATE` on `JournalEntry` once posted.

## PHASE 3: Event-Driven & Scalability (Months 3-4)
- **Background Job Queue (BullMQ/Redis)**: Offload PDF generation, Statement generation, and ZATCA reporting to background workers.
- **Dead-Letter Queues**: Automatic retry strategies for failed webhooks and integrations.
- **Caching Layer**: Redis caching for `Categories`, `Products` (read-heavy), and `Permissions`.

## PHASE 4: Enterprise Workflows (Months 4-5)
- **Dynamic Approval Engine**: Configurable n-level approvals for PRs, POs, and GL Adjustments.
- **Document Versioning**: Track changes to Sales Orders and Purchase Orders (e.g., PO-1001-v1, PO-1001-v2).
- **Audit Pipeline**: Stream audit logs to a cold-storage analytical database (ClickHouse/Elasticsearch) to keep the transactional DB lean.

## PHASE 5: Observability & Monitoring (Month 6)
- **Centralized APM**: Datadog or Sentry APM for tracing slow Prisma queries.
- **Business Dashboards**: Real-time observability of ZATCA failure rates, failed logins, and sync conflicts.

*Implementation of this roadmap will position Nama Invest ERP alongside tier-1 SaaS providers in terms of reliability, security, and scale.*
