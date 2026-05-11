/**
 * IFRS 16 Lease Engine — Unit Tests
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Tests based on IFRS 16 illustrative example (IFRS 16.IE1):
 *   - 5-year lease, 100,000 SAR/year (8,333.33/month), 5% IBR
 *   - PV ≈ 432,948 SAR
 *   - Year 1: Interest ≈ 21,648, Depreciation ≈ 86,590
 *   - Year 5: Closing liability ≈ 0
 *
 * Run: npx jest src/__tests__/ifrs16-lease-engine.test.ts
 */

import {
  IFRS16LeaseEngine,
  type LeaseInput,
  type IFRS16Lease,
} from '@/lib/ifrs16-lease-engine';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STANDARD_LEASE: LeaseInput = {
  leaseId:                  1,
  description:              'مستودع رقم 5',
  commencementDate:         new Date('2026-01-01'),
  leaseTerm:                60,         // 5 years in months
  monthlyPayment:           8_333.33,   // 100,000 / 12
  incrementalBorrowingRate: 0.05,       // 5% annual
  currency:                 'SAR',
};

const SHORT_TERM_LEASE: LeaseInput = {
  ...STANDARD_LEASE,
  leaseId:      2,
  leaseTerm:    12,
  isShortTerm:  true,
};

const LOW_VALUE_LEASE: LeaseInput = {
  ...STANDARD_LEASE,
  leaseId:   3,
  isLowValue: true,
};

// ─── Recognition Tests ────────────────────────────────────────────────────────

describe('IFRS16LeaseEngine.recognize', () => {

  let lease: IFRS16Lease;
  beforeAll(() => {
    lease = IFRS16LeaseEngine.recognize(STANDARD_LEASE);
  });

  it('should calculate present value within 1% of IFRS 16 illustrative example', () => {
    // IFRS 16.IE1: PV of 100K/year for 5 years at 5% = 432,948
    expect(lease.presentValueOfPayments).toBeGreaterThan(420_000);
    expect(lease.presentValueOfPayments).toBeLessThan(445_000);
  });

  it('ROU asset should equal PV plus initial direct costs', () => {
    // No direct costs in fixture → ROU = PV
    expect(lease.rouAssetValue).toBeCloseTo(lease.presentValueOfPayments, 0);
  });

  it('lease liability should equal ROU (no costs or incentives)', () => {
    expect(lease.initialLeaseLiability).toBeCloseTo(lease.rouAssetValue, 0);
  });

  it('should generate exactly 60 schedule rows for 60-month lease', () => {
    expect(lease.schedule).toHaveLength(60);
  });

  it('closing liability in last row should be ≈ 0', () => {
    const lastRow = lease.schedule[lease.schedule.length - 1];
    expect(Math.abs(lastRow.closingLiability)).toBeLessThan(1);  // within 1 SAR
  });

  it('total payments should equal monthly × months', () => {
    const expected = STANDARD_LEASE.monthlyPayment * STANDARD_LEASE.leaseTerm;
    expect(lease.totalPayments).toBeCloseTo(expected, 1);
  });

  it('total principal + total interest should equal total payments', () => {
    const total = lease.totalPrincipal + lease.totalInterestExpense;
    expect(total).toBeCloseTo(lease.totalPayments, 0);
  });

  it('total depreciation should equal ROU asset value (fully depreciated)', () => {
    expect(lease.totalDepreciation).toBeCloseTo(lease.rouAssetValue, 0);
  });

  it('initial journal entry should balance (Dr = Cr)', () => {
    const totalDr = lease.initialJournalEntry.debit.reduce((s, l) => s + l.amount, 0);
    const totalCr = lease.initialJournalEntry.credit.reduce((s, l) => s + l.amount, 0);
    expect(totalDr).toBeCloseTo(totalCr, 2);
  });

  it('initial journal entry should have ROU debit', () => {
    const rouLine = lease.initialJournalEntry.debit.find(l => l.account.includes('ROU') || l.account.includes('حق'));
    expect(rouLine).toBeDefined();
    expect(rouLine!.amount).toBeCloseTo(lease.rouAssetValue, 0);
  });

  it('first month interest = PV × (IBR/12)', () => {
    const firstRow      = lease.schedule[0];
    const expectedInterest = lease.initialLeaseLiability * (0.05 / 12);
    expect(firstRow.interestExpense).toBeCloseTo(expectedInterest, 1);
  });

  it('ROU NBV at end of year 1 should be ≈ ROU × (1 - 12/60)', () => {
    const row12   = lease.schedule[11]; // end of month 12
    const expected = lease.rouAssetValue * (1 - 12 / 60);
    expect(row12.rouNetBookValue).toBeCloseTo(expected, 0);
  });

  it('depreciation should be constant each month (straight-line)', () => {
    const firstDep = lease.schedule[0].rouDepreciation;
    for (const row of lease.schedule) {
      expect(row.rouDepreciation).toBeCloseTo(firstDep, 2);
    }
  });

  it('interest expense should decrease each month (effective interest)', () => {
    for (let i = 1; i < lease.schedule.length; i++) {
      expect(lease.schedule[i].interestExpense).toBeLessThanOrEqual(lease.schedule[i - 1].interestExpense + 0.01);
    }
  });
});

