import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).planningSlot.findMany({
            take: 100, orderBy: { startTime: 'asc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'planning/slots' }); }
}
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).planningSlot.create({ data: { employeeName: d.employeeName, role: d.role || null, startTime: new Date(d.startTime), endTime: new Date(d.endTime), notes: d.notes || null, color: d.color || '#3B82F6', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'planning/slots' }); }
}
async function _DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) await (prisma as any).planningSlot.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return apiError(e, 'Error', { context: 'planning/slots' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
