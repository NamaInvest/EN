import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const params = 'then' in context.params ? await context.params : context.params;
        const id = parseInt(params.id);

        const { action } = await request.json();

        // @ts-ignore
        const order = await prisma.salesOrder.findUnique({
            where: { id },
            include: { details: true }
        });

        if (!order) return NextResponse.json({ error: 'أمر البيع غير موجود' }, { status: 404 });

        if (action === 'approve') {
            await prisma.salesOrder.update({ where: { id }, data: { status: 'approved' } });
            return NextResponse.json({ message: 'تم الاعتماد' });
        } 
        
        if (action === 'deliver') {
            // Generate Delivery Note
            // @ts-ignore
            const lastNote = await prisma.deliveryNote.findFirst({ orderBy: { noteNo: 'desc' } });
            const newNoteNo = lastNote ? lastNote.noteNo + 1 : 5000;

            const note = await prisma.deliveryNote.create({
                data: {
                    noteNo: newNoteNo,
                    salesOrderId: id,
                    customerId: order.customerId,
                    userId: auth.userId,
                    status: 'delivered',
                    details: {
                        create: order.details.map((d: any) => ({
                            productId: d.productId,
                            productName: d.productName,
                            quantity: d.quantity
                        }))
                    }
                }
            });

            // Update order status
            await prisma.salesOrder.update({ where: { id }, data: { status: 'delivered' } });
            
            // Deduct stock here (simplified mapping, usually depends on your stock logic)
            // Or call your stock deduction utility.

            return NextResponse.json({ message: 'تم إصدار إذن التسليم', note });
        }

        if (action === 'invoice') {
            // Generate Sales Invoice
            const lastInv = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' }, select: { invoiceNo: true } });
            const newInvNo = lastInv ? lastInv.invoiceNo + 1 : 1000;

            const inv = await prisma.salesInvoice.create({
                data: {
                    invoiceNo: newInvNo,
                    customerId: order.customerId,
                    salesRepId: order.salesRepId,
                    userId: auth.userId,
                    subtotal: order.subtotal,
                    taxValue: order.taxValue,
                    total: order.total,
                    status: 'completed',
                    remaining: order.total, // Unpaid
                    details: {
                        create: order.details.map((d: any) => ({
                            productId: d.productId,
                            quantity: d.quantity,
                            price: d.price,
                            total: d.total
                        }))
                    }
                }
            });

            // Update order
            await prisma.salesOrder.update({ where: { id }, data: { status: 'invoiced' } });
            return NextResponse.json({ message: 'تم إصدار الفاتورة وتوجيه القيود', invoiceId: inv.id });
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
