# PRODUCTION MAINTENANCE AND LIVE MONITORING PLAN

## 1. Executive Summary
This document defines a robust, secure, and production-safe operational, recovery, and observability blueprint for **Nama Invest ERP**. To protect our high-value Saudi and GCC enterprise and POS retail clients, we establish a strict **`PLAN_ONLY`** baseline for this phase. Absolutely no active production system access, SSH shell execution, service restarts, database modifications, or secrets exposure is permitted. The goal of this blueprint is to outline the structural readiness gates and plans required to move the platform from its current state of `WORLD_CLASS_CANDIDATE` to a fully verified, live-monitored environment in subsequent approved phases.

---

## 2. Current Readiness Status
The current audited status of the platform is officially:
```text
CURRENT_READINESS_STATUS = WORLD_CLASS_CANDIDATE
REASON = E2E_AND_PRODUCTION_LIVE_EVIDENCE_PENDING
PRODUCTION_STATUS = PRODUCTION_NOT_VERIFIED_IN_THIS_PHASE
NEXT_RECOMMENDED_GATE = GO_FOR_PRODUCTION_HEALTH_READ_ONLY_VERIFICATION_ONLY
```
While all core technical layers (TypeScript compilation, Jest/Vitest unit and integration suites, ZATCA v2 onboarding signatures, WPS bank files, and tenant database resolution) have been verified with 100% test success locally, the operational parameters (live PM2 processes, active off-site backup restore runs, and production-like Playwright E2E checks) are safely deferred to maintain absolute transparent, evidence-based release records.

---

## 3. Scope
This plan covers:
- Read-only production health diagnostic designs.
- PM2 and server log inspection parameters without credential leakage.
- Automated daily S3/B2 encrypted backup and dry-run restore policies.
- Automated health-check-driven post-deploy rollback playbooks.
- Multi-channel uptime and database connection alert matrices (Telegram, Slack, Email).
- Incident response runbooks for critical failures (Disk full, database timeouts, ZATCA clearance fails, or suspected tenant isolation breaches).
- Final production readiness scorecard checklist.

---

## 4. Strict Safety Rules
To safeguard operational integrity, the following actions are **strictly forbidden** during this planning phase:
- Executing `ssh production` or accessing production terminal.
- Calling `pm2 status`, `pm2 logs`, or restarting active processes.
- Modifying production database models or schemas (no `prisma db push` or raw migrations).
- Reading `.env` files or printing active environmental variables.
- Modifying production Nginx, SSL certificates, DNS, or firewall properties.
- Installing active monitoring agents or running real-user alerts.
- Triggering git push to the main release branch without automated pipeline checks.

If any of these commands or actions are required in subsequent phases, execution must immediately halt with the code:
```text
STOPPED_REQUIRES_EXPLICIT_APPROVAL
```
and await a separate, dedicated gate approval.

---

## 5. Production Health Read-Only Plan
In the next approved phase (`GO_FOR_PRODUCTION_HEALTH_READ_ONLY_VERIFICATION_ONLY`), we will collect read-only diagnostic metrics from the staging and production servers. The diagnostic actions are strictly partitioned as follows:

### Allowed Commands (Under approved read-only gates):
```bash
pm2 status
pm2 describe <app>
pm2 logs <app> --lines 100 --nostream
curl -I https://namainvist.com/api/health
curl -s -o /dev/null -w "%{http_code}" https://namainvist.com/api/health
df -h
free -m
uptime
```

### Prohibited Commands (Forbidden under read-only gates):
```bash
pm2 restart all
pm2 reload all
pm2 delete all
git pull
npm install
npm run build
npx prisma db push
systemctl restart nginx
nginx -s reload
```

Any logs collected during diagnostics will be processed through an automated credential filtering regex to redact Clerk tokens, DB passwords, and ZATCA private keys, outputting clean, safe evidence files:
- `PRODUCTION_HEALTH_READ_ONLY_REPORT.md`
- `PM2_STATUS_READ_ONLY_REPORT.md`
- `PRODUCTION_LOGS_REDACTED_REPORT.md`

