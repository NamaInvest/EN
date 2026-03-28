import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { postSalesInvoice } from '@/lib/auto-journal';
import { generateZatcaQRContent } from '@/lib/zatca';

export async function POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

        const body = await req.json();
        const { cart, total, tax, discount, customerId, paymentMethod, couponId } = body;

        if (!cart || !cart.length) {
            return NextResponse.json({ success: false, error: 'السلة فارغة' }, { status: 400 });
        }

        // 1. Generate Invoice Number (Numeric)
        const lastInvoice = await prisma.salesInvoice.findFirst({
            orderBy: { invoiceNo: 'desc' }
        });
        const invoiceNo = lastInvoice ? lastInvoice.invoiceNo + 1 : 10001;

        const finalTotal = total + tax - (discount || 0);

        // 2. Transaction to ensure atomicity: Create Invoice + Deduct Stock
        const invoice = await prisma.$transaction(async (tx) => {
            
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
            for (const item of cart) {
                const itemTotal = item.price * item.qty;
                const itemTax = itemTotal * ((item.taxRate || 15) / 100);

                await tx.salesInvoiceDetail.create({
                    data: {
                        invoiceId: newInvoice.id,
                        productId: parseInt(item.id),
                        productName: item.name,
                        quantity: item.qty,
                        price: item.price,
                        taxRate: item.taxRate || 15,
                        taxValue: itemTax,
                        total: itemTotal + itemTax
                    }
                });

                // Deduct Inventory safely
                await tx.product.update({
                    where: { id: parseInt(item.id) },
                    data: { currentStock: { decrement: item.qty } }
                });
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

            return newInvoice;
        });

        // 5. Automated Global Dual-Entry Accounting (POS to Master Journal)
        try {
            await postSalesInvoice({
                invoiceNo: invoice.invoiceNo,
                subtotal: total,
                taxValue: tax,
                total: finalTotal,
                paymentType: paymentMethod || 'cash',
                splitCash: 0,
                splitCard: 0,
                userId: auth.userId,
                branchId: undefined, 
                discountValue: discount || 0,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr) {
            console.warn('Auto-journal for POS sale skipped/failed:', journalErr);
        }

        // Generate ZATCA Barcode for Receipt
        let zatcaQr = '';
        try {
            const zatcaSettings = await prisma.setting.findMany({
                where: { key: { in: ['company_name', 'tax_number'] } }
            });
            const s: Record<string, string> = {};
            zatcaSettings.forEach((st: any) => { s[st.key] = st.value ?? ''; });
            
            if (s['company_name'] && s['tax_number']) {
                zatcaQr = generateZatcaQRContent({
                    sellerName: s['company_name'],
                    vatNumber: s['tax_number'],
                    timestamp: invoice.date.toISOString(),
                    totalWithVat: finalTotal,
                    vatAmount: tax,
                });
                
                // Save it to the database so it's persisted for Phase 1 display
                await prisma.salesInvoice.update({
                    where: { id: invoice.id },
                    data: { zatcaQr }
                });
            }
        } catch (qrErr) {
            console.warn('Zatca QR generation failed in POS:', qrErr);
        }

        // Return a Stringified invoice number and the QR for the frontend
        return NextResponse.json({ 
            success: true, 
            invoice: { 
                invoiceNumber: `INV-${invoice.invoiceNo}`,
                zatcaQr 
            } 
        });

    } catch (error: any) {
        console.error("POS Checkout error:", error);
        return NextResponse.json({ success: false, error: 'حدث خطأ أثناء معالجة الدفع: ' + error.message }, { status: 500 });
    }
}
