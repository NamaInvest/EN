import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).fieldServiceOrder.findMany({
            take: 100, orderBy: { scheduledDate: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'field-service/orders' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const count = await (prisma as any).fieldServiceOrder.count();
    const item = await (prisma as any).fieldServiceOrder.create({ data: { orderNo: `FS-${String(count+1).padStart(5,'0')}`, customerName: d.customerName, address: d.address, lat: d.lat?parseFloat(d.lat):null, lng: d.lng?parseFloat(d.lng):null, technicianName: d.technicianName, scheduledDate: d.scheduledDate?new Date(d.scheduledDate):null, priority: d.priority||'MEDIUM', serviceType: d.serviceType||'REPAIR', description: d.description, tenantId: d.tenantId||'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'field-service/orders' }); }
}
export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const data: any = { status: d.status };
    if (d.status === 'IN_PROGRESS') data.startTime = new Date();
    if (d.status === 'COMPLETED') { data.endTime = new Date(); data.resolution = d.resolution; data.cost = d.cost ? parseFloat(d.cost) : undefined; }
    const item = await (prisma as any).fieldServiceOrder.update({ where: { id: parseInt(d.id) }, data });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'field-service/orders' }); }
}
