# Cross-Cutting Concerns — مخاوف شاملة عبر النظام

> **الهدف:** المخاوف التي لا تخص موديول معين، بل تطبق عبر كل النظام: Security، i18n، Audit، Performance، Multi-tenant، AI، Notifications، Permissions

---

## 1) لماذا منفصل؟

10 مخاوف cross-cutting، كل واحد:
- يُطبّق على **كل** الموديولات
- يجب أن يكون موحد (لا يختلف بين موديول وآخر)
- بناؤه مرة واحدة → يحل لكل النظام
- الفشل في أي = فشل النظام كله

---

## 2) Concern #1: Security (Defense-in-Depth)

### Layers:

#### a) Network
- HTTPS only (TLS 1.3)
- WAF (Cloudflare / AWS Shield)
- DDoS protection
- IP allowlisting (admin)
- Geographic restrictions (per tenant)

#### b) Authentication
- Password policy (min 12, complexity)
- bcrypt + pepper
- Session management (JWT + refresh tokens)
- MFA mandatory for sensitive (covered #1 in v1)
- SSO (SAML/OAuth2)

#### c) Authorization
- RBAC (covered #38 in v1)
- Field-level permissions
- Row-level security (per tenant + per scope)
- API rate limiting

#### d) Data Protection
- AES-256-GCM at rest (sensitive fields)
- Field-level encryption (PII, IBAN, ID numbers)
- Backup encryption (KMS)
- Key rotation policy (yearly)

#### e) Application Security
- Input validation (Zod) at every endpoint
- Output encoding (XSS protection)
- SQL injection (Prisma parameterized only)
- CSRF tokens
- Rate limiting per endpoint
- API versioning (`/api/v1`, `/api/v2`)

#### f) Audit
- All actions logged (covered #28 in v1)
- Tamper detection (hash chain)
- Forensic-ready

#### g) Compliance
- PDPL (KSA Privacy)
- GDPR (where applicable)
- SOX (financial controls)
- PCI-DSS (if processing cards)
- ISO 27001

### Implementation Tasks
1. Security headers (CSP, HSTS, X-Frame-Options)
2. Secret rotation automation
3. Penetration testing (quarterly)
4. Vulnerability scanning (continuous)
5. Bug bounty (community)

---

## 3) Concern #2: i18n (Internationalization)

### Languages
- Arabic (default)
- English
- Urdu (expat workforce)
- Hindi
- Bengali
- French (optional)

### Aspects
- Text translation (per namespace)
- Date formatting (Hijri + Gregorian)
- Number formatting (locale-specific)
- Currency formatting + display
- RTL/LTR layout
- Pluralization rules
- Time zones (per user + per tenant)
- Cultural considerations (calendar, weekends Fri/Sat in KSA)

### Implementation
- `useT()` hook in every component
- Translation files in JSON (per namespace)
- Lazy load translations
- Missing key detection (dev)
- Translation management UI for admins

---

## 4) Concern #3: Audit (Universal Logging)

### Universal AuditLog (covered #28 in v1)
Every:
- API call (action + entity + before/after + actor + IP + UA + timestamp)
- DB write (FieldAuditLog for sensitive)
- Authentication event
- Permission check (if denied)
- Configuration change

### Tamper Detection
- Hash chain on logs
- Daily integrity verification
- Immutable storage (S3 with object lock)

### Retention
- Hot: 90 days (queryable)
- Warm: 1 year (S3 standard)
- Cold: 7 years (S3 Glacier)
- Compliance-driven (SOX, financial)

---

## 5) Concern #4: Performance

### SLOs (Service Level Objectives)
- API response time: P95 < 500ms, P99 < 2s
- Page load: P95 < 2s
- Uptime: 99.9% (≈8.7h downtime/year)
- DB query: P99 < 100ms (excluding heavy reports)

### Optimization Patterns

#### Frontend
- Code splitting (per route)
- Lazy loading components
- Image optimization (Next.js Image)
- CSS minification
- HTTP/2 + compression
- CDN (static assets)
- Service Worker (offline)

#### Backend
- Connection pooling (Prisma)
- Query optimization (use indexes, avoid N+1)
- Caching (Redis for hot data)
- Background jobs (BullMQ)
- API rate limiting
- Pagination (cursor-based for large datasets)

#### Database
- Proper indexes (foreign keys, common queries)
- Materialized views (for reports)
- Partitioning (audit logs by month)
- Read replicas (for reports)
- Slow query monitoring

#### Reports
- Async generation (queue)
- Pre-computed aggregates
- Incremental refresh

### Monitoring
- APM (Datadog / New Relic)
- Error tracking (Sentry)
- RUM (Real User Monitoring)
- Synthetic monitoring (uptime checks)

---

## 6) Concern #5: Multi-Tenancy

### Architecture
- Database-per-tenant (current Namasoft approach)
- Master DB for tenant routing
- Tenant context middleware (every API call)

### Isolation Guarantees
- No cross-tenant data leak (enforced at DB level)
- Per-tenant backups
- Per-tenant feature flags
- Per-tenant white-labeling
- Per-tenant rate limits

### Operations
- Tenant provisioning (zero-touch)
- Tenant migration (between regions)
- Tenant deletion (with grace period)
- Tenant analytics (per-tenant dashboards for SaaS provider)

### Cross-Tenant Functionality (Carefully)
- Master Panel (SaaS admin)
- Bulk operations (with explicit tenant selection)
- Compliance export (per-tenant data)

---

## 7) Concern #6: AI Layer

### AI Capabilities (covered #40 in v1)
- 8 AI engines

### Cross-Cutting AI Concerns
- Prompt template management
- Cost tracking (per call, per user, per tenant)
- Hallucination detection
- Bias detection
- PII redaction before LLM
- Compliance (PDPL: data residency for AI calls)
- Failover (provider down → backup)
- A/B testing models

### Governance
- Approve which models can be used
- Approve which prompts can be used
- Audit every AI call
- Sensitive operations: AI suggests, human decides

---

## 8) Concern #7: Notifications

### Channels
- In-app (real-time, websocket)
- Email
- SMS (Saudi: Unifonic, Taqnyat)
- WhatsApp Business
- Telegram
- Push (mobile app)
- Slack (internal)

### Patterns
- Event-driven (publish/subscribe)
- User preferences (which channels for which events)
- Throttling (don't spam)
- Templates (versioned, multi-language)
- Tracking (delivered, opened, clicked)

### Notifications Catalog
~500 events across all modules. Each:
- Code (e.g., `INVOICE.OVERDUE`)
- Default channels
- Default recipients (role-based)
- Template (per channel + language)
- Override per user

---

## 9) Concern #8: Permissions (RBAC)

### Beyond Basic RBAC (covered #38 in v1)

#### Feature-Level
- Per role: which modules visible
- Per role: which actions per module
- Per role: which fields visible/editable
- Per role: which records visible (row-level)

#### Dynamic
- Roles can be assigned scoped (own/team/branch/region/all)
- Time-bounded (effective dates)
- Delegated (out-of-office)

#### Centralized Check
- Every API call → permission check (middleware)
- Every UI element → permission check (hide/disable)
- Every report → row filter applied

### Performance
- Cache permissions per user (in Redis)
- Refresh on role change
- Bulk permission check API

---

## 10) Concern #9: Document Management

### Universal Pattern (covered #44 in v1)
Every document in system:
- Generated (PDF/Excel/CSV)
- Stored (S3 with hash)
- Versioned (history)
- Linked (to source records)
- Searchable (OCR + metadata)
- Retention (per policy)
- Access controlled

### Use Cases
- Invoices (auto-generated PDF + ZATCA-signed XML)
- Contracts (with e-signature)
- Reports (snapshots immutable)
- Photos (evidence)
- Manuals (KB)

---

## 11) Concern #10: Workflow / BPM Engine

### Universal Engine (covered #38 in v1)

Every "approval" or "multi-step process" goes through this engine:
- PR approval (multi-level)
- Invoice approval
- Leave approval
- Expense reimbursement
- Customer credit increase
- Journal entries (large amount)
- Document signing
- Recruitment offer

### Configuration
- Visual designer (BPMN-like)
- Conditions (amount, type, party)
- Routing (sequential, parallel, dynamic)
- SLAs + escalations
- Delegation
- Audit trail per step

---

## 12) Implementation Strategy

### Phase 1: Foundation (Months 1-3)
- Security hardening (#2)
- Audit infrastructure (#4)
- Permissions framework (#9)
- i18n setup (#3)
- Multi-tenant guarantees (#6)

### Phase 2: Core Cross-Cutting (Months 4-6)
- Notifications layer (#8)
- Document management (#10)
- Workflow engine (#11)
- Performance optimization (#5)

### Phase 3: AI Integration (Months 7-9)
- AI governance (#7)
- AI cost tracking
- AI hallucination detection
- AI failover

### Phase 4: Excellence (Months 10-12)
- a11y audit
- Performance tuning
- Penetration testing
- Compliance certifications

---

## 13) Testing Cross-Cutting

```typescript
// Security
describe('Authentication', () => { /* MFA, session, lockout */ })
describe('Authorization', () => { /* RBAC, row-level, field-level */ })
describe('Encryption', () => { /* at rest, in transit */ })

// Multi-tenant
describe('Tenant Isolation', () => {
  test('cannot access other tenant data via API')
  test('cannot query cross-tenant in reports')
  test('webhook respects tenant context')
})

// i18n
describe('Localization', () => {
  test('Arabic RTL renders correctly')
  test('Hijri calendar conversion')
  test('Number formatting per locale')
})

// Performance
describe('SLOs', () => {
  test('API P95 < 500ms')
  test('Page load P95 < 2s')
  test('No N+1 queries detected')
})

// Audit
describe('Audit Trail', () => {
  test('every CRUD logged')
  test('hash chain unbroken')
  test('FieldAuditLog for sensitive')
})

// AI
describe('AI Governance', () => {
  test('PII redacted before LLM')
  test('cost tracked per call')
  test('hallucination detected')
})
```

---

## 14) Monitoring Dashboards

### Cross-Cutting Health Dashboard

**Security:**
- Failed logins (24h)
- MFA adoption %
- IP blocks
- Vulnerability scan results

**Performance:**
- API response times (P50/P95/P99)
- Error rate
- Throughput
- DB connection pool

**Multi-tenant:**
- Active tenants
- New signups
- Churn risk
- Resource usage per tenant

**AI:**
- Calls today
- Cost MTD
- Avg latency
- Hallucination rate

**Notifications:**
- Sent today (per channel)
- Delivery rate
- Open rate
- Bounce rate

**Audit:**
- Logs created/sec
- Hash chain integrity
- Storage usage

---

## 15) Compliance Matrix

| Requirement | Concern | Status |
|-------------|---------|--------|
| PDPL Art. 26 (data subject rights) | Security + Audit | ✓ via #28 + GDPR delete |
| PDPL Art. 14 (encryption) | Security | ✓ AES-256-GCM |
| PDPL Art. 18 (breach notification) | Security | needs SIEM (#43) |
| ZATCA Phase 2 | Document Mgmt + Audit | ✓ via #27 |
| SOCPA financial reporting | Audit | ✓ via #28 + #4 (R2R) |
| SOX 404 controls | Audit + Permissions | ✓ via #28 + #38 |
| ISO 27001 | All security | partial |

---

**هذا الوثيقة تكمّل BPFs الـ8 + UI Library = صورة شاملة للنظام.**
