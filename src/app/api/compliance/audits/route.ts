import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).internalAudit.findMany({ include: { _count: { select: { findings: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/audits' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).internalAudit.create({ data: { title: d.title, scope: d.scope || null, auditor: d.auditor || null, startDate: d.startDate ? new Date(d.startDate) : null, endDate: d.endDate ? new Date(d.endDate) : null, status: d.status || 'PLANNED', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/audits' }); }
}
