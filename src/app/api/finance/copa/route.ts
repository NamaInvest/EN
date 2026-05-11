import { NextRequest, NextResponse } from 'next/server';
import { COPAEngine } from '@/lib/copa-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'allocation') {
    const alloc = await COPAEngine.createAllocation(body.sourceCC, body.targetDim, body.allocationKey, body.percent);
    return NextResponse.json({ alloc }, { status: 201 });
  }
  if (body.type === 'run') {
    const results = await COPAEngine.runAllocation(body.sourceCC, body.period, body.totalCost);
    return NextResponse.json({ results });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
