import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RMAEngine } from '@/lib/rma-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.rma.id.approve' });

async function _PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body        = await req.json();
    const approvedBy  = body.approvedBy ?? 0;
    const rma = RMAEngine.approve(id, approvedBy);
    return NextResponse.json(rma);
  } catch (e: any) {
    log.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });
