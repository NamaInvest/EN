import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { DunningEngine } from '@/lib/dunning-engine';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const date = body.date ? new Date(body.date) : new Date();
        
        await DunningEngine.executeDailyRun(date);
        
        return NextResponse.json({ message: 'Dunning daily run completed successfully', date });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
