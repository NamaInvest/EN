---
version: 1.0
last_updated: 2026-05-12
---

# Security Plan

## النموذج المرجعي

- **OWASP Top 10 2024** — العشرة المخاطر
- **OWASP ASVS Level 2** — متطلبات الأمان
- **ISO 27001** — إدارة أمن المعلومات
- **SOC 2 Type II** — أمن البيانات السحابية
- **PDPL (Saudi)** — حماية البيانات الشخصية
- **NCA Essential Cybersecurity Controls (ECC)** — السعودية

## Defense in Depth

```
Internet ─┬─ Cloudflare WAF + DDoS
          │
          ├─ Load Balancer + TLS 1.3
          │
          ├─ Edge Middleware (rate limit, auth)
          │
          ├─ Application (RBAC + input validation + output encoding)
          │
          ├─ DB (network isolated + encrypted at rest + per-tenant)
          │
          └─ Object Storage (signed URLs + bucket policies)
```

## Identity & Access Management

### Authentication
- **Provider:** Clerk 7 (مؤسس)
- **Methods:** Email/Password, Magic Link, OAuth (Google, Apple, Microsoft)
- **MFA:** TOTP (موجود), WebAuthn/Passkeys, SMS (last resort)
- **Session:** HTTP-only secure cookies, 7-day max with refresh
- **Brute force:** 5 fails → 15 min lockout

### Authorization (RBAC)
- **Roles:** super-admin, tenant-admin, cfo, controller, ap, ar, sales-manager, sales-rep, warehouse, manufacturing, hr, payroll, auditor, viewer
- **Permissions:** resource:action (e.g., `sales:invoice:create`, `gl:journal:post`)
- **Storage:** UserPermission (RBAC) + RoleFieldPermission (field-level)
- **Delegation:** UserDelegation table (vacation cover-up)

### Segregation of Duties (SoD)
```typescript
// src/lib/sod-engine.ts
export const SOD_RULES = [
  {
    name: 'Vendor invoice post + payment',
    rules: ['ap:invoice:post', 'ap:payment:create'],
    severity: 'CRITICAL',
  },
  {
    name: 'Journal post + approve',
    rules: ['gl:journal:post', 'gl:journal:approve'],
    severity: 'HIGH',
  },
  {
    name: 'Vendor master + payment',
    rules: ['vendor:master:edit', 'ap:payment:create'],
    severity: 'CRITICAL',
  },
  {
    name: 'Employee master + payroll run',
    rules: ['employee:master:edit', 'payroll:run'],
    severity: 'HIGH',
  },
];
```

## Data Protection

### Encryption at Rest
- **DB:** Postgres TDE (Transparent Data Encryption) via managed provider
- **Files:** S3 SSE-KMS
- **PII fields:** application-level encryption (AES-GCM-256)
  - `src/lib/field-encryption-engine.ts` handles encrypt/decrypt
  - Fields: national_id, iqama, passport, bank_account, salary, ssn

### Encryption in Transit
- **External:** TLS 1.3 minimum
- **Internal (service-to-service):** mTLS in K8s
- **DB connections:** SSL required

### Data Classification
| Classification | Examples | Controls |
|---|---|---|
| **Public** | Marketing site, openapi.json | None |
| **Internal** | Tenant config, non-PII reports | Logged-in only |
| **Confidential** | Customer/vendor data, prices, contracts | Per-tenant + RBAC |
| **Restricted** | PII (national IDs), credentials, ZATCA certs | Field encryption + audit + need-to-know |

### Data Retention (PDPL-compliant)
| Data Type | Retention | Reason |
|---|---|---|
| Transactional records (invoices, JEs) | 10 years | SOCPA + ZATCA |
| Payroll records | 10 years | Labor law |
| Audit logs | 7 years | SOCPA |
| Sessions | 30 days | Investigation |
| Backups | 90 days | Recovery |
| Marketing emails | 2 years opt-in | PDPL |
| Customer accounts (inactive) | 5 years then anonymize | PDPL |

## Application Security

### Input Validation
- **At the edge:** Zod schema on every API route
- **DB level:** Constraints + types
- **Sanitization:** DOMPurify for any user HTML in PDFs/emails

### Output Encoding
- React auto-escapes by default
- `dangerouslySetInnerHTML` forbidden without explicit security review
- API responses are JSON only (no template injection risk)

### CSRF
- Same-site cookies (strict)
- CSRF token for forms via Clerk
- POST/PUT/DELETE require Authorization header for API

### XSS
- React JSX escapes
- CSP header strict:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.zatca.gov.sa https://*.sentry.io;
  ```

### SQL Injection
- Prisma parameterized queries (default)
- Raw queries reviewed by senior dev
- Read-only DB user for NLQ engine

### Secrets Management
- **Vault** (Hetzner / HashiCorp Vault) for production secrets
- **dotenv-vault** for environment-encrypted secrets
- **Never** commit `.env*` (in .gitignore)
- **Rotation:** every 90 days for API keys; 365 days for JWT signing keys
- **ZATCA certs:** `src/lib/zatca-vault.ts` handles encrypted storage

### Dependency Security
- `npm audit` in CI (fail on high)
- Dependabot weekly
- Snyk monthly scan
- License compliance scan (no GPL in production code)

## Network Security

### Cloud Architecture
```
Public Internet
    │
    ▼
Cloudflare (WAF + DDoS + Bot Management + CDN)
    │
    ▼
Load Balancer (Hetzner / AWS ALB)
    │
    ▼
Application Servers (Private Subnet)
    │
    ├──► DB (Private Subnet, no public access)
    ├──► Redis (Private Subnet)
    ├──► S3 (VPC Endpoint)
    └──► External APIs (NAT Gateway)
