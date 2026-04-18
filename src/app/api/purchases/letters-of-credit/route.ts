import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases');
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        // @ts-ignore - Prisma Language Server sync lock
        const lcs = await prisma.letterOfCredit.findMany({
            include: { bank: true, supplier: true, currency: true },
            orderBy: { id: 'desc' }
        });
        
        return NextResponse.json(lcs);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في جلب الاعتمادات المستندية' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const allowed = await hasPermission(auth.userId, 'purchases');
        if (!allowed) return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });

        const body = await request.json();
        
        // @ts-ignore - Prisma Language Server sync lock
        const lc = await prisma.letterOfCredit.create({
            data: {
                lcNumber: body.lcNumber,
                bankId: parseInt(body.bankId),
                supplierId: parseInt(body.supplierId),
                amount: parseFloat(body.amount),
                currencyId: parseInt(body.currencyId),
                exchangeRate: parseFloat(body.exchangeRate || 1.0),
                openDate: new Date(body.openDate || Date.now()),
                expiryDate: new Date(body.expiryDate),
                status: body.status || 'draft',
                marginPercent: parseFloat(body.marginPercent || 0),
                marginPaid: parseFloat(body.marginPaid || 0),
                portOfLoading: body.portOfLoading || null,
                portOfDischarge: body.portOfDischarge || null,
                notes: body.notes || null,
            },
            include: { bank: true, supplier: true, currency: true }
        });
        
        return NextResponse.json(lc, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل في إنشاء الاعتماد المستندي' }, { status: 500 });
    }
}
