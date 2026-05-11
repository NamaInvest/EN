import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RMAEngine } from '@/lib/rma-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'warranty.check' });

async function _GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId') ?? 'default';
    // Return RMA metrics as warranty status proxy
    const metrics = RMAEngine.getMetrics(tenantId);
    return NextResponse.json(metrics);
  } catch (e: any) {
    log.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
