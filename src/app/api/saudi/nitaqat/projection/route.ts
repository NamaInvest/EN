import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Nitaqat Projection API
 * POST /api/saudi/nitaqat/projection — Project impact of hiring changes
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { computeSaudizationPct, projectImpact } from '@/lib/qiwa-engine';

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const saudiHires = body.saudiHires || 0;
        const expatHires = body.expatHires || 0;
        const activityCode = body.activityCode || 'DEFAULT';

        const { total, saudi } = await computeSaudizationPct(prisma);
        const projection = projectImpact(total, saudi, saudiHires, expatHires, activityCode);

        return NextResponse.json({
            current: { total, saudi },
            projection,
            recommendation: !projection.improvement
                ? `⚠️ هذا التوظيف سيخفض النطاق من ${projection.currentBand} إلى ${projection.projectedBand}`
                : `✅ النطاق سيتحسن/يبقى: ${projection.projectedBand}`,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
