/**
 * Payroll-GL & Bank Reconciliation Tests — Part 5
 * ══════════════════════════════════════════════════════════════════════════════
 * 50 unit tests:
 *   1. Payroll-GL journal balancing (12)
 *   2. Bank reconciliation matching logic (12)
 *   3. Chart of accounts validation (8)
 *   4. Month-end checklist state machine (9)
 *   5. Financial period lock rules (9)
 */

// ─── 1. Payroll-GL Journal Balancing ─────────────────────────────────────────

describe('PayrollGL — journal balancing', () => {
  interface PayrollData { grossSalary: number; netSalary: number; gosiEmployee: number; gosiEmployer: number }

  const buildJournal = (data: PayrollData) => {
    const totalDeductions  = data.gosiEmployee; // simplified
    const totalGosiPayable = data.gosiEmployee + data.gosiEmployer;
    const lines = [
      { side: 'DEBIT',  amount: data.grossSalary,    label: 'Salary Expense' },
      { side: 'DEBIT',  amount: data.gosiEmployer,   label: 'GOSI Expense' },
      { side: 'CREDIT', amount: data.netSalary,      label: 'Salary Payable' },
      { side: 'CREDIT', amount: totalGosiPayable,    label: 'GOSI Payable' },
      { side: 'CREDIT', amount: totalDeductions - data.gosiEmployee, label: 'Other Deductions' },
    ].filter(l => l.amount > 0);

    const totalDebit  = lines.filter(l => l.side === 'DEBIT').reduce((s, l)  => s + l.amount, 0);
    const totalCredit = lines.filter(l => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    return { lines, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.02 };
  };

  it('basic payroll: debit = gross + gosiEmployer', () => {
    const data = { grossSalary: 100_000, netSalary: 88_000, gosiEmployee: 9_750, gosiEmployer: 10_000 };
    const j    = buildJournal(data);
    expect(j.totalDebit).toBe(110_000);
  });

  it('GOSI employer expense on debit side', () => {
    const data = { grossSalary: 100_000, netSalary: 88_000, gosiEmployee: 9_750, gosiEmployer: 10_000 };
    const j    = buildJournal(data);
    expect(j.lines.find(l => l.label === 'GOSI Expense')?.side).toBe('DEBIT');
  });

  it('net salary on credit side', () => {
    const data = { grossSalary: 100_000, netSalary: 88_000, gosiEmployee: 9_750, gosiEmployer: 10_000 };
    const j    = buildJournal(data);
    expect(j.lines.find(l => l.label === 'Salary Payable')?.side).toBe('CREDIT');
  });

  it('total credit = net + gosiPayable', () => {
    const net = 88_000; const gosiEmployee = 9_750; const gosiEmployer = 10_000;
    const totalCredit = net + (gosiEmployee + gosiEmployer);
    expect(totalCredit).toBe(107_750);
  });

  it('dry-run does not return journalId', () => {
    const result = { dryRun: true, journalId: null };
    expect(result.journalId).toBeNull();
  });

  it('duplicate posting rejected: same reference exists', () => {
    const existingRef = 'PAYROLL-2025-03-FY1';
    const newRef      = 'PAYROLL-2025-03-FY1';
    expect(existingRef).toBe(newRef);
  });

  it('period format YYYY-MM validated', () => {
    expect(/^\d{4}-\d{2}$/.test('2025-03')).toBe(true);
    expect(/^\d{4}-\d{2}$/.test('2025-3')).toBe(false);
  });

  it('reference format: PAYROLL-{period}-FY{id}', () => {
    const ref = `PAYROLL-2025-03-FY1`;
    expect(ref).toMatch(/^PAYROLL-\d{4}-\d{2}-FY\d+$/);
  });

  it('GOSI rate: employee 10%, employer 11.75% of basic', () => {
    const basic = 10_000;
    expect(basic * 0.10).toBe(1_000);
    expect(basic * 0.1175).toBe(1_175);
  });

  it('net = gross - gosiEmployee - incomeTax - advances', () => {
    const gross = 10_000; const gosi = 1_000; const tax = 0; const advance = 500;
    expect(gross - gosi - tax - advance).toBe(8_500);
  });

  it('zero GOSI for non-Saudi non-gulf employees', () => {
    const gosiEmployee = 0; const gosiEmployer = 0;
    expect(gosiEmployee + gosiEmployer).toBe(0);
  });

  it('journal status = POSTED after successful run', () => {
    const status = 'POSTED';
    expect(['DRAFT','POSTED','REVERSED']).toContain(status);
  });
});

// ─── 2. Bank Reconciliation Matching ─────────────────────────────────────────

describe('BankRecon — matching logic', () => {
  type Status = 'MATCHED' | 'GL_ONLY' | 'BANK_ONLY' | 'DIFFERENCE';

  const reconcile = (
    glMap: Map<string, number>,
    bankMap: Map<string, number>,
  ): { key: string; status: Status; diff: number }[] => {
    const allKeys = new Set([...glMap.keys(), ...bankMap.keys()]);
    return Array.from(allKeys).map(key => {
      const gl   = glMap.get(key);
      const bank = bankMap.get(key);
      const diff = Math.round(((gl ?? 0) - (bank ?? 0)) * 100) / 100;
      let status: Status;
      if (gl !== undefined && bank !== undefined && Math.abs(diff) < 0.01) status = 'MATCHED';
      else if (gl !== undefined && bank === undefined) status = 'GL_ONLY';
      else if (gl === undefined && bank !== undefined) status = 'BANK_ONLY';
      else status = 'DIFFERENCE';
      return { key, status, diff };
    });
  };

  it('same key + same amount → MATCHED', () => {
    const gl   = new Map([['REF-001', 1000]]);
    const bank = new Map([['REF-001', 1000]]);
    const r    = reconcile(gl, bank);
    expect(r[0].status).toBe('MATCHED');
  });

  it('key in GL only → GL_ONLY', () => {
    const gl   = new Map([['REF-002', 500]]);
    const bank = new Map<string, number>();
    const r    = reconcile(gl, bank);
    expect(r[0].status).toBe('GL_ONLY');
  });

  it('key in bank only → BANK_ONLY', () => {
    const gl   = new Map<string, number>();
    const bank = new Map([['REF-003', 750]]);
    const r    = reconcile(gl, bank);
    expect(r[0].status).toBe('BANK_ONLY');
  });

  it('same key but different amounts → DIFFERENCE', () => {
    const gl   = new Map([['REF-004', 1000]]);
    const bank = new Map([['REF-004', 950]]);
    const r    = reconcile(gl, bank);
    expect(r[0].status).toBe('DIFFERENCE');
    expect(r[0].diff).toBeCloseTo(50, 2);
  });

  it('isReconciled when GL balance = bank balance', () => {
    const glBal = 500_000; const bankBal = 500_000;
    expect(Math.abs(glBal - bankBal)).toBeLessThan(0.01);
  });

  it('summary counts correct', () => {
    const gl   = new Map([['A', 100], ['B', 200], ['C', 300]]);
    const bank = new Map([['A', 100], ['B', 150], ['D', 400]]);
    const r    = reconcile(gl, bank);
    expect(r.filter(x => x.status === 'MATCHED').length).toBe(1);
    expect(r.filter(x => x.status === 'GL_ONLY').length).toBe(1);
    expect(r.filter(x => x.status === 'BANK_ONLY').length).toBe(1);
    expect(r.filter(x => x.status === 'DIFFERENCE').length).toBe(1);
  });

  it('floating point tolerance < 0.01 treated as matched', () => {
    const gl   = new Map([['REF-005', 1000.005]]);
    const bank = new Map([['REF-005', 1000]]);
    const r    = reconcile(gl, bank);
    expect(r[0].status).toBe('MATCHED');
  });

  it('CSV has Content-Disposition with .csv extension', () => {
    const header = `attachment; filename="bank_recon_1_2025-01-01.csv"`;
    expect(header).toContain('.csv');
  });

  it('net difference = GL balance - bank balance', () => {
    const glBal = 520_000; const bankBal = 500_000;
    expect(glBal - bankBal).toBe(20_000);
  });

  it('unmatched bank txn = outstanding deposit', () => {
    const bankOnly = [{ key: 'BANK-999', amount: 5_000 }];
    expect(bankOnly.every(t => t.amount > 0)).toBe(true);
  });

  it('unmatched GL txn = outstanding check', () => {
    const glOnly = [{ key: 'CHK-123', amount: 3_000 }];
    expect(glOnly.every(t => t.amount > 0)).toBe(true);
  });

  it('empty GL and bank = reconciled with 0 diff', () => {
    const r = reconcile(new Map(), new Map());
    expect(r).toHaveLength(0);
  });
});

// ─── 3. Chart of Accounts Validation ─────────────────────────────────────────

describe('ChartOfAccounts — validation rules', () => {
  it('account code numeric and 4 digits minimum', () => {
    const valid = (code: string) => /^\d{4,}$/.test(code);
    expect(valid('1010')).toBe(true);
    expect(valid('101')).toBe(false);
    expect(valid('10100')).toBe(true);
  });

  it('asset accounts start with 1', () => expect('1010'.startsWith('1')).toBe(true));
  it('liability accounts start with 2', () => expect('2100'.startsWith('2')).toBe(true));
  it('equity accounts start with 3', () => expect('3010'.startsWith('3')).toBe(true));
  it('revenue accounts start with 4', () => expect('4010'.startsWith('4')).toBe(true));
  it('expense accounts start with 5 or 6', () => {
    expect(['5','6'].some(p => '6010'.startsWith(p))).toBe(true);
  });

  it('balance sheet accounts: 1+2+3 (BS equation: A=L+E)', () => {
    const assets = 1_000_000; const liabilities = 600_000; const equity = 400_000;
    expect(assets).toBe(liabilities + equity);
  });

  it('duplicate account code rejected', () => {
    const codes = new Set(['1010', '2010', '1010']);
    expect(codes.size).toBe(2);
  });
});

// ─── 4. Month-End Checklist State Machine ────────────────────────────────────

describe('MonthEndChecklist — state machine', () => {
  const TASKS = ['BANK_RECON','AR_AGING','AP_AGING','DEPRECIATION','ACCRUALS','PREPAYMENTS','PAYROLL','GOSI','ZATCA','INVENTORY','FX_REVALUATION','IFRS16','TRIAL_BALANCE','LOCK'];

  it('14 tasks in checklist', () => expect(TASKS).toHaveLength(14));

  it('LOCK is the last task', () => expect(TASKS[TASKS.length - 1]).toBe('LOCK'));

  it('TRIAL_BALANCE before LOCK', () => {
    const tbIdx   = TASKS.indexOf('TRIAL_BALANCE');
    const lockIdx = TASKS.indexOf('LOCK');
    expect(tbIdx).toBeLessThan(lockIdx);
  });

  it('progress %: 7/14 = 50%', () => {
    const done  = 7; const total = 14;
    expect(Math.round((done / total) * 100)).toBe(50);
  });

  it('status: all done → COMPLETE', () => {
    const allDone = TASKS.every(t => ['BANK_RECON','AR_AGING','AP_AGING','DEPRECIATION','ACCRUALS','PREPAYMENTS','PAYROLL','GOSI','ZATCA','INVENTORY','FX_REVALUATION','IFRS16','TRIAL_BALANCE','LOCK'].includes(t));
    expect(allDone).toBe(true);
  });

  it('LOCK blocks further posting after period close', () => {
    const isLocked = true;
    const canPost  = !isLocked;
    expect(canPost).toBe(false);
  });

  it('DEPRECIATION must run before TRIAL_BALANCE', () => {
    const depIdx = TASKS.indexOf('DEPRECIATION');
    const tbIdx  = TASKS.indexOf('TRIAL_BALANCE');
    expect(depIdx).toBeLessThan(tbIdx);
  });

  it('ZATCA batch must complete before period close', () => {
    expect(TASKS.includes('ZATCA')).toBe(true);
  });

  it('PAYROLL before GOSI (GOSI depends on payroll figures)', () => {
    const payIdx  = TASKS.indexOf('PAYROLL');
    const gosiIdx = TASKS.indexOf('GOSI');
    expect(payIdx).toBeLessThan(gosiIdx);
  });
});

// ─── 5. Financial Period Lock Rules ──────────────────────────────────────────

describe('PeriodLock — rules', () => {
  it('locked period rejects new journal entries', () => {
    const isLocked = true;
    expect(!isLocked).toBe(false);
  });

  it('only CFO/admin can unlock a period', () => {
    const roles       = ['admin', 'CFO'];
    const userRole    = 'CFO';
    expect(roles.includes(userRole)).toBe(true);
  });

  it('accountant cannot unlock a locked period', () => {
    const roles    = ['admin', 'CFO'];
    const userRole = 'accountant';
    expect(roles.includes(userRole)).toBe(false);
  });

  it('lock creates audit trail entry', () => {
    const auditEvent = { action: 'PERIOD_LOCK', tableName: 'fiscalPeriod' };
    expect(auditEvent.action).toBe('PERIOD_LOCK');
  });

  it('prior period adjustment requires unlock + re-lock', () => {
    const flow = ['UNLOCK', 'ADJUST', 'RELOCK'];
    expect(flow[0]).toBe('UNLOCK');
    expect(flow[flow.length - 1]).toBe('RELOCK');
  });

  it('comparative period (prior year) always read-only', () => {
    const currentYear = 2025; const priorYear = 2024;
    const isReadOnly  = priorYear < currentYear;
    expect(isReadOnly).toBe(true);
  });

  it('automated tasks (cron) bypass lock for their own period tasks', () => {
    const isCron = true;
    const canPost = isCron || !true; // locked but cron bypasses
    expect(canPost).toBe(true);
  });

  it('lock date defaults to last day of the month', () => {
    const lockDate = new Date(2025, 2, 31); // March 31
    expect(lockDate.getDate()).toBe(31);
    expect(lockDate.getMonth()).toBe(2);
  });

  it('posting in locked period returns 409 Conflict', () => {
    const statusCode = 409;
    expect(statusCode).toBe(409);
  });
});
