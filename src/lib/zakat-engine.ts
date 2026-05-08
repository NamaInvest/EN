/**
 * Zakat Engine — Saudi Arabia mandatory annual zakat (2.5%)
 *
 * Formula (per ZATCA guidelines):
 *   Zakat Base = (Equity + LT Liabilities + Net Profit) - (Fixed Assets NBV + LT Investments)
 *              + Adjustments (Add) - Adjustments (Deduct)
 *   Zakat Due  = Base × 2.5% × Saudi Ownership %
 *
 * Account categorization is driven by Account.zakatCategory:
 *   - EQUITY        → adds to base
 *   - LT_LIAB       → adds to base
 *   - NET_PROFIT    → adds to base
 *   - FIXED_ASSET   → deducts from base
 *   - LT_INV        → deducts from base
 *   - ADJ_ADD       → manual adjustments to add
 *   - ADJ_DEDUCT    → manual adjustments to deduct
 *
 * Hijri year is computed from fiscal year end date via src/lib/hijri.ts.
 */

import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

const ZAKAT_RATE = new Prisma.Decimal('0.025');

export type ZakatBaseBreakdown = {
  equity: number;
  longTermLiabilities: number;
  netProfit: number;
  fixedAssetsBookValue: number;
  longTermInvestments: number;
  adjustmentsAdd: number;
  adjustmentsDeduct: number;
  zakatableBase: number;
  zakatDue: number;
  saudiOwnershipPct: number;
};

export class ZakatEngine {
  /**
   * Compute the zakat base for a given fiscal year by aggregating JE balances per Account.zakatCategory.
   * Does not write anything — pure calculation for preview/draft.
   */
  static async computeBase(fiscalYearId: number, opts?: { saudiOwnershipPct?: number }): Promise<ZakatBaseBreakdown> {
    const fy = await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
    if (!fy) throw new Error(`FiscalYear ${fiscalYearId} not found`);

    // Sum journal lines (debit-credit) for the fiscal year, grouped by Account.zakatCategory
    const sumByCategory = await prisma.$queryRaw<{ zakat_category: string | null; balance: number }[]>`
      SELECT a.zakat_category, COALESCE(SUM(jl.debit) - SUM(jl.credit), 0)::float AS balance
      FROM journal_lines jl
      INNER JOIN accounts a ON a.id = jl.account_id
      INNER JOIN journal_entries je ON je.id = jl.entry_id
      WHERE a.zakat_category IS NOT NULL
        AND je.entry_date >= ${fy.startDate.toISOString()}
        AND je.entry_date <= ${fy.endDate.toISOString()}
        AND je.status = 'posted'
      GROUP BY a.zakat_category
    `;

    const get = (cat: string) => Math.abs(sumByCategory.find(r => r.zakat_category === cat)?.balance ?? 0);

    const equity = get('EQUITY');
    const longTermLiabilities = get('LT_LIAB');
    const netProfit = get('NET_PROFIT');
    const fixedAssetsBookValue = get('FIXED_ASSET');
    const longTermInvestments = get('LT_INV');
    const adjustmentsAdd = get('ADJ_ADD');
    const adjustmentsDeduct = get('ADJ_DEDUCT');

    const baseBeforeOwnership =
      equity + longTermLiabilities + netProfit + adjustmentsAdd
      - fixedAssetsBookValue - longTermInvestments - adjustmentsDeduct;

    const ownership = opts?.saudiOwnershipPct ?? 1.0;
    const zakatableBase = Math.max(0, baseBeforeOwnership * ownership);
    const zakatDue = zakatableBase * 0.025;

    return {
      equity,
      longTermLiabilities,
      netProfit,
      fixedAssetsBookValue,
      longTermInvestments,
      adjustmentsAdd,
      adjustmentsDeduct,
      zakatableBase,
      zakatDue,
      saudiOwnershipPct: ownership,
    };
  }

