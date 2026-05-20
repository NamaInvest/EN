# ENTERPRISE UPGRADE ROADMAP

## Overview
Based on the `ERP_GAP_ANALYSIS.md`, this roadmap defines the modernization phases required to elevate Nama Invest ERP to a Tier-1 SaaS Enterprise platform.

---

### PHASE 1 — Critical Protections (Immediate Priority)
**Goal**: Lock down financial boundaries and protect against noisy neighbors.
1. **Accounting Period Locks**:
   - Implement `PeriodLock` schema.
   - Enforce check in `runFinancialTx`.
2. **API Rate Limiting**:
   - Implement Redis-based rate limiting in Next.js middleware.
   - Separate limits for `GET` vs `POST/PUT`.

### PHASE 2 — Financial Hardening & Approvals
**Goal**: Implement separation of duties.
1. **Maker-Checker Workflows**:
   - Create generic `ApprovalWorkflow` engine.
   - Integrate with High-Value Purchase Orders and Manual Journal Entries.
2. **Granular Audit Trails**:
   - Deploy Prisma Extension for field-level delta logging (CDC).

### PHASE 3 — Scalability Improvements
**Goal**: Reduce OLTP database load.
1. **Master Data Caching**:
   - Cache Tenant Settings, Tax Regimes, and Pricing Rules in Redis.
   - Implement cache invalidation on save.
2. **Read-Replica Routing**:
   - Direct all heavy reporting endpoints (`/api/reports/**`) to a read-replica database connection.

### PHASE 4 — Enterprise Workflows
**Goal**: Automate cross-module coordination.
1. **Automated Dunning & Collections**:
   - Background workers to evaluate overdue AR and dispatch email/SMS reminders automatically.
2. **Advanced Inventory Allocations**:
   - Implement Soft vs Hard stock reservations for e-commerce/POS integrations.

### PHASE 5 — Observability & Monitoring
**Goal**: Proactive failure detection.
1. **Dead-Letter Queue (DLQ) Management**:
   - Build an Admin UI to inspect, edit, and requeue `FAILED` Outbox events.
2. **Application Performance Monitoring (APM)**:
   - Integrate Datadog or Sentry for slow-query tracking and trace correlation across background workers.

### PHASE 6 — Advanced ERP Architecture (Long-term)
**Goal**: Future-proof the data layer.
1. **CQRS / Event Sourcing**:
   - Separate the write models from complex read models entirely.
2. **Micro-Frontend / Module Splitting**:
   - If the codebase grows beyond Next.js limits, explore module federation for Medical vs Manufacturing vs Core Accounting.
