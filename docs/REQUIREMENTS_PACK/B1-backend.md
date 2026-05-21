# B1 — Backend / Logic / API

## الحالة الحالية
- 848 route.ts عبر 167 قسم
- 769 Services nodes في graphify
- لكن **25/167 = 15%** فقط من APIs تستهلك Services layer
- `withRoute` + `getPrisma` + `requireTenantId` معتمدون

## الفجوة
- 142 API module يكتب Prisma queries مباشرة في route.ts
- Business logic مبعثرة (نفس الـ logic في 3-5 routes أحياناً)
- صعوبة إعادة الاستخدام + اختبار

## 🎯 Ready Prompt

```
المهمة: تطبيق "Thin Route, Fat Service" pattern على 142 API.

السياق:
- 167 API module موجود
- 25 فقط تستخدم services layer
- src/services/<domain>/*.service.ts متاحة

المخرجات:
1) Audit script:
   scripts/audit-thin-routes.ts
   لكل route.ts:
   - هل يكتب Prisma queries مباشرة؟ (count)
   - هل يستدعي service من src/services/?
   - هل يحتوي business logic > 30 سطر؟
   Output: tmp/thin-routes-audit.csv

2) Refactoring priority:
   - High: routes تحتوي auto-journal calls (مالية حرجة)
   - High: routes متكررة (نفس logic في 3+ routes)
   - Med: routes > 100 سطر
   - Low: simple CRUD

3) Refactor pattern لكل route:
   route.ts (بعد):
   - validate input (Zod)
   - authorize (withRoute + RBAC)
   - call ONE service method
   - shape response
   - return

   services/<domain>/<entity>.service.ts (after):
   - all business logic
   - Prisma operations
   - auto-journal calls
   - audit log
   - outbox events

4) Tests per service:
   tests/services/<domain>/<entity>.test.ts
   - unit tests للـ service methods
   - integration tests مع real DB

القيود:
- لا تغيير في API contract (URL + payload + response)
- TypeScript strict — لا any
- كل service method له JSDoc كامل
```

## السيناريو

**قبل**: `src/app/api/sales/invoice/route.ts` فيه 200 سطر:
- Zod schema
- Prisma queries مباشرة (3 queries)
- auto-journal call
- VAT calc
- audit log

**بعد**:
```typescript
// route.ts (30 سطر فقط)
async function handlePost(ctx: RouteContext) {
  const parsed = CreateInvoiceSchema.safeParse(await ctx.req.json());
  if (!parsed.success) return apiError(400, parsed.error);

  const result = await SalesInvoiceService.create(ctx.prisma, {
    ...parsed.data,
    actorId: ctx.auth.userId,
    tenantId: ctx.auth.tenantId,
  });

  return NextResponse.json(result, { status: 201 });
}
export const POST = withRoute(handlePost, { roles: ['admin', 'sales_rep'] });
```

```typescript
// services/sales/invoice.service.ts (200 سطر)
export class SalesInvoiceService {
  static async create(prisma, data) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.create({...});
      await this.postJE(tx, invoice);
      await this.calculateVat(tx, invoice);
      await logAuditAction({...});
      await outbox.emit('invoice.created', invoice);
      return invoice;
    });
  }
  ...
}
```

## Data Flow

```
HTTP POST /api/sales/invoice
   ↓
[withRoute layer]
   ├→ rate-limit check
   ├→ auth.getUserFromRequest()
   ├→ tenant-guard.requireTenantId()
   └→ RBAC: ['admin', 'sales_rep']
   ↓
route.ts handlePost()
   ├→ Zod.safeParse() — input validation
   └→ SalesInvoiceService.create(prisma, payload)
   ↓
services/sales/invoice.service.ts
   ↓
prisma.$transaction(tx => { ... })
   ├→ Validate customer exists + credit limit OK
   ├→ Create invoice row
   ├→ Create invoice details rows
   ├→ Decrement stock (via InventoryService)
   ├→ Calculate VAT (via VatCalculator)
   ├→ Auto-journal.createEntry() — قيد محاسبي
   ├→ logAuditAction() — audit trail
   └→ outbox.emit('sales.invoice.created') — event
   ↓ (transaction commits)
   ↓
Return invoice to route.ts
   ↓
NextResponse.json(invoice, { status: 201 })
```

## ملفات المُنتَج

- `scripts/audit-thin-routes.ts`
- `tmp/thin-routes-audit.csv`
- `src/services/<domain>/<entity>.service.ts` × ~142 (تدريجياً)
- `tests/services/<domain>/<entity>.test.ts` × ~142
- متابعة في `docs/REFACTOR_LOG.md`
