import { NextRequest, NextResponse } from 'next/server';
import { IPaaSEngine } from '@/lib/ipaas-engine';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ connectors: IPaaSEngine.list() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'register') {
    const connector = IPaaSEngine.register({ name: body.name, type: body.connectorType, webhookUrl: body.webhookUrl, events: body.events, headers: body.headers, active: true });
    return NextResponse.json({ connector }, { status: 201 });
  }
  if (body.type === 'trigger') {
    const result = await IPaaSEngine.trigger(body.connectorId, body.event, body.payload ?? {});
    return NextResponse.json({ result });
  }
  if (body.type === 'broadcast') {
    const results = await IPaaSEngine.broadcast(body.event, body.payload ?? {});
    return NextResponse.json({ results });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
