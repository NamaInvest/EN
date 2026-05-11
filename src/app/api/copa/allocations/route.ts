import { NextRequest, NextResponse } from 'next/server';
import { COPAEngine } from '@/lib/copa-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const alloc = await COPAEngine.createAllocation(body.sourceCC, body.targetDim, body.allocationKey, body.percent);
  return NextResponse.json({ alloc }, { status: 201 });
}
