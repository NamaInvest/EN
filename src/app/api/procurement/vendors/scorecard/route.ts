import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { calculateVendorScore } from '@/lib/vendor-scoring';

export async function GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        // We will fetch all vendors, but since VendorPortalUser handles portals, 
        // true suppliers are often stored in Customer (with type=SUPPLIER) or we can use VendorPortalUser.
        // For this demo, let's just get distinct supplierIds from VendorRating
        const distinctRatings = await prisma.vendorRating.groupBy({
            by: ['supplierId'],
        });

        const scorecards = [];
        for (const dr of distinctRatings) {
            // Need vendor name. Assuming supplierId matches an id in VendorPortalUser for now
            const vendor = await prisma.vendorPortalUser.findUnique({
                where: { id: dr.supplierId }
            });

            const score = await calculateVendorScore(dr.supplierId, prisma);
            scorecards.push({
                ...score,
                vendorName: vendor ? vendor.vendorName : `مورد #${dr.supplierId}`
            });
        }

        // Sort by composite score descending
        scorecards.sort((a, b) => b.compositeScore - a.compositeScore);

        return NextResponse.json({ success: true, data: scorecards });
    } catch (e: any) {
        console.error('Scorecard Fetch Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { supplierId, quality, delivery, pricing, notes } = body;

        const rating = await prisma.vendorRating.create({
            data: {
                supplierId: parseInt(supplierId),
                quality: parseInt(quality),
                delivery: parseInt(delivery),
                pricing: parseInt(pricing),
                notes
            }
        });

        return NextResponse.json({ success: true, data: rating });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
