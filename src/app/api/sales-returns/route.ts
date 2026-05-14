/**
 * Sales Returns API — Complete Implementation
 * Aligned with actual Prisma schema: SalesReturn model
 * Fields: returnNo, originalInvoiceId, customerId, subtotal, taxValue, total, userId, details[]
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute }             from '@/lib/api/with-route';
import { getPrisma }             from '@/lib/prisma';
import { z }                     from 'zod';
import { postSalesReturn }       from '@/lib/auto-journal';
import { n }                     from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';
import { withIdempotency } from '@/lib/idempotency';

const log = logger.child({ service: 'sales-returns' });

// â”€â”€ Schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ReturnDetailSchema = z.object({
  productId:   z.number().int().positive(),
  quantity:    z.number().positive(),
  unitPrice:   z.number().min(0),
  totalPrice:  z.number().min(0).optional(),
  stockId:     z.number().int().optional(),
});

const CreateSalesReturnSchema = z.object({
  originalInvoiceId: z.number().int().positive('ط±ظ‚ظ… ط§ظ„ظپط§طھظˆط±ط© ط§ظ„ط£طµظ„ظٹط© ظ…ط·ظ„ظˆط¨'),
  customerId:        z.number().int().optional(),
  details:           z.array(ReturnDetailSchema).min(1, 'ظٹط¬ط¨ طھط­ط¯ظٹط¯ طµظ†ظپ ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„'),
  reason:            z.string().min(1, 'ط³ط¨ط¨ ط§ظ„ظ…ط±طھط¬ط¹ ظ…ط·ظ„ظˆط¨'),
  branchId:          z.number().int().optional(),
  destinationStockId: z.number().int().optional(),
  date:              z.string().optional(),
  taxRate:           z.number().min(0).max(1).default(0.15),
  notes:             z.string().optional(),
});

// â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function _GET(req: NextRequest) {
  const prisma = getPrisma(req);
  const q      = req.nextUrl.searchParams;
  const take   = Math.min(parseInt(q.get('take') || '50'), 200);
  const page   = parseInt(q.get('page') || '1');
  const from   = q.get('from');
  const to     = q.get('to');

  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to)   where.date.lte = new Date(to + 'T23:59:59');
  }

  try {
    const [returns, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        take,
        skip:    (page - 1) * take,
        orderBy: { id: 'desc' },
        include: {
          details:  { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      prisma.salesReturn.count({ where }),
    ]);

    return NextResponse.json({ returns, total, page, pages: Math.ceil(total / take) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// â”€â”€ POST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function _POST(req: NextRequest, auth: any, tenantId: string) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateSalesReturnSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± طµط§ظ„ط­ط©', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body  = parsed.data;
  const today = body.date || new Date().toISOString().split('T')[0];

  // Verify original invoice exists for this tenant
  const originalInvoice = await prisma.salesInvoice.findUnique({
    where: { id: body.originalInvoiceId }
  });
  if (!originalInvoice) {
    return NextResponse.json({ error: 'الفاتورة الأصلية غير موجودة' }, { status: 404 });
  }

  // Compute totals
  const subtotal = body.details.reduce((s, i) => s + (i.totalPrice ?? i.quantity * i.unitPrice), 0);
  const taxValue = Math.round(subtotal * body.taxRate * 100) / 100;
  const total    = subtotal + taxValue;

  // Get next return number
  const lastReturn = await prisma.salesReturn.findFirst({ orderBy: { id: 'desc' } }).catch(() => null);
  const returnNo   = (lastReturn?.returnNo || 0) + 1;

  // Transaction: create return + restore stock + financial entry
  const salesReturn = await prisma.$transaction(async (tx) => {
    const ret = await tx.salesReturn.create({
      data: {
        returnNo,
        originalInvoiceId: body.originalInvoiceId,
        customerId:        body.customerId || null,
        subtotal,
        taxValue,
        total,
        userId:            auth?.userId || null,
        notes:             body.notes || null,
        destinationStockId: body.destinationStockId || null,
        branchId:          body.branchId || null,
        date:              new Date(today),
        status:            'REQUESTED',
        details: {
          create: body.details.map(item => ({
            productId:  item.productId,
            quantity:   item.quantity,
            unitPrice:  item.unitPrice,
            totalPrice: item.totalPrice ?? (item.quantity * item.unitPrice),
          })),
        },
      },
    });

    // Restore inventory for each returned item
    for (const item of body.details) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { currentStock: { increment: item.quantity } },
      });

      const stockTarget = item.stockId || body.destinationStockId;
      if (stockTarget) {
        await (tx as any).productStock.upsert({
          where:  { productId_stockId: { productId: item.productId, stockId: stockTarget } },
          create: { productId: item.productId, stockId: stockTarget, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            stockId: stockTarget,
            type: 'in',
            quantity: item.quantity,
            referenceType: 'sales_return',
            referenceId: ret.id,
            userId: auth?.userId || null,
            notes: `مرتجع مبيعات #${returnNo}`
          }
        });
      }
    }

    // Treasury entry — cash refund
    if (total > 0) {
      await tx.treasury.create({
        data: {
          type:          'out',
          amount:        total,
          description:   `مرتجع مبيعات رقم ${returnNo}`,
          referenceType: 'salesReturn',
          referenceId:   ret.id,
          userId:        auth?.userId || null,
          branchId:      body.branchId || null,
        },
      });
    }

    // Auto-Journal: عكس المبيعات
    await postSalesReturn({
      returnNo,
      total,
      taxValue,
      userId:   auth?.userId,
      branchId: body.branchId,
      date:     today,
      txClient: tx,
    });

    // TODO: ZATCA Credit Note Outbox Event
    // EventLog.create({ type: 'ZATCA_CREDIT_NOTE', referenceId: ret.id, ... })

    return ret;
  });

  return NextResponse.json({
    success:  true,
    returnId: salesReturn.id,
    returnNo,
    subtotal,
    taxValue,
    total:    Math.round(total * 100) / 100,
    message:  `طھظ… طھط³ط¬ظٹظ„ ظ…ط±طھط¬ط¹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ #${returnNo} ظˆطھط±ط­ظٹظ„ ط§ظ„ظ‚ظٹط¯ ط§ظ„ظ…ط­ط§ط³ط¨ظٹ ط§ظ„ط¹ظƒط³ظٹ`,
  }, { status: 201 });
}

// â”€â”€ Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const GET = withRoute(
  async ({ req }) => _GET(req as any),
  { rateLimit: 'DEFAULT' }
);

export const POST = withRoute(async ({ req, auth }) => {
  const { withIdempotency } = await import('@/lib/idempotency');
  const tenantId = req.headers.get('x-tenant-id') || 'public';
  return withIdempotency(req as NextRequest, 'POST /api/sales-returns', async () => _POST(req as any, auth, tenantId as string));
}, { rateLimit: 'FINANCIAL' });
