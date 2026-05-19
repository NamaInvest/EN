/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CFO Dashboard API — `/api/finance/cfo-dashboard`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  يجمع KPIs المالية الرئيسية في استدعاء واحد لتسريع تحميل الـ dashboard.
 *
 *  Returns:
 *   - kpis: currentRatio, quickRatio, netProfitMargin, dso, totalAR, totalAP
 *   - revenueMtd/Ytd + expensesMtd/Ytd + momChange
 *   - profit (gross + margin)
 *   - cash: total + per-treasury breakdown
 *   - arAging / apAging (4 buckets)
 *   - topCustomers / topVendors (Top 5)
 *   - revenueTrend12m (12 شهر للرسم البياني)
 *
 *  Security (Gate 1):
 *   - RBAC عبر withRoute: admin / owner / cfo / accountant
 *   - Rate-limit: FINANCIAL (30 req/min)
 *   - Tenant isolation عبر getPrisma()
 *
 *  Performance:
 *   - كل الاستعلامات بالتوازي عبر Promise.all
 *   - بدون N+1 (نستخدم groupBy + IN clauses)
 *
 *  @see prisma/schema.prisma — SalesInvoice, PurchaseInvoice, Treasury, Customer
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';

import { withRoute, type RouteContext } from '@/lib/api/with-route';
import { n } from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.cfo-dashboard' });

const ALLOWED_ROLES = ['admin', 'owner', 'cfo', 'accountant'] as const;

/**
 * يحسب إجمالي مبيعات في نافذة زمنية معينة.
 * يستثني الفواتير الملغاة.
 */
