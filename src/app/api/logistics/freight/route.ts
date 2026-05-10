import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'logistics.freight' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).freightOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'logistics/freight' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const count = await (prisma as any).freightOrder.count();
    const item = await (prisma as any).freightOrder.create({ data: { orderNo: `FO-${String(count + 1).padStart(5, '0')}`, type: d.type || 'OUTBOUND', origin: d.origin, destination: d.destination, weight: parseFloat(d.weight) || 0, volume: parseFloat(d.volume) || 0, cost: parseFloat(d.cost) || 0, trackingNo: d.trackingNo, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'logistics/freight' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
