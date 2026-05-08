# 02 — Security Plan
**Standards:** OWASP Top 10 (2024), Saudi PDPL, ISO 27001, ZATCA Phase 2

---

## 1. Threat Model

### 1.1 Assets to Protect
1. Customer financial data (invoices, transactions, balances)
2. Employee personal data (Iqama, salaries, banking)
3. ZATCA-cleared invoices (immutable, signed)
4. Tax records (VAT, Zakat, WHT — 7 years retention)
5. Authentication credentials
6. Tenant isolation boundary
7. Saudi government API credentials (Mudad, Qiwa, GOSI, ZATCA)

### 1.2 Threat Actors
- External attacker (financial gain, ransomware)
- Disgruntled employee (data exfiltration, sabotage)
- Competitor (industrial espionage)
- Nation-state (rare, but possible for major customers)
- Insider Namasoft staff (privileged access abuse)

### 1.3 Attack Vectors
- SQL injection / NoSQL injection
- XSS (stored, reflected, DOM)
- CSRF
- Session hijacking
- Credential stuffing
- Privilege escalation
- Multi-tenant data leak (most critical)
- Supply chain (npm packages)
- API abuse / DoS
- Misconfigured S3 buckets
- Leaked secrets in git
- Phishing (employees, customers)

---

## 2. OWASP Top 10 Mitigations (2024)

### A01: Broken Access Control
- ✅ Centralized RBAC via `usePagePermission.ts` + middleware
- ✅ Field-level permissions via `field-permission.ts`
- ✅ Multi-tenant: every Prisma query MUST include tenantId (linted)
- ✅ Direct Object Reference: never expose internal IDs without auth check
- ✅ ESLint rule: no Prisma calls without tenant scope
- 🔴 Mandatory: write `tenantId` test for every new API route

### A02: Cryptographic Failures
- ✅ TLS 1.3 only (HSTS header, max-age=63072000)
- ✅ AES-256-GCM for at-rest encryption (DB column + S3)
- ✅ bcrypt cost 12 for passwords (handled by Clerk)
- ✅ Secrets in `.env` only, never in code or DB (vault for prod)
- ✅ ZATCA private key in HSM or sealed file with restricted perms
- 🔴 Quarterly key rotation

### A03: Injection
- ✅ Prisma parametrized queries (no raw SQL except very rare cases)
- ✅ Zod validation on every input
- ✅ Output encoding via React (auto-escapes)
- ✅ DOMPurify on any HTML rendered
- 🔴 No `eval()`, `Function()`, or template injection

### A04: Insecure Design
- ✅ Threat modeling for new features (this doc)
- ✅ Document state machines prevent invalid transitions
- ✅ Auto-journal.ts enforces accounting balance
- ✅ Approval workflows for high-value operations
- 🔴 Security review before merging any auth/tenant code

### A05: Security Misconfiguration
- ✅ CSP headers via next.config.ts
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ No directory listing
- ✅ Default-deny on permissions
- ✅ No debug endpoints in production
- 🔴 Monthly Trivy + Snyk scan

### A06: Vulnerable Components
- ✅ `npm audit` in CI pipeline (block on high/critical)
- ✅ Renovate bot for dependency updates
- ✅ SBOM generated weekly
- ✅ License audit (no GPL in production deps)

### A07: Authentication Failures
- ✅ Clerk handles auth (battle-tested)
- ✅ MFA mandatory for: Owner, CFO, Admin roles
- ✅ TOTP + backup codes + WebAuthn
- ✅ Session timeout: 8h (configurable)
- ✅ Rate limit on login: 5/min per IP
- ✅ Account lockout after 10 failed attempts
- ✅ Recovery via email + secondary factor

### A08: Software and Data Integrity
- ✅ npm package-lock.json committed
- ✅ Webhook HMAC signing (HMAC-SHA256)
- ✅ ZATCA signed XML archived immutable
- ✅ Audit log for every financial change
- 🔴 Code signing for Electron releases

### A09: Security Logging Failures
- ✅ Auth events logged (login, logout, MFA, failed)
- ✅ Privilege changes logged
- ✅ Financial transactions logged via field-audit
- ✅ Admin actions logged
- ✅ Logs shipped to Loki + Sentry
- ✅ 1-year hot retention, 7-year cold (compliance)
- 🔴 SIEM integration optional

### A10: Server-Side Request Forgery
- ✅ Allowlist for outbound URLs
- ✅ No user-supplied URLs fetched server-side without validation
- ✅ Internal IPs blocked (RFC1918)
- ✅ DNS rebinding protection

---

## 3. Authentication & Authorization

### 3.1 Authentication Stack
- **Provider:** Clerk
- **Methods:**
  - Email + password
  - Google OAuth
  - Microsoft OAuth (للشركات)
  - SSO SAML 2.0 (enterprise)
  - Phone OTP (POS cashiers)
- **MFA:**
  - TOTP (Google Authenticator, Authy)
  - Backup codes (10, single-use)
  - WebAuthn (security keys, biometric)
  - SMS as fallback only

