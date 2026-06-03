/**
 * GET /api/inventory/stocktake — Stocktake sessions list
 * POST /api/inventory/stocktake — Create new stocktake session
 *
 * Delegates to /api/stocktake for compatibility
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';

const log = logger.child({ service: 'inventory.stocktake' });

// GET — list stocktake sessions
export const GET = withRoute(async ({ prisma, auth }) => {
  const tenantId = auth.tenantId;
  try {
    const sessions = await (prisma as any).stocktake?.findMany({
      where:   { tenantId },
      orderBy: { startDate: 'desc' },
      take:    100,
      select:  { id: true, reference: true, status: true, startDate: true, endDate: true, stockId: true },
    }) ?? await (prisma as any).stockTakeSession?.findMany({
      where:   { tenantId },
      orderBy: { createdAt: 'desc' },
      take:    100,
    }) ?? [];
    return NextResponse.json(sessions);
  } catch (e: any) { log.error(e); return NextResponse.json([], { status: 500 }); }
}, { rateLimit: 'DEFAULT' });

// POST — create stocktake session
export const POST = withRoute(async ({ req, prisma, auth }) => {
  const tenantId = auth.tenantId;
  const body     = await req.json().catch(() => ({}));
  const { stockId, reference, notes } = body;

  const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
  const overrideContext = buildOverrideContextFromRequest(req as any, {
      tenantId,
      actorId: String(auth.userId),
      actorRole: auth.role
  });

  const inputDate = body.startDate || body.date || body.postingDate;
  const resolvedPostingDate = inputDate ? new Date(inputDate) : new Date();

  // ── Period Lock Enforcement ────────────────────────────────────────
  try {
    await assertPeriodWritable({
      tenantId,
      postingDate: resolvedPostingDate,
      operationType: 'STOCKTAKE_SESSION_CREATE',
      module: 'inventory',
      actor: String(auth.userId),
      overrideContext
    });
  } catch (err) {
    if (err instanceof PeriodLockViolation) {
      return NextResponse.json({
        error: err.message,
        code: err.code
      }, { status: err.code === 'LOCKED' ? 409 : 422 });
    }
    throw err;
  }
  // ────────────────────────────────────────────────────────────────────

  try {
    const session = await (prisma as any).stocktake?.create({
      data: {
        tenantId, stockId: Number(stockId), reference,
        notes, status: 'OPEN', startDate: resolvedPostingDate,
        createdBy: auth.userId,
      },
    }) ?? await (prisma as any).stockTakeSession?.create({
      data: { tenantId, stockId: Number(stockId), reference, notes, status: 'OPEN' },
    });

    if (!session) return NextResponse.json({ error: 'وحدة الجرد غير متاحة' }, { status: 404 });
    return NextResponse.json(session, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { rateLimit: 'DEFAULT' });
