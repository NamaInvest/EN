import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ExpenseReportEngine } from '@/lib/expense-report-engine';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.expense-reports' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req);
    const id = req.nextUrl.searchParams.get('id');
    try {
        if (id) return NextResponse.json(await ExpenseReportEngine.getById(prisma, parseInt(id), tenantId));
        return NextResponse.json(await ExpenseReportEngine.list(prisma, tenantId));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = requireTenantId(req as any);
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'submit') return NextResponse.json(await ExpenseReportEngine.submit(prisma, body.id, tenantId));
        if (body.action === 'approve') return NextResponse.json(await ExpenseReportEngine.approve(prisma, body.id, user.id, tenantId));
        if (body.action === 'reject') return NextResponse.json(await ExpenseReportEngine.reject(prisma, body.id, tenantId));
        return NextResponse.json(await ExpenseReportEngine.create(prisma, { ...body, tenantId }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
