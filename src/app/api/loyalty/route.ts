import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'loyalty' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const loyalties = await prisma.loyaltyPoint.findMany({ take: 100,
            include: { customer: { select: { name: true, phone: true } } },
            orderBy: { points: 'desc' }
        });
        return NextResponse.json(loyalties);
    } catch (error: any) {
        log.error('Error fetching loyalty points:', error);
        return NextResponse.json({ error: 'Failed to fetch loyalty points' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
