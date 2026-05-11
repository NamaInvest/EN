/**
 * Three-Way Matching API (C.4)
 * GET  /api/ap/three-way-match?invoiceId=X
 * POST /api/ap/three-way-match (body: { action: 'batch' | 'approve' | 'reject', invoiceId? })
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { ThreeWayMatchEngine } from '@/lib/three-way-match-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.ap.three-way-match' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (invoiceId) {
      const result = await ThreeWayMatchEngine.match(parseInt(invoiceId));
      return NextResponse.json(result);
    }

    // Return batch summary for dashboard
    const { results, summary } = await ThreeWayMatchEngine.batchMatch();
    const onHold = results.filter(r => ['ON_HOLD', 'QTY_VARIANCE', 'PRICE_VARIANCE', 'AMOUNT_VARIANCE', 'MISSING_PO', 'MISSING_GRN'].includes(r.status));

    return NextResponse.json({
      summary,
      onHold: onHold.slice(0, 50),
      totalVarianceAmount: Math.round(results.reduce((s, r) => s + r.netVarianceAmount, 0) * 100) / 100,
    });
  } catch (error: any) {
    log.error('3WM GET error:', error);
    return NextResponse.json({ error: 'فشل المطابقة الثلاثية' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;

    if (action === 'batch') {
      const { results, summary } = await ThreeWayMatchEngine.batchMatch(body.config);
      return NextResponse.json({ summary, results });
    }

    if (action === 'match-single') {
      const result = await ThreeWayMatchEngine.match(parseInt(body.invoiceId), body.config);
      return NextResponse.json(result);
    }

    if (action === 'approve') {
      // Manual approval override
      const { prisma } = await import('@/lib/prisma');
      await (prisma as any).purchaseInvoice?.update?.({
        where: { id: parseInt(body.invoiceId) },
        data: { matchStatus: 'APPROVED', matchApprovedBy: auth.userId, matchApprovedAt: new Date() },
      }).catch(() => null);

      log.info(`3WM: Invoice ${body.invoiceId} approved by user ${auth.userId}`);
      return NextResponse.json({ success: true, status: 'APPROVED' });
    }

    if (action === 'reject') {
      const { prisma } = await import('@/lib/prisma');
      await (prisma as any).purchaseInvoice?.update?.({
        where: { id: parseInt(body.invoiceId) },
        data: { matchStatus: 'REJECTED', matchNotes: body.reason },
      }).catch(() => null);

      log.info(`3WM: Invoice ${body.invoiceId} rejected`);
      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('3WM POST error:', error);
    return NextResponse.json({ error: 'فشل العملية' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
