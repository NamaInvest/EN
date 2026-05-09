import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { WmsEngine } from '@/lib/wms-engine';

async function _GET(req: NextRequest) {

    try {
        const url = new URL(req.url);
        const productId = parseInt(url.searchParams.get('productId') || '0', 10);
        const qty = parseFloat(url.searchParams.get('qty') || '1');
        const stockId = parseInt(url.searchParams.get('stockId') || '0', 10);

        const bin = await WmsEngine.suggestPutaway(productId, qty, stockId);
        return NextResponse.json(bin);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
