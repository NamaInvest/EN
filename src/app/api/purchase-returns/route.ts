import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { postPurchaseReturn } from '@/lib/auto-journal';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';

export async function GET() {
    try {
        const returns = await prisma.purchaseReturn.findMany({ orderBy: { id: 'desc' } });
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

        const last = await prisma.purchaseReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;
        const subtotal = parseFloat(body.subtotal) || 0;
        const taxValue = subtotal * 0.15;

        const ret = await prisma.purchaseReturn.create({
            data: {
                returnNo, originalInvoiceId: body.originalInvoiceId || null,
                supplierId: body.supplierId || null, subtotal, taxValue, total: subtotal + taxValue,
                userId, notes: body.notes || null,
            },
        });

        if (ret.total > 0) {
            await prisma.treasury.create({ data: { type: 'in', amount: ret.total, description: `مرتجع مشتريات #${returnNo}`, referenceType: 'purchase_return', referenceId: ret.id, userId, branchId } });

            try {
                await postPurchaseReturn({
                    returnNo: ret.returnNo,
                    subtotal: ret.subtotal,
                    taxValue: ret.taxValue,
                    total: ret.total,
                    paymentType: 'cash',
                    userId: ret.userId || undefined,
                    branchId: branchId,
                });
            } catch (je) {
                console.error("Auto Journal Error (Purchase Return):", je);
            }
        }

        return NextResponse.json(ret, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
