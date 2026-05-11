/**
 * Cash Flow Forecast Engine (B.6)
 * ══════════════════════════════════════════════════════
 * 13-week rolling cash flow forecast
 * Sources:
 *   Inflows:  open AR invoices (estimated collection by due date)
 *   Outflows: open AP invoices + payroll + committed expenses
 * Output: weekly cash position with opening/closing balance
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cash-flow-forecast' });

export interface WeeklyForecast {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  openingBalance: number;
  inflows: {
    arCollections: number;
    otherInflows: number;
    total: number;
  };
  outflows: {
    apPayments: number;
    payroll: number;
    expenses: number;
    total: number;
  };
  netCashFlow: number;
  closingBalance: number;
  isNegative: boolean;
}

export interface CashFlowForecast {
  generatedAt: Date;
  currency: string;
  currentBalance: number;
  weeks: WeeklyForecast[];
  summary: {
    totalInflows: number;
    totalOutflows: number;
    netCashFlow: number;
    lowestBalance: number;
    lowestBalanceWeek: string;
    cashShortfallWeeks: string[];
  };
}

export class CashFlowForecastEngine {

  static async generate(params: {
    weeks?: number;           // default 13
    currentBalance?: number;
    currency?: string;
    arCollectionRate?: number; // % of AR expected to collect (default 0.85)
  } = {}): Promise<CashFlowForecast> {

    const {
      weeks = 13,
      currency = 'SAR',
      arCollectionRate = 0.85,
    } = params;

    const now = new Date();

    // Get current bank balance from Treasury model
    let currentBalance = params.currentBalance ?? 0;
    if (!params.currentBalance) {
      const treasuryAgg = await prisma.treasury.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, type: 'in' },
      }).catch(() => ({ _sum: { amount: 0 } }));

      const treasuryOut = await prisma.treasury.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, type: 'out' },
      }).catch(() => ({ _sum: { amount: 0 } }));

      currentBalance = Number(treasuryAgg._sum?.amount || 0) - Number(treasuryOut._sum?.amount || 0);
    }

    // Load open AR invoices (future collections)
    const arInvoices = await prisma.salesInvoice.findMany({
      where: { remaining: { gt: 0 }, deletedAt: null },
      select: { date: true, remaining: true },
      orderBy: { date: 'asc' },
      take: 1000,
    }).catch(() => [] as any[]);

    // Load open AP invoices (future payments)
    const apInvoices = await prisma.purchaseInvoice.findMany({
      where: { remaining: { gt: 0 }, deletedAt: null },
      select: { date: true, remaining: true },
      orderBy: { date: 'asc' },
      take: 1000,
    }).catch(() => [] as any[]);

    // Build weekly buckets
    const weeklyForecasts: WeeklyForecast[] = [];
    let runningBalance = currentBalance;

    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + w * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Collect AR due this week (estimated due = invoice date + 30 days)
      const arCollections = (arInvoices as any[]).reduce((sum, inv) => {
        const dueDate = new Date(inv.date);
        dueDate.setDate(dueDate.getDate() + 30);
        if (dueDate >= weekStart && dueDate <= weekEnd) {
          return sum + Number(inv.remaining || 0) * arCollectionRate;
        }
        return sum;
      }, 0);

      // AP due this week
      const apPayments = (apInvoices as any[]).reduce((sum, inv) => {
        const dueDate = new Date(inv.date);
        dueDate.setDate(dueDate.getDate() + 30);
        if (dueDate >= weekStart && dueDate <= weekEnd) {
          return sum + Number(inv.remaining || 0);
        }
        return sum;
      }, 0);

      // Payroll (assume end of month if this week contains last day)
      const lastDayOfMonth = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0);
      const isPayrollWeek = lastDayOfMonth >= weekStart && lastDayOfMonth <= weekEnd;

      // Rough payroll estimate from recent salary expense GL
      let estimatedPayroll = 0;
      if (isPayrollWeek) {
        const salaryAgg = await prisma.journalLine.aggregate({
          _sum: { debit: true },
          where: {
            entry: {
              entryDate: {
                gte: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
                lte: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
              },
              status: 'posted',
            },
            account: { code: { startsWith: '51' } }, // 51x = salary expenses
          },
        }).catch(() => ({ _sum: { debit: 0 } }));
        estimatedPayroll = Number(salaryAgg._sum?.debit || 0);
      }

      const totalInflows  = Math.round((arCollections) * 100) / 100;
      const totalOutflows = Math.round((apPayments + estimatedPayroll) * 100) / 100;
      const netCashFlow   = Math.round((totalInflows - totalOutflows) * 100) / 100;
      const closingBalance = Math.round((runningBalance + netCashFlow) * 100) / 100;

      weeklyForecasts.push({
        weekStart,
        weekEnd,
        weekLabel: `W${w + 1} (${weekStart.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })})`,
        openingBalance: Math.round(runningBalance * 100) / 100,
        inflows: {
          arCollections: Math.round(arCollections * 100) / 100,
          otherInflows: 0,
          total: totalInflows,
        },
        outflows: {
          apPayments: Math.round(apPayments * 100) / 100,
          payroll: Math.round(estimatedPayroll * 100) / 100,
          expenses: 0,
          total: totalOutflows,
        },
        netCashFlow,
        closingBalance,
        isNegative: closingBalance < 0,
      });

      runningBalance = closingBalance;
    }

    const totalInflows  = weeklyForecasts.reduce((s, w) => s + w.inflows.total, 0);
    const totalOutflows = weeklyForecasts.reduce((s, w) => s + w.outflows.total, 0);
    const lowestWeek    = weeklyForecasts.reduce((min, w) => w.closingBalance < min.closingBalance ? w : min);
    const shortfallWeeks = weeklyForecasts.filter(w => w.isNegative).map(w => w.weekLabel);

    log.info(`Cash flow forecast: ${weeks} weeks, current balance=${currentBalance.toFixed(2)}`);

    return {
      generatedAt: now,
      currency,
      currentBalance: Math.round(currentBalance * 100) / 100,
      weeks: weeklyForecasts,
      summary: {
        totalInflows:       Math.round(totalInflows * 100) / 100,
        totalOutflows:      Math.round(totalOutflows * 100) / 100,
        netCashFlow:        Math.round((totalInflows - totalOutflows) * 100) / 100,
        lowestBalance:      Math.round(lowestWeek.closingBalance * 100) / 100,
        lowestBalanceWeek:  lowestWeek.weekLabel,
        cashShortfallWeeks: shortfallWeeks,
      },
    };
  }
}
