import { NextRequest, NextResponse } from 'next/server';
import { SSOEngine } from '@/lib/sso-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'register') {
    const provider = await SSOEngine.registerProvider(body.tenantId, body.ssoType, body.name, body.config);
    return NextResponse.json({ provider }, { status: 201 });
  }
  if (body.type === 'toggle') {
    const provider = await SSOEngine.toggleProvider(body.id, body.isActive);
    return NextResponse.json({ provider });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const provider = await SSOEngine.getActiveProvider(tenantId);
  return NextResponse.json({ provider });
}
