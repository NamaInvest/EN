/**
 * GET /api/inventory/stocktake — Stocktake sessions list
 * POST /api/inventory/stocktake — Create new stocktake session
 *
 * Delegates to /api/stocktake for compatibility
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { rateLimit: 'DEFAULT' });

// POST — create stocktake session
export const POST = withRoute(async ({ req, prisma, auth }) => {
  const tenantId = auth.tenantId;
  const body     = await req.json().catch(() => ({}));
  const { stockId, reference, notes } = body;

  try {
    const session = await (prisma as any).stocktake?.create({
      data: {
        tenantId, stockId: Number(stockId), reference,
        notes, status: 'OPEN', startDate: new Date(),
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
