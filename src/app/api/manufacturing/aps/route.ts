import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * APS Scheduling API
 * GET /api/manufacturing/aps — Run finite capacity scheduling
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { APSScheduler } from '@/lib/aps-scheduler';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.aps' });

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const horizon = parseInt(req.nextUrl.searchParams.get('days') || '14');
        const result = await APSScheduler.schedule(prisma, horizon);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
