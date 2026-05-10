import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'treasury.cash-position' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const asOf = searchParams.get('asOf');

        let snapshot;
        
        if (asOf) {
            const date = new Date(asOf);
            // Get the closest snapshot before or on that date
            snapshot = await prisma.cashPositionSnapshot.findFirst({
                where: { tenantId, capturedAt: { lte: date } },
                orderBy: { capturedAt: 'desc' }
            });
        } else {
            // Get the latest
            snapshot = await prisma.cashPositionSnapshot.findFirst({
                where: { tenantId },
                orderBy: { capturedAt: 'desc' }
            });
        }

        return NextResponse.json(snapshot || { error: 'No snapshots found' });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
