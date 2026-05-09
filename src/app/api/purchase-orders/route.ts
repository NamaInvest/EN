/**
 * Purchase Orders API Route — Full CRUD with Saga orchestration
 * ──────────────────────────────────────────────────────────────────────────
 * GET    /api/purchase-orders         — List POs with filters
 * POST   /api/purchase-orders         — Create PO via PurchaseOrderSaga
 * POST   /api/purchase-orders?action=grn — Receive goods (GRN Saga)
 * PATCH  /api/purchase-orders/:id     — Update status (approve/reject)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z }                         from 'zod';
import { getPrisma }                 from '@/lib/prisma';
import { getUserFromRequest }        from '@/lib/auth';
import { validateRequest, validateQuery, PaginationSchema, DateRangeSchema } from '@/lib/api/validate-request';
import { buildPurchaseOrderSaga, buildGRNSaga } from '@/lib/workflow/saga/purchase-sagas';
import { Decimal }                   from '@prisma/client/runtime/library';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreatePOSchema = z.object({
  supplierId:     z.number().int().positive().optional(),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  items:          z.array(z.object({
    productId:  z.number().int().positive(),
    quantity:   z.number().positive(),
    unitCost:   z.number().positive(),
    taxRate:    z.number().min(0).max(100).default(15),
  })).min(1, 'At least one item required'),
  notes:          z.string().optional(),
  branchId:       z.number().int().positive().optional(),
  requireApproval: z.boolean().default(false),
});

const GRNSchema = z.object({
  purchaseOrderId: z.number().int().positive(),
  receivedDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'receivedDate must be YYYY-MM-DD'),
  items:           z.array(z.object({
    productId:        z.number().int().positive(),
    receivedQuantity: z.number().positive(),
  })).min(1),
  stockId:         z.number().int().positive().optional(),
  notes:           z.string().optional(),
});

const POListQuerySchema = PaginationSchema.merge(DateRangeSchema).extend({
  status:     z.string().optional(),
  supplierId: z.string().optional().transform((v) => v ? parseInt(v, 10) : undefined),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const auth = getUserFromRequest(req as any);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: q, error } = validateQuery(req, POListQuerySchema);
  if (error) return error;

  try {
    const prisma   = getPrisma(req);
    const tenantId = req.headers.get('x-tenant-id') ?? 'default';

    const where: Record<string, unknown> = { tenantId };
    if (q.status)     where.status = q.status;
    if (q.supplierId) where.supplierId = q.supplierId;
    if (q.from || q.to) {
      where.date = {};
      if (q.from) (where.date as any).gte = new Date(q.from);
      if (q.to)   (where.date as any).lte = new Date(q.to);
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          details:  { include: { product: { select: { name: true, unit: true } } } },
        },
        orderBy: { id: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({ data: orders, total, page: q.page, limit: q.limit });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const auth = getUserFromRequest(req as any);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action   = req.nextUrl.searchParams.get('action');
  const tenantId = req.headers.get('x-tenant-id') ?? 'default';

  try {
    const prisma = getPrisma(req);

    // ── Create GRN ────────────────────────────────────────────────────────
    if (action === 'grn') {
      const { data, error } = await validateRequest(req, GRNSchema);
      if (error) return error;

      const saga = buildGRNSaga(prisma as any);
      const result = await saga.execute({
        tenantId,
        userId:          auth.userId,
        purchaseOrderId: data.purchaseOrderId,
        data: {
          receivedDate: data.receivedDate,
          items:        data.items,
          stockId:      data.stockId,
          notes:        data.notes,
        },
      });

      return NextResponse.json({ success: true, grnId: result.grnId }, { status: 201 });
    }

    // ── Create Purchase Order ─────────────────────────────────────────────
    const { data, error } = await validateRequest(req, CreatePOSchema);
    if (error) return error;

    const saga = buildPurchaseOrderSaga(prisma as any);
    const result = await saga.execute({
      tenantId,
      userId: auth.userId,
      data: {
        supplierId:      data.supplierId,
        date:            data.date,
        items:           data.items,
        notes:           data.notes,
        branchId:        data.branchId,
        requireApproval: data.requireApproval,
      },
    });

    return NextResponse.json({
      success:          true,
      purchaseOrderId:  result.purchaseOrderId,
      approvalRequestId: result.approvalRequestId,
      status:           data.requireApproval ? 'pending_approval' : 'approved',
    }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
