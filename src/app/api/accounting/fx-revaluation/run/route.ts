import { NextResponse } from 'next/server';
import { FxRevaluationEngine } from '@/lib/fx-revaluation';

export async function POST(req: Request) {

    try {
        const body = await req.json();
        const { fiscalPeriodId, baseCurrencyCode, periodEndDate, userId } = body;

        if (!fiscalPeriodId || !baseCurrencyCode || !periodEndDate || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const runRecord = await FxRevaluationEngine.runRevaluation(
            parseInt(fiscalPeriodId),
            baseCurrencyCode,
            new Date(periodEndDate),
            userId.toString()
        );

        return NextResponse.json({ success: true, run: runRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
