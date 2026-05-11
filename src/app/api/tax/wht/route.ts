/**
 * WHT API (A.8)
 * GET  /api/tax/wht?period=2026-05        — Monthly return summary
 * POST /api/tax/wht { action: 'calculate', invoiceId, serviceType }
 * POST /api/tax/wht { action: 'apply', invoiceId, serviceType, userId }
 * POST /api/tax/wht { action: 'form14', period }
 * GET  /api/tax/wht?action=pending        — Pending WHT transactions
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { WHTEngine } from '@/lib/wht-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.tax.wht' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const action = searchParams.get('action');

    if (action === 'pending') {
      const pending = await WHTEngine.getPendingWHTTransactions().catch(() => []);
      return NextResponse.json({ pending, count: (pending as any[]).length });
    }

    if (period) {
      const [year, month] = period.split('-').map(Number);
      if (!year || !month) return NextResponse.json({ error: 'period يجب أن يكون YYYY-MM' }, { status: 400 });
      const zatcaReturn = await WHTEngine.generateZatcaReturn(year, month);
      return NextResponse.json(zatcaReturn);
    }

    // Default: current month summary
    const now = new Date();
    const ret = await WHTEngine.generateZatcaReturn(now.getFullYear(), now.getMonth() + 1);
    return NextResponse.json(ret);

  } catch (error: any) {
    log.error('WHT GET error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات الاستقطاع' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;

    if (action === 'calculate') {
      const { invoiceId, serviceType } = body;
      if (!invoiceId || !serviceType) {
        return NextResponse.json({ error: 'invoiceId و serviceType مطلوبان' }, { status: 400 });
      }
      const calc = await WHTEngine.calculateWHT(parseInt(invoiceId), serviceType);
      return NextResponse.json(calc || { message: 'لا تنطبق ضريبة استقطاع على هذه الفاتورة' });
    }

    if (action === 'apply') {
      const { invoiceId, serviceType, userId } = body;
      if (!invoiceId || !serviceType) {
        return NextResponse.json({ error: 'invoiceId و serviceType مطلوبان' }, { status: 400 });
      }
      const result = await WHTEngine.applyWHT(
        parseInt(invoiceId),
        serviceType,
        String(userId || auth.userId || '0')
      );
      return NextResponse.json({ success: true, result });
    }

    if (action === 'form14') {
      const { period } = body;
      if (!period) return NextResponse.json({ error: 'period مطلوب (YYYY-MM)' }, { status: 400 });
      const form14 = await WHTEngine.generateForm14(period);
      return NextResponse.json(form14);
    }

    if (action === 'mark-paid') {
      const { transactionIds, certificateNumber } = body;
      await WHTEngine.markAsPaid(transactionIds, certificateNumber);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('WHT POST error:', error);
    return NextResponse.json({ error: 'فشل معالجة ضريبة الاستقطاع' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
