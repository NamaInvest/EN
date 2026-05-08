# 03 — Deployment Plan
**Targets:** Hetzner (production), Local (Electron desktop), PWA (mobile/offline)

---

## 1. Environments

| Env | Purpose | Hosting | DB |
|-----|---------|---------|-----|
| dev | Engineer local | localhost:3000 | local Postgres |
| staging | QA + Demo | staging.namasoft.sa (Hetzner) | dedicated PG |
| prod | Live customers | app.namasoft.sa (Hetzner cluster) | dedicated PG cluster |
| dr | Disaster recovery | Helsinki Hetzner | replica |

---

## 2. Production Architecture (Hetzner)

```
                    ┌─────────────────────┐
                    │   Cloudflare WAF    │
                    │   + CDN + DDoS      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Hetzner LB (HA)    │
                    │  TLS 1.3 termination│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼────┐ ┌────────▼─────┐ ┌───────▼──────┐
    │ App Server 1 │ │ App Server 2 │ │ App Server 3 │
    │ Next.js+PM2  │ │ Next.js+PM2  │ │ Next.js+PM2  │
    │ CPX31        │ │ CPX31        │ │ CPX31        │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
   ┌────────▼────────┐ ┌───▼────┐ ┌───────▼─────────┐
   │ Master PG (HA)  │ │ Redis  │ │ S3 Object Store │
   │ Master DB       │ │ Cluster│ │ (Hetzner / R2)  │
   │ + Tenant DBs    │ │        │ │                 │
   │ pgBouncer       │ │        │ │                 │
   └─────────────────┘ └────────┘ └─────────────────┘
            │
   ┌────────▼─────────────────────────────────┐
   │     Background Workers (BullMQ)           │
   │   - Cron jobs (provisions, FX, ZATCA)     │
   │   - Webhooks                              │
   │   - Reports generation                    │
   │   - AI tasks                              │
   └───────────────────────────────────────────┘
```

---

## 3. Server Specifications

### 3.1 App Servers (×3 minimum, scale horizontally)
- **Type:** Hetzner CPX31 (4 vCPU, 8GB RAM, 240GB NVMe)
- **OS:** Ubuntu 24.04 LTS
- **Stack:** Node.js 22 LTS + PM2 cluster mode
- **Concurrent requests target:** 200/server

### 3.2 Database
- **Primary:** Hetzner Dedicated AX52 (16 cores, 128GB RAM, 2× 1TB NVMe RAID 1)
- **Replica:** Same spec, streaming replication
- **PgBouncer:** transaction mode, pool 100 per app

### 3.3 Redis
- **Cluster:** 3-node, sentinel for HA
- **Type:** Hetzner CX21 (3 vCPU, 4GB RAM)

### 3.4 Workers
- **Type:** Hetzner CPX21 (3 vCPU, 4GB RAM)
- **Count:** 2 (scale per queue depth)

### 3.5 Monitoring
- **Stack:** Prometheus + Grafana + Loki + Alertmanager
- **Server:** Hetzner CPX21
- **Retention:** 30d metrics, 90d logs (then S3 cold)

### 3.6 Backups
- **Strategy:** WAL archiving + daily logical dump
- **Target:** Hetzner Object Storage Helsinki + AWS S3 Glacier (offsite)

---

## 4. Containerization

### 4.1 Docker Images
- `namasoft/web` — Next.js app
- `namasoft/worker` — Background jobs
- `namasoft/migrator` — Prisma migrations runner

### 4.2 Dockerfile Pattern
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Runtime
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./
USER app
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### 4.3 docker-compose.yml (existing — extended)
```yaml
version: '3.9'
services:
  web:
    image: namasoft/web:latest
    ports: ["3000:3000"]
    env_file: .env.production
    depends_on: [postgres, redis]
    restart: always
    deploy:
      replicas: 3

  worker:
    image: namasoft/worker:latest
    env_file: .env.production
    depends_on: [postgres, redis]
    restart: always
    deploy:
      replicas: 2

  postgres:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    command: redis-server --requirepass ${REDIS_PASSWORD}

  pgbouncer:
    image: edoburu/pgbouncer
    environment:
      DATABASE_URL: postgres://...
      POOL_MODE: transaction

  monitoring:
    image: grafana/grafana
    ports: ["3001:3000"]

volumes:
  pgdata:
  redisdata:
```

---

## 5. Deployment Workflow

### 5.1 Branch Strategy
- `main` → production (protected, requires PR + reviews + tests)
- `develop` → staging (auto-deploy on merge)
- `feature/*` → PR to develop
- `hotfix/*` → PR to main (urgent)

### 5.2 CI Pipeline (GitHub Actions)
```
PR opened → 
  1. Lint (ESLint + Prettier)
  2. Type check (tsc --noEmit)
  3. Test (Vitest + coverage ≥ 80%)
  4. Build (next build)
  5. Security scan (Snyk + Trivy)
  6. SBOM
  7. Preview deploy to ephemeral env
  8. E2E (Playwright on preview)
  9. Tenant-leak test
  10. Block merge if any fail
```

### 5.3 CD Pipeline
```
Merge to main →
  1. Build production Docker image
  2. Push to registry (Hetzner / GHCR)
  3. Run Prisma migrations on staging copy first (dry-run)
  4. Deploy staging → smoke test
  5. Manual approval gate
  6. Deploy prod (rolling: 1 server at a time)
  7. Health check after each
  8. Auto-rollback if 3 consecutive 5xx in 60s
  9. Notify Slack + email
```

