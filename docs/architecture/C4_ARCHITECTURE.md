# NamaSoft ERP — System Architecture (C4 Model)
# معمارية النظام

> Last updated: 2026-05-11 | Version: 9.3.0

---

## Level 1 — System Context

```mermaid
C4Context
    title System Context — NamaSoft ERP

    Person(admin,    "System Admin",    "إدارة النظام، التكوين")
    Person(accountant, "Accountant",    "محاسب — قيود، تقارير")
    Person(employee, "Employee",        "موظف — حضور، طلبات")
    Person(customer, "Customer",        "عميل — فواتير، مدفوعات")
    Person(vendor,   "Vendor",          "مورد — عروض أسعار، فواتير")

    System(erp, "NamaSoft ERP",        "نظام ERP متكامل Next.js 15 + PostgreSQL")

    System_Ext(zatca,   "ZATCA API",       "البوابة الضريبية — فوترة إلكترونية")
    System_Ext(gosi,    "GOSI Portal",     "التأمينات الاجتماعية")
    System_Ext(bank,    "Bank APIs",       "سداد، ISO 20022")
    System_Ext(telegram,"Telegram Bot",    "إشعارات + تقارير يومية")
    System_Ext(openai,  "OpenAI API",      "الذكاء الاصطناعي — Copilot + RAG")
    System_Ext(smtp,    "Email / SMTP",    "إشعارات البريد الإلكتروني")

    Rel(admin,    erp,  "يدير")
    Rel(accountant, erp, "يستخدم")
    Rel(employee, erp,  "يستخدم — HR Portal")
    Rel(customer, erp,  "يراجع فواتيره")
    Rel(vendor,   erp,  "يقدم عروض أسعار")
    Rel(erp, zatca,   "تقديم فواتير ZATCA Phase 2")
    Rel(erp, gosi,    "تسجيل موظفين + اشتراكات")
    Rel(erp, bank,    "تحويلات + مقاصة")
    Rel(erp, telegram,"إشعارات + تقارير")
    Rel(erp, openai,  "NLQ + RAG Embeddings")
    Rel(erp, smtp,    "Dunning + Approvals")
```

---

## Level 2 — Container Diagram

```mermaid
C4Container
    title Container Diagram — NamaSoft ERP

    Person(user, "User", "Browser / Mobile / POS")

    Container(webapp,   "Next.js App",       "TypeScript / React 19",  "UI + API Routes — App Router")
    Container(api,      "API Layer",          "Next.js Route Handlers", "778+ REST endpoints — withRoute middleware")
    ContainerDb(db,     "PostgreSQL 16",      "Prisma ORM",             "Main database — 120+ tables")
    ContainerDb(vector, "pgvector",           "PostgreSQL Extension",   "Semantic search — RAG embeddings")
    Container(cron,     "Cron Jobs",          "Vercel Crons",           "7 scheduled jobs — IFRS 16, FX, SLA, Billing")
    Container(bot,      "Telegram Bot",       "node-telegram-bot-api",  "Operational notifications + reports")
    Container(worker,   "Background Workers", "Next.js Server Actions", "Heavy computations — consolidation, embeddings")

    Rel(user,   webapp, "HTTPS/443")
    Rel(webapp, api,    "Internal calls")
    Rel(api,    db,     "Prisma ORM — TLS")
    Rel(api,    vector, "pgvector raw SQL")
    Rel(cron,   api,    "POST /api/cron/* — x-cron-secret")
    Rel(api,    bot,    "Telegram sendMessage")
    Rel(worker, db,     "Long transactions")
```

---

## Level 3 — Component Diagram (Finance Domain)

