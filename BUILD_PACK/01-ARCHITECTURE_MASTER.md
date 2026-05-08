# 01 — Architecture Master Document
**System:** Namasoft ERP — Saudi Multi-Tenant SaaS + Desktop + PWA

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          USERS / CHANNELS                         │
├────────────┬────────────┬────────────┬────────────┬─────────────┤
│ Web (PWA)  │ Desktop    │ Mobile     │ POS        │ Vendor /    │
│ Next.js 16 │ Electron   │ React      │ Touch UI   │ Customer    │
│ RTL/AR     │ Windows    │ Native /   │ + ESC/POS  │ Portal      │
│            │ Mac/Linux  │ PWA        │ Printer    │             │
└─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┴──────┬──────┘
      │            │            │            │             │
      └────────────┴────────────┴────────────┴─────────────┘
                            │ HTTPS / WSS
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                       EDGE / CDN / WAF                            │
│   Cloudflare / Hetzner LB | DDoS | Rate Limit | Geolocation       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER (Next.js 16)                   │
├──────────────────────────────────────────────────────────────────┤
│  Middleware: tenant resolution, auth, rate-limit, i18n, audit    │
├──────────────────────────────────────────────────────────────────┤
│  App Router (RSC)         │  API Routes (200+)                    │
│  - Dashboard pages        │  - REST endpoints                     │
│  - Server Components      │  - Webhooks                           │
│  - Server Actions         │  - Cron jobs                          │
└────┬───────────────┬──────┴──────────────┬────────────────────────┘
     │               │                     │
     ▼               ▼                     ▼
┌────────┐    ┌─────────────┐      ┌──────────────────────────────┐
│ Engine │    │   AI Layer  │      │  Integration Layer            │
│  Layer │    │  - Gemini   │      │  - ZATCA / GOSI / Mudad      │
│  200+  │    │  - RAG      │      │  - Salla / Shopify           │
│ files  │    │  - NLQ      │      │  - Banks (SAMA Open Banking) │
│        │    │  - Embeddings│     │  - WhatsApp / SMS / Email    │
└───┬────┘    └──────┬──────┘      └──────────┬───────────────────┘
    │                │                        │
    ▼                ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                  │
├────────────────────────┬─────────────────────────────────────────┤
│  PostgreSQL 16          │  Vector Store (pgvector / in-memory)    │
│  - Master DB (tenants)  │  Redis (cache, queue, idempotency)      │
│  - Per-tenant DBs       │  S3 / Object Storage (DMS, backups)     │
│  - 489 Prisma models    │  Elasticsearch (optional, full-text)    │
└────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Stack
- **Framework:** Next.js 16 (App Router, RSC default)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS 4 + shadcn/ui patterns
- **State:** React Server Components + minimal Zustand for client islands
- **Forms:** react-hook-form + Zod validation
- **Tables:** @tanstack/react-table + virtualization (@tanstack/react-virtual)
- **Charts:** Recharts 3
- **i18n:** custom i18n.tsx + Hijri.ts
- **Direction:** RTL-first with `dir="rtl"` on `<html>` for Arabic

### 2.2 Layout
```
src/app/
├── (dashboard)/         # المنطقة المحمية (require auth)
│   ├── layout.tsx       # Sidebar + Topbar + Notifications
│   ├── accounting/
│   ├── sales/
│   ├── ...
├── (portal)/            # بوابات العميل والمورد
├── (public)/            # صفحات عامة (landing, pricing)
├── api/                 # API Routes (200+)
├── auth/, sign-in/      # Clerk
├── pos/                 # POS Touch UI
└── layout.tsx           # Root layout
```

### 2.3 Design Tokens
- See [04-DESIGN_SYSTEM.md](04-DESIGN_SYSTEM.md)

### 2.4 RSC vs Client Boundary
- **افتراضياً:** Server Component (لا "use client")
- **Client فقط لـ:** forms, charts, drag-drop, real-time hooks, IndexedDB (offline POS)

### 2.5 Routing Strategy
- File-based via App Router
- Dynamic routes `[id]`, `[slug]`
- Parallel routes `@modal` للـ pop-ups
- Intercepting routes للـ drill-downs

### 2.6 Code Splitting
- Per-route automatic
- Heavy charts lazy-loaded
- POS bundle separated from main dashboard

### 2.7 Performance
- ISR للصفحات شبه-الثابتة (price lists)
- Streaming SSR للـ dashboards
- React Query للـ client cache (تحديث optimistic للـ POS)

---

## 3. Backend Architecture

### 3.1 Layered Pattern
```
┌─────────────────────────────────┐
│   API Route (HTTP boundary)     │  ← validation (Zod) + auth + tenant resolve
├─────────────────────────────────┤
│   Service (business logic)      │  ← orchestration
├─────────────────────────────────┤
│   Engine (domain logic)         │  ← pure business rules + JE generation
├─────────────────────────────────┤
│   Repository (Prisma)           │  ← DB I/O only
├─────────────────────────────────┤
│   Database / External APIs      │
└─────────────────────────────────┘
```

