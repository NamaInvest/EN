import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rental.returns' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).rentalReturn.findMany({ take: 100, include: { agreement: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) {
 log.error('src/app/api/rental/returns/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'rental/returns' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).rentalReturn.create({ data: { agreementId: parseInt(d.agreementId), returnDate: new Date(d.returnDate || new Date()), condition: d.condition || 'GOOD', damageNotes: d.damageNotes, damageCost: parseFloat(d.damageCost)||0, inspectedBy: d.inspectedBy } });
    await (prisma as any).rentalAgreement.update({ where: { id: parseInt(d.agreementId) }, data: { status: 'RETURNED' } });
    return NextResponse.json(item);
  } catch (e: any) {
 log.error('src/app/api/rental/returns/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'rental/returns' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
