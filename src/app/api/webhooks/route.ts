import { NextRequest, NextResponse } from 'next/server';
import { WebhookEngine } from '@/lib/webhook-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'dispatch') {
    await WebhookEngine.dispatch(body.subscriptionId, body.event, body.payload ?? {});
    return NextResponse.json({ dispatched: true });
  }
  return NextResponse.json({ error: 'type must be dispatch' }, { status: 400 });
}
