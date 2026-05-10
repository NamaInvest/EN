import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'maintenance' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const items = await prisma.maintenance.findMany({
            take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(items);
    } catch (e: any) { log.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  customerName: z.any().optional(),
  phone: z.string().optional(),
  deviceType: z.any().optional(),
  problem: z.any().optional(),
  cost: z.number().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const item = await prisma.maintenance.create({
            data: {
                customerName: body.customerName || null, phone: body.phone || null,
                deviceType: body.deviceType || null, problem: body.problem || null,
                cost: parseFloat(body.cost) || 0, status: 'pending',
                userId: body.userId || null, notes: body.notes || null,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) { log.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  cost: z.number().optional(),
  notes: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const item = await prisma.maintenance.update({
            where: { id: body.id },
            data: { status: body.status, cost: body.cost ? parseFloat(body.cost) : undefined, notes: body.notes },
        });

        // Treasury entry when completed
        if (body.status === 'completed' && n(item.cost) > 0) {
            await prisma.treasury.create({ data: { type: 'in', amount: n(item.cost), description: `صيانة - ${item.deviceType || 'جهاز'}`, referenceType: 'maintenance', referenceId: item.id, userId: body.userId || null } });
        }

        return NextResponse.json(item);
    } catch (e: any) { log.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
