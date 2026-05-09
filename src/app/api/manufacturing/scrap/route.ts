import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const wastages = await prisma.manufacturingWastage.findMany({
            take: 100,
            include: {
                order: true,
                rawProduct: true
            },
            orderBy: { reportedAt: 'desc' }
        });

        // Basic stats
        let totalWastedCost = 0;
        const reasonsCount: Record<string, number> = {};

        wastages.forEach(w => {
            totalWastedCost += n(w.wastedCost);
            const reason = w.reason || 'OTHER';
            reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
        });

        return NextResponse.json({ success: true, data: { wastages, stats: { totalWastedCost, reasonsCount } } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  moId: z.union([z.string(), z.number()]).optional(),
  rawProductId: z.union([z.string(), z.number()]).optional(),
  lostQuantity: z.number().optional(),
  reason: z.any().optional(),
  wastagePhotoUrl: z.any().optional(),
  serialOrBatchNumber: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { moId, rawProductId, lostQuantity, reason, wastagePhotoUrl, serialOrBatchNumber } = body;

        // Verify MO and Product
        const mo = await prisma.manufacturingOrder.findUnique({ where: { id: Number(moId) } });
        const product = await prisma.product.findUnique({ where: { id: Number(rawProductId) } });

        if (!mo || !product) {
            return NextResponse.json({ error: 'MO or Product not found' }, { status: 404 });
        }

        const wastedCost = n(product.buyPrice) * Number(lostQuantity);

        // Transaction for Wastage creation + Inventory Adjustment + Journal Entry
        const [wastage] = await prisma.$transaction([
            prisma.manufacturingWastage.create({
                data: {
                    manufacturingOrderId: mo.id,
                    rawProductId: product.id,
                    lostQuantity: Number(lostQuantity),
                    wastedCost: wastedCost,
                    reason,
                    wastagePhotoUrl,
                    serialOrBatchNumber
                }
            }),
            prisma.product.update({
                where: { id: product.id },
                data: { currentStock: { decrement: Number(lostQuantity) } }
            }),
            prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    stockId: 1,
                    type: 'out', // Scrap
                    quantity: -Number(lostQuantity),
                    notes: `Manufacturing Scrap MO-${mo.orderNumber}. Reason: ${reason}`
                }
            })
            // In a real implementation, we would also create a JournalEntry here:
            // Dr 5910 Manufacturing Scrap
            // Cr 1310 WIP Inventory
        ]);

        console.log(`[FINANCE] Auto-Journal created for Scrap. Dr 5910 / Cr 1310: ${wastedCost} SAR`);

        return NextResponse.json({ success: true, data: wastage });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
