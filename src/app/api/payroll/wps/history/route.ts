import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payroll.wps.history' });
async function _GET(request: Request) {
    const prisma = getPrisma(request as any);

    try {
        const batches = await prisma.wPSBatch.findMany({
            orderBy: {
                id: 'desc',
            },
            take: 50,
        });

        return NextResponse.json(batches);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
