import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { QualityInspectionEngine } from '@/lib/quality-inspection-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.quality' });
async function _GET(req: NextRequest) {
    const tenantId = requireTenantId(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'dashboard') return NextResponse.json(await QualityInspectionEngine.dashboard(prisma));
        const productId = req.nextUrl.searchParams.get('productId');
        return NextResponse.json(await QualityInspectionEngine.getHistory(prisma, productId ? parseInt(productId) : undefined));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'create_plan') return NextResponse.json(await QualityInspectionEngine.createPlan(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'record') return NextResponse.json(await QualityInspectionEngine.recordResult(prisma, { ...body, inspectedBy: (user as any).id, tenantId: (user as any).tenantId || '' }));
        return NextResponse.json({ error: 'action: create_plan | record' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