```mermaid
C4Component
    title Finance Domain Components

    Container_Boundary(finance, "Finance Engines") {
        Component(cashflow,    "CashFlowEngine",        "IAS 7 Indirect Method",     "Operating / Investing / Financing CF")
        Component(ifrs16,      "IFRS16LeaseEngine",     "IFRS 16",                   "ROU + Liability + Schedule + Cron")
        Component(rolling,     "RollingBudgetEngine",   "Rolling 12-month",          "Driver-based + Variance analysis")
        Component(commitments, "CommitmentsRegister",   "IAS 37 / IFRS 7",           "PO + Contracts + CAPEX maturity")
        Component(ice,         "ICEliminationEngine",   "IFRS 10",                   "Intercompany mismatch + elimination")
        Component(consolidate, "ConsolidationEngine",   "IAS 21 + IFRS 10",          "Multi-entity + NCI + CTA")
        Component(fx,          "FXRevaluationEngine",   "IAS 21",                    "Unrealized G/L + month-end cron")
        Component(grir,        "GRIRClearingEngine",    "Accruals",                  "GRN vs Invoice reconciliation")
        Component(apaging,     "APAgingEngine",         "AR/AP",                     "Vendor aging 0-30-60-90-120+")
        Component(vatrc,       "ReverseChargeVAT",      "ZATCA",                     "Imported services — RC VAT")
        Component(credit,      "CreditLimitEngine",     "Credit Risk",               "AR exposure + POS hard-block")
        Component(match3,      "ThreeWayMatchEngine",   "P2P Controls",              "PO-GRN-Invoice ± tolerance")
    }

    Container_Boundary(infra, "Infrastructure") {
        Component(audit,       "FieldAuditEngine",      "PDPL / SOX",                "Field-level before/after + middleware")
        Component(numbering,   "NumberingEngine",       "ZATCA Sequential",          "Zero-gap + YEARLY/MONTHLY reset")
        Component(approval,    "ApprovalEngine",        "Multi-level",               "Rules + levels + role-based")
        Component(sla,         "ApprovalSLAEngine",     "Governance",                "Escalation + reminder + auto-approve")
        Component(vector,      "VectorStore",           "RAG / pgvector",            "Semantic search + chunk ingestion")
        Component(pagination,  "Pagination",            "API Standard",              "Unified skip/take/meta across all APIs")
        Component(telemetry,   "Telemetry",             "APM",                       "Spans + Metrics + Slow span detection")
        Component(security,    "SecurityHeaders",       "OWASP",                     "HSTS + CSP + Permissions-Policy")
    }
```

---

## Level 4 — Financial Period-End Sequence

```mermaid
sequenceDiagram
    participant CRON as Vercel Cron
    participant API  as Next.js API
    participant ENG  as Finance Engines
    participant DB   as PostgreSQL
    participant TG   as Telegram Bot

    CRON->>API: POST /api/cron/ifrs16-monthly (day 1)
    API->>DB: SELECT active lease contracts
    loop Each Active Lease
        API->>ENG: IFRS16LeaseEngine.recognize()
        ENG-->>API: Schedule Row (interest, principal, depreciation)
        API->>DB: INSERT JournalEntry + JournalLines
    end
    API-->>TG: Summary: N leases posted

    CRON->>API: POST /api/cron/fx-revaluation (last day)
    API->>DB: SELECT open FCY positions
    API->>ENG: FXRevaluationEngine.run()
    ENG-->>API: FXRevalResult (gains/losses)
    API->>DB: INSERT JournalEntry (FX Unrealized G/L)
    API-->>TG: FX Reval: +12,500 SAR gain

    CRON->>API: POST /api/cron/approval-sla (hourly)
    API->>DB: SELECT pending approvals
    loop Each Overdue Request
        API->>ENG: ApprovalSLAEngine.escalate()
        API->>DB: INSERT Notification (escalateTo)
    end
```

---

## Data Model Overview

