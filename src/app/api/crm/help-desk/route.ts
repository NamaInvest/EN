import { NextRequest, NextResponse } from 'next/server';
import { HelpDeskEngine } from '@/lib/help-desk-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sla = await HelpDeskEngine.assignSLA(body.ticketId, body.priority);
  return NextResponse.json({ sla });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const metrics = await HelpDeskEngine.getMetrics(tenantId);
  return NextResponse.json({ metrics });
}
