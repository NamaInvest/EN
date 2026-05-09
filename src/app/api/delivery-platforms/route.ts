import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') || 'unknown';
        const body = await request.json();
        const orderId = body.order_id || body.orderId || body.id || '';
        console.log(`[Delivery] Order from ${platform}: ${orderId}`);
        return NextResponse.json({ ok: true, platform, orderId });
    } catch (e: any) {
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

async function _GET() {

    return NextResponse.json({
        platforms: [
            { id: 'jahez', name: 'جاهز', status: 'ready' },
            { id: 'hungerstation', name: 'هنقرستيشن', status: 'ready' },
            { id: 'mrsool', name: 'مرسول', status: 'ready' },
            { id: 'toyou', name: 'تويو', status: 'ready' },
        ],
    });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
