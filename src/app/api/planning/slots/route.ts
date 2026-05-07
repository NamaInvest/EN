import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).planningSlot.findMany({
            take: 100, orderBy: { startTime: 'asc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'planning/slots' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).planningSlot.create({ data: { employeeName: d.employeeName, role: d.role || null, startTime: new Date(d.startTime), endTime: new Date(d.endTime), notes: d.notes || null, color: d.color || '#3B82F6', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'planning/slots' }); }
}
export async function DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) await (prisma as any).planningSlot.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return apiError(e, 'Error', { context: 'planning/slots' }); }
}
