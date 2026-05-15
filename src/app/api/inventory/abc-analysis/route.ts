import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runInventoryTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'inventory.abc-analysis' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '12m';
        
        let dateFilter = new Date();
        if (period === '12m') {
            dateFilter.setMonth(dateFilter.getMonth() - 12);
        } else if (period === '6m') {
            dateFilter.setMonth(dateFilter.getMonth() - 6);
        } else {
            dateFilter.setMonth(dateFilter.getMonth() - 12);
        }

        // Fetch products and their stock movements
        // In a real scenario we'd query StockMovement where type is 'OUT' or 'ISSUE' or 'SALES'
        // For NamaSoft V3, stock movements are in `StockMovement`.
        
        const products: any[] = await (prisma.product as any).findMany({ take: 100,
            where: { active: true },
            select: {
                id: true,
                name: true,
                buyPrice: true,
                abcClass: true,
                currentStock: true,
                stockMovements: {
                    where: {
                        date: { gte: dateFilter },
                        type: { in: ['OUT', 'SALE', 'ISSUE'] }
                    },
                    select: {
                        quantity: true
                    }
                }
            }
        });

        // Calculate annual usage value per product
        const items = products.map(p => {
            const totalOutQty = p.stockMovements.reduce((sum: number, m: any) => sum + Math.abs(m.quantity), 0);
            const usageValue = totalOutQty * p.buyPrice;
            return {
                id: p.id,
                name: p.name,
                currentStock: p.currentStock,
                buyPrice: p.buyPrice,
                totalOutQty,
                usageValue,
                abcClass: p.abcClass
            };
        });

        // Sort descending by usageValue
        items.sort((a, b) => b.usageValue - a.usageValue);

        const totalUsageValue = items.reduce((sum: any, item: any) => sum + item.usageValue, 0);

        // Calculate cumulative percentages and assign classes
        let cumulativeValue = 0;
        const analyzedItems = items.map(item => {
            cumulativeValue += item.usageValue;
            const cumulativePercent = totalUsageValue > 0 ? (cumulativeValue / totalUsageValue) * 100 : 0;
            
            let recommendedClass = 'C';
            if (cumulativePercent <= 80) recommendedClass = 'A';
            else if (cumulativePercent <= 95) recommendedClass = 'B';

            return {
                ...item,
                cumulativePercent,
                recommendedClass
            };
        });

        return NextResponse.json({ 
            success: true, 
            data: analyzedItems,
            totalUsageValue
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { items } = body; // [{ id, recommendedClass }]

        // Update abcClass for all items
        await runInventoryTx(prisma, async (tx: any) => {
            const promises = items.map((item: any) => 
                tx.product.update({
                    where: { id: item.id },
                    data: { abcClass: item.recommendedClass }
                })
            );
            await Promise.all(promises);
        });

        return NextResponse.json({ success: true, updatedCount: items.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
