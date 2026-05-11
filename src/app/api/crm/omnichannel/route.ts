import { NextRequest, NextResponse } from 'next/server';
import { OmnichannelEngine } from '@/lib/omnichannel-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const grouped = await OmnichannelEngine.getOpenByChannel(tenantId);
  return NextResponse.json({ channels: grouped });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'conversation') {
    const conv = await OmnichannelEngine.createConversation(body.tenantId, body.channelType, body.customerId);
    return NextResponse.json({ conv }, { status: 201 });
  }
  if (body.type === 'message') {
    const msg = await OmnichannelEngine.addMessage(body.conversationId, body.direction, body.content, body.sentBy);
    return NextResponse.json({ msg }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
