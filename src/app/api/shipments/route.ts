import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
/**
 * POST /api/shipments — Create a shipment tracking record
 * GET  /api/shipments — List all shipments with status
 */
export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const shipment = await prisma.shipment.create({
            data: {
                salesInvoiceId: body.salesInvoiceId || null,
                purchaseOrderId: body.purchaseOrderId || null,
                carrier: body.carrier || '', // SMSA, DHL, Aramex, etc.
                trackingNumber: body.trackingNumber || '',
                status: body.status || 'pending', // pending, picked_up, in_transit, delivered, returned
                estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
                shippingCost: body.shippingCost || 0,
                recipientName: body.recipientName || '',
                recipientPhone: body.recipientPhone || '',
                recipientAddress: body.recipientAddress || '',
                recipientCity: body.recipientCity || '',
                notes: body.notes || '',
            },
        });
        return NextResponse.json(shipment, { status: 201 });
    } catch (e: any) {
        console.error('[Shipments]', e);
        return NextResponse.json({ error: 'فشل إنشاء الشحنة' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const shipments = await prisma.shipment.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        return NextResponse.json(shipments);
    } catch (e: any) {
        return NextResponse.json({ error: 'فشل جلب الشحنات' }, { status: 500 });
    }
}
