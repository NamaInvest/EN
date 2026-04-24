import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// Public API - customer can call waiter from QR menu
export async function POST(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const { tableId, tableName } = await req.json();

        // Create a special pending invoice as a waiter call notification
        const lastInvoice = await prisma.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
        const invoiceNo = lastInvoice ? lastInvoice.invoiceNo + 1 : 10001;

        await prisma.salesInvoice.create({
            data: {
                invoiceNo,
                date: new Date(),
                subtotal: 0,
                taxValue: 0,
                total: 0,
                paid: 0,
                remaining: 0,
                paymentType: 'pending',
                status: 'pending',
                notes: `🔔 استدعاء نادل${tableName ? ` | 🍽️ طاولة: ${tableName}` : tableId ? ` | طاولة رقم: ${tableId}` : ''} | ⏰ ${new Date().toLocaleTimeString('en-GB')}`,
            }
        });

        return NextResponse.json({ success: true, message: 'تم استدعاء النادل' });
    } catch (e: any) {
        console.error('Call waiter error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
