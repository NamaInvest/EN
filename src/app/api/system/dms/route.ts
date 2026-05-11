import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { DMSEngine } from '@/lib/dms-engine';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'system.dms' });

async function _GET(req: NextRequest) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const search   = req.nextUrl.searchParams.get('search');
    const tenantId = (user as any).tenantId || 'default';
    const query    = search ?? '';
    return NextResponse.json(DMSEngine.search(tenantId, query));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function _POST(req: NextRequest) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const body = await req.json();
    const tenantId  = (user as any).tenantId || 'default';
    const uploadedBy = (user as any).id ?? 0;

    if (body.action === 'create') {
      const doc = DMSEngine.createDocument(tenantId, body.title, body.tags ?? '', body.fileUrl, uploadedBy);
      return NextResponse.json(doc);
    }
    if (body.action === 'upload') {
      const version = DMSEngine.uploadVersion(body.documentId, body.fileUrl, uploadedBy, body.changeNote);
      return NextResponse.json(version);
    }
    if (body.action === 'checkout') {
      return NextResponse.json(DMSEngine.checkOut(body.documentId, uploadedBy));
    }
    if (body.action === 'checkin') {
      return NextResponse.json(DMSEngine.checkIn(body.documentId, uploadedBy, body.fileUrl, body.changeNote));
    }
    return NextResponse.json({ error: 'action: create | upload | checkout | checkin' }, { status: 400 });
  } catch (e: any) {
    log.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
