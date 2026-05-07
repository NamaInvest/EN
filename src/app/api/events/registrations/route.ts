import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const where = eventId ? { eventId: parseInt(eventId) } : {};
    const items = await (prisma as any).eventRegistration.findMany({
            take: 100, where, include: { event: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'events/registrations' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).eventRegistration.create({ data: { eventId: parseInt(d.eventId), name: d.name, email: d.email, phone: d.phone || null, ticketType: d.ticketType || 'GENERAL' } });
    await (prisma as any).event.update({ where: { id: parseInt(d.eventId) }, data: { registeredCount: { increment: 1 } } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'events/registrations' }); }
}
