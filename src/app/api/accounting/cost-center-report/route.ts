/**
 * Cost Center Report API
 * GET /api/accounting/cost-center-report?tenantId=X&from=&to=&costCenterId=
 *
 * تقرير مراكز التكلفة: مصروفات، إيرادات، صافي، vs موازنة
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.cost-center-report' });

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId     = searchParams.get('tenantId') ?? 'default';
  const costCenterId = searchParams.get('costCenterId') ? parseInt(searchParams.get('costCenterId')!) : undefined;
  const now  = new Date();
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(now.getFullYear(), 0, 1);
  const to   = searchParams.get('to')   ? new Date(searchParams.get('to')! + 'T23:59:59') : now;

  const p = getPrisma(req as any) as any;

  // Fetch cost centers
  const costCenters = await p.costCenter?.findMany?.({
    where: { tenantId, ...(costCenterId ? { id: costCenterId } : {}) },
    orderBy: { code: 'asc' },
  }).catch(() => []) ?? [];

  if (costCenters.length === 0) {
    return NextResponse.json({ tenantId, message: 'لا توجد مراكز تكلفة', costCenters: [] });
  }

  const ccIds = costCenters.map((cc: any) => cc.id);

  // Aggregate GL lines by cost center
  const glLines = await p.journalEntryLine?.findMany?.({
    where: {
      tenantId,
      costCenterId: { in: ccIds },
      journalEntry: { date: { gte: from, lte: to }, status: 'POSTED' },
    },
    select: {
      costCenterId: true,
      side:         true,
      amount:       true,
      account: { select: { code: true, type: true } },
    },
  }).catch(() => []) ?? [];

  // Aggregate by cost center
  const ccMap = new Map<number, { revenue: number; expenses: number }>();
  for (const id of ccIds) ccMap.set(id, { revenue: 0, expenses: 0 });

  for (const line of glLines) {
    const cc = ccMap.get(line.costCenterId);
    if (!cc) continue;
    const code = line.account?.code ?? '9999';
    const amount = Number(line.amount ?? 0);

    if (code >= '4000' && code < '5000') {
      cc.revenue   += line.side === 'CREDIT' ? amount : -amount;
    } else if (code >= '5000' && code < '7000') {
      cc.expenses  += line.side === 'DEBIT'  ? amount : -amount;
    }
  }

  // Fetch budget by cost center if available
  const budgets = await p.budgetLine?.findMany?.({
    where: { tenantId, costCenterId: { in: ccIds } },
    select: { costCenterId: true, annualTotal: true },
  }).catch(() => []) ?? [];

  const budgetMap = new Map<number, number>(
    budgets.map((b: any) => [b.costCenterId, Number(b.annualTotal ?? 0)])
  );

  const report = costCenters.map((cc: any) => {
    const data    = ccMap.get(cc.id) ?? { revenue: 0, expenses: 0 };
    const net     = data.revenue - data.expenses;
    const budget  = budgetMap.get(cc.id) ?? 0;
    const variance= net - budget;
    const variancePct = budget === 0 ? 0 : Math.round((variance / Math.abs(budget)) * 100);

    return {
      id:           cc.id,
      code:         cc.code,
      name:         cc.nameAr ?? cc.name,
      revenue:      Math.round(data.revenue  * 100) / 100,
      expenses:     Math.round(data.expenses * 100) / 100,
      net:          Math.round(net           * 100) / 100,
      budget:       Math.round(budget        * 100) / 100,
      variance:     Math.round(variance      * 100) / 100,
      variancePct:  `${variancePct > 0 ? '+' : ''}${variancePct}%`,
      status:       net >= budget ? 'ON_TRACK' : net >= budget * 0.9 ? 'WATCH' : 'OVER',
    };
  });

  const totals = {
    revenue:  report.reduce((s: number, r: any) => s + r.revenue, 0),
    expenses: report.reduce((s: number, r: any) => s + r.expenses, 0),
    net:      report.reduce((s: number, r: any) => s + r.net, 0),
    budget:   report.reduce((s: number, r: any) => s + r.budget, 0),
  };

  log.info('Cost center report', { tenantId, centers: report.length });

  return NextResponse.json({
    tenantId,
    period: { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] },
    costCenters: report,
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round((v as number) * 100) / 100])),
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
