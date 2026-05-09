import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { MESEngine } from '@/lib/mes-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const wcId = req.nextUrl.searchParams.get('workCenterId');
    try {
        if (wcId) {
            const oee = await MESEngine.calculateOEE(prisma, parseInt(wcId));
            return NextResponse.json(oee);
        }
        const plant = await MESEngine.plantOEE(prisma);
        return NextResponse.json(plant);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
