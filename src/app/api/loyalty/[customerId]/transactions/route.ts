import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const { customerId } = await params;
        const transactions = await prisma.loyaltyTransaction.findMany({
            take: 100,
            where: { customerId: parseInt(customerId) },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Error fetching loyalty transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
