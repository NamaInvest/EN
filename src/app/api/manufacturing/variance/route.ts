import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const variances = await prisma.varianceTransaction.findMany({
            take: 100,
            include: {
                product: true,
                mo: true
            },
            orderBy: { postedAt: 'desc' }
        });
        return NextResponse.json(variances);
    } catch (error: any) {
        console.error("Variance GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch variances' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
