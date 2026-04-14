import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data: any = {};
        
        if (body.isActive !== undefined) data.isActive = body.isActive;
        if (body.endDate !== undefined) data.endDate = body.endDate;
        if (body.maxUses !== undefined) data.maxUses = parseInt(body.maxUses);

        const coupon = await prisma.coupon.update({
            where: { id: parseInt(id) },
            data
        });
        return NextResponse.json(coupon);
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'coupons/[id]' });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const couponId = parseInt(id);
        
        // Don't delete if it has usages
        const usages = await prisma.couponUsage.count({ where: { couponId } });
        if (usages > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف كوبون تم استخدامه. يمكنك إيقافه بدلاً من ذلك.' }, { status: 400 });
        }

        await prisma.coupon.delete({ where: { id: couponId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'coupons/[id]' });
    }
}
