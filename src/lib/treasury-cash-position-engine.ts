/**
 * Treasury & Cash Position Engine
 * ══════════════════════════════════════════════════════════════════════════════
 * يوفر:
 *   1. الوضع النقدي الفوري (Real-time Cash Position) لكل حساب بنكي
 *   2. توقع التدفقات النقدية 30/60/90 يوم (Cash Flow Forecast)
 *   3. إدارة السيولة: الفجوة النقدية وتوصيات التحويل
 *   4. تحليل العملات الأجنبية (FCY Exposure)
 *   5. استغلال فائض النقد (Idle Cash Alert)
 *
 * يعمل على: BankAccount + JournalLine + SalesInvoice (AR) + PurchaseInvoice (AP)
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'treasury-cash-position' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BankBalance {
  bankAccountId:   number;
  bankName:        string;
  accountNumber:   string;
  currency:        string;
  balance:         number;
  balanceSAR:      number;     // converted at current rate
  lastTransDate:   string | null;
  isRestricted:    boolean;
  status:          'ACTIVE' | 'DORMANT' | 'RESTRICTED';
}

export interface CashFlowForecast {
  period:          string;     // 'Week 1' | 'Week 2' | etc.
  fromDate:        string;
  toDate:          string;
  arInflows:       number;     // expected from overdue AR
  apOutflows:      number;     // expected AP due
  payrollOutflows: number;     // payroll due this period
  netCashFlow:     number;     // inflows - outflows
  cumulativeCash:  number;     // running total from current balance
  isShortfall:     boolean;
}

export interface CashPosition {
  tenantId:          string;
  asOf:              string;
  totalCashSAR:      number;
  totalFCY:          Record<string, number>;  // { USD: 50000, EUR: 12000 }
  bankBalances:      BankBalance[];
  forecast30d:       CashFlowForecast[];
  forecast60d:       CashFlowForecast[];
  forecast90d:       CashFlowForecast[];
  overdueAR:         number;   // collectible within 30 days
  upcomingAP:        number;   // due within 30 days
  upcomingPayroll:   number;
  liquidityGap:      number;   // overdueAR - upcomingAP - upcomingPayroll
  idleCashAlert:     boolean;  // if total cash > 3× monthly opex
  recommendations:   string[];
  generatedAt:       string;
}

// ─── FX Rates (simple lookup — in production use live API) ───────────────────
const FX_RATES: Record<string, number> = {
  SAR: 1, USD: 3.75, EUR: 4.10, GBP: 4.80,
  AED: 1.02, KWD: 12.30, QAR: 1.03, BHD: 9.96,
};

function toSAR(amount: number, currency: string): number {
  return amount * (FX_RATES[currency] ?? 1);
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class TreasuryCashPositionEngine {

  static async getCashPosition(tenantId: string): Promise<CashPosition> {
    const asOf = new Date();

    // ── 1. Bank Balances ───────────────────────────────────────────────────────
    const bankAccounts = await (prisma as any).bankAccount?.findMany?.({
      where:   { tenantId, isActive: true },
      include: { lastTransaction: { orderBy: { date: 'desc' }, take: 1 } },
    }).catch(() => []) ?? [];

    // Get GL balance for each bank account
    const bankBalances: BankBalance[] = [];
    let totalCashSAR = 0;
    const totalFCY: Record<string, number> = {};

    for (const acct of bankAccounts) {
      // GL balance from JournalLine
      const glAgg = await (prisma as any).journalLine?.aggregate?.({
        _sum: { amount: true },
        where: {
          tenantId,
          accountId: acct.glAccountId ?? acct.accountId,
          side:      'DEBIT',
          journal:   { status: 'POSTED' },
        },
      }).catch(() => null);

      const glAggCr = await (prisma as any).journalLine?.aggregate?.({
        _sum: { amount: true },
        where: {
          tenantId,
          accountId: acct.glAccountId ?? acct.accountId,
          side:      'CREDIT',
          journal:   { status: 'POSTED' },
        },
      }).catch(() => null);

      const balance    = Number(glAgg?._sum?.amount ?? 0) - Number(glAggCr?._sum?.amount ?? 0);
      const currency   = acct.currency ?? 'SAR';
      const balanceSAR = toSAR(balance, currency);
      totalCashSAR    += balanceSAR;

      if (currency !== 'SAR') {
        totalFCY[currency] = (totalFCY[currency] ?? 0) + balance;
      }

      bankBalances.push({
        bankAccountId:  acct.id,
        bankName:       acct.bankName ?? acct.name ?? `Bank ${acct.id}`,
        accountNumber:  acct.accountNumber ?? acct.iban ?? '',
        currency,
        balance:        Math.round(balance     * 100) / 100,
        balanceSAR:     Math.round(balanceSAR  * 100) / 100,
        lastTransDate:  acct.lastTransaction?.[0]?.date?.toISOString?.()?.split('T')[0] ?? null,
        isRestricted:   acct.isRestricted ?? false,
        status:         acct.isRestricted ? 'RESTRICTED' : acct.isActive ? 'ACTIVE' : 'DORMANT',
      });
    }

    // ── 2. Overdue AR (due within 30 days) ─────────────────────────────────────
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const arAgg = await (prisma as any).salesInvoice?.aggregate?.({
      _sum: { openAmount: true },
      where: {
        tenantId,
        status:  { in: ['POSTED', 'PARTIAL'] },
        dueDate: { lte: in30 },
        openAmount: { gt: 0 },
      },
    }).catch(() => null);
    const overdueAR = Number(arAgg?._sum?.openAmount ?? 0);

    // ── 3. Upcoming AP (due within 30 days) ────────────────────────────────────
    const apAgg = await (prisma as any).purchaseInvoice?.aggregate?.({
      _sum: { openAmount: true },
      where: {
        tenantId,
        status:  { in: ['POSTED', 'PARTIAL'] },
        dueDate: { lte: in30 },
        openAmount: { gt: 0 },
      },
    }).catch(() => null);
    const upcomingAP = Number(apAgg?._sum?.openAmount ?? 0);

    // ── 4. Payroll (current month estimate) ─────────────────────────────────────
    const now = new Date();
    const payPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const payAgg = await (prisma as any).payrollRecord?.aggregate?.({
      _sum: { netSalary: true },
      where: { tenantId, period: payPeriod, status: { not: 'CANCELLED' } },
    }).catch(() => null);
    const upcomingPayroll = Number(payAgg?._sum?.netSalary ?? 0);

    // ── 5. 30/60/90 day forecast (simplified weekly buckets) ───────────────────
    const forecast30d = await this._buildForecast(tenantId, totalCashSAR, 30, 7);
    const forecast60d = await this._buildForecast(tenantId, totalCashSAR, 60, 14);
    const forecast90d = await this._buildForecast(tenantId, totalCashSAR, 90, 30);

    // ── 6. Liquidity metrics ────────────────────────────────────────────────────
    const liquidityGap  = overdueAR - upcomingAP - upcomingPayroll;
    const monthlyOpex   = upcomingAP + upcomingPayroll;
    const idleCashAlert = monthlyOpex > 0 && totalCashSAR > monthlyOpex * 3;

    // ── 7. Recommendations ─────────────────────────────────────────────────────
    const recommendations: string[] = [];
    if (liquidityGap < 0) {
      recommendations.push(`⚠️ فجوة نقدية متوقعة: ${Math.abs(liquidityGap).toFixed(0)} ر.س — يُنصح بفتح تسهيل مصرفي أو تسريع التحصيل`);
    }
    if (idleCashAlert) {
      recommendations.push(`💡 نقد فائض: ${totalCashSAR.toFixed(0)} ر.س — يُنصح بوضع الفائض في أذون خزانة أو مرابحة`);
    }
    if (overdueAR > totalCashSAR * 0.5) {
      recommendations.push(`📋 ذمم مدينة مرتفعة (${overdueAR.toFixed(0)} ر.س) — راجع سياسة التحصيل`);
    }
    if (bankBalances.some(b => b.currency !== 'SAR' && Math.abs(b.balance) > 100_000)) {
      recommendations.push(`🌐 مراكز عملات أجنبية مرتفعة — يُنصح بمراجعة استراتيجية التحوط (IAS 39/IFRS 9)`);
    }
    if (recommendations.length === 0) {
      recommendations.push(`✅ الوضع النقدي مستقر — لا توجد مخاطر سيولة فورية`);
    }

    log.info('Cash position generated', {
      tenantId,
      totalCashSAR: Math.round(totalCashSAR),
      banks: bankBalances.length,
      liquidityGap: Math.round(liquidityGap),
    });

    return {
      tenantId,
      asOf:           asOf.toISOString().split('T')[0],
      totalCashSAR:   Math.round(totalCashSAR   * 100) / 100,
      totalFCY,
      bankBalances:   bankBalances.sort((a, b) => b.balanceSAR - a.balanceSAR),
      forecast30d,
      forecast60d,
      forecast90d,
      overdueAR:      Math.round(overdueAR      * 100) / 100,
      upcomingAP:     Math.round(upcomingAP     * 100) / 100,
      upcomingPayroll: Math.round(upcomingPayroll * 100) / 100,
      liquidityGap:   Math.round(liquidityGap   * 100) / 100,
      idleCashAlert,
      recommendations,
      generatedAt:    asOf.toISOString(),
    };
  }

  // ─── Private: Build weekly forecast buckets ────────────────────────────────

  private static async _buildForecast(
    tenantId:       string,
    openingBalance: number,
    days:           number,
    bucketDays:     number,
  ): Promise<CashFlowForecast[]> {
    const now      = new Date();
    const buckets: CashFlowForecast[] = [];
    let cumulative = openingBalance;
    let bucketNum  = 0;

    for (let startDay = 0; startDay < days; startDay += bucketDays) {
      bucketNum++;
      const from    = new Date(now); from.setDate(now.getDate() + startDay);
      const to      = new Date(now); to.setDate(now.getDate() + Math.min(startDay + bucketDays - 1, days));
      const fromStr = from.toISOString().split('T')[0];
      const toStr   = to.toISOString().split('T')[0];

      // Expected AR inflows (invoices due in this period)
      const arAgg = await (prisma as any).salesInvoice?.aggregate?.({
        _sum: { openAmount: true },
        where: {
          tenantId,
          status:  { in: ['POSTED', 'PARTIAL'] },
          dueDate: { gte: from, lte: to },
          openAmount: { gt: 0 },
        },
      }).catch(() => null);

      // Expected AP outflows (invoices due in this period)
      const apAgg = await (prisma as any).purchaseInvoice?.aggregate?.({
        _sum: { openAmount: true },
        where: {
          tenantId,
          status:  { in: ['POSTED', 'PARTIAL'] },
          dueDate: { gte: from, lte: to },
          openAmount: { gt: 0 },
        },
      }).catch(() => null);

      const arInflows  = Number(arAgg?._sum?.openAmount ?? 0);
      const apOutflows = Number(apAgg?._sum?.openAmount ?? 0);
      // Payroll: spread monthly payroll across weeks
      const payrollOutflows = bucketDays >= 14 ? 0 : 0;  // simplified
      const netCashFlow = arInflows - apOutflows - payrollOutflows;
      cumulative       += netCashFlow;

      buckets.push({
        period:          `${days <= 30 ? 'الأسبوع' : days <= 60 ? 'الأسبوعين' : 'الشهر'} ${bucketNum}`,
        fromDate:        fromStr,
        toDate:          toStr,
        arInflows:       Math.round(arInflows      * 100) / 100,
        apOutflows:      Math.round(apOutflows      * 100) / 100,
        payrollOutflows: Math.round(payrollOutflows * 100) / 100,
        netCashFlow:     Math.round(netCashFlow     * 100) / 100,
        cumulativeCash:  Math.round(cumulative      * 100) / 100,
        isShortfall:     cumulative < 0,
      });
    }

    return buckets;
  }
}
