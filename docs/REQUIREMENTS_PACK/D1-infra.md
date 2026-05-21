# D1 — Infrastructure / DevOps / CI/CD

## الحالة الحالية
- 8 workflows في `.github/workflows/`:
  ci, codeql, deploy, e2e, lighthouse, sbom, security-scan, snyk
- Hetzner VPS deployment + PM2 + Cloudflare
- لا Terraform/Pulumi IaC
- لا blue-green deploy
- لا synthetic monitoring

## الفجوة (مقابل AWS Well-Architected / GCP SRE)
- Infrastructure غير موصوفة كـ code
- لا automatic failover
- لا load testing scheduled
- لا cost monitoring

## 🎯 Ready Prompt

```
المهمة: Infrastructure as Code + CI/CD enterprise-grade.

السياق:
- Hetzner VPS @ 46.4.188.170
- Cloudflare for DNS + SSL
- PM2 process manager
- 8 GitHub workflows موجودة

المخرجات:
1) Terraform setup:
   infra/terraform/
   ├── main.tf (provider config)
   ├── hetzner.tf (server + firewall + volumes)
   ├── cloudflare.tf (DNS + WAF rules)
   ├── backups.tf (snapshot policy)
   └── variables.tf (env-specific)
   - terraform import للـ infra الموجودة
   - state في Terraform Cloud (or S3 + DynamoDB)

2) New workflows:
   .github/workflows/terraform-plan.yml:
   - on PR touching infra/terraform/**
   - terraform plan
   - comment plan on PR
   - require manual approval

   .github/workflows/blue-green-deploy.yml:
   - استبدل deploy.yml الحالي
   - deploy لـ green environment
   - smoke tests على green
   - swap blue ⇄ green في Cloudflare
   - rollback في < 30 ثانية

   .github/workflows/synthetic-monitoring.yml:
   - cron */5 * * * * (every 5 min)
   - test critical endpoints:
     POST /api/auth/login
     GET /api/health
     GET /api/accounting/trial-balance
     POST /api/sales/invoice (test tenant)
   - alert on Slack/Telegram if fail

   .github/workflows/load-test.yml:
   - on PR with label "load-test"
   - k6 load test (100 concurrent users for 5 min)
   - assert: p95 < 500ms, error rate < 1%

3) Observability stack:
   - Sentry (already configured) → enhance with custom events
   - Prometheus metrics → /api/metrics (already exists)
   - Grafana dashboard configs in infra/grafana/dashboards/
   - Loki for logs aggregation

4) Cost monitoring:
   scripts/cost-monitor.ts:
   - Hetzner API → daily server costs
   - Sentry quota usage
   - Cloudflare bandwidth
   - Gemini API token usage
   - Output: /admin/infra-costs page
   - Alert if > $X/day

5) Disaster Recovery:
   docs/MASTER_PACK/06-infrastructure/DR_PLAN.md:
   - RPO: 1 hour (hourly DB snapshots)
   - RTO: 30 minutes (terraform apply on new VPS)
   - Drill schedule: monthly tabletop, quarterly fail-over
   - Runbook: docs/MASTER_PACK/06-infrastructure/dr-runbook.md

القيود:
- لا breaking changes في الـ infra الحية
- terraform import يُختبر في staging أولاً
- secrets في GitHub Secrets (لا commit ever)
```

## السيناريو

سيرفر الإنتاج يفشل فجأة الساعة 3 صباحاً:

1. **Synthetic monitoring** يكتشف الفشل خلال 5 دقائق
2. **Telegram bot** يرسل alert للـ ops
3. **Cloudflare** يلاحظ failed health checks → يحوّل DNS لـ failover VPS (green env)
4. **Ops يستيقظ** ويفتح Grafana → يحدد السبب (out of memory)
5. **Terraform**:
   ```bash
   cd infra/terraform
   terraform apply -var server_size=cx41  # upgrade
   ```
6. 10 دقائق: VPS جديد جاهز
7. Cloudflare يحوّل DNS مرة ثانية → نعود لـ blue env
8. **Total downtime: 5 دقائق** (because green absorbed it)

## Data Flow

```
[Deploy flow — blue/green]
git push tag v1.2.3
   ↓
.github/workflows/blue-green-deploy.yml
   ↓
Build Docker image
   ↓
Push to registry
   ↓
SSH to green VPS:
   - pull new image
   - migrate DB (if needed)
   - PM2 reload
   ↓
Smoke tests on green:
   curl green.namainvest.com/api/health
   ↓
If pass:
   Cloudflare API: switch DNS green ⇄ blue
   ↓
Watch error rates for 10 min
   ↓
If error rate > 2%:
   ROLLBACK: switch DNS back to blue
Else:
   green becomes new blue
   old blue ready for next deploy

[Monitoring flow]
Every 5 min cron
   ↓
.github/workflows/synthetic-monitoring.yml
   ↓
Run k6 script: test 8 critical endpoints
   ↓
Each endpoint:
   - status = 200
   - latency < 500ms
   - response shape correct
   ↓
On failure:
   POST to Telegram bot API
   {"text": "🚨 /api/auth/login DOWN - latency 5000ms"}
   ↓
Ops on-call receives + investigates

[Cost flow]
Daily cron @ 06:00 UTC
   ↓
scripts/cost-monitor.ts
   ├→ Hetzner API: server costs
   ├→ Cloudflare API: bandwidth used
   ├→ Sentry API: errors quota
   ├→ Gemini logs: tokens × $0.50/1M
   └→ Aggregate → InfraCostDaily table
   ↓
/admin/infra-costs page:
   - 30-day trend chart
   - alert if Gemini > $50/day
   - alert if total > $200/day
```

## ملفات المُنتَج

- `infra/terraform/{main,hetzner,cloudflare,backups,variables}.tf`
- `.github/workflows/terraform-plan.yml`
- `.github/workflows/blue-green-deploy.yml` (replaces deploy.yml)
- `.github/workflows/synthetic-monitoring.yml`
- `.github/workflows/load-test.yml`
- `infra/grafana/dashboards/*.json`
- `scripts/cost-monitor.ts`
- `docs/MASTER_PACK/06-infrastructure/DR_PLAN.md`
- `docs/MASTER_PACK/06-infrastructure/dr-runbook.md`
