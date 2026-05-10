import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { IntercompanyEngine } from '@/lib/intercompany-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.intercompany' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');
    try {
        if (view === 'rules') return NextResponse.json(await IntercompanyEngine.getRules(prisma));
        if (view === 'balance') return NextResponse.json(await IntercompanyEngine.getBalance(prisma));
        return NextResponse.json(await IntercompanyEngine.getTransactions(prisma));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

const _POSTSchema = z.object({
  action: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
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
        if (body.action === 'create_rule') return NextResponse.json(await IntercompanyEngine.createRule(prisma, body));
        if (body.action === 'reconcile') return NextResponse.json(await IntercompanyEngine.reconcile(prisma, body.id));
        return NextResponse.json(await IntercompanyEngine.processInvoice(prisma, body));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
