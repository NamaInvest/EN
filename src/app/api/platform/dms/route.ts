import { NextRequest, NextResponse } from 'next/server';
import { DMSEngine } from '@/lib/dms-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const view     = searchParams.get('view') ?? 'search';
  const tenantId = searchParams.get('tenantId') ?? 'default';
  if (view === 'versions') return NextResponse.json({ versions: DMSEngine.getVersionHistory(Number(searchParams.get('documentId'))) });
  if (view === 'search')   return NextResponse.json({ results: DMSEngine.search(tenantId, searchParams.get('q') ?? '') });
  return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'create')   return NextResponse.json(DMSEngine.createDocument(body.tenantId ?? 'default', body.title, body.tags ?? '', body.fileUrl, body.uploadedBy), { status: 201 });
  if (body.type === 'upload')   return NextResponse.json(DMSEngine.uploadVersion(body.documentId, body.fileUrl, body.uploadedBy, body.changeNote), { status: 201 });
  if (body.type === 'checkout') return NextResponse.json(DMSEngine.checkOut(body.documentId, body.userId));
  if (body.type === 'checkin')  return NextResponse.json(DMSEngine.checkIn(body.documentId, body.userId, body.fileUrl, body.changeNote));
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
