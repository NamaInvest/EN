import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ActivityEngine } from '@/lib/activity-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const type = req.nextUrl.searchParams.get('type') || undefined;
    const view = req.nextUrl.searchParams.get('view');
    try {
        if (view === 'overdue') return NextResponse.json(await ActivityEngine.getOverdue(prisma, user.tenantId || ''));
        if (view === 'today') return NextResponse.json({ count: await ActivityEngine.getTodayCount(prisma, user.tenantId || '', user.id) });
        return NextResponse.json(await ActivityEngine.list(prisma, user.tenantId || '', { userId: user.id, type: type }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'complete') return NextResponse.json(await ActivityEngine.complete(prisma, body.id));
        if (body.action === 'cancel') return NextResponse.json(await ActivityEngine.cancel(prisma, body.id));
        return NextResponse.json(await ActivityEngine.create(prisma, { ...body, assignedTo: body.assignedTo || user.id, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