### 3.2 Engines (200+ files in `src/lib/`)
- محركات domain-specific لكل وظيفة محاسبية/تجارية
- معزولة عن HTTP و Prisma transactions تُمرر من فوق
- قابلة للاختبار وحدوياً

### 3.3 Services (في `src/services/`)
- تنظم استدعاء الـ engines
- تتعامل مع cross-cutting concerns (notifications, audit, etc.)
- تُغلف transaction boundaries

### 3.4 API Routes
- RESTful patterns:
  - `GET /api/<resource>` — list
  - `POST /api/<resource>` — create
  - `GET /api/<resource>/[id]` — get
  - `PATCH /api/<resource>/[id]` — update
  - `DELETE /api/<resource>/[id]` — soft-delete
  - `POST /api/<resource>/[id]/<action>` — non-CRUD actions
- كل route route عبر middleware:
  1. Auth (Clerk)
  2. Tenant resolution
  3. Rate limit (Upstash / Redis)
  4. Idempotency check (للـ POST مع Idempotency-Key header)
  5. Zod validation
  6. Permission check (RBAC + field-level)
  7. Business logic
  8. Audit log
  9. Response

### 3.5 Asynchronous Processing
- **Queue:** BullMQ (Redis-backed)
- **Cron:** Vercel Cron / pm2 cron / native cron
- **Webhooks:** outbound via webhook-engine.ts (HMAC-SHA256, retry exponential backoff)
- **Event bus:** event-bus.ts (publish/subscribe internal)
- **Saga:** saga-orchestrator.ts للـ distributed transactions (compensation pattern)

### 3.6 Critical Patterns
- **Multi-tenant:** كل query يستخدم tenantId مُمرر من middleware
- **SERIALIZABLE:** للـ counters (numbering), JE posting, balance calc
- **Optimistic concurrency:** version field على critical entities
- **Soft delete:** prisma-soft-delete.ts wrapper
- **Idempotency:** UUIDs للـ external integrations (ZATCA ICV, payment gateway)

---

## 4. Data Layer

### 4.1 Primary DB
- **PostgreSQL 16** (Hetzner managed or self-hosted)
- **Multi-tenant model:** Database-per-tenant via Master DB tenant routing table
  - Master DB: `tenants` table holds connectionString + status + plan
  - Per-tenant: full Prisma schema applied
- **Prisma ORM 5.22:** schema in `prisma/schema.prisma` (489 models)
- **Migrations:** `prisma/migrations/` versioned
- **Connection pool:** PgBouncer (transaction mode)

### 4.2 Caching Layer
- **Redis 7:** session, rate-limit counters, job queue (BullMQ), idempotency cache, prompt-cache for LLMs

### 4.3 Object Storage
- **S3-compatible** (Cloudflare R2 / Hetzner Object Storage)
- **Buckets:**
  - `nama-attachments-<tenant>` — DMS files
  - `nama-backups-<tenant>` — DB backups
  - `nama-zatca-xml-<tenant>` — invoice signed XML archive
  - `nama-reports-<tenant>` — generated PDFs/Excel
  - `nama-public` — branding, logos

### 4.4 Vector Store (AI)
- **Default:** in-memory (development)
- **Production:** PostgreSQL pgvector extension OR Pinecone/Weaviate (per scale)
- See [11-RAG_VECTOR_AI.md](11-RAG_VECTOR_AI.md)

### 4.5 Search
- Default: PostgreSQL full-text search (tsvector)
- Optional escalation: Elasticsearch / Meilisearch

### 4.6 Backup Strategy
- **Per-tenant:** daily logical dump (pg_dump) → S3
- **WAL archiving:** continuous to S3 for PITR
- **Retention:** 30d daily, 12 monthly, 7 yearly
- **Test restore:** weekly automated to staging

---

## 5. AI Layer

### 5.1 LLM Providers
- **Primary:** Google Gemini (Pro for analysis, Flash for chat)
- **Fallback:** Anthropic Claude or OpenAI (configurable per-tenant)
- **Local:** Ollama for development

### 5.2 AI Modules
- **AI CFO:** financial analysis chat (RAG over BS/IS/CF + transactions)
- **AI Auditor:** anomaly detection (Benford, duplicates, SoD)
- **AI Bank:** statement parsing + auto-matching
- **AI SCM:** demand forecasting hints
- **AI Copilot:** general assistant
- **NLQ:** natural language → SQL/Prisma query

### 5.3 Cost Controls
- Per-tenant monthly token budget
- Per-user daily cap
- Model auto-downgrade if quota near
- See [09-PROMPT_LIBRARY.md](09-PROMPT_LIBRARY.md) §4

---

## 6. Integration Layer

