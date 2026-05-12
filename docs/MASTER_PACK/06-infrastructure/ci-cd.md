---
version: 1.0
last_updated: 2026-05-12
---

# CI/CD + Infrastructure

## البيئات

| البيئة | الغرض | الـ host |
|---|---|---|
| `local` | تطوير محلي | localhost + Postgres in Docker |
| `dev` | فرع feature | Vercel preview + DB shadow |
| `staging` | UAT | Hetzner + dedicated DB |
| `production` | عملاء فعليون | Hetzner cluster + replicated DB |
| `dr` | كارثة احتياطية | منطقة مختلفة + replicated |

## GitHub Actions Workflows

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test-unit:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: namasoft_test
        ports: [5432:5432]
        options: --health-cmd pg_isready
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/namasoft_test
      - run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/namasoft_test

  test-integration:
    runs-on: ubuntu-latest
    needs: test-unit
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
      redis:
        image: redis:7
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration

  test-e2e:
    runs-on: ubuntu-latest
    needs: test-integration
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm audit --audit-level=high
      - uses: github/codeql-action/init@v3
        with: { languages: javascript-typescript }
      - uses: github/codeql-action/analyze@v3

  zatca-sandbox-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:zatca:sandbox
        env:
          ZATCA_OTP: ${{ secrets.ZATCA_SANDBOX_OTP }}
```

### `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_ENV: staging
      - run: |
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/staging" \
            .next/ user@staging.namasoft.sa:/app/.next/
      - run: ssh user@staging.namasoft.sa "cd /app && npx prisma migrate deploy && pm2 restart all"
      - run: npm run test:smoke -- --baseURL=https://staging.namasoft.sa
```

### `.github/workflows/deploy-prod.yml`

```yaml
name: Deploy Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release tag (vX.Y.Z)'
        required: true

jobs:
  approve:
    runs-on: ubuntu-latest
    environment: production-approval
    steps: [{ run: echo "Approved by ${{ github.actor }}" }]

  deploy:
    needs: approve
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with: { ref: ${{ inputs.version }} }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build
      - name: Blue-Green deploy
        run: |
          ./scripts/blue-green-deploy.sh ${{ inputs.version }}
      - name: Smoke tests
        run: npm run test:smoke -- --baseURL=https://app.namasoft.sa
      - name: Sentry release
        run: |
          npx @sentry/cli releases new ${{ inputs.version }}
          npx @sentry/cli releases set-commits ${{ inputs.version }} --auto
          npx @sentry/cli releases finalize ${{ inputs.version }}
```

## Docker Compose (للتطوير المحلي)

```yaml
# docker-compose.yml (موجود — اقتبس)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: namasoft_dev
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports: ['5432:5432']

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  mosquitto:
    image: eclipse-mosquitto:2
    ports: ['1883:1883']
    volumes:
      - ./infrastructure/mosquitto.conf:/mosquitto/config/mosquitto.conf

  zatca-sidecar:
    build: ./infrastructure/zatca-java
    ports: ['8080:8080']

  ai-forecast:
    build: ./infrastructure/python-forecast
    ports: ['8001:8001']
    environment:
      PYTHONUNBUFFERED: 1

volumes:
  postgres-data:
```

## Kubernetes (للـ Production عند الحاجة)

```yaml
# infrastructure/k8s/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: namasoft-api
spec:
  replicas: 3
  selector: { matchLabels: { app: namasoft-api } }
  template:
    metadata: { labels: { app: namasoft-api } }
    spec:
      containers:
        - name: api
          image: ghcr.io/namasoft/api:latest
          ports: [{ containerPort: 3000 }]
          env:
            - name: DATABASE_URL
              valueFrom: { secretKeyRef: { name: db, key: url }}
            - name: REDIS_URL
              valueFrom: { secretKeyRef: { name: redis, key: url }}
          resources:
            requests: { cpu: 500m, memory: 512Mi }
            limits: { cpu: 2000m, memory: 2Gi }
          livenessProbe:
            httpGet: { path: /api/health, port: 3000 }
            initialDelaySeconds: 30
          readinessProbe:
            httpGet: { path: /api/health/ready, port: 3000 }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: namasoft-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: namasoft-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 }}
```

## Monitoring & Observability

### Stack
- **Errors:** Sentry (موجود)
- **Logs:** Pino → Logflare / Better Stack
- **Metrics:** OpenTelemetry → Prometheus
- **Tracing:** OpenTelemetry → Jaeger / Tempo
- **Dashboards:** Grafana
- **Alerts:** Grafana + PagerDuty
- **Status page:** statuspage.namasoft.sa (Atlassian or self-hosted)

### Key Metrics
- `api.request.duration_ms` per route p50/p95/p99
- `db.query.duration_ms` slow query > 100ms alert
- `journal.posted.count` per scenario
- `zatca.clearance.success_rate` < 95% alert
- `period_close.completion_time_min`
- `tenant.active_users` per tier
- `queue.depth` per queue
- `webhook.delivery.failure_rate` > 5% alert

### Sample Alert
```yaml
# alerts/zatca-failure.yml
- alert: ZATCAClearanceFailureRate
  expr: |
    sum(rate(zatca_clearance_total{status="failed"}[5m])) /
    sum(rate(zatca_clearance_total[5m])) > 0.05
  for: 10m
  labels: { severity: critical }
  annotations:
    summary: "ZATCA clearance failure rate > 5%"
    runbook: https://runbooks.namasoft.sa/zatca-down
```

## CI/CD Quality Gates

| Gate | المعيار | الإجراء عند الفشل |
|---|---|---|
| Lint | لا أخطاء | block PR |
| Typecheck | لا أخطاء | block PR |
| Unit tests | pass 100% | block PR |
| Integration tests | pass 100% | block PR |
| Coverage | ≥ 80% accounting, ≥ 70% rest | warn (block على المهم) |
| Security audit | لا high/critical | block PR |
| Bundle size | < 250KB per page initial | warn |
| Lighthouse perf | ≥ 90 mobile | warn |
| Accessibility | لا WCAG AA violations | block على الصفحات الرئيسية |

## Backup Strategy

- **Database:**
  - WAL streaming to S3 (continuous)
  - Daily snapshot to glacial storage
  - Cross-region replication
  - Weekly restore drill (automated)
  - RPO: 5 min · RTO: 30 min
- **Files:** S3 versioning + cross-region replication
- **Secrets:** Vault encrypted backup
- **Config:** Git-tracked

## Cost Tracking

- **Hetzner cluster:** ~€500/mo base
- **DB managed:** ~€200/mo (HA + backup)
- **S3 + CloudFront:** scales with usage
- **Sentry:** $80/mo team plan
- **Email (SES):** $0.10/1000
- **WhatsApp Cloud API:** $0.05/conversation
- **Anthropic Claude:** ~$0.015/1K input + $0.075/1K output (Opus)
- **OpenAI Embeddings:** $0.02/1M tokens

Budget per tenant tier:
| Tier | Infra cost | Price | Margin |
|---|---|---|---|
| Starter | 30 SAR | 199 SAR | 85% |
| Pro | 80 SAR | 499 SAR | 84% |
| Enterprise | 250 SAR | 1499 SAR | 83% |
