import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { postPurchaseReturn } from '@/lib/auto-journal';
import { purchaseReturnCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';

export async function GET() {
    const prisma = getPrisma(request);
    try {
        const returns = await prisma.purchaseReturn.findMany({ orderBy: { id: 'desc' } });
        return NextResponse.json(returns);
    } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        // Zod runtime validation + mass-assignment protection
        const body = purchaseReturnCreateSchema.parse(rawBody);

        const userId = body.userId ? Number(body.userId) : null;
        let branchId = body.branchId ? Number(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const last = await prisma.purchaseReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;
        const subtotal = Number(body.subtotal);
        const taxValue = subtotal * 0.15;
        const total = subtotal + taxValue;

        // Atomic transaction: create return AND treasury entry together
        const ret = await prisma.$transaction(async (tx) => {
            const newReturn = await tx.purchaseReturn.create({
                data: {
                    returnNo,
                    originalInvoiceId: body.originalInvoiceId ? Number(body.originalInvoiceId) : null,
                    supplierId: body.supplierId ? Number(body.supplierId) : null,
                    subtotal, taxValue, total,
                    userId, notes: body.notes || null,
                },
            });

            if (newReturn.total > 0) {
                await tx.treasury.create({
                    data: {
                        type: 'in', amount: newReturn.total,
                        description: `مرتجع مشتريات #${returnNo}`,
                        referenceType: 'purchase_return', referenceId: newReturn.id,
                        userId, branchId,
                    }
                });
            }

            return newReturn;
        });

        try {
            await postPurchaseReturn({
                returnNo: ret.returnNo,
                subtotal: ret.subtotal,
                taxValue: ret.taxValue,
                total: ret.total,
                paymentType: 'cash',
                userId: ret.userId || undefined,
                branchId: branchId || undefined,
            });
        } catch (je) {
            console.warn('Auto Journal skipped (Purchase Return):', je);
        }

        return NextResponse.json(ret, { status: 201 });
    } catch (e) { return handleApiError(e); }
}
