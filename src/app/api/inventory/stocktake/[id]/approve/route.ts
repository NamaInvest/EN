import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const prisma = getPrisma(req as any);
    try {
        const id = Number(params.id);
        
        // Fetch stocktake and its items
        const stocktake = await prisma.stocktake.findUnique({
            where: { id },
            include: { items: { include: { product: true } } } as any
        });

        if (!stocktake) return NextResponse.json({ error: 'Stocktake not found' }, { status: 404 });
        if (stocktake.status === 'approved') return NextResponse.json({ error: 'Already approved' }, { status: 400 });

        // Update items to calculate differences and adjust stock
        let totalMatched = 0;
        let totalShort = 0;
        let totalOver = 0;
        let totalValueDiff = 0;

        const updatePromises: any[] = [];

        for (const item of (stocktake as any).items) {
            const diff = item.actualQty - item.systemQty;
            let status = 'matched';
            if (diff > 0) { status = 'over'; totalOver++; }
            else if (diff < 0) { status = 'short'; totalShort++; }
            else { totalMatched++; }

            const valueDiff = diff * item.product.buyPrice;
            totalValueDiff += valueDiff;

            updatePromises.push(
                prisma.stocktakeItem.update({
                    where: { id: item.id },
                    data: { difference: diff, status }
                })
            );

            // Create stock movement and update product stock if there is a difference
            if (diff !== 0) {
                updatePromises.push(
                    prisma.product.update({
                        where: { id: item.productId },
                        data: { currentStock: item.actualQty } // Set to actual
                    }),
                    prisma.stockMovement.create({
                        data: {
                            productId: item.productId,
                            stockId: 1, // Default
                            type: 'adjustment',
                            quantity: diff,
                            notes: `Cycle Count Adjustment #${stocktake.id}`,
                            referenceType: 'Stocktake',
                            referenceId: stocktake.id,
                        }
                    })
                );
            }
        }

        // Update the main stocktake record
        updatePromises.push(
            prisma.stocktake.update({
                where: { id },
                data: {
                    status: 'approved',
                    matched: totalMatched,
                    over: totalOver,
                    short: totalShort
                }
            })
        );

        // If significant value diff, we'd create a Journal Entry (Simulation here)
        // Dr/Cr 1310 Inventory <-> 5910 Inventory Adjustment
        if (totalValueDiff !== 0) {
            console.log(`[FINANCE] Journal Entry Created for Stocktake #${stocktake.id}. Net Value Adjustment: ${totalValueDiff} SAR`);
        }

        await prisma.$transaction(updatePromises);

        return NextResponse.json({ success: true, message: 'Stocktake approved and stock updated' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
