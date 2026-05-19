/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL DSR Fulfill API — `/api/pdpl/dsr/[id]/fulfill`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ينفّذ طلب صاحب البيانات:
 *   - ACCESS / PORTABILITY → fulfillAccess() يرجع البيانات الشخصية فقط
 *   - ERASE              → eraseSubject() يُجهّل البيانات (لا حذف فعلي للالتزام بـ ZATCA 6 سنوات)
 *   - RECTIFY / RESTRICT  → لا يُنفّذ آلياً (يتطلب workflow يدوي — رسالة 400 واضحة)
 *
 * Security:
 *   - RBAC مقصور على admin/dpo (أعلى صلاحيات من باقي endpoints)
 *   - audit log إلزامي لكل تنفيذ
 *   - لا يُرجع PII في رسائل الخطأ
 *
 * @see src/lib/pdpl-engine.ts — fulfillAccess(), eraseSubject()
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { fulfillAccess, eraseSubject } from '@/lib/pdpl-engine';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pdpl.dsr.fulfill' });

/** صلاحيات أعلى لـ fulfill — لأنها تكشف PII أو تحذف بيانات */
const ALLOWED_ROLES = ['admin', 'dpo', 'owner'] as const;

/**
 * يستخرج رقم الطلب من params ويتحقق من صحته.
 */
function parseDsrId(rawId: string | undefined): number | null {
  if (!rawId) return null;
  const n = Number(rawId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — تنفيذ الطلب
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يُحدد نوع الطلب من DB ويستدعي الدالة المناسبة.
 *
 * Response 200 (ACCESS/PORTABILITY):
 *   { success: true, data: { name, email, phone, ... } }
 *
 * Response 200 (ERASE):
 *   { success: true, anonymizedFields: ['name', 'email', ...] }
 *
 * Response 400:
 *   - نوع غير مدعوم
 *   - الطلب مكتمل مسبقاً
 *   - الموضوع غير موجود
 *
 * Response 404:
 *   - الطلب غير موجود
 */
async function handleFulfill(ctx: RouteContext, routeCtx: any): Promise<NextResponse> {
  const { prisma, auth, requestId } = ctx;
  const startedAt = Date.now();

  // Next.js 15+ params is now a Promise — نتعامل مع الحالتين
  const rawParams = await Promise.resolve(routeCtx?.params);
  const dsrId = parseDsrId(rawParams?.id);

  if (dsrId === null) {
    return NextResponse.json({ error: 'معرّف الطلب غير صالح' }, { status: 400 });
  }

  try {
    // اقرأ نوع الطلب لتحديد المسار
    const dsr = await (prisma as any).pdplDataSubjectRequest.findUnique({
      where: { id: dsrId },
    });
    if (!dsr) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (dsr.status === 'COMPLETED' || dsr.status === 'REJECTED') {
      return NextResponse.json(
        { error: `الطلب في حالة ${dsr.status} — لا يمكن إعادة التنفيذ` },
        { status: 400 },
      );
    }

    // اختر الدالة حسب النوع
    let result;
    if (dsr.requestType === 'ACCESS' || dsr.requestType === 'PORTABILITY') {
      result = await fulfillAccess(prisma, dsrId, auth.userId);
    } else if (dsr.requestType === 'ERASE') {
      result = await eraseSubject(prisma, dsrId, auth.userId);
    } else {
      return NextResponse.json(
        {
          error: `نوع الطلب ${dsr.requestType} يتطلب معالجة يدوية`,
          hint: 'استخدم PATCH /api/pdpl/dsr/[id] لتحديث الحالة يدوياً',
        },
        { status: 400 },
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Audit log — لا نسجل البيانات الراجعة (PII)
    await logAuditAction({
      userId: auth.userId,
      action: `FULFILL_DSR_${dsr.requestType}`,
      tableName: 'pdpl_data_subject_requests',
      recordId: dsrId,
      details: JSON.stringify({
        requestType: dsr.requestType,
        subjectType: dsr.subjectType,
        subjectId: dsr.subjectId,
        // لا data: نتجنب نسخ PII في audit_logs
        fieldsAnonymized: (result as any).anonymizedFields?.length ?? null,
        fieldsAccessed: (result as any).data ? Object.keys((result as any).data).length : null,
      }),
    });

    log.info('DSR fulfilled', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      dsrId,
      requestType: dsr.requestType,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to fulfill DSR', { requestId, dsrId, error: msg });
    return NextResponse.json({ error: 'فشل تنفيذ الطلب', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Exported handler
// ═══════════════════════════════════════════════════════════════════════════

export const POST = withRoute(
  async (ctx, routeCtx) => handleFulfill(ctx, routeCtx),
  {
    rateLimit: 'DEFAULT',
    requireAuth: true,
    roles: [...ALLOWED_ROLES],
    tenantRequired: true,
  },
);