  /**
   * Create a DRAFT ZakatAssessment with computed base. Idempotent per fiscal year.
   */
  static async createAssessment(fiscalYearId: number, opts?: { saudiOwnershipPct?: number }) {
    const existing = await prisma.zakatAssessment.findFirst({
      where: { fiscalYearId, status: 'DRAFT' },
    });
    if (existing) return existing;

    const breakdown = await this.computeBase(fiscalYearId, opts);
    const fy = await prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
    const hijriYear = await this.toHijriYear(fy!.endDate);

    return prisma.zakatAssessment.create({
      data: {
        fiscalYearId,
        status: 'DRAFT',
        hijriYear,
        equity: new Prisma.Decimal(breakdown.equity),
        longTermLiabilities: new Prisma.Decimal(breakdown.longTermLiabilities),
        netProfit: new Prisma.Decimal(breakdown.netProfit),
        fixedAssetsBookValue: new Prisma.Decimal(breakdown.fixedAssetsBookValue),
        longTermInvestments: new Prisma.Decimal(breakdown.longTermInvestments),
        adjustmentsTotal: new Prisma.Decimal(breakdown.adjustmentsAdd - breakdown.adjustmentsDeduct),
        zakatableBase: new Prisma.Decimal(breakdown.zakatableBase),
        zakatRate: ZAKAT_RATE,
        zakatDue: new Prisma.Decimal(breakdown.zakatDue),
        saudiOwnershipPct: new Prisma.Decimal(breakdown.saudiOwnershipPct),
      },
    });
  }

  /**
   * Add a manual adjustment line and recompute totals.
   */
  static async addAdjustment(
    assessmentId: number,
    args: { category: 'ADD' | 'DEDUCT'; description: string; amount: number; glAccountId?: number }
  ) {
    const assessment = await prisma.zakatAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new Error('Assessment not found');
    if (assessment.status !== 'DRAFT') throw new Error('Cannot adjust a finalized/filed assessment');

    await prisma.zakatAdjustment.create({
      data: {
        assessmentId,
        category: args.category,
        description: args.description,
        amount: new Prisma.Decimal(args.amount),
        glAccountId: args.glAccountId ?? null,
      },
    });

    // Recompute zakatableBase
    const adjustments = await prisma.zakatAdjustment.findMany({
            take: 100, where: { assessmentId } });
    const adjAdd = adjustments
      .filter(a => a.category === 'ADD')
      .reduce((s: any, a: any) => s + Number(a.amount), 0);
    const adjDeduct = adjustments
      .filter(a => a.category === 'DEDUCT')
      .reduce((s: any, a: any) => s + Number(a.amount), 0);

    const baseBeforeAdj =
      Number(assessment.equity) +
      Number(assessment.longTermLiabilities) +
      Number(assessment.netProfit) -
      Number(assessment.fixedAssetsBookValue) -
      Number(assessment.longTermInvestments);

    const ownership = Number(assessment.saudiOwnershipPct);
    const newBase = Math.max(0, (baseBeforeAdj + adjAdd - adjDeduct) * ownership);
    const newDue = newBase * 0.025;

    return prisma.zakatAssessment.update({
      where: { id: assessmentId },
      data: {
        adjustmentsTotal: new Prisma.Decimal(adjAdd - adjDeduct),
        zakatableBase: new Prisma.Decimal(newBase),
        zakatDue: new Prisma.Decimal(newDue),
      },
    });
  }