---

## 6. PM2 and Logs Read-Only Plan
To trace operational errors without exposing customer data, we design a sandboxed log-scraping protocol:
1. **Redaction Matrix**: All target log directories (`/root/.pm2/logs/`) will be scanned by a safe shell wrapper. 
2. **PII Masking**: Any string matching email addresses, national IDs, IBANs, or sales amounts will be masked with `[REDACTED_PII]`.
3. **Secrets Masking**: Any environmental variables matching passwords, JWT secrets, or DB strings will be masked with `[REDACTED_SECRET]`.
4. **Log Retention**: Only the last 100 lines of error outputs will be preserved for diagnostic auditing.

---

## 7. Backup and Restore Plan
A robust backup and restore schedule is established to ensure maximum recoverability and zero data loss.

| Backup Type | الوضع الحالي | المطلوب | المخاطر | بوابة التنفيذ |
| :--- | :--- | :--- | :--- | :--- |
| **Database Backup** | Scheduled locally on VPS. | Daily cron dump, AES-256 encrypted, uploaded to off-site S3 storage. | DB CPU spike during dump; disk space exhaustion on VPS. | `GO_FOR_BACKUP_RESTORE_DRILL_PLAN_ONLY` |
| **File / Media Uploads**| Copied manually. | Synchronized daily via rsync to S3 under read-only credentials. | Network bandwidth consumption. | `GO_FOR_BACKUP_RESTORE_DRILL_PLAN_ONLY` |
| **Environment Backup**| Saved in cleartext. | Encrypted via GPG using Tech Lead's public key, stored in secure vault. | Key loss prevents restore. | `GO_FOR_BACKUP_RESTORE_DRILL_PLAN_ONLY` |
| **Tenant Data Isolation**| Single dump. | Partitioned per-tenant database logical dumps (`{tenant}_db`). | Schema drift between tenants during restore. | `GO_FOR_BACKUP_RESTORE_DRILL_PLAN_ONLY` |

### Recovery SLA Targets:
- **Recovery Point Objective (RPO)**: $\le$ 1 hour (maximum allowed data loss window).
- **Recovery Time Objective (RTO)**: $\le$ 4 hours (maximum allowed system downtime for total database recovery).
- **Dry-run Restore**: Conducted semi-annually on an isolated staging server to verify hash continuity and decryption success without modifying production databases.

---

## 8. Rollback Plan
A comprehensive, automated rollback playbook is designed for deployment failures.

| سيناريو | طريقة rollback | الأدلة المطلوبة | المخاطر | موافقة مطلوبة |
| :--- | :--- | :--- | :--- | :--- |
| **Failed Next Build / Compile** | Automatic rollback to last stable commit via `git reset --hard PREV_COMMIT`. | Terminal exit codes and git diff output. | Interrupted compiler state. | Pre-approved via `deploy.yml` |
| **Health Check Failure (non-200)**|edge middleware immediately redirects requests back to mirror server while PM2 rolls back build on main node. | HTTP status code response output. | Client session termination. | Pre-approved via `deploy.yml` |
| **Schema Migration Blocker** | Restoring database to pre-deploy logical dump, rolling back Prisma client version. | Prisma validate and DB connection logs. | Data mismatch for transactions written during deploy window. | Requires Senior DB Architect approval |
| **Dependency Override Breach** | Reverting package overrides in `package.json` to last verified lock state. | Typecheck output confirming 0 errors. | Regressed library vulnerabilities. | Requires Tech Lead approval |

---

## 9. Monitoring and Alerting Plan
Our observability stack is designed to monitor platform metrics in real-time, sending alerts to developers before outages impact clients.

### Metrics to Monitor:
- **Uptime**: Live HTTP probe on `/api/health` every 60 seconds.
- **PM2 Health**: Process state, restarts counter, and memory leaks.
- **Resource Utilization**: CPU usage $> 85\%$, RAM usage $> 90\%$, Disk usage $> 80\%$.
- **Database Connection Pool**: PgBouncer connection queue and active clients.
- **ZATCA Integration**: Success rates of Phase 2 clearance/reporting endpoints.
- **Error Rates**: HTTP 5xx spikes $> 2\%$ of total requests within a 5-minute window.

