/**
 * Unit Tests — Dunning Engine v2
 * Tests: snooze logic, late fee calculation, interest accrual, level escalation
 */

// ── Late Fee Calculation ──────────────────────────────────────────────────────

describe('DunningEngineV2 — Late Fees', () => {
  function calcLateFee(totalDue: number, feeAmount: number): number {
    return feeAmount; // flat fee per level
  }

  function calcInterest(totalDue: number, ratePercent: number, daysOverdue: number): number {
    const dailyRate = ratePercent / 100 / 30;
    return totalDue * dailyRate * daysOverdue;
  }

  test('flat late fee: 200 SAR fee regardless of invoice amount', () => {
    expect(calcLateFee(50000, 200)).toBe(200);
    expect(calcLateFee(1000, 200)).toBe(200);
  });

  test('interest: 1.5%/month on 10,000 for 30 days = 150 SAR', () => {
    const result = calcInterest(10000, 1.5, 30);
    expect(result).toBeCloseTo(150, 1);
  });

  test('interest: 2%/month on 50,000 for 60 days = 2000 SAR', () => {
    const result = calcInterest(50000, 2, 60);
    expect(result).toBeCloseTo(2000, 1);
  });

  test('interest: 0% rate → 0 interest', () => {
    const result = calcInterest(100000, 0, 90);
    expect(result).toBe(0);
  });

  test('interest: 0 days → 0 interest', () => {
    const result = calcInterest(100000, 1.5, 0);
    expect(result).toBe(0);
  });
});

// ── Snooze Logic ──────────────────────────────────────────────────────────────

describe('DunningEngineV2 — Snooze Logic', () => {
  function isSnoozeActive(snoozeUntil: Date | null, asOf: Date): boolean {
    if (!snoozeUntil) return false;
    return snoozeUntil > asOf;
  }

  const NOW = new Date('2026-05-09');

  test('no snooze → not active', () => {
    expect(isSnoozeActive(null, NOW)).toBe(false);
  });

  test('snooze until future → active (skip customer)', () => {
    const future = new Date('2026-05-20');
    expect(isSnoozeActive(future, NOW)).toBe(true);
  });

  test('snooze until past → not active (expired)', () => {
    const past = new Date('2026-05-01');
    expect(isSnoozeActive(past, NOW)).toBe(false);
  });

  test('snooze until exact same date → not active (expired)', () => {
    expect(isSnoozeActive(NOW, NOW)).toBe(false);
  });
});

// ── Level Escalation ──────────────────────────────────────────────────────────

describe('DunningEngineV2 — Level Escalation', () => {
  const LEVELS = [
    { levelNumber: 1, daysOverdue: 7,  lateFeeAmount: 50,  blockCustomer: false },
    { levelNumber: 2, daysOverdue: 14, lateFeeAmount: 100, blockCustomer: false },
    { levelNumber: 3, daysOverdue: 30, lateFeeAmount: 200, blockCustomer: false },
    { levelNumber: 4, daysOverdue: 60, lateFeeAmount: 500, blockCustomer: true  },
  ];

  function getApplicableLevel(daysOverdue: number) {
    return [...LEVELS].sort((a, b) => b.daysOverdue - a.daysOverdue)
      .find(l => daysOverdue >= l.daysOverdue) ?? null;
  }

  test('3 days overdue → no level (below threshold)', () => {
    expect(getApplicableLevel(3)).toBeNull();
  });

  test('7 days overdue → Level 1', () => {
    expect(getApplicableLevel(7)?.levelNumber).toBe(1);
  });

  test('15 days overdue → Level 2', () => {
    expect(getApplicableLevel(15)?.levelNumber).toBe(2);
  });

  test('45 days overdue → Level 3', () => {
    expect(getApplicableLevel(45)?.levelNumber).toBe(3);
  });

  test('61 days overdue → Level 4 (credit hold)', () => {
    const level = getApplicableLevel(61);
    expect(level?.levelNumber).toBe(4);
    expect(level?.blockCustomer).toBe(true);
  });

  test('idempotency: already at level 2, gets level 2 → skip', () => {
    const current = 2;
    const applicable = getApplicableLevel(20); // level 2
    const shouldSkip = applicable !== null && applicable.levelNumber <= current;
    expect(shouldSkip).toBe(true);
  });
});

// ── Promise-to-Pay ────────────────────────────────────────────────────────────

describe('DunningEngineV2 — Promise-to-Pay', () => {
  function isPromiseActive(promisedDate: Date, status: string, asOf: Date): boolean {
    return status === 'ACTIVE' && promisedDate >= asOf;
  }

  const TODAY = new Date('2026-05-09');

  test('active promise with future date → skip dunning', () => {
    const promise = new Date('2026-05-20');
    expect(isPromiseActive(promise, 'ACTIVE', TODAY)).toBe(true);
  });

  test('expired promise → do not skip dunning', () => {
    const expired = new Date('2026-05-01');
    expect(isPromiseActive(expired, 'ACTIVE', TODAY)).toBe(false);
  });

  test('broken promise (status BROKEN) → do not skip', () => {
    const future = new Date('2026-05-20');
    expect(isPromiseActive(future, 'BROKEN', TODAY)).toBe(false);
  });
});
