/**
 * Statement of Changes in Equity Engine — IFRS (IAS 1.106)
 * ══════════════════════════════════════════════════════════
 *
 * يولّد بيان التغيرات في حقوق الملكية لفترة مالية محددة.
 *
 * المكونات:
 *   - Share Capital          رأس المال
 *   - Share Premium          علاوة الإصدار
 *   - Retained Earnings      الأرباح المحتجزة
 *   - OCI Reserve            احتياطي الدخل الشامل الآخر
 *     ├── Hedge Reserve      احتياطي التحوط (IFRS 9)
 *     ├── Translation Reserve فروق الترجمة (IAS 21)
 *     └── Revaluation Reserve احتياطي إعادة التقييم (IAS 16)
 *   - Legal Reserve          الاحتياطي النظامي (نظام الشركات السعودي)
 *   - Dividends              توزيعات الأرباح
 *   - Total Equity           إجمالي حقوق الملكية
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'equity-statement' });

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface EquityComponent {
  shareCapital: number;
  sharePremium: number;
  retainedEarnings: number;
  legalReserve: number;
  hedgeReserve: number;        // OCI — Cash Flow / Net Investment
  translationReserve: number;  // OCI — Foreign currency translation
  revaluationReserve: number;  // OCI — PP&E revaluation
  otherReserves: number;
  dividends: number;           // declared during period (negative)
}

export interface EquityMovement {
  description: string;
  shareCapital: number;
  sharePremium: number;
  retainedEarnings: number;
  legalReserve: number;
  hedgeReserve: number;
  translationReserve: number;
  revaluationReserve: number;
  otherReserves: number;
  dividends: number;
  totalMovement: number;
}

export interface StatementOfChangesInEquity {
  periodStart: Date;
  periodEnd: Date;
  currency: string;

  openingBalance: EquityComponent & { total: number };
  movements: EquityMovement[];
  closingBalance: EquityComponent & { total: number };

  // Summary totals
  totalComprehensiveIncome: number;
  totalOCIMovements: number;
  netIncomeForPeriod: number;
}

// ═══════════════════════════════════════════════════════════════
// Equity Statement Engine
// ═══════════════════════════════════════════════════════════════

export class EquityStatementEngine {

  private static sumComponent(c: EquityComponent): number {
    return (
      c.shareCapital +
      c.sharePremium +
      c.retainedEarnings +
      c.legalReserve +
      c.hedgeReserve +
      c.translationReserve +
      c.revaluationReserve +
      c.otherReserves +
      c.dividends
    );
  }

  /**
   * توليد بيان التغيرات في حقوق الملكية
   */
  static async generate(params: {
    startDate: Date;
    endDate: Date;
    currency?: string;
    tenantId?: string;
  }): Promise<StatementOfChangesInEquity> {

    const { startDate, endDate, currency = 'SAR' } = params;
    log.info('Generating Statement of Changes in Equity', { startDate, endDate });

    // ── 1. Fetch equity account balances from GL ──────────────
    // Account ranges (standard SOCPA/IFRS chart):
    //   31xx = Share Capital & Premium
    //   32xx = Reserves
    //   33xx = Retained Earnings
    //   34xx = OCI Reserves
    //   35xx = Dividends

    const glBalances = await prisma.journalEntryLine.groupBy({
      by: ['accountCode'],
      _sum: { debit: true, credit: true },
      where: {
        entry: {
          date: { lt: startDate },
          status: 'POSTED',
        },
      },
    }).catch(() => [] as any[]);

    const glCurrentPeriod = await prisma.journalEntryLine.groupBy({
      by: ['accountCode'],
      _sum: { debit: true, credit: true },
      where: {
        entry: {
          date: { gte: startDate, lte: endDate },
          status: 'POSTED',
        },
      },
    }).catch(() => [] as any[]);

    // Helper: net credit balance for account code prefix
    const netCredit = (balances: any[], prefix: string): number => {
      const matching = balances.filter(b => String(b.accountCode || '').startsWith(prefix));
      return matching.reduce((sum, b) => {
        return sum + (Number(b._sum?.credit || 0) - Number(b._sum?.debit || 0));
      }, 0);
    };

    // ── 2. Opening Balances ───────────────────────────────────
    const opening: EquityComponent = {
      shareCapital:        netCredit(glBalances, '3100'),
      sharePremium:        netCredit(glBalances, '3110'),
      retainedEarnings:    netCredit(glBalances, '3300') + netCredit(glBalances, '3310'),
      legalReserve:        netCredit(glBalances, '3200'),
      hedgeReserve:        netCredit(glBalances, '3710'),
      translationReserve:  netCredit(glBalances, '3720'),
      revaluationReserve:  netCredit(glBalances, '3730'),
      otherReserves:       netCredit(glBalances, '3290'),
      dividends:           -netCredit(glBalances, '3500'), // negative
    };

    // ── 3. Current Period Movements ───────────────────────────

    // Net income from income statement (Revenue - Expenses)
    const revenue = await prisma.journalEntryLine.aggregate({
      _sum: { credit: true, debit: true },
      where: {
        entry: { date: { gte: startDate, lte: endDate }, status: 'POSTED' },
        accountCode: { startsWith: '4' },
      },
    }).catch(() => ({ _sum: { credit: 0, debit: 0 } }));

    const expenses = await prisma.journalEntryLine.aggregate({
      _sum: { credit: true, debit: true },
      where: {
        entry: { date: { gte: startDate, lte: endDate }, status: 'POSTED' },
        accountCode: { startsWith: '5' },
      },
    }).catch(() => ({ _sum: { credit: 0, debit: 0 } }));

    const netIncome =
      (Number(revenue._sum?.credit || 0) - Number(revenue._sum?.debit || 0)) -
      (Number(expenses._sum?.debit || 0) - Number(expenses._sum?.credit || 0));

    // OCI movements during period
    const ociHedge       = netCredit(glCurrentPeriod, '3710');
    const ociTranslation = netCredit(glCurrentPeriod, '3720');
    const ociRevaluation = netCredit(glCurrentPeriod, '3730');
    const totalOCI       = ociHedge + ociTranslation + ociRevaluation;

    // Legal reserve transfer (10% of net income per Saudi Companies Law)
    const legalReserveTransfer = netIncome > 0 ? netIncome * 0.10 : 0;

    // Dividends declared
    const dividendsDeclared = -(netCredit(glCurrentPeriod, '3500'));

    // Capital movements (new shares, buybacks)
    const capitalIncrease = netCredit(glCurrentPeriod, '3100');
    const premiumIncrease  = netCredit(glCurrentPeriod, '3110');

    const movements: EquityMovement[] = [];

    // Net income movement
    if (Math.abs(netIncome) > 0.01) {
      movements.push({
        description: 'صافي الربح للفترة',
        shareCapital: 0,
        sharePremium: 0,
        retainedEarnings: netIncome,
        legalReserve: 0,
        hedgeReserve: 0,
        translationReserve: 0,
        revaluationReserve: 0,
        otherReserves: 0,
        dividends: 0,
        totalMovement: netIncome,
      });
    }

    // OCI movements
    if (Math.abs(totalOCI) > 0.01) {
      movements.push({
        description: 'الدخل الشامل الآخر (OCI)',
        shareCapital: 0,
        sharePremium: 0,
        retainedEarnings: 0,
        legalReserve: 0,
        hedgeReserve: ociHedge,
        translationReserve: ociTranslation,
        revaluationReserve: ociRevaluation,
        otherReserves: 0,
        dividends: 0,
        totalMovement: totalOCI,
      });
    }

    // Legal reserve transfer
    if (legalReserveTransfer > 0.01) {
      movements.push({
        description: 'تحويل للاحتياطي النظامي (10% من الأرباح)',
        shareCapital: 0,
        sharePremium: 0,
        retainedEarnings: -legalReserveTransfer,
        legalReserve: legalReserveTransfer,
        hedgeReserve: 0,
        translationReserve: 0,
        revaluationReserve: 0,
        otherReserves: 0,
        dividends: 0,
        totalMovement: 0,
      });
    }

    // Dividends
    if (Math.abs(dividendsDeclared) > 0.01) {
      movements.push({
        description: 'توزيعات أرباح معلنة',
        shareCapital: 0,
        sharePremium: 0,
        retainedEarnings: 0,
        legalReserve: 0,
        hedgeReserve: 0,
        translationReserve: 0,
        revaluationReserve: 0,
        otherReserves: 0,
        dividends: dividendsDeclared,
        totalMovement: dividendsDeclared,
      });
    }

    // Capital increase
    if (Math.abs(capitalIncrease) > 0.01 || Math.abs(premiumIncrease) > 0.01) {
      movements.push({
        description: 'زيادة رأس المال',
        shareCapital: capitalIncrease,
        sharePremium: premiumIncrease,
        retainedEarnings: 0,
        legalReserve: 0,
        hedgeReserve: 0,
        translationReserve: 0,
        revaluationReserve: 0,
        otherReserves: 0,
        dividends: 0,
        totalMovement: capitalIncrease + premiumIncrease,
      });
    }

    // ── 4. Closing Balances ───────────────────────────────────
    const totalMovementsByComponent = movements.reduce(
      (acc, m) => ({
        shareCapital:        acc.shareCapital + m.shareCapital,
        sharePremium:        acc.sharePremium + m.sharePremium,
        retainedEarnings:    acc.retainedEarnings + m.retainedEarnings,
        legalReserve:        acc.legalReserve + m.legalReserve,
        hedgeReserve:        acc.hedgeReserve + m.hedgeReserve,
        translationReserve:  acc.translationReserve + m.translationReserve,
        revaluationReserve:  acc.revaluationReserve + m.revaluationReserve,
        otherReserves:       acc.otherReserves + m.otherReserves,
        dividends:           acc.dividends + m.dividends,
      }),
      {
        shareCapital: 0, sharePremium: 0, retainedEarnings: 0,
        legalReserve: 0, hedgeReserve: 0, translationReserve: 0,
        revaluationReserve: 0, otherReserves: 0, dividends: 0,
      }
    );

    const closing: EquityComponent = {
      shareCapital:        opening.shareCapital + totalMovementsByComponent.shareCapital,
      sharePremium:        opening.sharePremium + totalMovementsByComponent.sharePremium,
      retainedEarnings:    opening.retainedEarnings + totalMovementsByComponent.retainedEarnings,
      legalReserve:        opening.legalReserve + totalMovementsByComponent.legalReserve,
      hedgeReserve:        opening.hedgeReserve + totalMovementsByComponent.hedgeReserve,
      translationReserve:  opening.translationReserve + totalMovementsByComponent.translationReserve,
      revaluationReserve:  opening.revaluationReserve + totalMovementsByComponent.revaluationReserve,
      otherReserves:       opening.otherReserves + totalMovementsByComponent.otherReserves,
      dividends:           opening.dividends + totalMovementsByComponent.dividends,
    };

    return {
      periodStart: startDate,
      periodEnd: endDate,
      currency,
      openingBalance: { ...opening, total: this.sumComponent(opening) },
      movements,
      closingBalance: { ...closing, total: this.sumComponent(closing) },
      totalComprehensiveIncome: netIncome + totalOCI,
      totalOCIMovements: totalOCI,
      netIncomeForPeriod: netIncome,
    };
  }

  /**
   * التحقق من التوازن: رصيد الإغلاق = رصيد الافتتاح + التغيرات
   */
  static validateBalance(statement: StatementOfChangesInEquity): boolean {
    const expected = statement.openingBalance.total + statement.movements.reduce((s, m) => s + m.totalMovement, 0);
    return Math.abs(expected - statement.closingBalance.total) < 0.01;
  }
}
