import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Vendor Scorecard API
 * GET  /api/vendors/scorecard?supplierId=X — Score one vendor
 * GET  /api/vendors/scorecard?action=rank — Rank all vendors
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { VendorScorecardEngine } from '@/lib/vendor-scorecard';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'vendors.scorecard' });

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const action = req.nextUrl.searchParams.get('action');
    const supplierId = req.nextUrl.searchParams.get('supplierId');

    try {
        if (action === 'rank') {
            const rankings = await VendorScorecardEngine.rankAll(prisma, user.tenantId || 'default');
            return NextResponse.json(rankings);
        }

        if (supplierId) {
            const score = await VendorScorecardEngine.evaluate(prisma, parseInt(supplierId), user.tenantId || 'default');
            return NextResponse.json(score);
        }

        return NextResponse.json({ error: 'مطلوب: supplierId أو action=rank' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
