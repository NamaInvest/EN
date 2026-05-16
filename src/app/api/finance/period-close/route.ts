import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

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
                take: 10
            });
            return NextResponse.json(latest);
        }

        const checklist = await prisma.periodCloseChecklist.findMany({ 
            take: 100,
            where: { fiscalPeriodId: parseInt(periodId), ...requireTenantFilter({ tenantId }) },
            orderBy: { sequence: 'asc' },
            include: { fiscalPeriod: true }
        });

        return NextResponse.json(checklist);
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

        // Default templates
        const templates = [
            { taskName: 'Reconcile bank', sequence: 1, owner: 'AR Lead' },
            { taskName: 'Recon AR aging', sequence: 2, owner: 'AR Lead' },
            { taskName: 'Recon AP aging', sequence: 3, owner: 'AP Lead' },
            { taskName: 'Run depreciation', sequence: 4, owner: 'Asset Acc' },
            { taskName: 'FX revaluation', sequence: 5, owner: 'Treasury' },
            { taskName: 'Accruals', sequence: 6, owner: 'Senior Acc' },
            { taskName: 'Inventory cutoff', sequence: 7, owner: 'Inv Mgr' },
            { taskName: 'Variance review', sequence: 8, owner: 'Controller' },
        ];

        const created = await runFinancialTx(prisma, async (tx) => {
            const checklist = await tx.periodCloseChecklist.createMany({
                data: templates.map(t => ({
                    tenantId,
                    fiscalPeriodId: parseInt(fiscalPeriodId),
                    taskName: t.taskName,
                    sequence: t.sequence,
                    owner: t.owner,
                    status: 'PENDING'
                }))
            });
            return checklist;
        }, 'PERIOD_CLOSE_CHECKLIST_INIT');

        return NextResponse.json({ count: created.count });
    } catch (error: any) {
        log.error('finance.period-close.POST', { error: error instanceof Error ? error.message : error, tenantId });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL' });

