import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Rebate Management API
 * POST /api/rebates — Calculate or batch-calculate rebates
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { RebateEngine } from '@/lib/rebate-engine';

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        if (body.action === 'batch') {
            const results = await RebateEngine.batchCalculate(
                prisma,
                body.type || 'SALES',
                new Date(body.periodFrom || new Date(Date.now() - 90 * 86400000)),
                new Date(body.periodTo || new Date()),
                body.minThreshold || 50000
            );
            return NextResponse.json(results);
        }

        if (!body.partnerId) return NextResponse.json({ error: 'مطلوب: partnerId' }, { status: 400 });
        const result = await RebateEngine.calculate(prisma, {
            partnerId: body.partnerId,
            type: body.type || 'SALES',
            periodFrom: new Date(body.periodFrom || new Date(Date.now() - 90 * 86400000)),
            periodTo: new Date(body.periodTo || new Date()),
        });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
