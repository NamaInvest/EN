import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    const { searchParams } = new URL(req.url);
    const tokenStr = searchParams.get('token');

    try {
        const rfqId = parseInt((await params).id);
        if (isNaN(rfqId)) return NextResponse.json({ error: 'Invalid RFQ ID' }, { status: 400 });

        if (!tokenStr) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

        const token = await prisma.vendorPortalToken.findUnique({ where: { token: tokenStr } });
        if (!token || token.expiresAt < new Date() || token.rfqId !== rfqId) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
        }

        const body = await req.json();
        const { items } = body; // items: [{rfqDetailId, unitPrice, deliveryDays}]

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }

        const totalAmount = items.reduce((sum: number, item: any) => sum + item.unitPrice, 0);

        // Check if bid already exists
        const existingBid = await prisma.vendorBid.findFirst({
            where: { vendorId: token.vendorId, rfqId: rfqId }
        });

        let bid;
        if (existingBid) {
            // Update existing bid
            await prisma.vendorBidDetail.deleteMany({ where: { bidId: existingBid.id } });
            bid = await prisma.vendorBid.update({
                where: { id: existingBid.id },
                data: {
                    amount: totalAmount,
                    status: 'SUBMITTED',
                    details: {
                        create: items.map((item: any) => ({
                            rfqDetailId: parseInt(item.rfqDetailId),
                            unitPrice: parseFloat(item.unitPrice),
                            deliveryDays: parseInt(item.deliveryDays)
                        }))
                    }
                }
            });
        } else {
            // Create new bid
            bid = await prisma.vendorBid.create({
                data: {
                    vendorId: token.vendorId,
                    rfqId: rfqId,
                    amount: totalAmount,
                    status: 'SUBMITTED',
                    details: {
                        create: items.map((item: any) => ({
                            rfqDetailId: parseInt(item.rfqDetailId),
                            unitPrice: parseFloat(item.unitPrice),
                            deliveryDays: parseInt(item.deliveryDays)
                        }))
                    }
                }
            });
        }

        return NextResponse.json({ success: true, bidId: bid.id });

    } catch (e: any) {
        console.error('Vendor Bid Submission Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
