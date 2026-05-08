# 71 — Performance Engineering | هندسة الأداء

## 🟠 الأولوية: عالي

## 🎯 الخطة

### 71.1 — Performance Budgets (3 أيام)
```yaml
budgets:
  page_size:
    initial_js: < 200kb gzipped
    initial_css: < 50kb
    images: < 500kb total

  metrics:
    LCP: < 2.5s
    INP: < 200ms
    CLS: < 0.1
    TTFB: < 600ms

  api:
    p50: < 200ms
    p95: < 500ms
    p99: < 2000ms
```

### 71.2 — Database Optimization (8 أيام)
- EXPLAIN every slow query
- Missing indexes audit
- Query plan analysis
- Connection pooling (PgBouncer)
- pg_stat_statements monitoring
- Read replicas for reports
- VACUUM / ANALYZE strategy

### 71.3 — N+1 Query Detection (4 أيام)
- Prisma logger middleware
- Detect & alert on N+1
- DataLoader pattern
- Eager loading by default

### 71.4 — Frontend Bundle Optimization (5 أيام)
- Code splitting per route
- Tree-shaking unused code
- Lazy loading
- Dynamic imports
- Minimize external scripts
- Self-host fonts
- Preload critical resources

### 71.5 — Image Optimization (3 أيام)
- WebP/AVIF
- Responsive images
- Lazy loading
- CDN delivery
- Blur placeholders
- Compress aggressively

### 71.6 — Caching Strategy (5 أيام)
**Layers:**
1. **Browser cache** — assets, immutable
2. **CDN cache** — static, images
3. **Redis cache** — API responses, sessions
4. **App cache** — in-memory (LRU)
5. **DB query cache** — PostgreSQL

```typescript
// Cache decorators
@Cache({ ttl: 300, key: ['tenantId', 'period'] })
async getCashFlow() { ... }
```

### 71.7 — API Response Optimization (4 أيام)
- Pagination (always)
- Field selection (GraphQL-style include/select)
- Compression (gzip/brotli)
- Conditional requests (ETag)
- Streaming for large responses

### 71.8 — Background Jobs Optimization (3 أيام)
- Worker concurrency tuning
- Batch processing
- Priority queues
- Backpressure handling

### 71.9 — Real User Monitoring (RUM) (4 أيام)
- Sentry Performance
- Web Vitals tracking
- Per-page metrics
- User-level segmentation
- Alerting on regressions

### 71.10 — Synthetic Monitoring (3 أيام)
- Pingdom / Uptrends / Checkly
- Critical user journeys
- Per region (Saudi, GCC, EU)
- Alert on degradation

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| LCP p75 | غير مقاس | < 2.5s |
| API p95 | غير مقاس | < 500ms |
| Bundle size | غير معلوم | < 200kb |
| Cache hit rate | غير معلوم | > 80% |
| Page load (3G) | غير مقاس | < 5s |

## ⏱️ المدة: 42 يوم عمل
