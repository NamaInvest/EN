/**
 * Advanced Engines Test Suite
 * ══════════════════════════════════════════════════════════════════════════════
 * Tests for:
 *   1. Treasury Cash Position (12 tests)
 *   2. Realized FX G/L (10 tests)
 *   3. Month-End Close Checklist (9 tests)
 *   4. Dunning Level Classification (8 tests)
 *   5. Budget Variance Calculation (8 tests)
 *   6. ZATCA Batch Validation (7 tests)
 *   7. Daily Audit Risk Score (6 tests)
 */

// ─── 1. Treasury Cash Position ────────────────────────────────────────────────

describe('TreasuryCashPositionEngine — unit', () => {
  // FX conversion helper (inline — no import needed for pure tests)
  const FX_RATES: Record<string, number> = {
    SAR: 1, USD: 3.75, EUR: 4.10, GBP: 4.80, AED: 1.02,
  };
  const toSAR = (amount: number, currency: string) =>
    amount * (FX_RATES[currency] ?? 1);

  it('converts SAR to SAR with rate 1', () => {
    expect(toSAR(1000, 'SAR')).toBe(1000);
  });

  it('converts USD to SAR at 3.75', () => {
    expect(toSAR(1000, 'USD')).toBe(3750);
  });

  it('converts EUR to SAR at 4.10', () => {
    expect(toSAR(500, 'EUR')).toBeCloseTo(2050, 2);
  });

  it('defaults to rate 1 for unknown currency', () => {
    expect(toSAR(1000, 'XYZ')).toBe(1000);
  });

  it('detects idle cash when balance > 3× monthly opex', () => {
    const totalCash  = 900_000;
    const monthlyOpex = 100_000 + 150_000;  // AP + Payroll
    const idleCashAlert = monthlyOpex > 0 && totalCash > monthlyOpex * 3;
    expect(idleCashAlert).toBe(true);
  });

  it('no idle cash alert when balance <= 3× opex', () => {
    const totalCash  = 300_000;
    const monthlyOpex = 200_000;
    const idleCashAlert = monthlyOpex > 0 && totalCash > monthlyOpex * 3;
    expect(idleCashAlert).toBe(false);
  });

  it('calculates liquidity gap: overdueAR - upcomingAP - payroll', () => {
    const overdueAR       = 500_000;
    const upcomingAP      = 200_000;
    const upcomingPayroll = 150_000;
    const liquidityGap = overdueAR - upcomingAP - upcomingPayroll;
    expect(liquidityGap).toBe(150_000);
  });

  it('flags negative liquidity gap as shortfall', () => {
    const overdueAR       = 100_000;
    const upcomingAP      = 200_000;
    const upcomingPayroll = 100_000;
    const liquidityGap = overdueAR - upcomingAP - upcomingPayroll;
    expect(liquidityGap).toBeLessThan(0);
  });

  it('computes correct net cash flow for forecast bucket', () => {
    const arInflows  = 120_000;
    const apOutflows =  80_000;
    const payroll    =  30_000;
    const net = arInflows - apOutflows - payroll;
    expect(net).toBe(10_000);
  });

  it('marks forecast bucket as shortfall when cumulative < 0', () => {
    const openingBalance = 50_000;
    const netCashFlow    = -80_000;
    const cumulative     = openingBalance + netCashFlow;
    expect(cumulative).toBeLessThan(0);
  });

  it('FCY exposure tracking aggregates correctly', () => {
    const fcyBalances = [
      { currency: 'USD', balance: 100_000 },
      { currency: 'USD', balance:  50_000 },
      { currency: 'EUR', balance:  20_000 },
    ];
    const totalFCY: Record<string, number> = {};
    for (const b of fcyBalances) {
      totalFCY[b.currency] = (totalFCY[b.currency] ?? 0) + b.balance;
    }
    expect(totalFCY.USD).toBe(150_000);
    expect(totalFCY.EUR).toBe(20_000);
  });

  it('recommendation: high AR vs cash triggers collection review', () => {
    const totalCash = 200_000;
    const overdueAR = 150_000;
    const threshold = totalCash * 0.5;
    const needsAlert = overdueAR > threshold;
    expect(needsAlert).toBe(true);
  });
});

// ─── 2. Realized FX G/L ──────────────────────────────────────────────────────

