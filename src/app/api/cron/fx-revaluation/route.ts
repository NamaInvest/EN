import { NextRequest, NextResponse } from 'next/server';
import { FXRevaluationEngine } from '@/lib/fx-revaluation-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-fx-revaluation' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.headers.get('authorization');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const userId   = searchParams.get('userId') ?? 'system-cron';
  const dryRun   = searchParams.get('dryRun') === 'true';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  // Run month-end FX revaluation (posts journal if not dryRun)
  const result = await FXRevaluationEngine.monthEndRevaluation(tenantId, userId);

  log.info('FX revaluation cron complete', {
    tenantId,
    lines:          result.lines.length,
    totalUnrealized: result.totalUnrealized,
    isPosted:       result.isPosted,
  });

  return NextResponse.json({
    tenantId,
    revalDate:       result.revalDate,
    lines:           result.lines.length,
    totalGain:       result.totalGain,
    totalLoss:       result.totalLoss,
    totalUnrealized: result.totalUnrealized,
    isPosted:        !dryRun && result.isPosted,
  });
}
