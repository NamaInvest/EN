import { NextRequest, NextResponse } from 'next/server';
import { AROEngine } from '@/lib/aro-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, assetId, settlementCost, settlementDate, discountRate } = body;
  const aro = await AROEngine.record(tenantId, assetId, settlementCost, new Date(settlementDate), discountRate);
  return NextResponse.json({ aro }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const accretion = await AROEngine.accrue(body.aroId, new Date(body.period));
  return NextResponse.json({ accretion });
}
