import { getUserFromRequest } from '@/lib/auth';
/**
 * Vendor Scorecard API
 * GET  /api/vendors/scorecard?supplierId=X — Score one vendor
 * GET  /api/vendors/scorecard?action=rank — Rank all vendors
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { VendorScorecardEngine } from '@/lib/vendor-scorecard';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const action = req.nextUrl.searchParams.get('action');
    const supplierId = req.nextUrl.searchParams.get('supplierId');

    try {
        if (action === 'rank') {
            const rankings = await VendorScorecardEngine.rankAll(prisma);
            return NextResponse.json(rankings);
        }

        if (supplierId) {
            const score = await VendorScorecardEngine.evaluate(prisma, parseInt(supplierId));
            return NextResponse.json(score);
        }

        return NextResponse.json({ error: 'مطلوب: supplierId أو action=rank' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
