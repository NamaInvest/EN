import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        const rfq = await prisma.requestForQuotation.findUnique({
            where: { id },
            include: {
                details: true,
            }
        });

        if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const bids = await prisma.vendorBid.findMany({
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
