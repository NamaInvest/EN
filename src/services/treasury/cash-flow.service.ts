/**
 * Cash Flow Projection Service
 * Uses BankTransaction + SalesInvoice + PurchaseInvoice for forecasting
 */
import { PrismaClient } from '@prisma/client';

export interface CashFlowBucket {
  period: string; // YYYY-MM-DD (weekly) or YYYY-MM (monthly)
  openingBalance: number;
  inflows: number;
  outflows: number;
  netFlow: number;
  closingBalance: number;
}

export class CashFlowService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get current cash position across all bank accounts
   */
  async getCurrentPosition(tenantId: string): Promise<{
    bankAccounts: { id: number; name: string; balance: number; currency: string }[];
    totalSAR: number;
  }> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, bankName: true, accountName: true, currentBalance: true, currency: true },
    });

    const bankAccounts = accounts.map((a) => ({
      id: a.id,
      name: `${a.bankName} - ${a.accountName}`,
      balance: Number(a.currentBalance),
      currency: a.currency,
    }));

    // For simplicity, assume all SAR (FX conversion would need exchange rates)
    const totalSAR = bankAccounts.filter((a) => a.currency === 'SAR').reduce((s, a) => s + a.balance, 0);

    return { bankAccounts, totalSAR };
  }

  /**
   * 13-week cash flow forecast
   */
  async getForecast(tenantId: string, startDate: Date): Promise<CashFlowBucket[]> {
    const position = await this.getCurrentPosition(tenantId);
    let runningBalance = position.totalSAR;

    const buckets: CashFlowBucket[] = [];

    for (let week = 0; week < 13; week++) {
      const weekStart = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const period = weekStart.toISOString().split('T')[0];

      // Expected inflows: outstanding customer invoices (by invoice date bucket)
      const inflows = await this.prisma.salesInvoice.aggregate({
        where: {
          tenantId,
          remaining: { gt: 0 },
          deletedAt: null,
          date: { gte: weekStart, lte: weekEnd },
        },
        _sum: { remaining: true },
      });

      // Expected outflows: outstanding purchase invoices (by invoice date bucket)
      const outflows = await this.prisma.purchaseInvoice.aggregate({
        where: {
          tenantId,
          remaining: { gt: 0 },
          deletedAt: null,
          date: { gte: weekStart, lte: weekEnd },
        },
        _sum: { remaining: true },
      });

      const inflowAmount = Number(inflows._sum?.remaining ?? 0);
      const outflowAmount = Number(outflows._sum?.remaining ?? 0);
      const netFlow = inflowAmount - outflowAmount;

      buckets.push({
        period,
        openingBalance: runningBalance,
        inflows: inflowAmount,
        outflows: outflowAmount,
        netFlow,
        closingBalance: runningBalance + netFlow,
      });

      runningBalance += netFlow;
    }

    return buckets;
  }

  /**
   * Monthly cash flow actuals
   */
  async getMonthlyActuals(tenantId: string, year: number): Promise<CashFlowBucket[]> {
    const buckets: CashFlowBucket[] = [];

    for (let month = 1; month <= 12; month++) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const txns = await this.prisma.bankTransaction.findMany({
        where: {
          tenantId,
          transactionDate: { gte: start, lte: end },
          bankAccount: { isActive: true, deletedAt: null },
        },
        select: { type: true, amount: true },
      });

      const inflows = txns.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + Number(t.amount), 0);
      const outflows = txns.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + Number(t.amount), 0);

      buckets.push({
        period: `${year}-${String(month).padStart(2, '0')}`,
        openingBalance: 0, // Would need period opening balance
        inflows,
        outflows,
        netFlow: inflows - outflows,
        closingBalance: 0,
      });
    }

    return buckets;
  }
}
