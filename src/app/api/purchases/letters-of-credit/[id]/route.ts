import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const id = parseInt((await params).id);
        const body = await request.json();

        const lc = await prisma.letterOfCredit.update({
            where: { id },
            data: {
                lcNumber: body.lcNumber,
                bankId: parseInt(body.bankId),
                supplierId: parseInt(body.supplierId),
                amount: parseFloat(body.amount),
                currencyId: parseInt(body.currencyId),
                exchangeRate: parseFloat(body.exchangeRate || 1.0),
                openDate: new Date(body.openDate),
                expiryDate: new Date(body.expiryDate),
                status: body.status,
                marginPercent: parseFloat(body.marginPercent || 0),
                marginPaid: parseFloat(body.marginPaid || 0),
                portOfLoading: body.portOfLoading,
                portOfDischarge: body.portOfDischarge,
                notes: body.notes,
            },
            include: { bank: true, supplier: true, currency: true }
        });

        return NextResponse.json(lc);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في تحديث الاعتماد المستندي' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const id = parseInt((await params).id);
        await prisma.letterOfCredit.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في حذف الاعتماد. قد يكون مرتبطاً بمشتريات.' }, { status: 500 });
    }
}
