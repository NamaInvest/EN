import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'lot-engine' });

export class LotEngine {

    /**
     * Alert batches expiring soon (within days)
     */
    static async getExpiringBatches(daysThreshold = 90) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        return prisma.productBatch.findMany({
            take: 100,
            // @ts-ignore
            where: {
                status: 'AVAILABLE',
                expiryDate: {
                    lte: thresholdDate,
                    not: null
                },
                currentQuantity: { gt: 0 }
            } as any,
            include: { product: true }
        });
    }

    /**
     * Quarantine a batch
     */
    static async quarantineBatch(batchId: number, reason: string) {
        return prisma.productBatch.update({
            where: { id: batchId },
            data: {
                status: 'QUARANTINED',
                quarantineReason: reason
            } as any
        });
    }

    /**
     * Release a batch from quarantine
     */
    static async releaseFromQuarantine(batchId: number) {
        return prisma.productBatch.update({
            where: { id: batchId },
            data: {
                status: 'AVAILABLE',
                quarantineReason: null
            } as any
        });
    }

    /**
     * Recall a batch
     */
    static async recallBatch(batchId: number, reason: string) {
        // Also could create a negative stock movement
        return prisma.productBatch.update({
            where: { id: batchId },
            data: {
                status: 'RECALLED',
                recallReason: reason,
                recalledAt: new Date()
            } as any
        });
    }
}
