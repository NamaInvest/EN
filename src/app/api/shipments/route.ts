import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'shipments' });
/**
 * POST /api/shipments — Create a shipment tracking record
 * GET  /api/shipments — List all shipments with status
 */

const _POSTSchema = z.object({
  salesInvoiceId: z.union([z.string(), z.number()]).optional(),
  purchaseOrderId: z.union([z.string(), z.number()]).optional(),
  carrier: z.any().optional(),
  trackingNumber: z.any().optional(),
  status: z.any().optional(),
  estimatedDelivery: z.any().optional(),
  shippingCost: z.number().optional(),
  recipientName: z.any().optional(),
  recipientPhone: z.string().optional(),
  recipientAddress: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
        log.error('[Shipments]', e);
        return NextResponse.json({ error: 'فشل إنشاء الشحنة' }, { status: 500 });
    }
}

async function _GET(request: NextRequest) {
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
