/**
 * Sales Forecast Engine (Build #23)
 * ═══════════════════════════════════
 * 
 * - توقع المبيعات بناءً على البيانات التاريخية
 * - Moving Average + Exponential Smoothing
 * - Pipeline analysis من CRM
 */

import type { PrismaClient } from '@prisma/client';

export type ForecastPeriod = {
    period: string;         // YYYY-MM
    actualSales: number;
    forecastSales: number;
    variance: number;
    variancePct: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
};

export class SalesForecastEngine {
    /**
     * Generate monthly sales forecast using moving average
     */
    static async forecast(
        prisma: PrismaClient,
        months: number = 6,
        lookbackMonths: number = 12
    ): Promise<{ historical: ForecastPeriod[]; forecast: ForecastPeriod[] }> {
        const now = new Date();
        const historical: ForecastPeriod[] = [];

        // Get historical monthly totals
        for (let i = lookbackMonths; i >= 1; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const agg = await (prisma as any).salesInvoice.aggregate({
                where: {
                    status: { not: 'CANCELLED' },
                    invoiceDate: {
                        gte: monthStart.toISOString(),
                        lte: monthEnd.toISOString(),
                    },
                },
                _sum: { total: true },
            });

            historical.push({
                period: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
                actualSales: Number(agg._sum?.total || 0),
                forecastSales: 0,
                variance: 0,
                variancePct: 0,
                confidence: 'HIGH',
            });
        }

        // Simple Moving Average (3-month window)
        const values = historical.map(h => h.actualSales);
        const windowSize = Math.min(3, values.length);

        // Apply forecast to historical (for accuracy tracking)
        for (let i = windowSize; i < values.length; i++) {
            const window = values.slice(i - windowSize, i);
            const avg = window.reduce((a: any, b: any) => a + b, 0) / windowSize;
            historical[i].forecastSales = Math.round(avg * 100) / 100;
            historical[i].variance = historical[i].actualSales - avg;
            historical[i].variancePct = avg > 0 ? Math.round((historical[i].variance / avg) * 10000) / 100 : 0;
        }

        // Generate future forecast with exponential smoothing
        const alpha = 0.3; // smoothing factor
        const forecast: ForecastPeriod[] = [];
        let lastSmoothed = values[values.length - 1] || 0;

        for (let i = 0; i < months; i++) {
            const futureDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
            const period = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

            // Seasonal adjustment (simple: same month last year ratio)
            const sameMonthLY = historical.find(h => {
                const [y, m] = h.period.split('-');
                return parseInt(m) === futureDate.getMonth() + 1;
            });
            const seasonalFactor = sameMonthLY && lastSmoothed > 0
                ? sameMonthLY.actualSales / lastSmoothed
                : 1;

            const forecastValue = lastSmoothed * (1 + (seasonalFactor - 1) * 0.5);
            lastSmoothed = alpha * forecastValue + (1 - alpha) * lastSmoothed;

            forecast.push({
                period,
                actualSales: 0,
                forecastSales: Math.round(forecastValue * 100) / 100,
                variance: 0,
                variancePct: 0,
                confidence: i < 2 ? 'HIGH' : i < 4 ? 'MEDIUM' : 'LOW',
            });
        }

        return { historical, forecast };
    }

    /**
     * Pipeline summary from CRM leads
     */
    static async pipelineSummary(prisma: PrismaClient): Promise<{
        totalPipeline: number;
        weightedPipeline: number;
        stages: Array<{ stage: string; count: number; value: number }>;
    }> {
        const leads = await (prisma as any).lead.findMany({
            take: 100,
            where: { status: { notIn: ['WON', 'LOST'] } },
            select: { status: true, expectedRevenue: true },
        });

        const stageWeights: Record<string, number> = {
            'NEW': 0.1, 'QUALIFIED': 0.25, 'PROPOSAL': 0.5,
            'NEGOTIATION': 0.75, 'CLOSING': 0.9,
        };

        const stageMap: Record<string, { count: number; value: number }> = {};
        let totalPipeline = 0;
        let weightedPipeline = 0;

        for (const lead of leads) {
            const stage = (lead as any).status || 'NEW';
            const value = Number((lead as any).expectedRevenue || 0);
            totalPipeline += value;
            weightedPipeline += value * (stageWeights[stage] || 0.1);

            if (!stageMap[stage]) stageMap[stage] = { count: 0, value: 0 };
            stageMap[stage].count++;
            stageMap[stage].value += value;
        }

        return {
            totalPipeline: Math.round(totalPipeline),
            weightedPipeline: Math.round(weightedPipeline),
            stages: Object.entries(stageMap).map(([stage, data]) => ({
                stage, ...data,
            })),
        };
    }
}
