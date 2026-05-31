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
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';
import { withIdempotency } from '@/lib/idempotency';

const log = logger.child({ service: 'sales-returns' });

// ── Schema ───────────────────────────────────────────────────────────────────

const ReturnDetailSchema = z.object({
  productId:   z.number().int().positive(),
  quantity:    z.number().positive(),
  unitPrice:   z.number().min(0),
  totalPrice:  z.number().min(0).optional(),
  stockId:     z.number().int().optional(),
});

const CreateSalesReturnSchema = z.object({
  originalInvoiceId: z.number().int().positive('رقم الفاتورة الأصلية مطلوب'),
  customerId:        z.number().int().optional(),
  details:           z.array(ReturnDetailSchema).min(1, 'يجب تحديد صنف واحد على الأقل'),
  reason:            z.string().min(1, 'سبب المرتجع مطلوب'),
  branchId:          z.number().int().optional(),
  destinationStockId: z.number().int().optional(),
  date:              z.string().optional(),
  taxRate:           z.number().min(0).max(1).default(0.15),
  notes:             z.string().optional(),
});

// ── GET ──────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest, tenantId: string) {
  const prisma = getPrisma(req);
  const q      = req.nextUrl.searchParams;
  const rawTake = parseInt(q.get('take') || '50', 10);
  const take = Number.isInteger(rawTake) && rawTake > 0 ? Math.min(rawTake, 200) : 50;

  const rawPage = parseInt(q.get('page') || '1', 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const from   = q.get('from');
  const to     = q.get('to');

  const where: any = { tenantId };
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

// ── POST ─────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest, auth: any, tenantId: string) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateSalesReturnSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body  = parsed.data;

  // ── Tax Group Validation ────────────────────────────────────────────
  const { validateTaxRate } = await import('@/lib/tax-validation');
  const taxValidation = await validateTaxRate(body.taxRate, tenantId, prisma);
  if (!taxValidation.valid) {
    return NextResponse.json({
      error: taxValidation.error,
      code: 'INVALID_TAX_RATE',
      allowedRates: taxValidation.allowedRates
    }, { status: 422 });
  }
  // ────────────────────────────────────────────────────────────────────

  const today = body.date || new Date().toISOString().split('T')[0];
  const returnDate = new Date(today);

  // ── Period Lock Enforcement ────────────────────────────────────────
  const { assertPeriodWritable, PeriodLockViolation } = await import('@/lib/governance/period-lock');
  const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');

  const overrideContext = buildOverrideContextFromRequest(req as any, {
      tenantId,
      actorId: String(auth?.userId || '0'),
      actorRole: auth?.role || 'USER'
  });

  try {
      await assertPeriodWritable({
          tenantId,
          postingDate: returnDate,
          operationType: 'CREATE_SALES_RETURN',
          module: 'sales',
          actor: String(auth?.userId || 'SYSTEM'),
          overrideContext
      });
  } catch (err) {
      if (err instanceof PeriodLockViolation) {
          return NextResponse.json({
              error: err.message,
              code: err.code
          }, { status: err.code === 'LOCKED' ? 409 : 422 });
      }
      throw err;
  }
  // ────────────────────────────────────────────────────────────────────

  // Verify original invoice exists for this tenant
  const originalInvoice = await prisma.salesInvoice.findFirst({
    where: { id: body.originalInvoiceId, tenantId }
  });
  if (!originalInvoice) {
    return NextResponse.json({ error: 'الفاتورة الأصلية غير موجودة' }, { status: 404 });
  }

  // Compute totals
  const subtotal = body.details.reduce((s, i) => s + (i.totalPrice ?? i.quantity * i.unitPrice), 0);
  const taxValue = Math.round(subtotal * body.taxRate * 100) / 100;
  const total    = subtotal + taxValue;

  // Get next return number
  const lastReturn = await prisma.salesReturn.findFirst({
    where: { tenantId },
    orderBy: { id: 'desc' }
  }).catch(() => null);
  const returnNo   = (lastReturn?.returnNo || 0) + 1;

  // Transaction: create return + restore stock + financial entry
  const salesReturn = await runFinancialTx(prisma, async (tx: any) => {
    const ret = await tx.salesReturn.create({
      data: {
        tenantId,
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
      const productExists = await tx.product.findFirst({
        where: { id: item.productId, tenantId }
      });
      if (!productExists) {
        throw new Error('Product not found inside tenant boundary');
      }

      await tx.product.update({
        where: { id: item.productId },
        data:  { currentStock: { increment: item.quantity } },
      });

      const stockTarget = item.stockId || body.destinationStockId;
      if (stockTarget) {
        // Upsert ProductStock inside tenant
        await (tx as any).productStock.upsert({
          where:  { productId_stockId: { productId: item.productId, stockId: stockTarget } },
          create: { tenantId, productId: item.productId, stockId: stockTarget, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
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
      const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
      await TreasuryPostingService.createTreasuryEntry(tx, {
          type: 'out',
          amount: total,
          description: `مرتجع مبيعات رقم ${returnNo}`,
          referenceType: 'salesReturn',
          referenceId: ret.id,
      }, auth?.userId || null, body.branchId || null);
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
    message:  `تم تسجيل مرتجع المبيعات #${returnNo} وترحيل القيد المحاسبي العكسي`,
  }, { status: 201 });
}

// ── Exports ──────────────────────────────────────────────────────────────────

export const GET = withRoute(
  async ({ req, tenant }) => _GET(req as any, tenant),
  { rateLimit: 'DEFAULT' }
);

export const POST = withRoute(async ({ req, auth, tenant }) => {
  const { withIdempotency } = await import('@/lib/idempotency');
  return withIdempotency(req as NextRequest, 'POST /api/sales-returns', async () => _POST(req as any, auth, tenant));
}, { rateLimit: 'FINANCIAL', module: 'sales', permission: 'add' });
