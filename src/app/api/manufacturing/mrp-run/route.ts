import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.mrp-run' });
async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    
    try {
        // Fetch active manufacturing orders (draft, in_progress)
        const activeOrders = await prisma.manufacturingOrder.findMany({ take: 100,
            where: { status: { in: ['draft', 'in_progress'] } },
            include: {
                recipe: {
                    include: { ingredients: { include: { rawProduct: true } } }
                }
            }
        });

        // Calculate material requirements
        const requirementsMap = new Map();

        for (const order of activeOrders) {
            for (const item of order.recipe.ingredients) {
                // Calculation: (quantity per unit * units to produce) + (scrap percentage)
                const requiredQty = n(item.quantity) * n(order.quantityToProduce) * (1 + (n(item.scrapPercentage) / 100));
                
                if (requirementsMap.has(item.rawProductId)) {
                    requirementsMap.get(item.rawProductId).requiredQty += requiredQty;
                } else {
                    requirementsMap.set(item.rawProductId, {
                        productId: item.rawProductId,
                        productName: item.rawProduct.name,
                        unitBuyPrice: item.rawProduct.buyPrice,
                        requiredQty: requiredQty,
                        currentStock: item.rawProduct.currentStock,
                        minQuantity: item.rawProduct.minQuantity
                    });
                }
            }
        }

        // Determine shortages
        const shortages: any[] = [];
        let totalShortageCost = 0;

        requirementsMap.forEach((data: any) => {
            // Need to have at least 'requiredQty', plus keep 'minQuantity' buffer
            const targetStock = data.requiredQty + data.minQuantity;
            const shortageQty = targetStock - data.currentStock;

            if (shortageQty > 0) {
                const estimatedCost = shortageQty * data.unitBuyPrice;
                totalShortageCost += estimatedCost;
                
                shortages.push({
                    productId: data.productId,
                    productName: data.productName,
                    requiredQty: data.requiredQty,
                    currentStock: data.currentStock,
                    minQuantity: data.minQuantity,
                    shortageQty: shortageQty,
                    estimatedCost: estimatedCost
                });
            }
        });

        // Also fetch Machine status for OEE Dashboard
        const machines = await prisma.machine.findMany({ take: 100,
            include: {
                orders: { where: { status: 'in_progress' } },
                maintenanceLogs: { where: { status: 'pending' } }
            }
        });

        const machineStats = machines.map(m => ({
            id: m.id,
            name: m.name,
            code: m.code,
            status: m.status, // active, maintenance, offline
            activeOrderId: m.orders.length > 0 ? m.orders[0].orderNumber : null,
            pendingMaintenance: m.maintenanceLogs.length
        }));

        return NextResponse.json({
            shortages,
            totalShortageCost,
            machineStats,
            activeOrdersCount: activeOrders.length
        });

    } catch (error: any) {
        log.error("MRP Engine error:", error);
        return NextResponse.json({ error: 'Failed to run MRP calculations' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
