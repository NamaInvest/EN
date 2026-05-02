import { NextResponse } from 'next/server';
import { AllocationEngine } from '@/lib/allocation-engine';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ruleId, fiscalPeriodId } = body;

        if (!ruleId || !fiscalPeriodId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const simulation = await AllocationEngine.simulateAllocation(
            parseInt(ruleId),
            parseInt(fiscalPeriodId)
        );

        return NextResponse.json({ success: true, simulation });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
