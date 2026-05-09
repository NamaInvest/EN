/**
 * Manufacturing API — Complete Production Orders Management
 * 
 * GET  /api/manufacturing        — List orders
 * POST /api/manufacturing        — Create order
 * PUT  /api/manufacturing        — Update order status (start/complete/cancel)
 *      ?action=complete          — Close order + postManufacturingCompletion
 *      ?action=issue-materials   — Issue BOM materials to WIP + postMaterialIssueToWIP
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute }               from '@/lib/api/with-route';
import { getPrisma }               from '@/lib/prisma';
import { z }                       from 'zod';
import { postManufacturingCompletion, postMaterialIssueToWIP } from '@/lib/auto-journal';
import { n }                       from '@/lib/decimal-utils';

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateOrderSchema = z.object({
  recipeId:           z.number().int().positive('recipeId مطلوب'),
  quantityToProduce:  z.number().positive('الكمية يجب أن تكون موجبة'),
  plannedStartDate:   z.string().optional(),
  plannedEndDate:     z.string().optional(),
  priority:           z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  notes:              z.string().optional(),
  branchId:           z.number().int().optional(),
});

const UpdateOrderSchema = z.object({
  orderId:       z.number().int().positive('orderId مطلوب'),
  action:        z.enum(['start', 'complete', 'cancel', 'pause', 'issue-materials']),
  actualCost:    z.number().optional(),
  completedQty:  z.number().optional(),
  notes:         z.string().optional(),
});

// ── GET ───────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const prisma = getPrisma(req);
  const q      = req.nextUrl.searchParams;
  const status = q.get('status');
  const take   = Math.min(parseInt(q.get('take') || '50'), 200);
  const page   = parseInt(q.get('page') || '1');

  const where: any = {};
  if (status) where.status = status;

  try {
    const [orders, total] = await Promise.all([
      prisma.manufacturingOrder.findMany({
        where,
        take,
        skip:    (page - 1) * take,
        orderBy: { id: 'desc' },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: { rawProduct: { select: { id: true, name: true, currentStock: true } } }
              }
            }
          }
        }
      }),
      prisma.manufacturingOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / take) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Get recipe to compute standard cost
  const recipe = await prisma.recipe.findUnique({
    where:   { id: body.recipeId },
    include: { ingredients: { include: { rawProduct: true } } }
  }).catch(() => null);

  if (!recipe) {
    return NextResponse.json({ error: 'الوصفة غير موجودة' }, { status: 404 });
  }

  // Compute standard cost = sum(ingredient.quantity × product.costPrice × qtyToProduce)
  const standardCost = recipe.ingredients.reduce((sum: number, ing: any) => {
    const unitCost = n(ing.rawProduct?.costPrice) || n(ing.rawProduct?.price) || 0;
    return sum + (n(ing.quantity) * unitCost * body.quantityToProduce);
  }, 0);

  // Generate order number
  const last = await prisma.manufacturingOrder.findFirst({ orderBy: { id: 'desc' } });
  const orderNumber = `MO-${String((last?.id || 0) + 1).padStart(5, '0')}`;

  const order = await prisma.manufacturingOrder.create({
    data: {
      recipeId:          body.recipeId,
      quantityToProduce: body.quantityToProduce,
      status:            'draft',
      notes:             body.notes || null,
      orderNumber,
      startDate:         body.plannedStartDate ? new Date(body.plannedStartDate) : new Date(),
      endDate:           body.plannedEndDate   ? new Date(body.plannedEndDate)   : null,
      totalCost:         standardCost,
      userId:            auth?.userId || null,
    },
  });

  return NextResponse.json({ success: true, order, orderNumber }, { status: 201 });
}

// ── PUT ───────────────────────────────────────────────────────────────────────

async function _PUT(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = UpdateOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { orderId, action, actualCost, completedQty, notes } = parsed.data;

  const order = await prisma.manufacturingOrder.findUnique({
    where:   { id: orderId },
    include: { recipe: { include: { ingredients: true } } }
  }).catch(() => null);

  if (!order) {
    return NextResponse.json({ error: 'أمر التصنيع غير موجود' }, { status: 404 });
  }

  // ── action: start ───────────────────────────────────────────────────────────
  if (action === 'start') {
    await prisma.manufacturingOrder.update({
      where: { id: orderId },
      data:  { status: 'in_progress', startDate: new Date() },
    });
    return NextResponse.json({ success: true, message: 'تم بدء تنفيذ أمر التصنيع' });
  }

  // ── action: issue-materials ─────────────────────────────────────────────────
  if (action === 'issue-materials') {
    const materialCost = n((order as any).standardCost) || 0;
    const orderNum = (order as any).orderNumber || `MO-${order.id}`;

    // Post material issue to WIP
    await postMaterialIssueToWIP({
      orderNumber:  orderNum,
      materialCost,
      userId:       auth?.userId,
      date:         new Date().toISOString().split('T')[0],
    }).catch(err => console.error('[mfg-journal] issue-materials:', err.message));

    return NextResponse.json({ success: true, message: `تم إصدار المواد الخام بتكلفة ${materialCost} لأمر التصنيع`, materialCost });
  }

  // ── action: complete ────────────────────────────────────────────────────────
  if (action === 'complete') {
    const stdCost = n((order as any).standardCost) || 0;
    const actCost = actualCost ?? stdCost;
    const orderNum = (order as any).orderNumber || `MO-${order.id}`;

    await prisma.manufacturingOrder.update({
      where: { id: orderId },
      data:  {
        status:    'completed',
        endDate:   new Date(),
        totalCost: actCost,
        yieldQty:  completedQty || order.quantityToProduce,
        notes:     notes || undefined,
      },
    });

    // Auto-journal: إغلاق أمر التصنيع وإثبات المنتج التام
    await postManufacturingCompletion({
      orderNumber:  orderNum,
      standardCost: stdCost,
      actualCost:   actCost,
      productName:  (order.recipe as any)?.name || 'منتج',
      userId:       auth?.userId,
      date:         new Date().toISOString().split('T')[0],
    }).catch(err => console.error('[mfg-journal] complete:', err.message));

    return NextResponse.json({
      success: true,
      message: `تم إغلاق أمر التصنيع ${orderNum} وترحيل قيد إثبات المنتج التام`,
      variance: Math.round((actCost - stdCost) * 100) / 100,
    });
  }

  // ── action: cancel ──────────────────────────────────────────────────────────
  if (action === 'cancel' || action === 'pause') {
    await prisma.manufacturingOrder.update({
      where: { id: orderId },
      data:  { status: action === 'cancel' ? 'cancelled' : 'draft', notes: notes || undefined },
    });
    return NextResponse.json({ success: true, message: action === 'cancel' ? 'تم إلغاء أمر التصنيع' : 'تم إيقاف أمر التصنيع مؤقتاً' });
  }

  return NextResponse.json({ error: 'action غير معروف. استخدم: start | issue-materials | complete | cancel | pause' }, { status: 400 });
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const GET = withRoute(
  async ({ req }) => _GET(req as any),
  { rateLimit: 'DEFAULT' }
);

export const POST = withRoute(
  async ({ req, auth }) => _POST(req as any, auth),
  { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'production'] }
);

export const PUT = withRoute(
  async ({ req, auth }) => _PUT(req as any, auth),
  { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'production', 'warehouse'] }
);
