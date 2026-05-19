/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Rebates API — `/api/rebates`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة الخصومات المؤجلة (End-of-period rebates):
 *   - SALES rebates: نخصم على عملاء حسب حجم/قيمة مبيعاتهم
 *   - PURCHASE rebates: نستحق على موردين بناءً على حجم مشترياتنا
 *
 *  Endpoints:
 *   POST { action: 'batch', type, periodFrom, periodTo, minThreshold } → حساب جماعي
 *   POST { partnerId, type, periodFrom, periodTo } → حساب فردي
 *
 *  Security:
 *   - RBAC: admin / owner / accountant / cfo / sales_manager
 *   - Audit log لكل عملية حساب (مالية)
 *   - Rate-limit: FINANCIAL
 *
 *  @see src/lib/rebate-engine.ts — RebateEngine class
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { RebateEngine } from '@/lib/rebate-engine';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rebates' });

const ALLOWED_ROLES = ['admin', 'owner', 'accountant', 'cfo', 'sales_manager'] as const;

/** Schema لحساب فردي */
const SingleSchema = z.object({
  action: z.literal('single').optional(),
  partnerId: z.coerce.number().int().positive(),
  type: z.enum(['SALES', 'PURCHASE']).default('SALES'),
  periodFrom: z.string().datetime().optional(),
  periodTo: z.string().datetime().optional(),
});

/** Schema لحساب جماعي */
const BatchSchema = z.object({
  action: z.literal('batch'),
  type: z.enum(['SALES', 'PURCHASE']).default('SALES'),
  periodFrom: z.string().datetime().optional(),
  periodTo: z.string().datetime().optional(),
  minThreshold: z.coerce.number().min(0).optional().default(50000),
});

/**
 * يستنتج الفترات الافتراضية إذا لم تُمرر — آخر 90 يوم.
 */
function defaultPeriod(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(Date.now() - 90 * 86400 * 1000);
  return { from, to };
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST handler — single أو batch
// ═══════════════════════════════════════════════════════════════════════════

async function handlePost(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const startedAt = Date.now();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  // مسار 1: batch
  if (body?.action === 'batch') {
    const parsed = BatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات batch غير صحيحة', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { type, minThreshold } = parsed.data;
    const { from, to } = parsed.data.periodFrom && parsed.data.periodTo
      ? { from: new Date(parsed.data.periodFrom), to: new Date(parsed.data.periodTo) }
      : defaultPeriod();

    try {
      const results = await RebateEngine.batchCalculate(prisma, type, from, to, minThreshold);

      await logAuditAction({
        userId: auth.userId,
        action: 'CALCULATE_REBATES_BATCH',
        tableName: 'rebates',
        recordId: 'batch',
        details: JSON.stringify({
          type, minThreshold,
          periodFrom: from.toISOString(),
          periodTo: to.toISOString(),
          partnersCount: Array.isArray(results) ? results.length : 0,
        }),
      });

      log.info('Rebate batch calculated', {
        requestId, userId: auth.userId, type, count: Array.isArray(results) ? results.length : 0,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json({
        items: results,
        count: Array.isArray(results) ? results.length : 0,
        period: { from: from.toISOString(), to: to.toISOString() },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
      log.error('Rebate batch failed', { requestId, error: msg });
      return NextResponse.json({ error: 'فشل الحساب', detail: msg }, { status: 500 });
    }
  }

  // مسار 2: single
  const parsed = SingleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'مطلوب: partnerId + type', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { partnerId, type } = parsed.data;
  const { from, to } = parsed.data.periodFrom && parsed.data.periodTo
    ? { from: new Date(parsed.data.periodFrom), to: new Date(parsed.data.periodTo) }
    : defaultPeriod();

  try {
    const result = await RebateEngine.calculate(prisma, {
      partnerId,
      type,
      periodFrom: from,
      periodTo: to,
    });

    await logAuditAction({
      userId: auth.userId,
      action: 'CALCULATE_REBATE_SINGLE',
      tableName: 'rebates',
      recordId: partnerId,
      details: JSON.stringify({
        type,
        periodFrom: from.toISOString(),
        periodTo: to.toISOString(),
        rebateAmount: result.rebateAmount,
      }),
    });

    log.info('Single rebate calculated', {
      requestId, userId: auth.userId, partnerId, type, amount: result.rebateAmount,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Single rebate failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل الحساب', detail: msg }, { status: 500 });
  }
}

export const POST = withRoute(handlePost, {
  rateLimit: 'FINANCIAL',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
