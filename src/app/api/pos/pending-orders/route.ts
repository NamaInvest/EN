import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

// Get pending orders from digital menu
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos.pending-orders' });
async function _GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);

        const pendingOrders = await prisma.salesInvoice.findMany({
            where: { status: 'pending', paymentType: 'pending' },
            include: { details: true },
            orderBy: { date: 'desc' },
            take: 20
        });

        return NextResponse.json({ success: true, orders: pendingOrders });
    } catch (e: any) {
        log.error('Pending orders error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// Approve or reject an order
async function _POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);
        const { action, invoiceId } = await req.json();

        if (action === 'approve') {
            // Get invoice first
            const invoice = await prisma.salesInvoice.findUnique({
                where: { id: invoiceId },
                include: { details: true }
            });
            if (!invoice) return NextResponse.json({ success: false, error: 'الفاتورة غير موجودة' });

            // Update status to completed
            await prisma.salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'completed',
                    paymentType: 'cash',
                    paid: n(invoice.total),
                    remaining: 0
                }
            });

            // Deduct stock for each item
            for (const d of invoice.details) {
                await prisma.product.update({
                    where: { id: d.productId },
                    data: { currentStock: { decrement: d.quantity } }
                });
            }

            return NextResponse.json({ success: true, message: 'تمت الموافقة على الطلب' });
        }

        if (action === 'reject') {
            await prisma.salesInvoice.update({
                where: { id: invoiceId },
                data: { status: 'cancelled' }
            });
            return NextResponse.json({ success: true, message: 'تم رفض الطلب' });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        log.error('Order action error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
