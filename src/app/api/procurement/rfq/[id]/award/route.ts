import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';


const _POSTSchema = z.object({
  vendorId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = parseInt((await params).id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { vendorId } = body;

        if (!vendorId) return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });

        // Get the winning bid
        const winningBid = await prisma.vendorBid.findFirst({
            where: { rfqId: id, vendorId: parseInt(vendorId) },
            include: { details: true, vendor: true }
        });

        if (!winningBid) return NextResponse.json({ error: 'Bid not found for this vendor' }, { status: 404 });

        // Update RFQ status
        await prisma.requestForQuotation.update({
            where: { id },
            data: { status: 'closed' }
        });

        // Update all bids status
        await prisma.vendorBid.updateMany({
            where: { rfqId: id, id: { not: winningBid.id } },
            data: { status: 'REJECTED' }
        });
        
        await prisma.vendorBid.update({
            where: { id: winningBid.id },
            data: { status: 'AWARDED' }
        });

        // Auto-create Purchase Order based on winning bid
        // We will generate a mock PO here
        const rfq = await prisma.requestForQuotation.findUnique({ where: { id } });

        const po = await prisma.purchaseOrder.create({
            data: {
                orderNo: Math.floor(Math.random() * 1000000), // Use numbering
                supplierId: rfq?.supplierId || null, // Might need to link VendorPortalUser to Customer/Supplier table
                subtotal: n(winningBid.amount),
                taxValue: n(winningBid.amount) * 0.15, // standard ZATCA VAT 15%
                total: n(winningBid.amount) * 1.15,
                status: 'pending',
                notes: `Auto-generated from RFQ #${rfq?.rfqNo} Awarded to ${winningBid.vendor.vendorName}`,
                details: {
                    create: winningBid.details.map((d: any) => ({
                        productId: 1, // Need to map rfqDetailId to actual productId in reality
                        quantity: 1, 
                        price: d.unitPrice,
                        total: d.unitPrice
                    }))
                }
            }
        });

        return NextResponse.json({ success: true, message: 'PO created', poId: po.id });

    } catch (e: any) {
        console.error('RFQ Award Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
