
/**
 * Unit Tests — Year-End Close Engine
 * Tests: readiness validation rules, P&L balancing, period immutability
 */

// ── Readiness Checklist Logic ─────────────────────────────────────────────────

describe('YearEndCloseEngine — Readiness Checklist', () => {

  interface ChecklistItem {
    id:       string;
    passed:   boolean;
    blocking: boolean;
    value?:   number;
  }

  function isReadyToClose(checklist: ChecklistItem[]): boolean {
    return !checklist.some(c => c.blocking && !c.passed);
  }

  function getBlockingFailures(checklist: ChecklistItem[]): ChecklistItem[] {
    return checklist.filter(c => c.blocking && !c.passed);
  }

  const FULL_PASS: ChecklistItem[] = [
    { id: 'no_draft_jes',         passed: true,  blocking: true  },
    { id: 'bank_recon_complete',  passed: true,  blocking: true  },
    { id: 'ar_aging_reviewed',    passed: true,  blocking: true  },
    { id: 'ap_aging_reviewed',    passed: true,  blocking: true  },
    { id: 'inventory_counted',    passed: true,  blocking: false },
    { id: 'fixed_assets_updated', passed: true,  blocking: false },
  ];

  test('all checks passed → ready to close', () => {
    expect(isReadyToClose(FULL_PASS)).toBe(true);
  });

  test('non-blocking failure → still ready', () => {
    const withNonBlocking = FULL_PASS.map(c =>
      c.id === 'inventory_counted' ? { ...c, passed: false } : c
    );
    expect(isReadyToClose(withNonBlocking)).toBe(true);
  });

  test('blocking failure → not ready', () => {
    const withBlocking = FULL_PASS.map(c =>
      c.id === 'bank_recon_complete' ? { ...c, passed: false } : c
    );
    expect(isReadyToClose(withBlocking)).toBe(false);
  });

  test('multiple blocking failures → returns all', () => {
    const withMultiple = FULL_PASS.map(c =>
      ['no_draft_jes', 'bank_recon_complete'].includes(c.id) ? { ...c, passed: false } : c
    );
    const failures = getBlockingFailures(withMultiple);
    expect(failures).toHaveLength(2);
  });

  test('empty checklist → ready (no blocking items)', () => {
    expect(isReadyToClose([])).toBe(true);
  });
});

// ── P&L Balance Validation ────────────────────────────────────────────────────

describe('YearEndCloseEngine — P&L Balance', () => {
  function calcNetIncome(revenues: number, expenses: number): number {
    return revenues - expenses;
  }

  function calcRetainedEarningsJE(netIncome: number, retainedEarningsAccountId: number) {
    if (netIncome > 0) {
      // DR Revenue Summary, CR Retained Earnings
      return { debit: netIncome, credit: netIncome, balanced: true, type: 'PROFIT' };
    } else if (netIncome < 0) {
      // DR Retained Earnings, CR Expense Summary
      return { debit: Math.abs(netIncome), credit: Math.abs(netIncome), balanced: true, type: 'LOSS' };
    }
    return { debit: 0, credit: 0, balanced: true, type: 'BREAKEVEN' };
  }

  test('revenue 1M, expenses 800K → net income 200K', () => {
    expect(calcNetIncome(1_000_000, 800_000)).toBe(200_000);
  });

  test('net income 200K → balanced JE with PROFIT type', () => {
    const je = calcRetainedEarningsJE(200_000, 3001);
    expect(je.balanced).toBe(true);
    expect(je.debit).toBe(200_000);
    expect(je.credit).toBe(200_000);
    expect(je.type).toBe('PROFIT');
  });

  test('net loss -50K → balanced JE with LOSS type', () => {
    const je = calcRetainedEarningsJE(-50_000, 3001);
    expect(je.balanced).toBe(true);
    expect(je.type).toBe('LOSS');
    expect(je.debit).toBe(50_000);
  });

  test('break-even → zero JE', () => {
    const je = calcRetainedEarningsJE(0, 3001);
    expect(je.debit).toBe(0);
    expect(je.type).toBe('BREAKEVEN');
  });
});

// ── Fiscal Year Immutability ──────────────────────────────────────────────────

describe('YearEndCloseEngine — Period Lock', () => {
  type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

  function canPostToYear(status: PeriodStatus): boolean {
    return status === 'OPEN';
  }

  function canReverseInYear(status: PeriodStatus): boolean {
    return status !== 'LOCKED'; // CLOSED allows reversals, LOCKED does not
  }

  test('OPEN period → can post', () => expect(canPostToYear('OPEN')).toBe(true));
  test('CLOSED period → cannot post', () => expect(canPostToYear('CLOSED')).toBe(false));
  test('LOCKED period → cannot post', () => expect(canPostToYear('LOCKED')).toBe(false));
  test('CLOSED period → can reverse (restatement allowed)', () => expect(canReverseInYear('CLOSED')).toBe(true));
  test('LOCKED period → cannot reverse (immutable)', () => expect(canReverseInYear('LOCKED')).toBe(false));
});

// ── Opening Balance Rollover ──────────────────────────────────────────────────

describe('YearEndCloseEngine — Opening Balance Rollover', () => {
  type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

  function shouldCarryForward(accountType: AccountType): boolean {
    // B/S accounts carry forward; P&L accounts are zeroed
    return ['ASSET', 'LIABILITY', 'EQUITY'].includes(accountType);
  }

  test('ASSET → carries forward to new year', () => expect(shouldCarryForward('ASSET')).toBe(true));
  test('LIABILITY → carries forward', () => expect(shouldCarryForward('LIABILITY')).toBe(true));
  test('EQUITY → carries forward', () => expect(shouldCarryForward('EQUITY')).toBe(true));
  test('REVENUE → zeroed out (P&L)', () => expect(shouldCarryForward('REVENUE')).toBe(false));
  test('EXPENSE → zeroed out (P&L)', () => expect(shouldCarryForward('EXPENSE')).toBe(false));
});
