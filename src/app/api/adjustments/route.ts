/**
 * Inventory Adjustments API — Complete Implementation
 * 
 * GET  /api/adjustments        — List adjustments with filters
 * POST /api/adjustments        — Create adjustment + auto-journal
 * POST /api/adjustments/batch  — Batch adjustments (stocktake results)
 * GET  /api/adjustments/stats  — Summary stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute }             from '@/lib/api/with-route';
import { getPrisma }             from '@/lib/prisma';
import { z }                     from 'zod';
import { postInventoryAdjustment } from '@/lib/auto-journal';
import { n }                     from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { InventoryService } from '@/lib/services/inventory.service';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ service: 'adjustments' });

// ── Schemas ───────────────────────────────────────────────────────────────────

const AdjLineSchema = z.object({
  productId:   z.number().int().positive(),
  stockId:     z.number().int().positive(),
  systemQty:   z.number(),
  actualQty:   z.number(),
  unitCost:    z.number().min(0).default(0),
  reason:      z.string().optional(),
});

const CreateAdjustmentSchema = z.object({
  items:        z.array(AdjLineSchema).min(1, 'يجب تحديد صنف واحد على الأقل'),
  reason:       z.string().min(1, 'سبب التسوية مطلوب'),
  stocktakeId:  z.number().int().optional(),
  branchId:     z.number().int().optional(),
  date:         z.string().optional(),
  notes:        z.string().optional(),
});

const AdjQuerySchema = z.object({
  page:     z.string().optional().transform(v => parseInt(v || '1')),
  take:     z.string().optional().transform(v => Math.min(parseInt(v || '50'), 200)),
  branchId: z.string().optional().transform(v => v ? parseInt(v) : undefined),
  from:     z.string().optional(),
  to:       z.string().optional(),
  status:   z.enum(['pending', 'approved', 'rejected']).optional(),
});

// ── GET ───────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const q      = req.nextUrl.searchParams;
  const tenantId = assertTenant(auth?.tenantId);

  const queryParsed = AdjQuerySchema.safeParse(Object.fromEntries(q));
  if (!queryParsed.success) {
    return NextResponse.json({ error: 'Query params invalid' }, { status: 400 });
  }
  const { page, take, branchId, from, to, status } = queryParsed.data;

  const action = q.get('action');

  const tenantFilter = requireTenantFilter({ tenantId });

  // ── Stats endpoint ──────────────────────────────────────────────────────────
  if (action === 'stats') {
    const [total, pending, totalVarianceCost] = await Promise.all([
      (prisma as any).inventoryAdjustment?.count({ where: tenantFilter }) ?? 0,
      (prisma as any).inventoryAdjustment?.count({ where: { ...tenantFilter, status: 'pending' } }) ?? 0,
      (prisma as any).inventoryAdjustment?.aggregate({ 
        _sum: { totalVarianceCost: true },
        where: tenantFilter
      }).then((r: any) => r._sum?.totalVarianceCost ?? 0).catch(() => 0),
    ]);
    return NextResponse.json({ total, pending, totalVarianceCost });
  }

  // ── List adjustments ────────────────────────────────────────────────────────
  const where: any = { ...tenantFilter };
  if (branchId)  where.branchId = branchId;
  if (status)    where.status   = status;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to)   where.date.lte = new Date(to + 'T23:59:59');
  }

  try {
    const [items, total] = await Promise.all([
      (prisma as any).inventoryAdjustment?.findMany({
        where,
        take,
        skip:    (page - 1) * take,
        orderBy: { createdAt: 'desc' },
        include: { lines: { include: { product: { select: { id: true, name: true, barcode: true } } } } },
      }) ?? [],
      (prisma as any).inventoryAdjustment?.count({ where }) ?? 0,
    ]);

    return NextResponse.json({ items, total, page, pages: Math.ceil(total / take) });
  } catch (err: unknown) {
    log.error('src/app/api/adjustments/route.ts', { error: err instanceof Error ? err.message : err });
    return NextResponse.json({ items: [], total: 0, page: 1, pages: 0 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest, auth: any) {
  const prisma = getPrisma(req);
  const path   = req.nextUrl.pathname;
  const tenantId = assertTenant(auth?.tenantId);

  // ── Batch from stocktake ────────────────────────────────────────────────────
  if (path.endsWith('/batch')) {
    const raw    = await req.json().catch(() => ({}));
    const parsed = CreateAdjustmentSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { items, reason, branchId, date } = parsed.data;
    const results: any[] = [];

    await runInventoryTx(prisma, async (tx: any) => {
      for (const item of items) {
        const diff     = item.actualQty - item.systemQty;
        if (Math.abs(diff) < 0.001) continue; 

        const diffCost = diff * (item.unitCost || 0);

        await InventoryService.adjustStock(tx, {
          tenantId,
          productId: item.productId,
          stockId: item.stockId,
          quantityChange: diff,
          reason: item.reason || reason,
          sourceType: 'BATCH_ADJUSTMENT'
        });
        
        await InventoryService.recordMovement(tx, {
           tenantId,
           productId: item.productId,
           stockId: item.stockId,
           quantity: diff,
           type: 'ADJUSTMENT',
           notes: item.reason || reason
        });

        if (Math.abs(diffCost) > 0.01) {
          await postInventoryAdjustment({
            productId: item.productId,
            diffCost,
            reason:    item.reason || reason,
            userId:    auth?.userId,
            branchId,
            date:      date || new Date().toISOString().split('T')[0],
          }).catch(err => EnterpriseLogger.error('[adj-journal]', { tenantId }, err));
        }

        results.push({ productId: item.productId, diff, diffCost });
      }
    }, 'BATCH_INVENTORY_ADJUSTMENT');

    return NextResponse.json({ success: true, processed: results.length, results });
  }

  // ── Single adjustment ───────────────────────────────────────────────────────
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateAdjustmentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { items, reason, branchId, date, notes, stocktakeId } = parsed.data;
  let totalVarianceCost = 0;

  await runInventoryTx(prisma, async (tx: any) => {
    for (const item of items) {
      const diff     = item.actualQty - item.systemQty;
      const diffCost = diff * (item.unitCost || 0);
      totalVarianceCost += diffCost;

      if (Math.abs(diff) < 0.001) continue;

      await InventoryService.adjustStock(tx, {
        tenantId,
        productId: item.productId,
        stockId: item.stockId,
        quantityChange: diff,
        reason,
        sourceType: 'SINGLE_ADJUSTMENT'
      });

      await InventoryService.recordMovement(tx, {
        tenantId,
        productId: item.productId,
        stockId: item.stockId,
        quantity: diff,
        type: 'ADJUSTMENT',
        notes: reason
      });

      await tx.product.update({
        where: { id: item.productId, tenantId },
        data:  { currentStock: { increment: diff } },
      }).catch(() => null);
    }
  }, 'SINGLE_INVENTORY_ADJUSTMENT');

  if (Math.abs(totalVarianceCost) > 0.01) {
    await postInventoryAdjustment({
      productId: items[0].productId,
      diffCost:  totalVarianceCost,
      reason,
      userId:    auth?.userId,
      branchId,
      date:      date || new Date().toISOString().split('T')[0],
    }).catch(err => EnterpriseLogger.error('[adj-journal]', { tenantId }, err));
  }

  EnterpriseLogger.traceInventoryTx(
      'ADJUSTMENT',
      'INVENTORY_ADJUSTMENT_POSTED',
      tenantId,
      { itemsAdjusted: items.length, totalVarianceCost }
  );

  return NextResponse.json({
    success:            true,
    itemsAdjusted:      items.length,
    totalVarianceCost:  Math.round(totalVarianceCost * 100) / 100,
    message:            'تم تسجيل التسوية الجردية وترحيل القيد المحاسبي',
  }, { status: 201 });
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const GET = withRoute(
  async ({ req, auth }) => _GET(req as any, auth),
  { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'warehouse', 'accountant'] }
);

export const POST = withRoute(
  async ({ req, auth }) => _POST(req as any, auth),
  { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'warehouse', 'accountant'] }
);
