# 58 - تحسين الأداء والـ Scaling

> DB tuning + Caching + Indexing + Query optimization + Load testing

---

## 📊 Performance Targets

### Response Times (P95):
| Endpoint Type | Target |
|---|---|
| Simple GET | < 100ms |
| Complex Query | < 500ms |
| Report Generation | < 3s |
| AI Endpoints | < 5s |
| Bulk Operations | < 30s |

### Throughput:
- **API:** 1000+ req/sec
- **POS:** 100+ transactions/sec
- **DB:** 5000+ queries/sec

### Availability:
- **99.9% uptime** (8.7h/year downtime allowed)
- **99.99% target** for Phase 2

---

## 🔍 Identifying Bottlenecks

### Sources of Slowness:
1. **Database queries** (الأكثر شيوعاً)
2. **N+1 queries**
3. **Missing indexes**
4. **Heavy reports** (large data scans)
5. **Network latency** (especially with Cloudflare)
6. **AI calls** (Gemini)
7. **Large payloads** (uncompressed)
8. **Cold starts** (PM2 restart)

### Tools:
- **Prometheus metrics** (`http_request_duration_seconds`)
- **Sentry Performance** monitoring
- **PostgreSQL slow query log**
- **APM** (Application Performance Monitoring)

---

## 🗄 Database Tuning

### 1. Indexing Strategy

#### Default indexes (Prisma `@@index`):
```prisma
model SalesInvoice {
    id          Int      @id
    tenantId    String   
    customerId  Int
    invoiceDate DateTime
    status      String
    
    @@index([tenantId])
    @@index([tenantId, status])
    @@index([tenantId, customerId, invoiceDate])  // Composite
    @@index([invoiceNo])
}
```

### الـ Composite Indexes:
- أكثر فاعلية للـ filters المركبة
- Order matters: most selective first
- لكل tenant + entity, ضع index على `[tenantId, ...]`

### Custom Indexes:
```sql
-- في prisma migration:
CREATE INDEX CONCURRENTLY idx_invoice_search 
ON sales_invoice (tenant_id, customer_id, invoice_date DESC)
WHERE deleted_at IS NULL;

-- Partial indexes للحالات الشائعة:
CREATE INDEX idx_pending_invoices
ON sales_invoice (tenant_id, due_date)
WHERE status = 'POSTED' AND paid_amount < total;
```

### When to add indexes:
- ✅ Foreign keys
- ✅ Columns في WHERE clauses
- ✅ Columns في ORDER BY
- ✅ Columns في JOIN conditions
- ❌ لا تكثر — كل index له overhead في الـ writes

---

### 2. Query Optimization

#### N+1 Problem:
```typescript
// ❌ سيئ:
const orders = await prisma.order.findMany();  // 1 query
for (const order of orders) {
    order.customer = await prisma.customer.findUnique({  // N queries
        where: { id: order.customerId }
    });
}
// إجمالي: N+1 queries

// ✅ جيد:
const orders = await prisma.order.findMany({
    include: { customer: true }
});
// إجمالي: 1 query
```

#### Select only needed fields:
```typescript
// ❌ يجلب كل الحقول:
const products = await prisma.product.findMany();

// ✅ فقط الحقول المطلوبة:
const products = await prisma.product.findMany({
    select: {
        id: true,
        name: true,
        sellPrice: true
        // skip large fields: description, images, etc.
    }
});
```

#### Pagination إجبارية:
```typescript
const products = await prisma.product.findMany({
    skip: (page - 1) * 50,
    take: 50,
    orderBy: { name: 'asc' }
});
```

### Cursor-based pagination للأداء:
```typescript
// أفضل من offset للأرقام الكبيرة:
const products = await prisma.product.findMany({
    take: 50,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' }
});
```

#### Avoid `findMany` بدون filter:
```typescript
// ❌ خطر:
const all = await prisma.salesInvoice.findMany();  // قد يرجع 1M سجل!

// ✅ آمن:
const recent = await prisma.salesInvoice.findMany({
    where: { invoiceDate: { gte: subDays(new Date(), 30) } },
    take: 1000
});
```

---

### 3. Connection Pooling

#### Current Setup (`prisma.ts`):
```typescript
const dbUrl = base + '?pgbouncer=true&connection_limit=5&pool_timeout=10';
```

### Settings:
- **connection_limit:** 5 (per tenant)
- **pool_timeout:** 10 seconds
- **PgBouncer:** transaction mode

### إذا الـ load عالي:
- Scale up Postgres
- استخدم Read Replicas
- زِد الـ connection_limit (لكن احذر OOM)

---

### 4. Read Replicas (للـ Scaling)

