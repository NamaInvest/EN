import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items-preview-reversal' });

const PreviewReversalSchema = z.object({
  matchingId: z.number(),
  reason: z.string().min(10, 'A detailed reversal reason (minimum 10 characters) is strictly required.'),
  dryRun: z.boolean().optional().default(true),
}).refine(data => data.dryRun === true, {
  message: 'Actual allocations / mutations are strictly forbidden in dry-run preview endpoints.',
  path: ['dryRun']
});


async function _POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const tenantId = requireTenantId(request as any);
    const body = await request.json();

    const parsed = PreviewReversalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body parameters.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { matchingId, reason } = parsed.data;

    // Call read-only preview calculation logic
    const preview = await OpenItemsService.previewReverseAllocation(
      prisma,
      tenantId,
      matchingId,
      'SYSTEM',
      reason
    );

    return NextResponse.json(preview);
  } catch (error: any) {
    log.error('Reversal preview error', { error: error.message });
    return handleApiError(error);
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'view',
});
