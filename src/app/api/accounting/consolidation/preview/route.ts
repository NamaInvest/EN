import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { FinancialConsolidationEngine } from '@/lib/financial-consolidation-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.preview' });

/**
 * GET /api/accounting/consolidation/preview
 * Query: ?groupId=1&from=2026-01-01&to=2026-05-31
 */
async function _GET(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = ctx.tenant;
    const prisma = getPrisma(req);
    const searchParams = req.nextUrl.searchParams;

    const groupIdStr = searchParams.get('groupId');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    if (!groupIdStr) {
      return NextResponse.json(
        { success: false, error: 'معرف مجموعة التوحيد (groupId) مطلوب' },
        { status: 400 }
      );
    }

    if (!fromStr || !toStr) {
      return NextResponse.json(
        { success: false, error: 'يجب تحديد نطاق التواريخ (from و to)' },
        { status: 400 }
      );
    }

    const groupId = parseInt(groupIdStr, 10);
    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: 'معرف مجموعة التوحيد (groupId) غير صالح' },
        { status: 400 }
      );
    }

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'صيغة تاريخ البدء أو الانتهاء غير صالحة' },
        { status: 400 }
      );
    }

    const engine = new FinancialConsolidationEngine(prisma);
    const data = await engine.consolidate(tenantId, groupId, fromDate, toDate);

    // Return the secure, tenant-isolated calculated preview
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Consolidation preview api error:', {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'فشل استعلام وعرض معاينة توحيد الحسابات الموحدة',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

export const GET = withRoute(async (ctx) => _GET(ctx.req, ctx), {
  rateLimit: 'DEFAULT',
});
