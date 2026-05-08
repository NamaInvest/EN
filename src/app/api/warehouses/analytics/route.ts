import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  try {
    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get('stockId');

    const productStocks = await prisma.productStock.findMany({
            take: 100,
      where: stockId ? { stockId: parseInt(stockId) } : { stock: { active: true } },
      include: { 
        product: true,
        stock: true 
      }
    });

    let totalValuationBuy = 0;
    let totalValuationSell = 0;
    let lowStockCount = 0;
    const lowStockAlerts = [];

    for (const ps of productStocks) {
      if (n(ps.quantity) > 0) {
        const buyValue = n(ps.quantity) * (n(ps.product.buyPrice) || 0);
        const sellValue = n(ps.quantity) * (n(ps.product.sellPrice) || 0);
        totalValuationBuy += buyValue;
        totalValuationSell += sellValue;
      }

      if (n(ps.quantity) <= n(ps.product.minQuantity) && ps.product.active) {
        lowStockCount++;
        lowStockAlerts.push({
          id: ps.product.id,
          name: ps.product.name,
          currentStock: n(ps.quantity),
          minQuantity: n(ps.product.minQuantity),
          warehouseName: ps.stock.name,
          stockId: ps.stock.id,
          barcode: ps.product.barcode || '-',
        });
      }
    }

    return NextResponse.json({
      totalValuationBuy,
      totalValuationSell,
      expectedProfit: totalValuationSell - totalValuationBuy,
      lowStockCount,
      lowStockAlerts
    });

  } catch (error: any) {
    console.error('Analytics Error:', error);
    return apiError(error, 'حدث خطأ في المعالجة', { context: 'warehouses/analytics' });
  }
}
