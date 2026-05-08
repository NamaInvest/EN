# 1️⃣5️⃣ Infrastructure / DevOps | البنية التحتية

## 🔍 الحالة الحالية

### ✅ الموجود
- Dockerfile (multi-stage Alpine, non-root)
- docker-compose.yml (PostgreSQL 15, Redis 7, web)
- Hetzner deployment موثّق في [HETZNER_DEVOPS_POSTGRES_GUIDE.md](../HETZNER_DEVOPS_POSTGRES_GUIDE.md)
- Sentry مُكوّن (server + client)
- Logger في [src/lib/logger.ts](../src/lib/logger.ts)
- Rate limiting عبر Redis

### 🔴 الفجوات الحرجة
| الفجوة | الخطورة |
|--------|--------|
| **`.env` محتمل في الريبو** | 🔴🔴🔴 |
| Secrets في docker-compose hardcoded | 🔴🔴 |
| **Ghost PostgreSQL خطر** (Unix socket 5433) | 🔴🔴 |
| لا Kubernetes/Helm | 🟡 |
| لا Terraform/IaC | 🟡 |
| لا CDN | 🟠 |
| Sentry sampling 1.0 في prod (مكلف) | 🔴 |
| لا distributed tracing | 🟠 |
| لا metrics/Prometheus | 🟠 |
| Health endpoints بدائية | 🟠 |
| `console.log` في 20+ ملف | 🟠 |
| لا load balancer | 🟡 |

---

## 🎯 الخطة التفصيلية

### المرحلة 15.1 — حرائق أمنية فورية (أسبوع)

#### 1. إزالة `.env` من Git (4 ساعات)
```bash
# Backup
cp .env .env.backup.$(date +%Y%m%d)

# Remove from history
git filter-repo --path .env --invert-paths --force

# Or BFG (أسهل)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push (تحذير لكل المطورين)
git push origin --force --all
```

#### 2. Rotate كل المفاتيح (2 ساعة)
```
- DATABASE_URL password
- JWT_SECRET
- CLERK_SECRET_KEY
- GEMINI_API_KEY
- SENTRY_DSN (لو مكشوف)
- REDIS_PASSWORD
- ZATCA_API_KEY
- WhatsApp tokens
```

#### 3. Secrets Manager (3 أيام)

##### الخيار الأبسط: Doppler
```bash
# تثبيت
curl -Ls https://cli.doppler.com/install.sh | sh

# Setup
doppler setup
doppler secrets set DATABASE_URL=...
doppler secrets set JWT_SECRET=...

# في GitHub Actions
- name: Inject secrets
  run: |
    curl -Ls https://cli.doppler.com/install.sh | sh
    doppler run -- npm run start
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

##### أو Vault (لو بنية أكبر)
```yaml
# vault-config.hcl
storage "raft" { path = "/vault/data" }
listener "tcp" { address = "0.0.0.0:8200" }
seal "awskms" { region = "eu-central-1" }
```

#### 4. إيقاف Ghost PostgreSQL (2 ساعة)
```bash
# على Hetzner
sudo systemctl stop postgresql@ghost
sudo systemctl disable postgresql@ghost
sudo apt-get remove postgresql-ghost  # لو حزمة منفصلة

# تأكد من 5432 فقط
sudo ss -tlnp | grep postgres
# يجب أن نرى فقط: 0.0.0.0:5432
```

#### 5. Sentry Sampling Fix (30 دقيقة)
```typescript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
```

#### 6. Backup Cron (4 ساعات)
```bash
# /etc/cron.d/namasoft-backup
0 2 * * * postgres pgbackrest --stanza=namasoft-prod --type=full backup
0 */6 * * * postgres pgbackrest --stanza=namasoft-prod --type=diff backup
0 3 * * * root aws s3 sync /var/lib/pgbackrest s3://namasoft-backups/$(date +\%Y\%m\%d) --delete
```

---

### المرحلة 15.2 — Health Endpoints الكاملة (3 أيام)

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks: HealthCheck[] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkZATCA(),
    checkLLMProvider(),
    checkR2Storage(),
    checkBullMQQueues(),
  ]).then(results => results.map((r, i) => ({
    name: HEALTH_CHECK_NAMES[i],
    status: r.status === 'fulfilled' ? r.value.status : 'unhealthy',
    latency: r.status === 'fulfilled' ? r.value.latency : null,
    error: r.status === 'rejected' ? r.reason.message : null,
  })));

  const overall = checks.every(c => c.status === 'healthy') ? 'healthy' :
                  checks.some(c => c.status === 'unhealthy') ? 'unhealthy' : 'degraded';

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    checks,
  }, {
    status: overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503,
  });
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  return { name: 'database', status: 'healthy', latency: performance.now() - start };
}

async function checkRedis(): Promise<HealthCheck> {
  const start = performance.now();
  await redis.ping();
  return { name: 'redis', status: 'healthy', latency: performance.now() - start };
}

async function checkZATCA(): Promise<HealthCheck> {
  const start = performance.now();
  const response = await fetch(`${process.env.ZATCA_BASE_URL}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  return {
    name: 'zatca',
    status: response.ok ? 'healthy' : 'degraded',
    latency: performance.now() - start,
  };
}

