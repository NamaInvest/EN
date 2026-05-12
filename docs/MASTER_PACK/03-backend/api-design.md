---
version: 1.0
last_updated: 2026-05-12
---

# Backend API Design Patterns

## مبادئ التصميم

1. **REST-first**: مسارات قابلة للتنبؤ، fewest verbs
2. **Per-tenant scoping**: tenantId يُحقن في middleware
3. **Validation at boundary**: Zod على الـ request body
4. **Idempotent writes**: Idempotency-Key header للـ POST
5. **Cursor pagination**: للقوائم الكبيرة
6. **Soft delete**: deletedAt بدلاً من DELETE
7. **Audit by default**: كل write يكتب في FieldAuditLog
8. **OpenAPI generation**: كل route يُسجّل تلقائياً في OpenAPI spec

## بنية المسارات (RESTful)

```
GET    /api/{resource}              → list (paginated)
GET    /api/{resource}/{id}         → get one
POST   /api/{resource}              → create
PATCH  /api/{resource}/{id}         → partial update
PUT    /api/{resource}/{id}         → replace
DELETE /api/{resource}/{id}         → soft delete

# Sub-resources
GET    /api/{resource}/{id}/{sub}   → nested list
POST   /api/{resource}/{id}/{sub}   → nested create

# Actions (non-CRUD)
POST   /api/{resource}/{id}/{action}  → e.g. /post, /reverse, /clear-zatca
```

## نموذج API Route كامل

```typescript
// src/app/api/sales/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant, withAuth, withAudit } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

const ListSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'POSTED', 'CLEARED', 'CANCELLED']).optional(),
  customerId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
});

const CreateSchema = z.object({
  customerId: z.string(),
  invoiceDate: z.string().datetime(),
  currency: z.string().length(3).default('SAR'),
  paymentTermsId: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    qty: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    discountPct: z.number().min(0).max(100).default(0),
    vatRate: z.number().min(0).max(1).default(0.15),
    costCenterId: z.string().optional(),
    profitCenterId: z.string().optional(),
  })).min(1),
});

export const GET = withTenant(withAuth(async (req: NextRequest, { tenantId, user }) => {
  const params = ListSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  
  const items = await prisma.salesInvoice.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(params.status && { status: params.status }),
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.from && params.to && { invoiceDate: { gte: new Date(params.from), lte: new Date(params.to) } }),
      ...(params.q && { OR: [
        { code: { contains: params.q, mode: 'insensitive' } },
        { customer: { name: { contains: params.q, mode: 'insensitive' } } },
      ]}),
      ...(params.cursor && { id: { gt: params.cursor } }),
    },
    include: { customer: { select: { id: true, name: true } } },
    take: params.limit + 1,
    orderBy: { invoiceDate: 'desc' },
  });
  
  const hasMore = items.length > params.limit;
  const data = hasMore ? items.slice(0, -1) : items;
  
  return NextResponse.json({
    data,
    pagination: {
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    },
  });
}));

export const POST = withTenant(withAuth(withAudit(async (req: NextRequest, { tenantId, user }) => {
  const body = CreateSchema.parse(await req.json());
  const idempotencyKey = req.headers.get('idempotency-key');
  
  // Idempotency check
  if (idempotencyKey) {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { tenantId_key: { tenantId, key: idempotencyKey } },
    });
    if (existing) return NextResponse.json(existing.response, { status: 200 });
  }
  
  // Credit check
  await assertCustomerCreditOk(tenantId, body.customerId, computeTotal(body.lines));
  
  // Create with auto-journal
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.salesInvoice.create({
      data: {
        tenantId,
        ...body,
        createdById: user.id,
        code: await nextSequence(tx, tenantId, 'SALES_INVOICE'),
        ...computeTotals(body.lines),
        details: { create: body.lines },
      },
      include: { details: true, customer: true },
    });
    
    await postJournal(tx, {
      scenario: 'SALES_INVOICE',
      sourceDocumentId: inv.id,
      sourceDocumentType: 'SalesInvoice',
      date: inv.invoiceDate,
      lines: await buildSalesInvoiceJELines(tx, inv),
    });
    
    return inv;
  });
  
  // Async ZATCA clearance
  await zatcaQueue.add('clear', { invoiceId: invoice.id });
  
  // Save idempotency record
  if (idempotencyKey) {
    await prisma.idempotencyRecord.create({
      data: { tenantId, key: idempotencyKey, response: invoice as any },
    });
  }
  
  return NextResponse.json(invoice, { status: 201 });
})));
```

## Wrappers

```typescript
// src/lib/api-handler.ts
export function withTenant(handler: TenantedHandler) {
  return async (req: NextRequest, ctx?: any) => {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });
    return handler(req, { ...ctx, tenantId });
  };
}

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest, ctx?: any) => {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return handler(req, { ...ctx, user: session.user });
  };
}

export function withAudit(handler: any) {
  return async (req: NextRequest, ctx?: any) => {
    const start = Date.now();
    const response = await handler(req, ctx);
    await prisma.auditLog.create({
      data: {
        tenantId: ctx?.tenantId,
        userId: ctx?.user?.id,
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: Date.now() - start,
        ip: req.headers.get('x-forwarded-for'),
        ua: req.headers.get('user-agent'),
      },
    });
    return response;
  };
}

export function withRateLimit(limit: number, window: string) {
  return (handler: any) => async (req: NextRequest, ctx?: any) => {
    const key = `rl:${ctx?.tenantId ?? 'anon'}:${req.nextUrl.pathname}`;
    const ok = await rateLimiter.check(key, limit, window);
    if (!ok) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
    return handler(req, ctx);
  };
}
```

## Error Format (Problem Details RFC 7807)

```typescript
// All errors follow this shape
{
  "type": "https://namasoft.sa/errors/credit-limit-exceeded",
  "title": "تجاوز حد الائتمان",
  "status": 422,
  "detail": "العميل ABC تجاوز حد الائتمان المتاح بمبلغ 15000 SAR",
  "instance": "/api/sales/invoices",
  "context": {
    "customerId": "ABC",
    "currentBalance": 95000,
    "creditLimit": 80000,
    "requestedAmount": 30000
  }
}
```

## Standard Response Envelope

```typescript
// Single resource
{ "data": { ... } }

// List
{
  "data": [...],
  "pagination": {
    "nextCursor": "cuid_xxx",
    "hasMore": true,
    "total": null  // null for cursor; number for offset
  }
}

// Action result
{ "data": { ... }, "warnings": [...] }
```

## Versioning

- مسار افتراضي = الإصدار الحالي
- مسارات `/api/v2/...` لكسر backward compatibility
- Deprecation header للمسارات القديمة: `Sunset: Wed, 01 Jan 2027 00:00:00 GMT`

## Webhooks (Outgoing)

```typescript
// نظام إصدار webhooks
await events.on('invoice.cleared', async (inv) => {
  const subs = await prisma.webhookSubscription.findMany({
    where: { tenantId: inv.tenantId, event: 'invoice.cleared', active: true },
  });
  for (const sub of subs) {
    await webhookQueue.add('deliver', {
      subscriptionId: sub.id,
      payload: { event: 'invoice.cleared', data: inv },
    });
  }
});

// التوقيع
function signPayload(secret: string, body: string, timestamp: number): string {
  const message = `${timestamp}.${body}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// Headers على كل تسليم
// X-Namasoft-Event: invoice.cleared
// X-Namasoft-Timestamp: 1730000000
// X-Namasoft-Signature: sha256=...
```