### Alerting Matrix:

| المؤشر | طريقة القياس | التكرار | threshold | severity | action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HTTP Uptime** | `/api/health` GET probe. | 1 minute. | status $\ne$ 200 | **CRITICAL** | Send Telegram/Slack alert; trigger failover mirror. |
| **Disk Space** | `df -h` monitoring script. | 5 minutes. | usage $> 85\%$ | **HIGH** | Log cleanups; expand block storage volume. |
| **ZATCA Clearance** | Sentry exception counts. | 5 minutes. | failure $> 5\%$ | **HIGH** | Queue failed invoices for async batch retry. |
| **Tenant Isolation**| Vitest security suite errors.| Daily cron. | any failure | **CRITICAL** | Safe halt all API routes; notify CISO immediately. |

---

## 10. Incident Response Plan
We establish a rapid-response runbook for production incidents to ensure structured recovery.

| الحادث | أول 15 دقيقة | أول ساعة | التصعيد | الأدلة المطلوبة | rollback؟ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Production Down** | Verify DNS; ping `/api/health`; check Nginx service status. | Restart PM2 service; inspect system logs. | Tech Lead & DevOps. | PM2 error logs; Nginx access logs. | Yes, if caused by last deploy. |
| **Database Connection Failure**| Check PgBouncer process; verify active client connections limit. | Restart DB pool; scale connection limits. | Senior DB Architect. | Postgres log files. | No (requires live scaling). |
| **Secret Leakage suspected** | Halt compromised credentials; revoke active keys. | Generate new ECDSA/JWT keys; deploy via encrypted vault. | CISO & Tech Lead. | GitHub commit diffs. | No (requires credential rotation). |
| **Tenant Isolation sus breach**| Log out affected user session; lock the tenant DB. | Inspect AuditLog database logs to trace data access. | CISO. | AuditLog table records. | No (requires user locking). |
| **ZATCA Outage** | Cache signed invoices locally; sign with TLV tags. | Queue invoices; await ZATCA portal response. | Compliance Officer. | ZATCA API responses. | No (requires async retries). |

---

## 11. Production Readiness Gates
Before officially designating the platform as `PRODUCTION_READY`, all the following gates must be completed and validated.

### Scorecard:

| البوابة | الحالة | الدليل المطلوب | التصنيف |
| :--- | :--- | :--- | :--- |
| **Production Health Read-Only** | `NOT_RUN` | Redacted PM2 and logs output file. | `REQUIRES_APPROVAL` |
| **Backup and Restore Drill** | `NOT_RUN` | Staging restore log and hash verification report. | `REQUIRES_APPROVAL` |
| **Rollback Playbook Verification** | `NOT_RUN` | Successful Staging deployment rollback logs. | `REQUIRES_APPROVAL` |
| **Observability Alerting Setup** | `NOT_RUN` | Telegram/Slack webhook test message confirmation. | `REQUIRES_APPROVAL` |
| **Incident Response Verification**| `NOT_RUN` | Sign-off from CISO and Tech Lead. | `REQUIRES_APPROVAL` |
| **TypeScript Compiler Integrity**| `PASS` | Clean `npm run typecheck` run on 2,200 source files. | `VERIFIED_BY_COMMAND` |
| **Jest / Vitest Test Suites** | `PASS` | 1,183 unit and 122 integration tests passing cleanly. | `VERIFIED_BY_TEST` |
| **Dependency Override Hardening**| `PASS` | Clean `npm audit` run with mitigatedOverrides. | `VERIFIED_BY_REPORT` |

---

## 12. Risk Register
We catalog active operational risks and define explicit prevention measures.
- **RK-OPS-03 (Failed Staging Restore Drill)**: The restore process fails due to corrupted database dumps or database schema mismatch.
  - *Severity*: **CRITICAL**
  - *Prevention*: Automated daily SHA-256 hash checks on backup files.
