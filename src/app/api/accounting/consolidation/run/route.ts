import { NextResponse } from 'next/server';
import { ConsolidationEngine } from '@/lib/consolidation-engine';

export async function POST(req: Request) {

    try {
        const body = await req.json();
        const { groupId, fiscalPeriodId, userId } = body;

        if (!groupId || !fiscalPeriodId || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const run = await ConsolidationEngine.runConsolidation(
            parseInt(groupId),
            parseInt(fiscalPeriodId),
            userId.toString()
        );

        return NextResponse.json({ success: true, run });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
