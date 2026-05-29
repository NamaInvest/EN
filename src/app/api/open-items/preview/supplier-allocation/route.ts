import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items-preview-supplier' });

const PreviewSupplierSchema = z.object({
  partnerId: z.number(),
  treasuryId: z.number(),
  allocations: z.array(z.object({
    purchaseInvoiceId: z.number(),
    amount: z.number().positive(),
  })).min(1),
  dryRun: z.boolean().optional().default(true),
});

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const tenantId = requireTenantId(request as any);
    const body = await request.json();

    const parsed = PreviewSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body parameters.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { partnerId, treasuryId, allocations } = parsed.data;

    // Call read-only preview calculation logic
    const preview = await OpenItemsService.previewSupplierAllocation(prisma, {
      tenantId,
      partnerId,
      treasuryId,
      allocations,
      userId: 'SYSTEM',
    });

    return NextResponse.json(preview);
  } catch (error: any) {
    log.error('Supplier allocation preview error', { error: error.message });
    return handleApiError(error);
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'view',
});
