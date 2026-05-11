/**
 * Budget vs Actual Variance API
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/bi/budget-variance?tenantId=X&period=2026-05&type=MONTHLY|YTD|FULL_YEAR
 *
 * Reports:
 *   1. Account-level variance (Actual vs Budget)
 *   2. Department/Cost Center breakdown
 *   3. Cumulative YTD variance
 *   4. Forecast (remaining months at current run rate)
 *   5. Top 10 overspend accounts (action items)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bi.budget-variance' });

function n(val: any): number { return Number(val ?? 0); }

function calcVariance(actual: number, budget: number): {
  variance:    number;
  variancePct: number;
  isFavorable: boolean;
  status:      'ON_TRACK' | 'WATCH' | 'OVER';
} {
  const variance    = actual - budget;
  const variancePct = budget !== 0 ? (variance / Math.abs(budget)) * 100 : 0;
  const isFavorable = variance <= 0;   // for expense accounts: under-spend is favorable
  const status: 'ON_TRACK' | 'WATCH' | 'OVER' =
    Math.abs(variancePct) <= 5  ? 'ON_TRACK' :
    Math.abs(variancePct) <= 15 ? 'WATCH' : 'OVER';
  return {
    variance:    Math.round(variance    * 100) / 100,
    variancePct: Math.round(variancePct * 10)  / 10,
    isFavorable,
    status,
  };
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId    = searchParams.get('tenantId') ?? 'default';
  const period      = searchParams.get('period');           // YYYY-MM
  const reportType  = (searchParams.get('type') ?? 'YTD') as 'MONTHLY' | 'YTD' | 'FULL_YEAR';
  const deptId      = searchParams.get('departmentId');     // optional filter
  const accountType = searchParams.get('accountType');      // EXPENSE | REVENUE

  const prisma = getPrisma(req as any);
  const now     = new Date();
  const year    = period ? parseInt(period.slice(0, 4)) : now.getFullYear();
  const month   = period ? parseInt(period.slice(5, 7)) : now.getMonth() + 1;

  // Date ranges
  const monthStart  = new Date(year, month - 1, 1);
  const monthEnd    = new Date(year, month, 0, 23, 59, 59);
  const yearStart   = new Date(year, 0, 1);
  const ytdEnd      = monthEnd;

  // ── 1. Budget Lines ─────────────────────────────────────────────────────────
  const budgetLines = await (prisma as any).budgetLine?.findMany?.({
    where: {
      tenantId,
      year,
      ...(deptId ? { departmentId: parseInt(deptId) } : {}),
      ...(accountType ? { account: { type: accountType } } : {}),
    },
    include: {
      account: { select: { id: true, code: true, name: true, nameAr: true, type: true } },
    },
    orderBy: { account: { code: 'asc' } },
    take:    500,
  }).catch(() => []) ?? [];

  if (budgetLines.length === 0) {
    return NextResponse.json({
      tenantId, period: `${year}-${String(month).padStart(2, '0')}`,
      message: 'لا توجد بنود موازنة لهذه الفترة',
      lines: [], summary: null,
    });
  }

  const accountIds = budgetLines.map((b: any) => b.accountId);

  // ── 2. Actual Amounts (Journal Lines) ────────────────────────────────────────
  const [actualMonth, actualYTD] = await Promise.all([
    // Monthly actuals
    (prisma as any).journalLine?.groupBy?.({
      by:     ['accountId'],
      _sum:   { amount: true },
      where: {
        tenantId,
        accountId: { in: accountIds },
        side:      'DEBIT',
        journal: { date: { gte: monthStart, lte: monthEnd }, status: 'POSTED' },
      },
    }).catch(() => []) ?? [],

    // YTD actuals
    reportType !== 'MONTHLY'
      ? (prisma as any).journalLine?.groupBy?.({
          by:   ['accountId'],
          _sum: { amount: true },
          where: {
            tenantId,
            accountId: { in: accountIds },
            side:      'DEBIT',
            journal: { date: { gte: yearStart, lte: ytdEnd }, status: 'POSTED' },
          },
        }).catch(() => []) ?? []
      : [],
  ]);

  // Build actual maps
  const actualMonthMap = new Map<number, number>(
    (actualMonth as any[]).map((a: any) => [a.accountId, n(a._sum?.amount)])
  );
  const actualYTDMap = new Map<number, number>(
    (actualYTD as any[]).map((a: any) => [a.accountId, n(a._sum?.amount)])
  );

  // ── 3. Build variance lines ───────────────────────────────────────────────────
  const lines = budgetLines.map((b: any) => {
    const monthBudget  = n(b[`month${month}`] ?? b.monthlyAmount ?? b.annual / 12);
    const ytdBudget    = budgetLines.length > 0
      ? Array.from({ length: month }, (_, i) => n(b[`month${i + 1}`] ?? b.monthlyAmount ?? b.annual / 12))
          .reduce((s, v) => s + v, 0)
      : monthBudget * month;
    const annualBudget = n(b.annual ?? b.annualAmount ?? monthBudget * 12);

    const actualM   = actualMonthMap.get(b.accountId) ?? 0;
    const actualYtd = actualYTDMap.get(b.accountId) ?? 0;
    const monthRem  = 12 - month;
    const forecast  = actualYtd + (actualM * monthRem);   // simple run-rate

    const monthVar = calcVariance(actualM,   monthBudget);
    const ytdVar   = calcVariance(actualYtd, ytdBudget);

    return {
      accountId:    b.accountId,
      accountCode:  b.account?.code,
      accountName:  b.account?.nameAr ?? b.account?.name,
      accountType:  b.account?.type,

      monthly: {
        budget:    Math.round(monthBudget * 100) / 100,
        actual:    Math.round(actualM     * 100) / 100,
        ...monthVar,
      },

      ytd: reportType !== 'MONTHLY' ? {
        budget:    Math.round(ytdBudget  * 100) / 100,
        actual:    Math.round(actualYtd  * 100) / 100,
        ...ytdVar,
      } : undefined,

      fullYear: reportType === 'FULL_YEAR' ? {
        budget:    Math.round(annualBudget * 100) / 100,
        forecast:  Math.round(forecast     * 100) / 100,
        variance:  Math.round((forecast - annualBudget) * 100) / 100,
      } : undefined,
    };
  });

  // ── 4. Summary ──────────────────────────────────────────────────────────────
  const totalMonthBudget = lines.reduce((s: number, l: any) => s + l.monthly.budget, 0);
  const totalMonthActual = lines.reduce((s: number, l: any) => s + l.monthly.actual, 0);
  const totalYTDBudget   = lines.reduce((s: number, l: any) => s + (l.ytd?.budget ?? 0), 0);
  const totalYTDActual   = lines.reduce((s: number, l: any) => s + (l.ytd?.actual ?? 0), 0);

  const topOverspend = lines
    .filter((l: any) => l.monthly.variance > 0)
    .sort((a: any, b: any) => b.monthly.variance - a.monthly.variance)
    .slice(0, 10);

  const overCount = lines.filter((l: any) => l.monthly.status === 'OVER').length;
  const watchCount = lines.filter((l: any) => l.monthly.status === 'WATCH').length;

  log.info('Budget variance report generated', {
    tenantId, period, lines: lines.length, overCount,
  });

  return NextResponse.json({
    tenantId,
    period:     `${year}-${String(month).padStart(2, '0')}`,
    reportType,
    generatedAt: new Date().toISOString(),

    summary: {
      monthly: {
        totalBudget:   Math.round(totalMonthBudget * 100) / 100,
        totalActual:   Math.round(totalMonthActual * 100) / 100,
        ...calcVariance(totalMonthActual, totalMonthBudget),
      },
      ytd: reportType !== 'MONTHLY' ? {
        totalBudget: Math.round(totalYTDBudget * 100) / 100,
        totalActual: Math.round(totalYTDActual * 100) / 100,
        ...calcVariance(totalYTDActual, totalYTDBudget),
      } : undefined,
      health: {
        onTrack: lines.length - overCount - watchCount,
        watch:   watchCount,
        over:    overCount,
        total:   lines.length,
      },
    },

    topOverspend,
    lines,
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
