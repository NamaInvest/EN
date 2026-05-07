import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).event.findMany({ include: { _count: { select: { registrations: true } } }, orderBy: { startDate: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'events' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).event.create({ data: { title: d.title, type: d.type || 'WORKSHOP', location: d.location, startDate: new Date(d.startDate), endDate: new Date(d.endDate), capacity: parseInt(d.capacity) || 100, ticketPrice: parseFloat(d.ticketPrice) || 0, description: d.description, status: d.status || 'UPCOMING', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'events' }); }
}
