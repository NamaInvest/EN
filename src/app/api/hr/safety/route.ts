import { NextRequest, NextResponse } from 'next/server';
import { EHSEngine } from '@/lib/ehs-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const incident = await EHSEngine.reportIncident(body.tenantId, body);
  return NextResponse.json({ incident }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const from = new Date(searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000));
  const to   = new Date(searchParams.get('to') ?? new Date());
  const kpis = await EHSEngine.getKPIs(tenantId, from, to);
  return NextResponse.json({ kpis });
}