  /**
   * Finalize a draft → posts journal entry (Dr Zakat Expense / Cr Zakat Payable)
   * and locks the assessment to status FINALIZED.
   */
  static async finalize(assessmentId: number, userId: number) {
    const assessment = await prisma.zakatAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new Error('Assessment not found');
    if (assessment.status !== 'DRAFT') throw new Error('Already finalized');
    if (Number(assessment.zakatDue) <= 0) throw new Error('Zakat due is zero — nothing to post');

    // Resolve account IDs from Settings (with sensible defaults)
    const getAccountId = async (key: string, fallbackCode: string) => {
      const setting = await prisma.setting.findUnique({ where: { key } });
      const code = setting?.value || fallbackCode;
      const acc = await prisma.account.findFirst({ where: { code } });
      if (!acc) throw new Error(`Account not found for code ${code} (key=${key})`);
      return acc.id;
    };

    const expenseAccountId = await getAccountId('acc_zakat_expense', '5901'); // Default code
    const payableAccountId = await getAccountId('acc_zakat_payable', '2401');

    const zakatDue = Number(assessment.zakatDue);
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          entryNumber: `ZAKAT-${assessment.fiscalYearId}-${Date.now()}`,
          entryDate: now.toISOString(),
          description: `Zakat assessment for FY ${assessment.fiscalYearId} (Hijri ${assessment.hijriYear ?? '-'})`,
          status: 'posted',
          totalDebit: zakatDue,
          totalCredit: zakatDue,
          createdBy: userId,
          lines: {
            create: [
              { accountId: expenseAccountId, debit: zakatDue, credit: 0, description: 'مصروف الزكاة' },
              { accountId: payableAccountId, debit: 0, credit: zakatDue, description: 'الزكاة المستحقة' },
            ],
          },
        },
      });

      const updated = await tx.zakatAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'FINALIZED',
          journalEntryId: je.id,
        },
      });

      return { assessment: updated, journalEntryId: je.id };
    });
  }

  /**
   * Mark as filed (after submitting to ZATCA portal).
   */
  static async markFiled(assessmentId: number, userId: number, args: { zatcaTransactionId?: string; filingReference?: string }) {
    return prisma.zakatAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'FILED',
        filedAt: new Date(),
        filedByUserId: userId,
        zatcaTransactionId: args.zatcaTransactionId,
        filingReference: args.filingReference,
      },
    });
  }

  /**
   * Generate a JSON form export (placeholder for ZATCA Zakat declaration format).
   */
  static async generateForm(assessmentId: number) {
    const a = await prisma.zakatAssessment.findUnique({
      where: { id: assessmentId },
      include: { adjustments: true },
    });
    if (!a) throw new Error('Assessment not found');

    return {
      header: {
        fiscalYearId: a.fiscalYearId,
        hijriYear: a.hijriYear,
        assessmentDate: a.assessmentDate,
        status: a.status,
      },
      base: {
        equity: Number(a.equity),
        longTermLiabilities: Number(a.longTermLiabilities),
        netProfit: Number(a.netProfit),
        fixedAssetsBookValue: Number(a.fixedAssetsBookValue),
        longTermInvestments: Number(a.longTermInvestments),
      },
      adjustments: a.adjustments.map(adj => ({
        category: adj.category,
        description: adj.description,
        amount: Number(adj.amount),
      })),
      result: {
        zakatableBase: Number(a.zakatableBase),
        zakatRate: Number(a.zakatRate),
        zakatDue: Number(a.zakatDue),
        saudiOwnershipPct: Number(a.saudiOwnershipPct),
      },
      filing: {
        filedAt: a.filedAt,
        zatcaTransactionId: a.zatcaTransactionId,
        filingReference: a.filingReference,
      },
    };
  }

  /**
   * Convert Gregorian date to Hijri year (uses src/lib/hijri.ts if available).
   */
  private static async toHijriYear(date: Date): Promise<string> {
    try {
      const hijri = require('./hijri');
      if (typeof hijri.toHijri === 'function') {
        const result = hijri.toHijri(date);
        if (result?.year) return String(result.year);
      }
      if (typeof hijri.gregorianToHijri === 'function') {
        const result = hijri.gregorianToHijri(date);
        if (result?.year) return String(result.year);
      }
    } catch {
      // Fallback: rough approximation (Gregorian year - 622 + 1.0307)
    }
    const approxHijri = Math.floor(date.getFullYear() - 621.5645);
    return String(approxHijri);
  }
}
