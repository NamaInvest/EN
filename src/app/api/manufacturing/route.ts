/**
 * Manufacturing API â€” Complete Production Orders Management
 * 
 * GET  /api/manufacturing        â€” List orders
 * POST /api/manufacturing        â€” Create order
 * PUT  /api/manufacturing        â€” Update order status (start/complete/cancel)
 *      ?action=complete          â€” Close order + postManufacturingCompletion
 *      ?action=issue-materials   â€” Issue BOM materials to WIP + postMaterialIssueToWIP
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute }               from '@/lib/api/with-route';
import { getPrisma }               from '@/lib/prisma';
import { z }                       from 'zod';
import { postManufacturingCompletion, postMaterialIssueToWIP } from '@/lib/auto-journal';
import { n }                       from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing' });

// â”€â”€ Schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CreateOrderSchema = z.object({
  recipeId:           z.number().int().positive('recipeId ظ…ط·ظ„ظˆط¨'),
  quantityToProduce:  z.number().positive('ط§ظ„ظƒظ…ظٹط© ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ظ…ظˆط¬ط¨ط©'),
  plannedStartDate:   z.string().optional(),
  plannedEndDate:     z.string().optional(),
  priority:           z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  notes:              z.string().optional(),
  branchId:           z.number().int().optional(),
});

const UpdateOrderSchema = z.object({
  orderId:       z.number().int().positive('orderId ظ…ط·ظ„ظˆط¨'),
  action:        z.enum(['start', 'complete', 'cancel', 'pause', 'issue-materials']),
  actualCost:    z.number().optional(),
  completedQty:  z.number().optional(),
  notes:         z.string().optional(),
});

// â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ POST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function _POST(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± طµط§ظ„ط­ط©', details: parsed.error.flatten().fieldErrors },
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
    return NextResponse.json({ error: 'ط§ظ„ظˆطµظپط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©' }, { status: 404 });
  }

  // Compute standard cost = sum(ingredient.quantity أ— product.costPrice أ— qtyToProduce)
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

// â”€â”€ PUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function _PUT(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const raw    = await req.json().catch(() => ({}));
  const parsed = UpdateOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± طµط§ظ„ط­ط©', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { orderId, action, actualCost, completedQty, notes } = parsed.data;

  const order = await prisma.manufacturingOrder.findUnique({
    where:   { id: orderId },
    include: { recipe: { include: { ingredients: true } } }
  }).catch(() => null);

  if (!order) {
    return NextResponse.json({ error: 'ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' }, { status: 404 });
  }

  // â”€â”€ action: start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === 'start') {
    await prisma.manufacturingOrder.update({
      where: { id: orderId },
      data:  { status: 'in_progress', startDate: new Date() },
    });
    return NextResponse.json({ success: true, message: 'طھظ… ط¨ط¯ط، طھظ†ظپظٹط° ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹' });
  }

  // â”€â”€ action: issue-materials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === 'issue-materials') {
    const materialCost = n((order as any).standardCost) || 0;
    const orderNum = (order as any).orderNumber || `MO-${order.id}`;

    // Post material issue to WIP
    await postMaterialIssueToWIP({
      orderNumber:  orderNum,
      materialCost,
      userId:       auth?.userId,
      date:         new Date().toISOString().split('T')[0],
    }).catch(err => log.error('[mfg-journal] issue-materials:', err.message));

    return NextResponse.json({ success: true, message: `طھظ… ط¥طµط¯ط§ط± ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط®ط§ظ… ط¨طھظƒظ„ظپط© ${materialCost} ظ„ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹`, materialCost });
  }

  // â”€â”€ action: complete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // Auto-journal: ط¥ط؛ظ„ط§ظ‚ ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹ ظˆط¥ط«ط¨ط§طھ ط§ظ„ظ…ظ†طھط¬ ط§ظ„طھط§ظ…
    await postManufacturingCompletion({
      orderNumber:  orderNum,
      standardCost: stdCost,
      actualCost:   actCost,
      productName:  (order.recipe as any)?.name || 'ظ…ظ†طھط¬',
      userId:       auth?.userId,
      date:         new Date().toISOString().split('T')[0],
    }).catch(err => log.error('[mfg-journal] complete:', err.message));

    return NextResponse.json({
      success: true,
      message: `طھظ… ط¥ط؛ظ„ط§ظ‚ ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹ ${orderNum} ظˆطھط±ط­ظٹظ„ ظ‚ظٹط¯ ط¥ط«ط¨ط§طھ ط§ظ„ظ…ظ†طھط¬ ط§ظ„طھط§ظ…`,
      variance: Math.round((actCost - stdCost) * 100) / 100,
    });
  }

  // â”€â”€ action: cancel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === 'cancel' || action === 'pause') {
    await prisma.manufacturingOrder.update({
      where: { id: orderId },
      data:  { status: action === 'cancel' ? 'cancelled' : 'draft', notes: notes || undefined },
    });
    return NextResponse.json({ success: true, message: action === 'cancel' ? 'طھظ… ط¥ظ„ط؛ط§ط، ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹' : 'طھظ… ط¥ظٹظ‚ط§ظپ ط£ظ…ط± ط§ظ„طھطµظ†ظٹط¹ ظ…ط¤ظ‚طھط§ظ‹' });
  }

  return NextResponse.json({ error: 'action ط؛ظٹط± ظ…ط¹ط±ظˆظپ. ط§ط³طھط®ط¯ظ…: start | issue-materials | complete | cancel | pause' }, { status: 400 });
}

// â”€â”€ Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
