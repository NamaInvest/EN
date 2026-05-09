import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const body = await request.json();
        const data: any = {};
        
        if (body.isActive !== undefined) data.isActive = body.isActive;
        if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate;

        const card = await prisma.giftCard.update({
            where: { id: parseInt(id) },
            data
        });
        return NextResponse.json(card);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'gift-cards/[id]' });
    }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
        const cardId = parseInt(id);
        
        const card = await prisma.giftCard.findUnique({ where: { id: cardId } });
        if (card && card.initialBalance !== card.currentBalance) {
            return NextResponse.json({ error: 'لا يمكن حذف بطاقة تم استخدام جزء من رصيدها' }, { status: 400 });
        }

        await prisma.giftCard.delete({ where: { id: cardId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'gift-cards/[id]' });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
