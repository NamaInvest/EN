/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  WHT Form 14 — Batches Index API — `/api/wht/form14`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  نموذج 14 = نموذج ضريبة الاستقطاع الموحد المقدّم لـ ZATCA شهرياً.
 *  المرجع: نظام ضريبة الاستقطاع السعودي — يجب تقديمه قبل 10 من الشهر التالي.
 *
 *  Endpoints:
 *   GET  /api/wht/form14              → قائمة الـ batches (مع status + totals)
 *   GET  /api/wht/form14?period=YYYY-MM → تفاصيل batch معين + transactions
 *
 *  State machine:
 *   DRAFT → SUBMITTED → FILED (zatcaRef)
 *           ↘ REJECTED
 *
 *  Security:
 *   - RBAC: admin / owner / accountant / tax_officer / cfo
 *   - Rate-limit: DEFAULT
 *
 *  @see src/lib/wht-engine.ts — generateForm14
 *  @see prisma/schema.prisma — WhtForm14Batch, WHTTransaction
 *  @see src/app/api/wht/form14/generate/route.ts — POST batch generation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wht.form14' });

const ALLOWED_ROLES = ['admin', 'owner', 'accountant', 'tax_officer', 'cfo'] as const;

/** Schema للـ query */
const QuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period يجب يكون YYYY-MM').optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'FILED', 'REJECTED', 'ALL']).optional().default('ALL'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(60).optional().default(12),
});

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'معاملات غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { period, status, page, pageSize } = parsed.data;

  try {
    // مسار 1: تفاصيل batch محدد + transactions
    if (period) {
      const batch = await (prisma as any).whtForm14Batch.findUnique({
        where: { period },
        include: {
          transactions: {
            include: {
              supplier: { select: { id: true, name: true } },
              invoice: { select: { id: true, invoiceNo: true, total: true, date: true } },
            },
            take: 500,
            orderBy: { id: 'desc' },
          },
        },
      });

      if (!batch) {
        return NextResponse.json({ error: 'الـ batch غير موجود لهذه الفترة', period }, { status: 404 });
      }

      log.info('Form14 batch fetched', { requestId, userId: auth.userId, period });
      return NextResponse.json(batch);
    }

    // مسار 2: قائمة batches مع pagination
    const where: Record<string, any> = {};
    if (status !== 'ALL') where.status = status;

    const [total, items] = await Promise.all([
      (prisma as any).whtForm14Batch.count({ where }),
      (prisma as any).whtForm14Batch.findMany({
        where,
        orderBy: { period: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          period: true,
          totalGross: true,
          totalWht: true,
          status: true,
          zatcaRef: true,
          filedAt: true,
          createdAt: true,
        },
      }),
    ]);

    log.info('Form14 batches listed', {
      requestId,
      userId: auth.userId,
      total,
      page,
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Form14 list failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل العملية', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
