import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { AllocationEngine } from '@/lib/allocation-engine';

async function _POST(req: Request) {

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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
