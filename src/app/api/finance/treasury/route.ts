/**
 * Treasury Cash Position API
 * GET /api/finance/treasury/cash-position?tenantId=X
 * GET /api/finance/treasury/fx-exposure?tenantId=X
 * GET /api/finance/treasury/realized-fx?tenantId=X&from=YYYY-MM-DD&to=YYYY-MM-DD
 * POST /api/finance/treasury/realized-fx/post  — post to GL
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { TreasuryCashPositionEngine } from '@/lib/treasury-cash-position-engine';
import { RealizedFXEngine } from '@/lib/realized-fx-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.treasury' });

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get('tenantId') ?? 'default';
  const view      = searchParams.get('view') ?? 'cash-position';  // cash-position | realized-fx
  const fromParam = searchParams.get('from');
  const toParam   = searchParams.get('to');

  if (view === 'realized-fx') {
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const fromDate  = fromParam ? new Date(fromParam) : monthStart;
    const toDate    = toParam   ? new Date(toParam)   : now;

    const report = await RealizedFXEngine.calculatePeriodRealizedGL(tenantId, fromDate, toDate);
    return NextResponse.json(report);
  }

  // Default: cash position
  const position = await TreasuryCashPositionEngine.getCashPosition(tenantId);
  return NextResponse.json(position);
}

async function _POST(req: NextRequest) {
  const body    = await req.json();
  const action  = body.action as string;
  const tenantId = body.tenantId as string;

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  if (action === 'post-realized-fx') {
    const { entry, userId, fiscalYearId } = body;
    if (!entry || !userId || !fiscalYearId) {
      return NextResponse.json({ error: 'entry, userId, fiscalYearId required' }, { status: 400 });
    }
    const result = await RealizedFXEngine.postRealizedFXEntry(tenantId, entry, String(userId), fiscalYearId);
    return NextResponse.json(result, { status: result.posted ? 201 : 422 });
  }

  return NextResponse.json({
    error:   'action غير صحيح',
    options: ['post-realized-fx'],
  }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
