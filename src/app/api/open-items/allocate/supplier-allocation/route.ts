import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { runFinancialTx } from '@/lib/db/transaction';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { buildOverrideContextFromRequest } from '@/lib/governance/override-context';

const log = logger.child({ service: 'open-items-allocate-supplier' });

const RealSupplierSchema = z.object({
  partnerId: z.number(),
  treasuryId: z.number(),
  allocations: z.array(z.object({
    purchaseInvoiceId: z.number(),
    amount: z.number().positive(),
  })).min(1),
});

async function _POST(ctx: any) {
  const { req, prisma, auth, tenant } = ctx;
  try {
    const body = await req.json();

    const parsed = RealSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body parameters.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { partnerId, treasuryId, allocations } = parsed.data;

    const overrideContext = buildOverrideContextFromRequest(req, {
      tenantId: tenant,
      actorId: String(auth.userId),
      actorRole: auth.role || 'USER',
      requestId: req.headers.get('x-request-id') || undefined,
    });

    // Wrap execution inside a retryable financial transaction Client
    const matches = await runFinancialTx(prisma, async (tx) => {
      const results = [];
      for (const alloc of allocations) {
        const match = await OpenItemsService.allocateSupplierPayment(tx, {
          tenantId: tenant,
          purchaseInvoiceId: alloc.purchaseInvoiceId,
          treasuryId,
          amount: alloc.amount,
          allocatedBy: auth.username || 'API',
          sourceType: 'API',
          userId: String(auth.userId),
          overrideContext,
        });
        results.push(match);
      }
      return results;
    });

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error: any) {
    log.error('Supplier payment allocation execution error', { error: error.message, tenant });
    return handleApiError(error);
  }
}

export const POST = withRoute(async (ctx) => _POST(ctx), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'add',
});
