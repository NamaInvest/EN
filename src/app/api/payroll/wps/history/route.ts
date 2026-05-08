import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request as any);

    try {
        const batches = await prisma.wPSBatch.findMany({
            orderBy: {
                id: 'desc',
            },
            take: 50,
        });

        return NextResponse.json(batches);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