async function sumSalesInRange(prisma: any, from: Date, to: Date): Promise<number> {
  try {
    const agg = await prisma.salesInvoice.aggregate({
      where: {
        date: { gte: from, lte: to },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });
    return Number(agg._sum?.total ?? 0);
  } catch {
    return 0;
  }
}

/**
 * يحسب إجمالي مشتريات في نافذة زمنية.
 */
async function sumPurchasesInRange(prisma: any, from: Date, to: Date): Promise<number> {
  try {
    const agg = await prisma.purchaseInvoice.aggregate({
      where: {
        date: { gte: from, lte: to },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });
    return Number(agg._sum?.total ?? 0);
  } catch {
    return 0;
  }
}

/**
 * يحسب AR aging buckets على فواتير المبيعات غير المدفوعة.
 */
async function calcArAging(prisma: any) {
  const buckets = { bucket0_30: 0, bucket31_60: 0, bucket61_90: 0, bucket90Plus: 0, total: 0 };
  try {
    const invs = await prisma.salesInvoice.findMany({
      where: { status: { not: 'CANCELLED' }, remaining: { gt: 0 } },
      select: { date: true, remaining: true },
      take: 5000,
    });
    const now = Date.now();
    for (const inv of invs) {
      const days = (now - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24);
      const amt = n(inv.remaining);
      buckets.total += amt;
      if (days <= 30) buckets.bucket0_30 += amt;
      else if (days <= 60) buckets.bucket31_60 += amt;
      else if (days <= 90) buckets.bucket61_90 += amt;
      else buckets.bucket90Plus += amt;
    }
  } catch { /* keep zeros */ }
  return buckets;
}

/**
 * AP aging على فواتير الشراء.
 */
async function calcApAging(prisma: any) {
  const buckets = { bucket0_30: 0, bucket31_60: 0, bucket61_90: 0, bucket90Plus: 0, total: 0 };
  try {
    const invs = await prisma.purchaseInvoice.findMany({
      where: { status: { not: 'CANCELLED' }, remaining: { gt: 0 } },
      select: { date: true, remaining: true },
      take: 5000,
    });
    const now = Date.now();
    for (const inv of invs) {
      const days = (now - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24);
      const amt = n(inv.remaining);
      buckets.total += amt;
      if (days <= 30) buckets.bucket0_30 += amt;
      else if (days <= 60) buckets.bucket31_60 += amt;
      else if (days <= 90) buckets.bucket61_90 += amt;
      else buckets.bucket90Plus += amt;
    }
  } catch { /* keep zeros */ }
  return buckets;
}

/**
 * أعلى 5 عملاء بالإيرادات في الفترة.
 */
async function topCustomers(prisma: any, from: Date, to: Date) {
  try {
    const grouped = await prisma.salesInvoice.groupBy({
      by: ['customerId'],
      where: { date: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });
    const ids = grouped.map((g: any) => g.customerId).filter(Boolean);
    if (ids.length === 0) return [];
    const customers = await prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(customers.map((c: any) => [c.id, c.name]));
    return grouped.map((g: any) => ({
      id: g.customerId,
      name: (nameMap.get(g.customerId) as string) || `#${g.customerId}`,
      revenue: n(g._sum?.total),
    }));
  } catch {
    return [];
  }
}

/**
 * أعلى 5 موردين بالإنفاق في الفترة.
 */
async function topVendors(prisma: any, from: Date, to: Date) {
  try {
    const grouped = await prisma.purchaseInvoice.groupBy({
      by: ['customerId'],
      where: { date: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });
    const ids = grouped.map((g: any) => g.customerId).filter(Boolean);
    if (ids.length === 0) return [];
    const vendors = await prisma.customer.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(vendors.map((v: any) => [v.id, v.name]));
    return grouped.map((g: any) => ({
      id: g.customerId,
      name: (nameMap.get(g.customerId) as string) || `#${g.customerId}`,
      spend: n(g._sum?.total),
    }));
  } catch {
    return [];
  }
}

/**
 * Cash position من جدول Treasury (in - out).
 */
async function cashPosition(prisma: any): Promise<number> {
  try {
    const inAgg = await prisma.treasury.aggregate({
      where: { type: 'in' },
      _sum: { amount: true },
    });
    const outAgg = await prisma.treasury.aggregate({
      where: { type: 'out' },
      _sum: { amount: true },
    });
    return n(inAgg._sum?.amount) - n(outAgg._sum?.amount);
  } catch {
    return 0;
  }
}

/**
 * Revenue trend — آخر 12 شهر.
 */
async function revenueTrend12m(prisma: any) {
  const trend: Array<{ month: string; value: number }> = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const value = await sumSalesInRange(prisma, monthStart, monthEnd);
    trend.push({ month: monthStart.toISOString().slice(0, 7), value });
  }
  return trend;
}

/**
 * Current Ratio + Quick Ratio (مقاييس السيولة).
 */
async function liquidityRatios(prisma: any, currentCash: number, ar: number) {
  let totalInventory = 0;
  try {
    const products = await prisma.product.findMany({
      take: 5000,
      select: { currentStock: true, buyPrice: true },
    });
    totalInventory = products.reduce(
      (sum: number, p: any) => sum + n(p.currentStock) * n(p.buyPrice),
      0,
    );
  } catch { /* zero */ }

  let totalAP = 0;
  try {
    const suppliers = await prisma.customer.findMany({
      where: { type: 1 },
      select: { balance: true },
      take: 5000,
    });
    totalAP = suppliers.reduce((sum: number, s: any) => sum + n(s.balance), 0);
  } catch { /* zero */ }

  const currentAssets = currentCash + ar + totalInventory;
  const currentLiab = totalAP > 0 ? totalAP : 1; // avoid div0
  const currentRatio = currentAssets / currentLiab;
  const quickRatio = (currentAssets - totalInventory) / currentLiab;

  return {
    currentRatio: Math.round(currentRatio * 100) / 100,
    quickRatio: Math.round(quickRatio * 100) / 100,
    totalAP: Math.round(totalAP * 100) / 100,
    totalInventory: Math.round(totalInventory * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GET handler
// ═══════════════════════════════════════════════════════════════════════════

async function handleGet(ctx: RouteContext): Promise<NextResponse> {
  const { prisma, auth, requestId } = ctx;
  const startedAt = Date.now();

  // النوافذ الزمنية
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  try {
    // كل الاستعلامات بالتوازي
    const [
      cash,
      revenueMtd,
      revenueYtd,
      revenueLastMonth,
      expensesMtd,
      expensesYtd,
      expensesLastMonth,
      arAging,
      apAging,
      top5Customers,
      top5Vendors,
      trend,
    ] = await Promise.all([
      cashPosition(prisma),
      sumSalesInRange(prisma, monthStart, now),
      sumSalesInRange(prisma, yearStart, now),
      sumSalesInRange(prisma, lastMonthStart, lastMonthEnd),
      sumPurchasesInRange(prisma, monthStart, now),
      sumPurchasesInRange(prisma, yearStart, now),
      sumPurchasesInRange(prisma, lastMonthStart, lastMonthEnd),
      calcArAging(prisma),
      calcApAging(prisma),
      topCustomers(prisma, yearStart, now),
      topVendors(prisma, yearStart, now),
      revenueTrend12m(prisma),
    ]);

    // KPIs المشتقة
    const momRevChange = revenueLastMonth > 0 ? ((revenueMtd - revenueLastMonth) / revenueLastMonth) * 100 : 0;
    const momExpChange = expensesLastMonth > 0 ? ((expensesMtd - expensesLastMonth) / expensesLastMonth) * 100 : 0;
    const grossProfit = revenueMtd - expensesMtd;
    const margin = revenueMtd > 0 ? (grossProfit / revenueMtd) * 100 : 0;
    const netProfitMargin = revenueYtd > 0 ? ((revenueYtd - expensesYtd) / revenueYtd) * 100 : 0;
    const dso = revenueYtd > 0 ? (arAging.total / revenueYtd) * 365 : 0;

    // Liquidity ratios
    const liquidity = await liquidityRatios(prisma, cash, arAging.total);

    const result = {
      asOf: now.toISOString(),
      kpis: {
        currentRatio: liquidity.currentRatio,
        quickRatio: liquidity.quickRatio,
        netProfitMargin: Math.round(netProfitMargin * 10) / 10,
        dso: Math.round(dso),
        totalAR: Math.round(arAging.total * 100) / 100,
        totalAP: Math.round(liquidity.totalAP * 100) / 100,
        totalInventory: liquidity.totalInventory,
        totalCash: Math.round(cash * 100) / 100,
      },
      revenue: {
        mtd: Math.round(revenueMtd * 100) / 100,
        ytd: Math.round(revenueYtd * 100) / 100,
        lastMonth: Math.round(revenueLastMonth * 100) / 100,
        momChange: Math.round(momRevChange * 10) / 10,
      },
      expenses: {
        mtd: Math.round(expensesMtd * 100) / 100,
        ytd: Math.round(expensesYtd * 100) / 100,
        lastMonth: Math.round(expensesLastMonth * 100) / 100,
        momChange: Math.round(momExpChange * 10) / 10,
      },
      profit: {
        gross: Math.round(grossProfit * 100) / 100,
        margin: Math.round(margin * 10) / 10,
      },
      arAging,
      apAging,
      topCustomers: top5Customers,
      topVendors: top5Vendors,
      revenueTrend: trend,
    };

    log.info('CFO dashboard fetched', {
      requestId,
      userId: auth.userId,
      tenantId: auth.tenantId,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل غير متوقع';
    log.error('CFO dashboard failed', { requestId, error: msg });
    return NextResponse.json({ error: 'فشل جلب البيانات', detail: msg }, { status: 500 });
  }
}

export const GET = withRoute(handleGet, {
  rateLimit: 'FINANCIAL',
  requireAuth: true,
  roles: [...ALLOWED_ROLES],
  tenantRequired: true,
});
