# 9️⃣ API | الواجهات

## 🔍 الحالة الحالية

### الإحصائيات
- **661 REST endpoint** عبر 150+ موديول
- ✅ Rate limiting في [src/lib/rate-limit.ts](../src/lib/rate-limit.ts) (Redis-based)
- ✅ Webhooks (Clerk + ZATCA)

### 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| لا OpenAPI/Swagger | 🔴 |
| لا API Versioning (`/v1/`, `/v2/`) | 🟠 |
| لا Idempotency Keys في عمليات الدفع | 🔴 |
| ApiKey model موجود لكن غير مفعّل | 🟠 |
| لا OAuth 2.0 Apps | 🟡 |
| لا GraphQL | 🟡 |
| Rate Limit per IP فقط (لا per API key) | 🟠 |
| Webhooks Manager غائب (HMAC, retry, dead letter) | 🟠 |

---

## 🎯 الخطة التفصيلية

### المرحلة 9.1 — OpenAPI Auto-Gen (3 أيام)

```typescript
// src/lib/openapi/generator.ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

export const registry = new OpenAPIRegistry();

// كل route يسجّل نفسه:
// src/app/api/sales/route.ts
import { CreateInvoiceSchema, InvoiceResponseSchema } from '@/schemas/sales';

registry.registerPath({
  method: 'post',
  path: '/api/sales',
  summary: 'Create sales invoice',
  tags: ['Sales'],
  security: [{ BearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateInvoiceSchema } } },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: InvoiceResponseSchema } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
  },
});

// scripts/generate-openapi.ts
const generator = new OpenApiGeneratorV31(registry.definitions);
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: { title: 'Namasoft ERP API', version: '1.0.0' },
  servers: [{ url: 'https://api.namasoft.com' }],
});

await writeFile('public/openapi.json', JSON.stringify(document, null, 2));
```

```typescript
// src/app/api/docs/page.tsx — Swagger UI
'use client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return <SwaggerUI url="/openapi.json" />;
}
```

---

### المرحلة 9.2 — API Versioning (5 أيام)

#### إستراتيجية:
- `/api/v1/...` — الإصدار الحالي
- `/api/v2/...` — الإصدار الجديد عند الحاجة
- Backward compatibility لمدة 6 أشهر بعد إصدار v2

#### Migration:
```bash
# هيكل جديد
src/app/api/
  ├── v1/                          [الإصدار الحالي بعد النقل]
  │   ├── sales/
  │   ├── purchases/
  │   ├── accounting/
  │   └── ...
  ├── v2/                          [يُنشأ عند الحاجة]
  ├── public/                      [APIs عامة]
  ├── webhooks/
  ├── cron/
  └── health/
```

#### Redirect قديم:
```typescript
// src/middleware.ts (إضافة)
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/api/v') &&
      !PUBLIC_ROUTES.some(p => url.pathname.startsWith(p))) {
    // Redirect /api/sales → /api/v1/sales
    url.pathname = url.pathname.replace('/api/', '/api/v1/');
    return NextResponse.rewrite(url);
  }
}
```

---

### المرحلة 9.3 — Idempotency Keys (3 أيام)

```typescript
// src/lib/api/idempotency.ts
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours

export async function withIdempotency<T>(
  req: NextRequest,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const key = req.headers.get('Idempotency-Key');

  if (!key) {
    // اختياري — يمكن جعلها إلزامية للـ POST
    return await handler();
  }

  const cacheKey = `idempotency:${key}`;

  // Check if already processed
  const cached = await redis.get(cacheKey);
  if (cached) {
    const { status, body } = JSON.parse(cached);
    return NextResponse.json(body, { status, headers: { 'X-Idempotent-Replay': 'true' } });
  }

  // Lock (prevent concurrent duplicate)
  const lockKey = `${cacheKey}:lock`;
  const acquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!acquired) {
    return NextResponse.json({ error: 'IDEMPOTENCY_IN_PROGRESS' }, { status: 409 });
  }

  try {
    const result = await handler();
    const response = result instanceof NextResponse ? result : NextResponse.json(result);
    const status = response.status;
    const body = await response.clone().json();

    // Cache result
    await redis.setex(cacheKey, IDEMPOTENCY_TTL, JSON.stringify({ status, body }));

    return response;
  } finally {
    await redis.del(lockKey);
  }
}

// الاستخدام:
export async function POST(req: NextRequest) {
  return await withIdempotency(req, async () => {
    // ... your logic
  });
}
```

#### Routes تتطلب Idempotency:
- `/api/v1/sales` (إنشاء فاتورة)
- `/api/v1/finance/payments` (دفعات)
- `/api/v1/treasury/disbursements` (صرف)
- `/api/v1/payroll/run` (تشغيل رواتب)
- `/api/v1/zatca/submit` (إرسال للهيئة)

---

### المرحلة 9.4 — API Keys + Scopes (4 أيام)

