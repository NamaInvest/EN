import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { FinancialConsolidationEngine } from '@/lib/financial-consolidation-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.eliminations.dry-run' });

/**
 * POST /api/accounting/consolidation/eliminations/dry-run
 * Body: { groupId: number, from: string, to: string }
 */
async function _POST(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = ctx.tenant;
    const prisma = getPrisma(req);
    const body = await req.json().catch(() => ({}));

    const { groupId, from, to } = body;

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'معرف مجموعة التوحيد (groupId) مطلوب' },
        { status: 400 }
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'يجب تحديد نطاق التواريخ (from و to)' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'صيغة تاريخ البدء أو الانتهاء غير صالحة' },
        { status: 400 }
      );
    }

    const engine = new FinancialConsolidationEngine(prisma);
    const data = await engine.dryRunEliminations(tenantId, Number(groupId), fromDate, toDate);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Consolidation eliminations dry-run api error:', {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'فشل إجراء محاكاة استبعاد قيود المعاملات البينية',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

export const POST = withRoute(async (ctx) => _POST(ctx.req, ctx), {
  rateLimit: 'DEFAULT',
});
