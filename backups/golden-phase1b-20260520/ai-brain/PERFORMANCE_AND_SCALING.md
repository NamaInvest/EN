# PERFORMANCE AND SCALING

## 1. Architectural Bottlenecks
- **Synchronous ZATCA (Solved)**: Previously, ZATCA XML signing blocked the API thread. It is now properly delegated to `outbox-relay.worker.ts`.
- **Large Ledger Queries**: `JournalEntry` and `Ledger` tables grow infinitely. Queries across vast date ranges (e.g., generating a full-year Trial Balance) will become slow.
- **Inventory Aggregate Computation**: Computing `ProductStock` on the fly via `StockMovement` sum can be expensive. Materialized views or strict aggregate tables are required.

## 2. Database Scaling
- **Connection Pooling**: Next.js Serverless functions can exhaust PostgreSQL connections rapidly. PgBouncer or Prisma Accelerate is mandatory in production.
- **Missing Indexes**: 
  - Compound indexes on `[tenantId, createdAt]` for large reporting tables.
  - Indexes on `status` for `OutboxEvent` (vital for the polling worker).

## 3. Background Processing (BullMQ)
- Currently, `outbox-relay.worker.ts` polls the `OutboxEvent` table. As events grow, this polling must be indexed and batched properly (e.g., fetching 100 at a time).
- Redis must be configured with eviction policies appropriate for job queues (e.g., `noeviction` for reliable job retention).

## 4. Opportunities for Caching
- **Tenant Settings**: Things like `TaxRegime`, `ZatcaAssessment` settings, or `Currency` conversion rates rarely change but are queried on every invoice. These should be cached in Redis with a TTL or invalidation hook.
- **Permissions**: `UserPermission` lookups during `withGuard` execution can be heavily cached.
