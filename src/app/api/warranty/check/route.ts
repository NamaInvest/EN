import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RmaEngine } from '@/lib/rma-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'warranty.check' });

async function _GET(req: NextRequest) {

    try {
        const url = new URL(req.url);
        const serialNumber = url.searchParams.get('serialNumber');
        if (!serialNumber) {
            return NextResponse.json({ error: 'Missing serialNumber' }, { status: 400 });
        }
        
        const claim = await RmaEngine.checkWarranty(serialNumber);
        return NextResponse.json(claim);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
