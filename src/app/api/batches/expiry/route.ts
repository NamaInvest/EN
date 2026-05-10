import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'batches.expiry' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get('days') || '30');

        const expiryLimitDate = new Date();
        expiryLimitDate.setDate(expiryLimitDate.getDate() + days);

        const batches = await prisma.productBatch.findMany({
            take: 100,
            where: {
                currentQuantity: { gt: 0 },
                expiryDate: {
                    not: null,
                    lte: expiryLimitDate
                }
            },
            include: {
                product: { select: { name: true, barcode: true } }
            },
            orderBy: {
                expiryDate: 'asc'
            }
        });

        return NextResponse.json(batches);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
