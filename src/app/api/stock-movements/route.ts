import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { syncStockToSalla } from '@/lib/salla';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const stockId = searchParams.get('stock_id');
        const where: Record<string, unknown> = {};
        if (stockId) where.stockId = parseInt(stockId);
        const movements = await prisma.stockMovement.findMany({ where, include: { product: true, stock: true }, orderBy: { date: 'desc' }, take: 100 });
        return NextResponse.json(movements);
    } catch (error: any) { console.error(error); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  stockId: z.union([z.string(), z.number()]).optional(),
  type: z.any().optional(),
  quantity: z.number().optional(),
  referenceType: z.any().optional(),
  notes: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const movement = await prisma.stockMovement.create({
            data: { productId: parseInt(body.productId), stockId: parseInt(body.stockId) || 1, type: body.type, quantity: parseFloat(body.quantity), referenceType: body.referenceType || 'manual', notes: body.notes || null, userId: body.userId || null },
        });
        const increment = (body.type === 'in' || body.type === 'adjustment') ? parseFloat(body.quantity) : -parseFloat(body.quantity);
        const updatedProduct = await prisma.product.update({ where: { id: parseInt(body.productId) }, data: { currentStock: { increment } } });
        
        if (updatedProduct.barcode) {
            await syncStockToSalla(updatedProduct.barcode, n(updatedProduct.currentStock));
        }

        return NextResponse.json(movement, { status: 201 });
    } catch (error: any) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
