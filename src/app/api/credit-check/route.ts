/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Real-Time Credit Check API — `/api/credit-check`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  يفحص حدّ الائتمان للعميل قبل إنشاء أوامر بيع/فواتير.
 *
 *  Endpoints:
 *   GET  ?customerId=X            → فحص ائتمان شامل لعميل واحد
 *   GET  ?action=at-risk&threshold=0.8 → العملاء الذين تجاوزوا النسبة
 *   POST { customerId, amount }   → قرار: هل يمكن إنشاء فاتورة بهذا المبلغ؟
 *
 *  Security (Gate 1):
 *   - RBAC: admin / owner / accountant / cfo / sales_manager
 *   - Audit log لكل POST (قرار ائتمان مسجل)
 *   - tenant isolation عبر getPrisma()
 *
 *  Engine: src/lib/credit-check-engine.ts
 *
 *  @see prisma/schema.prisma — model Customer, CreditLimitHistory
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { CreditCheckEngine } from '@/lib/credit-check-engine';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'credit-check' });

const ALLOWED_ROLES = ['admin', 'owner', 'accountant', 'cfo', 'sales_manager'] as const;

/** Schema لـ GET — discriminated union */
const GetQuerySchema = z.union([
  z.object({
    customerId: z.coerce.number().int().positive(),
    action: z.undefined().optional(),
    threshold: z.undefined().optional(),
  }),
  z.object({
    action: z.literal('at-risk'),
    threshold: z.coerce.number().min(0).max(1).optional().default(0.8),
    customerId: z.undefined().optional(),
  }),
]);

/** Schema لـ POST */
const PostBodySchema = z.object({
  customerId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET
// ═══════════════════════════════════════════════════════════════════════════

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = GetQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'مطلوب: customerId أو action=at-risk' },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    if ('action' in data && data.action === 'at-risk') {
      const list = await CreditCheckEngine.getAtRiskCustomers(prisma, data.threshold);
      log.info('At-risk customers fetched', {
        requestId, userId: auth.userId, count: list.length, threshold: data.threshold,
      });
      return NextResponse.json({
        items: list,
        threshold: data.threshold,
        count: list.length,
      });
    }

    if ('customerId' in data && data.customerId) {
      const result = await CreditCheckEngine.check(prisma, data.customerId);
      log.info('Customer credit checked', {
        requestId, userId: auth.userId, customerId: data.customerId, isOverLimit: result.isOverLimit,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'مطلوب: customerId أو action=at-risk' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Credit check failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل فحص الائتمان', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — قرار ائتماني (هل يمكن المتابعة؟)
// ═══════════════════════════════════════════════════════════════════════════

async function handlePost(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { customerId, amount } = parsed.data;

  try {
    // نستخدم check بدلاً من canProceed (موجود ضمن نفس الـ engine)
    const result = await CreditCheckEngine.check(prisma, customerId, amount);
    const canProceed = !result.isOverLimit;

    // audit القرار — مهم للتدقيق المالي
    await logAuditAction({
      userId: auth.userId,
      action: 'CREDIT_CHECK_DECISION',
      tableName: 'customers',
      recordId: customerId,
      details: JSON.stringify({
        amount,
        canProceed,
        creditLimit: result.creditLimit,
        availableCredit: result.availableCredit,
        overLimitAmount: result.overLimitAmount,
      }),
    });

    log.info('Credit decision made', {
      requestId, userId: auth.userId, customerId, amount, canProceed,
    });

    return NextResponse.json({
      canProceed,
      reason: canProceed ? null : 'تجاوز حد الائتمان',
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Credit decision failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل القرار', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});

export const POST = withRoute(handlePost, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
