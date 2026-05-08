import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const quotes = await prisma.priceQuote.findMany({
            take: 100, include: { details: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(quotes);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const last = await prisma.priceQuote.findFirst({ orderBy: { quoteNo: 'desc' } });
        const quoteNo = (last?.quoteNo || 0) + 1;

        const isTaxInclusive = body.isTaxInclusive === true;

        let total = 0;
        const items = (body.items || []).map((item: { productId?: number; productName: string; quantity: number; price: number }) => {
            let p = item.price || 0;
            if (isTaxInclusive) p = p / 1.15;
            
            const t = (item.quantity || 1) * p;
            total += t;
            return { productId: item.productId || null, productName: item.productName || '', quantity: item.quantity || 1, price: p, total: t };
        });

        const quote = await prisma.priceQuote.create({
            data: {
                quoteNo, customerId: body.customerId || null, total,
                status: 'pending', userId: body.userId || null, notes: body.notes || null,
                details: { create: items },
            },
            include: { details: true },
        });
        return NextResponse.json(quote, { status: 201 });
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
