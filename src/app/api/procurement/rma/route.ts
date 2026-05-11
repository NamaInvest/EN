import { NextRequest, NextResponse } from 'next/server';
import { RMAEngine } from '@/lib/rma-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'create') return NextResponse.json(await RMAEngine.create(body.tenantId, body), { status: 201 });
  if (body.type === 'approve') return NextResponse.json(await RMAEngine.approve(body.rmaId, body.approvedBy));
  if (body.type === 'receive') return NextResponse.json(await RMAEngine.receive(body.rmaId, body.receivedBy));
  if (body.type === 'inspect') return NextResponse.json(await RMAEngine.inspect(body.rmaId, body.lineId, body.disposition));
  if (body.type === 'resolve') return NextResponse.json(await RMAEngine.resolve(body.rmaId, body.resolution, body.resolvedBy));
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const metrics = await RMAEngine.getMetrics(tenantId);
  return NextResponse.json({ metrics });
}
