import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { APSEngine } from '@/lib/aps-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'run') {
    const run = await APSEngine.runSchedule(body.tenantId, body.horizonDays ?? 30);
    return NextResponse.json({ run }, { status: 201 });
  }
  if (body.type === 'schedule_op') {
    const op = await APSEngine.scheduleOperation(body.manufacturingOrderId, body.operationId, body.workCenterId, new Date(body.plannedStart), new Date(body.plannedEnd), body.tenantId, body.sequence);
    return NextResponse.json({ op }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const workCenterId = Number(searchParams.get('workCenterId') ?? 0);
  const conflicts = await APSEngine.detectConflicts(tenantId, workCenterId);
  return NextResponse.json({ conflicts });
}
