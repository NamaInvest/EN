/**
 * Mudad WPS Compliance API
 * ════════════════════════
 * GET  /api/hr/mudad/compliance        — dashboard + status report
 * POST /api/hr/mudad/compliance        — sync/update status from Mudad portal
 * GET  /api/hr/mudad/compliance/report — PDF/JSON monthly compliance report
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  checkMudadCompliance,
  getUnprotectedEmployees,
  generateMudadReport,
  bulkUpdateMudadStatus,
} from '@/lib/mudad-compliance';

const log = logger.child({ service: 'api.hr.mudad.compliance' });

// ── GET: Compliance Dashboard ─────────────────────────────────────
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard'; // dashboard | unprotected | report
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    if (view === 'unprotected') {
      const employees = await getUnprotectedEmployees(prisma);
      return NextResponse.json({ employees, total: employees.length });
    }

    if (view === 'report') {
      const report = await generateMudadReport(prisma, month);
      return NextResponse.json(report);
    }

    // Default: full compliance dashboard
    const [compliance, unprotected] = await Promise.all([
      checkMudadCompliance(prisma),
      getUnprotectedEmployees(prisma),
    ]);

    return NextResponse.json({
      compliance,
      unprotected: {
        count: unprotected.length,
        employees: unprotected.slice(0, 10), // top 10 for preview
      },
      alerts: compliance.isCompliant
        ? []
        : [
            {
              type: 'WARNING',
              message: `${unprotected.length} موظف غير مسجل في نظام حماية الأجور`,
              action: 'تسجيل الموظفين في Mudad',
            },
          ],
    });
  } catch (error: any) {
    log.error('Mudad compliance GET error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات مداد' }, { status: 500 });
  }
}

// ── POST: Bulk Update Mudad Status (from portal sync) ─────────────
async function _POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await request.json();
    const { updates } = body as {
      updates: Array<{ employeeId: number; status: string }>;
    };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'يجب تحديد قائمة التحديثات' }, { status: 400 });
    }

    // Validate statuses
    const validStatuses = ['ACTIVE', 'PENDING', 'SUSPENDED', 'EXEMPTED'];
    const invalid = updates.filter(u => !validStatuses.includes(u.status));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `حالات غير صالحة: ${invalid.map(u => u.status).join(', ')}` },
        { status: 400 }
      );
    }

    const result = await bulkUpdateMudadStatus(prisma, updates);

    log.info(`Mudad bulk update: ${result.updated} updated, ${result.errors.length} errors`);

    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      message: `تم تحديث ${result.updated} موظف بنجاح`,
    });
  } catch (error: any) {
    log.error('Mudad compliance POST error:', error);
    return NextResponse.json({ error: 'فشل تحديث بيانات مداد' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
