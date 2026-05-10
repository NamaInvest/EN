/**
 * GET /api/treasury/dashboard — Treasury dashboard KPIs
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const prisma   = ctx.prisma;
  const tenantId = ctx.auth.tenantId;

  try {
    const [cashIn, cashOut, recentTx] = await Promise.all([
      prisma.treasury.aggregate({
        where: { tenantId, type: 'in', deletedAt: null },
        _sum:  { amount: true },
      }),
      prisma.treasury.aggregate({
        where: { tenantId, type: 'out', deletedAt: null },
        _sum:  { amount: true },
      }),
      prisma.treasury.findMany({
        where:   { tenantId, deletedAt: null },
        orderBy: { date: 'desc' },
        take:    10,
        select:  { id: true, date: true, type: true, amount: true, description: true },
      }),
    ]);

    const netBalance = Number(cashIn._sum.amount ?? 0) - Number(cashOut._sum.amount ?? 0);

    return NextResponse.json({
      totalIn:    Number(cashIn._sum.amount  ?? 0),
      totalOut:   Number(cashOut._sum.amount ?? 0),
      netBalance,
      recentTransactions: recentTx,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
