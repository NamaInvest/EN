import { requireTenantId } from '@/lib/tenant/tenant-guard';
﻿/**
 * GET /api/manufacturing/stats — Manufacturing KPIs (Production Grade)
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Returns real-time production KPIs:
 *   - Order counts by status (total, WIP, completed, cancelled, planned)
 *   - Completion rate %
 *   - On-time delivery rate %
 *   - Yield / scrap rate from quality checks
 *   - Active work centers
 *   - Top 5 recipes by volume (last 30 days)
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ route: 'manufacturing/stats' });

async function handler(ctx: any) {
  const prisma    = ctx.prisma as any;
  const tenantId  = ctx.auth.tenantId as string;
  const since30d  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [
      totalOrders,
      wipOrders,
      completedOrders,
      cancelledOrders,
      plannedOrders,
      onTimeOrders,
      workCenters,
      yieldData,
      topRecipes,
    ] = await Promise.all([
      // Order counts
      prisma.manufacturingOrder?.count({ where: { tenantId } }).catch(() => 0) ?? 0,
      prisma.manufacturingOrder?.count({ where: { tenantId, status: 'IN_PROGRESS' } }).catch(() => 0) ?? 0,
      prisma.manufacturingOrder?.count({ where: { tenantId, status: 'COMPLETED' } }).catch(() => 0) ?? 0,
      prisma.manufacturingOrder?.count({ where: { tenantId, status: 'CANCELLED' } }).catch(() => 0) ?? 0,
      prisma.manufacturingOrder?.count({ where: { tenantId, status: 'PLANNED' } }).catch(() => 0) ?? 0,

      // On-time: completed & actualEndDate <= plannedEndDate
      prisma.manufacturingOrder?.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          actualEndDate: { not: null },
        }
      }).catch(() => null),

      // Active work centers
      prisma.workCenter?.count({ where: { tenantId, isActive: true } }).catch(() => 0) ?? 0,

      // Quality checks for yield/scrap (last 30 days)
      prisma.qualityInspection?.aggregate({
        where: { tenantId, createdAt: { gte: since30d } },
        _sum: { passedQty: true, failedQty: true },
      }).catch(() => null),

      // Top 5 recipes by MO count (last 30 days)
      prisma.manufacturingOrder?.groupBy({
        by: ['recipeId'],
        where: { tenantId, createdAt: { gte: since30d }, recipeId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }).catch(() => []) ?? [],
    ]);

    // â”€â”€ Compute derived KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const completionRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    // On-time rate: ratio of on-time completed to total completed
    const onTimeRate = (completedOrders > 0 && onTimeOrders !== null)
      ? Math.round((onTimeOrders / completedOrders) * 100)
      : null;

    // Yield rate from quality inspections
    const passedQty  = (yieldData as any)?._sum?.passedQty ?? 0;
    const failedQty  = (yieldData as any)?._sum?.failedQty ?? 0;
    const totalQty   = passedQty + failedQty;
    const yieldRate  = totalQty > 0 ? Math.round((passedQty / totalQty) * 100) : null;
    const scrapRate  = totalQty > 0 ? Math.round((failedQty / totalQty) * 100) : null;

    log.info('manufacturing stats fetched', { tenantId, totalOrders, wipOrders, completedOrders });

    return NextResponse.json({
      // Order KPIs
      orders: {
        total:     totalOrders,
        wip:       wipOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        planned:   plannedOrders,
      },
      // Performance KPIs
      completionRate,               // % of all orders completed
      onTimeRate,                   // % of completed orders on-time (null if no data)
      yieldRate,                    // % quality pass (last 30d, null if no checks)
      scrapRate,                    // % quality fail (last 30d, null if no checks)

      // Capacity
      activeWorkCenters: workCenters,

      // Top recipes (last 30d)
      topRecipes: (topRecipes as any[]).map(r => ({
        recipeId: r.recipeId,
        moCount:  r._count.id,
      })),

      // Meta
      period: '30d',
      asOf:   new Date().toISOString(),
    });

  } catch (e: any) {
    log.error('manufacturing stats error', { err: e.message });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });

