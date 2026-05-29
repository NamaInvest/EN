import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { FXRevaluationEngine } from '@/lib/fx-revaluation-engine';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'fx-revaluation-bank-preview-route' });

const PreviewSchema = z.object({
  targetDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

async function _POST(ctx: any) {
  const { req, prisma, tenant } = ctx;
  try {
    const body = await req.json();

    const parsed = PreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body. targetDate (YYYY-MM-DD or ISO string) is required.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const targetDate = new Date(parsed.data.targetDate);
    
    // Calculate the dry-run bank revaluation preview using our read-only engine method
    const preview = await FXRevaluationEngine.previewBank(prisma, tenant, targetDate);

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error: any) {
    log.error('Bank FX revaluation dry-run preview execution error', { error: error.message, tenant });
    return handleApiError(error);
  }
}

export const POST = withRoute(async (ctx) => _POST(ctx), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'view',
});
