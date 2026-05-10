import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { LeaseAccountingService } from '@/services/accounting/lease-accounting.service';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'assets.leases.id.post-inception' });

// POST /api/assets/leases/[id]/post-inception
async function _POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contractId = parseInt(params.id);
  if (isNaN(contractId)) return NextResponse.json({ error: 'معرف العقد غير صحيح' }, { status: 400 });

  const tenantId = user.tenantId ?? 'default';
  const ctx = { tenant: { id: tenantId }, user: { id: String(user.userId) } } as any;

  try {
    const svc = new LeaseAccountingService(getPrisma(request), ctx);
    const result = await svc.recognizeLeaseWithGL(contractId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
