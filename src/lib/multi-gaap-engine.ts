import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'multi-gaap-engine' });

type GAAPlayer = 'IFRS' | 'SOCPA' | 'USGAAP' | 'STAT';

/**
 * F-06: Multi-GAAP Layered Ledger
 * JournalEntry fields: entryNumber, entryDate (String), totalDebit, totalCredit,
 *   status, bookId (use bookId to distinguish GAAP layer)
 */
export class MultiGAAPEngine {
  static async recordAdjustment(params: {
    tenantId: string;
    layer: GAAPlayer;
    accountId: number;
    debit: number;
    credit: number;
    entryDate: string;
    description: string;
    bookId?: number;
  }) {
    log.info(`Multi-GAAP adjustment: ${params.layer} layer`);
    return prisma.journalEntry.create({
      data: {
        tenantId: params.tenantId,
        entryNumber: `${params.layer}-ADJ-${Date.now()}`,
        description: params.description,
        totalDebit: params.debit,
        totalCredit: params.credit,
        status: 'posted',
        entryDate: params.entryDate,
        bookId: params.bookId,
      },
    });
  }

  /** Compare two accounting books (bookId) as proxy for GAAP layers */
  static async reconcileBooks(tenantId: string, baseBookId: number, compareBookId: number) {
    const [base, compare] = await Promise.all([
      prisma.journalEntry.findMany({ where: { tenantId, bookId: baseBookId, status: 'posted' } }),
      prisma.journalEntry.findMany({ where: { tenantId, bookId: compareBookId, status: 'posted' } }),
    ]);
    const baseDebit    = base.reduce((s, j)    => s + Number(j.totalDebit), 0);
    const compareDebit = compare.reduce((s, j) => s + Number(j.totalDebit), 0);
    return {
      baseBookId, compareBookId,
      baseDebit, compareDebit,
      delta: compareDebit - baseDebit,
    };
  }
}
