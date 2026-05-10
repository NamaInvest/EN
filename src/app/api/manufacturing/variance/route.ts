import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.variance' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const variances = await prisma.varianceTransaction.findMany({ take: 100,
            include: {
                product: true,
                mo: true
            },
            orderBy: { postedAt: 'desc' }
        });
        return NextResponse.json(variances);
    } catch (error: any) {
        log.error("Variance GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch variances' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
