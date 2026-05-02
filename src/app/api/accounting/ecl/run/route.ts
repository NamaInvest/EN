import { NextResponse } from 'next/server';
import { IFRS9Engine } from '@/lib/ifrs9-ecl';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { fiscalPeriodId, asOfDate, userId } = body;

        if (!fiscalPeriodId || !asOfDate || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const result = await IFRS9Engine.runPortfolioECL(
            parseInt(fiscalPeriodId),
            new Date(asOfDate),
            userId.toString()
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
