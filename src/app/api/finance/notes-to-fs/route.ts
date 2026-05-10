/**
 * Notes to Financial Statements API
 * GET /api/finance/notes-to-fs?startDate=&endDate=&noteNumber=
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { NotesToFinancialStatements } from '@/lib/notes-to-fs-engine';

const log = logger.child({ service: 'api.finance.notes-to-fs' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const startDate = new Date(searchParams.get('startDate') || `${now.getFullYear()}-01-01`);
    const endDate   = new Date(searchParams.get('endDate') || `${now.getFullYear()}-12-31`);
    const noteNumber = searchParams.get('noteNumber') ? parseInt(searchParams.get('noteNumber')!) : null;

    const notes = await NotesToFinancialStatements.generate({ startDate, endDate });

    const result = noteNumber
      ? notes.filter(n => n.noteNumber === noteNumber)
      : notes;

    return NextResponse.json({
      notes: result,
      generatedAt: new Date().toISOString(),
      period: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
      count: result.length,
    });
  } catch (error: any) {
    log.error('Notes to FS error:', error);
    return NextResponse.json({ error: 'فشل توليد الإيضاحات المالية' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
