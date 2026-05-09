/**
 * CO-PA Allocation Run API
 * POST /api/copa/allocations — Run allocation rule for a period
 * GET  /api/copa/allocations — List allocation rules
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { runAllocation } from '@/lib/copa-engine';

async function _POST(req: NextRequest) {

    try {
        const prisma = await getPrisma(req);
        const body = await req.json();

        if (!body.ruleId || !body.periodFrom || !body.periodTo) {
            return NextResponse.json({ error: 'مطلوب: ruleId, periodFrom, periodTo' }, { status: 400 });
        }

        const result = await runAllocation(
            prisma,
            body.ruleId,
            new Date(body.periodFrom),
            new Date(body.periodTo)
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ allocated: result.allocated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _GET(req: NextRequest) {

    try {
        const prisma = await getPrisma(req);
        const rules = await prisma.copaAllocationRule.findMany({
            take: 100,
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(rules);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
