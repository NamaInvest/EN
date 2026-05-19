import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { logger } from '@/lib/logger';
import { TreasuryForecastService } from '@/lib/services/treasury-forecast.service';
import { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } from '@/lib/idempotency';
import { getUserFromRequest } from '@/lib/auth';
import { buildOverrideContextFromRequest } from '@/lib/governance/override-context';

const log = logger.child({ service: 'api.treasury.cash-forecast' });

async function _GET(req: NextRequest) {
  const tenantId = requireTenantId(req as any);
  const p = getPrisma(req as any) as any;

  try {
    const forecasts = await p.liquidityForecast?.findMany({
      where: { tenantId },
      orderBy: { forecastDate: 'desc' },
      take: 100,
    });
    return NextResponse.json(forecasts || []);
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

  const isUnique = await lockIdempotencyKey(tenantId, 'cash_forecast_post', idempotencyKey);
  if (!isUnique) {
      return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
  }

  try {
      const result = await TreasuryForecastService.upsertForecast(prisma, body, tenantId, overrideContext);
      await completeIdempotencyKey(tenantId, 'cash_forecast_post', idempotencyKey);
      return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
      await unlockIdempotencyKey(tenantId, 'cash_forecast_post', idempotencyKey);
      log.error('Cash Forecast post error', { error: error.message });
      return NextResponse.json({ error: error.message || 'فشل في عملية التنبؤ بالسيولة' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin', 'Treasury', 'CFO'] });
