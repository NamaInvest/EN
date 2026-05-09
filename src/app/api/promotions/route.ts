import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const promos = await prisma.promotion.findMany({
            take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(promos);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  type: z.any().optional(),
  discountType: z.number().optional(),
  discountValue: z.number().optional(),
  buyQty: z.number().optional(),
  getQty: z.number().optional(),
  minQty: z.number().optional(),
  categoryId: z.union([z.string(), z.number()]).optional(),
  productId: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.any().optional(),
  endTime: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
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


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  isActive: z.boolean().optional(),
  name: z.any().optional(),
  discountValue: z.number().optional(),
}).passthrough();

async function _PUT(request: Request) {
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
