import { NextRequest, NextResponse } from 'next/server';
import { FieldEncryptionEngine } from '@/lib/field-encryption-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'store') {
    const record = await FieldEncryptionEngine.storeEncryptedField(body.entityType, body.entityId, body.fieldName, body.plaintext);
    return NextResponse.json({ record }, { status: 201 });
  }
  if (body.type === 'decrypt') {
    const value = await FieldEncryptionEngine.getDecryptedField(body.entityType, body.entityId, body.fieldName);
    if (value === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ value });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
