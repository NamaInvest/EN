/**
 * Financial Health Dashboard API
 * GET /api/finance/financial-health?tenantId=X&period=YYYY-MM
 *
 * لوحة قيادة مالية شاملة تجمع:
 *   1. نسب السيولة (Current Ratio, Quick Ratio)
 *   2. نسب الربحية (Gross Margin, Net Margin, ROE, ROA)
 *   3. نسب الكفاءة (Inventory Turnover, DSO, DPO)
 *   4. نسب الرفع المالي (D/E, Interest Coverage)
 *   5. مؤشر Altman Z-Score تقريبي
 *   6. توصيات تلقائية
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.financial-health' });

type RatioStatus = 'EXCELLENT' | 'GOOD' | 'WATCH' | 'CRITICAL';

function classify(value: number, excellent: number, good: number, watch: number, higher = true): RatioStatus {
  if (higher) {
    if (value >= excellent)  return 'EXCELLENT';
    if (value >= good)       return 'GOOD';
    if (value >= watch)      return 'WATCH';
    return 'CRITICAL';
  } else {
    // Lower is better (e.g., D/E ratio)
    if (value <= excellent)  return 'EXCELLENT';
    if (value <= good)       return 'GOOD';
    if (value <= watch)      return 'WATCH';
    return 'CRITICAL';
  }
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const period   = searchParams.get('period');
  const now      = new Date();
  const year     = period ? parseInt(period.split('-')[0]) : now.getFullYear();
  const month    = period ? parseInt(period.split('-')[1]) : now.getMonth() + 1;
  const from     = new Date(year, 0, 1);
  const to       = new Date(year, month - 1, new Date(year, month, 0).getDate(), 23, 59, 59);

  const p = getPrisma(req as any) as any;

  // ── Fetch GL aggregates ────────────────────────────────────────────────────
  // Revenue: accounts 4000-4999
  const [revenue, cogs, expenses, currentAssets, nonCurrentAssets,
         currentLiab, nonCurrentLiab, equity, receivables, payables,
         inventory, cash] = await Promise.all([
    // Revenue (credit balance 4xxx)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'CREDIT', account: { code: { gte: '4000', lt: '5000' } }, journalEntry: { date: { gte: from, lte: to }, status: 'POSTED' } } }).catch(() => null),
    // COGS (debit 5xxx)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '5000', lt: '6000' } }, journalEntry: { date: { gte: from, lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Operating Expenses (debit 6xxx)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '6000', lt: '7000' } }, journalEntry: { date: { gte: from, lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Current Assets (1000-1499)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '1000', lt: '1500' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Non-Current Assets (1500-1999)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '1500', lt: '2000' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Current Liabilities (2000-2499)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'CREDIT', account: { code: { gte: '2000', lt: '2500' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Non-Current Liabilities (2500-2999)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'CREDIT', account: { code: { gte: '2500', lt: '3000' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Equity (3xxx)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'CREDIT', account: { code: { gte: '3000', lt: '4000' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Receivables (1100-1199)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '1100', lt: '1200' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Payables (2100-2199)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'CREDIT', account: { code: { gte: '2100', lt: '2200' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Inventory (1200-1299)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '1200', lt: '1300' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
    // Cash (1000-1099)
    p.journalEntryLine?.aggregate?.({ _sum: { amount: true }, where: { tenantId, side: 'DEBIT', account: { code: { gte: '1000', lt: '1100' } }, journalEntry: { date: { lte: to }, status: 'POSTED' } } }).catch(() => null),
  ]);

  const n = (v: any) => Math.max(0, Number(v?._sum?.amount ?? 0));
  const safe = (num: number, den: number, decimals = 2) => den === 0 ? 0 : Math.round((num / den) * Math.pow(10, decimals)) / Math.pow(10, decimals);

  const R  = n(revenue);
  const C  = n(cogs);
  const E  = n(expenses);
  const CA = n(currentAssets);
  const NCA= n(nonCurrentAssets);
  const CL = n(currentLiab);
  const NCL= n(nonCurrentLiab);
  const EQ = n(equity);
  const AR = n(receivables);
  const AP = n(payables);
  const INV= n(inventory);
  const CASH = n(cash);

  const grossProfit = R - C;
  const netProfit   = grossProfit - E;
  const totalAssets = CA + NCA;
  const totalLiab   = CL + NCL;

  // ── Liquidity ──────────────────────────────────────────────────────────────
  const currentRatio = safe(CA, CL);
  const quickRatio   = safe(CA - INV, CL);
  const cashRatio    = safe(CASH, CL);

  // ── Profitability ──────────────────────────────────────────────────────────
  const grossMargin  = safe(grossProfit, R, 4);
  const netMargin    = safe(netProfit,   R, 4);
  const roe          = safe(netProfit, EQ, 4);
  const roa          = safe(netProfit, totalAssets, 4);

  // ── Efficiency ──────────────────────────────────────────────────────────────
  const inventoryTurnover = safe(C, INV);
  const dso = safe(AR * (month * 30), R);    // Days Sales Outstanding
  const dpo = safe(AP * (month * 30), C);    // Days Payable Outstanding

  // ── Leverage ───────────────────────────────────────────────────────────────
  const debtToEquity  = safe(totalLiab, EQ);
  const debtToAssets  = safe(totalLiab, totalAssets, 4);

  // ── Simplified Altman Z-Score (for private companies) ────────────────────
  // Z' = 0.717*X1 + 0.847*X2 + 3.107*X3 + 0.420*X4 + 0.998*X5
  const x1 = safe(CA - CL, totalAssets, 4);           // Working capital / Total assets
  const x2 = safe(EQ * 0.1, totalAssets, 4);           // Retained earnings / Total assets (approx)
  const x3 = safe(netProfit, totalAssets, 4);           // EBIT / Total assets
  const x4 = safe(EQ, totalLiab, 4);                   // BV Equity / Total liabilities
  const x5 = safe(R, totalAssets, 4);                  // Revenue / Total assets
  const zScore = Math.round((0.717*x1 + 0.847*x2 + 3.107*x3 + 0.420*x4 + 0.998*x5) * 100) / 100;
  const zStatus: RatioStatus = zScore > 2.9 ? 'EXCELLENT' : zScore > 1.23 ? 'WATCH' : 'CRITICAL';

  // ── Recommendations ────────────────────────────────────────────────────────
  const recommendations: string[] = [];
  if (currentRatio < 1.5) recommendations.push('⚠️ نسبة السيولة الحالية منخفضة — راجع التزاماتك قصيرة الأجل');
  if (netMargin < 0.05)   recommendations.push('⚠️ هامش الربح الصافي منخفض — راجع هيكل التكاليف');
  if (dso > 60)           recommendations.push('⚠️ متوسط تحصيل الديون مرتفع — فعّل سياسة التحصيل');
  if (debtToEquity > 2)   recommendations.push('⚠️ نسبة الدين إلى حقوق الملكية مرتفعة — قلّص الاقتراض');
  if (inventoryTurnover < 3) recommendations.push('⚠️ دوران المخزون بطيء — راجع مستويات الطلب');
  if (currentRatio > 3)   recommendations.push('💡 سيولة عالية — فكّر في استثمار الفائض');
  if (grossMargin > 0.40) recommendations.push('✅ هامش ربح إجمالي ممتاز — حافظ على التسعير');

  log.info('Financial health computed', { tenantId, period, revenue: Math.round(R), netProfit: Math.round(netProfit) });

  return NextResponse.json({
    tenantId,
    period:  `${year}-${String(month).padStart(2, '0')}`,
    asOf:    to.toISOString().split('T')[0],
    income:  {
      revenue:     Math.round(R),
      cogs:        Math.round(C),
      grossProfit: Math.round(grossProfit),
      expenses:    Math.round(E),
      netProfit:   Math.round(netProfit),
    },
    balanceSheet: {
      totalAssets:     Math.round(totalAssets),
      currentAssets:   Math.round(CA),
      totalLiabilities:Math.round(totalLiab),
      equity:          Math.round(EQ),
    },
    ratios: {
      liquidity: {
        currentRatio:  { value: currentRatio,  status: classify(currentRatio, 2, 1.5, 1) },
        quickRatio:    { value: quickRatio,    status: classify(quickRatio,   1.5, 1,   0.7) },
        cashRatio:     { value: cashRatio,     status: classify(cashRatio,    1, 0.5,  0.2) },
      },
      profitability: {
        grossMargin:   { value: `${Math.round(grossMargin * 1000) / 10}%`, status: classify(grossMargin,  0.4, 0.25, 0.10) },
        netMargin:     { value: `${Math.round(netMargin   * 1000) / 10}%`, status: classify(netMargin,    0.15, 0.05, 0) },
        roe:           { value: `${Math.round(roe         * 1000) / 10}%`, status: classify(roe,          0.15, 0.08, 0) },
        roa:           { value: `${Math.round(roa         * 1000) / 10}%`, status: classify(roa,          0.10, 0.05, 0) },
      },
      efficiency: {
        inventoryTurnover: { value: inventoryTurnover, status: classify(inventoryTurnover, 8, 4, 2) },
        dso:               { value: `${Math.round(dso)} days`,  status: classify(dso, 30, 45, 60, false) },
        dpo:               { value: `${Math.round(dpo)} days`,  status: classify(dpo, 45, 30, 20) },
      },
      leverage: {
        debtToEquity:  { value: debtToEquity, status: classify(debtToEquity, 0.5, 1, 2, false) },
        debtToAssets:  { value: debtToAssets, status: classify(debtToAssets, 0.3, 0.5, 0.7, false) },
      },
      altmanZ: { value: zScore, status: zStatus, interpretation: zScore > 2.9 ? 'منطقة آمنة' : zScore > 1.23 ? 'منطقة رمادية' : 'خطر إفلاس مرتفع' },
    },
    recommendations,
    generatedAt: new Date().toISOString(),
  });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
