import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';
import { assertEditable } from '@/lib/document-state-machine';

const log = logger.child({ service: 'purchase-orders.id' });
async function _GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const id = parseInt((await params).id);
        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            // @ts-ignore - VSCode lock bypass
            include: { details: true, supplier: true, letterOfCredit: true }
        });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        return NextResponse.json(order);
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}


async function _PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(request);
    try {
        const id = parseInt((await params).id);
        const { status } = await request.json();
        const auth = getUserFromRequest(request as any);
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

        try {
            assertEditable(currentOrder.status, 'PurchaseOrder');
        } catch (stateErr: any) {
            return NextResponse.json({ error: stateErr.message }, { status: 422 });
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

            // @ts-ignore - VSCode bypass
            const landedCostEntries = await prisma.landedCost.findMany({ take: 100, 
                where: { purchaseOrderId: id },
                include: { expenseAccount: true }
            });

            const invoice = await runFinancialTx(prisma, async (tx: any) => {
                const createdInvoice = await tx.purchaseInvoice.create({
                    data: {
                        invoiceNo,
                        supplierId: currentOrder.supplierId,
                        stockId: currentOrder.stockId,
                        date: new Date(),
                        subtotal: n(currentOrder.subtotal),
                        taxValue: n(currentOrder.taxValue),
                        total: n(currentOrder.total), // Original vendor total
                        remaining: n(currentOrder.total),
                        paid: 0,
                        paymentType: 'postpaid',
                        status: 'completed',
                        receiptStatus: 'received', // Auto-receive upon PO completion
                        userId: userId || currentOrder.userId,
                        notes: `أُنشئت آلياً من طلب الشراء #${currentOrder.orderNo}`,
                        details: { create: invoiceDetails }
                    }
                });

                // Update stock levels
                for (const detail of currentOrder.details) {
                    await tx.product.update({
                        where: { id: detail.productId },
                        data: { currentStock: { increment: detail.quantity } }
                    });
                    
                    try {
                        await tx.productStock.upsert({
                            where: { productId_stockId: { productId: detail.productId, stockId: currentOrder.stockId } },
                            update: { quantity: { increment: detail.quantity } },
                            create: { productId: detail.productId, stockId: currentOrder.stockId, quantity: detail.quantity }
                        });
                    } catch (e: any) {
                         log.error('Failed stock upsert:', e);
                    }
                }
                
                return createdInvoice;
            });

            try {
                const mappedLandedCosts = landedCostEntries.map((lc: any) => ({
                    accountCode: lc.expenseAccount.code,
                    amountValue: n(lc.amount) * n(lc.exchangeRate),
                    description: lc.description
                }));

                const { postPurchaseInvoice } = await import('@/lib/auto-journal');
                await postPurchaseInvoice({
                    invoiceNo,
                    subtotal: n(currentOrder.subtotal),
                    taxValue: n(currentOrder.taxValue),
                    total: n(currentOrder.total),
                    paymentType: 'postpaid',
                    userId: userId || undefined,
                    branchId: currentOrder.branchId || undefined,
                    date: new Date().toISOString().split('T')[0],
                    landedCosts: mappedLandedCosts,
                    hasGRN: true, // [EG-02] PO completion always has stock received → clear GRNI
                });
            } catch (err: any) {
                log.error('Failed to post PO auto-journal', err);
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'فشل بتحديث الحالة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });
