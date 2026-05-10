import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.dunning.history' });

async function _GET(req: NextRequest) {

    try {
        const prisma = getPrisma(req);
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
        }

        const history = await (prisma as any).dunningCommunication.findMany({
            where: { customerId: parseInt(customerId, 10) },
            orderBy: { sentAt: 'desc' },
            take: 100,
        });

        return NextResponse.json(history);
    } catch (e: any) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
