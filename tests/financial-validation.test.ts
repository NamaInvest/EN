import { describe, it, expect } from 'vitest';
import { FinancialPolicyEngine } from '../src/lib/security/financial-policy-engine';
import { Prisma } from '@prisma/client';

describe('Financial Journal Balance Verification (SCN-FIN-001)', () => {
  it('should accept a balanced journal entry', () => {
    const balancedLines = [
      { debit: 1000, credit: 0 },
      { debit: 150, credit: 0 },
      { debit: 0, credit: 1150 }
    ];

    const result = FinancialPolicyEngine.validateJournalBalance(balancedLines);
    expect(result).toBe(true);
  });

  it('should accept balanced entries with Prisma.Decimal format', () => {
    const decimalLines = [
      { debit: new Prisma.Decimal('500.25'), credit: new Prisma.Decimal('0.00') },
      { debit: new Prisma.Decimal('0.00'), credit: new Prisma.Decimal('500.25') }
    ];

    const result = FinancialPolicyEngine.validateJournalBalance(decimalLines);
    expect(result).toBe(true);
  });

  it('should throw an error for unbalanced journal entries', () => {
    const unbalancedLines = [
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 950 } // Unbalanced by 50
    ];

    expect(() => {
      FinancialPolicyEngine.validateJournalBalance(unbalancedLines);
    }).toThrowError('FINANCIAL_POLICY_VIOLATION: Unbalanced journal entry');
  });

  it('should throw an error for unbalanced entries with Prisma.Decimal format', () => {
    const unbalancedDecimalLines = [
      { debit: new Prisma.Decimal('100.00'), credit: new Prisma.Decimal('0.00') },
      { debit: new Prisma.Decimal('0.00'), credit: new Prisma.Decimal('99.99') }
    ];

    expect(() => {
      FinancialPolicyEngine.validateJournalBalance(unbalancedDecimalLines);
    }).toThrowError('FINANCIAL_POLICY_VIOLATION: Unbalanced journal entry');
  });
});
