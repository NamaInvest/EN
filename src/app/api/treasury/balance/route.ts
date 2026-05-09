import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-handler';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const [inAgg, outAgg] = await Promise.all([
            prisma.treasury.aggregate({ where: { type: 'in' }, _sum: { amount: true } }),
            prisma.treasury.aggregate({ where: { type: 'out' }, _sum: { amount: true } }),
        ]);
        const balance = n(inAgg._sum.amount) - n(outAgg._sum.amount);
        return NextResponse.json({ balance });
    } catch (error: any) { return handleApiError(error); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
