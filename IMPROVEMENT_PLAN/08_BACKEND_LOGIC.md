# 8️⃣ Backend / Logic | المنطق الخلفي

## 🔍 الحالة الحالية

### الإحصائيات
- **661 API route** عبر 150+ موديول
- **439 routes** تستخدم `getPrisma(req)` (66%)
- **297 routes بدون auth** (45%)
- **650 routes بدون Zod validation** (98%)
- **25 routes** تستخدم `auto-journal.ts` (3.8% — أقل من المطلوب بكثير)

### 🔴 الفجوات الحرجة
| الفجوة | الخطورة |
|--------|--------|
| المنطق مبعثر بين routes و lib (لا Service Layer) | 🔴 |
| 297 route بدون auth | 🔴🔴🔴 |
| 650 route بدون input validation | 🔴🔴 |
| auto-journal لم يُغطّي 96% من الـ routes المالية | 🔴🔴 |
| لا Domain Events منشورة | 🟠 |
| RBAC في UI فقط، ليس في API | 🔴 |
| Cron + Webhooks بدون tenantId واضح | 🟠 |

---

## 🎯 الخطة التفصيلية

### البنية المقترحة (Service Layer Pattern)
```
src/services/
  ├── accounting/
  │   ├── journal.service.ts            [إنشاء/تعديل قيود]
  │   ├── period-close.service.ts
  │   ├── reports.service.ts            [P&L, BS, Cash Flow]
  │   ├── chart-of-accounts.service.ts
  │   ├── currency.service.ts           [FX revaluation]
  │   └── budget.service.ts
  ├── sales/
  │   ├── invoice.service.ts
  │   ├── delivery.service.ts
  │   ├── credit-note.service.ts
  │   ├── customer.service.ts
  │   └── pricing.service.ts
  ├── purchases/
  │   ├── invoice.service.ts
  │   ├── purchase-order.service.ts
  │   ├── grn.service.ts
  │   ├── three-way-match.service.ts
  │   └── vendor.service.ts
  ├── inventory/
  │   ├── stock.service.ts
  │   ├── valuation.service.ts          [FIFO/LIFO/WAC]
  │   ├── stocktake.service.ts
  │   └── transfer.service.ts
  ├── manufacturing/
  │   ├── bom.service.ts
  │   ├── work-order.service.ts
  │   ├── mrp.service.ts
  │   └── quality.service.ts
  ├── hr/
  │   ├── employee.service.ts
  │   ├── attendance.service.ts
  │   └── leave.service.ts
  ├── payroll/
  │   ├── payroll-run.service.ts
  │   ├── gosi.service.ts
  │   ├── eos.service.ts
  │   └── wps.service.ts
  ├── finance/
  │   ├── treasury.service.ts
  │   ├── bank-recon.service.ts
  │   ├── cheque.service.ts
  │   └── lc.service.ts                 [Letter of Credit]
  ├── zatca/
  │   ├── e-invoice.service.ts
  │   ├── signing.service.ts
  │   └── clearance.service.ts
  └── shared/
      ├── audit.service.ts              [FieldAuditTrail wrapper]
      ├── notification.service.ts       [Email + WhatsApp + Telegram]
      ├── numbering.service.ts          [NumberSequence]
      ├── permission.service.ts
      └── event-bus.service.ts          [Domain events]
```

---

## 📝 Service Pattern Example

