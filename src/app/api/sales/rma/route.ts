import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RMAEngine } from '@/lib/rma-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.rma' });

async function _POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rma = RMAEngine.create(body.tenantId ?? 'default', {
      customerId: body.customerId,
      salesOrderId: body.salesOrderId,
      reason: body.reason,
      items: body.items ?? [],
      requestedBy: body.requestedBy,
    });
    return NextResponse.json(rma);
  } catch (e: any) {
    log.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
