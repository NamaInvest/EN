import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'compliance.rules' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const where = ruleId ? { ruleId: parseInt(ruleId) } : {};
    const items = await (prisma as any).complianceRule.findMany({ include: { checks: { orderBy: { checkDate: 'desc' }, take: 5 } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) {
 log.error('src/app/api/compliance/rules/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'compliance/rules' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).complianceRule.create({ data: { name: d.name, regulation: d.regulation || null, description: d.description || null, frequency: d.frequency || 'MONTHLY', responsible: d.responsible || null, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) {
 log.error('src/app/api/compliance/rules/route.ts', { error: e instanceof Error ? e.message : e });
 return apiError(e, 'Error', { context: 'compliance/rules' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
