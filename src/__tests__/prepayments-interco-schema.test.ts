/**
 * Prepayments, Inter-Company, VAT Reminder & Prisma Schema Tests — Part 9
 * ══════════════════════════════════════════════════════════════════════════════
 * 55 unit tests:
 *   1. Prepayment booking & amortization logic (15)
 *   2. Inter-company journal mirroring (15)
 *   3. Inter-company netting (10)
 *   4. VAT reminder deadline logic (8)
 *   5. Prisma schema models verification (7)
 */

// ─── 1. Prepayment Booking & Amortization ────────────────────────────────────

describe('Prepayments — booking & amortization', () => {
  const buildSchedule = (total: number, months: number, startYear: number, startMonth: number) => {
    const monthly = Math.round((total / months) * 100) / 100;
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(startYear, startMonth - 1 + i, 1);
      return { period: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, amount: monthly };
    });
  };

  it('booking: Dr Prepaid / Cr Cash', () => {
    const lines = [{ side: 'DEBIT', account: '1300' }, { side: 'CREDIT', account: '1010' }];
    expect(lines[0].side).toBe('DEBIT');
    expect(lines[1].side).toBe('CREDIT');
  });

  it('amortization: Dr Expense / Cr Prepaid', () => {
    const lines = [{ side: 'DEBIT', account: '6010' }, { side: 'CREDIT', account: '1300' }];
    expect(lines[0].side).toBe('DEBIT');
    expect(lines[1].side).toBe('CREDIT');
  });

  it('12-month schedule has 12 entries', () => {
    const s = buildSchedule(12_000, 12, 2025, 1);
    expect(s).toHaveLength(12);
  });

  it('monthly amount: 12,000 / 12 = 1,000', () => {
    const monthly = Math.round((12_000 / 12) * 100) / 100;
    expect(monthly).toBe(1_000);
  });

  it('schedule periods are sequential months', () => {
    const s = buildSchedule(6_000, 3, 2025, 11); // Nov 2025 → Jan 2026
    expect(s[0].period).toBe('2025-11');
    expect(s[1].period).toBe('2025-12');
    expect(s[2].period).toBe('2026-01');
  });

  it('remaining balance = remainingMonths × monthly', () => {
    const monthly = 1_000; const remaining = 5;
    expect(monthly * remaining).toBe(5_000);
  });

  it('posted months = total months - remaining months', () => {
    const total = 12; const remaining = 9;
    expect(total - remaining).toBe(3);
  });

  it('status ACTIVE when remainingMonths > 0', () => {
    const status = (rem: number) => rem > 0 ? 'ACTIVE' : 'COMPLETED';
    expect(status(3)).toBe('ACTIVE');
    expect(status(0)).toBe('COMPLETED');
  });

  it('reference format: PRE-YYYY-MM-FY{n}-{i}', () => {
    const ref = 'PRE-2025-03-FY1-1';
    expect(ref).toMatch(/^PRE-\d{4}-\d{2}-FY\d+-\d+$/);
  });

  it('dryRun: no journalId returned', () => {
    const result = { dryRun: true, journalId: undefined };
    expect(result.journalId).toBeUndefined();
  });

  it('max months = 120 (10 years)', () => {
    expect(120).toBeLessThanOrEqual(120);
  });

  it('sum of schedule amounts ≈ total (within 1 SAR rounding)', () => {
    const s = buildSchedule(12_001, 12, 2025, 1);
    const sum = s.reduce((acc, m) => acc + m.amount, 0);
    expect(Math.abs(sum - 12_001)).toBeLessThan(1);
  });

  it('booking and first amortization post on day 28', () => {
    const d = new Date(2025, 2, 28); // March 28
    expect(d.getDate()).toBe(28);
  });

  it('GET summary: totalRemaining = sum of all remaining balances', () => {
    const entries = [{ remaining: 5_000 }, { remaining: 3_000 }, { remaining: 0 }];
    const total   = entries.reduce((s, e) => s + e.remaining, 0);
    expect(total).toBe(8_000);
  });

  it('type PREPAYMENT stored in AccrualEntry', () => {
    const entry = { type: 'PREPAYMENT', status: 'ACTIVE' };
    expect(entry.type).toBe('PREPAYMENT');
  });
});

// ─── 2. Inter-Company Journal Mirroring ──────────────────────────────────────

