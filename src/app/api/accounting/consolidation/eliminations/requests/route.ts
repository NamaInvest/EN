import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { ConsolidationEliminationApprovalService } from '@/lib/consolidation-elimination-approval';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.eliminations.requests' });

/**
 * GET /api/accounting/consolidation/eliminations/requests
 * Lists approval requests for the current tenant.
 */
async function _GET(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = ctx.tenant;
    const url = new URL(req.url);
    const groupIdStr = url.searchParams.get('groupId');

    const allRequests = Array.from(ConsolidationEliminationApprovalService.requests.values());

    let filtered = allRequests.filter((r) => r.tenantId === tenantId);

    if (groupIdStr) {
      const gId = parseInt(groupIdStr, 10);
      if (!isNaN(gId)) {
        filtered = filtered.filter((r) => r.groupId === gId);
      }
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Failed to list consolidation elimination requests', { message: err.message });
    return NextResponse.json(
      { success: false, error: 'فشل استرجاع طلبات استبعاد التوحيد', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounting/consolidation/eliminations/requests
 * Body: { groupId: number, from: string, to: string }
 * Submits a new consolidation elimination request.
 */
async function _POST(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = ctx.tenant;
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
        { success: false, error: 'يجب تحديد النطاق الزمني (from و to)' },
        { status: 400 }
      );
    }

    const actorId = ctx.auth?.userId ? String(ctx.auth.userId) : 'system_maker';
    const actorRole = ctx.auth?.role || 'ACCOUNTANT';

    const service = new ConsolidationEliminationApprovalService();
    const request = await service.submitRequest({
      tenantId,
      groupId: Number(groupId),
      from,
      to,
      actorId,
      actorRole,
    });

    return NextResponse.json({
      success: true,
      data: request,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Failed to submit consolidation elimination request', { message: err.message });
    return NextResponse.json(
      { success: false, error: 'فشل تقديم طلب استبعاد التوحيد', details: err.message },
      { status: 400 }
    );
  }
}

export const GET = withRoute(async (ctx) => _GET(ctx.req, ctx), {
  rateLimit: 'FINANCIAL',
  requireAuth: true,
});

export const POST = withRoute(async (ctx) => _POST(ctx.req, ctx), {
  rateLimit: 'FINANCIAL',
  requireAuth: true,
});
