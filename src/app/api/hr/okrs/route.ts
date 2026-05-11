import { NextRequest, NextResponse } from 'next/server';
import { OKREngine } from '@/lib/okr-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const data = await OKREngine.getProgress(tenantId, period);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'objective') {
    const obj = await OKREngine.createObjective(body.tenantId, body.ownerEmpId, body.title, body.period, body.level, body.parentObjectiveId);
    return NextResponse.json({ obj }, { status: 201 });
  }
  if (body.type === 'key_result') {
    const kr = await OKREngine.addKeyResult(body.objectiveId, body.title, body.targetValue);
    return NextResponse.json({ kr }, { status: 201 });
  }
  if (body.type === 'update') {
    const kr = await OKREngine.updateProgress(body.keyResultId, body.currentValue, body.confidence);
    return NextResponse.json({ kr });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
