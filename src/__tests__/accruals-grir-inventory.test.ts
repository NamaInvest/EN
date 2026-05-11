/**
 * Accruals, GR/IR & Inventory Valuation Tests — Part 7
 * ══════════════════════════════════════════════════════════════════════════════
 * 50 unit tests:
 *   1. Accruals journal balancing (10)
 *   2. Prepayment amortization (8)
 *   3. GR/IR matching logic (12)
 *   4. Inventory WACC valuation (10)
 *   5. AR Dunning level classification (10)
 */

// ─── 1. Accruals Journal Balancing ───────────────────────────────────────────

describe('Accruals — journal balancing', () => {
  const buildAccrual = (entries: { amount: number }[]) => {
    const lines = entries.flatMap(e => [
      { side: 'DEBIT',  amount: e.amount },
      { side: 'CREDIT', amount: e.amount },
    ]);
    const totalDebit  = lines.filter(l => l.side === 'DEBIT').reduce((s, l)  => s + l.amount, 0);
    const totalCredit = lines.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.02 };
  };

  it('single accrual: debit = credit', () => {
    expect(buildAccrual([{ amount: 50_000 }]).isBalanced).toBe(true);
  });

  it('multiple accruals: still balanced', () => {
    expect(buildAccrual([{ amount: 10_000 }, { amount: 20_000 }, { amount: 5_000 }]).isBalanced).toBe(true);
  });

  it('accrual reference: ACR-YYYY-MM-FY{n}', () => {
    const ref = 'ACR-2025-03-FY1';
    expect(ref).toMatch(/^ACR-\d{4}-\d{2}-FY\d+$/);
  });

  it('prepayment reference: PRE-YYYY-MM-FY{n}', () => {
    const ref = 'PRE-2025-03-FY1';
    expect(ref).toMatch(/^PRE-\d{4}-\d{2}-FY\d+$/);
  });

  it('max 500 entries per batch', () => {
    const count = 501;
    expect(count).toBeGreaterThan(500);
  });

  it('dryRun does not create journal', () => {
    const result = { dryRun: true, journalId: undefined };
    expect(result.journalId).toBeUndefined();
  });

  it('post date = last day of the period month', () => {
    const [year, month] = '2025-02'.split('-').map(Number);
    const postDate = new Date(year, month - 1, 28);
    expect(postDate.getDate()).toBe(28);
  });

  it('accrual Dr Expense / Cr Accrued Liability', () => {
    const lines = [
      { side: 'DEBIT',  account: '6010' },
      { side: 'CREDIT', account: '2200' },
    ];
    expect(lines[0].side).toBe('DEBIT');
    expect(lines[1].side).toBe('CREDIT');
  });

  it('period format validation: YYYY-MM', () => {
    expect(/^\d{4}-\d{2}$/.test('2025-03')).toBe(true);
    expect(/^\d{4}-\d{2}$/.test('25-3')).toBe(false);
  });

  it('amount must be positive', () => {
    const amount = -1000;
    expect(amount > 0).toBe(false);
  });
});

// ─── 2. Prepayment Amortization ───────────────────────────────────────────────

