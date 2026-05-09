import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { checkCredit } from '@/lib/credit-check';

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const customerId = parseInt((await params).id);
        if (isNaN(customerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        // Calculate credit details using the library function
        const creditDetails = await checkCredit(prisma as any, customerId);

        return NextResponse.json(creditDetails);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
