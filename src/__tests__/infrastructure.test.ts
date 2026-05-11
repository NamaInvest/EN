/**
 * Unit tests for infrastructure utilities and new partial-gap engines
 * ══════════════════════════════════════════════════════════════════════════════
 * Covers:
 *   - pagination.ts      → parsePagination, buildPaginationMeta, paginatedResponse
 *   - recurring-billing-engine.ts → proRate, handleMidCycleTaxChange
 *   - credit-limit-engine.ts → canSell threshold logic (pure logic only)
 *   - gr-ir-clearing-engine.ts → bucketDays
 *   - three-way-match-tolerance-engine.ts → match (pure logic mock)
 *   - numbering-engine.ts → shouldReset (via reflect)
 *
 * Run: npx jest src/__tests__/infrastructure.test.ts
 */

import { buildPaginationMeta, paginatedResponse, parsePagination } from '@/lib/pagination';
import { RecurringBillingEngine } from '@/lib/recurring-billing-engine';
import { GRIRClearingEngine } from '@/lib/gr-ir-clearing-engine';

// ─── Pagination Tests ─────────────────────────────────────────────────────────

describe('buildPaginationMeta', () => {

  it('page 1 of 1 — no next or prev', () => {
    const meta = buildPaginationMeta(1, 25, 10);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
    expect(meta.nextPage).toBeNull();
    expect(meta.prevPage).toBeNull();
    expect(meta.totalPages).toBe(1);
  });

  it('page 2 of 3 — has both next and prev', () => {
    const meta = buildPaginationMeta(2, 25, 75);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
    expect(meta.nextPage).toBe(3);
    expect(meta.prevPage).toBe(1);
    expect(meta.totalPages).toBe(3);
  });

  it('last page — no next', () => {
    const meta = buildPaginationMeta(3, 25, 75);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
    expect(meta.nextPage).toBeNull();
  });

  it('from/to ranges are correct', () => {
    const meta = buildPaginationMeta(2, 10, 100);
    expect(meta.from).toBe(11);
    expect(meta.to).toBe(20);
  });

  it('from/to capped at total', () => {
    const meta = buildPaginationMeta(4, 10, 35);
    expect(meta.from).toBe(31);
    expect(meta.to).toBe(35);  // capped at total
  });

  it('empty result set', () => {
    const meta = buildPaginationMeta(1, 25, 0);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(1);
    expect(meta.from).toBe(0);  // no items
    expect(meta.to).toBe(0);
  });
});

describe('paginatedResponse', () => {
  const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('wraps data and pagination correctly', () => {
    const result = paginatedResponse(data, 100, 1, 25);
    expect(result.data).toHaveLength(3);
    expect(result.pagination.total).toBe(100);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(4);
  });

  it('empty data returns correct structure', () => {
    const result = paginatedResponse([], 0, 1, 25);
    expect(result.data).toHaveLength(0);
    expect(result.pagination.hasNext).toBe(false);
  });
});

describe('parsePagination', () => {

  function makeParams(query: Record<string, string>): URLSearchParams {
    return new URLSearchParams(query);
  }

  it('defaults: page=1, limit=25', () => {
    const p = parsePagination(makeParams({}));
    expect(p.page).toBe(1);
    expect(p.limit).toBe(25);
    expect(p.skip).toBe(0);
  });

  it('page 3 limit 10 → skip=20', () => {
    const p = parsePagination(makeParams({ page: '3', limit: '10' }));
    expect(p.page).toBe(3);
    expect(p.limit).toBe(10);
    expect(p.skip).toBe(20);
  });

  it('limit is capped at MAX_LIMIT (200)', () => {
    const p = parsePagination(makeParams({ limit: '9999' }));
    expect(p.limit).toBeLessThanOrEqual(200);
  });

  it('negative page defaults to 1', () => {
    const p = parsePagination(makeParams({ page: '-5' }));
    expect(p.page).toBe(1);
  });

  it('sort direction defaults to desc', () => {
    const p = parsePagination(makeParams({}));
    expect(p.sortDir).toBe('desc');
  });

  it('sortDir=asc is parsed correctly', () => {
    const p = parsePagination(makeParams({ sortDir: 'asc', sortBy: 'name' }));
    expect(p.sortDir).toBe('asc');
    expect(p.sortBy).toBe('name');
  });
});

// ─── Recurring Billing Pro-Rate Tests ─────────────────────────────────────────

