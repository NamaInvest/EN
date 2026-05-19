import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { logger } from '@/lib/logger';
import { PosAccountantService } from '@/lib/services/pos-accountant.service';
import { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } from '@/lib/idempotency';
import { getUserFromRequest } from '@/lib/auth';
import { buildOverrideContextFromRequest } from '@/lib/governance/override-context';

const log = logger.child({ service: 'api.pos.accountant' });

async function _GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const p = getPrisma(req as any) as any;

  try {
    const sessions = await p.posSession?.findMany({
      where: { tenantId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(sessions || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function _POST(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const body   = await req.json();
  const prisma = getPrisma(req as any);
  
  const auth = getUserFromRequest(req as any);
  const overrideContext = buildOverrideContextFromRequest(req as any, {
      tenantId: tenantId,
      actorId: String(auth?.userId || '0'),
      actorRole: auth?.role || 'USER'
  });

  const idempotencyKey = req.headers.get('x-idempotency-key');
  if (!idempotencyKey) {
      return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
  }

  const isUnique = await lockIdempotencyKey(tenantId, 'pos_accountant_post', idempotencyKey);
  if (!isUnique) {
      return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
  }

  try {
      const result = await PosAccountantService.syncSession(prisma, body, tenantId, overrideContext, auth?.userId || 0);
      await completeIdempotencyKey(tenantId, 'pos_accountant_post', idempotencyKey);
      return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
      await unlockIdempotencyKey(tenantId, 'pos_accountant_post', idempotencyKey);
      log.error('POS Accountant post error', { error: error.message });
      return NextResponse.json({ error: error.message || 'فشل في مزامنة بيانات نقاط البيع المحاسبية' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin', 'Accountant', 'CFO'] });
