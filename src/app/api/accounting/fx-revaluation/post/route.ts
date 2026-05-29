import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { FXRevaluationEngine } from '@/lib/fx-revaluation-engine';
import { handleApiError } from '@/lib/api-handler';
import { runFinancialTx } from '@/lib/db/transaction';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'fx-revaluation-post-route' });

const PostSchema = z.object({
  targetDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

async function _POST(ctx: any) {
  const { req, prisma, tenant, auth } = ctx;
  try {
    const body = await req.json();

    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body. targetDate (YYYY-MM-DD or ISO string) is required.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const targetDate = new Date(parsed.data.targetDate);
    const userId = auth?.userId;

    // Run the posting and reversals atomically inside runFinancialTx
    const runs = await runFinancialTx(prisma, async (tx: any) => {
      return FXRevaluationEngine.postARAP(tx, tenant, targetDate, userId);
    }, 'fx-revaluation-post');

    return NextResponse.json({
      success: true,
      runs,
    });
  } catch (error: any) {
    log.error('FX revaluation posting execution error', { error: error.message, tenant });
    return handleApiError(error);
  }
}

export const POST = withRoute(async (ctx) => _POST(ctx), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'edit',
});
