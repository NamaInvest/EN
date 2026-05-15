import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postSalesInvoice } from '@/lib/auto-journal';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ service: 'bookings.invoice' });

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(auth.tenantId);

    try {
        const { bookingId } = await request.json();

        const booking = await prisma.booking.findFirst({
            where: { id: parseInt(bookingId), tenantId },
            include: { customer: { select: { id: true, name: true, phone: true, taxNumber: true } } }
        });

        if (!booking) {
            return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
        }
        if (booking.status === 'invoiced') {
            return NextResponse.json({ error: 'تمت فوترة هذا الحجز مسبقاً' }, { status: 400 });
        }

        const remainingAmount = n(booking.total) - n(booking.deposit);
        if (remainingAmount <= 0) {
            await prisma.booking.update({ where: { id: booking.id, tenantId }, data: { status: 'invoiced' } });
            return NextResponse.json({ success: true, message: 'مكتمل الدفع بالكامل مسبقاً' });
        }

        const newInvoice = await runFinancialTx(prisma, async (tx: any) => {
            let bookingProduct = await tx.product.findFirst({
                where: { name: 'خدمة حجز عامة', tenantId }
            });

            if (!bookingProduct) {
                bookingProduct = await tx.product.create({
                    data: {
                        tenantId,
                        name: 'خدمة حجز عامة',
                        buyPrice: 0,
                        sellPrice: 0,
                        taxRate: 15,
                        currentStock: 99999,
                    }
                });
            }

            const lastInvoice = await tx.salesInvoice.findFirst({ 
                where: { tenantId }, 
                orderBy: { invoiceNo: 'desc' } 
            });
            const invoiceNo = (lastInvoice?.invoiceNo || 0) + 1;

            const baseAmount = remainingAmount / 1.15;
            const taxAmount = remainingAmount - baseAmount;

            const invoice = await tx.salesInvoice.create({
                data: {
                    tenantId,
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

            await tx.booking.update({ where: { id: booking.id, tenantId }, data: { status: 'invoiced' } });

            await postSalesInvoice({
                invoiceNo: invoice.invoiceNo,
                subtotal: n(invoice.subtotal),
                taxValue: n(invoice.taxValue),
                total: n(invoice.total),
                paymentType: 'cash',
                userId: invoice.userId || undefined,
                branchId: 1,
                txClient: tx
            });

            EnterpriseLogger.traceFinancialTx(
                `BOOKING_INVOICE_${booking.id}`,
                'BOOKING_INVOICED',
                tenantId,
                { bookingId: booking.id, invoiceId: invoice.id, total: remainingAmount }
            );

            return invoice;
        }, `BOOKING_INVOICE_${booking.id}`);

        return NextResponse.json(newInvoice, { status: 201 });

    } catch (e: any) {
        EnterpriseLogger.error("Invoice Conversion Error:", { tenantId, userId: auth.userId }, e);
        return NextResponse.json({ error: e.message || 'فشل توليد الفاتورة' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'sales'] });
