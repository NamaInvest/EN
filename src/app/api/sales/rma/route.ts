import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RmaEngine } from '@/lib/rma-engine';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const rma = await RmaEngine.requestRma(body);
        return NextResponse.json(rma);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
