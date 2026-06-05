import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * AI Demand Forecaster API
 * GET /api/ai/demand-forecast?productId=X&days=30
 * POST /api/ai/demand-forecast — Batch forecast for all products
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.demand-forecast' });

// Simple moving average + trend forecasting
function movingAverage(data: number[], window: number): number {
    if (data.length === 0) return 0;
    const slice = data.slice(-window);
    return slice.reduce((s: any, v: any) => s + v, 0) / slice.length;
}

function detectTrend(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 3) return 'stable';
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);
    const recentAvg = recent.reduce((s: any, v: any) => s + v, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((s: any, v: any) => s + v, 0) / older.length : recentAvg;
    if (recentAvg > olderAvg * 1.1) return 'up';
    if (recentAvg < olderAvg * 0.9) return 'down';
    return 'stable';
}

async function _GET(req: Request) {
    const prisma = getPrisma(req as any, { requireTenant: true });
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const productId = parseInt(url.searchParams.get('productId') || '0');
    const forecastDays = parseInt(url.searchParams.get('days') || '30');

    if (!productId) return NextResponse.json({ error: 'productId مطلوب' }, { status: 400 });

    try {
        // Get last 90 days of sales for this product
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const details = await prisma.salesInvoiceDetail.findMany({ take: 100,
            where: {
                productId,
                invoice: { date: { gte: ninetyDaysAgo } },
            },
            include: { invoice: { select: { date: true } } },
            orderBy: { invoice: { date: 'asc' } },
        });

        // Group by week
        const weeklyDemand: number[] = [];
        const weekMap: Record<string, number> = {};
        details.forEach((d: any) => {
            const weekKey = getWeekKey(new Date(d.invoice.date));
            weekMap[weekKey] = (weekMap[weekKey] || 0) + n(d.quantity);
        });
        Object.values(weekMap).forEach(v => weeklyDemand.push(v));

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { name: true, currentStock: true, minQuantity: true },
        });

        const avgWeekly = movingAverage(weeklyDemand, 4);
        const trend = detectTrend(weeklyDemand);
        const trendMultiplier = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1.0;
        const forecastedDemand = Math.ceil(avgWeekly * trendMultiplier * (forecastDays / 7));
        const currentStock = n(product?.currentStock);
        const stockWillLast = avgWeekly > 0 ? Math.floor((currentStock / avgWeekly) * 7) : 999;
        const recommendedOrder = Math.max(0, forecastedDemand - currentStock + n(product?.minQuantity));

        return NextResponse.json({
            product: { id: productId, name: product?.name, currentStock },
            forecast: {
                period: `${forecastDays} يوم`,
                forecastedDemand,
                avgWeeklySales: Math.round(avgWeekly * 10) / 10,
                trend,
                trendLabel: trend === 'up' ? '📈 تصاعدي' : trend === 'down' ? '📉 تنازلي' : '➡️ مستقر',
                stockWillLastDays: stockWillLast,
                recommendedOrder,
                urgency: stockWillLast < 14 ? 'critical' : stockWillLast < 30 ? 'soon' : 'ok',
            },
            weeklyHistory: weeklyDemand.slice(-8),
        });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في التنبؤ' }, { status: 500 });
    }
}

async function _POST(req: Request) {
    const prisma = getPrisma(req as any, { requireTenant: true });
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        // Get top 20 products by sales volume
        const topProducts = await prisma.salesInvoiceDetail.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 20,
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const forecasts = await Promise.all(
            topProducts.map(async (tp: any) => {
                const product = await prisma.product.findUnique({
                    where: { id: tp.productId },
                    select: { name: true, currentStock: true, minQuantity: true },
                });
                const avgDaily = n(tp._sum?.quantity) / 90;
                const forecastedDemand = Math.ceil(avgDaily * 30);
                const currentStock = n(product?.currentStock);
                const stockWillLast = avgDaily > 0 ? Math.floor(currentStock / avgDaily) : 999;
                return {
                    productId: tp.productId,
                    productName: product?.name,
                    currentStock,
                    forecastedDemand30Days: forecastedDemand,
                    stockWillLastDays: stockWillLast,
                    urgency: stockWillLast < 14 ? 'critical' : stockWillLast < 30 ? 'soon' : 'ok',
                };
            })
        );

        const critical = forecasts.filter((f: any) => f.urgency === 'critical');
        return NextResponse.json({
            total: forecasts.length,
            critical: critical.length,
            forecasts: forecasts.sort((a: any, b: any) => a.stockWillLastDays - b.stockWillLastDays),
        });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في التنبؤ الجماعي' }, { status: 500 });
    }
}

function getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AI' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
