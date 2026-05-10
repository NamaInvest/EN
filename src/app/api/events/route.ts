import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'events' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).event.findMany({ take: 100, include: { _count: { select: { registrations: true } } }, orderBy: { startDate: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) {
 log.error('src/app/api/events/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'events' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).event.create({ data: { title: d.title, type: d.type || 'WORKSHOP', location: d.location, startDate: new Date(d.startDate), endDate: new Date(d.endDate), capacity: parseInt(d.capacity) || 100, ticketPrice: parseFloat(d.ticketPrice) || 0, description: d.description, status: d.status || 'UPCOMING', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) {
 log.error('src/app/api/events/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'events' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
