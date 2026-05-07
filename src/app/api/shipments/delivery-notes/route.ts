import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { DeliveryNoteEngine } from '@/lib/delivery-note-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const status = req.nextUrl.searchParams.get('status') || undefined;
        const list = await DeliveryNoteEngine.list(prisma, status);
        return NextResponse.json(list);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'create') {
            const dn = await DeliveryNoteEngine.createFromSalesOrder(prisma, body.salesOrderId, body.warehouseId || 1);
            return NextResponse.json(dn);
        }
        if (body.action === 'deliver') {
            const dn = await DeliveryNoteEngine.confirmDelivery(prisma, body.deliveryNoteId, body.signature, body.driverName);
            return NextResponse.json(dn);
        }
        if (body.action === 'invoice') {
            const inv = await DeliveryNoteEngine.createInvoiceFromDN(prisma, body.deliveryNoteId);
            return NextResponse.json(inv);
        }
        return NextResponse.json({ error: 'action: create | deliver | invoice' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
