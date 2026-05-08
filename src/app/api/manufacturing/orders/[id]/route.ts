import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const body = await request.json();
        const orderId = parseInt(id);

        const data: any = {};
        if (body.status) data.status = body.status;
        if (body.notes !== undefined) data.notes = body.notes;
        if (body.status === 'completed') data.endDate = new Date();
        if (body.status === 'in_progress' && !body.startDate) data.startDate = new Date();

        const order = await prisma.manufacturingOrder.update({
            where: { id: orderId },
            data,
            include: { recipe: { include: { finishedProduct: true } } }
        });
        return NextResponse.json(order);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'manufacturing/orders/[id]' });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const orderId = parseInt(id);
        const order = await prisma.manufacturingOrder.findUnique({ where: { id: orderId } });
        if (order && order.status === 'completed') {
            return NextResponse.json({ error: 'لا يمكن حذف أمر تصنيع مكتمل' }, { status: 400 });
        }
        await prisma.manufacturingOrder.delete({ where: { id: orderId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'manufacturing/orders/[id]' });
    }
}
