/**
 * Sales Forecast API
 * GET /api/sales/forecast — Monthly forecast + pipeline
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { SalesForecastEngine } from '@/lib/sales-forecast';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');

    try {
        if (view === 'pipeline') {
            const pipeline = await SalesForecastEngine.pipelineSummary(prisma);
            return NextResponse.json(pipeline);
        }

        const months = parseInt(req.nextUrl.searchParams.get('months') || '6');
        const lookback = parseInt(req.nextUrl.searchParams.get('lookback') || '12');
        const forecast = await SalesForecastEngine.forecast(prisma, months, lookback);
        return NextResponse.json(forecast);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
