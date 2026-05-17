import { NextRequest, NextResponse } from 'next/server';
import { CompReviewEngine } from '@/lib/comp-review-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

export async function POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body = await req.json();
  if (body.type === 'cycle') {
    const cycle = await CompReviewEngine.initCycle(tenantId, body.name, body.fiscalYear, body.budgetPool);
    return NextResponse.json({ cycle }, { status: 201 });
  }
  if (body.type === 'propose') {
    const proposal = await CompReviewEngine.proposeIncrease(tenantId, body.cycleId, body.employeeId, body.currentSalary, body.proposedIncrease);
    return NextResponse.json({ proposal }, { status: 201 });
  }
  if (body.type === 'approve') {
    const result = await CompReviewEngine.approve(tenantId, body.id);
    return NextResponse.json({ result });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const { searchParams } = new URL(req.url);
  const cycleId = Number(searchParams.get('cycleId'));
  const utilization = await CompReviewEngine.getBudgetUtilization(tenantId, cycleId);
  return NextResponse.json({ utilization });
}
