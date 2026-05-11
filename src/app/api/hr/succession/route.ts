import { NextRequest, NextResponse } from 'next/server';
import { SuccessionEngine } from '@/lib/succession-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'rate') {
    const rating = await SuccessionEngine.rateEmployee(body.tenantId, body.employeeId, body.reviewCycle, body.performance, body.potential);
    return NextResponse.json({ rating }, { status: 201 });
  }
  if (body.type === 'add_candidate') {
    const candidate = await SuccessionEngine.addCandidate(body.planId, body.employeeId, body.readiness, body.gaps);
    return NextResponse.json({ candidate }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const planId = Number(searchParams.get('planId'));
  const candidates = await SuccessionEngine.identifySuccessors(planId);
  return NextResponse.json({ candidates });
}
