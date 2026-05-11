import { NextRequest, NextResponse } from 'next/server';
import { BadDebtEngine } from '@/lib/bad-debt-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'create') {
    const provision = await BadDebtEngine.createProvision(body.tenantId, body.customerId, body.period, body.amount, body.reason);
    return NextResponse.json({ provision }, { status: 201 });
  }
  if (body.type === 'approve') {
    const provision = await BadDebtEngine.approve(body.id);
    return NextResponse.json({ provision });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const movement = await BadDebtEngine.getMovement(tenantId, period);
  return NextResponse.json({ movement });
}
