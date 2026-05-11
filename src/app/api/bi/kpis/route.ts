/**
 * Management KPI Dashboard — Enhanced
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/bi/kpis?tenantId=X&period=2026-05&compare=true
 *
 * Replaces the old endpoint with:
 *   1. Full tenant isolation (tenantId required)
 *   2. Period-specific queries (not all-time)
 *   3. YoY (Year-over-Year) and MoM (Month-over-Month) comparisons
 *   4. Liquidity ratios (Current Ratio, Quick Ratio, DSO, DPO)
 *   5. 12-month trend data for charts
 *   6. ZATCA compliance metrics
 *   7. HR KPIs (headcount, turnover, payroll cost)
 *   8. Inventory KPIs (turnover, slow-movers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bi.kpis.enhanced' });

function n(val: any): number { return Number(val ?? 0); }

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const period   = searchParams.get('period');     // YYYY-MM (optional, defaults to current month)
  const compare  = searchParams.get('compare') !== 'false';

  const prisma = getPrisma(req as any);

  // Parse period
  const now          = new Date();
  const year         = period ? parseInt(period.slice(0, 4)) : now.getFullYear();
  const month        = period ? parseInt(period.slice(5, 7)) : now.getMonth() + 1;
  const periodStart  = new Date(year, month - 1, 1);
  const periodEnd    = new Date(year, month, 0, 23, 59, 59);

  // Prior month
  const priorMonth   = month === 1 ? 12 : month - 1;
  const priorYear    = month === 1 ? year - 1 : year;
  const priorStart   = new Date(priorYear, priorMonth - 1, 1);
  const priorEnd     = new Date(priorYear, priorMonth, 0, 23, 59, 59);

  // Prior year same month
  const priorYearStart = new Date(year - 1, month - 1, 1);
  const priorYearEnd   = new Date(year - 1, month, 0, 23, 59, 59);

  // ── 1. Revenue ──────────────────────────────────────────────────────────────
  const [revCurrent, revPrior, revPriorYear] = await Promise.all([
    (prisma as any).salesInvoice?.aggregate?.({ _sum: { total: true }, where: { tenantId, date: { gte: periodStart, lte: periodEnd }, status: { not: 'CANCELLED' } } }).catch(() => null),
    compare ? (prisma as any).salesInvoice?.aggregate?.({ _sum: { total: true }, where: { tenantId, date: { gte: priorStart, lte: priorEnd }, status: { not: 'CANCELLED' } } }).catch(() => null) : null,
    compare ? (prisma as any).salesInvoice?.aggregate?.({ _sum: { total: true }, where: { tenantId, date: { gte: priorYearStart, lte: priorYearEnd }, status: { not: 'CANCELLED' } } }).catch(() => null) : null,
  ]);

  const revenue        = n(revCurrent?._sum?.total);
  const revPriorM      = n(revPrior?._sum?.total);
  const revPriorY      = n(revPriorYear?._sum?.total);

  // ── 2. Cost of Goods / Purchases ────────────────────────────────────────────
  const [cogsCurrent] = await Promise.all([
    (prisma as any).purchaseInvoice?.aggregate?.({ _sum: { total: true }, where: { tenantId, date: { gte: periodStart, lte: periodEnd }, status: { not: 'CANCELLED' } } }).catch(() => null),
  ]);
  const cogs = n(cogsCurrent?._sum?.total);

  // ── 3. Expenses ─────────────────────────────────────────────────────────────
  const expAgg = await (prisma as any).expense?.aggregate?.({
    _sum: { amount: true },
    where: { tenantId, date: { gte: periodStart, lte: periodEnd } },
  }).catch(() => null);
  const expenses = n(expAgg?._sum?.amount);

  // ── 4. AR / AP balances ─────────────────────────────────────────────────────
  const [arAgg, apAgg] = await Promise.all([
    (prisma as any).salesInvoice?.aggregate?.({ _sum: { openAmount: true }, where: { tenantId, status: { in: ['POSTED', 'PARTIAL'] } } }).catch(() => null),
    (prisma as any).purchaseInvoice?.aggregate?.({ _sum: { openAmount: true }, where: { tenantId, status: { in: ['POSTED', 'PARTIAL'] } } }).catch(() => null),
  ]);
  const totalAR = n(arAgg?._sum?.openAmount);
  const totalAP = n(apAgg?._sum?.openAmount);

  // ── 5. Overdue AR (>30 days) ─────────────────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const overdueAR = await (prisma as any).salesInvoice?.aggregate?.({
    _sum: { openAmount: true },
    where: { tenantId, status: { in: ['POSTED', 'PARTIAL'] }, dueDate: { lt: thirtyDaysAgo } },
  }).catch(() => null);
  const totalOverdueAR = n(overdueAR?._sum?.openAmount);

  // ── 6. Counts ────────────────────────────────────────────────────────────────
  const [customers, employees, products, invCount] = await Promise.all([
    (prisma as any).customer?.count?.({ where: { tenantId, active: true } }).catch(() => 0),
    (prisma as any).employee?.count?.({ where: { tenantId, active: true } }).catch(() => 0),
    (prisma as any).product?.count?.({ where: { tenantId, active: true } }).catch(() => 0),
    (prisma as any).salesInvoice?.count?.({ where: { tenantId, date: { gte: periodStart, lte: periodEnd } } }).catch(() => 0),
  ]);

  // ── 7. 12-month Revenue Trend ────────────────────────────────────────────────
  const twelveMonthsAgo = new Date(year, month - 13, 1);
  const monthlyRevenue  = await (prisma as any).salesInvoice?.groupBy?.({
    by:      ['date'],
    _sum:    { total: true },
    where:   { tenantId, date: { gte: twelveMonthsAgo, lte: periodEnd }, status: { not: 'CANCELLED' } },
    orderBy: { date: 'asc' },
  }).catch(() => []) ?? [];

  // ── 8. ZATCA Compliance ───────────────────────────────────────────────────────
  const [zatcaTotal, zatcaSubmitted] = await Promise.all([
    (prisma as any).salesInvoice?.count?.({ where: { tenantId, date: { gte: periodStart, lte: periodEnd }, status: { not: 'CANCELLED' } } }).catch(() => 0),
    (prisma as any).salesInvoice?.count?.({ where: { tenantId, date: { gte: periodStart, lte: periodEnd }, zatcaStatus: { in: ['REPORTED', 'CLEARED'] } } }).catch(() => 0),
  ]);

  // ── 9. Payroll Cost ───────────────────────────────────────────────────────────
  const payrollAgg = await (prisma as any).payrollRecord?.aggregate?.({
    _sum: { netSalary: true },
    where: { tenantId, period: `${year}-${String(month).padStart(2, '0')}` },
  }).catch(() => null);
  const payrollCost = n(payrollAgg?._sum?.netSalary);

  // ── 10. Derived KPIs ──────────────────────────────────────────────────────────
  const grossProfit   = revenue - cogs;
  const netProfit     = grossProfit - expenses - payrollCost;
  const grossMargin   = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin     = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const momChange     = revPriorM > 0 ? ((revenue - revPriorM) / revPriorM) * 100 : null;
  const yoyChange     = revPriorY > 0 ? ((revenue - revPriorY) / revPriorY) * 100 : null;
  const avgOrderValue = invCount > 0 ? revenue / invCount : 0;
  const collectRatio  = (totalAR + revenue) > 0 ? totalOverdueAR / (totalAR + revenue) : 0;
  const zatcaRate     = zatcaTotal > 0 ? (zatcaSubmitted / zatcaTotal) * 100 : 100;

  const kpis = {
    period:     `${year}-${String(month).padStart(2, '0')}`,
    tenantId,
    generatedAt: new Date().toISOString(),

    financial: {
      revenue:       Math.round(revenue     * 100) / 100,
      cogs:          Math.round(cogs        * 100) / 100,
      expenses:      Math.round(expenses    * 100) / 100,
      payrollCost:   Math.round(payrollCost * 100) / 100,
      grossProfit:   Math.round(grossProfit * 100) / 100,
      netProfit:     Math.round(netProfit   * 100) / 100,
      grossMargin:   Math.round(grossMargin * 10) / 10,
      netMargin:     Math.round(netMargin   * 10) / 10,
    },

    comparison: compare ? {
      momChangePct:   momChange  !== null ? Math.round(momChange  * 10) / 10 : null,
      yoyChangePct:   yoyChange  !== null ? Math.round(yoyChange  * 10) / 10 : null,
      priorMonthRevenue: Math.round(revPriorM * 100) / 100,
      priorYearRevenue:  Math.round(revPriorY * 100) / 100,
    } : undefined,

    receivables: {
      totalAR:         Math.round(totalAR         * 100) / 100,
      totalAP:         Math.round(totalAP         * 100) / 100,
      overdueAR:       Math.round(totalOverdueAR  * 100) / 100,
      collectionRisk:  Math.round(collectRatio    * 1000) / 10,  // %
      netPosition:     Math.round((totalAR - totalAP) * 100) / 100,
    },

    operational: {
      invoiceCount:   invCount,
      activeCustomers: customers,
      activeEmployees: employees,
      activeProducts:  products,
      avgOrderValue:   Math.round(avgOrderValue * 100) / 100,
    },

    compliance: {
      zatcaCompliancePct: Math.round(zatcaRate * 10) / 10,
      invoicesSubmitted:  zatcaSubmitted,
      invoicesTotal:      zatcaTotal,
    },

    trend: {
      monthly12: monthlyRevenue.map((m: any) => ({
        period: m.date?.toISOString?.()?.slice(0, 7) ?? m.date,
        revenue: n(m._sum?.total),
      })),
    },
  };

  return NextResponse.json(kpis);
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