```typescript
// prisma migration
model ApiKey {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  name        String
  hashedKey   String   @unique @map("hashed_key")    // bcrypt hash
  prefix      String                                 // أول 8 chars للعرض
  scopes      String[]                               // ['sales:read', 'invoices:write']
  rateLimit   Int      @default(100)                 // requests per minute
  expiresAt   DateTime? @map("expires_at")
  lastUsedAt  DateTime? @map("last_used_at")
  revokedAt   DateTime? @map("revoked_at")
  createdAt   DateTime  @default(now())
  createdBy   String

  @@index([tenantId])
  @@index([hashedKey])
  @@map("api_keys")
}

// src/lib/api/api-key-auth.ts
export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyAuth | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer nm_')) return null;

  const rawKey = auth.replace('Bearer ', '');
  const prefix = rawKey.slice(0, 11); // nm_xxxxxxxx

  const candidates = await prisma.apiKey.findMany({
    where: { prefix, revokedAt: null, expiresAt: { gt: new Date() } },
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(rawKey, candidate.hashedKey)) {
      // Update lastUsedAt async
      prisma.apiKey.update({
        where: { id: candidate.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      return {
        keyId: candidate.id,
        tenantId: candidate.tenantId,
        scopes: candidate.scopes,
        rateLimit: candidate.rateLimit,
      };
    }
  }

  return null;
}

// Scope enforcement
export function requireScope(scope: string) {
  return async (req: NextRequest) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };

    if (!auth.scopes.includes(scope) && !auth.scopes.includes('*')) {
      return { error: NextResponse.json({ error: 'INSUFFICIENT_SCOPE' }, { status: 403 }) };
    }

    return { auth };
  };
}
```

---

### المرحلة 9.5 — Webhooks Manager (5 أيام)

```typescript
// src/services/webhooks/manager.ts
export class WebhookManager {
  async send(webhook: Webhook, payload: any): Promise<void> {
    const body = JSON.stringify({
      id: cuid(),
      timestamp: new Date().toISOString(),
      event: payload.event,
      data: payload.data,
    });

    const signature = this.sign(body, webhook.secret);

    await syncQueue.add('webhook-delivery', {
      url: webhook.url,
      body,
      headers: {
        'Content-Type': 'application/json',
        'X-Namasoft-Signature': signature,
        'X-Namasoft-Event': payload.event,
      },
      webhookId: webhook.id,
      attempt: 1,
      maxAttempts: 5,
    }, {
      backoff: { type: 'exponential', delay: 5000 }, // 5s, 25s, 125s, ~10min, ~52min
    });
  }

  private sign(body: string, secret: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  }
}

// Worker
new Worker('webhook-delivery', async (job) => {
  const { url, body, headers, webhookId, attempt, maxAttempts } = job.data;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await prisma.webhookDelivery.create({
      data: { webhookId, status: 'success', attempt, statusCode: response.status },
    });
  } catch (error) {
    if (attempt < maxAttempts) {
      throw error; // Will retry via BullMQ backoff
    }

    // Dead letter
    await prisma.webhookDelivery.create({
      data: { webhookId, status: 'failed', attempt, error: error.message },
    });
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { failedDeliveries: { increment: 1 } },
    });
  }
}, { connection: redis, concurrency: 10 });
```

---

### المرحلة 9.6 — GraphQL (اختياري — 7 أيام)

```typescript
// src/app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

const typeDefs = `#graphql
  type SalesInvoice {
    id: ID!
    invoiceNo: String!
    customer: Customer!
    total: Decimal!
    status: InvoiceStatus!
  }

  type Query {
    salesInvoices(filter: InvoiceFilter, page: Int): InvoiceConnection!
  }

  type Mutation {
    createSalesInvoice(input: CreateInvoiceInput!): SalesInvoice!
  }
`;

const resolvers = {
  Query: {
    salesInvoices: async (_, { filter, page }, ctx) => {
      // ... uses SalesInvoiceService
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => buildBusinessContext(req),
});

export { handler as GET, handler as POST };
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| OpenAPI documentation | لا | 100% routes |
| API versioning | لا | v1 + plan for v2 |
| Idempotency keys | لا | 5 routes حرجة |
| ApiKey runtime | لا | كامل + scopes |
| OAuth Apps | لا | basic |
| Webhooks Manager | لا | كامل + retry |
| GraphQL | لا | optional |

---

## ⏱️ الجدول الزمني
- **المدة:** 27 يوم عمل
- **الفريق:** 1-2 backend
- **الأولوية:** 🟠 عالية (لـ integrations)

---

## ✅ معايير القبول
- [ ] OpenAPI 3.1 docs على `/api/docs`
- [ ] كل routes تحت `/api/v1/`
- [ ] Idempotency keys في 5 routes حرجة
- [ ] ApiKey مع scopes + rate limit per key
- [ ] Webhooks Manager مع HMAC + retry + dead letter
- [ ] Postman collection auto-exported
- [ ] SDK clients (TypeScript) مولّد تلقائياً
