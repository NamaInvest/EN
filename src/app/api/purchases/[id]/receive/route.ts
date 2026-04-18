import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const id = parseInt((await params).id);
        const auth = getUserFromRequest(request);
        
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id },
            include: { details: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        if (invoice.receiptStatus === 'received') {
            return NextResponse.json({ error: 'تم استلام بضاعة هذه الفاتورة مسبقاً' }, { status: 400 });
        }

        // Increment stock
        for (const detail of invoice.details) {
            const qty = detail.quantity;
            await prisma.product.update({
                where: { id: detail.productId },
                data: { currentStock: { increment: qty } },
            });
            
            try {
                await prisma.productStock.upsert({
                    where: { productId_stockId: { productId: detail.productId, stockId: invoice.stockId } },
                    update: { quantity: { increment: qty } },
                    create: { productId: detail.productId, stockId: invoice.stockId, quantity: qty },
                });
            } catch (e) {
                 console.error('Failed to update productStock for purchase receipt:', e);
            }
        }

        // Update receiptStatus
        const updated = await prisma.purchaseInvoice.update({
            where: { id },
            data: { receiptStatus: 'received' }
        });

        return NextResponse.json(updated);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'فشل بتحديث حالة الاستلام' }, { status: 500 });
    }
}
