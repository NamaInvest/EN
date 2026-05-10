import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'events.registrations' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const where = eventId ? { eventId: parseInt(eventId) } : {};
    const items = await (prisma as any).eventRegistration.findMany({ take: 100, where, include: { event: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) {
 log.error('src/app/api/events/registrations/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'events/registrations' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).eventRegistration.create({ data: { eventId: parseInt(d.eventId), name: d.name, email: d.email, phone: d.phone || null, ticketType: d.ticketType || 'GENERAL' } });
    await (prisma as any).event.update({ where: { id: parseInt(d.eventId) }, data: { registeredCount: { increment: 1 } } });
    return NextResponse.json(item);
  } catch (e: any) {
 log.error('src/app/api/events/registrations/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'events/registrations' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