```typescript
// Future:
function getClient(tenant, options = { read: false }) {
    const dbUrl = options.read 
        ? `${REPLICA_URL}/${tenant}_db` 
        : `${PRIMARY_URL}/${tenant}_db`;
    
    return new PrismaClient({ 
        datasources: { db: { url: dbUrl } }
    });
}

// الاستخدام:
const reports = await getPrisma(req, { read: true })
    .salesInvoice.findMany({...});
// → يقرأ من replica، الأسرع
```

### Benefits:
- ✅ تخفيف الـ load على primary
- ✅ Reports لا تؤثر على transactions
- ✅ Geographic distribution

---

## 💾 Caching Strategy

### Levels:

#### 1. Browser Cache:
- Static assets: 1 year
- API responses: no-cache
- Pages: short-lived (5 min)

#### 2. CDN Cache (Cloudflare):
- Static: 1 year + immutable
- Images: 30 days
- Fonts: 1 year

#### 3. Server-Side Cache:

**Redis (in-memory):**
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache the result:
async function getProductBalance(productId: number, tenantId: string) {
    const cacheKey = `product:${tenantId}:${productId}:balance`;
    
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    const balance = await prisma.product.findUnique({...});
    await redis.setex(cacheKey, 300, JSON.stringify(balance));  // 5 min
    
    return balance;
}

// Invalidate on update:
async function updateProductStock(productId, newStock) {
    await prisma.product.update({...});
    await redis.del(`product:${tenantId}:${productId}:balance`);
}
```

**In-Memory cache (للأشياء الثابتة):**
```typescript
const SETTINGS_CACHE = new Map();

async function getSetting(key: string) {
    if (SETTINGS_CACHE.has(key)) {
        return SETTINGS_CACHE.get(key);
    }
    
    const setting = await prisma.setting.findUnique({ where: { key } });
    SETTINGS_CACHE.set(key, setting?.value);
    
    return setting?.value;
}
```

#### 4. Database Query Cache (PostgreSQL):
- `shared_buffers = 25% of RAM`
- `effective_cache_size = 75% of RAM`
- استخدم `pg_prewarm` للجداول الحرجة

---

### Cache Invalidation Patterns:

#### Time-based (TTL):
```typescript
await redis.setex(key, 300, value);  // 5 minutes
```

#### Event-based:
```typescript
// عند تحديث المنتج:
await redis.del(`product:${tenantId}:${productId}:*`);
```

#### Tag-based:
```typescript
// invalidate all "product" caches:
const keys = await redis.keys(`product:${tenantId}:*`);
await redis.del(...keys);
```

---

## 🌐 API Performance

### 1. Response Compression:
```typescript
// next.config.ts:
compress: true,  // gzip
```

### 2. Pagination:
```typescript
const products = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit
});
```

### 3. Lazy Loading:
```typescript
// قسّم الـ data:
const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, balance: true }
});

// تحميل التفاصيل عند الطلب فقط:
const fullCustomer = await prisma.customer.findUnique({
    where: { id },
    include: { invoices: true, payments: true }
});
```

### 4. Bulk Operations:
```typescript
// ❌ One at a time:
for (const item of items) {
    await prisma.salesInvoiceDetail.create({ data: item });
}

// ✅ Bulk:
await prisma.salesInvoiceDetail.createMany({ data: items });
```

### 5. Streaming Responses:
```typescript
// للـ exports الكبيرة:
export async function GET() {
    return new Response(
        new ReadableStream({
            async start(controller) {
                for await (const chunk of fetchData()) {
                    controller.enqueue(chunk);
                }
                controller.close();
            }
        }),
        { headers: { 'Content-Type': 'text/csv' } }
    );
}
```

---

## ⚛️ Frontend Performance

### Next.js Optimizations:
- ✅ **Server Components** افتراضياً (لا client-side bundle)
- ✅ **Streaming SSR**
- ✅ **Suspense boundaries**
- ✅ **Code splitting** (per route)
- ✅ **Image optimization** (`<Image />`)
- ✅ **Font optimization** (`next/font`)
- ✅ **Bundle analysis** (`npm run analyze`)

### TanStack Query:
```typescript
// Caching automatic:
const { data } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,  // 5 min
    cacheTime: 10 * 60 * 1000  // 10 min
});
```

### Debouncing:
```typescript
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
    if (debouncedSearch) {
        searchProducts(debouncedSearch);
    }
}, [debouncedSearch]);
```

### Virtual Scrolling (للقوائم الطويلة):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// لجدول 10,000 صف، يرسم فقط visible rows
```

---

## 📈 Load Testing

### Tools:
- **k6** (modern, JS-based)
- **Apache JMeter**
- **Artillery**
- **Locust**

