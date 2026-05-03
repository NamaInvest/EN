/**
 * Cash Flow Forecasting API Routes
 * GET  — Fetch latest forecast / historical
 * POST — Generate new forecast
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { CashFlowForecastingEngine } from '@/lib/cash-flow-forecasting';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action') || 'latest';

        if (action === 'latest') {
            const forecast = await CashFlowForecastingEngine.getLatestForecast();
            return NextResponse.json({ success: true, forecast });
        }

        if (action === 'history') {
            const forecasts = await (prisma as any).cashFlowForecast.findMany({
                orderBy: { forecastDate: 'desc' },
                take: 20,
                select: {
                    id: true, forecastDate: true, period: true, scenario: true,
                    inflows: true, outflows: true, netPosition: true,
                    openingBalance: true, closingBalance: true, createdAt: true
                }
            });
            return NextResponse.json({ success: true, forecasts });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { period = 'MONTHLY', scenario = 'REALISTIC', horizonMonths = 3, action } = body;

        if (action === 'compare') {
            const comparison = await CashFlowForecastingEngine.compareScenarios(period, horizonMonths);
            return NextResponse.json({ success: true, comparison });
        }

        const forecast = await CashFlowForecastingEngine.generateForecast(
            period, new Date(), scenario, horizonMonths
        );

        return NextResponse.json({ success: true, forecast });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
