/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL DSR — Single Record API — `/api/pdpl/dsr/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Endpoints:
 *   GET   /api/pdpl/dsr/[id]  → تفاصيل طلب واحد + days remaining
 *   PATCH /api/pdpl/dsr/[id]  → تحديث الحالة يدوياً (REJECTED مع سبب، أو IN_PROGRESS)
 *
 * Note: التنفيذ التلقائي (ACCESS/ERASE) عبر `/fulfill` فقط.
 * هذا الـ endpoint للتحديثات اليدوية (مثل rejected with reason).
 *
 * @see src/app/api/pdpl/dsr/route.ts — list + create
 * @see src/app/api/pdpl/dsr/[id]/fulfill/route.ts — automated fulfillment
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pdpl.dsr.detail' });

const ALLOWED_ROLES = ['admin', 'compliance_officer', 'dpo', 'owner'] as const;

/** التحديثات اليدوية المسموحة */
const UpdateDsrSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'REJECTED']).optional(),
  rejectionReason: z.string().max(2000).optional().nullable(),
  evidenceUrl: z.string().url('رابط غير صحيح').optional().nullable(),
});

function parseDsrId(rawId: string | undefined): number | null {
  if (!rawId) return null;
  const n = Number(rawId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET — تفاصيل طلب
// ═══════════════════════════════════════════════════════════════════════════

async function handleGetOne(ctx: RouteContext, routeCtx: any): Promise<NextResponse> {
  const { prisma, auth, requestId } = ctx;
  const rawParams = await Promise.resolve(routeCtx?.params);
  const id = parseDsrId(rawParams?.id);

  if (id === null) {
    return NextResponse.json({ error: 'معرّف الطلب غير صالح' }, { status: 400 });
  }

  try {
    const dsr = await (prisma as any).pdplDataSubjectRequest.findUnique({ where: { id } });
    if (!dsr) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // حسابات مساعدة للـ UI
    const now = Date.now();
    const dueMs = new Date(dsr.dueDate).getTime();
    const daysRemaining = Math.ceil((dueMs - now) / (1000 * 60 * 60 * 24));
    const isOverdue =
      (dsr.status === 'RECEIVED' || dsr.status === 'IN_PROGRESS') && now > dueMs;

    log.info('DSR detail fetched', { requestId, userId: auth.userId, dsrId: id });

    return NextResponse.json({
      ...dsr,
      daysRemaining,
      isOverdue,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to fetch DSR', { requestId, dsrId: id, error: msg });
    return NextResponse.json({ error: 'فشل جلب الطلب', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PATCH — تحديث يدوي
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يحدّث حقول DSR يدوياً.
 * RESTRICTED transitions:
 *   - RECEIVED → IN_PROGRESS (تأكيد البدء)
 *   - RECEIVED/IN_PROGRESS → REJECTED (مع سبب إلزامي)
 * COMPLETED status يأتي فقط من /fulfill — ليس من هنا.
 */
async function handlePatch(ctx: RouteContext, routeCtx: any): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const rawParams = await Promise.resolve(routeCtx?.params);
  const id = parseDsrId(rawParams?.id);

  if (id === null) {
    return NextResponse.json({ error: 'معرّف الطلب غير صالح' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'محتوى JSON غير صالح' }, { status: 400 });
  }

  const parsed = UpdateDsrSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات التحديث غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updates = parsed.data;

  try {
    const existing = await (prisma as any).pdplDataSubjectRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // لا يمكن تعديل طلب مكتمل أو مرفوض
    if (existing.status === 'COMPLETED' || existing.status === 'REJECTED') {
      return NextResponse.json(
        { error: `الطلب في حالة ${existing.status} — لا يمكن تعديله` },
        { status: 409 },
      );
    }

    // REJECTED يستلزم سبب
    if (updates.status === 'REJECTED' && !updates.rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'مطلوب: سبب الرفض' },
        { status: 400 },
      );
    }

    const updateData: Record<string, any> = { ...updates };
    if (updates.status === 'REJECTED') {
      updateData.completedAt = new Date();
      updateData.handledByUserId = auth.userId;
    }

    const updated = await (prisma as any).pdplDataSubjectRequest.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction({
      userId: auth.userId,
      action: 'UPDATE_DSR',
      tableName: 'pdpl_data_subject_requests',
      recordId: id,
      details: JSON.stringify({
        statusFrom: existing.status,
        statusTo: updates.status ?? existing.status,
        rejected: updates.status === 'REJECTED',
      }),
    });

    log.info('DSR updated', { requestId, userId: auth.userId, dsrId: id });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to update DSR', { requestId, dsrId: id, error: msg });
    return NextResponse.json({ error: 'فشل التحديث', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Exported handlers
// ═══════════════════════════════════════════════════════════════════════════

export const GET = withRoute(
  async (ctx, routeCtx) => handleGetOne(ctx, routeCtx),
  {
    rateLimit: 'DEFAULT',
    requireAuth: true,
    roles: [...ALLOWED_ROLES],
    tenantRequired: true,
  },
);

export const PATCH = withRoute(
  async (ctx, routeCtx) => handlePatch(ctx, routeCtx),
  {
    rateLimit: 'DEFAULT',
    requireAuth: true,
    roles: [...ALLOWED_ROLES],
    tenantRequired: true,
  },
);
