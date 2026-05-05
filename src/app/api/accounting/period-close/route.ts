import { NextRequest, NextResponse } from 'next/server';
import { PeriodCloseEngine } from '@/lib/period-close-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, year, month, exchangeRate, currencyId, userId } = body;

        let result;
        if (action === 'fx_reval') {
            result = await PeriodCloseEngine.runFXRevaluation(year, month, exchangeRate, currencyId);
        } else if (action === 'depreciation') {
            result = await PeriodCloseEngine.runDepreciation(year, month);
        } else if (action === 'close_period') {
            result = await PeriodCloseEngine.closePeriod(year, month, userId || 1);
        } else if (action === 'close_year') {
            result = await PeriodCloseEngine.closeYear(year, 1, userId || 1); // 1 = Retained earnings dummy
        } else {
            throw new Error('Invalid action');
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
