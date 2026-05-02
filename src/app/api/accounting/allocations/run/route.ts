import { NextResponse } from 'next/server';
import { AllocationEngine } from '@/lib/allocation-engine';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ruleId, fiscalPeriodId, userId } = body;

        if (!ruleId || !fiscalPeriodId || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const runRecord = await AllocationEngine.runAllocation(
            parseInt(ruleId),
            parseInt(fiscalPeriodId),
            userId.toString()
        );

        return NextResponse.json({ success: true, run: runRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
