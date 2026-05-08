import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-handler';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const [inAgg, outAgg] = await Promise.all([
            prisma.treasury.aggregate({ where: { type: 'in' }, _sum: { amount: true } }),
            prisma.treasury.aggregate({ where: { type: 'out' }, _sum: { amount: true } }),
        ]);
        const balance = (inAgg._sum.amount || 0) - (outAgg._sum.amount || 0);
        return NextResponse.json({ balance });
    } catch (error: any) { return handleApiError(error); }
}
