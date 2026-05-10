import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.letters-of-credit.landed-costs' });

// Smart Landed Costs (LC) Distribution Engine
// Automatically allocates Shipping, Customs, and Insurance costs to imported products
// to calculate the TRUE `buyPrice` (Cost of Goods Sold - COGS)

async function _POST(req: Request) {

    const prisma = getPrisma(req);
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
    const totalOrderValue = order.details.reduce((sum: number, d: any) => sum + (n(d.price) * n(d.quantity)), 0);
    // Base 2: Total Quantity
    const totalQuantity = order.details.reduce((sum: number, d: any) => sum + n(d.quantity), 0);

    let totalAdditionalCost = 0;

    // 3. Loop through Landed Costs (Shipping, Customs, etc.) and calculate distribution factor
    for (const cost of order.landedCosts) {
      const actualAmountInLocalCurrency = n(cost.amount) * (n(cost.exchangeRate) || 1.0);
      totalAdditionalCost += actualAmountInLocalCurrency;

      for (const d of order.details) {
        let allocatedAmount = 0;
        
        switch (cost.allocationMethod) {
          case 'value':
            // Distribute by value
            const valueRatio = (n(d.price) * n(d.quantity)) / totalOrderValue;
            allocatedAmount = actualAmountInLocalCurrency * valueRatio;
            break;
          case 'quantity':
            // Distribute by quantity evenly
            const qtyRatio = n(d.quantity) / totalQuantity;
            allocatedAmount = actualAmountInLocalCurrency * qtyRatio;
            break;
          default:
            // Fallback to value ratio
            allocatedAmount = actualAmountInLocalCurrency * ((n(d.price) * n(d.quantity)) / totalOrderValue);
        }

        // The additional unit cost for this specific item
        const extraUnitCost = allocatedAmount / n(d.quantity);
        
        // Accumulate this distributed cost per item (For this iteration context, we just add it to a transient map)
        d.price = (n(d.price) + extraUnitCost) as any; // We artificially inflate the item's computed cost here
      }
    }

    // 4. Update the Product's actual `buyPrice` in the Central Database
    const updates = [];
    let totalAdjustment = 0;
    const cogsAccountId = 5; // Example COGS Account ID
    // We take the first landed cost account as the primary clearing account, or default to 10
    const clearingAccountId = order.landedCosts[0]?.expenseAccountId || 10; 

    for (const d of order.details) {
      updates.push(prisma.product.update({
        where: { id: d.productId },
        data: { buyPrice: d.price } // New precise Landed Cost
      }));

      // 5. Retroactive COGS Adjustment Logic (Batch Tracking / Date Tracking)
      // Get all outbound stock movements (Sales) for this product AFTER the PO was received
      const outboundMovements = await prisma.stockMovement.aggregate({
        _sum: { quantity: true },
        where: {
          productId: d.productId,
          type: 'out',
          date: { gte: order.date } // Assuming sold after PO creation
        }
      });

      const soldQuantity = Math.abs(n(outboundMovements._sum.quantity));
      
      // Calculate total variance for sold items
      // (New Cost - Old Cost) * Sold Quantity
      const unitVariance = n(d.price) - n(d.product.buyPrice);
      if (unitVariance > 0 && soldQuantity > 0) {
        const adjustmentValue = unitVariance * soldQuantity;
        totalAdjustment += adjustmentValue;
      }
    }

    await prisma.$transaction(updates);

    // 6. Create the Automatic Adjustment Journal
    if (totalAdjustment > 0) {
      await prisma.journalEntry.create({
        data: {
          entryNumber: `LC-${order.orderNo}-${Date.now()}`,
          entryDate: new Date().toISOString().split('T')[0],
          description: `تسوية أثر رجعي لتكلفة المبيعات (Landed Cost) للطلب #${order.orderNo}`,
          reference: `PO-${order.orderNo}`,
          totalDebit: totalAdjustment,
          totalCredit: totalAdjustment,
          status: 'posted',
          lines: {
            create: [
              // Debit COGS (زيادة تكلفة البضاعة المباعة)
              { accountId: cogsAccountId, debit: totalAdjustment, credit: 0, description: 'Landed Cost Retroactive COGS' },
              // Credit Clearing Account (تخفيض الحساب الوسيط للتكاليف)
              { accountId: clearingAccountId, debit: 0, credit: totalAdjustment, description: 'Landed Cost Clearing' }
            ]
          }
        }
      });
      log.info(`[Landed Cost Engine] Created Retroactive COGS Journal for ${totalAdjustment} SAR`);
    }

    log.info(`[Landed Cost Engine] Fully distributed ${totalAdditionalCost} SAR across ${order.details.length} SKUs for PO #${order.orderNo}`);

    return NextResponse.json({ 
      message: 'Smart Landed Costs Successfully Distributed',
      totalDistributed: totalAdditionalCost,
      itemsUpdated: order.details.length
    });

  } catch (error: any) {
    log.error('Landed Cost API Error:', error);
    return NextResponse.json({ error: 'Failed to calculate landed costs' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
