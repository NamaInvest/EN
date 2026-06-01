import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { ConsolidationEliminationPostingService } from '@/lib/consolidation-elimination-posting';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.accounting.consolidation.eliminations.requests.posting-preview' });

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/accounting/consolidation/eliminations/requests/[id]/posting-preview
 * Generates posting and reversal preview for an approved request.
 */
async function _GET(req: NextRequest, ctx: RouteContext, id: string) {
  try {
    const tenantId = ctx.tenant;
    
    // Safety check: tenantId must only come from authenticated context
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول (tenantId غير معرف)' },
        { status: 401 }
      );
    }

    const service = new ConsolidationEliminationPostingService();
    const preview = await service.buildPostingPreview(tenantId, id);

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Consolidation posting-preview GET api error:', { message: err.message });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

export const GET = withRoute(
  async (ctx, context: RouteParams) => {
    const rawParams = await context.params;
    const id = rawParams.id;
    return _GET(ctx.req, ctx, id);
  },
  { requireAuth: true, rateLimit: 'DEFAULT' }
);
