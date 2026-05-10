// @ts-nocheck
import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wms-engine' });

export class WmsEngine {

    /**
     * Suggest a bin for putaway based on rules
     */
    static async suggestPutaway(productId: number, qty: number, stockId: number) {
        // Find a rule for this product
        const rule = await (prisma as any).putawayRule.findFirst({
            where: { productId }
        });

        if (rule) {
            // Find bins in the preferred zone
            const bins = await prisma.warehouseBin.findMany({
            take: 100,
                where: {
                    rack: { zone: { id: rule.preferredZoneId } },
                    status: 'AVAILABLE'
                } as any
            });

            if (bins.length > 0) {
                // Apply fill strategy logic (simplified)
                return bins[0];
            }
        }

        // Fallback: find any available bin in the warehouse
        const anyBin = await prisma.warehouseBin.findFirst({
            where: {
                status: 'AVAILABLE',
                rack: { zone: { stockId } }
            } as any
        });

        return anyBin;
    }

    /**
     * Generate a PickList for a SalesOrder (simulated logic)
     */
    static async generatePickList(salesOrderId: number, strategy: 'FIFO' | 'FEFO' | 'NEAREST' = 'FIFO') {
        // Assume salesOrderId relates to SalesInvoice logic or a real SalesOrder model
        // We will create an empty PickList for demonstration
        const pickList = await (prisma as any).pickList.create({
            data: {
                salesOrderId,
                status: 'PENDING',
                pickStrategyUsed: strategy
            }
        });

        return pickList;
    }

    /**
     * Confirm a pick list line
     */
    static async confirmPick(lineId: number, actualBinId?: number, actualQty?: number) {
        const line = await (prisma as any).pickListLine.findUnique({ where: { id: lineId } });
        if (!line) throw new Error("Pick line not found");

        return (prisma as any).pickListLine.update({
            where: { id: lineId },
            data: {
                status: 'PICKED',
                pickedAt: new Date(),
                qty: actualQty ?? line.qty,
                sourceBinId: actualBinId ?? line.sourceBinId
            }
        });
    }
}