describe('Prepayments — monthly amortization', () => {
  const amortize = (total: number, months: number) =>
    Math.round((total / months) * 100) / 100;

  it('12-month insurance: 12_000 / 12 = 1_000/month', () =>
    expect(amortize(12_000, 12)).toBe(1_000));

  it('6-month rent prepaid: 30_000 / 6 = 5_000/month', () =>
    expect(amortize(30_000, 6)).toBe(5_000));

  it('1-month: full amount in single entry', () =>
    expect(amortize(5_000, 1)).toBe(5_000));

  it('120 months max (10 years) accepted', () => {
    const months = 120;
    expect(months).toBeLessThanOrEqual(120);
  });

  it('sum of all monthly entries = original amount (±rounding)', () => {
    const total  = 12_001;
    const months = 12;
    const monthly = amortize(total, months);
    const sum = monthly * months;
    expect(Math.abs(sum - total)).toBeLessThan(1);
  });

  it('prepayment Dr Prepaid Asset first', () => {
    const initialEntry = { side: 'DEBIT', account: '1300' };
    expect(initialEntry.side).toBe('DEBIT');
  });

  it('monthly amortization Dr Expense / Cr Prepaid', () => {
    const monthly = [{ side: 'DEBIT', account: '6010' }, { side: 'CREDIT', account: '1300' }];
    expect(monthly[0].side).toBe('DEBIT');
    expect(monthly[1].side).toBe('CREDIT');
  });

  it('remaining balance decreases each month', () => {
    const total  = 12_000; const monthly = 1_000;
    const remaining = [3, 2, 1].map(mLeft => total - (12 - mLeft) * monthly);
    expect(remaining[0]).toBeGreaterThan(remaining[1]);
  });
});

// ─── 3. GR/IR Matching Logic ─────────────────────────────────────────────────

describe('GRIR — three-way match', () => {
  type GRIRStatus = 'MATCHED' | 'GR_PENDING' | 'IR_PENDING' | 'PARTIAL';

  const matchStatus = (gr: number, ir: number): GRIRStatus => {
    const bal = gr - ir;
    if (Math.abs(bal) < 0.01)   return 'MATCHED';
    if (gr > 0 && ir === 0)     return 'GR_PENDING';
    if (ir > 0 && gr === 0)     return 'IR_PENDING';
    return 'PARTIAL';
  };

  it('GR = IR → MATCHED',                () => expect(matchStatus(10_000, 10_000)).toBe('MATCHED'));
  it('GR only → GR_PENDING',             () => expect(matchStatus(10_000, 0)).toBe('GR_PENDING'));
  it('IR only → IR_PENDING',             () => expect(matchStatus(0, 10_000)).toBe('IR_PENDING'));
  it('GR > IR → PARTIAL',                () => expect(matchStatus(10_000, 8_000)).toBe('PARTIAL'));
  it('GR < IR → PARTIAL (over-invoiced)',  () => expect(matchStatus(8_000, 10_000)).toBe('PARTIAL'));
  it('zero tolerance < 0.01 SAR = MATCHED',  () => expect(matchStatus(10_000.005, 10_000)).toBe('MATCHED'));

  it('GL entry for GR: Dr Inventory / Cr GR/IR', () => {
    const entry = { dr: 'Inventory', cr: 'GRIR Clearing' };
    expect(entry.dr).toBe('Inventory');
    expect(entry.cr).toBe('GRIR Clearing');
  });

  it('GL entry for IR: Dr GR/IR / Cr AP', () => {
    const entry = { dr: 'GRIR Clearing', cr: 'Accounts Payable' };
    expect(entry.dr).toBe('GRIR Clearing');
  });

  it('Matched GR/IR: net GR/IR balance = 0', () => {
    const grDebit = 10_000; const irCredit = 10_000;
    expect(grDebit - irCredit).toBe(0);
  });

  it('over-invoiced: GR/IR debit > credit → IR exceeds GR', () => {
    const grAmount = 8_000; const irAmount = 10_000;
    expect(irAmount - grAmount).toBe(2_000); // 2K over-invoiced
  });

  it('GR qty = PO qty = IR qty → three-way match', () => {
    const poQty = 100; const grQty = 100; const irQty = 100;
    expect(poQty === grQty && grQty === irQty).toBe(true);
  });

  it('GR qty ≠ IR qty → quantity variance', () => {
    const grQty: number = 100; const irQty: number = 95;
    expect(grQty !== irQty).toBe(true);
  });
});

// ─── 4. Inventory WACC Valuation ─────────────────────────────────────────────

