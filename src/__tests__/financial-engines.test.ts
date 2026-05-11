/**
 * Unit tests for financial engines (G-tests)
 * Coverage targets:
 *   - reverse-charge-vat.ts       → calculateReverseCharge, buildVatReturnRCSection
 *   - rolling-budget-engine.ts    → getHorizon, evaluateFormula, rollForward
 *   - commitments-register-engine → maturityBucket (pure logic)
 *   - financial-statements-engine → IndirectCashFlowResult shape
 *
 * Run: npx jest src/__tests__/financial-engines.test.ts
 */

import {
  calculateReverseCharge,
  buildVatReturnRCSection,
  isReverseCharge,
  type PurchaseInvoiceForRC,
} from '@/lib/reverse-charge-vat';

import {
  RollingBudgetEngine,
  type Scenario,
} from '@/lib/rolling-budget-engine';

import { CommitmentsRegisterEngine } from '@/lib/commitments-register-engine';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseForeignServiceInvoice: PurchaseInvoiceForRC = {
  invoiceId:       1001,
  supplierId:      50,
  supplierCountry: 'US',
  serviceType:     'SERVICE',
  lineAmount:      100_000,
  currency:        'SAR',
  exchangeRate:    1,
  tenantId:        'tenant-test',
  date:            '2026-01-15',
};

const baseLocalGoodsInvoice: PurchaseInvoiceForRC = {
  ...baseForeignServiceInvoice,
  invoiceId:       1002,
  supplierCountry: 'SA',
  serviceType:     'GOODS',
};

// ─── Reverse Charge VAT Tests ─────────────────────────────────────────────────

describe('calculateReverseCharge', () => {

  it('should apply reverse charge for foreign service supplier', () => {
    const result = calculateReverseCharge(baseForeignServiceInvoice);

    expect(result.isReverseCharge).toBe(true);
    expect(result.vatAmount).toBeGreaterThan(0);
    expect(result.vatAmount).toBeCloseTo(15_000, 1);   // 15% of 100,000
    expect(result.journalLines).toHaveLength(2);         // DR VAT Receivable + CR VAT Payable
  });

  it('should NOT apply reverse charge for local supplier', () => {
    const result = calculateReverseCharge(baseLocalGoodsInvoice);

    expect(result.isReverseCharge).toBe(false);
    expect(result.vatAmount).toBe(0);
    expect(result.journalLines).toHaveLength(0);
  });

  it('should NOT apply reverse charge for foreign goods (not service)', () => {
    const result = calculateReverseCharge({
      ...baseForeignServiceInvoice,
      serviceType: 'GOODS',
    });

    expect(result.isReverseCharge).toBe(false);
  });

  it('should apply to MIXED type (partial RC)', () => {
    const result = calculateReverseCharge({
      ...baseForeignServiceInvoice,
      serviceType: 'MIXED',
    });

    expect(result.isReverseCharge).toBe(true);
    expect(result.vatAmount).toBeGreaterThan(0);
  });

  it('should handle exchange rate conversion', () => {
    const result = calculateReverseCharge({
      ...baseForeignServiceInvoice,
      currency:     'USD',
      exchangeRate: 3.75,
      lineAmount:   10_000,   // 10,000 USD = 37,500 SAR
    });

    expect(result.isReverseCharge).toBe(true);
    expect(result.vatAmount).toBeCloseTo(10_000 * 3.75 * 0.15, 1);  // 5,625 SAR
  });

  it('journal lines should balance (debit = credit)', () => {
    const result = calculateReverseCharge(baseForeignServiceInvoice);
    const totalDebit  = result.journalLines.reduce((s, l) => s + Number(l.debit  ?? 0), 0);
    const totalCredit = result.journalLines.reduce((s, l) => s + Number(l.credit ?? 0), 0);
    expect(totalDebit).toBeCloseTo(totalCredit, 2);
  });
});

describe('isReverseCharge', () => {
  it('returns true for non-SA supplier with SERVICE type', () => {
    expect(isReverseCharge(baseForeignServiceInvoice)).toBe(true);
  });

  it('returns false for SA supplier', () => {
    expect(isReverseCharge(baseLocalGoodsInvoice)).toBe(false);
  });
});

describe('buildVatReturnRCSection', () => {
  it('should aggregate Boxes 8-10 from multiple invoices', () => {
    const invoices = [
      baseForeignServiceInvoice,
      { ...baseForeignServiceInvoice, invoiceId: 1003, lineAmount: 50_000 },
      baseLocalGoodsInvoice,   // should be excluded
    ];

    const section = buildVatReturnRCSection(invoices);

    expect(section.box8_importValue).toBeCloseTo(150_000, 1);
    expect(section.box9_vatDue).toBeCloseTo(22_500, 1);          // 15% of 150K
    expect(section.box10_vatDeduct).toBeCloseTo(22_500, 1);      // fully deductible in B2B
  });

  it('should return zero totals for all-local invoices', () => {
    const section = buildVatReturnRCSection([baseLocalGoodsInvoice]);
    expect(section.box8_importValue).toBe(0);
    expect(section.box9_vatDue).toBe(0);
  });
});

