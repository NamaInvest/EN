import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { calculateVendorScore } from '@/lib/vendor-scoring';

async function _GET(req: Request) {

    // This endpoint should be protected and only called by a cron job scheduler.
    // We can add simple token validation here in production.
    const prisma = getPrisma(req as any);
    
    try {
        const distinctRatings = await prisma.vendorRating.groupBy({
            by: ['supplierId'],
        });

        const results = [];
        for (const dr of distinctRatings) {
            const score = await calculateVendorScore(dr.supplierId, prisma);
            
            // In a real scenario, we'd upsert a pre-calculated score into a `VendorScoreLog` or `Vendor` table.
            // For now, we simulate the nightly job success.
            results.push({ supplierId: dr.supplierId, newScore: score.compositeScore });

            if (score.compositeScore < 60) {
                console.log(`[CRON] ALERT: Vendor ${dr.supplierId} fell below 60% threshold. Blocking or sending warning...`);
                // e.g. update Vendor status to BLOCKED
            }
        }

        return NextResponse.json({ success: true, processed: results.length, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'CRON' });
