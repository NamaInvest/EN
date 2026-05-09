import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const where: any = {};
    if (status) where.status = status;

    const orders = await (prisma as any).onlineOrder.findMany({
      where,
      include: { store: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'ecommerce/orders' });
  }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  paymentStatus: z.any().optional(),
  trackingNumber: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const order = await (prisma as any).onlineOrder.update({
      where: { id: parseInt(data.id) },
      data: { status: data.status, paymentStatus: data.paymentStatus, trackingNumber: data.trackingNumber }
    });
    return NextResponse.json(order);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'ecommerce/orders' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
