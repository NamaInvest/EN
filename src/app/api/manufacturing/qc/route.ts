import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.qc' });
async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        if (type === 'maintenance') {
            const logs = await prisma.machineMaintenance.findMany({ take: 100,
                where: { tenantId },
                include: { machine: true },
                orderBy: { id: 'desc' }
            });
            return NextResponse.json(logs);
        } else {
            const checks = await prisma.qualityCheck.findMany({ take: 100,
                where: { tenantId },
                include: { order: { include: { recipe: true } } },
                orderBy: { id: 'desc' }
            });
            return NextResponse.json(checks);
        }
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch QC data' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  actionType: z.any().optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  inspectorName: z.any().optional(),
  checkType: z.any().optional(),
  status: z.any().optional(),
  notes: z.any().optional(),
  machineId: z.union([z.string(), z.number()]).optional(),
  maintenanceType: z.any().optional(),
  description: z.any().optional(),
  cost: z.number().optional(),
  scheduledDate: z.string().optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const { actionType } = body;

    try {
        if (actionType === 'add_qc') {
            const { orderId, inspectorName, checkType, status, notes } = body;
            const check = await prisma.qualityCheck.create({
                data: {
                    tenantId,
                    manufacturingOrderId: parseInt(orderId),
                    inspectorName,
                    checkType,
                    status,
                    notes
                }
            });
            return NextResponse.json({ message: 'تم تسجيل فحص الجودة بنجاح', data: check });
        } 
        else if (actionType === 'add_maintenance') {
            const { machineId, maintenanceType, description, cost, scheduledDate } = body;
            const log = await prisma.machineMaintenance.create({
                data: {
                    tenantId,
                    machineId: parseInt(machineId),
                    maintenanceType,
                    description,
                    cost: parseFloat(cost),
                    scheduledDate: new Date(scheduledDate)
                }
            });
            return NextResponse.json({ message: 'تم جدولة صيانة الآلة بنجاح', data: log });
        }
        
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    } catch (error: any) {
        log.error("QC POST error:", error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
