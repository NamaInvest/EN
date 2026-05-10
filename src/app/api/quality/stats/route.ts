/**
 * GET /api/quality/stats — Quality management KPIs
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'quality.stats' });

async function handler(ctx: any) {
  const prisma   = ctx.prisma;
  const tenantId = ctx.auth.tenantId;

  try {
    const [total, passed, failed, pending] = await Promise.all([
      (prisma as any).qualityInspection?.count({ where: { tenantId } }).catch(() => 0) ?? 0,
      (prisma as any).qualityInspection?.count({ where: { tenantId, result: 'PASS' } }).catch(() => 0) ?? 0,
      (prisma as any).qualityInspection?.count({ where: { tenantId, result: 'FAIL' } }).catch(() => 0) ?? 0,
      (prisma as any).qualityInspection?.count({ where: { tenantId, result: null } }).catch(() => 0) ?? 0,
    ]);

    return NextResponse.json({
      total, passed, failed, pending,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
