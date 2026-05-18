# ENTERPRISE ERP GAP ANALYSIS

## Objective
This document benchmarks the Nama Invest ERP system against Tier-1 enterprise architectures (e.g., SAP S/4HANA, Oracle NetSuite, Microsoft Dynamics 365) to identify critical missing capabilities, architectural weaknesses, and areas requiring modernization for SaaS readiness.

---

## 1. Multi-Stage Approval Workflows (The "Maker-Checker" Pattern)
- **Why it matters**: Enterprise compliance (SOX, ISO) requires separation of duties. A junior accountant shouldn't be able to post a $1M journal entry without Controller approval.
- **Current State**: Missing. Most actions are binary (Draft -> Posted) based solely on RBAC access.
- **Enterprise Best Practice**: Flexible BPMN-style approval routing based on thresholds (e.g., PO > $10,000 requires VP approval).
- **Design**: 
  - Add `WorkflowDefinition` and `WorkflowInstance` models.
  - Intercept state transitions in domain services.
  - Create a unified `/api/approvals` inbox.
- **Classification**: CRITICAL
- **Estimation**: High Complexity / Medium Risk.

## 2. Hard Period Locks & Accounting Freezes
- **Why it matters**: Once financial statements are published, the accounting period must be cryptographically sealed. Backdating invoices into closed periods destroys financial integrity.
- **Current State**: Soft or missing.
- **Enterprise Best Practice**: Multi-tier locks (e.g., Sales locked on 3rd, AP locked on 5th, GL locked on 10th of the month).
- **Design**:
  - Implement `PeriodLock` model per tenant per module.
  - Inject a mandatory `validatePeriodOpen(date, module)` check inside `runFinancialTx`.
- **Classification**: CRITICAL
- **Estimation**: Low Complexity / Low Risk (High Impact).

## 3. CQRS & Read-Replica Reporting Architecture
- **Why it matters**: Heavy analytical queries (e.g., Year-to-Date Trial Balance) running on the primary transactional database (OLTP) will cause severe blocking and degrade POS performance.
- **Current State**: Missing. Monolithic Prisma queries on primary DB.
- **Enterprise Best Practice**: Command Query Responsibility Segregation (CQRS). Read models synced via Outbox/Debezium to a separate reporting warehouse (e.g., ClickHouse or Read-Replica PostgreSQL).
- **Design**:
  - Implement an Event Sourcing/Outbox fan-out to a read-replica.
  - Route all GET `/api/reports/**` to the read-replica client.
- **Classification**: HIGH Priority
- **Estimation**: Very High Complexity / Medium Risk.

## 4. Distributed Caching & Rate Limiting
- **Why it matters**: A multi-tenant SaaS application is vulnerable to noisy-neighbor problems and brute-force API attacks. Constant DB hits for static config degrades performance.
- **Current State**: Basic Redis queues, but missing structured caching for reads.
- **Enterprise Best Practice**: Multi-layer caching (Stale-While-Revalidate) for Master Data (Products, Prices, Tax Settings) and strict API Rate Limiting per Tenant.
- **Design**:
  - Wrap Prisma queries for settings in a Redis cache layer (`getTenantSettings(tenantId)`).
  - Add standard Redis-based rate limiters to Next.js middleware.
- **Classification**: HIGH Priority
- **Estimation**: Medium Complexity / Low Risk.

## 5. Granular Audit Trails (CDC - Change Data Capture)
- **Why it matters**: When a user changes a vendor's bank account, auditors need to know exactly *who*, *when*, *old value*, and *new value*.
- **Current State**: Basic `EventLog` or standard `updatedAt` fields. Not granular enough for field-level auditing.
- **Enterprise Best Practice**: Database-level CDC (e.g., Postgres Logical Replication to an Audit schema) or Prisma Middleware logging delta changes.
- **Design**:
  - Implement an `AuditLog` table capturing `tableName`, `recordId`, `userId`, `action`, `oldPayload`, `newPayload`.
  - Use a Prisma Client Extension to automatically generate these logs on `update` and `delete`.
- **Classification**: MEDIUM Priority
- **Estimation**: Medium Complexity / Medium Risk.

## 6. Dead-Letter Queues (DLQ) & Automated Healing
- **Why it matters**: When background jobs (like ZATCA syncing) fail the maximum 5 retry attempts, they currently sit in a `FAILED` state.
- **Current State**: Diagnostics exist, but automated triage is missing.
- **Enterprise Best Practice**: A formal DLQ where failed events are offloaded, alerting operations teams (PagerDuty/Slack), with UI tools to manually fix payload data and requeue.
- **Design**:
  - Create a specific UI dashboard for "System Health & DLQ".
  - Add webhook alerts for event failures.
- **Classification**: MEDIUM Priority
- **Estimation**: Low Complexity / Low Risk.

---
## Summary of Gaps
- **Security Score**: 8/10 (Strong tenant guards, needs Rate Limiting)
- **Financial Integrity**: 8.5/10 (Strong atomicity, needs Period Locks & Approvals)
- **Scalability**: 6/10 (Monolithic DB, lacks CQRS/Caching)
- **Maintainability**: 9/10 (Zero-error TS, strong Outbox pattern)
