import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ContractEngine } from '@/lib/contract-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'contracts' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'summary') return NextResponse.json(await ContractEngine.summary(prisma));
        if (view === 'expiring') return NextResponse.json(await ContractEngine.getExpiring(prisma));
        return NextResponse.json(await ContractEngine.list(prisma, req.nextUrl.searchParams.get('status') || undefined));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  contractId: z.union([z.string(), z.number()]).optional(),
  newEndDate: z.string().optional(),
  newValue: z.any().optional(),
  reason: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'create') return NextResponse.json(await ContractEngine.create(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'renew') return NextResponse.json(await ContractEngine.renew(prisma, body.contractId, new Date(body.newEndDate), body.newValue));
        if (body.action === 'terminate') return NextResponse.json(await ContractEngine.terminate(prisma, body.contractId, body.reason));
        return NextResponse.json({ error: 'action: create | renew | terminate' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
