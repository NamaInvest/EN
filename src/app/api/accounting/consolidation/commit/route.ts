import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ConsolidationEngine } from '@/lib/consolidation-engine';

async function _POST(req: Request) {

    try {
        const body = await req.json();
        const { runId } = body;

        if (!runId) {
            return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
        }

        const run = await ConsolidationEngine.postConsolidation(parseInt(runId));

        return NextResponse.json({ success: true, run });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
