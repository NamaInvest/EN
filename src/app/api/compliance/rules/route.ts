import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const where = ruleId ? { ruleId: parseInt(ruleId) } : {};
    const items = await (prisma as any).complianceRule.findMany({ include: { checks: { orderBy: { checkDate: 'desc' }, take: 5 } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/rules' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).complianceRule.create({ data: { name: d.name, regulation: d.regulation || null, description: d.description || null, frequency: d.frequency || 'MONTHLY', responsible: d.responsible || null, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/rules' }); }
}
