import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cmms.work-orders' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).maintenanceWorkOrder.findMany({
            take: 100, include: { schedule: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'cmms/work-orders' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).maintenanceWorkOrder.create({ data: { scheduleId: d.scheduleId ? parseInt(d.scheduleId) : null, assetId: d.assetId ? parseInt(d.assetId) : null, priority: d.priority || 'MEDIUM', description: d.description || null, startDate: d.startDate ? new Date(d.startDate) : null, cost: parseFloat(d.cost) || 0, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'cmms/work-orders' }); }
}
async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).maintenanceWorkOrder.update({ where: { id: parseInt(d.id) }, data: { status: d.status, completedDate: d.status === 'COMPLETED' ? new Date() : undefined, technicianNotes: d.technicianNotes, cost: d.cost ? parseFloat(d.cost) : undefined } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'cmms/work-orders' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
