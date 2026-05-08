import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { productStockId, location } = body;

        if (!productStockId) {
            return NextResponse.json({ error: 'Missing productStockId' }, { status: 400 });
        }

        const updated = await prisma.productStock.update({
            where: { id: parseInt(productStockId) },
            data: { location: location || null }
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error('Location Update Error:', error);
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }
}
