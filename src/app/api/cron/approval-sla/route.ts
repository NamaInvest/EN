import { NextRequest, NextResponse } from 'next/server';
import { ApprovalSLAEngine } from '@/lib/approval-sla-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-approval-sla' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.headers.get('authorization');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const result = await ApprovalSLAEngine.runSLACheck(tenantId);
  log.info('Approval SLA cron complete', { tenantId, ...result });

  return NextResponse.json({ tenantId, ...result });
}

// Also expose overdue report via GET
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const secret   = searchParams.get('secret');

  if (secret !== (process.env.CRON_SECRET ?? 'local-dev')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const overdue = await ApprovalSLAEngine.getOverdueReport(tenantId);
  return NextResponse.json({
    tenantId,
    overdueCount: overdue.length,
    overdue,
    generatedAt:  new Date().toISOString(),
  });
}
