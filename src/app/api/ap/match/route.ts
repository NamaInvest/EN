/**
 * AP Master Route — 3-Way Match + Payment Runs
 * POST /api/ap/match          → Run 3-way match for an invoice
 * POST /api/ap/match/approve  → Approve matched invoice
 * POST /api/ap/payment-run    → Create/submit/approve payment runs
 * GET  /api/ap/payment-run    → List payment runs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { ThreeWayMatchService } from '@/services/ap/three-way-match.service';
import { PaymentRunService } from '@/services/ap/payment-run.service';
import { BusinessContext } from '@/services/shared/event-bus.service';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ap.match' });

function buildCtx(req: NextRequest): BusinessContext {
  return {
    tenant: { id: req.headers.get('x-tenant-id') ?? 'default' },
    user:   { id: req.headers.get('x-user-id')   ?? 'system' },
    branch: { id: req.headers.get('x-branch-id') ?? 'default-branch' },
    requirePermission: () => {},
    fiscal: { isClosed: false },
  } as unknown as BusinessContext;
}

async function _GET(req: NextRequest) {
  try {
    const prisma = getPrisma(req);
    const ctx    = buildCtx(req);
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action') ?? 'list-runs';

    if (action === 'list-runs') {
      const runs = await (prisma as any).paymentRun.findMany({
        where:   { tenantId: ctx.tenant.id },
        orderBy: { createdAt: 'desc' },
        take:    50,
        include: { lines: true },
      }).catch(() => []);
      return NextResponse.json({ runs });
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  invoiceId: z.union([z.string(), z.number()]).optional(),
  poId: z.union([z.string(), z.number()]).optional(),
  tolerance: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req);
    const { searchParams } = req.nextUrl;
    const action  = searchParams.get('action') ?? '';
    const body    = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

    // ── 3-Way Match ───────────────────────────────────────────────────────────
    if (action === 'match') {
      const { invoiceId, poId, tolerance } = body;
      if (!invoiceId || !poId) {
        return NextResponse.json({ error: 'مطلوب: invoiceId, poId' }, { status: 400 });
      }
      const service = new ThreeWayMatchService(prisma as any, ctx);
      const result  = await service.match({ invoiceId, poId, tolerance });
      return NextResponse.json(result);
    }

    if (action === 'match-approve') {
      const { invoiceId } = body;
      if (!invoiceId) {
        return NextResponse.json({ error: 'مطلوب: invoiceId' }, { status: 400 });
      }
      const service = new ThreeWayMatchService(prisma as any, ctx);
      await service.approveInvoice(invoiceId);
      return NextResponse.json({ success: true });
    }

    // ── Payment Run ───────────────────────────────────────────────────────────
    if (action === 'create-run') {
      const { invoiceIds, paymentDate, currency, memo } = body;
      if (!invoiceIds?.length) {
        return NextResponse.json({ error: 'مطلوب: invoiceIds[]' }, { status: 400 });
      }
      const service = new PaymentRunService(prisma as any, ctx);
      const run     = await service.create(invoiceIds, new Date(paymentDate ?? Date.now()), currency, memo);
      return NextResponse.json(run);
    }

    if (action === 'export-sarie') {
      const { summary } = body;
      if (!summary) return NextResponse.json({ error: 'مطلوب: summary' }, { status: 400 });
      const service = new PaymentRunService(prisma as any, ctx);
      const file    = service.generateSARIEFile(summary);
      return new NextResponse(file, {
        headers: {
          'Content-Type':        'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sarie-payment-${Date.now()}.csv"`,
        },
      });
    }

    if (action === 'submit-run') {
      const { runId } = body;
      if (!runId) return NextResponse.json({ error: 'مطلوب: runId' }, { status: 400 });
      const service = new PaymentRunService(prisma as any, ctx);
      await service.submitForApproval(runId);
      return NextResponse.json({ success: true });
    }

    if (action === 'approve-run') {
      const { runId } = body;
      if (!runId) return NextResponse.json({ error: 'مطلوب: runId' }, { status: 400 });
      const service = new PaymentRunService(prisma as any, ctx);
      await service.approve(runId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'action غير معروف. استخدم: match | match-approve | create-run | export-sarie | submit-run | approve-run' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