```mermaid
erDiagram
    TENANT ||--o{ JOURNAL_ENTRY : has
    TENANT ||--o{ CUSTOMER : has
    TENANT ||--o{ VENDOR : has
    TENANT ||--o{ EMPLOYEE : has
    TENANT ||--o{ FISCAL_YEAR : has

    JOURNAL_ENTRY ||--|{ JOURNAL_LINE : contains
    JOURNAL_LINE }o--|| ACCOUNT : posts_to

    ACCOUNT }|--|| ACCOUNT : parent_of

    CUSTOMER ||--o{ SALES_INVOICE : receives
    SALES_INVOICE ||--|{ SALES_INVOICE_LINE : contains
    CUSTOMER ||--o{ CUSTOMER_PAYMENT : makes

    VENDOR ||--o{ PURCHASE_ORDER : receives
    PURCHASE_ORDER ||--|{ PO_LINE : contains
    PURCHASE_ORDER ||--o{ GRN : fulfilled_by
    PURCHASE_ORDER ||--o{ PURCHASE_INVOICE : billed_via

    EMPLOYEE ||--o{ PAYROLL_RECORD : has
    EMPLOYEE ||--o{ ATTENDANCE : tracked_by
    EMPLOYEE ||--o{ LEAVE_REQUEST : submits

    APPROVAL_REQUEST ||--|{ APPROVAL_STEP : contains
    APPROVAL_RULE    ||--o{ APPROVAL_STEP : defines

    IFRS_LEASE_CONTRACT ||--o{ JOURNAL_ENTRY : generates
    KNOWLEDGE_CHUNK     }o--|| KNOWLEDGE_DOCUMENT : part_of
    AUDIT_LOG           }o--|| USER : created_by
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js | 15.x | App Router + RSC |
| UI Library | shadcn/ui | Latest | Component library |
| Language | TypeScript | 5.x | Type safety |
| ORM | Prisma | 6.x | DB access |
| Database | PostgreSQL | 16.x | Primary store |
| Vector DB | pgvector | 0.7.x | RAG embeddings |
| Auth | next-auth / JWT | 5.x | Authentication |
| Validation | Zod | 3.x | Schema validation |
| Testing | Jest | 29.x | Unit tests (88+ cases) |
| CI/CD | GitHub Actions | — | Build + test + deploy |
| Hosting | Hetzner VPS | — | Production server |
| Monitoring | Custom telemetry | — | Spans + metrics |
| Notifications | Telegram Bot | — | Ops + alerts |
| ZATCA | Java SDK + XML | Phase 2 | E-invoicing |

---

## API Surface Summary

| Category | Endpoints | Status |
|----------|-----------|--------|
| Finance (IFRS) | 45+ | ✅ Production |
| Accounting (GL/AP/AR) | 80+ | ✅ Production |
| HR & Payroll | 60+ | ✅ Production |
| Sales & CRM | 70+ | ✅ Production |
| Purchases & P2P | 55+ | ✅ Production |
| Inventory & WMS | 65+ | ✅ Production |
| ZATCA & VAT | 25+ | ✅ Phase 2 Live |
| AI & RAG | 15+ | ✅ Production |
| System & Settings | 60+ | ✅ Production |
| Cron Jobs | 7 | ✅ Scheduled |
| **Total** | **778+** | **✅** |

---

## Compliance Coverage

| Standard | Coverage | Engine / Module |
|----------|----------|----------------|
| ZATCA Phase 2 | ✅ Full | ZATCA XML + QR + SDK |
| IAS 7 (Cash Flow) | ✅ Indirect Method | `financial-statements-engine.ts` |
| IFRS 16 (Leases) | ✅ Full | `ifrs16-lease-engine.ts` + Cron |
| IFRS 10 (Consolidation) | ✅ NCI + IC Elim | `consolidation-engine.ts` |
| IAS 21 (FX) | ✅ Revaluation | `fx-revaluation-engine.ts` |
| IAS 37 (Provisions) | ✅ Commitments | `commitments-register-engine.ts` |
| PDPL (Saudi) | ✅ DSR + DPIA | `pdpl-engine.ts` + `DPIA_TEMPLATE.md` |
| GOSI | ✅ Contributions | HR module |
| SOX Section 404 | ✅ Field Audit | `field-audit-engine.ts` (middleware) |
| OWASP Top 10 | ✅ Headers | `security-headers.ts` |
