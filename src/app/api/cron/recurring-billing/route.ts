import { NextRequest, NextResponse } from 'next/server';
import { RecurringBillingEngine } from '@/lib/recurring-billing-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-recurring-billing' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret') ?? req.headers.get('authorization');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');   // optional: run for one tenant
  const dryRun   = searchParams.get('dryRun') === 'true';

  // Get all active tenants if tenantId not specified
  const tenants = tenantId
    ? [{ id: tenantId }]
    : [];  // In production, fetch from master DB; here we handle per-tenant via query param

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required (multi-tenant: call per tenant)' }, { status: 400 });
  }

  const result = await RecurringBillingEngine.generateDueInvoices(tenantId, new Date(), dryRun);

  log.info('Recurring billing cron complete', { tenantId, ...result, dryRun });

  return NextResponse.json({ tenantId, dryRun, ...result });
}