### 3.2 Authorization Model

```
User
  └─ has many → Roles
       └─ has many → Permissions (per module)
            ├─ canView
            ├─ canAdd
            ├─ canEdit
            ├─ canDelete
            ├─ canApprove
            ├─ canPost
            ├─ canExport
            └─ canPrint
       └─ has many → FieldPermissions (per entity.field)
       └─ has many → RecordRules (e.g., "only own department")
```

### 3.3 Role Templates
| Role | Permissions |
|------|------------|
| Owner | * |
| CFO | All accounting + reports + approval ≤ 1M |
| Accountant | JE, AR, AP, Bank Recon (no master data delete) |
| HR Manager | All HR + payroll view (no GL post) |
| Sales Manager | All sales + own team's data |
| Sales Rep | Own customers + opportunities |
| Cashier | POS only + own session |
| Auditor | Read-only all + export logs |
| Vendor (portal) | Own POs + invoices + payments |
| Customer (portal) | Own orders + invoices |

### 3.4 Tenant-Scoped vs Global Roles
- `Namasoft Master Admin` → cross-tenant (rare, audited heavily)
- `Tenant Owner` → all in single tenant
- All others → scoped to one tenant

---

## 4. Data Protection (PDPL Compliance)

### 4.1 Data Classification
| Class | Examples | Encryption | Access Log |
|-------|----------|------------|------------|
| Public | Product catalog | Optional | No |
| Internal | KPIs, dashboards | At rest | Yes |
| Confidential | Invoices, contracts | At rest + transit | Yes |
| Restricted | Payroll, Iqama, BankAcct | At rest + transit + field-level | Yes + alert |

### 4.2 PII Inventory
- Maintained in `pdpl-engine.ts` PII registry
- Per-table classification
- Auto-detection scanner runs monthly

### 4.3 PDPL Rights Implementation
| الحق | Endpoint |
|------|----------|
| Access (الوصول) | GET /api/portal/me/data-export |
| Rectify (التصحيح) | PATCH /api/portal/me/profile |
| Erase (المحو) | POST /api/portal/me/erase-request |
| Restrict (التقييد) | POST /api/portal/me/restrict |
| Portability (نقل البيانات) | GET /api/portal/me/data-portability |
| Object (الاعتراض) | POST /api/portal/me/object |

SLA: 30 days per Article 12 PDPL.

### 4.4 Breach Notification (PDPL Art. 20)
- Detection: SIEM rules + Sentry + manual report
- Triage within 24h
- SDAIA notification within 72h via PdplBreach engine
- Affected subjects notified per severity matrix
- Postmortem in 30d

### 4.5 Data Retention
| Data | Retention | Reason |
|------|-----------|--------|
| Financial transactions | 7 years | ZATCA + tax law |
| Payroll records | 7 years | GOSI + labor |
| Customer data (active) | While active | Legitimate interest |
| Customer data (inactive 3y) | Anonymize | PDPL minimization |
| Marketing consent | Until revoked | PDPL |
| Audit logs | 1y hot + 6y cold | ISO 27001 |
| Backups | 30d daily, 12 monthly, 7 yearly | DR |
| ZATCA invoices | 7 years immutable | ZATCA Phase 2 |

Auto-enforcement via `pdpl-engine.retentionPolicyEnforce()` cron.

---

## 5. Network Security

### 5.1 Perimeter
- WAF: Cloudflare or self-hosted ModSecurity
- DDoS mitigation: Cloudflare
- Geographic restrictions: optional (e.g., block traffic from sanctioned countries)

### 5.2 Internal
- VPC isolation per environment (dev/staging/prod)
- DB on private subnet only
- Bastion host with MFA + session recording for emergency SSH
- Service mesh (Linkerd / Istio) optional for microservices

### 5.3 Egress
- Outbound allowlist for payment gateways, banks, ZATCA, etc.
- Block outbound to public internet from DB/cache servers

---

## 6. Application Security

### 6.1 Input Validation
- Zod schemas at every API boundary
- Reject unknown fields by default (`.strict()`)
- Length, type, range, format constraints
- Sanitize for SQL/NoSQL/Command injection

### 6.2 Output Encoding
- React auto-escapes (no `dangerouslySetInnerHTML` without DOMPurify)
- JSON responses: no eval, parse safely
- PDF generation: no user HTML without sanitization

### 6.3 CSRF
- SameSite=Lax cookies
- CSRF token for state-changing operations
- Origin header check

### 6.4 Rate Limiting
- Per-IP: 100 req/min default
- Per-user: 1000 req/min
- Per-endpoint: tighter for sensitive (login: 5/min, payment: 10/min)
- See `rate-limit.ts`

### 6.5 Idempotency
- POST endpoints accept `Idempotency-Key` header
- 24h cache (Redis)
- Returns prior response on replay
- See `idempotency.ts`

