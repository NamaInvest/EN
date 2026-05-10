import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import type { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logFieldChanges, logDelete, auditContextFromRequest } from '@/lib/field-audit';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customers/id' });
async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
        if (!customer) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
        return NextResponse.json(customer);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'خطأ' }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  name: z.any().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  street: z.any().optional(),
  buildingNumber: z.any().optional(),
  district: z.any().optional(),
  city: z.any().optional(),
  postalCode: z.any().optional(),
  type: z.any().optional(),
  creditLimit: z.any().optional(),
  taxNumber: z.number().optional(),
  crNo: z.any().optional(),
}).passthrough();

async function _PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const customerId = parseInt(id);
        const auth = getUserFromRequest(request as unknown as NextRequest);
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        // 1. Read before state for audit
        const before = await prisma.customer.findUnique({ where: { id: customerId } });

        // 2. Perform update
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: {
                name: body.name, phone: body.phone || null, address: body.address || null,
                street: body.street || null, buildingNumber: body.buildingNumber || null,
                district: body.district || null, city: body.city || null, postalCode: body.postalCode || null,
                type: parseInt(body.type) || 0, creditLimit: parseFloat(body.creditLimit) || 0,
                taxNumber: body.taxNumber || null, 
                // @ts-ignore
                crNo: body.crNo || null, notes: body.notes || null,
                routeId: body.routeId ? parseInt(body.routeId) : null,
            },
        });

        // 3. Audit trail — log all field changes
        try {
            await logFieldChanges(prisma, 'Customer', customerId, before, customer, auditContextFromRequest(request, auth ?? undefined));
        } catch (e: any) { log.error('[audit] Customer update audit failed:', e); }

        return NextResponse.json(customer);
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as unknown as NextRequest);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        // Audit trail — log deletion before it happens
        try {
            const before = await prisma.customer.findUnique({ where: { id: customerId } });
            if (before) await logDelete(prisma, 'Customer', customerId, before as any, auditContextFromRequest(request, auth));
        } catch (e: any) { log.error('[audit] Customer delete audit failed:', e); }

        await prisma.customer.delete({ where: { id: customerId } });
        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error: any) {
        log.error(error);
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