```

### Firewall Rules
- DB: only from app servers
- App: only from LB
- LB: only from Cloudflare IPs
- SSH: only via bastion + WireGuard VPN

## Monitoring & Detection

### Logging
- All API requests: method, path, status, duration, user, IP, UA
- All DB writes: via FieldAuditLog
- All auth events: login, logout, MFA challenge, password change
- All admin actions: separately tagged

### SIEM Integration (optional, for enterprise tenants)
- Stream logs to customer's Splunk / Sentinel / Datadog
- Provide log export via S3 (signed URLs)

### Alerts
- Brute force (5+ failed logins from same IP)
- Privilege escalation attempt
- Cross-tenant access attempt
- Unusual export volume (DLP)
- New device login + geo anomaly
- Vendor bank account change (with auto-hold)
- Off-hours admin login

### Anomaly Detection
- `src/lib/anomaly-detection-engine.ts` (proposed)
- Daily run of 10 detectors (see Full Scan §13)
- LLM explanations attached to findings
- Auto-create AuditFinding when score > 80

## Incident Response

### Incident Classification
| Level | Description | Response Time |
|---|---|---|
| **P0 — Catastrophic** | Data breach, ransomware, prod down | 15 min, all-hands |
| **P1 — Critical** | Data corruption, ZATCA reject for tenant | 1 hour |
| **P2 — High** | Performance degradation, partial outage | 4 hours |
| **P3 — Medium** | Single tenant issue, non-critical feature broken | 24 hours |
| **P4 — Low** | Cosmetic, documentation | Next sprint |

### Playbooks (located in `docs/MASTER_PACK/15-security/playbooks/`)
- `pb-data-breach.md`
- `pb-ransomware.md`
- `pb-ddos.md`
- `pb-credential-stuffing.md`
- `pb-vendor-impersonation.md`
- `pb-tenant-data-leak.md`
- `pb-zatca-mass-failure.md`

### Sample Playbook — Data Breach

```markdown
# Playbook: Data Breach

## Triggers
- Unauthorized data access detected
- Customer reports their data found on dark web
- Internal audit finds unauthorized export

## Containment (< 1 hour)
1. Identify affected tenant(s)
2. Force logout all sessions for affected users
3. Rotate all API keys for affected tenant
4. Snapshot DB for forensics
5. Lock down ingress (Cloudflare rule)

## Investigation (< 24 hours)
1. Trace from FieldAuditLog: who, what, when, from where
2. Determine scope (rows accessed, exported, modified)
3. Check for persistence (backdoor, scheduled jobs)
4. Engage external forensics if scope is large

## Notification (per PDPL, < 72 hours)
1. Affected tenant admin (private channel)
2. Affected data subjects (if PII leaked)
3. SAUDI National Cybersecurity Authority (if applicable)
4. SAMA (if financial data)

## Recovery
1. Restore from clean backup (before compromise)
2. Patch the vulnerability
3. Add new detection rule
4. Pen test the fix

## Post-mortem
1. Within 1 week
2. Public summary (if customer-facing)
3. Internal review with CTO + Security lead
4. Action items tracked
```

## Compliance Checklist

### PDPL (Saudi Personal Data Protection Law)
- [x] Consent management (PdplConsent table)
- [x] Data subject request handling (PdplDataSubjectRequest)
- [x] Breach notification (PdplBreachIncident)
- [x] Data retention enforcement (DataRetentionPolicy)
- [x] Right to access, rectify, delete, portability
- [x] DPO contact info published
- [x] DPIA for high-risk processing
- [x] Cross-border transfer notification (in progress)

### ZATCA Phase 2
- [x] B2B clearance integration
- [x] B2C reporting integration
- [x] XAdES signature
- [x] QR TLV format
- [x] ICV gap-free
- [x] PIH chained
- [x] Compliance check (zatca compliance simulator)

### GOSI / WPS / Mudad / Qiwa
- [x] Monthly GOSI submission
- [x] SIF file (WPS)
- [x] Mudad sync
- [x] Qiwa contracts
- [x] Saudization tracking

### SOCPA
- [x] CoA template
- [x] Trial balance balanced
- [x] Period close audit trail
- [x] Year-end procedures
- [x] 7-year retention

## Backup & Disaster Recovery

### Backup Strategy
- **DB WAL:** continuous to S3 (RPO 5 min)
- **Daily snapshot:** to glacial (RPO 24h)
- **Weekly full:** off-site (RPO 7d)
- **Tenant export:** on-demand (PDPL portability)

### Restore Testing
- **Monthly:** automated restore drill to staging
- **Quarterly:** full DR exercise (region failover)

### RTO/RPO
| Tier | RTO | RPO |
|---|---|---|
| Standard | 4 hours | 1 hour |
| Premium | 1 hour | 5 min |
| Enterprise | 15 min (warm standby) | 1 min |

## Pen Test Plan

- **External vendor:** annual full pen test (CREST or equivalent)
- **Scope:** Production + Staging (no Master DB direct)
- **Frequency:** Annual + after major architecture change
- **Reports:** delivered to customers (premium tier)
- **Bug bounty:** HackerOne private program (planned)

## Security Training

- Annual security awareness for all staff
- Secure coding training for engineers
- Privileged access training for admins
- Phishing simulation quarterly

## Vendor Risk Management

Before integrating any external service:
- [x] SOC 2 / ISO 27001 verified
- [x] DPA signed
- [x] Data residency confirmed
- [x] Encryption practices verified
- [x] Incident notification SLA
- [x] Audit rights
- [x] Termination clauses for data deletion

