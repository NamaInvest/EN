import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { DeliveryNoteEngine } from '@/lib/delivery-note-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const status = req.nextUrl.searchParams.get('status') || undefined;
        const list = await DeliveryNoteEngine.list(prisma, status);
        return NextResponse.json(list);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  salesOrderId: z.union([z.string(), z.number()]).optional(),
  warehouseId: z.union([z.string(), z.number()]).optional(),
  deliveryNoteId: z.union([z.string(), z.number()]).optional(),
  signature: z.any().optional(),
  driverName: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
