import { NextRequest, NextResponse } from 'next/server';
import { OKREngine } from '@/lib/okr-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

export async function GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const { searchParams } = new URL(req.url);
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const data = await OKREngine.getProgress(tenantId, period);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body = await req.json();
  if (body.type === 'objective') {
    const obj = await OKREngine.createObjective(tenantId, body.ownerEmpId, body.title, body.period, body.level, body.parentObjectiveId);
    return NextResponse.json({ obj }, { status: 201 });
  }
  if (body.type === 'key_result') {
    const kr = await OKREngine.addKeyResult(tenantId, body.objectiveId, body.title, body.targetValue);
    return NextResponse.json({ kr }, { status: 201 });
  }
  if (body.type === 'update') {
    const kr = await OKREngine.updateProgress(tenantId, body.keyResultId, body.currentValue, body.confidence);
    return NextResponse.json({ kr });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
