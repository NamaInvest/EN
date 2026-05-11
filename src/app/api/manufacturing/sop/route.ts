import { NextRequest, NextResponse } from 'next/server';
import { SOPEngine } from '@/lib/sop-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'init') {
    const cycle = await SOPEngine.initCycle(body.tenantId, new Date(body.cycleMonth));
    return NextResponse.json({ cycle }, { status: 201 });
  }
  if (body.type === 'advance') {
    const cycle = await SOPEngine.advanceStage(body.id);
    return NextResponse.json({ cycle });
  }
  if (body.type === 'stage_output') {
    const cycle = await SOPEngine.saveStageOutput(body.id, body.outputs);
    return NextResponse.json({ cycle });
  }
  if (body.type === 'decisions') {
    const cycle = await SOPEngine.saveExecutiveDecisions(body.id, body.decisions);
    return NextResponse.json({ cycle });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
