/**
 * AR API route — Credit Management & Aging (Module 21)
 * GET  /api/ar/credit?customerId=x    → credit decision + score
 * GET  /api/ar/aging                  → full aging report (all customers)
 * POST /api/ar/credit/check           → check credit for a new transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { CreditManagementService } from '@/services/ar/credit-management.service';
import { BusinessContext } from '@/services/shared/event-bus.service';

function buildCtx(req: NextRequest): BusinessContext {
  const tenantId = req.headers.get('x-tenant-id') ?? 'default';
  const userId   = req.headers.get('x-user-id')   ?? 'system';
  return {
    tenant: { id: tenantId },
    user:   { id: userId },
    requirePermission: () => {},
  } as unknown as BusinessContext;
}

export async function GET(req: NextRequest) {
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

export async function POST(req: NextRequest) {
  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req);
    const service = new CreditManagementService(prisma as any, ctx);
    const body    = await req.json();

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
