import { NextRequest, NextResponse } from 'next/server';
import { CompReviewEngine } from '@/lib/comp-review-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'cycle') {
    const cycle = await CompReviewEngine.initCycle(body.tenantId, body.name, body.fiscalYear, body.budgetPool);
    return NextResponse.json({ cycle }, { status: 201 });
  }
  if (body.type === 'propose') {
    const proposal = await CompReviewEngine.proposeIncrease(body.cycleId, body.employeeId, body.currentSalary, body.proposedIncrease);
    return NextResponse.json({ proposal }, { status: 201 });
  }
  if (body.type === 'approve') {
    const result = await CompReviewEngine.approve(body.id);
    return NextResponse.json({ result });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cycleId = Number(searchParams.get('cycleId'));
  const utilization = await CompReviewEngine.getBudgetUtilization(cycleId);
  return NextResponse.json({ utilization });
}
