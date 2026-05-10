import { PrismaClient } from '@prisma/client';
import { n } from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'picking-fefo' });

export interface FefoAllocationResult {
    batchId: number;
    batchNumber: string;
    expiryDate: Date | null;
    allocatedQty: number;
}

export async function allocateFEFO(
    prisma: PrismaClient,
    productId: number,
    requiredQty: number,
    graceDays: number = 7
): Promise<FefoAllocationResult[]> {
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() + graceDays);

    // Fetch available batches ordered by expiry date ascending (First Expire First Out)
    // Only fetch batches where status is AVAILABLE and currentQuantity > 0
    // Skip batches that are expiring within the grace period
    const batches = await prisma.productBatch.findMany({
            take: 100,
        where: {
            productId: productId,
            status: 'AVAILABLE',
            currentQuantity: { gt: 0 },
            OR: [
                { expiryDate: { gt: cutoffDate } },
                { expiryDate: null } // Handle items without expiry
            ]
        },
        orderBy: [
            { expiryDate: 'asc' }, // FEFO prioritization
            { createdAt: 'asc' }   // Fallback to FIFO
        ]
    });

    let remainingQty = requiredQty;
    const allocation: FefoAllocationResult[] = [];

    for (const batch of batches) {
        if (remainingQty <= 0) break;

        const available = n(batch.currentQuantity);
        const toAllocate = Math.min(available, remainingQty);

        allocation.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            allocatedQty: toAllocate
        });

        remainingQty -= toAllocate;
    }

    if (remainingQty > 0) {
        throw new Error(`Insufficient FEFO compliant stock for Product ID ${productId}. Missing ${remainingQty} units.`);
    }

    return allocation;
}