async function checkLLMProvider(): Promise<HealthCheck> {
  const start = performance.now();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  await model.generateContent('ping');
  return { name: 'llm', status: 'healthy', latency: performance.now() - start };
}
```

---

### المرحلة 15.3 — OpenTelemetry / Distributed Tracing (5 أيام)

```typescript
// src/lib/instrumentation/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'namasoft-erp',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: { Authorization: `Bearer ${process.env.OTEL_TOKEN}` },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

```typescript
// instrumentation.ts (Next.js root)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./src/lib/instrumentation/otel');
  }
}
```

---

### المرحلة 15.4 — Prometheus + Grafana (4 أيام)

```typescript
// src/lib/instrumentation/metrics.ts
import { Counter, Histogram, Gauge, register } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status', 'tenant'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const journalEntriesPosted = new Counter({
  name: 'erp_journal_entries_posted_total',
  help: 'Total journal entries posted',
  labelNames: ['tenant'],
});

export const llmTokensConsumed = new Counter({
  name: 'erp_llm_tokens_total',
  help: 'Total LLM tokens consumed',
  labelNames: ['model', 'tenant', 'prompt'],
});

export const queueJobsActive = new Gauge({
  name: 'erp_queue_jobs_active',
  help: 'Active jobs per queue',
  labelNames: ['queue'],
});

// src/app/api/metrics/route.ts
export async function GET() {
  return new Response(await register.metrics(), {
    headers: { 'Content-Type': register.contentType },
  });
}
```

```yaml
# docker-compose.observability.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ['9090:9090']

  grafana:
    image: grafana/grafana
    ports: ['3001:3000']
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
```

---

### المرحلة 15.5 — Kubernetes (اختياري — 8 أيام)

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: namasoft-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: namasoft-web
  template:
    metadata:
      labels:
        app: namasoft-web
    spec:
      containers:
      - name: web
        image: registry.namasoft.com/web:${VERSION}
        ports: [{ containerPort: 3000 }]
        envFrom:
        - secretRef: { name: namasoft-secrets }
        resources:
          requests: { memory: "512Mi", cpu: "500m" }
          limits: { memory: "2Gi", cpu: "2000m" }
        livenessProbe:
          httpGet: { path: /api/health, port: 3000 }
          periodSeconds: 30
        readinessProbe:
          httpGet: { path: /api/health, port: 3000 }
          periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: namasoft-web-hpa
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: namasoft-web }
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

---

### المرحلة 15.6 — Terraform IaC (6 أيام — اختياري)

```hcl
# terraform/main.tf
provider "hcloud" {
  token = var.hcloud_token
}

resource "hcloud_server" "namasoft_web" {
  name        = "namasoft-web-prod"
  image       = "ubuntu-22.04"
  server_type = "cx41"
  location    = "nbg1"
  ssh_keys    = [var.ssh_key_id]
  user_data   = file("cloud-init.yml")
  firewall_ids = [hcloud_firewall.web.id]
}

resource "hcloud_load_balancer" "namasoft_lb" {
  name               = "namasoft-lb-prod"
  load_balancer_type = "lb11"
  location           = "nbg1"
}

resource "hcloud_load_balancer_target" "web" {
  load_balancer_id = hcloud_load_balancer.namasoft_lb.id
  server_id        = hcloud_server.namasoft_web.id
}

resource "hcloud_firewall" "web" {
  name = "web-firewall"
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0"]
  }
}
```

---

### المرحلة 15.7 — Logger Standardization (2 أيام)

```bash
# Find and replace all console.log
# ابحث:
grep -rn "console.log" src/

# استبدلها بـ logger
import { logger } from '@/lib/logger';
- console.log('Processing invoice', invoiceId);
+ logger.info('Processing invoice', { invoiceId });
```

---

### المرحلة 15.8 — Bundle Analyzer (1 يوم)

```typescript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({/* ... */});
```

```bash
# الاستخدام
ANALYZE=true npm run build
# يفتح visualization تلقائياً
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| `.env` في Git | محتمل | لا (محفوظ في Doppler/Vault) |
| Ghost PostgreSQL | يعمل | متوقّف |
| Sentry sampling في prod | 100% | 10% |
| Health checks | بدائية | 6 dimensions |
| Distributed tracing | لا | OpenTelemetry |
| Metrics | لا | Prometheus + Grafana |
| Bundle analyzer | لا | في CI |
| `console.log` | 20+ | 0 |
| Backup automation | يدوي | pgBackRest cron |

---

## ⏱️ الجدول الزمني
- **المدة:** 30 يوم عمل
- **الفريق:** 1 DevOps + backend assistance
- **الأولوية:** 🔴🔴🔴 الأعلى (الأمن أولاً)

---

## ✅ معايير القبول
- [x] `.env` غير موجود في git history
- [x] Doppler/Vault يدير كل secrets
- [x] Ghost PostgreSQL متوقّف
- [x] Sentry sampling = 0.1 في prod
- [x] Health endpoints تغطي 6 services
- [x] OpenTelemetry traces ظاهرة
- [x] Prometheus + Grafana dashboards
- [x] لا `console.log` في src/
- [x] Bundle size analyzed
- [x] Backup يعمل + اختبار restore شهري
