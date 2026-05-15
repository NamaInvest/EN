import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.id.receive' });
async function _PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const id = parseInt((await params).id);
        const auth = getUserFromRequest(request as any);
        
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id },
            include: { details: true, supplier: { select: { name: true } } }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        if (invoice.receiptStatus === 'received') {
            return NextResponse.json({ error: 'تم استلام بضاعة هذه الفاتورة مسبقاً' }, { status: 400 });
        }

        const { postGRN } = await import('@/lib/auto-journal');

        const updated = await prisma.$transaction(async (tx) => {
            // Increment stock
            for (const detail of invoice.details) {
                const qty = detail.quantity;
                await tx.product.update({
                    where: { id: detail.productId },
                    data: { currentStock: { increment: qty } },
                });
                
                await tx.productStock.upsert({
                    where: { productId_stockId: { productId: detail.productId, stockId: invoice.stockId } },
                    update: { quantity: { increment: qty } },
                    create: { productId: detail.productId, stockId: invoice.stockId, quantity: qty },
                });
            }

            // Update receiptStatus
            const updatedInvoice = await tx.purchaseInvoice.update({
                where: { id },
                data: { receiptStatus: 'received' }
            });

            // Post GRN Journal
            const totalCost = Number(invoice.subtotal) - Number((invoice as any).ppvAmount || 0);
            if (totalCost > 0.01) {
                await postGRN({
                    grnNo: invoice.invoiceNo || invoice.id,
                    totalCost,
                    supplierName: invoice.supplier?.name || `مورد ${invoice.supplierId}`,
                    userId: auth?.userId,
                    branchId: invoice.branchId,
                    date: new Date().toISOString().split('T')[0],
                    txClient: tx,
                });
            }

            return updatedInvoice;
        });

        return NextResponse.json(updated);

    } catch (e: any) {
        log.error('Purchase receive error:', e);
        return NextResponse.json({ error: 'فشل بتحديث حالة الاستلام' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });
