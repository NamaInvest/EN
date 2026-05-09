import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
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
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في تحديث الاعتماد المستندي' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases', prisma);
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const id = parseInt((await params).id);
        await prisma.letterOfCredit.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في حذف الاعتماد. قد يكون مرتبطاً بمشتريات.' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'FINANCIAL' });
