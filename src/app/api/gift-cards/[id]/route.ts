import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request || req);
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
