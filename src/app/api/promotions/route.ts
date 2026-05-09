import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const promos = await prisma.promotion.findMany({
            take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(promos);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const promo = await prisma.promotion.create({
            data: {
                name: body.name, type: body.type || 'percentage',
                discountType: body.discountType || 'percentage',
                discountValue: parseFloat(body.discountValue) || 0,
                buyQty: parseInt(body.buyQty) || 0, getQty: parseInt(body.getQty) || 0,
                minQty: parseInt(body.minQty) || 0, categoryId: parseInt(body.categoryId) || 0,
                productId: parseInt(body.productId) || 0,
                startDate: body.startDate || null, endDate: body.endDate || null,
                startTime: body.startTime || null, endTime: body.endTime || null,
                isActive: true,
            },
        });
        return NextResponse.json(promo, { status: 201 });
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

async function _PUT(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const promo = await prisma.promotion.update({ where: { id: body.id }, data: { isActive: body.isActive ?? true, name: body.name, discountValue: body.discountValue } });
        return NextResponse.json(promo);
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
