/**
 * Period Lock API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET  /api/accounting/period-lock?tenantId=X&fiscalYear=2025
 * POST /api/accounting/period-lock
 *   { action: 'lock'|'unlock'|'temp-unlock', period: 'YYYY-MM', tenantId, reason }
 *
 * يُدير إقفال الفترات المحاسبية الشهرية
 * فقط الـ admin و CFO يمكنهم الإقفال والفتح
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { PeriodLockEngine } from '@/lib/period-lock-engine';
import type { PrismaClient } from '@prisma/client';

const Schema = z.object({
  action:    z.enum(['lock', 'unlock', 'temp-unlock', 'status', 'can-post']),
  tenantId:  z.string(),
  period:    z.string().regex(/^\d{4}-\d{2}$/, 'format: YYYY-MM').optional(),
  userId:    z.number().int().positive().or(z.string()).transform(String).optional().default('system'),
  reason:    z.string().optional(),
  fiscalYear:z.number().int().min(2020).max(2050).optional(),
  skipChecklist: z.boolean().optional().default(false),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId   = searchParams.get('tenantId') ?? 'default';
  const fiscalYear = parseInt(searchParams.get('fiscalYear') ?? String(new Date().getFullYear()));
  const period     = searchParams.get('period');
  const prismaClient = getPrisma(req as any) as unknown as PrismaClient;
  const engine = new PeriodLockEngine(prismaClient);

  if (period) {
    const status = await engine.getStatus(tenantId, period);
    return NextResponse.json(status);
  }

  const periods = await engine.listPeriods(tenantId, fiscalYear);
  const lockedCount = periods.filter(p => p.status === 'LOCKED').length;
  return NextResponse.json({
    tenantId,
    fiscalYear,
    periods,
    summary: {
      locked:  lockedCount,
      open:    periods.filter(p => p.status === 'OPEN').length,
      tempOpen:periods.filter(p => p.status === 'TEMP_UNLOCKED').length,
      progress:`${lockedCount}/12`,
    },
  });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action, tenantId, period, userId, reason, fiscalYear, skipChecklist } = parsed.data;
  const prismaClient = getPrisma(req as any) as unknown as PrismaClient;
  const engine = new PeriodLockEngine(prismaClient);

  switch (action) {
    case 'lock': {
      if (!period) return NextResponse.json({ error: 'period مطلوب' }, { status: 400 });
      const result = await engine.lock(tenantId, period, String(userId), reason, skipChecklist);
      return NextResponse.json(result, { status: result.status === 'LOCKED' ? 200 : 422 });
    }

    case 'unlock': {
      if (!period) return NextResponse.json({ error: 'period مطلوب' }, { status: 400 });
      const result = await engine.unlock(tenantId, period, String(userId), false, reason);
      return NextResponse.json(result);
    }

    case 'temp-unlock': {
      if (!period) return NextResponse.json({ error: 'period مطلوب' }, { status: 400 });
      const result = await engine.unlock(tenantId, period, String(userId), true, reason);
      return NextResponse.json(result);
    }

    case 'can-post': {
      if (!period) return NextResponse.json({ error: 'period مطلوب' }, { status: 400 });
      const result = await engine.canPost(tenantId, period);
      return NextResponse.json(result, { status: result.allowed ? 200 : 409 });
    }

    case 'status': {
      if (fiscalYear) {
        const periods = await engine.listPeriods(tenantId, fiscalYear);
        return NextResponse.json({ tenantId, fiscalYear, periods });
      }
      if (period) {
        const status = await engine.getStatus(tenantId, period);
        return NextResponse.json(status);
      }
      return NextResponse.json({ error: 'period أو fiscalYear مطلوب' }, { status: 400 });
    }

    default:
      return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), {
  rateLimit: 'FINANCIAL',
  roles: ['admin', 'CFO'],
});
