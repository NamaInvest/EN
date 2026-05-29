import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { runFinancialTx } from '@/lib/db/transaction';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items-allocate-reversal' });

const RealReversalSchema = z.object({
  matchingId: z.number(),
  reason: z.string().min(10, 'A detailed reversal reason (minimum 10 characters) is strictly required.'),
});

async function _POST(ctx: any) {
  const { req, prisma, auth, tenant } = ctx;
  try {
    const body = await req.json();

    const parsed = RealReversalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body parameters.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { matchingId, reason } = parsed.data;

    // Wrap execution inside a retryable financial transaction Client
    await runFinancialTx(prisma, async (tx) => {
      await OpenItemsService.reverseAllocation(
        tx,
        tenant,
        matchingId,
        String(auth.userId),
        reason
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Allocation reversed and settled balances restored cleanly.',
    });
  } catch (error: any) {
    log.error('Allocation reversal execution error', { error: error.message, tenant });
    return handleApiError(error);
  }
}

export const POST = withRoute(async (ctx) => _POST(ctx), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'delete', // reversal/unmatching represents deleting/voiding an allocation
});
