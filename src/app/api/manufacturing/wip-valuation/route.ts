import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const wipOrders = await prisma.manufacturingOrder.findMany({
            take: 100,
            where: { status: 'in_progress' },
            include: {
                recipe: { include: { finishedProduct: true } },
                costs: true
            } as any
        });

        let totalWipValue = 0;
        const valuationDetails = wipOrders.map((order: any) => {
            const materialCost = order.costs.filter((c: any) => c.costType === 'material').reduce((acc: number, c: any) => acc + c.amount, 0);
            const overheadCost = order.costs.filter((c: any) => c.costType === 'overhead').reduce((acc: number, c: any) => acc + c.amount, 0);
            const scrapCost = order.costs.filter((c: any) => c.costType === 'scrap').reduce((acc: number, c: any) => acc + c.amount, 0);
            
            const totalOrderWip = materialCost + overheadCost + scrapCost;
            totalWipValue += totalOrderWip;

            return {
                orderNumber: order.orderNumber,
                productName: order.recipe?.finishedProduct?.name || 'غير محدد',
                startDate: order.startDate,
                materialCost,
                overheadCost,
                scrapCost,
                totalWipValue: totalOrderWip
            };
        });

        return NextResponse.json({
            totalWipValue,
            currency: 'SAR',
            reportDate: new Date().toISOString(),
            details: valuationDetails
        });
    } catch (error: any) {
        console.error("WIP Valuation error:", error);
        return NextResponse.json({ error: 'Failed to generate WIP valuation' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
