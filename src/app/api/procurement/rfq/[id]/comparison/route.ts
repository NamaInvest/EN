import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = parseInt((await params).id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const rfq = await prisma.requestForQuotation.findUnique({
            where: { id },
            include: { details: { include: { product: { select: { name: true } } } } }
        });

        if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

        const bids = await prisma.vendorBid.findMany({
            take: 100,
            where: { rfqId: id },
            include: {
                vendor: { select: { vendorName: true } },
                details: true
            }
        });

        // Construct Comparison Matrix
        // Row = RFQ Detail (Item)
        // Col = Vendor Bids
        const comparison = rfq.details.map(reqItem => {
            const itemBids = bids.map(bid => {
                const detail = bid.details.find(d => d.rfqDetailId === reqItem.id);
                return {
                    vendorId: bid.vendorId,
                    vendorName: bid.vendor.vendorName,
                    unitPrice: detail?.unitPrice || null,
                    deliveryDays: detail?.deliveryDays || null
                };
            });

            // Find best price
            const validPrices = itemBids.map(b => b.unitPrice !== null ? n(b.unitPrice) : null).filter((p): p is number => p !== null);
            const bestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

            return {
                rfqDetailId: reqItem.id,
                productName: reqItem.product.name,
                requestedQuantity: reqItem.quantity,
                targetPrice: reqItem.targetPrice,
                bids: itemBids.map(b => ({
                    ...b,
                    isBestPrice: b.unitPrice === bestPrice
                }))
            };
        });

        // Vendor Ranking Summary (Total Cost)
        const vendorTotals = bids.map(b => {
            const totalScore = 100; // Mock score, we can implement weighted scoring later
            return {
                vendorId: b.vendorId,
                vendorName: b.vendor.vendorName,
                totalAmount: b.amount,
                score: totalScore
            };
        }).sort((a, b) => n(a.totalAmount) - n(b.totalAmount));

        return NextResponse.json({
            rfqNo: rfq.rfqNo,
            status: rfq.status,
            comparison,
            ranking: vendorTotals
        });

    } catch (e: any) {
        console.error('RFQ Comparison Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
