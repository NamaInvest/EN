import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MPSEngine } from '@/lib/mps-engine';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const mps = await MPSEngine.generateMPS(body.period, body.demandData);
        return NextResponse.json(mps);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
