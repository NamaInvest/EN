import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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

export async function PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const order = await (prisma as any).onlineOrder.update({
      where: { id: parseInt(data.id) },
      data: { status: data.status, paymentStatus: data.paymentStatus, trackingNumber: data.trackingNumber }
    });
    return NextResponse.json(order);
  } catch (error: any) {
    return apiError(error, 'Error', { context: 'ecommerce/orders' });
  }
}
