import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { customerId } = await params;
        const transactions = await prisma.loyaltyTransaction.findMany({
            take: 100,
            where: { customerId: parseInt(customerId) },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Error fetching loyalty transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
