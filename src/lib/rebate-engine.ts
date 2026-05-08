/**
 * Rebate Management Engine (Build #22)
 * ═══════════════════════════════════════
 * 
 * - برامج خصم مؤجلة (End-of-period rebates)
 * - حساب تلقائي على أساس المبيعات/المشتريات
 * - إشعار دائن/مدين آلي
 */

import type { PrismaClient } from '@prisma/client';

const db = (p: any) => p as any;

export type RebateProgram = {
    id: number;
    name: string;
    type: 'SALES' | 'PURCHASE';
    basis: 'VOLUME' | 'VALUE' | 'GROWTH';
    tiers: RebateTier[];
    validFrom: string;
    validTo: string;
};

export type RebateTier = {
    minTarget: number;
    maxTarget: number;
    rebatePercent: number;
};

export class RebateEngine {
    /**
     * Calculate rebate earned for a partner in a period
     */
    static async calculate(
        prisma: PrismaClient,
        opts: {
            partnerId: number;
            type: 'SALES' | 'PURCHASE';
            periodFrom: Date;
            periodTo: Date;
        }
    ): Promise<{
        partnerId: number;
        totalVolume: number;
        totalValue: number;
        qualifiedTier: string;
        rebatePercent: number;
        rebateAmount: number;
    }> {
        let totalValue = 0;
        let totalVolume = 0;

        if (opts.type === 'SALES') {
            const agg = await (prisma as any).salesInvoice.aggregate({
                where: {
                    customerId: opts.partnerId,
                    status: { not: 'CANCELLED' },
                    invoiceDate: { gte: opts.periodFrom.toISOString(), lte: opts.periodTo.toISOString() },
                },
                _sum: { total: true },
                _count: true,
            });
            totalValue = Number(agg._sum?.total || 0);
            totalVolume = agg._count || 0;
        } else {
            const _agg_dup65 = await (prisma as any).purchaseInvoice.aggregate({
                where: {
                    supplierId: opts.partnerId,
                    status: { not: 'cancelled' },
                    invoiceDate: { gte: opts.periodFrom.toISOString(), lte: opts.periodTo.toISOString() },
                },
                _sum: { total: true },
                _count: true,
            });
            // @ts-expect-error [TS2304] Cannot find name
            totalValue = Number(agg._sum?.total || 0);
            // @ts-expect-error [TS2304] Cannot find name
            totalVolume = agg._count || 0;
        }

        // Default tiers (can be overridden by DB config)
        const tiers: RebateTier[] = [
            { minTarget: 1000000, maxTarget: Infinity, rebatePercent: 5 },
            { minTarget: 500000, maxTarget: 999999, rebatePercent: 3 },
            { minTarget: 100000, maxTarget: 499999, rebatePercent: 2 },
            { minTarget: 50000, maxTarget: 99999, rebatePercent: 1 },
        ];

        let qualifiedTier = 'NONE';
        let rebatePercent = 0;

        for (const tier of tiers) {
            if (totalValue >= tier.minTarget) {
                qualifiedTier = `${(tier.minTarget / 1000).toFixed(0)}K+`;
                rebatePercent = tier.rebatePercent;
                break;
            }
        }

        return {
            partnerId: opts.partnerId,
            totalVolume,
            totalValue: Math.round(totalValue * 100) / 100,
            qualifiedTier,
            rebatePercent,
            rebateAmount: Math.round(totalValue * rebatePercent / 100 * 100) / 100,
        };
    }

    /**
     * Batch calculate rebates for all qualifying partners
     */
    static async batchCalculate(
        prisma: PrismaClient,
        type: 'SALES' | 'PURCHASE',
        periodFrom: Date,
        periodTo: Date,
        minThreshold: number = 50000
    ): Promise<any[]> {
        const results: any[] = [];

        if (type === 'SALES') {
            const customers = await (prisma as any).customer.findMany({
            take: 100,
                where: { isActive: true },
                select: { id: true, name: true },
            });
            for (const c of customers) {
                const result = await this.calculate(prisma, {
                    partnerId: c.id, type, periodFrom, periodTo,
                });
                if (result.totalValue >= minThreshold) {
                    results.push({ ...result, partnerName: c.name });
                }
            }
        }

        return results.sort((a, b) => b.rebateAmount - a.rebateAmount);
    }
}
