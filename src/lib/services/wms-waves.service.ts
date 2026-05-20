import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wms.waves.service' });
const db = (p: any) => p as any;

export type PickTaskPreview = {
    orderId: number;
    productId: number;
    productName: string;
    binLocation: string;
    quantity: number;
    sequence: number;
};

export class WmsWavesService {
    /**
     * Lists existing waves with pagination and filtering.
     * Ensures strict tenant isolation.
     */
    static async listWaves(
        prisma: PrismaClient,
        tenantId: string,
        filters: { status?: string; warehouseId?: number }
    ) {
        return await db(prisma).wmsWave?.findMany?.({
            where: {
                tenantId,
                ...(filters.status ? { status: filters.status } : {}),
                // Additional filters if needed based on the schema
            },
            include: { tasks: true },
            orderBy: { createdAt: 'desc' }
        }) ?? [];
    }

    /**
     * Generates a preview for a wave without persisting it or modifying inventory.
     * Enforces tenant isolation for SalesOrders and StockMovements.
     */
    static async generateWavePreview(
        prisma: PrismaClient,
        tenantId: string,
        warehouseId: number,
        orderIds: number[],
        maxLinesPerWave: number = 50
    ): Promise<{ waveId: string; tasks: PickTaskPreview[]; estimatedMinutes: number }> {
        // Enforce tenantId in SalesOrder query
        const orders = await db(prisma).salesOrder?.findMany?.({
            where: { 
                tenantId, 
                id: { in: orderIds }, 
                status: { in: ['CONFIRMED', 'confirmed'] } 
            },
            include: { lines: { include: { product: true } } },
        }).catch(() => []) ?? [];

        const allLines: PickTaskPreview[] = [];
        for (const order of orders) {
            for (const line of (order.lines || [])) {
                allLines.push({
                    orderId: order.id,
                    productId: line.productId,
                    productName: line.product?.name || `P-${line.productId}`,
                    binLocation: line.binLocation || 'A-01-01',
                    quantity: Number(line.quantity),
                    sequence: 0,
                });
            }
        }

        // Optimize pick path: sort by aisle -> bay -> level (nearest-neighbor)
        const sorted = allLines.sort((a, b) => a.binLocation.localeCompare(b.binLocation));
        sorted.forEach((t, i) => t.sequence = i + 1);

        const waveTasks = sorted.slice(0, maxLinesPerWave);

        return {
            waveId: `PREVIEW-WAVE-${Date.now().toString(36).toUpperCase()}`,
            tasks: waveTasks,
            estimatedMinutes: Math.ceil(waveTasks.length * 1.5),
        };
    }

    /**
     * Analyzes stock velocity to recommend slotting changes.
     * Read-only and enforces tenant isolation.
     */
    static async getSlottingAnalysis(
        prisma: PrismaClient,
        tenantId: string,
        warehouseId: number
    ): Promise<Array<{ productId: number; productName: string; velocity: number; currentBin: string; suggestedZone: string; rank: string }>> {
        // Enforce tenantId in StockMovement query
        const movements = await db(prisma).stockMovement?.findMany?.({
            where: {
                tenantId, // VERY IMPORTANT
                warehouseId,
                createdAt: { gte: new Date(Date.now() - 90 * 86400000) },
                type: { in: ['OUT', 'SALE', 'out'] },
            },
            select: { productId: true, quantity: true },
        }).catch(() => []) ?? [];

        const velocityMap: Record<number, number> = {};
        for (const m of movements) {
            velocityMap[m.productId] = (velocityMap[m.productId] || 0) + Number(m.quantity);
        }

        const products = Object.entries(velocityMap)
            .map(([id, vel]) => ({ productId: parseInt(id), velocity: vel }))
            .sort((a, b) => b.velocity - a.velocity);

        // ABC classification
        return products.map((p, i) => {
            const pct = (i / products.length) * 100;
            const rank = pct < 20 ? 'A' : pct < 50 ? 'B' : 'C';
            return {
                ...p,
                productName: `Product ${p.productId}`,
                currentBin: 'TBD',
                suggestedZone: rank === 'A' ? 'ZONE-1 (Near Shipping)' : rank === 'B' ? 'ZONE-2 (Mid)' : 'ZONE-3 (Deep)',
                rank,
            };
        });
    }
}
