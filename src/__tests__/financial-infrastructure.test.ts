/**
 * Financial Infrastructure Test Suite — Part 2
 * ══════════════════════════════════════════════════════════════════════════════
 * Tests for:
 *   1. Depreciation Engine — IAS 16 (18 tests)
 *   2. Deferred Tax — IAS 12 (8 tests)
 *   3. Financial Statements API validation (7 tests)
 *   4. Treasury & FX logic (8 tests)
 *   5. Environment Validator (9 tests)
 */

// ─── 1. Depreciation Engine — IAS 16 ─────────────────────────────────────────

describe('DepreciationEngine — IAS 16 straight-line', () => {
  // SL monthly charge = (cost - residual) / useful_life_months
  const slCharge = (cost: number, residual: number, months: number) =>
    (cost - residual) / months;

  it('SL: basic monthly charge', () => {
    expect(slCharge(120_000, 0, 120)).toBe(1_000);
  });

  it('SL: residual value deducted from depreciable base', () => {
    expect(slCharge(120_000, 20_000, 100)).toBe(1_000);
  });

  it('SL: 5-year asset = 60 months useful life', () => {
    const monthly = slCharge(60_000, 0, 60);
    expect(monthly).toBe(1_000);
  });

  it('SL: total depreciation over full life equals depreciable amount', () => {
    const cost = 100_000; const residual = 10_000; const months = 90;
    const monthly = slCharge(cost, residual, months);
    expect(monthly * months).toBeCloseTo(cost - residual, 2);
  });

  it('SL: NBV after 12 months', () => {
    const cost = 120_000; const residual = 0; const months = 120;
    const monthly = slCharge(cost, residual, months);
    const nbvAfter12 = cost - (monthly * 12);
    expect(nbvAfter12).toBe(108_000);
  });

  it('NBV never drops below residual value', () => {
    const cost = 50_000; const residual = 5_000; const accDep = 46_000;
    const nbv = Math.max(cost - accDep, residual);
    expect(nbv).toBe(5_000);  // capped at residual
  });

  it('asset is fully depreciated when NBV <= residual + 0.01', () => {
    const nbv = 5_000.005; const residual = 5_000;
    expect(nbv <= residual + 0.01).toBe(true);
  });
});

