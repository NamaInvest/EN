import { Prisma } from '@prisma/client';

export class FinancialPolicyEngine {
  /**
   * Enforces that all accounting journal entries are balanced (Debits == Credits).
   */
  static validateJournalBalance(lines: { debit: number | Prisma.Decimal; credit: number | Prisma.Decimal }[]) {
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);

    // Using a small epsilon to account for floating point inaccuracies if any
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`FINANCIAL_POLICY_VIOLATION: Unbalanced journal entry. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }
    
    return true;
  }

  /**
   * Ensures that no mutations are performed on closed fiscal periods.
   */
  static async validateFiscalPeriod(tx: any, tenantId: string, date: Date) {
    const period = await tx.fiscalPeriod.findFirst({
      where: {
        tenantId,
        startDate: { lte: date },
        endDate: { gte: date }
      }
    });

    if (!period) {
      throw new Error('FINANCIAL_POLICY_VIOLATION: No active fiscal period found for the given date.');
    }

    if (period.status === 'CLOSED') {
      throw new Error('FINANCIAL_POLICY_VIOLATION: Cannot post transactions into a closed fiscal period.');
    }

    return true;
  }
}
