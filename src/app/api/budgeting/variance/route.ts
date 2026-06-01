import { NextRequest, NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

async function _GET(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = ctx.tenant;
    const prisma = getPrisma(req);

    // Fetch approved budgets for this tenant
    const budgets = await prisma.budget.findMany({
      where: { tenantId },
      include: {
        lines: {
          include: {
            account: true,
            costCenter: true,
          }
        }
      },
      orderBy: { id: 'desc' },
    });

    const result = [];

    for (const b of budgets) {
      const variances = [];
      let totalAllocated = 0;

      for (const line of b.lines) {
        const allocated = n(line.allocatedAmount);
        totalAllocated += allocated;

        // Sum actual spent from JournalLines
        const actualLines = await prisma.journalLine.aggregate({
          where: {
            tenantId,
            accountId: line.accountId,
            costCenterId: line.costCenterId,
            entry: {
              status: 'posted',
              entryDate: {
                gte: b.startDate.toISOString(),
                lte: b.endDate.toISOString(),
              },
            },
          },
          _sum: { debit: true, credit: true },
        });

        // Expenses/debts nature: debit - credit
        const spent = n(actualLines._sum?.debit) - n(actualLines._sum?.credit);
        const variance = allocated - spent;
        const status = variance >= 0 ? 'FAVORABLE' : 'UNFAVORABLE';

        variances.push({
          accountName: line.account?.name || line.account?.nameEn || `Account #${line.accountId}`,
          costCenterName: line.costCenter?.name || 'بدون مركز تكلفة',
          allocated,
          spent,
          encumbered: 0, // Placeholder for encumbered amount
          variance,
          status,
        });
      }

      result.push({
        budgetId: b.id,
        name: b.name,
        totalAllocated,
        variances,
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'فشل جلب وتجمع تقارير الانحراف المالي للموازنة', details: err.message },
      { status: 500 }
    );
  }
}

export const GET = withRoute(async (ctx) => _GET(ctx.req as unknown as NextRequest, ctx), {
  rateLimit: 'DEFAULT',
});
