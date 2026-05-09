/**
 * Allocation API route (Accounting 20.4)
 * POST /api/accounting/allocations/dry-run  → preview allocation
 * POST /api/accounting/allocations/execute  → execute allocation (creates JE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { AllocationService, AllocationRule } from '@/services/accounting/allocation.service';
import { BusinessContext } from '@/services/shared/event-bus.service';
import { Decimal } from '@prisma/client/runtime/library';

function buildCtx(req: NextRequest): BusinessContext {
  const tenantId = req.headers.get('x-tenant-id') ?? 'default';
  const userId   = req.headers.get('x-user-id')   ?? 'system';
  return {
    tenant: { id: tenantId },
    user:   { id: userId },
    branch: { id: req.headers.get('x-branch-id') ?? 'default-branch' },
    requirePermission: () => {},
  } as unknown as BusinessContext;
}

async function _POST(req: NextRequest) {
  try {
    const prisma   = getPrisma(req);
    const ctx      = buildCtx(req);
    const service  = new AllocationService(prisma as any, ctx);
    const { searchParams } = req.nextUrl;
    const action   = searchParams.get('action') ?? 'dry-run';
    const body     = await req.json() as { rule: AllocationRule; totalAmount?: number; periodId?: string; memo?: string };

    if (!body.rule) {
      return NextResponse.json({ error: 'مطلوب: rule' }, { status: 400 });
    }

    if (action === 'dry-run') {
      const amount  = new Decimal(body.totalAmount ?? 0);
      const preview = await service.dryRun(body.rule, amount, body.periodId);
      return NextResponse.json(preview);
    }

    if (action === 'execute') {
      if (!body.periodId) {
        return NextResponse.json({ error: 'مطلوب: periodId لتنفيذ التوزيع' }, { status: 400 });
      }
      const result = await service.execute(body.rule, body.periodId, body.memo);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'action غير معروف. استخدم: dry-run | execute' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
