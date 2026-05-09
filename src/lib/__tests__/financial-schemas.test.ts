/**
 * Unit Tests — financial-schemas.ts
 * Tests: all Zod schemas parse valid data & reject invalid data
 */

import {
  CreateJournalEntrySchema,
  ApplyPaymentSchema,
  DisputeSchema,
  BankReconRuleSchema,
  RunPayrollSchema,
  HrEosSchema,
  HrPerformanceSchema,
  ClosePeriodSchema,
  YearEndInitiateSchema,
  BudgetSchema,
  ZatcaOnboardSchema,
  ApCaptureSchema,
  FxRevaluationSchema,
  EclRunSchema,
  PaymentRunProposeSchema,
  PromiseToPaySchema,
  DunningRunSchema,
  AllocationSchema,
} from '../validations/financial-schemas';

// ── Journal Entry ─────────────────────────────────────────────────────────────

describe('CreateJournalEntrySchema', () => {
  const valid = {
    entryDate: '2026-05-01',
    description: 'Bank payment to supplier',
    lines: [
      { accountId: 1001, debit: 5000, credit: 0 },
      { accountId: 2001, debit: 0,    credit: 5000 },
    ],
  };

  test('valid balanced JE → passes', () => {
    expect(CreateJournalEntrySchema.safeParse(valid).success).toBe(true);
  });

  test('unbalanced JE → fails', () => {
    const unbalanced = { ...valid, lines: [
      { accountId: 1001, debit: 5000, credit: 0 },
      { accountId: 2001, debit: 0,    credit: 4000 },
    ]};
    expect(CreateJournalEntrySchema.safeParse(unbalanced).success).toBe(false);
  });

  test('single line JE → fails (min 2)', () => {
    const oneLine = { ...valid, lines: [{ accountId: 1001, debit: 100, credit: 0 }] };
    expect(CreateJournalEntrySchema.safeParse(oneLine).success).toBe(false);
  });

  test('missing description → fails', () => {
    const r = CreateJournalEntrySchema.safeParse({ ...valid, description: '' });
    expect(r.success).toBe(false);
  });

  test('invalid date format → fails', () => {
    const r = CreateJournalEntrySchema.safeParse({ ...valid, entryDate: '01-05-2026' });
    expect(r.success).toBe(false);
  });
});

// ── Apply Payment ─────────────────────────────────────────────────────────────

describe('ApplyPaymentSchema', () => {
  test('valid → passes', () => {
    expect(ApplyPaymentSchema.safeParse({ debitItemId: 1, creditItemId: 2, amount: 5000 }).success).toBe(true);
  });

  test('negative amount → fails', () => {
    expect(ApplyPaymentSchema.safeParse({ debitItemId: 1, creditItemId: 2, amount: -100 }).success).toBe(false);
  });

  test('same item both sides → still passes schema (business rule check elsewhere)', () => {
    // Schema allows same IDs — business logic must catch
    expect(ApplyPaymentSchema.safeParse({ debitItemId: 1, creditItemId: 1, amount: 100 }).success).toBe(true);
  });
});

// ── Payroll ───────────────────────────────────────────────────────────────────

describe('RunPayrollSchema', () => {
  test('valid period YYYY-MM → passes', () => {
    expect(RunPayrollSchema.safeParse({ period: '2026-05' }).success).toBe(true);
  });

  test('wrong period format → fails', () => {
    expect(RunPayrollSchema.safeParse({ period: '05-2026' }).success).toBe(false);
    expect(RunPayrollSchema.safeParse({ period: '2026-5' }).success).toBe(false);
  });

  test('with branchId → passes', () => {
    expect(RunPayrollSchema.safeParse({ period: '2026-05', branchId: 3 }).success).toBe(true);
  });
});

// ── HR — EOS ─────────────────────────────────────────────────────────────────

describe('HrEosSchema', () => {
  const valid = { employeeId: 5, terminationDate: '2026-05-31', reason: 'RESIGNATION' };
  test('valid → passes', () => expect(HrEosSchema.safeParse(valid).success).toBe(true));
  test('invalid reason → fails', () => {
    expect(HrEosSchema.safeParse({ ...valid, reason: 'QUIT' }).success).toBe(false);
  });
  test('invalid date → fails', () => {
    expect(HrEosSchema.safeParse({ ...valid, terminationDate: 'May 31' }).success).toBe(false);
  });
});

// ── Period Close ──────────────────────────────────────────────────────────────

