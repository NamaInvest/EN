import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextRequest, NextResponse } from 'next/server';
import { MESEngine } from '@/lib/mes-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const stations = await MESEngine.getDashboard(tenantId);
  return NextResponse.json({ stations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = await MESEngine.recordEvent(body.stationId, body.eventType, body.quantity, body.rejectReason);
  return NextResponse.json({ event }, { status: 201 });
}