```typescript
// src/services/sales/invoice.service.ts
import { Decimal } from '@prisma/client/runtime/library';

export class SalesInvoiceService {
  constructor(
    private prisma: PrismaClient,
    private ctx: BusinessContext,
    private journalService: JournalService,
    private inventoryService: InventoryService,
    private numberingService: NumberingService,
    private auditService: AuditService,
    private eventBus: EventBus
  ) {}

  async create(input: CreateInvoiceInput): Promise<SalesInvoice> {
    // 1. Validate (already done by route)
    // 2. Permission check
    this.ctx.requirePermission('sales:invoice:create');

    // 3. Period check
    if (this.ctx.fiscal.isClosed) {
      throw new BusinessError('FISCAL_PERIOD_CLOSED');
    }

    // 4. Execute in transaction
    return await this.prisma.$transaction(async (tx) => {
      // 4.1 Generate invoice number
      const invoiceNo = await this.numberingService.next('SI', { tx });

      // 4.2 Calculate totals (server-side, never trust client)
      const totals = this.calculateTotals(input.items);

      // 4.3 Validate inventory availability
      await this.inventoryService.validateAvailability(input.items, { tx });

      // 4.4 Create invoice
      const invoice = await tx.salesInvoice.create({
        data: {
          tenantId: this.ctx.tenant.id,
          invoiceNo,
          customerId: input.customerId,
          branchId: this.ctx.branch.id,
          date: input.date,
          subtotal: new Decimal(totals.subtotal),
          discountValue: new Decimal(totals.discount),
          taxValue: new Decimal(totals.tax),
          total: new Decimal(totals.total),
          status: 'draft',
          createdBy: this.ctx.user.id,
          details: {
            create: input.items.map(item => ({
              productId: item.productId,
              quantity: new Decimal(item.quantity),
              price: new Decimal(item.price),
              discountValue: new Decimal(item.discount || 0),
              taxRate: new Decimal(item.taxRate),
              total: new Decimal(item.total),
            })),
          },
        },
        include: { details: true },
      });

      // 4.5 Reduce inventory
      await this.inventoryService.reduce(invoice.details, { tx, refType: 'sales_invoice', refId: invoice.id });

      // 4.6 Post journal entry (auto-journal)
      const je = await this.journalService.postSalesInvoice(invoice, { tx });

      // 4.7 Audit
      await this.auditService.log({
        tableName: 'sales_invoice',
        recordId: invoice.id,
        action: 'CREATE',
        diff: invoice,
        tx,
      });

      // 4.8 Publish domain event (after commit)
      this.eventBus.afterCommit('sales.invoice.created', {
        invoiceId: invoice.id,
        tenantId: this.ctx.tenant.id,
        amount: invoice.total,
        customerId: invoice.customerId,
      });

      return invoice;
    });
  }

  async post(invoiceId: string): Promise<void> {
    return await this.prisma.$transaction(async (tx) => {
      const invoice = await this.findOrFail(invoiceId, { tx });
      this.stateMachine.transition(invoice, 'draft', 'posted', 'POST');

      // Update + emit
      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: { status: 'posted', postedAt: new Date(), postedBy: this.ctx.user.id },
      });

      // Submit to ZATCA
      this.eventBus.afterCommit('sales.invoice.posted', { invoiceId });
    });
  }

  private calculateTotals(items: InvoiceItemInput[]): InvoiceTotals {
    // كل الحسابات في الـ server — لا تثق في الـ client
    let subtotal = new Decimal(0);
    let discount = new Decimal(0);
    let tax = new Decimal(0);

    for (const item of items) {
      const itemSubtotal = new Decimal(item.quantity).mul(item.price);
      const itemDiscount = new Decimal(item.discount || 0);
      const afterDiscount = itemSubtotal.sub(itemDiscount);
      const itemTax = afterDiscount.mul(item.taxRate || 0).div(100);

      subtotal = subtotal.add(itemSubtotal);
      discount = discount.add(itemDiscount);
      tax = tax.add(itemTax);
    }

    return {
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      tax: tax.toString(),
      total: subtotal.sub(discount).add(tax).toString(),
    };
  }
}
```

---

## 🔐 Auth Middleware

