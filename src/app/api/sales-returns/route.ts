import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError, validateAmount, requireFields } from '@/lib/api-error';

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

        const items = body.items || [];
        if (items.length === 0) {
            return NextResponse.json({ error: 'لا يوجد أصناف للإرجاع' }, { status: 400 });
        }

        let originalInvoice = null;
        if (body.originalInvoiceId) {
            originalInvoice = await prisma.salesInvoice.findUnique({
                where: { id: parseInt(body.originalInvoiceId) },
                include: { details: true }
            });

            if (!originalInvoice) {
                return NextResponse.json({ error: 'الفاتورة الأصلية غير موجودة' }, { status: 404 });
            }

            // STRICT RMA VALIDATION: Ensure returned quantities don't exceed sold quantities
            for (const item of items) {
                const soldItem = originalInvoice.details.find(d => d.productId === parseInt(item.productId));
                if (!soldItem) {
                    return NextResponse.json({ error: `المنتج ${item.productName} غير موجود في الفاتورة الأصلية` }, { status: 400 });
                }

                // Ideally, we'd also check previously returned quantities here for full strictness,
                // but as a Phase 8 baseline, we ensure it doesn't exceed the initial sale.
                if (parseFloat(item.quantity) > soldItem.quantity) {
                    return NextResponse.json({ error: `الكمية المرتجعة للمنتج ${item.productName} تتجاوز الكمية المباعة (${soldItem.quantity})` }, { status: 400 });
                }
            }
        }

        // Recalculate totals server-side
        let calculatedSubtotal = 0;
        const processedItems = items.map((item: any) => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.price) || 0;
            const dRate = parseFloat(item.discountRate) || 0;
            const itemSubtotal = qty * price;
            const dValue = itemSubtotal * (dRate / 100);
            const afterD = itemSubtotal - dValue;
            const tax = afterD * 0.15;
            calculatedSubtotal += afterD;

            return {
                productId: parseInt(item.productId),
                productName: item.productName || '',
                quantity: qty,
                price: price,
                discountRate: dRate,
                discountValue: dValue,
                taxRate: 15,
                taxValue: tax,
                total: afterD + tax,
            };
        });

        const taxValue = calculatedSubtotal * 0.15;
        const totalAmount = calculatedSubtotal + taxValue;

        const last = await prisma.salesReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;

        // Execute all DB operations in a single transaction
        const ret = await prisma.$transaction(async (tx) => {
            // Create Header AND Details
            const createdReturn = await tx.salesReturn.create({
                data: {
                    returnNo, 
                    originalInvoiceId: originalInvoice?.id || null,
                    customerId: body.customerId || null, 
                    subtotal: calculatedSubtotal, 
                    taxValue, 
                    total: totalAmount,
                    userId, 
                    branchId, 
                    notes: body.notes || null,
                    details: {
                        create: processedItems
                    }
                },
                include: { details: true }
            });

            // Restock Items safely
            const targetStockId = originalInvoice?.stockId || 1; // Return to original stock or default
            for (const item of processedItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: { increment: item.quantity } },
                });

                try {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: item.productId, stockId: targetStockId } },
                        update: { quantity: { increment: item.quantity } },
                        create: { productId: item.productId, stockId: targetStockId, quantity: item.quantity },
                    });
                } catch (e) {
                    console.error('Failed to restock returned item to productStock inside tx:', e);
                }
            }

            // Treasury out (Refund to customer)
            if (createdReturn.total > 0) {
                await tx.treasury.create({ 
                    data: { 
                        type: 'out', 
                        amount: createdReturn.total, 
                        description: `مرتجع مبيعات #${returnNo}${originalInvoice ? ` للفاتورة #${originalInvoice.invoiceNo}` : ''}`, 
                        referenceType: 'sales_return', 
                        referenceId: createdReturn.id, 
                        userId, 
                        branchId 
                    } 
                });
            }

            return createdReturn;
        });

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
    } catch (e) { 
        console.error('Sales return error:', e); 
        return NextResponse.json({ error: 'فشل في حفظ المرتجع' }, { status: 500 }); 
    }
}
