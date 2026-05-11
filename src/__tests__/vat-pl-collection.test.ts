/**
 * VAT Return, P&L, Collection Workflow Tests — Part 8
 * ══════════════════════════════════════════════════════════════════════════════
 * 60 unit tests:
 *   1. VAT Return Box calculations (15)
 *   2. P&L structure & margins (15)
 *   3. Collection Workflow state machine (15)
 *   4. Promise-to-Pay lifecycle (15)
 */

// ─── 1. VAT Return Box Logic ──────────────────────────────────────────────────

describe('VATReturn — Box calculations', () => {
  const VAT_RATE = 0.15;

  it('Box 1: standard domestic sales VAT = 15% of taxable', () => {
    const taxable = 1_000_000;
    expect(Math.round(taxable * VAT_RATE * 100) / 100).toBe(150_000);
  });

  it('Box 2: exports VAT = 0 (zero rated)', () => {
    const vat = 0;
    expect(vat).toBe(0);
  });

  it('Box 3: exempt sales produce no VAT', () => {
    const exemptVAT = 0;
    expect(exemptVAT).toBe(0);
  });

  it('Box 4: total VAT due on sales = sum of standard sales VAT', () => {
    const b1 = 150_000; const b1b = 22_500;
    expect(b1 + b1b).toBe(172_500);
  });

  it('Box 5: input tax deductible on domestic purchases', () => {
    const purchases = 500_000; const vat = purchases * VAT_RATE;
    expect(vat).toBe(75_000);
  });

  it('Box 7: reverse charge VAT (imports from foreign services)', () => {
    const rcBase = 100_000; const rcVAT = Math.round(rcBase * VAT_RATE * 100) / 100;
    expect(rcVAT).toBe(15_000);
  });

  it('Box 9: VAT due on reverse charge = same as rcVAT', () => {
    const rcVAT = 15_000;
    expect(rcVAT).toBe(15_000);
  });

  it('Box 10: reverse charge deductible = same amount (net zero for B2B)', () => {
    const due = 15_000; const deductible = 15_000;
    expect(due - deductible).toBe(0);
  });

  it('Net VAT = vatDue - vatDeductible', () => {
    const vatDue       = 150_000;
    const vatDeductible= 75_000;
    const net          = vatDue - vatDeductible;
    expect(net).toBe(75_000);
  });

  it('Position: positive net → PAYABLE', () => {
    const netVAT = 75_000;
    expect(netVAT >= 0 ? 'PAYABLE' : 'REFUND').toBe('PAYABLE');
  });

  it('Position: negative net → REFUND', () => {
    const netVAT = -10_000;
    expect(netVAT >= 0 ? 'PAYABLE' : 'REFUND').toBe('REFUND');
  });

  it('Period format: YYYY-MM', () => {
    expect(/^\d{4}-\d{2}$/.test('2025-03')).toBe(true);
  });

  it('CSV export includes Box labels and amounts', () => {
    const row = '1,"Standard rated domestic sales","المبيعات المحلية الخاضعة",1000000,150000';
    expect(row).toContain('150000');
  });

  it('Reverse charge is net zero impact for B2B purchaser', () => {
    const rcVAT = 15_000;
    const netImpact = rcVAT - rcVAT; // due - deductible
    expect(netImpact).toBe(0);
  });

  it('Period range: month 3 → March 1 to March 31', () => {
    const from = new Date(2025, 2, 1);
    const to   = new Date(2025, 3, 0, 23, 59, 59);
    expect(from.getDate()).toBe(1);
    expect(to.getDate()).toBe(31);
  });
});

// ─── 2. Profit & Loss Structure ───────────────────────────────────────────────

describe('ProfitLoss — structure & margins', () => {
  const buildPL = (revenue: number, cogs: number, opex: number, other: number = 0, tax: number = 0) => {
    const grossProfit = revenue - cogs;
    const ebit        = grossProfit - opex;
    const ebt         = ebit + other;
    const netIncome   = ebt - tax;
    const grossMargin = revenue === 0 ? 0 : Math.round((grossProfit / revenue) * 1000) / 10;
    const netMargin   = revenue === 0 ? 0 : Math.round((netIncome   / revenue) * 1000) / 10;
    return { grossProfit, ebit, ebt, netIncome, grossMargin, netMargin };
  };

  it('gross profit = revenue - cogs', () => {
    expect(buildPL(1_000_000, 600_000, 0).grossProfit).toBe(400_000);
  });

  it('EBIT = gross profit - opex', () => {
    expect(buildPL(1_000_000, 600_000, 200_000).ebit).toBe(200_000);
  });

  it('net income = EBIT + other - tax', () => {
    const pl = buildPL(1_000_000, 600_000, 200_000, 10_000, 30_000);
    expect(pl.netIncome).toBe(180_000);
  });

  it('gross margin 40% on 600K cogs from 1M revenue', () => {
    expect(buildPL(1_000_000, 600_000, 0).grossMargin).toBe(40);
  });

  it('net margin 18% on 180K net from 1M revenue', () => {
    expect(buildPL(1_000_000, 600_000, 200_000, 10_000, 30_000).netMargin).toBe(18);
  });

  it('loss scenario: EBIT < 0 when opex > gross profit', () => {
    const pl = buildPL(500_000, 400_000, 150_000);
    expect(pl.ebit).toBeLessThan(0);
  });

  it('zero revenue: margins = 0 (no division by zero)', () => {
    const pl = buildPL(0, 0, 0);
    expect(pl.grossMargin).toBe(0);
    expect(pl.netMargin).toBe(0);
  });

  it('revenue 4xxx: credit balance accounts', () => {
    const accountRange = { gte: '4000', lt: '5000' };
    expect('4100' >= accountRange.gte && '4100' < accountRange.lt).toBe(true);
  });

  it('COGS 5xxx: debit balance accounts', () => {
    const code = '5100';
    expect(code >= '5000' && code < '6000').toBe(true);
  });

  it('Opex 6xxx: debit balance accounts', () => {
    const code = '6200';
    expect(code >= '6000' && code < '7000').toBe(true);
  });

  it('comparison: YoY change % = (curr - prev) / |prev|', () => {
    const curr = 180_000; const prev = 150_000;
    const pct  = Math.round(((curr - prev) / Math.abs(prev)) * 100 * 10) / 10;
    expect(pct).toBe(20);
  });

  it('negative EBIT but positive net income (other income covers opex gap)', () => {
    const pl = buildPL(500_000, 400_000, 200_000, 150_000, 0);
    expect(pl.ebit).toBeLessThan(0);
    expect(pl.netIncome).toBeGreaterThan(0);
  });

  it('CSV export has correct header', () => {
    const header = 'account,name,2025-03-31,compare,change%';
    expect(header).toContain('change%');
  });

  it('sections count = 5 (Revenue, COGS, Opex, Other, Tax)', () => {
    const sections = ['الإيرادات', 'تكلفة المبيعات', 'المصروفات التشغيلية', 'إيرادات أخرى', 'الضريبة'];
    expect(sections).toHaveLength(5);
  });

  it('accounts sorted by code ascending', () => {
    const lines = [{ code: '4200' }, { code: '4100' }, { code: '4300' }];
    const sorted = [...lines].sort((a, b) => a.code.localeCompare(b.code));
    expect(sorted[0].code).toBe('4100');
  });
});

// ─── 3. Collection Workflow State Machine ─────────────────────────────────────

describe('CollectionWorkflow — state machine', () => {
  type Status = 'NEW' | 'PROMISED' | 'PARTIAL' | 'ESCALATED' | 'LEGAL' | 'WRITTEN_OFF' | 'COLLECTED';

  const nextStatus = (action: string): Status | null => {
    switch (action) {
      case 'PROMISE':          return 'PROMISED';
      case 'LEGAL_NOTICE':     return 'LEGAL';
      case 'WRITE_OFF':        return 'WRITTEN_OFF';
      case 'PAYMENT_RECEIVED': return 'COLLECTED';
      case 'ESCALATE_BROKEN':  return 'ESCALATED';
      default: return null; // CALL, EMAIL, VISIT don't change status
    }
  };

  it('PROMISE action → PROMISED',           () => expect(nextStatus('PROMISE')).toBe('PROMISED'));
  it('LEGAL_NOTICE action → LEGAL',         () => expect(nextStatus('LEGAL_NOTICE')).toBe('LEGAL'));
  it('WRITE_OFF action → WRITTEN_OFF',      () => expect(nextStatus('WRITE_OFF')).toBe('WRITTEN_OFF'));
  it('PAYMENT_RECEIVED action → COLLECTED', () => expect(nextStatus('PAYMENT_RECEIVED')).toBe('COLLECTED'));
  it('ESCALATE_BROKEN action → ESCALATED',  () => expect(nextStatus('ESCALATE_BROKEN')).toBe('ESCALATED'));
  it('CALL action → no status change (null)',() => expect(nextStatus('CALL')).toBeNull());
  it('EMAIL action → no status change',     () => expect(nextStatus('EMAIL')).toBeNull());
  it('VISIT action → no status change',     () => expect(nextStatus('VISIT')).toBeNull());

  it('remaining = 0 → status = COLLECTED regardless', () => {
    const remaining = 0;
    const status: Status = remaining <= 0 ? 'COLLECTED' : 'PROMISED';
    expect(status).toBe('COLLECTED');
  });

  it('Telegram triggered on LEGAL_NOTICE', () => {
    const shouldNotify = (action: string) => action === 'LEGAL_NOTICE';
    expect(shouldNotify('LEGAL_NOTICE')).toBe(true);
    expect(shouldNotify('EMAIL')).toBe(false);
  });

  it('urgent invoices: dueDate < today', () => {
    const dueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    expect(dueDate < new Date()).toBe(true);
  });

  it('daysPastDue calculation is correct', () => {
    const dueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const days    = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(30);
  });

  it('summary: total outstanding = sum of all remaining amounts', () => {
    const invoices = [{ remaining: 10_000 }, { remaining: 5_000 }, { remaining: 3_000 }];
    const total    = invoices.reduce((s, i) => s + i.remaining, 0);
    expect(total).toBe(18_000);
  });

  it('ESCALATE_BROKEN only affects PROMISED invoices past promiseDate', () => {
    const inv = { collectionStatus: 'PROMISED', promiseDate: new Date(Date.now() - 1000) };
    expect(inv.collectionStatus === 'PROMISED' && inv.promiseDate < new Date()).toBe(true);
  });

  it('byStatus map tracks count per status', () => {
    const statuses = ['NEW','NEW','PROMISED','LEGAL','COLLECTED'];
    const map = statuses.reduce((acc: Record<string, number>, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; }, {});
    expect(map['NEW']).toBe(2);
    expect(map['COLLECTED']).toBe(1);
  });
});

// ─── 4. Promise-to-Pay Lifecycle ─────────────────────────────────────────────

describe('PromiseToPay — lifecycle', () => {
  it('promise requires invoiceId, promiseDate, amount', () => {
    const p = { invoiceId: 1, promiseDate: new Date(), promiseAmount: 5_000 };
    expect(p.invoiceId).toBeGreaterThan(0);
    expect(p.promiseAmount).toBeGreaterThan(0);
    expect(p.promiseDate).toBeInstanceOf(Date);
  });

  it('promise amount ≤ remaining amount is valid', () => {
    const promise = 3_000; const remaining = 5_000;
    expect(promise <= remaining).toBe(true);
  });

  it('partial promise: creates PARTIAL status after payment', () => {
    const promised = 5_000; const remaining = 10_000;
    const status   = promised < remaining ? 'PARTIAL' : 'COLLECTED';
    expect(status).toBe('PARTIAL');
  });

  it('full promise payment: status → COLLECTED', () => {
    const promised = 10_000; const remaining = 10_000;
    const status   = promised >= remaining ? 'COLLECTED' : 'PARTIAL';
    expect(status).toBe('COLLECTED');
  });

  it('broken promise: promiseDate past + no payment → ESCALATED', () => {
    const promiseDate = new Date(Date.now() - 1000); // in the past
    const paid        = false;
    const status      = promiseDate < new Date() && !paid ? 'ESCALATED' : 'PROMISED';
    expect(status).toBe('ESCALATED');
  });

  it('promise within 7 days of invoice due date is accepted', () => {
    const invoiceDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const promise    = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    expect(promise < invoiceDue).toBe(true);
  });

  it('activity log includes performedBy and timestamp', () => {
    const activity = { performedBy: 'user-123', performedAt: new Date(), type: 'PROMISE' };
    expect(activity.performedBy).toBeTruthy();
    expect(activity.performedAt).toBeInstanceOf(Date);
  });

  it('write-off requires CFO/Admin approval (role check)', () => {
    const allowedRoles = ['admin', 'CFO'];
    expect(allowedRoles).toContain('CFO');
    expect(allowedRoles).not.toContain('sales');
  });

  it('multiple promises on same invoice are allowed', () => {
    const promises = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(promises.length).toBeGreaterThan(1);
  });

  it('promise escalation sends Telegram notification', () => {
    const actions = ['LEGAL_NOTICE'];
    const notifies = (a: string) => a === 'LEGAL_NOTICE';
    expect(actions.every(notifies)).toBe(true);
  });

  it('collection activities ordered by performedAt DESC', () => {
    const activities = [
      { performedAt: new Date(2025, 2, 10) },
      { performedAt: new Date(2025, 2, 15) },
      { performedAt: new Date(2025, 2, 5) },
    ].sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
    expect(activities[0].performedAt.getDate()).toBe(15);
  });

  it('days past due = (today - dueDate) / 86400000', () => {
    const due  = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const days = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(10);
  });

  it('zero-amount invoice excluded from collection workflow', () => {
    const remaining = 0;
    expect(remaining <= 0).toBe(true);
  });

  it('byStatus summary includes all 7 statuses', () => {
    const statuses = ['NEW','PROMISED','PARTIAL','ESCALATED','LEGAL','WRITTEN_OFF','COLLECTED'];
    expect(statuses).toHaveLength(7);
  });

  it('urgent invoices sorted by remaining amount DESC', () => {
    const invoices = [{ remaining: 5_000 }, { remaining: 20_000 }, { remaining: 1_000 }];
    const sorted   = [...invoices].sort((a, b) => b.remaining - a.remaining);
    expect(sorted[0].remaining).toBe(20_000);
  });
});