```typescript
// src/middleware.ts
import { authMiddleware } from '@clerk/nextjs/server';

const PUBLIC_ROUTES = [
  '/api/health',
  '/api/webhooks/clerk',
  '/api/webhooks/zatca',
  '/api/public/menu',
  '/api/public/call-waiter',
  '/api/auth/(.*)',
];

const CRON_ROUTES = [
  '/api/cron/(.*)',  // محمي بـ CRON_SECRET header
];

export default authMiddleware({
  publicRoutes: PUBLIC_ROUTES,

  beforeAuth: (req) => {
    // Check cron secret
    if (req.url.includes('/api/cron/')) {
      const secret = req.headers.get('x-cron-secret');
      if (secret !== process.env.CRON_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }
  },

  afterAuth: (auth, req) => {
    if (!auth.userId && !auth.isPublicRoute) {
      return Response.redirect(new URL('/sign-in', req.url));
    }

    // Inject tenant + user headers for downstream
    const headers = new Headers(req.headers);
    headers.set('x-tenant-id', auth.sessionClaims?.tenantId || 'default');
    headers.set('x-user-id', auth.userId || 'anonymous');

    return NextResponse.next({ request: { headers } });
  },
});

export const config = {
  matcher: ['/((?!.*\\.|_next).*)', '/(api|trpc)(.*)'],
};
```

---

## ✅ Validation Helper

```typescript
// src/lib/api/validate-request.ts
export async function validateRequest<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            issues: error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }),
    };
  }
}

// الاستخدام:
export async function POST(req: NextRequest) {
  const ctx = await buildBusinessContext(req);
  const { data, error } = await validateRequest(req, CreateInvoiceSchema);
  if (error) return error;

  const service = new SalesInvoiceService(getPrisma(ctx.tenant.id), ctx, /* deps */);
  const invoice = await service.create(data);
  return NextResponse.json(invoice, { status: 201 });
}
```

---

## 📡 Domain Events Bus

```typescript
// src/services/shared/event-bus.service.ts
type EventHandler<T = any> = (payload: T, ctx: BusinessContext) => Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private pendingEvents: { name: string; payload: any }[] = [];

  on<T>(eventName: string, handler: EventHandler<T>) {
    const list = this.handlers.get(eventName) || [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  // Publish immediately (use with caution inside transactions)
  async publish(eventName: string, payload: any, ctx: BusinessContext) {
    const handlers = this.handlers.get(eventName) || [];
    await Promise.allSettled(handlers.map(h => h(payload, ctx)));
  }

  // Queue event to be published after transaction commits
  afterCommit(eventName: string, payload: any) {
    this.pendingEvents.push({ name: eventName, payload });
  }

  async flush(ctx: BusinessContext) {
    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const { name, payload } of events) {
      // Publish via BullMQ for reliability
      await syncQueue.add('domain-event', { name, payload, tenantId: ctx.tenant.id });
    }
  }
}

// مثال handlers
eventBus.on('sales.invoice.posted', async (payload, ctx) => {
  await zatcaService.submit(payload.invoiceId, ctx);
});

eventBus.on('sales.invoice.posted', async (payload, ctx) => {
  await notificationService.notifyCustomer(payload.invoiceId, ctx);
});
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Service Layer | 0% | 100% |
| Routes بدون auth | 297 | 0 |
| Routes بدون Zod | 650 | 0 |
| auto-journal coverage | 3.8% | 100% |
| Domain Events | 0 | 25+ |
| RBAC في API | لا | كامل |
| Calculations server-side | جزئي | 100% |

---

## ⏱️ الجدول الزمني
- **المدة:** 35 يوم عمل
- **الفريق:** 3 backend
- **الأولوية:** 🔴 عالية (الأهم في المشروع)

---

## ✅ معايير القبول
- [ ] كل route يستخدم Service (لا منطق في الـ route نفسه)
- [ ] كل route محمي بـ auth أو في public allowlist
- [ ] كل route يستخدم `validateRequest()` بـ Zod
- [ ] كل عملية مالية تستدعي `auto-journal`
- [ ] EventBus يبث 25+ event
- [ ] Permission checks في Service Layer
- [ ] جميع الحسابات في الخادم (لا في الـ client)
- [ ] Tests > 80% coverage للـ services
