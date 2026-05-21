# D2 — Deployment Plan

## الحالة الحالية
- `BUILD_PACK/03-DEPLOYMENT_PLAN.md` (389 سطر)
- `docs/MASTER_PACK/16-deployment/` (1 ملف فقط في graphify)
- `.github/workflows/deploy.yml` نشط
- Hetzner VPS + PM2

## الفجوة
- لا runbook لكل environment
- لا rollback playbook
- لا zero-downtime migration strategy
- لا feature flags infrastructure

## 🎯 Ready Prompt

```
المهمة: deployment plan موثق + قابل للتنفيذ.

السياق:
- Hetzner production VPS
- Cloudflare DNS
- PM2 process manager
- PostgreSQL master DB + per-tenant DBs
- BullMQ workers
- يجب صفر downtime للـ deploys

المخرجات:
1) Runbooks per environment:
   docs/MASTER_PACK/16-deployment/runbooks/
   ├── dev.md (local dev setup)
   ├── staging.md (pre-prod)
   ├── production.md (live)
   └── dr.md (disaster recovery secondary site)

   كل runbook يحتوي:
   - Prerequisites + secrets list
   - Pre-deployment checks (DB migration safe? feature flags ready?)
   - Deployment steps (numbered, copy-paste ready)
   - Smoke tests post-deploy (curl scripts)
   - Cache warming sequence
   - Health check URLs
   - Rollback procedure (< 5 min)
   - Common errors + recovery

2) Migration safety:
   scripts/db-migration-safety.ts:
   - Block destructive migrations (DROP TABLE, ALTER without nullable)
   - Detect long-running migrations (> 30s on 1M rows)
   - Suggest two-phase migration pattern
   .github/workflows/ci.yml: add step that runs this on PRs

3) Feature flags:
   src/lib/feature-flags.ts:
   - Database-backed (FeatureFlag model)
   - Per-tenant, per-user, per-percentage rollout
   - Cached in memory (5min TTL)
   - usage:
     if (await isEnabled('new_payroll_engine', tenantId)) { ... }
   - Admin UI: /admin/feature-flags

4) Zero-downtime DB migrations:
   docs/MASTER_PACK/16-deployment/migration-strategy.md:
   - Pattern: expand → migrate → contract
   - Example: rename column "name" → "fullName":
     Step 1 (PR1): add fullName column (deploy)
     Step 2 (PR2): backfill + dual-write
     Step 3 (PR3): switch reads to fullName
     Step 4 (PR4): remove name column

5) Rollback playbook:
   لو deploy فشل:
   ```bash
   # Option A: Cloudflare DNS swap (< 30s)
   curl -X PATCH https://api.cloudflare.com/... \
     -d '{"content": "previous-vps-ip"}'

   # Option B: PM2 revert
   ssh prod-vps "pm2 reload all --update-env"
   git revert HEAD --no-edit
   git push  # triggers redeploy

   # Option C: DB rollback (last resort)
   ssh prod-vps "psql -d main -f /backups/$(date +%Y-%m-%d)/pre-deploy.sql"
   ```

6) DR drill schedule:
   - Monthly: tabletop exercise (no actual fail-over)
   - Quarterly: actual fail-over test (planned downtime ≤ 15 min)
   - Annually: full DR exercise (regional failover)

القيود:
- production deploy فقط بـ tag (لا direct push)
- 2 approvals required for production
- rollback must be < 5 min RTO
- DB migrations must be reversible
```

## السيناريو

PM يريد release v2.5.0 يوم الخميس 5pm:

1. **Pre-deploy**:
   - PR merged to `main`
   - Tag v2.5.0 created
   - GitHub Actions يبدأ `deploy.yml`
   - Slack notification: "🚀 v2.5.0 deploying"

2. **Deploy**:
   - Build → Test → Migrate DB (using safe migrations)
   - Deploy to **staging first**
   - Run smoke tests
   - Wait 10 min for monitoring

3. **Production**:
   - Manual approval gate (2 approvers)
   - Deploy to green VPS
   - Run smoke tests
   - Cloudflare DNS swap
   - Monitor for 1 hour

4. **If error spike**:
   - Auto-rollback (DNS swap back)
   - Telegram alert
   - Open incident ticket
   - Post-mortem next morning

5. **If success**:
   - Slack: "✅ v2.5.0 live, 0 errors"
   - Old blue VPS becomes new staging

## Data Flow

```
[Deploy pipeline]
git tag v2.5.0 → git push --tags
   ↓
GitHub Actions: .github/workflows/blue-green-deploy.yml
   ↓
Job 1: Build
   ├→ npm ci
   ├→ npm run build
   ├→ npm run typecheck
   └→ docker build -t namasoft:v2.5.0 .
   ↓
Job 2: Migrate (if needed)
   ├→ Detect schema changes
   ├→ Run scripts/db-migration-safety.ts
   ├→ If safe → apply via prisma migrate deploy
   └→ If unsafe → fail PR
   ↓
Job 3: Deploy Staging
   ├→ SSH staging VPS
   ├→ docker pull namasoft:v2.5.0
   ├→ PM2 reload
   └→ Health check
   ↓
Job 4: Smoke Tests Staging
   ├→ k6 run smoke-tests.js
   └→ Pass? continue. Fail? notify + stop.
   ↓
Job 5: Manual Approval Gate
   ├→ Slack notification with PR list
   └→ Wait for 2 approvers
   ↓
Job 6: Deploy Production (green)
   ├→ SSH green VPS
   ├→ docker pull namasoft:v2.5.0
   ├→ PM2 reload
   └→ Internal health check
   ↓
Job 7: Cloudflare DNS Swap
   ├→ curl Cloudflare API
   ├→ Update A record to green-vps-ip
   └→ Wait 30s for propagation
   ↓
Job 8: Production Smoke Tests
   ├→ Run from external location (different region)
   ├→ Critical endpoints check
   └→ If fail → ROLLBACK
   ↓
Job 9: Monitor (1 hour)
   ├→ Watch Sentry error rate
   ├→ Watch Grafana p95 latency
   ├→ If error rate > 2% → AUTO ROLLBACK
   └→ If all clear → success
   ↓
Slack: "✅ v2.5.0 live"
```

## ملفات المُنتَج

- `docs/MASTER_PACK/16-deployment/runbooks/{dev,staging,production,dr}.md`
- `docs/MASTER_PACK/16-deployment/migration-strategy.md`
- `scripts/db-migration-safety.ts`
- `src/lib/feature-flags.ts`
- `src/app/(dashboard)/admin/feature-flags/page.tsx`
- `prisma/schema.prisma` — FeatureFlag model (new)
- `scripts/rollback.sh`
- Updated `.github/workflows/blue-green-deploy.yml`
