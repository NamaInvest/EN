import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Smart Landed Costs (LC) Distribution Engine
// Automatically allocates Shipping, Customs, and Insurance costs to imported products
// to calculate the TRUE `buyPrice` (Cost of Goods Sold - COGS)

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // 1. Fetch the Purchase Order and its Details + attached Landed Costs
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        details: { include: { product: true } },
        landedCosts: true
      }
    });

    if (!order) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    if (order.landedCosts.length === 0) return NextResponse.json({ message: 'No landed costs to distribute' });

    // 2. Calculate distribution bases
    // Base 1: Total Value (price * quantity)
    const totalOrderValue = order.details.reduce((sum, d) => sum + (d.price * d.quantity), 0);
    // Base 2: Total Quantity
    const totalQuantity = order.details.reduce((sum, d) => sum + d.quantity, 0);

    let totalAdditionalCost = 0;

    // 3. Loop through Landed Costs (Shipping, Customs, etc.) and calculate distribution factor
    for (const cost of order.landedCosts) {
      const actualAmountInLocalCurrency = cost.amount * (cost.exchangeRate || 1.0);
      totalAdditionalCost += actualAmountInLocalCurrency;

      for (const d of order.details) {
        let allocatedAmount = 0;
        
        switch (cost.allocationMethod) {
          case 'value':
            // Distribute by value
            const valueRatio = (d.price * d.quantity) / totalOrderValue;
            allocatedAmount = actualAmountInLocalCurrency * valueRatio;
            break;
          case 'quantity':
            // Distribute by quantity evenly
            const qtyRatio = d.quantity / totalQuantity;
            allocatedAmount = actualAmountInLocalCurrency * qtyRatio;
            break;
          default:
            // Fallback to value ratio
            allocatedAmount = actualAmountInLocalCurrency * ((d.price * d.quantity) / totalOrderValue);
        }

        // The additional unit cost for this specific item
        const extraUnitCost = allocatedAmount / d.quantity;
        
        // Accumulate this distributed cost per item (For this iteration context, we just add it to a transient map)
        d.price += extraUnitCost; // We artificially inflate the item's computed cost here
      }
    }

    // 4. Update the Product's actual `buyPrice` in the Central Database
    // This is the Magic! The business will no longer lose money due to hidden import fees.
    const updates = [];
    for (const d of order.details) {
      updates.push(prisma.product.update({
        where: { id: d.productId },
        data: { buyPrice: d.price } // New precise Landed Cost
      }));
    }

    await prisma.$transaction(updates);

    console.log(`[Landed Cost Engine] Fully distributed ${totalAdditionalCost} SAR across ${order.details.length} SKUs for PO #${order.orderNo}`);

    return NextResponse.json({ 
      message: 'Smart Landed Costs Successfully Distributed',
      totalDistributed: totalAdditionalCost,
      itemsUpdated: order.details.length
    });

  } catch (error: any) {
    console.error('Landed Cost API Error:', error);
    return NextResponse.json({ error: 'Failed to calculate landed costs' }, { status: 500 });
  }
}
