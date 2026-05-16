import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { OEEEngine } from '@/lib/oee-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, machineId, shiftId, plannedTime, runTime, idealCycleTime, totalCount, rejectCount } = body;
  const record = await OEEEngine.record(tenantId, machineId, shiftId, plannedTime, runTime, idealCycleTime, totalCount, rejectCount);
  return NextResponse.json({ record }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const from = new Date(searchParams.get('from') ?? new Date(Date.now() - 7 * 86400000));
  const to   = new Date(searchParams.get('to') ?? new Date());
  const data = await OEEEngine.getDashboard(tenantId, from, to);
  return NextResponse.json({ data });
}
