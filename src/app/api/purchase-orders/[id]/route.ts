import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);
        const { status } = await request.json();
        const auth = getUserFromRequest(request);
        const userId = auth?.userId || null;

        if (!['approved', 'rejected', 'completed'].includes(status)) {
            return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
        }

        const currentOrder = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { details: true }
        });

        if (!currentOrder) {
            return NextResponse.json({ error: 'لم يتم العثور على الطلب' }, { status: 404 });
        }

        // Only allowing 'completed' if the order was priorly approved
        if (status === 'completed' && currentOrder.status !== 'approved') {
            return NextResponse.json({ error: 'لا يمكن إكمال طلب قبل اعتماده' }, { status: 400 });
        }

        // Update the order itself
        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id },
            data: { 
                status,
                approvedBy: status === 'approved' || status === 'rejected' ? userId : currentOrder.approvedBy,
            }
        });

        // Generate a PurchaseInvoice if completing
        if (status === 'completed') {
            const lastInvoice = await prisma.purchaseInvoice.findFirst({ orderBy: { id: 'desc' } });
            const invoiceNo = ((lastInvoice?.invoiceNo || 0) + 1);

            const invoiceDetails = currentOrder.details.map(detail => ({
                productId: detail.productId,
                productName: detail.productName,
                quantity: detail.quantity,
                price: detail.price,
                discountRate: detail.discountRate,
                discountValue: detail.discountValue,
                taxRate: detail.taxRate,
                taxValue: detail.taxValue,
                total: detail.total
            }));

            await prisma.purchaseInvoice.create({
                data: {
                    invoiceNo,
                    supplierId: currentOrder.supplierId,
                    stockId: currentOrder.stockId,
                    date: new Date(),
                    subtotal: currentOrder.subtotal,
                    taxValue: currentOrder.taxValue,
                    total: currentOrder.total,
                    remaining: currentOrder.total,
                    paid: 0,
                    paymentType: 'postpaid',
                    status: 'completed',
                    receiptStatus: 'pending', // Important for goods receipt workflow
                    userId: userId || currentOrder.userId,
                    notes: `أُنشئت آلياً من طلب الشراء #${currentOrder.orderNo}`,
                    details: { create: invoiceDetails }
                }
            });
        }

        return NextResponse.json(updatedOrder);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل بتحديث الحالة' }, { status: 500 });
    }
}
