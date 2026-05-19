/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Mudad WPS Compliance API — `/api/hr/mudad/compliance`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  مداد = منصة وزارة الموارد البشرية السعودية لحماية أجور الموظفين.
 *  نظام WPS (Wage Protection System) يجبر المنشآت على إيداع رواتب الموظفين
 *  في حساباتهم البنكية الموثقة بمداد.
 *
 *  Endpoints:
 *   GET  ?view=dashboard          → لوحة الامتثال الكاملة (default)
 *   GET  ?view=unprotected        → قائمة الموظفين غير المحميين
 *   GET  ?view=report&month=YYYY-MM → تقرير الامتثال الشهري
 *   POST { updates: [...] }       → تحديث جماعي لحالة الموظفين من مداد
 *
 *  حالات الموظف في مداد:
 *   - ACTIVE    : مسجل وحماية أجره مفعّلة
 *   - PENDING   : قيد المعالجة
 *   - SUSPENDED : موقوف (مشكلة في بيانات IBAN/Iqama)
 *   - EXEMPTED  : مُعفى (حالات خاصة موافق عليها)
 *
 *  Security (Gate 1):
 *   - RBAC: admin / owner / hr_officer / payroll_officer / compliance_officer
 *   - Audit log لكل bulk update (لأنه يؤثر على رواتب)
 *
 *  المرجع القانوني: قرار وزير الموارد البشرية رقم 4044 لسنة 2013 (الإلزامية)
 *
 *  @see src/lib/mudad-compliance.ts — engine
 *  @see prisma/schema.prisma — Employee.mudadStatus
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import {
  checkMudadCompliance,
  getUnprotectedEmployees,
  generateMudadReport,
  bulkUpdateMudadStatus,
} from '@/lib/mudad-compliance';
import { logAuditAction } from '@/lib/audit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.hr.mudad.compliance' });

const ALLOWED_ROLES = [
  'admin',
  'owner',
  'hr_officer',
  'payroll_officer',
  'compliance_officer',
] as const;

/** Schema للـ query */
const GetQuerySchema = z.object({
  view: z.enum(['dashboard', 'unprotected', 'report']).optional().default('dashboard'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM').optional(),
});

/** Mudad statuses المعتمدة */
const MUDAD_STATUS = z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'EXEMPTED']);

/** Schema للـ bulk update */
const PostSchema = z.object({
  updates: z.array(z.object({
    employeeId: z.coerce.number().int().positive(),
    status: MUDAD_STATUS,
  })).min(1, 'مطلوب قائمة تحديثات غير فارغة'),
});

// ═══════════════════════════════════════════════════════════════════════════
//  GET — Dashboard / Unprotected / Report
// ═══════════════════════════════════════════════════════════════════════════

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const url = new URL(req.url);
  const parsed = GetQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'معاملات غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { view, month } = parsed.data;
  const monthEffective = month || new Date().toISOString().slice(0, 7);
  const tenantId = auth.tenantId;

  try {
    // مسار 1: قائمة الموظفين غير المحميين
    if (view === 'unprotected') {
      const employees = await getUnprotectedEmployees(prisma, tenantId);
      log.info('Unprotected employees fetched', { requestId, userId: auth.userId, count: employees.length });
      return NextResponse.json({ employees, total: employees.length });
    }

    // مسار 2: تقرير شهري
    if (view === 'report') {
      const report = await generateMudadReport(prisma, monthEffective, tenantId);
      log.info('Mudad monthly report generated', { requestId, userId: auth.userId, month: monthEffective });
      return NextResponse.json(report);
    }

    // مسار 3 (default): dashboard كامل
    const [compliance, unprotected] = await Promise.all([
      checkMudadCompliance(prisma, tenantId),
      getUnprotectedEmployees(prisma, tenantId),
    ]);

    log.info('Mudad compliance dashboard fetched', {
      requestId,
      userId: auth.userId,
      compliancePct: compliance.compliancePct,
    });

    return NextResponse.json({
      compliance,
      unprotected: {
        count: unprotected.length,
        employees: unprotected.slice(0, 10), // top 10 preview
      },
      alerts: compliance.isCompliant
        ? []
        : [
            {
              type: 'WARNING',
              severity: 'HIGH',
              message: `${unprotected.length} موظف غير مسجل في نظام حماية الأجور`,
              action: 'تسجيل الموظفين في Mudad',
              legalRef: 'قرار وزير الموارد البشرية رقم 4044/1434',
            },
          ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Mudad compliance GET failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب بيانات مداد', detail: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  POST — Bulk update مع audit log
// ═══════════════════════════════════════════════════════════════════════════

async function handlePost(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, req, auth, requestId } = ctx;
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صحيحة', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { updates } = parsed.data;

  try {
    const result = await bulkUpdateMudadStatus(prisma, updates, auth.tenantId);

    // Audit — مهم لأن تعديل WPS status يؤثر على الرواتب
    await logAuditAction({
      userId: auth.userId,
      action: 'BULK_UPDATE_MUDAD_STATUS',
      tableName: 'employees',
      recordId: 'bulk',
      details: JSON.stringify({
        updatesCount: updates.length,
        updated: result.updated,
        errorsCount: result.errors.length,
        statuses: [...new Set(updates.map((u) => u.status))],
      }),
    });

    log.info('Mudad bulk update', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      updated: result.updated,
      errors: result.errors.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      message: `تم تحديث ${result.updated} موظف`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('Mudad POST failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل التحديث', detail: msg }, { status: 500 });
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