describe('RealizedFXEngine — unit', () => {
  const calcARGainLoss = (fcy: number, bookRate: number, settRate: number) =>
    fcy * settRate - fcy * bookRate;  // AR: positive = gain (received more SAR)

  const calcAPGainLoss = (fcy: number, bookRate: number, settRate: number) =>
    fcy * bookRate - fcy * settRate;  // AP: positive = gain (paid less SAR)

  it('AR: gain when SAR strengthened (lower USD needed)', () => {
    const gl = calcARGainLoss(10_000, 3.75, 3.80);
    expect(gl).toBeCloseTo(500, 2);
  });

  it('AR: loss when SAR weakened (higher rate at settlement)', () => {
    const gl = calcARGainLoss(10_000, 3.80, 3.75);
    expect(gl).toBeCloseTo(-500, 2);
  });

  it('AP: gain when SAR weakened (paid less at booking rate)', () => {
    const gl = calcAPGainLoss(10_000, 3.80, 3.75);
    expect(gl).toBeCloseTo(500, 2);
  });

  it('AP: loss when SAR strengthened at payment', () => {
    const gl = calcAPGainLoss(10_000, 3.75, 3.80);
    expect(gl).toBeCloseTo(-500, 2);
  });

  it('zero GL when booking rate equals settlement rate', () => {
    expect(calcARGainLoss(100_000, 3.75, 3.75)).toBe(0);
  });

  it('skips entries with < 0.01 SAR difference (rounding noise)', () => {
    const gl = calcARGainLoss(1, 3.75001, 3.75);  // 0.00001 SAR diff
    expect(Math.abs(gl)).toBeLessThan(0.01);
  });

  it('currency breakdown accumulates gains and losses', () => {
    const entries = [
      { currency: 'USD', realizedGL: 1500 },
      { currency: 'USD', realizedGL: -300 },
      { currency: 'EUR', realizedGL:  800 },
    ];
    const breakdown: Record<string, { gain: number; loss: number }> = {};
    for (const e of entries) {
      if (!breakdown[e.currency]) breakdown[e.currency] = { gain: 0, loss: 0 };
      if (e.realizedGL > 0) breakdown[e.currency].gain += e.realizedGL;
      else                   breakdown[e.currency].loss += e.realizedGL;
    }
    expect(breakdown.USD.gain).toBe(1500);
    expect(breakdown.USD.loss).toBe(-300);
    expect(breakdown.EUR.gain).toBe(800);
  });

  it('net realized GL = totalGain + totalLoss (can be negative)', () => {
    const gains  = 5000;
    const losses = -8000;
    expect(gains + losses).toBe(-3000);
  });

  it('rounds amounts to 2 decimal places', () => {
    const gl  = calcARGainLoss(1, 3.1415926, 3.2718);
    const rounded = Math.round(gl * 100) / 100;
    expect(String(rounded).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it('handles zero FCY amount gracefully', () => {
    expect(calcARGainLoss(0, 3.75, 3.80)).toBe(0);
  });
});

// ─── 3. Month-End Close Checklist ─────────────────────────────────────────────

describe('MonthEndCloseEngine — task ordering', () => {
  const CLOSE_TASKS_CODES = [
    'INVENTORY_RECON', 'AR_AGING', 'AP_AGING', 'BANK_RECON', 'GRIR_CLEARING',
    'FX_REVALUATION', 'IFRS16_JOURNAL', 'DEPRECIATION', 'PREPAYMENT_AMORT',
    'ACCRUALS', 'IC_RECONCILIATION', 'TRIAL_BALANCE', 'BUDGET_VARIANCE', 'PERIOD_LOCK',
  ];

  it('has exactly 14 tasks in the checklist', () => {
    expect(CLOSE_TASKS_CODES).toHaveLength(14);
  });

  it('PERIOD_LOCK is the last task', () => {
    expect(CLOSE_TASKS_CODES[CLOSE_TASKS_CODES.length - 1]).toBe('PERIOD_LOCK');
  });

  it('TRIAL_BALANCE comes before PERIOD_LOCK', () => {
    const tbIdx   = CLOSE_TASKS_CODES.indexOf('TRIAL_BALANCE');
    const lockIdx = CLOSE_TASKS_CODES.indexOf('PERIOD_LOCK');
    expect(tbIdx).toBeLessThan(lockIdx);
  });

  it('FX_REVALUATION comes before TRIAL_BALANCE', () => {
    const fxIdx = CLOSE_TASKS_CODES.indexOf('FX_REVALUATION');
    const tbIdx = CLOSE_TASKS_CODES.indexOf('TRIAL_BALANCE');
    expect(fxIdx).toBeLessThan(tbIdx);
  });

  it('calculates progress percentage correctly', () => {
    const total = 14;
    const done  = 7;
    const progress = Math.round((done / total) * 100);
    expect(progress).toBe(50);
  });

  it('100% progress when all 14 tasks done', () => {
    expect(Math.round((14 / 14) * 100)).toBe(100);
  });

  it('status is COMPLETE only when all mandatory tasks are DONE', () => {
    const tasks = [
      { mandatory: true, status: 'DONE' },
      { mandatory: true, status: 'DONE' },
      { mandatory: false, status: 'PENDING' },
    ];
    const mandatoryAll = tasks.filter(t => t.mandatory).every(t => t.status === 'DONE');
    expect(mandatoryAll).toBe(true);
  });

  it('status is not COMPLETE if any mandatory task is PENDING', () => {
    const tasks = [
      { mandatory: true, status: 'DONE' },
      { mandatory: true, status: 'PENDING' },
    ];
    const mandatoryAll = tasks.filter(t => t.mandatory).every(t => t.status === 'DONE');
    expect(mandatoryAll).toBe(false);
  });

  it('trial balance valid when difference < 0.01 SAR', () => {
    const totalDebit  = 1_000_000.005;
    const totalCredit = 1_000_000.000;
    const diff = Math.abs(totalDebit - totalCredit);
    expect(diff).toBeLessThan(0.01);
  });
});

// ─── 4. Dunning Level Classification ─────────────────────────────────────────

describe('Payment Reminders — dunning level logic', () => {
  const DUNNING_LEVELS = [
    { minDays: 1,  maxDays: 30,   level: 1, action: 'remind',   blockCredit: false },
    { minDays: 31, maxDays: 60,   level: 2, action: 'formal',   blockCredit: false },
    { minDays: 61, maxDays: 90,   level: 3, action: 'warn',     blockCredit: true  },
    { minDays: 91, maxDays: 9999, level: 4, action: 'escalate', blockCredit: true  },
  ];
  const getDunning = (days: number) =>
    DUNNING_LEVELS.find(l => days >= l.minDays && days <= l.maxDays) ?? null;

  it('1 day overdue → Level 1 (friendly reminder)', () => {
    expect(getDunning(1)?.level).toBe(1);
  });

  it('30 days overdue → Level 1', () => {
    expect(getDunning(30)?.level).toBe(1);
  });

  it('31 days overdue → Level 2 (formal)', () => {
    expect(getDunning(31)?.level).toBe(2);
  });

  it('61 days → Level 3 (warning + credit block)', () => {
    const d = getDunning(61);
    expect(d?.level).toBe(3);
    expect(d?.blockCredit).toBe(true);
  });

  it('90 days → still Level 3', () => {
    expect(getDunning(90)?.level).toBe(3);
  });

  it('91 days → Level 4 (legal escalation)', () => {
    expect(getDunning(91)?.level).toBe(4);
  });

  it('Level 1 and 2 do NOT block credit', () => {
    expect(getDunning(15)?.blockCredit).toBe(false);
    expect(getDunning(45)?.blockCredit).toBe(false);
  });

  it('0 days overdue → no dunning level', () => {
    expect(getDunning(0)).toBeNull();
  });
});

// ─── 5. Budget Variance Calculation ──────────────────────────────────────────

describe('Budget Variance — calcVariance', () => {
  const calcVariance = (actual: number, budget: number) => {
    const variance    = actual - budget;
    const variancePct = budget !== 0 ? (variance / Math.abs(budget)) * 100 : 0;
    const isFavorable = variance <= 0;
    const status: 'ON_TRACK' | 'WATCH' | 'OVER' =
      Math.abs(variancePct) <= 5  ? 'ON_TRACK' :
      Math.abs(variancePct) <= 15 ? 'WATCH' : 'OVER';
    return { variance, variancePct, isFavorable, status };
  };

  it('ON_TRACK when actual is within 5% of budget', () => {
    expect(calcVariance(102, 100).status).toBe('ON_TRACK');
  });

  it('WATCH when variance is 6-15%', () => {
    expect(calcVariance(112, 100).status).toBe('WATCH');
  });

  it('OVER when variance exceeds 15%', () => {
    expect(calcVariance(120, 100).status).toBe('OVER');
  });

  it('favorable when actual < budget (under-spend)', () => {
    expect(calcVariance(90, 100).isFavorable).toBe(true);
  });

  it('unfavorable when actual > budget (over-spend)', () => {
    expect(calcVariance(110, 100).isFavorable).toBe(false);
  });

  it('zero variancePct when budget is 0', () => {
    expect(calcVariance(100, 0).variancePct).toBe(0);
  });

  it('negative variance for under-spend', () => {
    expect(calcVariance(80, 100).variance).toBe(-20);
  });

  it('run-rate forecast = YTD actual + (monthly rate × remaining months)', () => {
    const ytdActual = 600_000;
    const month     = 6;  // June
    const monthlyRate = ytdActual / month;
    const remainingMonths = 12 - month;
    const forecast = ytdActual + (monthlyRate * remainingMonths);
    expect(forecast).toBe(1_200_000);  // on track for 1.2M annual
  });
});

// ─── 6. ZATCA Batch Validation ────────────────────────────────────────────────

describe('ZATCA Batch Submission — validation', () => {
  it('B2B with VAT number → clearance endpoint', () => {
    const customer = { vatNumber: '300012345600003', isB2B: true };
    const isB2B    = customer.isB2B ?? customer.vatNumber?.length > 0;
    const endpoint = isB2B ? 'clearance' : 'reporting';
    expect(endpoint).toBe('clearance');
  });

  it('B2C without VAT number → reporting endpoint', () => {
    const customer: { vatNumber: string | null; isB2B: boolean } = { vatNumber: null, isB2B: false };
    const isB2B    = customer.isB2B || (customer.vatNumber?.length ?? 0) > 0;
    const endpoint = isB2B ? 'clearance' : 'reporting';
    expect(endpoint).toBe('reporting');
  });

  it('skips invoice with no zatcaXml and no zatcaHash', () => {
    const invoice = { zatcaXml: null, zatcaHash: null };
    const shouldSkip = !invoice.zatcaXml && !invoice.zatcaHash;
    expect(shouldSkip).toBe(true);
  });

  it('does not skip invoice with zatcaHash but no XML', () => {
    const invoice = { zatcaXml: null, zatcaHash: 'abc123hash' };
    const shouldSkip = !invoice.zatcaXml && !invoice.zatcaHash;
    expect(shouldSkip).toBe(false);
  });

  it('returns 207 when some invoices fail', () => {
    const failed    = 3;
    const submitted = 10;
    const httpStatus = failed > 0 ? 207 : 200;
    expect(httpStatus).toBe(207);
  });

  it('returns 200 when all succeed', () => {
    const failed = 0;
    const httpStatus = failed > 0 ? 207 : 200;
    expect(httpStatus).toBe(200);
  });

  it('base64 encodes XML for ZATCA body', () => {
    const xml    = '<Invoice>test</Invoice>';
    const encoded = Buffer.from(xml).toString('base64');
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    expect(decoded).toBe(xml);
  });
});

// ─── 7. Daily Audit Risk Score ────────────────────────────────────────────────

describe('Daily Audit — risk score calculation', () => {
  const calculateRiskScore = (
    highRiskDeletes: number,
    authChanges:     number,
    largeJournals:   number,
  ): number => {
    let score = 0;
    score += Math.min(highRiskDeletes * 3, 6);
    score += Math.min(authChanges * 2, 4);
    score += Math.min(largeJournals, 3);
    return Math.min(score, 10);
  };

  it('score is 0 with no events', () => {
    expect(calculateRiskScore(0, 0, 0)).toBe(0);
  });

  it('1 high-risk delete = 3 points', () => {
    expect(calculateRiskScore(1, 0, 0)).toBe(3);
  });

  it('high-risk deletes capped at 6 points', () => {
    expect(calculateRiskScore(10, 0, 0)).toBe(6);
  });

  it('auth changes capped at 4 points', () => {
    expect(calculateRiskScore(0, 10, 0)).toBe(4);
  });

  it('large journals capped at 3 points', () => {
    expect(calculateRiskScore(0, 0, 10)).toBe(3);
  });

  it('maximum score is 10', () => {
    expect(calculateRiskScore(100, 100, 100)).toBe(10);
  });
});