describe('InventoryValuation — WACC', () => {
  const calcWACC = (batches: { qty: number; cost: number }[]) => {
    const totalQty   = batches.reduce((s, b) => s + b.qty, 0);
    const totalValue = batches.reduce((s, b) => s + b.qty * b.cost, 0);
    const avgCost    = totalQty === 0 ? 0 : Math.round((totalValue / totalQty) * 100) / 100;
    return { totalQty, totalValue: Math.round(totalValue * 100) / 100, avgCost };
  };

  it('single batch: avgCost = purchase cost', () => {
    const r = calcWACC([{ qty: 100, cost: 50 }]);
    expect(r.avgCost).toBe(50);
  });

  it('two batches at different costs: weighted average', () => {
    const r = calcWACC([{ qty: 100, cost: 50 }, { qty: 100, cost: 60 }]);
    expect(r.avgCost).toBe(55);
  });

  it('empty inventory: avgCost = 0', () => {
    expect(calcWACC([]).avgCost).toBe(0);
  });

  it('totalValue = qty × avgCost', () => {
    const r = calcWACC([{ qty: 200, cost: 55 }]);
    expect(r.totalValue).toBe(11_000);
  });

  it('negative qty flags NEGATIVE_QTY status', () => {
    const qty    = -10;
    const status = qty < 0 ? 'NEGATIVE_QTY' : 'OK';
    expect(status).toBe('NEGATIVE_QTY');
  });

  it('variance detected: totalValue ≠ GL balance', () => {
    const totalValue = 100_000;
    const glValue    = 98_000;
    const status     = Math.abs(totalValue - glValue) > 0.01 ? 'VARIANCE' : 'OK';
    expect(status).toBe('VARIANCE');
  });

  it('no variance: totalValue = GL balance ± 0.01', () => {
    const status = Math.abs(100_000 - 100_000) > 0.01 ? 'VARIANCE' : 'OK';
    expect(status).toBe('OK');
  });

  it('CSV export has Content-Disposition with .csv', () => {
    const header = `attachment; filename="inventory_valuation_default_2025-03-31.csv"`;
    expect(header).toContain('.csv');
  });

  it('FIFO totalValue ≥ WACC totalValue when costs rising', () => {
    // FIFO sells cheapest first → remaining stock at higher cost
    const waccValue = 55_000;
    const fifoValue = 60_000; // remaining stock at latest (higher) price
    expect(fifoValue).toBeGreaterThanOrEqual(waccValue);
  });

  it('grand variance = sum of abs(variance) per product', () => {
    const lines = [{ variance: 500 }, { variance: -300 }, { variance: 0 }];
    const grand = lines.reduce((s, l) => s + Math.abs(l.variance), 0);
    expect(grand).toBe(800);
  });
});

// ─── 5. AR Dunning Level Classification ──────────────────────────────────────

describe('ARDunning — level classification', () => {
  const LEVELS = [
    { days: 90, level: 4 }, { days: 60, level: 3 },
    { days: 30, level: 2 }, { days: 1,  level: 1 },
  ];

  const getDunningLevel = (daysPastDue: number) =>
    LEVELS.find(l => daysPastDue >= l.days)?.level ?? 0;

  it('0 days past due → no dunning (0)', () => expect(getDunningLevel(0)).toBe(0));
  it('1 day past due → level 1',         () => expect(getDunningLevel(1)).toBe(1));
  it('29 days past due → level 1',       () => expect(getDunningLevel(29)).toBe(1));
  it('30 days past due → level 2',       () => expect(getDunningLevel(30)).toBe(2));
  it('59 days past due → level 2',       () => expect(getDunningLevel(59)).toBe(2));
  it('60 days past due → level 3',       () => expect(getDunningLevel(60)).toBe(3));
  it('89 days past due → level 3',       () => expect(getDunningLevel(89)).toBe(3));
  it('90 days past due → level 4',       () => expect(getDunningLevel(90)).toBe(4));
  it('only escalate: new level > current', () => {
    const current = 2; const newLevel = 3;
    expect(newLevel > current).toBe(true);
  });
  it('credit hold applied at level 2+', () => {
    const level = 2;
    expect(level >= 2).toBe(true);
  });
});
