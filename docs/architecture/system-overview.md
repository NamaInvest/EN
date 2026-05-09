# System Architecture Overview — Namasoft ERP

> **النسخة:** 1.0 — **آخر تحديث:** 2026-05-10
> **يُقرأ مع:** [multi-tenant.md](./multi-tenant.md)

---

## 1. C4 Level 1 — System Context

```mermaid
C4Context
    title Namasoft ERP — System Context

    Person(owner, "Tenant Admin", "صاحب المنشأة")
    Person(employee, "Employee", "موظف / محاسب / كاشير")
    Person(customer, "Customer", "B2B / B2C portal user")
    Person(internal, "Internal Team", "Namasoft staff")

    System(erp, "Namasoft ERP", "Cloud + Desktop ERP for KSA")

    System_Ext(zatca, "ZATCA", "Phase 2 e-invoicing")
    System_Ext(gosi, "GOSI / Mudad / Qiwa", "Government labor systems")
    System_Ext(banks, "Saudi Banks", "WPS SIF, statements")
    System_Ext(payment, "Payment Gateways", "Moyasar, HyperPay, Tap, Stripe")
    System_Ext(gemini, "Google Gemini", "AI: OCR, CFO, embeddings")
    System_Ext(comm, "Email/SMS/WhatsApp", "Notifications")

    Rel(owner, erp, "Uses")
    Rel(employee, erp, "Uses")
    Rel(customer, erp, "B2B / Portal")
    Rel(internal, erp, "Operates")

    Rel(erp, zatca, "Submits invoices", "HTTPS XML")
    Rel(erp, gosi, "Submits payroll", "Files / API")
    Rel(erp, banks, "WPS SIF", "SFTP")
    Rel(erp, payment, "Charges", "REST")
    Rel(erp, gemini, "OCR + AI", "REST")
    Rel(erp, comm, "Sends", "SMTP / WS")
```

---

## 2. C4 Level 2 — Container View

```mermaid
flowchart TB
    subgraph Edge["Edge / CDN"]
        CF[Cloudflare]
    end

    subgraph App["Application Layer"]
        Web[Next.js Web App<br/>SSR + Server Components]
        PWA[PWA Service Worker]
        Desktop[Electron Desktop App<br/>embedded Postgres]
        API[Next.js API Routes<br/>~700 endpoints]
        Workers[BullMQ Workers<br/>cron + queues]
    end

    subgraph Data["Data Layer"]
        PG[(Postgres Primary)]
        PGRO[(Postgres Replica)]
        Redis[(Redis<br/>cache + queues)]
        S3[(Object Storage)]
        Vector[(pgvector<br/>RAG index)]
    end

    subgraph AI["AI / ML"]
        Gemini[Google Gemini]
        Ollama[Ollama Local<br/>desktop fallback]
        LC[LangChain Pipelines]
    end

    subgraph Integrations["External"]
        ZATCA[ZATCA API]
        Banks[Banks SFTP]
        Pay[Payment Gateways]
    end

    CF --> Web
    CF --> PWA
    Web --> API
    PWA --> API
    Desktop --> API
    API --> PG
    API -.read.-> PGRO
    API --> Redis
    API --> S3
    API --> Vector
    API --> LC
    LC --> Gemini
    LC -.fallback.-> Ollama
    Workers --> PG
    Workers --> Redis
    Workers --> ZATCA
    Workers --> Banks
    API --> Pay

    style Web fill:#dbeafe
    style API fill:#dbeafe
    style PG fill:#fde68a
    style Redis fill:#fee2e2
    style Gemini fill:#fef3c7
```

---

## 3. C4 Level 3 — Module Map (104 Modules)