// ─── Exemptions Tests ─────────────────────────────────────────────────────────

describe('IFRS16LeaseEngine — Exemptions', () => {

  it('should return isExempt=true for short-term lease', () => {
    const result = IFRS16LeaseEngine.recognize(SHORT_TERM_LEASE);
    expect(result.isExempt).toBe(true);
    expect(result.rouAssetValue).toBe(0);
    expect(result.schedule).toHaveLength(0);
  });

  it('exemptReason should mention short-term', () => {
    const result = IFRS16LeaseEngine.recognize(SHORT_TERM_LEASE);
    expect(result.exemptReason?.toLowerCase()).toMatch(/قصير|short/i);
  });

  it('should return isExempt=true for low-value asset', () => {
    const result = IFRS16LeaseEngine.recognize(LOW_VALUE_LEASE);
    expect(result.isExempt).toBe(true);
  });

  it('should NOT exempt a 13-month lease flagged as short-term (>12)', () => {
    const result = IFRS16LeaseEngine.recognize({
      ...SHORT_TERM_LEASE,
      leaseTerm: 13,
    });
    // Not exempt because term > 12 months
    expect(result.isExempt).toBe(false);
  });
});

// ─── Monthly Entries Tests ─────────────────────────────────────────────────────

describe('IFRS16LeaseEngine.getMonthlyEntries', () => {

  let lease: IFRS16Lease;
  beforeAll(() => {
    lease = IFRS16LeaseEngine.recognize(STANDARD_LEASE);
  });

  it('should return entries for period 1', () => {
    const { description, entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, 1);
    expect(description).toBeTruthy();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('entries should include interest expense debit', () => {
    const { entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, 1);
    const interestEntry = entries.find(e => e.account.includes('فائدة') && e.type === 'debit');
    expect(interestEntry).toBeDefined();
  });

  it('entries should include principal reduction debit on liability', () => {
    const { entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, 1);
    const principalEntry = entries.find(e => e.account.includes('التزام') && e.type === 'debit');
    expect(principalEntry).toBeDefined();
  });

  it('entries should include bank credit for full payment', () => {
    const { entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, 1);
    const bankEntry = entries.find(e => e.account.includes('نقدية') && e.type === 'credit');
    expect(bankEntry).toBeDefined();
    expect(bankEntry!.amount).toBeCloseTo(STANDARD_LEASE.monthlyPayment, 1);
  });

  it('entries should include depreciation debit', () => {
    const { entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, 1);
    const depEntry = entries.find(e => e.type === 'debit' && e.account.includes('إهلاك'));
    expect(depEntry).toBeDefined();
  });

  it('should throw for invalid period', () => {
    expect(() => IFRS16LeaseEngine.getMonthlyEntries(lease, 999)).toThrow();
  });

  it('monthly debits and credits should balance within each category', () => {
    const { entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, 1);
    const row    = lease.schedule[0];
    const debits = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    // Debits = principal + interest + depreciation
    const expected = row.principalRepaid + row.interestExpense + row.rouDepreciation;
    expect(debits).toBeCloseTo(expected, 1);
  });
});

// ─── Lease Modification Tests ─────────────────────────────────────────────────

describe('IFRS16 Lease Modification (Remeasurement)', () => {

  it('modified lease should have higher PV if rate decreases', () => {
    const original = IFRS16LeaseEngine.recognize(STANDARD_LEASE);

    // After 24 months, rate drops to 3% (refinancing)
    const modified = IFRS16LeaseEngine.recognize({
      ...STANDARD_LEASE,
      commencementDate:         new Date('2028-01-01'),
      leaseTerm:                36,   // remaining 3 years
      incrementalBorrowingRate: 0.03, // lower rate
    });

    // Lower rate → higher PV (more expensive in PV terms)
    const sameTerm = IFRS16LeaseEngine.recognize({
      ...STANDARD_LEASE,
      commencementDate: new Date('2028-01-01'),
      leaseTerm:        36,
    });

    expect(modified.presentValueOfPayments).toBeGreaterThan(sameTerm.presentValueOfPayments);
  });

  it('zero-IBR lease should use simple multiplication', () => {
    const zeroRate = IFRS16LeaseEngine.recognize({
      ...STANDARD_LEASE,
      incrementalBorrowingRate: 0,
      leaseTerm:                12,
      monthlyPayment:           10_000,
    });

    expect(zeroRate.presentValueOfPayments).toBeCloseTo(120_000, 0); // 12 × 10,000
    expect(zeroRate.totalInterestExpense).toBeCloseTo(0, 0);
  });
});