### 6.1 Outbound
- **ZATCA:** XML build + Java signer + REST POST to fatoora API
- **GOSI:** monthly contributions upload
- **Mudad:** contract submission, WPS protection status
- **Qiwa:** contract attestation, Nitaqat sync
- **Banks:** SAMA Open Banking (Alrajhi, SNB, ANB, Albilad, Alinma, Riyad)
- **Payment Gateways:** HyperPay (Mada), Tap, MyFatoorah, STC Pay, Tabby/Tamara
- **E-commerce:** Salla, Shopify, WooCommerce
- **Communications:** Twilio (SMS/WhatsApp), SendGrid (email), Telegram bot

### 6.2 Inbound
- **Webhooks:** `/api/webhooks/<provider>` per integration
- **EDI:** ASN 856, Invoice 810 (optional)

### 6.3 Internal Events
- Event bus pub/sub
- Webhook outbound on events: invoice.created, payment.posted, order.shipped, etc.

---

## 7. Multi-Tenant Isolation

### 7.1 Tenant Resolution
1. Subdomain or path → tenant slug
2. Master DB lookup → connectionString + plan + status
3. Request context: `req.tenantId, req.tenantConnection`
4. Prisma client per-tenant (cached)

### 7.2 Isolation Level
- **DB-per-tenant:** complete isolation (chosen for compliance + portability)
- **Alternative considered:** schema-per-tenant + row-level (rejected for SaaS Saudi market)

### 7.3 Cross-Tenant Operations
- **None allowed** in normal API
- Master-panel admins (Namasoft staff) get explicit cross-tenant access via separate `/api/master/` namespace
- Audit log on every cross-tenant access

### 7.4 Tenant Lifecycle
- **Provisioning:** create DB + run migrations + seed (CoA, Settings, default users)
- **Suspension:** mark inactive in Master DB → middleware blocks
- **Deletion:** export all data → delete DB → archive in S3 7 years

---

## 8. Security Architecture
See [02-SECURITY_PLAN.md](02-SECURITY_PLAN.md) for full details.

Key principles:
- Defense in depth (WAF + app-level + DB-level)
- Least privilege (RBAC + field permissions)
- Encryption everywhere (TLS 1.3, AES-256 at rest)
- Audit everything financial
- Saudi PDPL compliance throughout

---

## 9. Observability
- **Logs:** structured JSON via `logger.ts` → Loki / Grafana
- **Metrics:** Prometheus + Grafana
- **Traces:** OpenTelemetry → Jaeger
- **Errors:** Sentry (already wired in `sentry.*.config.ts`)
- **Uptime:** UptimeRobot or BetterStack
- **Audit:** field-audit + activity engine → AuditLog table

---

## 10. Scaling Strategy

### 10.1 Vertical (per-tenant)
- DB: connection pool sizing
- App: PM2 cluster mode

### 10.2 Horizontal (across tenants)
- App: stateless → multiple Next.js instances behind LB
- DB: shard tenants across multiple PostgreSQL clusters
- Cache: Redis cluster

### 10.3 Geographic
- **Primary:** Saudi region (Hetzner Falkenstein → Saudi Riyadh in future)
- **DR site:** Hetzner Helsinki
- **CDN:** Cloudflare global

---

## 11. Technology Decisions Log

| القرار | البديل المرفوض | السبب |
|-------|---------------|-------|
| Next.js 16 RSC | NestJS + React SPA | RSC تقلل الـ bundle و تحسن SEO + توحد الكود |
| Prisma | TypeORM, Drizzle | Migration story + type safety + community |
| PostgreSQL | MySQL, MongoDB | Transactions ACID + JSONB + pgvector |
| Clerk | Auth0, NextAuth | UX جاهزة + multi-tenant + MFA out of box |
| Tailwind 4 | Material UI | تخصيص أعلى + أصغر bundle + RTL أسهل |
| BullMQ | Bull, AWS SQS | Redis-native + UI dashboard + reliability |
| Gemini | OpenAI | تكلفة أقل لـ MENA + API stable + Arabic strong |
| Hetzner | AWS, Azure | تكلفة 5-10x أقل + GDPR friendly + Saudi expansion path |
| Electron | Tauri | npm ecosystem + ZATCA Java signer easier |

---

## 12. Anti-patterns to AVOID

- ❌ Direct SQL في API routes (use Prisma + transactions)
- ❌ Cross-tenant queries (always tenantId)
- ❌ Mutating POSTED journal entries (always reversal)
- ❌ Float type for money (always Decimal)
- ❌ Hard-coded Saudi rules (use settings + engines)
- ❌ Bypassing auto-journal.ts for financial entries
- ❌ Direct Clerk session access (use auth wrapper)
- ❌ Storing secrets in code or settings table (use env + vault)
- ❌ Synchronous external API calls (use queues)
- ❌ Long-running operations in HTTP request (use jobs)
