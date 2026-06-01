import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { ConsolidationEliminationPostingService } from '@/lib/consolidation-elimination-posting';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.eliminations.requests.reverse' });

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/accounting/consolidation/eliminations/requests/[id]/reverse
 * Performs manual reversal of a previously posted consolidation elimination request.
 * Body: { actorId: string, actorRole: string }
 */
async function _POST(req: NextRequest, ctx: RouteContext, id: string) {
  try {
    const tenantId = ctx.tenant;
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول (tenantId غير معرف)' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { actorId, actorRole } = body;

    if (!actorId || !actorRole) {
      return NextResponse.json(
        { success: false, error: 'actorId و actorRole مطلوبين لإتمام عملية العكس اليدوي' },
        { status: 400 }
      );
    }

    const service = new ConsolidationEliminationPostingService();
    const result = await service.reversePostedElimination(
      tenantId,
      id,
      actorId,
      actorRole
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Consolidation reversal POST api error:', { message: err.message });
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
  { requireAuth: true, rateLimit: 'FINANCIAL' }
);
