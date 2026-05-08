import { NextResponse } from 'next/server';
import { CashFlowEngine } from '@/lib/cashflow-engine';

export async function GET(req: Request) {

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
