import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'master-panel-data' });
const prisma = new PrismaClient();

async function _GET(request: NextRequest) {
    const user = await getUserFromRequest(request as any);
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const companies = await prisma.company.findMany({
            include: {
                branches: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json({ companies });
    } catch (error: any) {
        log.error('Master Panel fetch error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
