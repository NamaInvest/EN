import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'portal.messages' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).portalMessage.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) {
 log.error('src/app/api/portal/messages/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'portal/messages' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).portalMessage.create({ data: { portalUserId: parseInt(d.portalUserId), subject: d.subject, body: d.body, direction: d.direction || 'INBOUND', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) {
 log.error('src/app/api/portal/messages/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'portal/messages' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
