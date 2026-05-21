---
version: 1.0
last_updated: 2026-05-12
---

# Deployment Plan

## نمط النشر

**Blue-Green** للـ production مع **Canary** للميزات عالية المخاطر.

```
Current (Blue)               New (Green)
   │                             │
   ▼                             ▼
[Live Traffic 100%] ──swap──► [Live Traffic 100%]
                              ↑
                              │
                         Smoke tests pass
```

## بيئات النشر

| Environment | URL | Branch | Auto-Deploy | DB |
|---|---|---|---|---|
| Local | localhost:3000 | any | npm run dev | docker postgres |
| Preview | pr-N.preview.namasoft.sa | PR branch | on PR | shadow |
| Dev | dev.namasoft.sa | develop | on push | dev cluster |
| Staging | staging.namasoft.sa | release/* | on push | staging cluster |
| Production | app.namasoft.sa | tag v* | manual approval | prod cluster |
| DR | dr.namasoft.sa | tag v* | sync from prod | replicated |

## Pre-Deployment Checklist

```markdown
## Release Checklist (v1.X.Y)

### Code
- [x] All PRs merged to develop
- [x] Develop branch tests passing
- [x] CHANGELOG.md updated
- [x] Version bump in package.json
- [x] Tagged in git

### Database
- [x] Migrations reviewed
- [x] Migrations tested on staging copy of prod data
- [x] Migration rollback plan documented
- [x] Large migrations have background job alternative
- [x] Index changes have CONCURRENTLY option

### Security
- [x] Dependency audit clean (npm audit, snyk)
- [x] No secrets in code
- [x] Permissions changes reviewed
- [x] PDPL impact reviewed
- [x] ZATCA changes tested in sandbox

### Testing
- [x] Unit coverage maintained or improved
- [x] Integration tests pass on staging
- [x] E2E tests pass on staging
- [x] Smoke test plan ready
- [x] Performance test passed (no regression > 5%)

### Documentation
- [x] OpenAPI regenerated
- [x] Help articles updated for new features
- [x] Release notes drafted
- [x] Migration guide for breaking changes

### Communication
- [x] Customer notification drafted (if breaking)
- [x] Status page maintenance window scheduled
- [x] Support team briefed
- [x] Sales team briefed (if pricing affected)
```

## Deployment Runbook

### Standard Deploy (Blue-Green)

```bash
# 1. Build new image (Green)
docker build -t ghcr.io/namasoft/api:v1.5.0 .
docker push ghcr.io/namasoft/api:v1.5.0

# 2. Deploy Green to standby
kubectl set image deployment/namasoft-api-green api=ghcr.io/namasoft/api:v1.5.0
kubectl rollout status deployment/namasoft-api-green

# 3. Run DB migrations on Green's DB connection (zero-downtime ready)
kubectl exec namasoft-api-green-0 -- npx prisma migrate deploy

# 4. Smoke tests on Green (private endpoint)
npm run test:smoke -- --baseURL=https://green.internal.namasoft.sa

# 5. Switch traffic (atomic LB update)
kubectl patch service namasoft-api -p '{"spec":{"selector":{"color":"green"}}}'

# 6. Monitor for 15 min
watch -n 5 'kubectl logs -l app=namasoft-api,color=green --tail=50'

# 7. Decommission Blue (after 1 hour of stable Green)
kubectl scale deployment/namasoft-api-blue --replicas=0
```

### Rollback

```bash
# Instant rollback (LB swap back)
kubectl patch service namasoft-api -p '{"spec":{"selector":{"color":"blue"}}}'

# Or for DB schema rollback:
# 1. Tag Blue's pods as serving traffic again
# 2. Decide: keep Green schema (forward-compatible) or down-migrate
# 3. If down-migrate: run docs/db-migrations/rollback-v1.5.0.sql
# 4. Notify team + customers
```

### Canary Deploy (for risky features)

```yaml
# k8s manifest
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: namasoft-api
spec:
  http:
    - match:
        - headers:
            x-canary-bucket:
              exact: "true"
      route:
        - destination:
            host: namasoft-api-green
          weight: 100
    - route:
        - destination:
            host: namasoft-api-blue
          weight: 95
        - destination:
            host: namasoft-api-green
          weight: 5  # 5% traffic to canary
```

Increase gradually: 5% → 25% → 50% → 100% over 4 hours, watching error rates.

## Database Migration Strategy

### Zero-Downtime Pattern

```typescript
// Phase 1 (in v1.5.0): add column nullable
ALTER TABLE customer ADD COLUMN segment VARCHAR(50);
// App still works without it

// Phase 2 (in v1.5.0): backfill
UPDATE customer SET segment = 'general' WHERE segment IS NULL;
// Run as background job, batched

// Phase 3 (in v1.6.0): make NOT NULL
ALTER TABLE customer ALTER COLUMN segment SET NOT NULL;
// App now uses it
```

### Forbidden Patterns
- `DROP COLUMN` in same release as new app code
- `ALTER COLUMN TYPE` without USING clause
- `ADD CONSTRAINT NOT VALID` without VALIDATE step

### Large Table Patterns
- Use `pg_repack` for table rewrites
- `CREATE INDEX CONCURRENTLY` always
- For partitioned tables, manage retention via cron

## Smoke Test Suite

```typescript
// scripts/smoke-tests.ts (run after every deploy)
const tests = [
  { name: 'Health endpoint', url: '/api/health', expect: 200 },
  { name: 'Database connectivity', url: '/api/health/db', expect: 200 },
  { name: 'Redis connectivity', url: '/api/health/redis', expect: 200 },
  { name: 'ZATCA sidecar', url: '/api/health/zatca', expect: 200 },
  { name: 'Login page renders', url: '/login', expect: 200 },
  { name: 'Public API works', url: '/api/public/pricing', expect: 200 },
  // Authenticated tests:
  { name: 'Dashboard loads', url: '/dashboard', auth: true, expect: 200 },
  { name: 'Can list invoices', url: '/api/sales/invoices', auth: true, expect: 200 },
  { name: 'Can list customers', url: '/api/customers', auth: true, expect: 200 },
  { name: 'Trial balance generates', url: '/api/accounting/trial-balance', auth: true, expect: 200 },
];
```

## Feature Flags

**Tool:** Self-managed via `TenantFeatureFlag` table (موجود).

```typescript
// Usage
const enabled = await featureFlags.isEnabled('new-ai-cfo', { tenantId });
if (!enabled) return oldUI();
return newUI();
```

Rollout plan:
1. Enable for staff tenants (internal)
2. Enable for 1 friendly customer
3. Enable for 10% of customers
4. Enable for 50%
5. Enable for 100%
6. Remove flag from code (in next release)

## DNS & Domain Management

```
namasoft.sa              → marketing site
app.namasoft.sa          → main app (production)
staging.namasoft.sa      → staging
api.namasoft.sa          → public API gateway
{tenant}.namasoft.sa     → tenant-specific subdomain (optional)
docs.namasoft.sa         → public docs
status.namasoft.sa       → status page
```

DNS provider: Cloudflare. TTL: 5 min for app records (for fast failover).

## SSL/TLS

- Let's Encrypt for `*.namasoft.sa` (auto-renew via cert-manager)
- Custom domain SSL: customer-provided OR Let's Encrypt with DNS-01

## CDN & Caching

- **Static assets:** Cloudflare (immutable hashed assets)
- **Images:** Cloudflare Images + Next.js Image Optimization
- **API responses:** mostly uncached (multi-tenant + dynamic)
  - Exceptions: `/api/public/*` (pricing, status) → cache 5 min
- **HTML:** Server Components stream — minimal HTML cache

## Monitoring Dashboards

```
Grafana > Namasoft
├── Production overview
│   ├── Requests/sec
│   ├── Error rate
│   ├── p50/p95/p99 latency
│   ├── DB CPU + connections
│   ├── Queue depth
│   └── Active tenants
├── Per-tenant
│   ├── Tenant request volume
│   ├── Slow queries
│   └── Storage usage
├── ZATCA
│   ├── Clearance success rate
│   ├── Queue depth
│   └── Failed clearances
└── Business KPIs
    ├── Total invoices created/day
    ├── Total GMV /day
    └── Active users
```

## On-Call Rotation

- **Tier 1:** dev on-call (24×7, rotation weekly)
- **Tier 2:** senior engineer (escalation, business hours)
- **Tier 3:** CTO (P0 only)

**Tool:** PagerDuty or Opsgenie.

**Response SLO:**
- P0: 15 min ack, 4 hour resolve
- P1: 30 min ack, 8 hour resolve
- P2: 2 hour ack, 24 hour resolve

## Customer Communication

- **Maintenance windows:** announce 48h ahead via status page + email
- **Incidents:** real-time updates on status page
- **Post-mortem:** public for P0/P1 within 1 week
- **Release notes:** every release, in-app + email

## Cost Optimization

- **Right-size:** monthly review of CPU/RAM usage
- **Reserved instances:** 1-year reserved for baseline (40% savings)
- **Spot instances:** for batch workers (60% savings, restartable)
- **Storage tiering:** S3 IA after 90 days, Glacier after 1 year
- **DB autoscaling:** scale down at night for non-customer-facing
- **CDN bandwidth:** Cloudflare Pro covers most cases ($20/mo)

## Disaster Recovery

### Scenarios
1. **AZ failure** (single zone down)
   - Auto-failover via LB to other AZ
   - DB replica promoted automatically
   - RTO < 5 min
2. **Region failure** (entire region down)
   - Manual DNS switch to DR region
   - DB restored from cross-region replica
   - RTO 1 hour
3. **Database corruption**
   - Restore from point-in-time backup
   - WAL replay to just before corruption
   - RTO 30 min, RPO 5 min
4. **Ransomware**
   - All services frozen
   - Restore from offline backup
   - Investigation in isolated env
   - RTO 4 hours minimum

### Drill Schedule
- AZ failover: monthly (automated test)
- Region failover: quarterly (manual exercise)
- Full DR: annually (tabletop + execution)

