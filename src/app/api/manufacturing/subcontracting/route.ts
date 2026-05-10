/**
 * GET /api/manufacturing/subcontracting — Subcontracting Purchase Orders
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const prisma   = ctx.prisma;
  const tenantId = ctx.auth.tenantId;

  try {
    const pos = await (prisma as any).subcontractingPO?.findMany({
      where:   { tenantId },
      orderBy: { createdAt: 'desc' },
      take:    200,
      include: {
        supplier: { select: { id: true, name: true } },
        product:  { select: { id: true, name: true } },
      },
    }).catch(() => null);

    if (!pos) return NextResponse.json({ message: 'الوحدة غير مفعّلة' }, { status: 404 });
    return NextResponse.json(pos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
