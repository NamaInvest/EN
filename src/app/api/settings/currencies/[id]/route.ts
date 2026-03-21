import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt(params.id);
        const data = await request.json();
        
        // Disable other defaults if this becomes default
        if (data.isDefault) {
             await prisma.currency.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }
        
        const updated = await prisma.currency.update({
            where: { id },
            data: {
                code: data.code,
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                symbol: data.symbol,
                exchangeRate: parseFloat(data.exchangeRate),
                isDefault: data.isDefault,
                isActive: data.isActive,
            }
        });
        
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt(params.id);
        await prisma.currency.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ. لا يمكن حذف عملة مرتبطة بعمليات.' }, { status: 500 });
    }
}
