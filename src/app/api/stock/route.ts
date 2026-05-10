/**
 * GET /api/stock — Inventory stock summary per warehouse
 * Proxy to /api/stock/movements for compatibility
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'stock' });

async function handler(ctx: any) {
  const prisma   = ctx.prisma;
  const tenantId = ctx.auth.tenantId;
  const sp       = ctx.req.nextUrl.searchParams;
  const stockId  = sp.get('stockId');
  const search   = sp.get('search');

  try {
    const where: any = { tenantId, deletedAt: null };
    if (stockId) where.stockId = Number(stockId);

    const stocks = await prisma.productStock.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, barcode: true } },
        stock:   { select: { id: true, name: true } },
      },
      orderBy: { product: { name: 'asc' } },
      take:    search ? undefined : 200,
    });

    const filtered = search
      ? stocks.filter((s: any) =>
          s.product.name.includes(search) || s.product.barcode?.includes(search)
        )
      : stocks;

    return NextResponse.json(filtered);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
