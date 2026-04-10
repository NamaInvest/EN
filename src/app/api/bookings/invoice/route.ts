import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';

export async function POST(request: Request) {
    try {
        const { bookingId } = await request.json();

        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: { customer: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
        }
        if (booking.status === 'invoiced') {
            return NextResponse.json({ error: 'تمت فوترة هذا الحجز مسبقاً' }, { status: 400 });
        }

        const remainingAmount = booking.total - booking.deposit;
        if (remainingAmount <= 0) {
            // Already fully paid, just mark as invoiced
            await prisma.booking.update({ where: { id: booking.id }, data: { status: 'invoiced' } });
            return NextResponse.json({ success: true, message: 'مكتمل الدفع بالكامل مسبقاً' });
        }

        // 1. Find or create a generic 'Booking Service' Product to satisfy Foreign Key constraints
        let bookingProduct = await prisma.product.findFirst({
            where: { name: 'خدمة حجز عامة' }
        });

        if (!bookingProduct) {
            bookingProduct = await prisma.product.create({
                data: {
                    name: 'خدمة حجز عامة',
                    buyPrice: 0,
                    sellPrice: 0,
                    taxRate: 15,
                    currentStock: 99999, // infinite for a service
                }
            });
        }

        // 2. Generate ZATCA Sales Invoice natively
        const lastInvoice = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;

        const baseAmount = remainingAmount / 1.15;
        const taxAmount = remainingAmount - baseAmount;

        const newInvoice = await prisma.$transaction(async (tx) => {
            const invoice = await tx.salesInvoice.create({
                data: {
                    invoiceNo,
                    customerId: booking.customerId,
                    subtotal: baseAmount,
                    taxValue: taxAmount,
                    total: remainingAmount,
                    paid: remainingAmount, 
                    remaining: 0,
                    paymentType: 'cash',
                    status: 'completed',
                    userId: booking.userId,
                    notes: `أُصدرت آلياً عن الحجز رقم #${booking.bookingNo}`,
                    details: {
                        create: [{
                            productId: bookingProduct.id,
                            productName: `تصفية لرسوم الحجز المتبقية رقم ${booking.bookingNo}`,
                            quantity: 1,
                            price: baseAmount,
                            taxRate: 15,
                            taxValue: taxAmount,
                            total: remainingAmount
                        }]
                    }
                }
            });

            // Mark booking as correctly invoiced
            await tx.booking.update({ where: { id: booking.id }, data: { status: 'invoiced' } });

            return invoice;
        });

        try {
            await postSalesInvoice({
                invoiceNo: newInvoice.invoiceNo,
                subtotal: newInvoice.subtotal,
                taxValue: newInvoice.taxValue,
                total: newInvoice.total,
                paymentType: 'cash',
                userId: newInvoice.userId || undefined,
                branchId: booking.branchId || null
            });
        } catch (je) {
            console.error("Auto Journal Error (Bookings - Invoice Conversion):", je);
        }

        return NextResponse.json(newInvoice, { status: 201 });

    } catch (e: any) {
        console.error("Invoice Conversion Error:", e);
        return NextResponse.json({ error: e.message || 'فشل توليد الفاتورة' }, { status: 500 });
    }
}
