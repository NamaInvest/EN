import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'delivery-platforms' });

const _POSTSchema = z.object({
  order_id: z.union([z.string(), z.number()]).optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') || 'unknown';
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const orderId = body.order_id || body.orderId || body.id || '';
        log.info(`[Delivery] Order from ${platform}: ${orderId}`);
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
