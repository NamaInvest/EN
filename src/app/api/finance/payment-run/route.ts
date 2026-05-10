import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.payment-run' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const runs = await prisma.paymentRun.findMany({
            take: 100,
            orderBy: { id: 'desc' }
        });
        return NextResponse.json({ data: runs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
