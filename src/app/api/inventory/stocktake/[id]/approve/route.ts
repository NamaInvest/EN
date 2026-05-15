import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'inventory.stocktake.id.approve' });

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        
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

        await prisma.$transaction(async (tx: any) => {
            for (const item of (stocktake as any).items) {
                const diff = item.actualQty - item.systemQty;
                let status = 'matched';
                if (diff > 0) { status = 'over'; totalOver++; }
                else if (diff < 0) { status = 'short'; totalShort++; }
                else { totalMatched++; }

                const valueDiff = diff * item.product.buyPrice;
                totalValueDiff += valueDiff;

                await tx.stocktakeItem.update({
                    where: { id: item.id },
                    data: { difference: diff, status }
                });

                if (diff !== 0) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { currentStock: item.actualQty }
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            stockId: 1, // Default
                            type: 'adjustment',
                            quantity: diff,
                            notes: `Cycle Count Adjustment #${stocktake.id}`,
                            referenceType: 'Stocktake',
                            referenceId: stocktake.id,
                        }
                    });
                }
            }

            await tx.stocktake.update({
                where: { id },
                data: {
                    status: 'approved',
                    matched: totalMatched,
                    over: totalOver,
                    short: totalShort
                }
            });

            const { logAuditEvent } = await import('@/lib/audit-trail');
            await logAuditEvent(tx, {
                tenantId: req.headers.get('x-tenant') || 'default',
                userId: null, // no auth available in this scope easily without refactor
                action: 'UPDATE',
                entityType: 'StocktakeApprove',
                entityId: id,
                route: `/api/inventory/stocktake/${id}/approve`,
                oldData: { status: stocktake.status },
                newData: { status: 'approved', matched: totalMatched, over: totalOver, short: totalShort },
                ipAddress: req.headers.get('x-forwarded-for') || null,
            });
        });

        return NextResponse.json({ success: true, message: 'Stocktake approved and stock updated' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
