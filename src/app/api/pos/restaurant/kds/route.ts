import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos.kds' });

// Get Active Kitchen Orders
async function _GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);

        // Fetch invoices from today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const invoices = await prisma.salesInvoice.findMany({
            where: {
                date: { gte: startOfDay },
                status: { in: ['completed', 'pending'] }
            },
            include: {
                details: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        const tickets = invoices.map(inv => {
            let kdsData = { kds: 'NEW', table: 'سفري' };
            try {
                if (inv.notes && inv.notes.startsWith('{')) {
                    const parsed = JSON.parse(inv.notes);
                    if (parsed.kds) kdsData.kds = parsed.kds;
                    if (parsed.table) kdsData.table = parsed.table;
                } else if (inv.notes && inv.notes.includes('طاولة:')) {
                    kdsData.table = inv.notes.split('طاولة:')[1].trim();
                }
            } catch(e) {}

            return {
                id: inv.id,
                invoiceNo: inv.invoiceNo,
                table: kdsData.table,
                time: new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: inv.date,
                type: kdsData.table !== 'سفري' ? 'Dine-in' : 'Takeaway',
                status: kdsData.kds,
                items: inv.details.map(d => ({
                    id: d.id,
                    name: d.product?.name || 'منتج غير معروف',
                    qty: Number(d.quantity) || 1,
                    notes: '', 
                    allergens: []
                }))
            };
        }).filter(t => t.status !== 'DELIVERED' && t.status !== 'READY'); 

        return NextResponse.json({ success: true, tickets });
    } catch (e: any) {
        log.error('KDS GET Error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// Update KDS Status
async function _POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);
        
        const { invoiceId, status } = await req.json(); // status = PREPARING, READY, DELIVERED
        
        const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) return NextResponse.json({ success: false, error: 'Order not found' });

        let notesData: any = {};
        try {
            if (invoice.notes && invoice.notes.startsWith('{')) {
                notesData = JSON.parse(invoice.notes);
            } else if (invoice.notes) {
                notesData.text = invoice.notes;
            }
        } catch(e) {}

        notesData.kds = status;
        if (invoice.notes && invoice.notes.includes('طاولة:') && !notesData.table) {
            notesData.table = invoice.notes.split('طاولة:')[1].trim();
        }
        
        await prisma.salesInvoice.update({
            where: { id: invoiceId },
            data: { notes: JSON.stringify(notesData) }
        });

        return NextResponse.json({ success: true, message: 'تم تحديث حالة الطلب' });
    } catch (e: any) {
        log.error('KDS POST Error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
