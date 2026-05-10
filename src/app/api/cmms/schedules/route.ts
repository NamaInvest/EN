import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cmms.schedules' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).maintenanceSchedule.findMany({ take: 100, include: { _count: { select: { workOrders: true } } }, orderBy: { nextDate: 'asc' } });
    return NextResponse.json(items);
  } catch (e: any) {
 log.error('src/app/api/cmms/schedules/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'cmms/schedules' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).maintenanceSchedule.create({ data: { assetName: d.assetName, type: d.type || 'PREVENTIVE', frequency: d.frequency || 'MONTHLY', nextDate: d.nextDate ? new Date(d.nextDate) : null, assignedTo: d.assignedTo, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) {
 log.error('src/app/api/cmms/schedules/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'cmms/schedules' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
