import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.capacity' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        // Fetch all work centers / machines as resources
        const machines = await prisma.machine.findMany({ take: 100,
            where: { status: 'active' },
            select: { id: true, name: true, code: true }
        });

        // Fetch all MOs that have start/end dates and are not cancelled
        const orders = await prisma.manufacturingOrder.findMany({ take: 100,
            where: {
                status: { in: ['draft', 'in_progress', 'scheduled'] },
                startDate: { not: undefined },
                endDate: { not: null }
            },
            include: { recipe: true }
        });

        return NextResponse.json({ success: true, data: { machines, orders } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  orderId: z.union([z.string(), z.number()]).optional(),
  newStartDate: z.string().optional(),
  newEndDate: z.string().optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { orderId, newStartDate, newEndDate, machineId } = body;

        const updated = await prisma.manufacturingOrder.update({
            where: { id: Number(orderId) },
            data: {
                startDate: new Date(newStartDate),
                endDate: new Date(newEndDate),
                machineId: machineId ? Number(machineId) : undefined
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
