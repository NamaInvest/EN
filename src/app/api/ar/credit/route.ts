/**
 * AR API route — Credit Management & Aging (Module 21)
 * GET  /api/ar/credit?customerId=x    → credit decision + score
 * GET  /api/ar/aging                  → full aging report (all customers)
 * POST /api/ar/credit/check           → check credit for a new transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { CreditManagementService } from '@/services/ar/credit-management.service';
import { BusinessContext } from '@/services/shared/event-bus.service';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ar.credit' });

function buildCtx(req: NextRequest): BusinessContext {
  const tenantId = req.headers.get('x-tenant-id') ?? 'default';
  const userId   = req.headers.get('x-user-id')   ?? 'system';
  return {
    tenant: { id: tenantId },
    user:   { id: userId },
    requirePermission: () => {},
  } as unknown as BusinessContext;
}

async function _GET(req: NextRequest) {
  try {
    const prisma     = getPrisma(req);
    const ctx        = buildCtx(req);
    const service    = new CreditManagementService(prisma as any, ctx);
    const { searchParams } = req.nextUrl;

    const action     = searchParams.get('action') ?? 'aging';
    const customerId = searchParams.get('customerId');

    if (action === 'score' && customerId) {
      const score = await service.calculateCreditScore(customerId);
      return NextResponse.json({ customerId, score });
    }

    if (action === 'credit' && customerId) {
      const amount   = parseFloat(searchParams.get('amount') ?? '0');
      const decision = await service.checkCreditLimit(customerId, amount);
      return NextResponse.json(decision);
    }

    // Default: full aging report
    const report = await service.generateAgingReport();
    return NextResponse.json({ report, generatedAt: new Date().toISOString() });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req);
    const service = new CreditManagementService(prisma as any, ctx);
    const body    = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

    const { customerId, amount } = body;
    if (!customerId || amount == null) {
      return NextResponse.json({ error: 'مطلوب: customerId, amount' }, { status: 400 });
    }

    const holdDecision = await service.holdOrderIfOverLimit(customerId, Number(amount));
    return NextResponse.json(holdDecision);

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
