/**
 * GET /api/manufacturing/stats — Manufacturing KPIs
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const prisma   = ctx.prisma;
  const tenantId = ctx.auth.tenantId;

  try {
    const [totalOrders, wipOrders, completedOrders] = await Promise.all([
      (prisma as any).manufacturingOrder?.count({ where: { tenantId } }).catch(() => 0) ?? 0,
      (prisma as any).manufacturingOrder?.count({ where: { tenantId, status: 'IN_PROGRESS' } }).catch(() => 0) ?? 0,
      (prisma as any).manufacturingOrder?.count({ where: { tenantId, status: 'COMPLETED' } }).catch(() => 0) ?? 0,
    ]);

    return NextResponse.json({
      totalOrders, wipOrders, completedOrders,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
