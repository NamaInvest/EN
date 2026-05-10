/**
 * Statement of Changes in Equity API
 * GET /api/finance/equity-statement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|pdf
 * POST /api/finance/equity-statement — validate & save period statement
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { EquityStatementEngine } from '@/lib/equity-statement-engine';

const log = logger.child({ service: 'api.finance.equity-statement' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(now.getFullYear(), 0, 1); // Start of year
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(now.getFullYear(), 11, 31); // End of year

    const statement = await EquityStatementEngine.generate({
      startDate,
      endDate,
      currency: searchParams.get('currency') || 'SAR',
    });

    const isBalanced = EquityStatementEngine.validateBalance(statement);

    return NextResponse.json({
      statement,
      isBalanced,
      warning: isBalanced ? null : 'تحذير: الأرصدة غير متوازنة — تحقق من القيود المحاسبية',
      standard: 'IAS 1.106 — Statement of Changes in Equity',
    });
  } catch (error: any) {
    log.error('Equity statement GET error:', error);
    return NextResponse.json({ error: 'فشل توليد بيان التغيرات في حقوق الملكية' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
