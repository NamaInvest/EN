import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.kanban' });
async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    
    try {
        // 1. Kanban Data (Work Orders grouped by status)
        const orders = await prisma.manufacturingOrder.findMany({ take: 100,
            include: { recipe: { include: { finishedProduct: true } }, machine: true },
            orderBy: { id: 'desc' }
        });

        const kanban = {
            todo: orders.filter(o => o.status === 'draft'),
            inProgress: orders.filter(o => o.status === 'in_progress'),
            done: orders.filter(o => o.status === 'completed')
        };

        // 2. Traceability Logs
        const traceability = await (prisma as any).traceabilityLog.findMany({
            orderBy: { id: 'desc' },
            take: 20
        });

        // 3. IoT Telemetry (Simulated or Real if available)
        const telemetry = await (prisma as any).machineTelemetry.findMany({
            include: { machine: true },
            orderBy: { id: 'desc' },
            take: 10
        });

        return NextResponse.json({ kanban, traceability, telemetry });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch Kanban data' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  actionType: z.any().optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  newStatus: z.any().optional(),
  rawBatchId: z.union([z.string(), z.number()]).optional(),
  finishedBatchId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const { actionType, orderId, newStatus, rawBatchId, finishedBatchId } = body;

    try {
        if (actionType === 'update_status') {
            await prisma.manufacturingOrder.update({
                where: { id: parseInt(orderId) , tenantId },
                data: { status: newStatus }
            });
            return NextResponse.json({ message: 'تم تحديث حالة Kanban' });
        }
        else if (actionType === 'add_traceability') {
            await (prisma as any).traceabilityLog.create({
                data: {
                    orderId: parseInt(orderId),
                    rawBatchId: rawBatchId ? parseInt(rawBatchId) : null,
                    finishedBatchId: finishedBatchId ? parseInt(finishedBatchId) : null,
                    action: 'produced'
                }
            });
            return NextResponse.json({ message: 'تم تسجيل التتبع (Traceability)' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
