import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { ConsolidationEliminationApprovalService } from '@/lib/consolidation-elimination-approval';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.eliminations.requests.approve' });

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/accounting/consolidation/eliminations/requests/[id]/approve
 * Approves a request (CFO or Master Admin)
 * Body: { actorId: string, actorRole: string }
 */
async function _POST(req: NextRequest, ctx: RouteContext, id: string) {
  try {
    const tenantId = ctx.tenant;
    const body = await req.json().catch(() => ({}));
    const { actorId, actorRole } = body;

    if (!actorId || !actorRole) {
      return NextResponse.json(
        { success: false, error: 'actorId و actorRole مطلوبين للاعتماد' },
        { status: 400 }
      );
    }

    const service = new ConsolidationEliminationApprovalService();
    let request;

    if (actorRole === 'CFO') {
      request = await service.approveByCfo({
        tenantId,
        requestId: id,
        actorId,
        actorRole,
      });
    } else if (actorRole === 'MASTER_ADMIN' || actorRole === 'SUPER_ADMIN') {
      request = await service.approveByMasterAdmin({
        tenantId,
        requestId: id,
        actorId,
        actorRole,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'دور غير صالح للاعتماد' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: request,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Consolidation approve POST api error:', { message: err.message });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

export const POST = withRoute(
  async (ctx, context: RouteParams) => {
    const rawParams = await context.params;
    const id = rawParams.id;
    return _POST(ctx.req, ctx, id);
  },
  { requireAuth: false, rateLimit: 'DEFAULT' }
);
