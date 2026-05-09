import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { LotEngine } from '@/lib/lot-engine';

async function _GET(req: NextRequest) {

    try {
        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '90', 10);
        const batches = await LotEngine.getExpiringBatches(days);
        return NextResponse.json(batches);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
