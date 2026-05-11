import { NextRequest, NextResponse } from 'next/server';
import { COPAEngine } from '@/lib/copa-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const results = await COPAEngine.runAllocation(body.sourceCC, body.period, body.totalCost);
  return NextResponse.json({ results });
}