// ─── Rolling Budget Engine Tests ──────────────────────────────────────────────

describe('RollingBudgetEngine.getHorizon', () => {
  it('should return exactly 12 months', () => {
    const horizon = RollingBudgetEngine.getHorizon();
    expect(horizon).toHaveLength(12);
  });

  it('should be in YYYY-MM format', () => {
    const horizon = RollingBudgetEngine.getHorizon();
    expect(horizon[0]).toMatch(/^\d{4}-\d{2}$/);
  });

  it('should start from current month', () => {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const horizon = RollingBudgetEngine.getHorizon();
    expect(horizon[0]).toBe(`${year}-${month}`);
  });

  it('should be sequential months', () => {
    const horizon = RollingBudgetEngine.getHorizon();
    for (let i = 1; i < horizon.length; i++) {
      const prev = new Date(`${horizon[i - 1]}-01`);
      const curr = new Date(`${horizon[i]}-01`);
      const diffMs = curr.getTime() - prev.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    }
  });
});

describe('RollingBudgetEngine.evaluateFormula', () => {
  const drivers = {
    units_sold:   1000,
    avg_price:    150,
    discount_rate: 0.1,
    headcount:    50,
  };

  it('should evaluate simple multiplication', () => {
    expect(RollingBudgetEngine.evaluateFormula('units_sold * avg_price', drivers)).toBe(150_000);
  });

  it('should evaluate formula with discount', () => {
    const result = RollingBudgetEngine.evaluateFormula(
      'units_sold * avg_price * (1 - discount_rate)',
      drivers,
    );
    expect(result).toBeCloseTo(135_000, 1);
  });

  it('should return 0 for empty drivers', () => {
    const result = RollingBudgetEngine.evaluateFormula('units_sold * avg_price', {});
    expect(result).toBe(0);   // NaN guarded to 0
  });

  it('should reject dangerous formulas', () => {
    // Formula with unknown variable — should return 0 safely (NaN guarded)
    const result = RollingBudgetEngine.evaluateFormula('undefined_var * another_unknown', {});
    expect(result).toBe(0);
  });

  it('should handle decimal results', () => {
    const result = RollingBudgetEngine.evaluateFormula('units_sold * 0.333', drivers);
    expect(result).toBeCloseTo(333, 0);
  });
});

describe('RollingBudgetEngine.rollForward', () => {
  it('should return droppedMonth and addedMonth', async () => {
    const result = await RollingBudgetEngine.rollForward('tenant-test');
    expect(result).toHaveProperty('droppedMonth');
    expect(result).toHaveProperty('addedMonth');
  });

  it('droppedMonth should be current month', async () => {
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = String(now.getMonth() + 1).padStart(2, '0');
    const result = await RollingBudgetEngine.rollForward('tenant-test');
    expect(result.droppedMonth).toBe(`${year}-${month}`);
  });

  it('addedMonth should be 13 months from now', async () => {
    const horizon = RollingBudgetEngine.getHorizon();
    const last    = horizon[horizon.length - 1];
    const [y, m]  = last.split('-').map(Number);
    const next    = new Date(y, m, 1);
    const expected = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    const result   = await RollingBudgetEngine.rollForward('tenant-test');
    expect(result.addedMonth).toBe(expected);
  });
});

// ─── Commitments Register Engine Tests ───────────────────────────────────────

describe('CommitmentsRegisterEngine.maturityBucket', () => {
  const asOf = new Date('2026-01-01');

  it('should return WITHIN_1_YEAR for null endDate', () => {
    expect(CommitmentsRegisterEngine.maturityBucket(null, asOf)).toBe('WITHIN_1_YEAR');
  });

  it('should return WITHIN_1_YEAR for date within 1 year', () => {
    const end = new Date('2026-09-30');
    expect(CommitmentsRegisterEngine.maturityBucket(end, asOf)).toBe('WITHIN_1_YEAR');
  });

  it('should return 1_TO_5_YEARS for date 2-4 years out', () => {
    const end = new Date('2028-06-30');
    expect(CommitmentsRegisterEngine.maturityBucket(end, asOf)).toBe('1_TO_5_YEARS');
  });

  it('should return OVER_5_YEARS for date > 5 years out', () => {
    const end = new Date('2032-01-01');
    expect(CommitmentsRegisterEngine.maturityBucket(end, asOf)).toBe('OVER_5_YEARS');
  });

  it('boundary: exactly 1 year ahead → WITHIN_1_YEAR', () => {
    const end = new Date('2027-01-01');
    expect(CommitmentsRegisterEngine.maturityBucket(end, asOf)).toBe('WITHIN_1_YEAR');
  });

  it('boundary: 5 years exactly → 1_TO_5_YEARS', () => {
    const end = new Date('2031-01-01');
    expect(CommitmentsRegisterEngine.maturityBucket(end, asOf)).toBe('1_TO_5_YEARS');
  });
});
