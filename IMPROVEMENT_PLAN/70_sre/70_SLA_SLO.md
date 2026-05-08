# 70 — SLA / SLO | الالتزامات والأهداف

## 🔴 الأولوية: حرج (للـ Enterprise customers)

## 🎯 التعريفات

### SLI (Service Level Indicators)
المقاييس الفعلية:
- Availability (uptime)
- Latency (p50, p95, p99)
- Error rate
- Throughput

### SLO (Service Level Objectives)
الأهداف الداخلية:
- 99.9% uptime monthly
- p95 < 500ms
- Error rate < 0.5%

### SLA (Service Level Agreement)
الالتزامات للعميل (أقل من الـ SLO):
- 99.5% uptime (مع penalties)

## 🎯 الخطة

### 70.1 — SLO Definitions Document (3 أيام)
```yaml
slos:
  api_availability:
    target: 99.9%        # 43.2 min downtime/month
    measurement_window: 30d
    error_budget: 0.1%

  api_latency:
    target: p95 < 500ms
    measurement_window: 7d

  zatca_submission:
    target: 99.5% success
    measurement_window: 30d

  payroll_run:
    target: 99% on-time
    measurement_window: monthly
```

### 70.2 — SLA Tiers (per Plan) (3 أيام)
| Plan | Uptime | Support Response | Credits |
|------|--------|-----------------|---------|
| Starter | 99% | 24h | 5% per breach |
| Pro | 99.5% | 4h | 10% per breach |
| Enterprise | 99.9% | 1h | 25% per breach |

### 70.3 — Error Budgets (3 أيام)
- Calculate remaining budget
- Stop releases when budget exhausted
- Re-prioritize reliability work
- Dashboard for visibility

### 70.4 — Status Page (5 أيام)
- status.namasoft.com
- Auto-update from health checks
- Manual incident announcements
- Subscribe via email/SMS
- History of incidents
- Components breakdown

### 70.5 — SLI Instrumentation (5 أيام)
- Prometheus metrics
- Grafana dashboards
- Real User Monitoring (RUM)
- Synthetic monitoring (Pingdom / Uptrends)

### 70.6 — Burn Rate Alerts (3 أيام)
- Fast burn (1h budget consumed in 5 min)
- Slow burn (1d budget consumed in 6h)
- Page on-call engineer

### 70.7 — Monthly SLO Reports (3 أيام)
- Per-customer SLA report
- Internal SLO compliance
- Trends over time
- Customer-facing reliability dashboard

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Defined SLOs | لا | 5+ |
| SLO compliance | غير مقاس | > 99% |
| Status page uptime | لا | 24/7 |
| MTTR | غير مقاس | < 30 min |

## ⏱️ المدة: 25 يوم عمل
