import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { ConsolidationEliminationApprovalService } from '@/lib/consolidation-elimination-approval';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.eliminations.requests.reject' });

/**
 * POST /api/accounting/consolidation/eliminations/requests/[id]/reject
 * Rejects a request
 * Body: { actorId: string, actorRole: string, reason: string }
 */
async function _POST(req: NextRequest, ctx: RouteContext, id: string) {
  try {
    const tenantId = ctx.tenant;
    const body = await req.json().catch(() => ({}));
    const { actorId, actorRole, reason } = body;

    if (!actorId || !actorRole || !reason) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول (actorId, actorRole, reason) مطلوبة للرفض' },
        { status: 400 }
      );
    }

    const service = new ConsolidationEliminationApprovalService();
    const request = await service.rejectRequest({
      tenantId,
      requestId: id,
      actorId,
      actorRole,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: request,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Consolidation reject POST api error:', { message: err.message });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const POST = withRoute(
  async (ctx, context: RouteParams) => {
    const rawParams = await context.params;
    const id = rawParams.id;
    return _POST(ctx.req, ctx, id);
  },
  { requireAuth: false, rateLimit: 'DEFAULT' }
);