### 6.6 API Security
- API keys: SHA-256 hashed in DB, scopes per key, expiry
- Rotation policy: 90 days
- Per-key rate limits

---

## 7. Secrets Management

### 7.1 Local Development
- `.env` (gitignored)
- `.env.example` (committed, dummy values)

### 7.2 Production
- Hashicorp Vault (or AWS Secrets Manager / Azure Key Vault)
- Rotate quarterly
- Pull at app start, cached in memory only
- Never log

### 7.3 Sensitive Tables
| Field | Encryption |
|-------|------------|
| BankAccount.iban | AES-256-GCM column |
| Employee.iqamaNumber | AES-256-GCM column |
| Employee.salary | RBAC field-level + audit |
| ZatcaCredentials.privateKey | KMS-wrapped |
| MudadCredentials.clientSecret | KMS-wrapped |
| User.mfaSecret | Clerk-managed |

---

## 8. Multi-Tenant Isolation

### 8.1 Database
- DB-per-tenant (highest isolation)
- Connection string in Master DB only
- Per-tenant connection pool, never shared

### 8.2 Application
- Middleware sets `req.tenantId` early
- All Prisma calls go through tenant-scoped client
- ESLint custom rule: warn on raw `prisma.` calls (must use `getTenantPrisma(tenantId)`)

### 8.3 Storage
- Per-tenant S3 prefix or bucket
- Pre-signed URLs scoped + expire
- Cross-tenant access via signed URL impossible

### 8.4 Background Jobs
- Job payload includes tenantId
- Worker resolves tenant before processing
- Job queue per-priority, not per-tenant (cost)

### 8.5 Cache
- Cache keys prefixed with `tenant:<id>:`
- Redis ACL per-tenant if extreme isolation needed (rare)

### 8.6 Tenant Leak Tests (CI)
- Automated test creates 2 tenants
- Inserts data in each
- Asserts queries from one cannot see other's data
- Run on every PR

---

## 9. Audit & Monitoring

### 9.1 Audit Events (always logged)
- Login / logout / MFA
- Permission/role changes
- Tenant creation/deletion
- Master DB access (cross-tenant)
- Financial transactions (JE post, payment, invoice approve)
- Sensitive data access (PII, salary)
- Data export
- Settings changes (especially security-related)
- Admin actions

### 9.2 Real-Time Alerts
- Multiple failed logins same user (10 in 5min)
- New device/location for admin
- Data export > 1000 records
- Any cross-tenant access
- ZATCA submission failure
- Mudad/Qiwa/GOSI integration failure
- Backup failure
- Disk usage > 85%
- Sentry error rate spike

### 9.3 Dashboards
- Security Operations Dashboard: all auth + sensitive events
- Compliance Dashboard: PDPL DSR queue, retention status
- Tenant Health: per-tenant error rate + usage

---

## 10. Incident Response

### 10.1 Severity Levels
| Level | Definition | Response Time |
|-------|------------|---------------|
| SEV-1 | Data breach, system down for all | 15 min |
| SEV-2 | Service degraded, critical feature broken | 1 hour |
| SEV-3 | Single tenant impact | 4 hours |
| SEV-4 | Minor bug, low impact | 1 day |

### 10.2 Runbooks
- `docs/runbooks/data-breach.md`
- `docs/runbooks/db-outage.md`
- `docs/runbooks/zatca-failure.md`
- `docs/runbooks/lost-key.md`

### 10.3 Communication
- Status page: status.namasoft.sa
- Email to affected tenants
- SMS to tenant admins for SEV-1
- SDAIA notification for breaches (PDPL Art. 20)

---

## 11. Penetration Testing

- **Internal:** quarterly by senior engineer
- **External:** annual by certified firm (CREST or equivalent)
- **Bug bounty:** consider HackerOne after maturity
- **Red team:** annual exercise
- Findings tracked in JIRA with SLA: Critical 7d, High 30d, Medium 90d, Low 180d

---

## 12. Compliance Mapping

| Standard | Coverage |
|----------|----------|
| Saudi PDPL | §4 (Data Protection), pdpl-engine.ts |
| ZATCA Phase 2 | §7.3 (Secrets), zatca-*.ts |
| ISO 27001 | §1-11 (full ISMS) |
| SOC 2 Type II | §9-10 (Audit + IR) |
| OWASP Top 10 | §2 |
| GDPR (for GCC expansion) | §4 mostly aligned |

---

## 13. Security Roadmap

### Q1 2026
- [ ] WebAuthn enrollment for admins
- [ ] Vault deployment
- [ ] Per-tenant tenant-leak test in CI
- [ ] PDPL breach simulation drill

### Q2 2026
- [ ] HSM for ZATCA keys
- [ ] SIEM integration (Wazuh / Elastic)
- [ ] First external pentest
- [ ] Bug bounty program scope

### Q3 2026
- [ ] ISO 27001 audit preparation
- [ ] SBOM automation
- [ ] Code signing for Electron

### Q4 2026
- [ ] SOC 2 Type II audit
- [ ] Annual external pentest
