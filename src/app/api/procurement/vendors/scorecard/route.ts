import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { calculateVendorScore } from '@/lib/vendor-scoring';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'procurement.vendors.scorecard' });

async function _GET(req: Request) {

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
        log.error('Scorecard Fetch Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).optional(),
  quality: z.any().optional(),
  delivery: z.any().optional(),
  pricing: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
