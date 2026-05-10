import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'finance.period-close' });

async function _GET(req: Request) {

    try {
        const { searchParams } = new URL(req.url);
        const periodId = searchParams.get('periodId');
        
        if (!periodId) {
            // return latest period close checklist
            const latest = await prisma.periodCloseChecklist.findMany({
                include: { fiscalPeriod: true },
                orderBy: { id: 'desc' },
                take: 10
            });
            return NextResponse.json(latest);
        }

        const checklist = await prisma.periodCloseChecklist.findMany({
            take: 100,
            where: { fiscalPeriodId: parseInt(periodId) },
            orderBy: { sequence: 'asc' },
            include: { fiscalPeriod: true }
        });

        return NextResponse.json(checklist);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  fiscalPeriodId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

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

        const created = await prisma.$transaction(
            templates.map(t => prisma.periodCloseChecklist.create({
                data: {
                    fiscalPeriodId: parseInt(fiscalPeriodId),
                    taskName: t.taskName,
                    sequence: t.sequence,
                    owner: t.owner,
                    status: 'PENDING'
                }
            }))
        );

        return NextResponse.json(created);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
