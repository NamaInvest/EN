import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ShippingEngine } from '@/lib/shipping-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'shipping' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');
    try {
        if (view === 'shipments') return NextResponse.json(await ShippingEngine.getShipments(prisma, user.tenantId || ''));
        return NextResponse.json(await ShippingEngine.getCarriers(prisma, user.tenantId || ''));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  carrierId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  carrier: z.any().optional(),
  weight: z.any().optional(),
  destination: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'create_shipment') return NextResponse.json(await ShippingEngine.createShipment(prisma, { orderId: body.orderId, carrierId: body.carrierId, tenantId: user.tenantId || '' }));
        if (body.action === 'update_status') return NextResponse.json(await ShippingEngine.updateStatus(prisma, body.id, body.status));
        if (body.action === 'estimate') return NextResponse.json(await ShippingEngine.estimateCost(body.carrier, body.weight, body.destination));
        return NextResponse.json(await ShippingEngine.createCarrier(prisma, { ...body, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