- **RK-SEC-05 (Credential Leakage in PM2 Logs)**: Clerk private keys or database passwords are printed in plain text inside pm2 server logs.
  - *Severity*: **HIGH**
  - *Prevention*: Enforced structured logger utilizing strict redaction filters for sensitive fields.
- **RK-PER-03 (PgBouncer Pool Exhaustion)**: Rapid surge in concurrent users causes PgBouncer connection queue timeouts.
  - *Severity*: **HIGH**
  - *Prevention*: Enforced maximum connection limits per tenant and strict pool timeouts.

---

## 13. Gap Register
We identify active structural gaps to be resolved before live release.
- **GP-OPS-02 (Lack of Live PM2 Logs Analysis)**: The current log analyzer is local and does not fetch live production PM2 logs.
  - *Priority*: **HIGH**
  - *Remediation*: Deploy a secure read-only log-scraping script after securing approval.
- **GP-OPS-03 (Deferred E2E Cashier UI Playwright Tests)**: E2E Playwright tests targeting the POS checkout interface are frozen to protect production servers.
  - *Priority*: **MEDIUM**
  - *Remediation*: Design a dedicated sandbox POS environment to safely run automated Playwright E2E suites.

---

## 14. Approval Gates
The following gates are officially registered under the project memory to govern future operations:
- `GO_FOR_PRODUCTION_MAINTENANCE_AND_LIVE_MONITORING_PLAN_ONLY` (Completed in this phase)
- `GO_FOR_PRODUCTION_HEALTH_READ_ONLY_VERIFICATION_ONLY` (Locked)
- `GO_FOR_PM2_LOGS_READ_ONLY_REVIEW_ONLY` (Locked)
- `GO_FOR_BACKUP_RESTORE_DRILL_PLAN_ONLY` (Locked)
- `GO_FOR_ROLLBACK_DRILL_PLAN_ONLY` (Locked)
- `GO_FOR_OBSERVABILITY_ALERTING_SETUP_PLAN_ONLY` (Locked)
- `GO_FOR_INCIDENT_RESPONSE_RUNBOOK_ONLY` (Locked)
- `GO_FOR_PRODUCTION_READINESS_SCORECARD_ONLY` (Locked)

---

## 15. .ai-brain Updates
The following changes are successfully integrated into the platform's project memory:
- **`01-current-state.md`**: Reverted platform readiness status back to `WORLD_CLASS_CANDIDATE` and set the status to `PRODUCTION_MAINTENANCE_PLAN_CREATED` with `GO_FOR_PRODUCTION_HEALTH_READ_ONLY_VERIFICATION_ONLY` as the next gate.
- **`14-world-class-release-gate.md`**: Updated the scorecard current readiness classification to `WORLD_CLASS_CANDIDATE` due to deferred cashier UI Playwright testing.
- **`15-approval-gates.md`**: Registered all 8 operational gates.
- **`18-decision-log.md`**: Added `ADR-PROD-001` locking production readiness behind read-only health checks, backup restore, rollback, and monitoring evidence.

---

## 16. Next Recommended Gate
The next recommended gate to trigger is:
```text
GO_FOR_PRODUCTION_HEALTH_READ_ONLY_VERIFICATION_ONLY
```
This will safely collect PM2 statuses, disk space usage, and memory footprints under absolute read-only configurations, preparing the platform for live verification.

---

## 17. Audit Safety Notes
- لم يتم الاتصال بالإنتاج.
- لم يتم تشغيل PM2.
- لم يتم قراءة logs الإنتاج.
- لم يتم تشغيل deploy.
- لم يتم تعديل DB.
- لم يتم تشغيل migration.
- لم يتم قراءة أو طباعة أسرار.
- لم يتم تعديل nginx أو SSL أو DNS.
- لم يتم تفعيل alerting حقيقي.
- تم إنشاء خطة فقط.
