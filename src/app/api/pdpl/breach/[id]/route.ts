/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL Breach Incident — Single Record API — `/api/pdpl/breach/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Endpoints:
 *   GET   /api/pdpl/breach/[id]              → تفاصيل حادثة واحدة
 *   PATCH /api/pdpl/breach/[id]              → تحديث الحادثة (status, containment, sdaia)
 *   POST  /api/pdpl/breach/[id]/notify-sdaia → تسجيل تبليغ SDAIA رسمياً
 *
 * State machine (status):
 *   DETECTED → CONTAINED → INVESTIGATING → RESOLVED → CLOSED
 *
 *   مسموح بـ:
 *     - الانتقال للأمام في الترتيب أعلاه
 *     - الرجوع من CONTAINED إلى INVESTIGATING (لو ظهرت أدلة جديدة)
 *   ممنوع:
 *     - إعادة فتح CLOSED
 *     - تخطي أكثر من خطوة واحدة دفعة واحدة
 *
 * Security:
 *   - withRoute + RBAC (admin/compliance_officer/dpo/owner)
 *   - audit log لكل تحديث
 *   - tenant isolation عبر getPrisma()
 *
 * @see prisma/schema.prisma — model PdplBreachIncident
 * @see src/app/api/pdpl/breach/route.ts — list + create endpoints
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pdpl.breach.detail' });

/** الأدوار المسموحة — متطابقة مع route.ts */
const ALLOWED_ROLES = ['admin', 'compliance_officer', 'dpo', 'owner'] as const;

/** انتقالات state machine المسموحة */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DETECTED: ['CONTAINED', 'INVESTIGATING'],
  CONTAINED: ['INVESTIGATING', 'RESOLVED'],
  INVESTIGATING: ['CONTAINED', 'RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [], // terminal state — no transitions out
};

/**
 * Schema لتحديث الحادثة.
 * كل الحقول اختيارية — partial update pattern.
 */
const UpdateBreachSchema = z.object({
  status: z.enum(['DETECTED', 'CONTAINED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  containmentActions: z.string().max(5000).optional().nullable(),
  rootCause: z.string().max(2000).optional().nullable(),
  notificationToSdaia: z.boolean().optional(),
  sdaiaRefNo: z.string().max(120).optional().nullable(),
  notificationToSubjects: z.boolean().optional(),
});

/**
 * يستخرج breach ID من params ويتحقق من صحته كرقم صحيح موجب.
 *
 * @returns numeric ID أو null لو غير صالح
 */
function parseBreachId(rawId: string | undefined): number | null {
  if (!rawId) return null;
  const n = Number(rawId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET — تفاصيل حادثة واحدة
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يجلب التفاصيل الكاملة لحادثة محددة بمعرّفها.
 * يتضمن حقول SDAIA و الـ deadlines.
 *
 * Response 200: PdplBreachIncident + معلومات مساعدة:
 *   {
 *     ...breach,
 *     hoursElapsed: number,                  // عدد الساعات منذ الاكتشاف
 *     requiresSdaiaNotification: boolean,    // هل يجب التبليغ؟
 *     sdaiaDeadlineMissed: boolean,          // هل انتهت الـ 72 ساعة؟
 *     availableTransitions: string[],        // الحالات التي يمكن الانتقال إليها
 *   }
 */
async function handleGetOne(ctx: RouteContext, routeCtx: any): Promise<NextResponse> {
  const { prisma, auth, requestId } = ctx;
  const id = parseBreachId(routeCtx?.params?.id);

  if (id === null) {
    return NextResponse.json({ error: 'معرّف الحادثة غير صالح' }, { status: 400 });
  }

  try {
    const breach = await (prisma as any).pdplBreachIncident.findUnique({ where: { id } });

    if (!breach) {
      return NextResponse.json({ error: 'الحادثة غير موجودة' }, { status: 404 });
    }

    // حسابات مساعدة لـ UI
    const hoursElapsed = (Date.now() - new Date(breach.detectedAt).getTime()) / (1000 * 60 * 60);
    const requiresSdaiaNotification =
      (breach.severity === 'HIGH' || breach.severity === 'CRITICAL') && !breach.notificationToSdaia;
    const sdaiaDeadlineMissed = requiresSdaiaNotification && hoursElapsed > 72;
    const availableTransitions = ALLOWED_TRANSITIONS[breach.status] ?? [];

    log.info('Breach detail fetched', {
      requestId,
      userId: auth.userId,
      breachId: id,
    });

    return NextResponse.json({
      ...breach,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      requiresSdaiaNotification,
      sdaiaDeadlineMissed,
      availableTransitions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to fetch breach', { requestId, breachId: id, error: msg });
    return NextResponse.json({ error: 'فشل جلب الحادثة', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PATCH — تحديث حادثة (status, containment, SDAIA flags)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يحدّث حقول حادثة موجودة.
 *
 * State machine validation:
 *   - لو فيه تغيير لـ status → يتم فحص ALLOWED_TRANSITIONS
 *   - لو الـ transition غير مسموح → 409 Conflict
 *
 * Side effects:
 *   - عند الانتقال لـ RESOLVED → يسجّل reportedAt تلقائياً
 *   - عند notificationToSdaia=true → يستلزم sdaiaRefNo
 */
async function handlePatch(ctx: RouteContext, routeCtx: any): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const id = parseBreachId(routeCtx?.params?.id);

  if (id === null) {
    return NextResponse.json({ error: 'معرّف الحادثة غير صالح' }, { status: 400 });
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'محتوى JSON غير صالح' }, { status: 400 });
  }

  const parsed = UpdateBreachSchema.safeParse(body);
  if (!parsed.success) {
    log.warn('Invalid patch payload', { requestId, errors: parsed.error.flatten() });
    return NextResponse.json(
      { error: 'بيانات التحديث غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updates = parsed.data;

  try {
    // اجلب السجل الحالي للتحقق من state machine + لاستخدامه في audit diff
    const existing = await (prisma as any).pdplBreachIncident.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'الحادثة غير موجودة' }, { status: 404 });
    }

    // State machine guard
    if (updates.status && updates.status !== existing.status) {
      const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(updates.status)) {
        log.warn('Invalid state transition', {
          requestId,
          from: existing.status,
          to: updates.status,
        });
        return NextResponse.json(
          {
            error: 'انتقال حالة غير مسموح',
            from: existing.status,
            to: updates.status,
            allowed,
          },
          { status: 409 },
        );
      }
    }

    // SDAIA notification guard — لازم refNo لو notificationToSdaia=true
    if (updates.notificationToSdaia === true && !updates.sdaiaRefNo && !existing.sdaiaRefNo) {
      return NextResponse.json(
        { error: 'مطلوب: رقم مرجع SDAIA عند تأكيد التبليغ' },
        { status: 400 },
      );
    }

    // بناء قيم التحديث + side effects
    const updateData: Record<string, any> = { ...updates };

    // RESOLVED → نسجل reportedAt إذا لم يكن مسجلاً
    if (updates.status === 'RESOLVED' && !existing.reportedAt) {
      updateData.reportedAt = new Date();
    }

    const updated = await (prisma as any).pdplBreachIncident.update({
      where: { id },
      data: updateData,
    });

    // Audit log مع diff مختصر
    await logAuditAction({
      userId: auth.userId,
      action: 'UPDATE_PDPL_BREACH',
      tableName: 'pdpl_breach_incidents',
      recordId: id,
      details: JSON.stringify({
        changes: Object.keys(updates),
        statusFrom: existing.status,
        statusTo: updates.status ?? existing.status,
        sdaiaNotified: updateData.notificationToSdaia,
      }),
    });

    log.info('Breach updated', {
      requestId,
      userId: auth.userId,
      breachId: id,
      changes: Object.keys(updates),
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to update breach', { requestId, breachId: id, error: msg });
    return NextResponse.json({ error: 'فشل تحديث الحادثة', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Exported HTTP handlers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET — قراءة تفاصيل حادثة.
 */
export const GET = withRoute(
  async (ctx, routeCtx) => handleGetOne(ctx, routeCtx),
  {
    rateLimit: 'DEFAULT',
    requireAuth: true,
    roles: [...ALLOWED_ROLES],
    tenantRequired: true,
  },
);

/**
 * PATCH — تحديث حادثة.
 */
export const PATCH = withRoute(
  async (ctx, routeCtx) => handlePatch(ctx, routeCtx),
  {
    rateLimit: 'DEFAULT',
    requireAuth: true,
    roles: [...ALLOWED_ROLES],
    tenantRequired: true,
  },
);