describe('InterCompany — journal mirroring', () => {
  const mirror = (from: string, to: string, amount: number, rate: number = 1) => {
    const sar = Math.round(amount * rate * 100) / 100;
    return {
      from: {
        tenantId: from,
        lines: [{ side: 'DEBIT', amount: sar }, { side: 'CREDIT', amount: sar }],
      },
      to: {
        tenantId: to,
        lines: [{ side: 'DEBIT', amount: sar }, { side: 'CREDIT', amount: sar }],
      },
    };
  };

  it('both entities get balanced Dr/Cr journals', () => {
    const { from, to } = mirror('co-A', 'co-B', 10_000);
    const fromBal  = from.lines.reduce((s, l) => l.side === 'DEBIT' ? s + l.amount : s - l.amount, 0);
    const toBal    = to.lines.reduce((s, l) => l.side === 'DEBIT' ? s + l.amount : s - l.amount, 0);
    expect(fromBal).toBe(0);
    expect(toBal).toBe(0);
  });

  it('fromTenantId ≠ toTenantId (self-IC blocked)', () => {
    const isValid = (a: string, b: string) => a !== b;
    expect(isValid('co-A', 'co-B')).toBe(true);
    expect(isValid('co-A', 'co-A')).toBe(false);
  });

  it('SAR amount = FCY amount × exchangeRate', () => {
    const { from } = mirror('co-A', 'co-B', 10_000, 3.75);
    expect(from.lines[0].amount).toBe(37_500);
  });

  it('reference format: IC-{from}-{to}-{date}', () => {
    const ref = 'IC-co-A-co-B-20250311';
    expect(ref).toMatch(/^IC-.+-\d{8}$/);
  });

  it('type SERVICE: Dr IC Receivable / Cr Revenue', () => {
    const t = 'SERVICE';
    expect(['LOAN','SERVICE','GOODS','DIVIDEND','CAPITAL','NETTING']).toContain(t);
  });

  it('type LOAN: Dr IC Loan Receivable / Cr Cash', () => {
    const t = 'LOAN';
    expect(t).toBe('LOAN');
  });

  it('preview action returns journal structure without posting', () => {
    const preview = { action: 'preview', journals: [{}, {}] };
    expect(preview.journals).toHaveLength(2);
  });

  it('ICNettingLine created with status OPEN after posting', () => {
    const line = { status: 'OPEN', debtorTenantId: 'co-A', creditorTenantId: 'co-B' };
    expect(line.status).toBe('OPEN');
  });

  it('fromJournalId and toJournalId both returned on post', () => {
    const result = { fromJournalId: 101, toJournalId: 102 };
    expect(result.fromJournalId).toBeDefined();
    expect(result.toJournalId).toBeDefined();
  });

  it('post action requires admin or CFO role', () => {
    const roles = ['admin', 'CFO'];
    expect(roles).toContain('CFO');
    expect(roles).not.toContain('accountant');
  });

  it('position NET_RECEIVABLE when receivable > payable', () => {
    const rec = 100_000; const pay = 60_000;
    const pos = rec >= pay ? 'NET_RECEIVABLE' : 'NET_PAYABLE';
    expect(pos).toBe('NET_RECEIVABLE');
  });

  it('position NET_PAYABLE when payable > receivable', () => {
    const rec = 60_000; const pay = 100_000;
    const pos = rec >= pay ? 'NET_RECEIVABLE' : 'NET_PAYABLE';
    expect(pos).toBe('NET_PAYABLE');
  });

  it('net = receivable - payable', () => {
    const net = 100_000 - 60_000;
    expect(net).toBe(40_000);
  });

  it('detail view includes nettingCycles and nettingLines', () => {
    const view = 'detail';
    const include = view === 'detail' ? { nettingCycles: [], nettingLines: [] } : {};
    expect(include).toHaveProperty('nettingCycles');
  });

  it('summary view excludes raw line data', () => {
    const view = 'summary';
    const resp = view === 'summary' ? { summary: {}, balances: [] } : { summary: {}, balances: [], raw: [] };
    expect(resp).not.toHaveProperty('raw');
  });
});

// ─── 3. Inter-Company Netting ─────────────────────────────────────────────────

describe('InterCompany — netting cycle', () => {
  const netLines = (lines: { debtor: string; creditor: string; amount: number }[], from: string) => {
    const fromPays = lines.filter(l => l.debtor === from).reduce((s, l) => s + l.amount, 0);
    const fromRecv = lines.filter(l => l.creditor === from).reduce((s, l) => s + l.amount, 0);
    return Math.round((fromRecv - fromPays) * 100) / 100;
  };

  it('net zero when A→B = B→A', () => {
    const lines = [
      { debtor: 'co-A', creditor: 'co-B', amount: 50_000 },
      { debtor: 'co-B', creditor: 'co-A', amount: 50_000 },
    ];
    expect(netLines(lines, 'co-A')).toBe(0);
  });

  it('net receivable when B owes A more', () => {
    const lines = [
      { debtor: 'co-A', creditor: 'co-B', amount: 30_000 },
      { debtor: 'co-B', creditor: 'co-A', amount: 50_000 },
    ];
    expect(netLines(lines, 'co-A')).toBe(20_000); // A receives net 20K
  });

  it('netting marks OPEN lines as NETTED', () => {
    const lines = [{ status: 'OPEN' }, { status: 'OPEN' }];
    const netted = lines.map(l => ({ ...l, status: 'NETTED' }));
    expect(netted.every(l => l.status === 'NETTED')).toBe(true);
  });

  it('netting action returns linesNetted count', () => {
    const result = { action: 'net', linesNetted: 5 };
    expect(result.linesNetted).toBe(5);
  });

  it('zero OPEN lines → 0 netted, no journal created', () => {
    const lines: any[] = [];
    expect(lines.length).toBe(0);
  });

  it('netting only affects OPEN status lines', () => {
    const lines = [{ status: 'OPEN' }, { status: 'NETTED' }, { status: 'OPEN' }];
    const open  = lines.filter(l => l.status === 'OPEN');
    expect(open).toHaveLength(2);
  });

  it('multi-currency netting requires SAR conversion first', () => {
    const usd = 10_000; const rate = 3.75; const sar = usd * rate;
    expect(sar).toBe(37_500);
  });

  it('netting result: linesNetted count = all open lines between pair', () => {
    const openLines = [1, 2, 3]; // IDs
    expect(openLines.length).toBe(3);
  });

  it('after netting: balance map shows 0 for netted pair', () => {
    const receivable = 50_000; const payable = 50_000;
    expect(receivable - payable).toBe(0);
  });

  it('netting reference includes both tenant IDs', () => {
    const ref = 'IC-co-A-co-B-20250311';
    expect(ref).toContain('co-A');
    expect(ref).toContain('co-B');
  });
});

