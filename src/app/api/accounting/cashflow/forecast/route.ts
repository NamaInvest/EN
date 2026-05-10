import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { CashFlowEngine } from '@/lib/cashflow-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.cashflow.forecast' });

async function _GET(req: Request) {

    try {
        const { searchParams } = new URL(req.url);
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam, 10) : 30;

        const data = await CashFlowEngine.generateForecast(days);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
