/**
 * Statement of Changes in Equity Engine — IFRS (IAS 1.106)
 * ══════════════════════════════════════════════════════════
 * Uses correct Prisma model names:
 *   - prisma.journalLine (not journalEntryLine)
 *   - JournalEntry.entryDate (String), status
 *   - JournalLine.debit, credit, accountId
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'equity-statement' });

export interface EquityComponent {
  shareCapital: number;
  sharePremium: number;
  retainedEarnings: number;
  legalReserve: number;
  hedgeReserve: number;
  translationReserve: number;
  revaluationReserve: number;
  otherReserves: number;
  dividends: number;
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
  totalComprehensiveIncome: number;
  totalOCIMovements: number;
  netIncomeForPeriod: number;
}

export class EquityStatementEngine {

  private static sumComponent(c: EquityComponent): number {
    return (
      c.shareCapital + c.sharePremium + c.retainedEarnings +
      c.legalReserve + c.hedgeReserve + c.translationReserve +
      c.revaluationReserve + c.otherReserves + c.dividends
    );
  }

  /**
   * Fetch net credit balance for account code prefix from JournalLine
   * via JournalEntry date filter
   */
  private static async netCreditByPrefix(
    prefix: string,
    beforeDate: string,
    status = 'posted'
  ): Promise<number> {
    const lines = await prisma.journalLine.aggregate({
      _sum: { debit: true, credit: true },
      where: {
        entry: {
          entryDate: { lt: beforeDate },
          status,
          deletedAt: null,
        },
        account: {
          code: { startsWith: prefix },
        },
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { debit: 0, credit: 0 } }));

    return Number(lines._sum?.credit || 0) - Number(lines._sum?.debit || 0);
  }

  private static async netCreditInPeriod(
    prefix: string,
    startDate: string,
    endDate: string,
    status = 'posted'
  ): Promise<number> {
    const lines = await prisma.journalLine.aggregate({
      _sum: { debit: true, credit: true },
      where: {
        entry: {
          entryDate: { gte: startDate, lte: endDate },
          status,
          deletedAt: null,
        },
        account: {
          code: { startsWith: prefix },
        },
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { debit: 0, credit: 0 } }));

    return Number(lines._sum?.credit || 0) - Number(lines._sum?.debit || 0);
  }

  static async generate(params: {
    startDate: Date;
    endDate: Date;
    currency?: string;
  }): Promise<StatementOfChangesInEquity> {

    const { startDate, endDate, currency = 'SAR' } = params;
    // JournalEntry.entryDate is a String in format 'YYYY-MM-DD'
    const startStr = startDate.toISOString().split('T')[0];
    const endStr   = endDate.toISOString().split('T')[0];

    log.info('Generating Statement of Changes in Equity', { startStr, endStr });

    // ── Opening Balances (before period) ─────────────────────
    const [sc, sp, re, lr, hr, tr, rr, or_] = await Promise.all([
      this.netCreditByPrefix('3100', startStr),
      this.netCreditByPrefix('3110', startStr),
      this.netCreditByPrefix('33', startStr),
      this.netCreditByPrefix('3200', startStr),
      this.netCreditByPrefix('3710', startStr),
      this.netCreditByPrefix('3720', startStr),
      this.netCreditByPrefix('3730', startStr),
      this.netCreditByPrefix('3290', startStr),
    ]);

    const opening: EquityComponent = {
      shareCapital: sc, sharePremium: sp, retainedEarnings: re,
      legalReserve: lr, hedgeReserve: hr, translationReserve: tr,
      revaluationReserve: rr, otherReserves: or_, dividends: 0,
    };

    // ── Period Net Income (Revenue 4xx - Expense 5xx) ─────────
    const [revCredit, revDebit, expDebit, expCredit] = await Promise.all([
      prisma.journalLine.aggregate({
        _sum: { credit: true },
        where: {
          entry: { entryDate: { gte: startStr, lte: endStr }, status: 'posted', deletedAt: null },
          account: { code: { startsWith: '4' } },
          deletedAt: null,
        },
      }).catch(() => ({ _sum: { credit: 0 } })),
      prisma.journalLine.aggregate({
        _sum: { debit: true },
        where: {
          entry: { entryDate: { gte: startStr, lte: endStr }, status: 'posted', deletedAt: null },
          account: { code: { startsWith: '4' } },
          deletedAt: null,
        },
      }).catch(() => ({ _sum: { debit: 0 } })),
      prisma.journalLine.aggregate({
        _sum: { debit: true },
        where: {
          entry: { entryDate: { gte: startStr, lte: endStr }, status: 'posted', deletedAt: null },
          account: { code: { startsWith: '5' } },
          deletedAt: null,
        },
      }).catch(() => ({ _sum: { debit: 0 } })),
      prisma.journalLine.aggregate({
        _sum: { credit: true },
        where: {
          entry: { entryDate: { gte: startStr, lte: endStr }, status: 'posted', deletedAt: null },
          account: { code: { startsWith: '5' } },
          deletedAt: null,
        },
      }).catch(() => ({ _sum: { credit: 0 } })),
    ]);

    const netIncome =
      (Number(revCredit._sum?.credit || 0) - Number(revDebit._sum?.debit || 0)) -
      (Number(expDebit._sum?.debit || 0) - Number(expCredit._sum?.credit || 0));

    // ── OCI movements ─────────────────────────────────────────
    const [ociH, ociT, ociR] = await Promise.all([
      this.netCreditInPeriod('3710', startStr, endStr),
      this.netCreditInPeriod('3720', startStr, endStr),
      this.netCreditInPeriod('3730', startStr, endStr),
    ]);
    const totalOCI = ociH + ociT + ociR;

    // Legal reserve transfer (10% of net income per Saudi Companies Law)
    const legalReserveTransfer = netIncome > 0 ? netIncome * 0.10 : 0;

    // Capital movements
    const [capInc, premInc] = await Promise.all([
      this.netCreditInPeriod('3100', startStr, endStr),
      this.netCreditInPeriod('3110', startStr, endStr),
    ]);

    const movements: EquityMovement[] = [];

    if (Math.abs(netIncome) > 0.01) {
      movements.push({
        description: 'صافي الربح للفترة',
        shareCapital: 0, sharePremium: 0, retainedEarnings: netIncome,
        legalReserve: 0, hedgeReserve: 0, translationReserve: 0,
        revaluationReserve: 0, otherReserves: 0, dividends: 0,
        totalMovement: netIncome,
      });
    }

    if (Math.abs(totalOCI) > 0.01) {
      movements.push({
        description: 'الدخل الشامل الآخر (OCI)',
        shareCapital: 0, sharePremium: 0, retainedEarnings: 0,
        legalReserve: 0, hedgeReserve: ociH, translationReserve: ociT,
        revaluationReserve: ociR, otherReserves: 0, dividends: 0,
        totalMovement: totalOCI,
      });
    }

    if (legalReserveTransfer > 0.01) {
      movements.push({
        description: 'تحويل للاحتياطي النظامي (10%)',
        shareCapital: 0, sharePremium: 0, retainedEarnings: -legalReserveTransfer,
        legalReserve: legalReserveTransfer, hedgeReserve: 0, translationReserve: 0,
        revaluationReserve: 0, otherReserves: 0, dividends: 0,
        totalMovement: 0,
      });
    }

    if (Math.abs(capInc) > 0.01 || Math.abs(premInc) > 0.01) {
      movements.push({
        description: 'زيادة رأس المال',
        shareCapital: capInc, sharePremium: premInc, retainedEarnings: 0,
        legalReserve: 0, hedgeReserve: 0, translationReserve: 0,
        revaluationReserve: 0, otherReserves: 0, dividends: 0,
        totalMovement: capInc + premInc,
      });
    }

    // ── Closing Balances ──────────────────────────────────────
    const mv = movements.reduce(
      (acc, m) => ({
        shareCapital: acc.shareCapital + m.shareCapital,
        sharePremium: acc.sharePremium + m.sharePremium,
        retainedEarnings: acc.retainedEarnings + m.retainedEarnings,
        legalReserve: acc.legalReserve + m.legalReserve,
        hedgeReserve: acc.hedgeReserve + m.hedgeReserve,
        translationReserve: acc.translationReserve + m.translationReserve,
        revaluationReserve: acc.revaluationReserve + m.revaluationReserve,
        otherReserves: acc.otherReserves + m.otherReserves,
        dividends: acc.dividends + m.dividends,
      }),
      { shareCapital: 0, sharePremium: 0, retainedEarnings: 0, legalReserve: 0,
        hedgeReserve: 0, translationReserve: 0, revaluationReserve: 0, otherReserves: 0, dividends: 0 }
    );

    const closing: EquityComponent = {
      shareCapital:       opening.shareCapital + mv.shareCapital,
      sharePremium:       opening.sharePremium + mv.sharePremium,
      retainedEarnings:   opening.retainedEarnings + mv.retainedEarnings,
      legalReserve:       opening.legalReserve + mv.legalReserve,
      hedgeReserve:       opening.hedgeReserve + mv.hedgeReserve,
      translationReserve: opening.translationReserve + mv.translationReserve,
      revaluationReserve: opening.revaluationReserve + mv.revaluationReserve,
      otherReserves:      opening.otherReserves + mv.otherReserves,
      dividends:          opening.dividends + mv.dividends,
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

  static validateBalance(statement: StatementOfChangesInEquity): boolean {
    const expected = statement.openingBalance.total +
      statement.movements.reduce((s, m) => s + m.totalMovement, 0);
    return Math.abs(expected - statement.closingBalance.total) < 0.01;
  }
}