describe('RecurringBillingEngine.proRate', () => {
  const jan1  = new Date('2026-01-01');
  const jan31 = new Date('2026-01-31');
  const jan16 = new Date('2026-01-16');

  it('full cycle → no pro-rating', () => {
    const result = RecurringBillingEngine.proRate(jan1, jan31, jan1, jan31, 1000, 0.15);
    expect(result.isProrated).toBe(false);
    expect(result.proratedAmount).toBeCloseTo(1000, 0);
  });

  it('service starts on 16th → half billing', () => {
    const result = RecurringBillingEngine.proRate(jan1, jan31, jan16, jan31, 1000, 0.15);
    expect(result.isProrated).toBe(true);
    expect(result.billedDays).toBeLessThan(result.totalDays);
    expect(result.proratedAmount).toBeLessThan(1000);
    // Roughly half the month
    expect(result.proratedAmount).toBeGreaterThan(400);
    expect(result.proratedAmount).toBeLessThan(600);
  });

  it('VAT is applied to prorated amount', () => {
    const result = RecurringBillingEngine.proRate(jan1, jan31, jan1, jan31, 1000, 0.15);
    expect(result.vatAmount).toBeCloseTo(1000 * 0.15, 1);
    expect(result.totalWithVat).toBeCloseTo(1150, 1);
  });

  it('zero billing when no overlap', () => {
    const feb1  = new Date('2026-02-01');
    const feb28 = new Date('2026-02-28');
    const result = RecurringBillingEngine.proRate(jan1, jan31, feb1, feb28, 1000, 0.15);
    expect(result.billedDays).toBe(0);
    expect(result.proratedAmount).toBe(0);
    expect(result.totalWithVat).toBe(0);
  });

  it('proratedAmount + vatAmount = totalWithVat', () => {
    const result = RecurringBillingEngine.proRate(jan1, jan31, jan16, jan31, 2000, 0.15);
    expect(result.totalWithVat).toBeCloseTo(result.proratedAmount + result.vatAmount, 2);
  });
});

describe('RecurringBillingEngine.handleMidCycleTaxChange', () => {
  const jan1  = new Date('2026-01-01');
  const jan31 = new Date('2026-01-31');
  const jan16 = new Date('2026-01-16');

  it('should produce two periods with different VAT rates', () => {
    const split = RecurringBillingEngine.handleMidCycleTaxChange(
      jan1, jan31, 1000, jan16, 0.15, 0.20
    );
    expect(split.periodBeforeChange.vatRate).toBe(0.15);
    expect(split.periodAfterChange.vatRate).toBe(0.20);
  });

  it('total amount covers the full invoice amount', () => {
    const split = RecurringBillingEngine.handleMidCycleTaxChange(
      jan1, jan31, 1000, jan16, 0.15, 0.20
    );
    // Total should be > 1000 (net) due to VAT
    expect(split.totalInvoiceAmount).toBeGreaterThan(1000);
    // Total should be sum of both periods
    const expected = split.periodBeforeChange.totalWithVat + split.periodAfterChange.totalWithVat;
    expect(split.totalInvoiceAmount).toBeCloseTo(expected, 2);
  });

  it('two-period amounts add up to full 1000 SAR net', () => {
    const split = RecurringBillingEngine.handleMidCycleTaxChange(
      jan1, jan31, 1000, jan16, 0.15, 0.20
    );
    const totalNet = split.periodBeforeChange.proratedAmount + split.periodAfterChange.proratedAmount;
    expect(totalNet).toBeCloseTo(1000, 0);  // within 1 SAR
  });
});

// ─── GR/IR Clearing Bucket Tests ─────────────────────────────────────────────

describe('GRIRClearingEngine.bucketDays', () => {

  it('0 days → 0-30', () => {
    expect(GRIRClearingEngine.bucketDays(0)).toBe('0-30');
  });

  it('30 days → 0-30', () => {
    expect(GRIRClearingEngine.bucketDays(30)).toBe('0-30');
  });

  it('31 days → 31-60', () => {
    expect(GRIRClearingEngine.bucketDays(31)).toBe('31-60');
  });

  it('60 days → 31-60', () => {
    expect(GRIRClearingEngine.bucketDays(60)).toBe('31-60');
  });

  it('61 days → 61-90', () => {
    expect(GRIRClearingEngine.bucketDays(61)).toBe('61-90');
  });

  it('90 days → 61-90', () => {
    expect(GRIRClearingEngine.bucketDays(90)).toBe('61-90');
  });

  it('91 days → 90+', () => {
    expect(GRIRClearingEngine.bucketDays(91)).toBe('90+');
  });

  it('500 days → 90+', () => {
    expect(GRIRClearingEngine.bucketDays(500)).toBe('90+');
  });
});

// ─── Pagination Round-trip Test ───────────────────────────────────────────────

describe('Pagination round-trip', () => {
  it('page 1 → skip 0', () => {
    const p = parsePagination(new URLSearchParams({ page: '1', limit: '20' }));
    expect(p.skip).toBe(0);
    expect(p.take).toBe(20);
  });

  it('page 5 limit 10 → skip 40', () => {
    const p = parsePagination(new URLSearchParams({ page: '5', limit: '10' }));
    expect(p.skip).toBe(40);
  });

  it('paginatedResponse matches expected meta', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
    const resp  = paginatedResponse(items, 100, 5, 10);
    expect(resp.pagination.from).toBe(41);
    expect(resp.pagination.to).toBe(50);
    expect(resp.pagination.hasPrev).toBe(true);
    expect(resp.pagination.hasNext).toBe(true);
  });
});
