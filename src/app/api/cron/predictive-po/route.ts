import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { requireCronSecret } from '@/lib/cron-guard';

async function _POST(req: Request) {
  const guard = requireCronSecret(req as any);
  if (guard) return guard;


    const prisma = getPrisma(req);
  try {
    // Analytics logic: If product quantity is below 10 across all branches, create a Draft PO
    // 1. Group by ProductID and SUM their quantities across all locations (ProductLocation) or ProductStock
    const lowStocks = await prisma.productStock.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      having: {
        quantity: { _sum: { lt: 10 } }
      }
    });

    if (lowStocks.length === 0) {
      return NextResponse.json({ message: 'All products are sufficiently stocked.' });
    }

    const productIdsToRestock = lowStocks.map((s: any) => s.productId);
    
    // Check if these products already have a DRAFT or OPEN PO
    const existingPOs = await prisma.purchaseOrderDetail.findMany({
            take: 100,
      where: {
        productId: { in: productIdsToRestock },
        order: { status: { in: ['DRAFT', 'PENDING', 'OPEN'] } }
      },
      select: { productId: true }
    });

    const productsAlreadyOrdered = new Set(existingPOs.map((p: any) => p.productId));
    const productsNeedingOrdering = productIdsToRestock.filter((id: number) => !productsAlreadyOrdered.has(id));

    if (productsNeedingOrdering.length === 0) {
      return NextResponse.json({ message: 'Low stock items are already pending order.' });
    }

    // Process and Create Auto-draft PO
    // Fetch generic Supplier (Fallback) and Base products to calculate suggested order total
    const productsInfo = await prisma.product.findMany({
            take: 100,
      where: { id: { in: productsNeedingOrdering } },
      select: { id: true, name: true, buyPrice: true }
    });

    if (productsInfo.length > 0) {
      // Create a DRAFT Purchase Order
      const newPO = await prisma.purchaseOrder.create({
        data: {
          orderNo: Math.floor(100000 + Math.random() * 900000), // Random OR max logic
          date: new Date(),
          status: 'DRAFT',
          details: {
            create: productsInfo.map(p => ({
              productId: p.id,
              quantity: 50, // Auto-restock amount
              price: p.buyPrice || 0,
              total: n(p.buyPrice || 0) * 50
            }))
          },
          subtotal: productsInfo.reduce((sum: any, p: any) => sum + ((p.buyPrice || 0) * 50), 0),
          total: productsInfo.reduce((sum: any, p: any) => sum + ((p.buyPrice || 0) * 50), 0)
        }
      });

      console.log(`[Auto-Replenish] Draft PO Generated #${newPO.orderNo} for ${productsInfo.length} items`);
      return NextResponse.json({ message: 'Predictive PO Generated', orderNo: newPO.orderNo, itemsCount: productsInfo.length });
    }

    return NextResponse.json({ message: 'Completed without ordering' });
  } catch (error: any) {
    console.error('Predictive Procurement Error:', error);
    return NextResponse.json({ error: 'Failed to run predictive procurement' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'CRON' });
