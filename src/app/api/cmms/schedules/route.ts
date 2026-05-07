import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).maintenanceSchedule.findMany({ include: { _count: { select: { workOrders: true } } }, orderBy: { nextDate: 'asc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'cmms/schedules' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).maintenanceSchedule.create({ data: { assetName: d.assetName, type: d.type || 'PREVENTIVE', frequency: d.frequency || 'MONTHLY', nextDate: d.nextDate ? new Date(d.nextDate) : null, assignedTo: d.assignedTo, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'cmms/schedules' }); }
}
