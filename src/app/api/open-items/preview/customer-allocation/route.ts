import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { OpenItemsService } from '@/lib/services/open-items.service';
import { handleApiError } from '@/lib/api-handler';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'open-items-preview-customer' });

const PreviewCustomerSchema = z.object({
  partnerId: z.number(),
  treasuryId: z.number(),
  allocations: z.array(z.object({
    salesInvoiceId: z.number(),
    amount: z.number().positive(),
  })).min(1),
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

    const parsed = PreviewCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body parameters.',
        details: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { partnerId, treasuryId, allocations } = parsed.data;

    // Call read-only preview calculation logic
    const preview = await OpenItemsService.previewCustomerAllocation(prisma, {
      tenantId,
      partnerId,
      treasuryId,
      allocations,
      userId: 'SYSTEM',
    });

    return NextResponse.json(preview);
  } catch (error: any) {
    log.error('Customer allocation preview error', { error: error.message });
    return handleApiError(error);
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'view',
});
