import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ActivityEngine } from '@/lib/activity-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'crm.activities' });
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

const _POSTSchema = z.object({
  action: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  assignedTo: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'complete') return NextResponse.json(await ActivityEngine.complete(prisma, body.id));
        if (body.action === 'cancel') return NextResponse.json(await ActivityEngine.cancel(prisma, body.id));
        return NextResponse.json(await ActivityEngine.create(prisma, { ...body, assignedTo: body.assignedTo || user.id, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