```mermaid
mindmap
  root((Namasoft<br/>ERP))
    Finance
      GL / Chart of Accounts
      Journal Entries
      AP / AR
      Treasury / Cash
      Bank Reconciliation
      Period Close
      Fixed Assets
      Budgeting
      FX Revaluation
    Sales
      Quotations
      Orders
      Invoices
      Returns
      Commissions
      Pricing / Discounts
      ATP Check
      POS
    Purchases
      RFQ
      PR / PO
      GRN
      Three-Way Match
      Vendor Management
      OCR Receipts
    Inventory
      Items / SKU
      Warehouses / Bins
      Costing FIFO/LIFO/Avg
      Batches / Serials
      Cycle Count
      Transfers
    Manufacturing
      BOM
      Routing
      MRP
      Work Orders
      WIP / Backflush
      QC
    HR
      Employees
      Contracts
      Leave / Attendance
      Performance
      Training / LMS
    Payroll
      Pay Runs
      GOSI
      WPS / Mudad
      EOS / Provisions
      Benefits
    Compliance KSA
      ZATCA Phase 2
      VAT 15%
      Zakat 2.5%
      WHT
      PDPL
      Saudi Labor Law
    AI
      CFO Assistant
      OCR Receipts
      Bank Statement Analysis
      RAG Knowledge
      Auto-translation
    Cross-cutting
      Multi-tenant
      Approval Workflow
      Audit Trail
      Numbering Sequences
      Notifications
      Reports / BI
      Mobile / Field Service
```

---

## 4. Stack Decisions (DR)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 16 + React 19 | RSC + edge runtime + Vercel-class DX |
| **Styling** | Tailwind 4 + shadcn/ui | atomic + ownable components |
| **State** | TanStack Query + Server Actions | minimal client state |
| **Forms** | react-hook-form + Zod | type-safe boundary |
| **Backend** | Next.js Route Handlers | colocation; one repo |
| **ORM** | Prisma 5.22 | mature; types end-to-end |
| **DB** | PostgreSQL 16 | ACID + RLS + pgvector |
| **Cache** | Redis | de-facto |
| **Queue** | BullMQ | Redis-backed; reliable |
| **Auth** | Custom JWT + Clerk (planned) | flexibility + future SSO |
| **AI** | Google Gemini + Ollama fallback | KSA-region availability |
| **i18n** | Next.js native + JSON | RTL/LTR mirror |
| **Testing** | Jest + Vitest + Playwright | unit + e2e |
| **Monitoring** | Sentry + Prometheus | errors + metrics |

---

## 5. Runtime Topology

```mermaid
flowchart LR
    Internet[Internet] --> WAF[Cloudflare WAF + CDN]
    WAF --> LB[Hetzner Load Balancer]

    subgraph K8s["k8s / Compose Cluster (Hetzner KSA)"]
        Web1[Next.js Pod 1]
        Web2[Next.js Pod 2]
        Web3[Next.js Pod N]
        Worker1[Worker Pod 1]
        Worker2[Worker Pod 2]
        Cron[Cron Pod]
    end

    LB --> Web1
    LB --> Web2
    LB --> Web3

    subgraph DB["DB Cluster"]
        PGM[(Postgres Primary)]
        PGR1[(Replica 1)]
        PGR2[(Replica 2)]
        PGM -.repl.-> PGR1
        PGM -.repl.-> PGR2
    end

    subgraph Cache["Cache / Queue"]
        Redis1[(Redis Master)]
        Redis2[(Redis Replica)]
        Redis1 -.repl.-> Redis2
    end

    Web1 --> PGM
    Web2 --> PGM
    Web1 -.read.-> PGR1
    Web2 -.read.-> PGR2

    Worker1 --> Redis1
    Worker2 --> Redis1
    Cron --> Redis1

    Worker1 --> PGM
    Worker2 --> PGM

    style WAF fill:#fef3c7
    style PGM fill:#fde68a
    style Redis1 fill:#fee2e2
```

---

## 6. Cross-Cutting Concerns

| Concern | Approach |
|---------|----------|
| **Tenancy** | RLS via Prisma extension ([multi-tenant.md](./multi-tenant.md)) |
| **AuthZ** | Role + permission matrix; checked in API layer |
| **Audit** | Field-level audit trail (planned Phase 0) |
| **Idempotency** | `Idempotency-Key` header on POST/PUT writes |
| **Rate-limiting** | Redis token bucket; per-tenant + per-IP |
| **Logging** | Structured JSON; tenantId on every line |
| **Observability** | Sentry + Prometheus + OpenTelemetry traces |
| **Backups** | Daily full + WAL streaming; tested quarterly |
| **DR / RTO** | RTO 4h, RPO 15min |

---

## 7. References

- [Multi-Tenant Architecture](./multi-tenant.md)
- [Security Plan](../security/security-plan.md)
- [Deployment Plan](../deployment/deployment-plan.md)
- [API Specifications](../api/openapi-summary.md)
- [GLOBAL_ERP_GAP_ANALYSIS.md](../../GLOBAL_ERP_GAP_ANALYSIS.md)