### مثال k6:
```javascript
import http from 'k6/http';

export const options = {
    stages: [
        { duration: '1m', target: 100 },  // ramp up
        { duration: '5m', target: 100 },  // stay
        { duration: '1m', target: 0 }     // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500']  // 95% < 500ms
    }
};

export default function() {
    const res = http.get('https://aljassim.namainvist.com/api/sales');
    check(res, {
        'status 200': r => r.status === 200,
        'duration < 500ms': r => r.timings.duration < 500
    });
}
```

### Test Scenarios:
- Normal load: 100 concurrent users
- Peak load: 500 concurrent users
- Stress test: 1000+ users
- Spike test: 0 → 1000 in 10 seconds

---

## 🚀 Scaling Strategy

### Vertical Scaling (Scale Up):
- ✅ زِد RAM
- ✅ زِد CPU
- ✅ Faster SSD
- ❌ محدود (limit per server)

### Horizontal Scaling (Scale Out):
- ✅ More app servers
- ✅ Load balancer
- ✅ Stateless app (إذا possible)
- ✅ Distributed cache (Redis)
- ✅ Shared DB أو sharded DB

### الـ Current Setup vs Future:

```
الحالي:
- 1 server (Hetzner)
- 1 PostgreSQL
- PM2 cluster mode

المخطط (Phase 3):
- Load balancer (Cloudflare)
- 3-5 app servers
- PostgreSQL primary + 2 replicas
- Redis cluster
- Multi-region (Saudi + EU)
```

---

## 🎯 Specific Optimizations

### للـ POS (Critical Path):
- ✅ Offline-first (IndexedDB)
- ✅ Pre-load products on session start
- ✅ Cache customer search results
- ✅ Optimistic UI updates
- ✅ Background ZATCA submission

### للـ Reports:
- ✅ Pre-aggregated tables (BI cube)
- ✅ Materialized views
- ✅ Cron جمع البيانات شهرياً
- ✅ Cache results للـ standard reports
- ✅ Async generation للـ heavy reports

### للـ Dashboard:
- ✅ Cache KPIs (5 min TTL)
- ✅ Lazy load widgets
- ✅ Suspense للـ async data
- ✅ Pre-fetch on hover

### للـ AI:
- ✅ Cache embeddings
- ✅ Cache common prompts
- ✅ Rate limit aggressive
- ✅ Streaming responses
- ✅ Fallback to rules

---

## 📊 Monitoring

### Metrics to Track:
- **Apdex Score** (Application Performance Index)
- **Latency** (P50, P95, P99)
- **Throughput** (RPS)
- **Error Rate**
- **CPU Usage**
- **Memory Usage**
- **DB Connections**
- **Cache Hit Rate**

### Alerts:
- Latency P95 > 1s → Warning
- Error rate > 1% → Warning
- Error rate > 5% → Critical
- CPU > 80% sustained → Scale up
- Memory > 90% → Critical
- DB connections > 80% pool → Investigate

### Dashboards:
- Grafana للـ Prometheus metrics
- Sentry للـ errors + performance
- Cloudflare Analytics للـ network

---

## 🛠 Quick Wins

### عمليات سريعة لتحسين الأداء:

1. **أضف missing indexes** (10x improvement عادة)
2. **استخدم `select`** لتقليل الـ payload
3. **Pagination** على كل قائمة
4. **Caching** للـ settings و reference data
5. **Compress responses** (gzip)
6. **CDN** للأصول الثابتة
7. **Lazy load** الـ images
8. **Background jobs** للـ heavy tasks
9. **Connection pooling** صحيح
10. **Vacuum DB** بانتظام

---

## 💰 Cost Optimization

### الـ Trade-offs:
- Performance vs Cost
- لكن: bad performance = lost customers

### Cost-Effective Optimizations:
1. ✅ Caching (free)
2. ✅ Indexing (free)
3. ✅ Query optimization (free)
4. ✅ CDN (Cloudflare free tier)
5. ✅ Postgres VACUUM (free)
6. 💰 More RAM (cheap)
7. 💰💰 Read replicas (medium cost)
8. 💰💰💰 Multi-region (expensive)
9. 💰💰💰💰 Sharding (complex + expensive)

---

## 🎯 Best Practices

1. ✅ **Measure first, optimize later**
2. ✅ **Index strategically** (not everywhere)
3. ✅ **Cache aggressively** (with invalidation)
4. ✅ **Async for heavy work** (workers)
5. ✅ **Paginate everything**
6. ✅ **Compress payloads**
7. ✅ **Monitor continuously**
8. ❌ **لا تـ over-engineer** (start simple)
9. ❌ **لا تـ optimize prematurely**
10. ✅ **User experience > metrics**
