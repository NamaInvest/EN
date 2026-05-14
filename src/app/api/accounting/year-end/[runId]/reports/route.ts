/**
 * Year-End Close Reports
 * GET /api/accounting/year-end/[runId]/reports
 *
 * يُولِّد تقارير نهاية السنة الكاملة:
 *   1. قائمة الدخل السنوية (Annual P&L)
 *   2. الميزانية العمومية (Balance Sheet as of year-end)
 *   3. جدول حركة حقوق الملكية (Changes in Equity)
 *   4. قائمة التدفقات النقدية (Statement of Cash Flows — IAS 7)
 *   5. ملخص التدقيق (Audit Summary: journals, manual overrides, FX)
 *   6. تحليل الضريبة والزكاة (Zakat/Tax Provision)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { FinancialStatementsEngine } from '@/lib/financial-statements-engine';
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'year-end.reports' });

async function _GET(
  req:        NextRequest,
  nextContext: { params: Promise<{ runId: string }> | { runId: string } },
) {
  const rawParams = await (nextContext?.params ?? {});
  const runId     = (rawParams as any).runId ?? '0';
  const { searchParams } = new URL(req.url);
  const tenantId     = searchParams.get('tenantId') ?? 'default';
  const reportType   = searchParams.get('type') ?? 'ALL';  // P&L | BS | CF | EQUITY | AUDIT | ALL

  const prismaClient = getPrisma(req as any);
  const prisma = prismaClient as unknown as PrismaClient;
  const fsEngine = new FinancialStatementsEngine(prisma);

  // Get the year-end close run
  const closeRun = await (prisma as any).yearEndCloseRun?.findUnique?.({
    where: { id: parseInt(runId) },
  }).catch(() => null);

  if (!closeRun) {
    return NextResponse.json({ error: `Year-end close run ${runId} not found` }, { status: 404 });
  }

  const year      = closeRun.year;
  const yearStart = new Date(year, 0, 1);
  const yearEnd   = new Date(year, 11, 31, 23, 59, 59);

  // ── 1. P&L (Income Statement) ────────────────────────────────────────────────
  let incomeStatement = null;
  if (reportType === 'ALL' || reportType === 'P&L') {
    try {
      incomeStatement = await fsEngine.generateIncomeStatement(
        tenantId,
        yearStart,
        yearEnd,
        new Date(year - 1, 0, 1),
        new Date(year - 1, 11, 31, 23, 59, 59),
      );
    } catch (e: any) {
      log.warn('Could not generate income statement', { error: e.message });
    }
  }

  // ── 2. Balance Sheet ──────────────────────────────────────────────────────────
  let balanceSheet = null;
  if (reportType === 'ALL' || reportType === 'BS') {
    try {
      balanceSheet = await fsEngine.generateBalanceSheet(
        tenantId,
        yearEnd,
        new Date(year - 1, 11, 31, 23, 59, 59),
      );
    } catch (e: any) {
      log.warn('Could not generate balance sheet', { error: e.message });
    }
  }

  // ── 3. Cash Flow (IAS 7) ─────────────────────────────────────────────────────
  let cashFlow = null;
  if (reportType === 'ALL' || reportType === 'CF') {
    try {
      cashFlow = await fsEngine.generateIndirectCashFlow(
        tenantId,
        yearStart,
        yearEnd,
      );
    } catch (e: any) {
      log.warn('Could not generate cash flow', { error: e.message });
    }
  }

  // ── 4. Changes in Equity ──────────────────────────────────────────────────────
  let equityStatement = null;
  if (reportType === 'ALL' || reportType === 'EQUITY') {
    equityStatement = await generateEquityStatement(prisma as any, tenantId, year, yearStart, yearEnd);
  }

  // ── 5. Audit Summary ─────────────────────────────────────────────────────────
  let auditSummary = null;
  if (reportType === 'ALL' || reportType === 'AUDIT') {
    auditSummary = await generateAuditSummary(prisma as any, tenantId, yearStart, yearEnd);
  }

  // ── 6. Zakat / Tax Provision ─────────────────────────────────────────────────
  let zakatProvision = null;
  if (reportType === 'ALL' || reportType === 'ZAKAT') {
    zakatProvision = await generateZakatProvision(prisma as any, tenantId, yearStart, yearEnd, incomeStatement);
  }

  log.info('Year-end reports generated', {
    tenantId, year, runId, reportType,
    hasIS: !!incomeStatement, hasBS: !!balanceSheet, hasCF: !!cashFlow,
  });

  return NextResponse.json({
    runId:           parseInt(runId),
    tenantId,
    year,
    reportType,
    generatedAt:     new Date().toISOString(),
    incomeStatement,
    balanceSheet,
    cashFlow,
    equityStatement,
    auditSummary,
    zakatProvision,
  });
}

// ─── Equity Statement ─────────────────────────────────────────────────────────

async function generateEquityStatement(
  prisma: any, tenantId: string, year: number, yearStart: Date, yearEnd: Date,
) {
  // Prior year balance
  const priorYearEnd = new Date(year - 1, 11, 31, 23, 59, 59);

  const [equityAccounts, dividends, netProfit] = await Promise.all([
    prisma.account?.findMany?.({
      where: { tenantId, code: { startsWith: '3' } },
      select: { id: true, code: true, name: true, nameEn: true },
    }).catch(() => []) ?? [],

    // Dividends distributed
    prisma.journalLine?.aggregate?.({
      _sum: { amount: true },
      where: {
        tenantId,
        account: { code: { startsWith: '3900' } },
        side:    'DEBIT',
        journal: { date: { gte: yearStart, lte: yearEnd }, status: 'POSTED' },
      },
    }).catch(() => null),

    // Net profit from income summary account
    prisma.journalLine?.aggregate?.({
      _sum: { amount: true },
      where: {
        tenantId,
        account: { code: { in: ['4000', '3800', '4999'] } },
        side:    'CREDIT',
        journal: { date: { gte: yearStart, lte: yearEnd }, status: 'POSTED' },
      },
    }).catch(() => null),
  ]);

  return {
    year,
    openingBalance: 0,  // would come from prior year closing balance
    netProfit:      Number(netProfit?._sum?.amount ?? 0),
    dividends:      Number(dividends?._sum?.amount ?? 0),
    otherComprehensiveIncome: 0,  // FX translation differences from consolidation
    closingBalance: 0,
    note:           'يُستكمَل من ميزان المراجعة الافتتاحي للسنة السابقة',
  };
}

// ─── Audit Summary ────────────────────────────────────────────────────────────

async function generateAuditSummary(
  prisma: any, tenantId: string, yearStart: Date, yearEnd: Date,
) {
  const [
    totalJournals,
    manualJournals,
    reversalJournals,
    fxJournals,
    largeJournals,
    auditLogs,
  ] = await Promise.all([
    prisma.journalEntry?.count?.({ where: { tenantId, date: { gte: yearStart, lte: yearEnd }, status: 'POSTED' } }).catch(() => 0),
    prisma.journalEntry?.count?.({ where: { tenantId, date: { gte: yearStart, lte: yearEnd }, status: 'POSTED', type: 'MANUAL' } }).catch(() => 0),
    prisma.journalEntry?.count?.({ where: { tenantId, date: { gte: yearStart, lte: yearEnd }, isReversal: true } }).catch(() => 0),
    prisma.journalEntry?.count?.({ where: { tenantId, date: { gte: yearStart, lte: yearEnd }, reference: { startsWith: 'FX-' } } }).catch(() => 0),
    prisma.journalEntry?.count?.({ where: { tenantId, date: { gte: yearStart, lte: yearEnd }, totalDebit: { gte: 500_000 } } }).catch(() => 0),
    prisma.auditLog?.count?.({ where: { tenantId, createdAt: { gte: yearStart, lte: yearEnd }, action: 'DELETE', tableName: { in: ['journalEntry', 'salesInvoice'] } } }).catch(() => 0),
  ]);

  return {
    totalPostedJournals:  totalJournals,
    manualJournals,
    reversalJournals,
    fxJournals,
    largeJournals,       // > 500K SAR
    highRiskDeletes:     auditLogs,
    automationRate:      totalJournals > 0
      ? Math.round(((totalJournals - manualJournals) / totalJournals) * 100)
      : 0,
  };
}

// ─── Zakat Provision ─────────────────────────────────────────────────────────

async function generateZakatProvision(
  prisma: any, tenantId: string, yearStart: Date, yearEnd: Date, is: any,
) {
  // Simplified Zakat calculation (Saudi: 2.5% of Zakat Base)
  // Zakat base = max(Revenue × 0.02, Net Assets × 0.025)
  const netProfit      = Number(is?.netProfit ?? 0);
  const taxableIncome  = netProfit; // simplified
  const zakatRate      = 0.025;
  const provisionalZakat = Math.max(0, taxableIncome * zakatRate);

  // VAT (15% on B2B invoices — already collected, just reconcile)
  const vatCollected = await prisma.salesInvoice?.aggregate?.({
    _sum: { vatAmount: true },
    where: { tenantId, date: { gte: yearStart, lte: yearEnd }, status: { not: 'CANCELLED' } },
  }).catch(() => null);

  const vatPaid = await prisma.purchaseInvoice?.aggregate?.({
    _sum: { vatAmount: true },
    where: { tenantId, date: { gte: yearStart, lte: yearEnd }, status: { not: 'CANCELLED' } },
  }).catch(() => null);

  const totalVATCollected = Number(vatCollected?._sum?.vatAmount ?? 0);
  const totalVATPaid      = Number(vatPaid?._sum?.vatAmount ?? 0);
  const netVATPayable     = totalVATCollected - totalVATPaid;

  return {
    year:               yearEnd.getFullYear(),
    taxableIncome:      Math.round(taxableIncome    * 100) / 100,
    zakatRate:          `${zakatRate * 100}%`,
    provisionalZakat:   Math.round(provisionalZakat * 100) / 100,
    vatCollected:       Math.round(totalVATCollected * 100) / 100,
    vatPaid:            Math.round(totalVATPaid      * 100) / 100,
    netVATPayable:      Math.round(netVATPayable     * 100) / 100,
    note:               'تقديري — يلزم مراجعة مستشار الضرائب قبل التسجيل في Fatoorah',
  };
}

export const GET = withRoute(
  async ({ req }, context) => _GET(req as any, context as any),
  { rateLimit: 'DEFAULT' },
);