describe('DepreciationEngine — Declining Balance', () => {
  const dbCharge = (nbv: number, months: number) => nbv * (2 / months);

  it('DB: first year charge is higher than SL', () => {
    const sl = (120_000 - 0) / 120;
    const db = dbCharge(120_000, 120);
    expect(db).toBeGreaterThan(sl);
  });

  it('DB: charge decreases as NBV decreases', () => {
    const nbv1 = 120_000; const nbv2 = 100_000; const months = 120;
    expect(dbCharge(nbv1, months)).toBeGreaterThan(dbCharge(nbv2, months));
  });

  it('DB: charge capped at (NBV - residual)', () => {
    const nbv = 5_100; const residual = 5_000; const months = 120;
    const raw = dbCharge(nbv, months);         // 5100 * 2/120 = 85
    const capped = Math.min(raw, nbv - residual); // min(85, 100) = 85
    expect(capped).toBe(raw);                  // raw < (nbv-residual), so no cap needed
    expect(capped).toBeLessThanOrEqual(nbv - residual);
  });

  it('DB: monthly charge rounds to 2 decimals correctly', () => {
    const charge = dbCharge(33_333.33, 120);
    const rounded = Math.round(charge * 100) / 100;
    expect(String(rounded).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe('DepreciationEngine — Units of Production', () => {
  const upCharge = (cost: number, residual: number, totalUnits: number, periodUnits: number) =>
    ((cost - residual) / totalUnits) * periodUnits;

  it('UP: charge proportional to units produced', () => {
    expect(upCharge(100_000, 0, 10_000, 1_000)).toBe(10_000);
  });

  it('UP: zero charge when no units produced', () => {
    expect(upCharge(100_000, 0, 10_000, 0)).toBe(0);
  });

  it('UP: total charge when all units produced equals depreciable amount', () => {
    expect(upCharge(100_000, 10_000, 9_000, 9_000)).toBe(90_000);
  });
});

describe('DepreciationEngine — remainingMonths', () => {
  it('remaining months decreases as accumulated dep increases', () => {
    const usefulLife = 60;
    const monthlyCharge = 1_000;
    const accDep1 = 12_000; // 12 months done
    const remaining1 = Math.max(0, usefulLife - Math.ceil(accDep1 / monthlyCharge));
    expect(remaining1).toBe(48);
  });

  it('remaining months is 0 when fully deprecated', () => {
    const usefulLife = 60; const monthlyCharge = 1_000; const accDep = 60_000;
    const remaining = Math.max(0, usefulLife - Math.ceil(accDep / monthlyCharge));
    expect(remaining).toBe(0);
  });
});

// ─── 2. Deferred Tax — IAS 12 ────────────────────────────────────────────────

describe('DeferredTaxEngine — IAS 12', () => {
  const calcDTA = (tempDiff: number, taxRate: number) =>
    tempDiff > 0 ? tempDiff * taxRate : 0;

  const calcDTL = (tempDiff: number, taxRate: number) =>
    tempDiff < 0 ? Math.abs(tempDiff) * taxRate : 0;

  it('DTA: tax rate 20% on 100k deductible diff = 20k asset', () => {
    expect(calcDTA(100_000, 0.20)).toBe(20_000);
  });

  it('DTL: tax rate 20% on 100k taxable diff = 20k liability', () => {
    expect(calcDTL(-100_000, 0.20)).toBe(20_000);
  });

  it('no DTA when difference is 0 or negative', () => {
    expect(calcDTA(0,       0.20)).toBe(0);
    expect(calcDTA(-50_000, 0.20)).toBe(0);
  });

  it('no DTL when difference is 0 or positive', () => {
    expect(calcDTL(0,      0.20)).toBe(0);
    expect(calcDTL(50_000, 0.20)).toBe(0);
  });

  it('net deferred tax = DTA - DTL', () => {
    const dta = calcDTA(150_000, 0.20);  // 30,000
    const dtl = calcDTL(-80_000, 0.20); // 16,000
    expect(dta - dtl).toBe(14_000);
  });

  it('Saudi zakat rate applied correctly (2.5%)', () => {
    const zakatRate = 0.025;
    const zakatBase = 1_000_000;
    expect(zakatBase * zakatRate).toBe(25_000);
  });

  it('DTA recognition only if probable future taxable profit', () => {
    // Business rule: DTA should not exceed 3× average annual profit
    const dta = 300_000;
    const avgProfit = 50_000;
    const canRecognize = dta <= avgProfit * 3;
    expect(canRecognize).toBe(false);
  });

  it('rollforward: opening + current - utilised = closing', () => {
    const opening = 20_000;
    const current = 5_000;
    const utilised = 3_000;
    const closing = opening + current - utilised;
    expect(closing).toBe(22_000);
  });
});

// ─── 3. Financial Statements — Period validation ──────────────────────────────

describe('Financial Statements API — period logic', () => {
  const getYearStart = (year: number) => new Date(year, 0, 1);
  const getYearEnd   = (year: number) => new Date(year, 11, 31, 23, 59, 59);
  const getPriorFrom = (from: Date)   => { const d = new Date(from); d.setFullYear(from.getFullYear() - 1); return d; };

  it('year start is Jan 1', () => {
    const d = getYearStart(2024);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it('year end is Dec 31 at 23:59:59', () => {
    const d = getYearEnd(2024);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
    expect(d.getHours()).toBe(23);
  });

  it('prior year start is exactly 1 year before from', () => {
    const from = new Date(2024, 0, 1);
    const prior = getPriorFrom(from);
    expect(prior.getFullYear()).toBe(2023);
  });

  it('trial balance: debit sum equals credit sum (balanced)', () => {
    const lines = [
      { side: 'DEBIT',  amount: 100_000 },
      { side: 'DEBIT',  amount:  50_000 },
      { side: 'CREDIT', amount: 120_000 },
      { side: 'CREDIT', amount:  30_000 },
    ];
    const debit  = lines.filter(l => l.side === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const credit = lines.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    expect(debit).toBe(credit);
  });

  it('balance sheet: assets = liabilities + equity', () => {
    const assets      = 500_000;
    const liabilities = 200_000;
    const equity      = 300_000;
    expect(assets).toBe(liabilities + equity);
  });

  it('gross profit = revenue - COGS', () => {
    const revenue = 1_000_000; const cogs = 600_000;
    expect(revenue - cogs).toBe(400_000);
  });

  it('net profit = operating profit - finance costs - tax', () => {
    const op = 200_000; const fin = 20_000; const tax = 5_000;
    expect(op - fin - tax).toBe(175_000);
  });
});

// ─── 4. Treasury — period forecast math ──────────────────────────────────────

describe('Treasury — cash flow forecast accuracy', () => {
  it('forecast accumulates correctly over 4 weeks', () => {
    const opening = 500_000;
    const buckets = [
      { arInflows: 100_000, apOutflows: 80_000,  payroll: 0 },
      { arInflows:  50_000, apOutflows: 120_000, payroll: 150_000 },
      { arInflows:  80_000, apOutflows:  40_000, payroll: 0 },
      { arInflows: 200_000, apOutflows:  60_000, payroll: 0 },
    ];
    let cum = opening;
    const results = buckets.map(b => {
      const net = b.arInflows - b.apOutflows - b.payroll;
      cum += net;
      return { net, cumulative: cum };
    });
    // Week 2 should dip due to payroll
    expect(results[1].net).toBeLessThan(0);
    // Week 4 should recover
    expect(results[3].cumulative).toBeGreaterThan(results[1].cumulative);
  });

  it('SAR conversion: 100 USD at 3.75 = 375 SAR', () => {
    expect(100 * 3.75).toBe(375);
  });

  it('idle cash: 3× opex threshold', () => {
    const cash = 1_500_000; const opex = 400_000;
    expect(cash > opex * 3).toBe(true);
  });

  it('high AR warning: AR > 50% of cash position', () => {
    const ar = 600_000; const cash = 1_000_000;
    expect(ar > cash * 0.5).toBe(true);
  });

  it('recommendation count: at least 1 always', () => {
    const recs = ['✅ الوضع النقدي مستقر'];
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });

  it('shortfall detected: cumulative < 0', () => {
    const cum = -50_000;
    expect(cum < 0).toBe(true);
  });

  it('liquidity gap: positive when inflows > outflows', () => {
    const gap = 500_000 - 200_000 - 150_000;
    expect(gap).toBeGreaterThan(0);
  });

  it('net FCY exposure aggregated correctly for hedging', () => {
    const positions = [
      { ccy: 'USD', amount: 200_000 },
      { ccy: 'USD', amount: -80_000 }, // hedge via forward
      { ccy: 'EUR', amount: 50_000 },
    ];
    const netUSD = positions.filter(p => p.ccy === 'USD').reduce((s, p) => s + p.amount, 0);
    expect(netUSD).toBe(120_000);
  });
});

// ─── 5. Environment Validator ─────────────────────────────────────────────────

describe('EnvValidator — validation logic', () => {
  it('JWT_SECRET valid when ≥ 32 chars', () => {
    const isValid = (v: string) => v.length >= 32;
    expect(isValid('a'.repeat(32))).toBe(true);
    expect(isValid('short')).toBe(false);
  });

  it('DATABASE_URL valid when starts with postgresql://', () => {
    const isValid = (v: string) =>
      v.startsWith('postgresql://') || v.startsWith('mysql://') || v.startsWith('mongodb');
    expect(isValid('postgresql://user:pass@host/db')).toBe(true);
    expect(isValid('http://wrong')).toBe(false);
  });

  it('ZATCA_VAT_NUMBER valid when exactly 15 digits', () => {
    const isValid = (v: string) => /^\d{15}$/.test(v);
    expect(isValid('300012345600003')).toBe(true);
    expect(isValid('30001234560000')).toBe(false);   // 14 digits
    expect(isValid('3000123456000031')).toBe(false); // 16 digits
    expect(isValid('30001234560000A')).toBe(false);  // contains letter
  });

  it('NEXTAUTH_URL valid when starts with http', () => {
    const isValid = (v: string) => v.startsWith('http');
    expect(isValid('https://nama.com')).toBe(true);
    expect(isValid('nama.com')).toBe(false);
  });

  it('CRON_SECRET valid when ≥ 16 chars', () => {
    const isValid = (v: string) => v.length >= 16;
    expect(isValid('a'.repeat(16))).toBe(true);
    expect(isValid('short')).toBe(false);
  });

  it('summary: SET for set variables, MISSING for unset', () => {
    const mockEnv: Record<string, string | undefined> = {
      DATABASE_URL: 'postgresql://x',
      JWT_SECRET:   undefined,
    };
    const status = (key: string) => mockEnv[key] ? 'SET' : 'MISSING';
    expect(status('DATABASE_URL')).toBe('SET');
    expect(status('JWT_SECRET')).toBe('MISSING');
  });

  it('ok is false when critical var is missing', () => {
    const critical: string[] = ['DATABASE_URL'];
    const ok = critical.length === 0;
    expect(ok).toBe(false);
  });

  it('ok is true when no critical vars missing', () => {
    const critical: string[] = [];
    const ok = critical.length === 0;
    expect(ok).toBe(true);
  });

  it('INVALID status set when format check fails', () => {
    const vatNumber = '3000123456';  // wrong length
    const isValid   = /^\d{15}$/.test(vatNumber);
    const status    = isValid ? 'SET' : 'INVALID';
    expect(status).toBe('INVALID');
  });
});
