/**
 * Cash Flow Forecast API (B.6)
 * GET /api/finance/cash-flow-forecast?weeks=13&currentBalance=50000
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { CashFlowForecastEngine } from '@/lib/cash-flow-forecast';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.finance.cash-flow-forecast' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const weeks          = parseInt(searchParams.get('weeks') || '13');
    const currentBalance = searchParams.get('currentBalance') ? parseFloat(searchParams.get('currentBalance')!) : undefined;
    const arRate         = searchParams.get('arCollectionRate') ? parseFloat(searchParams.get('arCollectionRate')!) : undefined;

    const forecast = await CashFlowForecastEngine.generate({
      weeks:             Math.min(Math.max(weeks, 4), 26),
      currentBalance,
      arCollectionRate:  arRate,
    });

    return NextResponse.json(forecast);
  } catch (error: any) {
    log.error('Cash flow forecast error:', error);
    return NextResponse.json({ error: 'فشل توليد التدفق النقدي' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
