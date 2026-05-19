/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PDPL Data Subject Requests API — `/api/pdpl/dsr`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * المرجع القانوني:
 *   - نظام حماية البيانات الشخصية السعودي (PDPL) — المادة 12
 *   - حق صاحب البيانات في: الوصول، الحذف، التصحيح، تقييد المعالجة، النقل
 *   - الاستجابة إلزامية خلال 30 يوماً من تاريخ الطلب
 *   - الغرامة: حتى 5 مليون ريال
 *
 * Endpoints:
 *   GET  /api/pdpl/dsr           → قائمة الطلبات مع pagination + filters
 *   GET  /api/pdpl/dsr?overdue=true → الطلبات المتأخرة فقط
 *   POST /api/pdpl/dsr           → تسجيل طلب جديد
 *
 * Security (Gate 1):
 *   - withRoute + RBAC مقصور على admin/compliance_officer/dpo/owner
 *   - Audit logging لكل POST
 *   - Tenant isolation عبر getPrisma()
 *   - Strict Zod enums (لا z.any)
 *
 * @see prisma/schema.prisma — model PdplDataSubjectRequest
 * @see src/lib/pdpl-engine.ts — createDSR(), getDSRQueue(), getOverdueDSRs()
 * @see src/app/api/pdpl/dsr/[id]/fulfill/route.ts — تنفيذ الطلب
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { createDSR, getOverdueDSRs } from '@/lib/pdpl-engine';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pdpl.dsr' });

/**
 * الأدوار المسموح لها بإدارة طلبات أصحاب البيانات.
 * نفس مجموعة breaches للاتساق.
 */
const ALLOWED_ROLES = ['admin', 'compliance_officer', 'dpo', 'owner'] as const;

/** أنواع الطلبات المعتمدة (PDPL Art 12) */
const DSR_TYPE = z.enum([
  'ACCESS',       // الحق في الوصول للبيانات
  'ERASE',        // الحق في الحذف (الحق في النسيان)
  'RECTIFY',      // الحق في التصحيح
  'RESTRICT',     // تقييد المعالجة
  'PORTABILITY',  // نقل البيانات لجهة أخرى
]);

/** أنواع صاحب البيانات */
const SUBJECT_TYPE = z.enum(['EMPLOYEE', 'CUSTOMER', 'VENDOR', 'USER']);

/** حالات الطلب */
const DSR_STATUS = z.enum(['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);

/**
 * Schema لإنشاء طلب جديد.
 * subjectId يقبل string لـ JSON parsing ثم نحوّله Number.
 */
const CreateDSRSchema = z.object({
  requestType: DSR_TYPE,
  subjectType: SUBJECT_TYPE,
  subjectId: z.coerce.number().int().positive('معرّف صاحب البيانات يجب أن يكون رقماً موجباً'),
  subjectIdentifier: z.string().min(1, 'مطلوب: المُعرّف (الهوية/الإقامة)').max(120),
});

/**
 * Schema لفلترة القائمة.
 * status=ALL يُرجع كل الطلبات (مفيد للتقارير).
 */
const ListQuerySchema = z.object({
  status: z.enum(['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ALL']).optional().default('ALL'),
  requestType: DSR_TYPE.optional(),
  subjectType: SUBJECT_TYPE.optional(),
  overdue: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET — قائمة الطلبات
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يجلب قائمة طلبات أصحاب البيانات للمستأجر.
 *
 * Special:
 *   - ?overdue=true يستدعي getOverdueDSRs() فقط (لا pagination)
 *   - Default: pagination + filters
 *
 * Response (normal):
 *   { items, total, page, pageSize, pageCount }
 *
 * Response (?overdue=true):
 *   { overdue: DSR[], alert: string | null }
 */
async function handleList(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const url = new URL(req.url);
  const queryRaw = Object.fromEntries(url.searchParams.entries());
  const parsed = ListQuerySchema.safeParse(queryRaw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'معاملات البحث غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { status, requestType, subjectType, overdue, page, pageSize } = parsed.data;

  try {
    // Path A: المتأخرة فقط (للـ dashboard alerts)
    if (overdue) {
      const overdueList = await getOverdueDSRs(prisma);
      log.info('Overdue DSRs fetched', {
        requestId,
        userId: auth.userId,
        count: overdueList.length,
      });
      return NextResponse.json({
        overdue: overdueList,
        alert: overdueList.length > 0
          ? `⚠️ ${overdueList.length} طلبات متأخرة — مخاطر غرامة PDPL`
          : null,
      });
    }

    // Path B: pagination + filters عادية
    const where: Record<string, any> = {};
    if (status !== 'ALL') where.status = status;
    if (requestType) where.requestType = requestType;
    if (subjectType) where.subjectType = subjectType;

    const [total, items] = await Promise.all([
      (prisma as any).pdplDataSubjectRequest.count({ where }),
      (prisma as any).pdplDataSubjectRequest.findMany({
        where,
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    log.info('DSR list fetched', {
      requestId,
      userId: auth.userId,
      total,
      filters: { status, requestType, subjectType },
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
    log.error('Failed to list DSRs', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب الطلبات', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — تسجيل طلب جديد
// ═══════════════════════════════════════════════════════════════════════════

/**
 * يُسجّل طلب من صاحب بيانات.
 * يحسب dueDate تلقائياً (30 يوم من الآن) عبر createDSR() في الـ engine.
 */
async function handleCreate(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'محتوى JSON غير صالح' }, { status: 400 });
  }

  const parsed = CreateDSRSchema.safeParse(body);
  if (!parsed.success) {
    log.warn('Invalid DSR payload', { requestId, errors: parsed.error.flatten() });
    return NextResponse.json(
      { error: 'بيانات الطلب غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const dsr = await createDSR(prisma, data);

    // Audit log — يحدد PII فقط في حقل subjectIdentifier (لا نسجل كل الـ body)
    await logAuditAction({
      userId: auth.userId,
      action: 'CREATE_DSR',
      tableName: 'pdpl_data_subject_requests',
      recordId: dsr.id,
      details: JSON.stringify({
        requestType: data.requestType,
        subjectType: data.subjectType,
        // لا نسجل subjectIdentifier كاملاً (PII) — فقط طوله
        subjectIdentifierLength: data.subjectIdentifier.length,
        dueDate: dsr.dueDate,
      }),
    });

    log.info('DSR created', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      dsrId: dsr.id,
      requestType: data.requestType,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(dsr, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Failed to create DSR', { requestId, userId: auth.userId, error: msg });
    return NextResponse.json({ error: 'فشل إنشاء الطلب', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Exported HTTP handlers
// ═══════════════════════════════════════════════════════════════════════════

export const GET = withRoute(handleList, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});

export const POST = withRoute(handleCreate, {
  rateLimit: 'DEFAULT',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
