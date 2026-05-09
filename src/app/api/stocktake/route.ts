import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const stocktakes = await prisma.stocktake.findMany({
            take: 100,
            include: { items: true },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(stocktakes);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const products = await prisma.product.findMany({
            take: 100, where: { active: true }, select: { id: true, name: true, currentStock: true } });

        const items = (body.items || []).map((item: { productId: number; actualQty: number }) => {
            const product = products.find(p => p.id === item.productId);
            const systemQty = n(product?.currentStock || 0);
            const diff = item.actualQty - systemQty;
            return {
                productId: item.productId,
                systemQty,
                actualQty: item.actualQty,
                difference: diff,
                status: diff === 0 ? 'matched' : diff > 0 ? 'over' : 'short',
            };
        });

        const matched = items.filter((i: { status: string }) => i.status === 'matched').length;
        const over = items.filter((i: { status: string }) => i.status === 'over').length;
        const short = items.filter((i: { status: string }) => i.status === 'short').length;

        const stocktake = await prisma.stocktake.create({
            data: {
                stocktakeDate: new Date().toISOString().split('T')[0],
                totalItems: items.length, matched, over, short,
                status: body.applyAdjustment ? 'applied' : 'completed',
                notes: body.notes || null,
                createdBy: body.userId || null,
                items: { create: items },
            },
            include: { items: true },
        });

        // Apply stock adjustment if requested
        if (body.applyAdjustment) {
            for (const item of items) {
                if (item.difference !== 0) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { currentStock: item.actualQty },
                    });
                }
            }
        }

        return NextResponse.json(stocktake, { status: 201 });
    } catch (e: any) { console.error('Stocktake error:', e); return NextResponse.json({ error: 'فشل في إنشاء الجرد' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
