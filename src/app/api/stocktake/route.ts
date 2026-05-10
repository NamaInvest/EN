import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'stocktake' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const stocktakes = await prisma.stocktake.findMany({
            take: 100,
            include: { items: true },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(stocktakes);
    } catch (e: any) { log.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
    } catch (e: any) { log.error('Stocktake error:', e); return NextResponse.json({ error: 'فشل في إنشاء الجرد' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
