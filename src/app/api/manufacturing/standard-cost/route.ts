/**
 * GET /api/manufacturing/standard-cost — Standard cost versions per product
 * GET /api/manufacturing/stats          — Manufacturing KPIs dashboard
 * GET /api/manufacturing/subcontracting — Subcontracting POs
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const prisma   = ctx.prisma;
  const tenantId = ctx.auth.tenantId;
  const sp       = ctx.req.nextUrl.searchParams;
  const view     = sp.get('view') ?? 'standard-cost';

  try {
    if (view === 'stats') {
      const [orders, variance, wip] = await Promise.all([
        (prisma as any).manufacturingOrder?.count({ where: { tenantId } }).catch(() => 0),
        (prisma as any).varianceTransaction?.aggregate({ where: { tenantId }, _sum: { varianceAmount: true } }).catch(() => ({ _sum: { varianceAmount: 0 } })),
        (prisma as any).manufacturingOrder?.count({ where: { tenantId, status: 'IN_PROGRESS' } }).catch(() => 0),
      ]);
      return NextResponse.json({ totalOrders: orders, wipOrders: wip, totalVariance: Number(variance._sum.varianceAmount ?? 0) });
    }

    if (view === 'subcontracting') {
      const pos = await (prisma as any).subcontractingPO?.findMany({
        where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 100,
      }).catch(() => []);
      return NextResponse.json(pos ?? []);
    }

    // Default: standard-cost versions
    const versions = await (prisma as any).standardCostVersion?.findMany({
      where: { tenantId }, orderBy: { effectiveDate: 'desc' }, take: 100,
      include: { product: { select: { id: true, name: true } } },
    }).catch(() => []);
    return NextResponse.json(versions ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