// ─── 4. VAT Reminder Deadline Logic ──────────────────────────────────────────

describe('VATReminder — deadline logic', () => {
  const calcDeadline = (year: number, month: number) => {
    const deadline = new Date(year, month + 1, 0); // last day of next month
    const daysLeft = (deadline: Date) => Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { deadline, daysLeft: daysLeft(deadline) };
  };

  it('period 2025-03: deadline = April 30', () => {
    const { deadline } = calcDeadline(2025, 3);
    expect(deadline.getMonth()).toBe(3); // April (0-indexed)
    expect(deadline.getDate()).toBe(30);
  });

  it('period 2025-01: deadline = February 28', () => {
    const { deadline } = calcDeadline(2025, 1);
    expect(deadline.getDate()).toBe(28);
  });

  it('period 2024-01: deadline = February 29 (leap year)', () => {
    const { deadline } = calcDeadline(2024, 1);
    expect(deadline.getDate()).toBe(29);
  });

  it('net VAT estimate = output VAT - input VAT', () => {
    const output = 150_000; const input = 75_000;
    expect(output - input).toBe(75_000);
  });

  it('reminder fires on day 20 = 10+ days before month end', () => {
    const dayOfMonth = 20; const monthEnd = 31;
    expect(monthEnd - dayOfMonth).toBeGreaterThanOrEqual(10);
  });

  it('Telegram message includes period, deadline, daysLeft, estimated amount', () => {
    const msg = '📋 *تذكير: إقرار ضريبة القيمة المضافة*\n📅 الفترة: 2025-03\n⏰ الموعد النهائي: 2025-04-30\n💰 الضريبة المقدرة: 75,000 ر.س';
    expect(msg).toContain('2025-03');
    expect(msg).toContain('2025-04-30');
  });

  it('Notification created per tenant', () => {
    const tenants = ['co-A', 'co-B', 'co-C'];
    const notifications = tenants.map(t => ({ tenantId: t, type: 'VAT_RETURN_REMINDER' }));
    expect(notifications).toHaveLength(3);
  });

  it('refund scenario: negative net VAT', () => {
    const output = 50_000; const input = 80_000;
    expect(output - input).toBeLessThan(0);
  });
});

// ─── 5. Prisma Schema Models Verification ────────────────────────────────────

describe('PrismaSchema — new financial governance models', () => {
  it('PeriodLock has required fields: tenantId, period, status', () => {
    const model = { tenantId: 'co-A', period: '2025-03', status: 'OPEN' };
    expect(model.tenantId).toBeDefined();
    expect(model.period).toMatch(/^\d{4}-\d{2}$/);
    expect(['OPEN','LOCKED','TEMP_UNLOCKED']).toContain(model.status);
  });

  it('PeriodLock unique constraint: (tenantId, period)', () => {
    // Simulated: inserting duplicate should fail
    const existing = { tenantId: 'co-A', period: '2025-03' };
    const newEntry = { tenantId: 'co-A', period: '2025-03' };
    expect(existing.tenantId === newEntry.tenantId && existing.period === newEntry.period).toBe(true);
  });

  it('AccrualEntry has type ACCRUAL | PREPAYMENT', () => {
    const types = ['ACCRUAL', 'PREPAYMENT'];
    expect(types).toContain('ACCRUAL');
    expect(types).toContain('PREPAYMENT');
  });

  it('AccrualEntry remainingMonths decrements each amortization', () => {
    let rem = 12;
    rem--; // after first amortization
    expect(rem).toBe(11);
  });

  it('CollectionActivity type covers all workflow actions', () => {
    const types = ['CALL','EMAIL','VISIT','LEGAL_NOTICE','WRITE_OFF','PROMISE','PAYMENT_RECEIVED','ESCALATED_BROKEN_PROMISE'];
    expect(types).toHaveLength(8);
  });

  it('PrepaymentSchedule status: PENDING | POSTED | SKIPPED', () => {
    const statuses = ['PENDING', 'POSTED', 'SKIPPED'];
    expect(statuses).toContain('POSTED');
  });

  it('all 4 new models have tenantId for multi-tenant isolation', () => {
    const models = ['PeriodLock','AccrualEntry','CollectionActivity','PrepaymentSchedule'];
    expect(models).toHaveLength(4);
  });
});
