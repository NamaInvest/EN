import { NextRequest, NextResponse } from 'next/server';
import { FsNotesEngine } from '@/lib/fs-notes-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  await FsNotesEngine.generateAllNotes(tenantId, period);
  return NextResponse.json({ success: true, period });
}
