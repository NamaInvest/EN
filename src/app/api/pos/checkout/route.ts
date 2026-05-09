import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';
import { generateZatcaQRContent } from '@/lib/zatca';
import { round2, validateMoney } from '@/lib/money';
import { getNextNumber } from '@/lib/numbering';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _POSTSchema = z.object({
  cart: z.any().optional(),
  total: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  paymentMethod: z.any().optional(),
  couponId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { cart, total, tax, discount, customerId, paymentMethod, couponId } = body;

        if (!cart || !cart.length) {
            return NextResponse.json({ success: false, error: 'السلة فارغة' }, { status: 400 });
        }

        // Validate monetary amounts
        const vTotal = validateMoney(total, 'الإجمالي');
        const vTax = validateMoney(tax, 'الضريبة');
        const vDiscount = validateMoney(discount || 0, 'الخصم');

        const finalTotal = round2(vTotal + vTax - vDiscount);

        // 2. Transaction to ensure atomicity: Create Invoice + Deduct Stock
        const invoice = await prisma.$transaction(async (tx) => {
            
            // Generate Invoice Number inside transaction to prevent race conditions
            const seqResult = await getNextNumber(tx, 'INV');
            const invoiceNo = seqResult.current;
            const formattedInvoiceNo = seqResult.formatted;

            // Create Invoice Header
            const newInvoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo,
                    date: new Date(),
                    customerId: customerId ? parseInt(customerId) : null,
                    subtotal: total,
                    taxValue: tax,
                    discountValue: discount || 0,
                    total: finalTotal,
                    paid: finalTotal, // POS is fully paid
                    remaining: 0,
                    paymentType: paymentMethod || 'cash',
                    status: 'completed',
                    userId: auth.userId,
                    notes: `فاتورة نقاط البيع السريعة (POS)${body.bnplOrderId ? ` - طريقة الدفع: ${paymentMethod} (${body.bnplOrderId})` : ''}`,
                }
            });

            // Create Invoice Details & Deduct Stock
            let totalCost = 0;
            for (const item of cart) {
                const safePrice = validateMoney(item.price, 'السعر');
                const safeQty = validateMoney(item.qty, 'الكمية');
                const itemTotal = round2(safePrice * safeQty);
                const itemTax = round2(itemTotal * ((item.taxRate || 15) / 100));

                await tx.salesInvoiceDetail.create({
                    data: {
                        invoiceId: newInvoice.id,
                        productId: parseInt(item.id),
                        productName: item.name,
                        quantity: safeQty,
                        price: safePrice,
                        taxRate: item.taxRate || 15,
                        taxValue: itemTax,
                        total: round2(itemTotal + itemTax)
                    }
                });

                // Deduct Inventory safely considering Factor (Multi-Units)
                const deductionQty = safeQty * validateMoney(item.factor || 1, 'المعامل');
                const updatedProduct = await tx.product.update({
                    where: { id: parseInt(item.id) },
                    data: { currentStock: { decrement: deductionQty } }
                });
                
                // Track cost of goods sold
                totalCost += n(updatedProduct.buyPrice || 0) * deductionQty;
            }

        // 3. Handle Coupon Usage if applicable
            if (couponId && discount > 0) {
                await tx.couponUsage.create({
                    data: {
                        couponId: parseInt(couponId),
                        invoiceId: newInvoice.id,
                        customerId: customerId ? parseInt(customerId) : null,
                        discountAmount: discount
                    }
                });
                await tx.coupon.update({
                    where: { id: parseInt(couponId) },
                    data: { usedCount: { increment: 1 } }
                });
            }

            // 4. Handle Loyalty Points Earning
            if (customerId) {
                // Fetch the earn rate from global settings
                const earnRateSetting = await tx.setting.findUnique({ where: { key: 'loyalty_earn_rate' } });
                const earnRate = earnRateSetting?.value ? parseInt(earnRateSetting.value) : 10;
                
                const earnedPoints = Math.floor(finalTotal / earnRate);
                
                if (earnedPoints > 0) {
                    const existingLoyalty = await tx.loyaltyPoint.findFirst({
                        where: { customerId: parseInt(customerId) }
                    });

                    if (existingLoyalty) {
                        await tx.loyaltyPoint.update({
                            where: { id: existingLoyalty.id },
                            data: {
                                points: { increment: earnedPoints },
                                totalEarned: { increment: earnedPoints }
                            }
                        });
                    } else {
                        await tx.loyaltyPoint.create({
                            data: {
                                customerId: parseInt(customerId),
                                points: earnedPoints,
                                totalEarned: earnedPoints,
                                tier: 'bronze'
                            }
                        });
                    }

                    await tx.loyaltyTransaction.create({
                        data: {
                            customerId: parseInt(customerId),
                            invoiceId: newInvoice.id,
                            points: earnedPoints,
                            type: 'earned',
                            description: `نقاط مكتسبة من الفاتورة رقم ${newInvoice.invoiceNo}`
                        }
                    });
                }
            }

            return { newInvoice, totalCost, formattedInvoiceNo };
        });

        // 5. Automated Global Dual-Entry Accounting (POS to Master Journal)
        try {
            await postSalesInvoice({
                invoiceNo: invoice.newInvoice.invoiceNo,
                subtotal: total,
                taxValue: tax,
                total: finalTotal,
                paymentType: paymentMethod || 'cash',
                splitCash: 0,
                splitCard: 0,
                userId: auth.userId,
                branchId: undefined, 
                discountValue: discount || 0,
                totalCost: invoice.totalCost,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr: unknown) {
            console.warn('Auto-journal for POS sale skipped/failed:', journalErr);
        }

        // Generate ZATCA Barcode for Receipt
        let zatcaQr = '';
        try {
            const zatcaSettings = await prisma.setting.findMany({
            take: 100,
                where: { key: { in: ['company_name', 'tax_number'] } }
            });
            const s: Record<string, string> = {};
            zatcaSettings.forEach((st: any) => { s[st.key] = st.value ?? ''; });
            
            if (s['company_name'] && s['tax_number']) {
                zatcaQr = generateZatcaQRContent({
                    sellerName: s['company_name'],
                    vatNumber: s['tax_number'],
                    timestamp: invoice.newInvoice.date.toISOString(),
                    totalWithVat: finalTotal,
                    vatAmount: tax,
                });
                
                // Save it to the database so it's persisted for Phase 1 display
                await prisma.salesInvoice.update({
                    where: { id: invoice.newInvoice.id },
                    data: { zatcaQr }
                });
            }
        } catch (qrErr: unknown) {
            console.warn('Zatca QR generation failed in POS:', qrErr);
        }

        // Return a Stringified invoice number and the QR for the frontend
        return NextResponse.json({ 
            success: true, 
            invoice: { 
                id: invoice.newInvoice.id,
                invoiceNumber: invoice.formattedInvoiceNo,
                zatcaQr 
            } 
        });

    } catch (error: any) {
        console.error("POS Checkout error:", error);
        return NextResponse.json({ success: false, error: 'حدث خطأ أثناء معالجة الدفع: ' + error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