describe('ClosePeriodSchema', () => {
  test('CLOSE action → passes', () => {
    expect(ClosePeriodSchema.safeParse({ period: '2026-04', action: 'CLOSE' }).success).toBe(true);
  });
  test('REOPEN action → passes', () => {
    expect(ClosePeriodSchema.safeParse({ period: '2026-04', action: 'REOPEN' }).success).toBe(true);
  });
  test('APPROVE action → fails (not in enum)', () => {
    expect(ClosePeriodSchema.safeParse({ period: '2026-04', action: 'APPROVE' }).success).toBe(false);
  });
});

// ── Year-End Initiate ─────────────────────────────────────────────────────────

describe('YearEndInitiateSchema', () => {
  const valid = { year: 2025, retainedEarningsAccountId: 3001, closingDate: '2025-12-31' };
  test('valid → passes', () => expect(YearEndInitiateSchema.safeParse(valid).success).toBe(true));
  test('year 1999 → fails (too old)', () => {
    expect(YearEndInitiateSchema.safeParse({ ...valid, year: 1999 }).success).toBe(false);
  });
  test('year 2101 → fails (too far)', () => {
    expect(YearEndInitiateSchema.safeParse({ ...valid, year: 2101 }).success).toBe(false);
  });
});

// ── ZATCA ─────────────────────────────────────────────────────────────────────

describe('ZatcaOnboardSchema', () => {
  test('valid OTP + sandbox → passes', () => {
    expect(ZatcaOnboardSchema.safeParse({ otp: '123456', environment: 'sandbox' }).success).toBe(true);
  });
  test('OTP too short → fails', () => {
    expect(ZatcaOnboardSchema.safeParse({ otp: '12345', environment: 'sandbox' }).success).toBe(false);
  });
  test('invalid environment → fails', () => {
    expect(ZatcaOnboardSchema.safeParse({ otp: '123456', environment: 'staging' }).success).toBe(false);
  });
});

// ── AP Capture ────────────────────────────────────────────────────────────────

describe('ApCaptureSchema', () => {
  const valid = {
    vendorId: 10, invoiceRef: 'INV-2026-001', amount: 15000,
    invoiceDate: '2026-05-01', dueDate: '2026-06-01', currency: 'SAR',
    lines: [{ accountId: 6001, amount: 15000 }],
  };
  test('valid → passes', () => expect(ApCaptureSchema.safeParse(valid).success).toBe(true));
  test('no lines → fails', () => {
    expect(ApCaptureSchema.safeParse({ ...valid, lines: [] }).success).toBe(false);
  });
  test('negative amount → fails', () => {
    expect(ApCaptureSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false);
  });
});

// ── Budget Schema ─────────────────────────────────────────────────────────────

describe('BudgetSchema', () => {
  const valid = {
    name: 'Q2 2026 Budget', year: 2026, type: 'OPERATIONAL',
    lines: [{ accountId: 5001, period: '2026-04', amount: 50000 }],
  };
  test('valid → passes', () => expect(BudgetSchema.safeParse(valid).success).toBe(true));
  test('empty lines → fails', () => {
    expect(BudgetSchema.safeParse({ ...valid, lines: [] }).success).toBe(false);
  });
  test('invalid type → fails', () => {
    expect(BudgetSchema.safeParse({ ...valid, type: 'MARKETING' }).success).toBe(false);
  });
});

// ── Dunning Run ───────────────────────────────────────────────────────────────

describe('DunningRunSchema', () => {
  test('default values → passes', () => {
    const r = DunningRunSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dryRun).toBe(false);
      expect(r.data.sendEmail).toBe(true);
    }
  });
  test('dry run mode → passes', () => {
    expect(DunningRunSchema.safeParse({ dryRun: true }).success).toBe(true);
  });
});

// ── Allocation Schema ─────────────────────────────────────────────────────────

describe('AllocationSchema', () => {
  const valid = {
    sourceAccountId: 7001, period: '2026-04', method: 'PERCENTAGE',
    targets: [
      { costCenterId: 1, weight: 60 },
      { costCenterId: 2, weight: 40 },
    ],
  };
  test('valid → passes', () => expect(AllocationSchema.safeParse(valid).success).toBe(true));
  test('single target → fails (min 2)', () => {
    expect(AllocationSchema.safeParse({ ...valid, targets: [{ costCenterId: 1, weight: 100 }] }).success).toBe(false);
  });
  test('invalid method → fails', () => {
    expect(AllocationSchema.safeParse({ ...valid, method: 'RANDOM' }).success).toBe(false);
  });
});
