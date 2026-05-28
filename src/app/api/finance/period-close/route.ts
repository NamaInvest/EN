import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { closeApi } from '@/lib/close';

const log = logger.child({ service: 'finance.period-close' });

async function _GET(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const { searchParams } = new URL(req.url);
        const periodId = searchParams.get('periodId');
        
        if (!periodId) {
            // return latest period close checklist
            const latest = await prisma.periodCloseChecklist.findMany({
                where: requireTenantFilter({ tenantId }),
                include: { fiscalPeriod: true },
                orderBy: { id: 'desc' },
                take: 20
            });
            return NextResponse.json(latest);
        }

        // Retrieve status from standard SOCPA facade
        const status = await closeApi(prisma as any).period.getStatus(Number(periodId), tenantId);
        return NextResponse.json(status.tasks);
    } catch (error: any) {
        log.error('finance.period-close.GET', { error: error instanceof Error ? error.message : error, tenantId });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { fiscalPeriodId } = body;

        if (!fiscalPeriodId) {
            return NextResponse.json({ error: 'fiscalPeriodId required' }, { status: 400 });
        }

        // Use unified closeApi month-end task initialization
        const count = await closeApi(prisma as any).period.initTasks(Number(fiscalPeriodId), tenantId);

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: auth?.userId || 1,
                action: 'PERIOD_CHECKLIST_INIT',
                entityType: 'PeriodCloseChecklist',
                entityId: String(fiscalPeriodId),
                details: 'تم تهيئة مهام إغلاق الفترة المالية لـ SOCPA',
                newData: { count }
            }
        });

        return NextResponse.json({ count });
    } catch (error: any) {
        log.error('finance.period-close.POST', { error: error instanceof Error ? error.message : error, tenantId });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL' });