### 5.4 Database Migrations
- **Forward-only** (no destructive in same release)
- **Backward-compatible** (old code can read new schema for one release)
- **Multi-step destructive:** add column → deploy → backfill → deploy reading new → drop old → deploy
- Run via `prisma migrate deploy` in `migrator` container before app rollout
- Per-tenant: orchestrate via script that iterates tenants

---

## 6. Disaster Recovery

### 6.1 RTO / RPO Targets
- **RTO:** 4 hours (full restore)
- **RPO:** 15 minutes (WAL streaming)

### 6.2 DR Site
- **Location:** Hetzner Helsinki
- **Sync:** continuous WAL streaming + daily logical dump
- **Failover:** manual decision (avoid split-brain)
- **Test:** quarterly DR drill

### 6.3 Backup Schedule
| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| WAL | Continuous | 7 days | S3 hot |
| Logical dump per-tenant | Daily 03:00 | 30 days | S3 hot |
| Logical dump per-tenant | Monthly | 12 months | S3 cold |
| Logical dump per-tenant | Yearly | 7 years | S3 glacier |
| App config / secrets | On change | Always | Vault snapshot |

### 6.4 Restore Test
- Weekly: random tenant restore to staging, verify count + checksum
- Quarterly: full disaster simulation

---

## 7. Electron Desktop Build

### 7.1 Targets
- Windows 10/11 x64 (NSIS installer + MSI for enterprise)
- macOS 12+ (DMG, signed + notarized)
- Linux (AppImage, deb, rpm)

### 7.2 Configuration
- See `electron-builder.yml`
- Bundles local cache + offline POS data
- Auto-updater via `electron-updater` (signed manifests)

### 7.3 Code Signing
- Windows: EV Code Signing Certificate (DigiCert / Sectigo)
- macOS: Apple Developer ID + notarization
- Linux: GPG signing for repos

### 7.4 Distribution
- Direct download from app.namasoft.sa/download
- Auto-update server on Hetzner

---

## 8. PWA (Mobile + Offline)

### 8.1 Service Worker
- Cache: shell + critical assets
- Strategy: stale-while-revalidate for catalog, network-first for transactions
- IndexedDB for offline POS sales (sync on reconnect)

### 8.2 Manifest
- Already exists at `public/manifest.json`
- Icons 192/512
- Theme color matches design system

### 8.3 Install
- A2HS prompt on second visit
- Splash screens per platform

---

## 9. Tenant Provisioning Workflow

```
New customer signs up →
  1. Stripe payment confirmed
  2. POST /api/master/tenants/create
     ↓
  3. Create DB: namasoft_tenant_<slug>
  4. Run prisma migrate deploy (target this DB)
  5. Seed:
     - SOCPA Chart of Accounts
     - Default Settings (currency=SAR, country=SA, tax=15%)
     - Default Roles (Owner, CFO, Accountant, etc.)
     - Owner user (invited by email)
     - Default fiscal year (current year, Hijri + Gregorian)
     - Default numbering sequences
  6. Update Master DB: tenants record
  7. Send welcome email + onboarding video
  8. Redirect to wizard
```

Time target: < 5 minutes end-to-end.

---

## 10. Monitoring & Alerting

### 10.1 Metrics
- App: req/sec, latency p50/p95/p99, error rate, active users
- DB: connections, slow queries, replication lag, disk
- Cache: hit rate, memory
- Workers: queue depth, job duration, fail rate
- Business: invoices/hour, payments/hour, ZATCA submissions

### 10.2 Logs
- App stdout → Loki
- DB slow log → Loki
- nginx/LB → Loki
- Audit events → Loki + cold S3 (compliance)

### 10.3 Alerting (Alertmanager → PagerDuty + Slack)
- 5xx rate > 1% for 5 min → P1
- p99 latency > 2s for 10 min → P2
- DB connections > 90% → P2
- Disk > 85% → P2
- Replication lag > 60s → P2
- ZATCA failure → P1
- Backup fail → P2
- Worker queue > 1000 → P3

---

## 11. Performance Targets

| Metric | Target |
|--------|--------|
| API latency p95 | < 300ms |
| Page load LCP | < 2s |
| Time to interactive | < 3s |
| POS scan-to-print | < 1s |
| ZATCA clearance roundtrip | < 5s |
| Report generation < 1MB | < 3s |
| Backup time | < 30 min |
| Restore time | < 60 min |

---

## 12. Cost Estimate (Production Steady State)

| Component | Monthly EUR |
|-----------|-------------|
| 3× CPX31 app servers | 60 |
| 1× AX52 dedicated DB | 110 |
| 1× AX52 DR DB | 110 |
| 3× CX21 Redis | 18 |
| 2× CPX21 workers | 24 |
| 1× CPX21 monitoring | 12 |
| Object storage 1TB | 10 |
| Bandwidth 10TB | included |
| Cloudflare Pro | 20 |
| Sentry team | 26 |
| Misc + buffer | 50 |
| **Total** | **~440 EUR/month (~1800 SAR)** |

Per-tenant cost @ 100 tenants: ~18 SAR/month infra. Margin healthy.

---

## 13. Rollback Plan

### 13.1 App-only
- `pm2 restart` previous version
- Rolling rollback over 5 minutes
- Database migrations: forward-only, so reverse via separate migration if needed

### 13.2 Schema
- Always keep "expand-and-contract" pattern
- Last 3 versions can read both old + new schema
- Emergency: restore from latest backup to read-only replica + read manually

### 13.3 Data
- Soft-delete by default (recoverable)
- Hard-delete only via admin tool with confirmation + backup snapshot
