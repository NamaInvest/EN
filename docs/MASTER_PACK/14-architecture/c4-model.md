---
version: 1.0
last_updated: 2026-05-12
---

# Architecture — C4 Model

> 4 مستويات: Context → Container → Component → Code

## Level 1: System Context

```mermaid
C4Context
    title System Context for Namasoft ERP

    Person(customer, "Customer", "B2B/B2C customer making orders")
    Person(employee, "Employee", "Staff using ERP daily")
    Person(vendor, "Vendor", "Supplier responding to POs")
    Person(admin, "Tenant Admin", "Configures the tenant")
    Person(superadmin, "Platform Admin", "Manages SaaS platform")

    System(namasoft, "Namasoft ERP", "Multi-tenant SaaS ERP for Saudi market")

    System_Ext(zatca, "ZATCA", "Saudi e-invoicing authority")
    System_Ext(gosi, "GOSI", "Saudi social insurance")
    System_Ext(mudad, "Mudad", "Saudi MOL platform")
    System_Ext(qiwa, "Qiwa", "Saudi labor market")
    System_Ext(najiz, "Najiz", "Saudi courts API")
    System_Ext(sarie, "SARIE", "Saudi bank settlement system")
    System_Ext(salla, "Salla", "Saudi e-commerce platform")
    System_Ext(payment, "Payment Gateways", "Mada, Apple Pay, STC Pay, HyperPay, Tabby, Tamara")
    System_Ext(shipping, "Shipping", "Aramex, SMSA, Saudi Post")
    System_Ext(llm, "LLM Providers", "Anthropic, OpenAI, Google")

    Rel(customer, namasoft, "Places orders, pays invoices", "HTTPS / Portal")
    Rel(employee, namasoft, "Uses daily", "HTTPS / Desktop / Mobile")
    Rel(vendor, namasoft, "Submits invoices, ASNs", "Vendor Portal")
    Rel(admin, namasoft, "Configures", "Admin UI")
    Rel(superadmin, namasoft, "Manages platform", "Master Panel")

    Rel(namasoft, zatca, "Invoice clearance", "REST")
    Rel(namasoft, gosi, "Monthly contributions", "API")
    Rel(namasoft, mudad, "Contract sync", "API")
    Rel(namasoft, qiwa, "Saudization sync", "API")
    Rel(namasoft, najiz, "Court cases sync", "API")
    Rel(namasoft, sarie, "Bank statements, payments", "Open Banking")
    Rel(namasoft, salla, "Orders, stock", "Webhooks")
    Rel(namasoft, payment, "Card payments, BNPL", "REST")
    Rel(namasoft, shipping, "AWB booking, tracking", "REST")
    Rel(namasoft, llm, "AI tasks", "REST")
```

## Level 2: Container

```mermaid
C4Container
    title Container Diagram for Namasoft ERP

    Person(user, "User", "Employee, customer, admin")

    System_Boundary(b, "Namasoft ERP") {
        Container(web, "Web App", "Next.js 16 App Router", "RSC + Client islands, RTL UI")
        Container(api, "API", "Next.js API Routes", "REST endpoints, business logic")
        Container(workers, "Background Workers", "BullMQ + Node", "Async jobs: ZATCA, emails, ETL")
        Container(scheduler, "Scheduler", "Cron + node-cron", "Period close, depreciation, dunning")
        Container(ai, "AI Service", "Python FastAPI", "Forecasting, OCR, ML")
        Container(zatca_sidecar, "ZATCA Java Sidecar", "JVM", "XML signing")
        Container(mqtt, "MQTT Broker", "Mosquitto", "IoT telemetry ingestion")
    }

    ContainerDb(master_db, "Master DB", "PostgreSQL 16", "Tenant routing, billing, system settings")
    ContainerDb(tenant_db, "Tenant DBs", "PostgreSQL 16 (per-tenant)", "All tenant data")
    ContainerDb(redis, "Redis", "Redis 7", "Cache, sessions, queues")
    ContainerDb(vector, "Vector Store", "pgvector / Qdrant", "Embeddings for RAG")
    ContainerDb(s3, "Object Storage", "S3 / Cloudflare R2", "Files, PDFs, images")
    ContainerDb(timescale, "Time-Series DB", "TimescaleDB", "IoT readings, metrics")

    Rel(user, web, "Browses", "HTTPS")
    Rel(web, api, "Calls", "HTTPS/JSON")
    Rel(api, master_db, "Reads routing", "TCP/5432")
    Rel(api, tenant_db, "Reads/writes", "TCP/5432 with tenant scope")
    Rel(api, redis, "Cache + sessions", "TCP/6379")
    Rel(api, workers, "Enqueues", "Redis pub/sub")
    Rel(workers, tenant_db, "Writes results", "TCP")
    Rel(workers, ai, "ML calls", "HTTP")
    Rel(workers, zatca_sidecar, "Sign XML", "HTTP")
    Rel(scheduler, workers, "Triggers jobs", "Redis")
    Rel(mqtt, timescale, "Persists readings", "TCP")
```

