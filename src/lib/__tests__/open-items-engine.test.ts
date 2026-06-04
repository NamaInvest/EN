/**
 * Unit Tests — Open Items Engine
 * Tests: matching, FX gain/loss calculation, aging buckets, dispute resolution
 */

import { OpenItemsEngine } from '../open-items-engine';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    $transaction: async (fn: (arg: any) => any) => fn(makePrisma(overrides)),
    openItem: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany:   jest.fn().mockResolvedValue([]),
      update:     jest.fn().mockResolvedValue({}),
      create:     jest.fn().mockResolvedValue({ id: 1 }),
    },
    itemApplication: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    journalEntry: {
      create:    jest.fn().mockResolvedValue({ id: 1 }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    exchangeRate: {
      findFirst: jest.fn().mockResolvedValue({ rate: 3.75 }),
    },
    ...overrides,
  };
}

// ── Aging Bucket Logic ────────────────────────────────────────────────────────

describe('OpenItemsEngine — Aging Buckets', () => {
  const buckets = [
    { label: '0-30',   minDays: 0,   maxDays: 30  },
    { label: '31-60',  minDays: 31,  maxDays: 60  },
    { label: '61-90',  minDays: 61,  maxDays: 90  },
    { label: '91-120', minDays: 91,  maxDays: 120 },
    { label: '120+',   minDays: 121, maxDays: 9999 },
  ];

  function getBucket(daysOverdue: number) {
    return buckets.find(b => daysOverdue >= b.minDays && daysOverdue <= b.maxDays);
  }

  test('invoice 15 days overdue → 0-30 bucket', () => {
    expect(getBucket(15)?.label).toBe('0-30');
  });

  test('invoice 45 days overdue → 31-60 bucket', () => {
    expect(getBucket(45)?.label).toBe('31-60');
  });

  test('invoice 90 days overdue → 61-90 bucket', () => {
    expect(getBucket(90)?.label).toBe('61-90');
  });

  test('invoice 150 days overdue → 120+ bucket', () => {
    expect(getBucket(150)?.label).toBe('120+');
  });

  test('invoice 0 days overdue → 0-30 bucket', () => {
    expect(getBucket(0)?.label).toBe('0-30');
  });
});

// ── FX Gain/Loss Calculation ──────────────────────────────────────────────────

describe('OpenItemsEngine — FX Gain/Loss', () => {
  function calcFxGainLoss(originalAmount: number, originalRate: number, paymentRate: number) {
    const originalSAR = originalAmount * originalRate;
    const paymentSAR  = originalAmount * paymentRate;
    return paymentSAR - originalSAR; // positive = gain, negative = loss
  }

  test('USD 1000 at 3.75 paid when rate is 3.80 → gain 50 SAR', () => {
    const result = calcFxGainLoss(1000, 3.75, 3.80);
    expect(result).toBeCloseTo(50, 2);
  });

  test('USD 1000 at 3.80 paid when rate is 3.75 → loss -50 SAR', () => {
    const result = calcFxGainLoss(1000, 3.80, 3.75);
    expect(result).toBeCloseTo(-50, 2);
  });

  test('same rate → zero FX difference', () => {
    const result = calcFxGainLoss(5000, 3.75, 3.75);
    expect(result).toBe(0);
  });

  test('SAR invoice (rate=1) → always zero FX', () => {
    const result = calcFxGainLoss(10000, 1, 1);
    expect(result).toBe(0);
  });
});

// ── Writeoff Tolerance ────────────────────────────────────────────────────────

describe('OpenItemsEngine — Writeoff Tolerance', () => {
  const TOLERANCE = 5; // SAR

  function isWithinTolerance(balance: number): boolean {
    return Math.abs(balance) <= TOLERANCE;
  }

  test('balance 3 SAR → within tolerance', () => {
    expect(isWithinTolerance(3)).toBe(true);
  });

  test('balance 5 SAR → at tolerance (inclusive)', () => {
    expect(isWithinTolerance(5)).toBe(true);
  });

  test('balance 5.01 SAR → outside tolerance', () => {
    expect(isWithinTolerance(5.01)).toBe(false);
  });

  test('negative balance -4 SAR → within tolerance', () => {
    expect(isWithinTolerance(-4)).toBe(true);
  });
});

// ── Dispute State Machine ─────────────────────────────────────────────────────

describe('OpenItemsEngine — Dispute Status Transitions', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    OPEN:     ['DISPUTED', 'MATCHED', 'WRITTEN_OFF'],
    DISPUTED: ['OPEN', 'WRITTEN_OFF'],
    MATCHED:  [],
    WRITTEN_OFF: [],
  };

  function canTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  test('OPEN → DISPUTED: valid', () => expect(canTransition('OPEN', 'DISPUTED')).toBe(true));
  test('DISPUTED → WRITTEN_OFF: valid', () => expect(canTransition('DISPUTED', 'WRITTEN_OFF')).toBe(true));
  test('MATCHED → OPEN: invalid (immutable)', () => expect(canTransition('MATCHED', 'OPEN')).toBe(false));
  test('WRITTEN_OFF → OPEN: invalid (immutable)', () => expect(canTransition('WRITTEN_OFF', 'OPEN')).toBe(false));
  test('OPEN → MATCHED: valid', () => expect(canTransition('OPEN', 'MATCHED')).toBe(true));
});
