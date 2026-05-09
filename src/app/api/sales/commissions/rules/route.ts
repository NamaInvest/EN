import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const rules = await prisma.commissionRule.findMany({
            take: 100,
            where: { isActive: true },
            orderBy: { targetAmount: 'asc' }
        });
        return NextResponse.json(rules);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
