import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { CRMEngine } from '@/lib/crm-engine';

async function _GET(req: NextRequest) {

    try {
        const { searchParams } = new URL(req.url);
        const ownerId = searchParams.get('ownerId') ? parseInt(searchParams.get('ownerId') as string, 10) : undefined;
        
        const forecast = await CRMEngine.forecastPipeline(ownerId);
        return NextResponse.json(forecast);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
