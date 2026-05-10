import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'procurement.rfq.id' });

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const id = parseInt((await params).id);

        const rfq = await prisma.requestForQuotation.findUnique({
            where: { id },
            include: {
                details: true,
            }
        });

        if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const bids = await prisma.vendorBid.findMany({ take: 100,
            where: { rfqId: id },
            include: {
                vendor: true,
                details: true
            }
        });

        return NextResponse.json({ rfq, bids });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
