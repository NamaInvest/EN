import { NextRequest, NextResponse } from 'next/server';
import { ESignatureEngine } from '@/lib/esignature-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'create') {
    const envelope = ESignatureEngine.createEnvelope(body.tenantId, body.documentId, body.signatories);
    return NextResponse.json({ envelope }, { status: 201 });
  }
  if (body.type === 'sign') {
    const token = ESignatureEngine.generateToken(body.envelopeId, body.userId);
    const envelope = ESignatureEngine.sign(body.envelopeId, body.userId, body.ipAddress ?? '0.0.0.0', token);
    return NextResponse.json({ envelope });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') ?? '';
  const envelope = ESignatureEngine.getEnvelope(id);
  if (!envelope) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ envelope });
}