## Level 3: Component (Sales Module)

```mermaid
C4Component
    title Component Diagram for Sales Module

    Container_Boundary(api, "Sales API") {
        Component(routes, "Routes Layer", "Next.js", "URL → handler")
        Component(validators, "Validators", "Zod", "Input validation")
        Component(salesService, "Sales Service", "TypeScript", "Business logic")
        Component(invoiceEngine, "Invoice Engine", "TypeScript", "Invoice creation")
        Component(autoJournal, "Auto-Journal", "TypeScript", "Posts GL entries")
        Component(numbering, "Numbering Engine", "TypeScript", "Gap-free sequences")
        Component(zatcaClient, "ZATCA Client", "TypeScript", "Submits to ZATCA")
        Component(creditCheck, "Credit Check", "TypeScript", "Verifies customer credit")
        Component(stockReserve, "Stock Reservation", "TypeScript", "Inventory hold")
        Component(commissionEngine, "Commission Engine", "TypeScript", "Salesman commissions")
        Component(notifier, "Notification Engine", "TypeScript", "Email/SMS/WhatsApp")
    }

    ContainerDb(db, "DB", "PostgreSQL", "tenant DB")
    Container(zatca_sidecar, "ZATCA Sidecar", "Java", "XML signing")

    Rel(routes, validators, "validates with")
    Rel(validators, salesService, "passes to")
    Rel(salesService, invoiceEngine, "creates via")
    Rel(invoiceEngine, creditCheck, "checks")
    Rel(invoiceEngine, stockReserve, "reserves")
    Rel(invoiceEngine, numbering, "assigns code")
    Rel(invoiceEngine, autoJournal, "posts JE")
    Rel(invoiceEngine, zatcaClient, "submits")
    Rel(zatcaClient, zatca_sidecar, "signs")
    Rel(invoiceEngine, db, "persists")
    Rel(invoiceEngine, commissionEngine, "computes")
    Rel(invoiceEngine, notifier, "notifies")
```

## Multi-Tenancy Architecture

```mermaid
flowchart TB
    User[User: alice@acme.sa] -->|HTTPS| LB[Load Balancer]
    LB --> Edge[Edge Middleware]
    Edge -->|Resolve tenant by domain/subdomain| Master[(Master DB)]
    Master -->|"tenant_id, db_url"| Edge
    Edge -->|"injects tenantId + dbUrl in request context"| App[App Server]
    App -->|"prisma.client with tenant scope"| TenantDB[(Tenant DB:acme)]
    App -->|"prisma.client with tenant scope"| TenantDB2[(Tenant DB:other)]
    
    subgraph "Per-tenant pool"
        TenantDB
        TenantDB2
        TenantDBn[...]
    end
```

**Routing logic:**
1. Domain `acme.namasoft.sa` → query Master DB
2. Get `tenant_id` + `database_url`
3. Inject into request context via middleware
4. Prisma client is scoped per-request (no global)
5. All queries automatically include `tenantId`

## Data Architecture

```mermaid
flowchart LR
    Source[Transactional Tables] --> Capture[Change Data Capture]
    Capture --> Lake[Data Lake S3]
    Lake --> Warehouse[Data Warehouse Postgres + dbt]
    Warehouse --> Cube[OLAP Cube Matviews]
    Cube --> BI[BI Dashboards]
    Cube --> AI[AI Features]
    Cube --> OData[OData API for Excel/PowerBI]
    
    Source --> Stream[Event Stream]
    Stream --> Anomaly[Anomaly Detection]
    Stream --> Notification[Notification Engine]
```

## Architecture Decision Records (ADRs)

Located in `docs/MASTER_PACK/14-architecture/adrs/`:

- **ADR-0001**: Multi-tenant database isolation strategy (DB-per-tenant chosen over Shared schema with row-level security)
- **ADR-0002**: Next.js 16 App Router over Pages Router
- **ADR-0003**: Prisma ORM over Drizzle/Knex
- **ADR-0004**: PostgreSQL over MySQL/MongoDB
- **ADR-0005**: Clerk Auth over Auth0/custom
- **ADR-0006**: pgvector over Qdrant for embeddings (single DB simpler)
- **ADR-0007**: BullMQ over Inngest/Trigger.dev
- **ADR-0008**: Decimal(15, 4) for money fields
- **ADR-0009**: Auto-journal engine for all GL writes
- **ADR-0010**: Idempotency-Key header for all POST endpoints
- **ADR-0011**: Cursor pagination as default
- **ADR-0012**: Saga pattern for multi-step distributed flows
- **ADR-0013**: ZATCA Phase 2 via Java sidecar (existing trusted lib)
- **ADR-0014**: Cookie-based sessions over JWT for web
- **ADR-0015**: Server Components by default

## Sample ADR

```markdown
# ADR-0001: Multi-Tenant Isolation Strategy

## Status
Accepted (2024-01-15)

## Context
We need multi-tenancy for SaaS deployment. Options:
1. Shared DB, shared schema with tenant_id column (row-level security)
2. Shared DB, schema-per-tenant
3. DB-per-tenant
4. Instance-per-tenant

## Decision
Database-per-tenant via Master DB routing.

## Consequences
**Positive:**
- Strong isolation (compliance friendly — PDPL)
- Per-tenant backup/restore trivial
- Performance: no noisy neighbor
- Tenant offboarding = drop DB
- Schema changes can be staged per-tenant

**Negative:**
- More DBs to manage (mitigated by managed Postgres)
- Cross-tenant analytics requires aggregation pipeline
- Migration coordination needed (ran in sequence per tenant)

## Alternatives Considered
- **Row-level security**: simpler ops but weak isolation, harder compliance
- **Schema-per-tenant**: middle ground but Postgres performance degrades > 1000 schemas
- **Instance-per-tenant**: too expensive for SME-tier pricing
```

## Threat Model (STRIDE summary)

| Threat | Asset | Mitigation |
|---|---|---|
| **Spoofing** | User identity | Clerk + MFA + WebAuthn |
| **Tampering** | Journal entries | Immutable POSTED + audit chain |
| **Tampering** | ZATCA invoices | XML signature + ICV chain |
| **Repudiation** | All transactions | FieldAuditLog with user/IP/UA |
| **Information Disclosure** | Cross-tenant data | DB-per-tenant + middleware guard |
| **Information Disclosure** | PII | Field encryption + masking |
| **DoS** | API endpoints | Rate limiting + Cloudflare |
| **DoS** | DB | Connection pool + query timeout |
| **Elevation of Privilege** | Admin functions | Role checks + SoD rules |
| **Elevation of Privilege** | API tokens | Scoped + short-lived |

## Capacity Planning

| Tier | Tenants | Users/Tenant | Tx/day | Storage | Compute |
|---|---|---|---|---|---|
| Today | 5 | 10 | 1K | 50 GB | 4 vCPU, 16 GB RAM |
| Year 1 | 200 | 20 | 50K | 2 TB | 16 vCPU, 64 GB RAM, replicas |
| Year 2 | 1K | 30 | 500K | 10 TB | K8s cluster, sharded DBs |
| Year 3 | 5K | 30 | 2M | 50 TB | Multi-region, dedicated pools |
| Year 5 | 20K | 30 | 10M | 200 TB | Global edge + CDN |

## Performance SLOs

| Metric | Target | Measurement |
|---|---|---|
| Page TTFB (p95) | < 300 ms | RUM |
| API response (p95) | < 500 ms | server-side |
| API response (p99) | < 1500 ms | server-side |
| DB query (p95) | < 100 ms | pg_stat_statements |
| Background job latency (p95) | < 30 s | BullMQ |
| ZATCA clearance (p95) | < 15 s | ZATCA queue |
| Period close (50K JEs) | < 5 min | end-to-end |
| Trial balance generation | < 3 s | server-side |
| Search response | < 500 ms | server-side |
| Availability (uptime) | 99.5% standard / 99.9% premium | external monitor |
