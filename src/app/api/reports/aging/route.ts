import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { AgingEngine } from '@/lib/aging-engine';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'reports.aging' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const type = (req.nextUrl.searchParams.get('type') || 'AR') as 'AR' | 'AP';
    const asOf = req.nextUrl.searchParams.get('asOf');
    const partnerId = req.nextUrl.searchParams.get('partnerId');
    const bucket = req.nextUrl.searchParams.get('bucket');
    try {
        if (partnerId) {
            const details = await AgingEngine.drillDown(prisma, type, parseInt(partnerId), bucket || undefined);
            return NextResponse.json({ details });
        }
        const result = await AgingEngine.calculate(prisma, type, asOf ? new Date(asOf) : undefined);
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
