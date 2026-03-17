import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const returns = await prisma.salesReturn.findMany({ orderBy: { id: 'desc' } });
        return NextResponse.json(returns);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = body.userId ? parseInt(body.userId) : null;
        let branchId = body.branchId ? parseInt(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const last = await prisma.salesReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;
        const subtotal = parseFloat(body.subtotal) || 0;
        const taxValue = subtotal * 0.15;

        const ret = await prisma.salesReturn.create({
            data: {
                returnNo, originalInvoiceId: body.originalInvoiceId || null,
                customerId: body.customerId || null, subtotal, taxValue, total: subtotal + taxValue,
                userId, branchId, notes: body.notes || null,
            },
        });

        // Treasury out
        if (ret.total > 0) {
            await prisma.treasury.create({ data: { type: 'out', amount: ret.total, description: `مرتجع مبيعات #${returnNo}`, referenceType: 'sales_return', referenceId: ret.id, userId, branchId } });
        }

        try {
            const { postSalesReturn } = await import('@/lib/auto-journal');
            await postSalesReturn({
                returnNo,
                total: ret.total,
                taxValue: ret.taxValue,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr) {
            console.warn('Auto-journal for sales return skipped:', journalErr);
        }

        return NextResponse.json(ret, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
