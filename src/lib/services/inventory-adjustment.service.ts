import { InventoryTxClient } from '@/lib/db/transaction';
import { logAuditEvent } from '@/lib/audit-trail';
import { FinancialPeriodService } from '@/services/accounting/financial-period.service';

export class InventoryAdjustmentService {
    /**
     * Approves a stocktake, calculates differences, and applies stock adjustments atomically.
     * This service strictly requires an InventoryTxClient. General Prisma clients are rejected.
     */
    static async approveStocktake(
        tx: InventoryTxClient,
        stocktake: any,
        tenantId: string,
        ipAddress: string | null
    ) {
        if (stocktake.status === 'approved') {
            throw new Error('Already approved');
        }

        // Phase 2: Period Lock Enforcement inside the transaction
        const periodService = new FinancialPeriodService(tx, { tenant: { id: tenantId } } as any);
        await periodService.requireOpenPeriod(stocktake.date || new Date());

        let totalMatched = 0;
        let totalShort = 0;
        let totalOver = 0;
        let totalValueDiff = 0;

        for (const item of stocktake.items) {
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
            where: { id: stocktake.id },
            data: {
                status: 'approved',
                matched: totalMatched,
                over: totalOver,
                short: totalShort
            }
        });

        await logAuditEvent(tx, {
            tenantId,
            userId: null, // no auth available in this scope easily without refactor
            action: 'UPDATE',
            entityType: 'StocktakeApprove',
            entityId: stocktake.id,
            route: `/api/inventory/stocktake/${stocktake.id}/approve`,
            oldData: { status: stocktake.status },
            newData: { status: 'approved', matched: totalMatched, over: totalOver, short: totalShort },
            ipAddress,
        });

        return { totalMatched, totalOver, totalShort, totalValueDiff };
    }
}
