/**
 * Centralized Zod Schemas for Financial API Routes
 * Imported by all accounting/finance/hr/payroll routes
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.validations.' });

// ── Primitives ────────────────────────────────────────────────────────────────

export const zId        = z.number().int().positive();
export const zIdStr     = z.string().min(1);
export const zTenantId  = z.string().min(1).default('default');
export const zAmount    = z.number().finite().nonnegative();
export const zAmountAny = z.number().finite();  // can be negative (adjustments)
export const zDate      = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'must be YYYY-MM-DD');
export const zPeriod    = z.string().regex(/^\d{4}-\d{2}$/, 'must be YYYY-MM');
export const zYear      = z.number().int().min(2000).max(2100);
export const zCurrency  = z.string().length(3).default('SAR');
export const zEntryNum  = z.string().min(1).max(50);
export const zNotes     = z.string().max(2000).optional();
export const zUserId    = z.union([z.string(), z.number()]).optional();

// ── Journal Entry ─────────────────────────────────────────────────────────────

export const JournalLineSchema = z.object({
  accountId:    zId,
  debit:        z.number().finite().nonnegative().default(0),
  credit:       z.number().finite().nonnegative().default(0),
  description:  z.string().max(500).optional(),
  costCenterId: zId.optional(),
}).refine(l => l.debit > 0 || l.credit > 0, 'line must have debit or credit');

export const CreateJournalEntrySchema = z.object({
  entryNumber:  zEntryNum.optional(),
  entryDate:    zDate,
  description:  z.string().min(3).max(500),
  lines:        z.array(JournalLineSchema).min(2).max(500),
  reference:    z.string().max(100).optional(),
  bookId:       zId.optional(),
  costCenterId: zId.optional(),
  attachments:  z.array(z.string().url()).optional(),
}).refine(je => {
  const totalDebit  = je.lines.reduce((s: any, l: any) => s + l.debit,  0);
  const totalCredit = je.lines.reduce((s: any, l: any) => s + l.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, 'Journal entry must be balanced (debits = credits)');

// ── Payment / Open Items ──────────────────────────────────────────────────────

export const ApplyPaymentSchema = z.object({
  debitItemId:  zId,
  creditItemId: zId,
  amount:       zAmount,
  exchangeRate: z.number().finite().positive().default(1),
  appliedDate:  zDate.optional(),
});

export const DisputeSchema = z.object({
  openItemId: zId,
  reason:     z.enum(['BILLING_ERROR', 'QUANTITY_DISPUTE', 'QUALITY_ISSUE', 'DUPLICATE', 'OTHER']),
  notes:      z.string().min(10).max(1000),
});

// ── Bank Reconciliation ───────────────────────────────────────────────────────

export const BankMatchSchema = z.object({
  bankLineId:   zId,
  journalLineId: zId.optional(),
  bankEntryId:  zId.optional(),
  notes:        zNotes,
});

export const BankReconRuleSchema = z.object({
  name:        z.string().min(2).max(100),
  pattern:     z.string().min(1),
  accountId:   zId,
  direction:   z.enum(['CREDIT', 'DEBIT', 'BOTH']).default('BOTH'),
  isActive:    z.boolean().default(true),
  priority:    z.number().int().min(1).max(100).default(50),
});

// ── Treasury ──────────────────────────────────────────────────────────────────

export const TreasuryCashPositionSchema = z.object({
  bankAccountId: zId,
  snapshotDate:  zDate,
  balance:       zAmountAny,
  currency:      zCurrency,
  notes:         zNotes,
});

export const LiquidityForecastSchema = z.object({
  startDate:    zDate,
  endDate:      zDate,
  scenarioType: z.enum(['BASE', 'OPTIMISTIC', 'PESSIMISTIC']).default('BASE'),
});

// ── Payroll ───────────────────────────────────────────────────────────────────

export const RunPayrollSchema = z.object({
  period:   zPeriod,
  branchId: zId.optional(),
  dryRun:   z.boolean().default(false),
});

export const PayrollProvisionSchema = z.object({
  period:    zPeriod,
  types:     z.array(z.enum(['EOS', 'VACATION', 'GOSI', 'OVERTIME'])).min(1),
  overwrite: z.boolean().default(false),
});

export const WpsGenerateSchema = z.object({
  period:   zPeriod,
  bankCode: z.string().min(2).max(10).optional(),
});

// ── HR ────────────────────────────────────────────────────────────────────────

export const HrTimesheetSchema = z.object({
  employeeId: zId,
  date:       zDate,
  hoursRegular:  z.number().min(0).max(24),
  hoursOvertime: z.number().min(0).max(24).default(0),
  projectId:  zId.optional(),
  notes:      zNotes,
});

export const HrLeaveAccrualSchema = z.object({
  period:     zPeriod,
  employeeId: zId.optional(),  // if null → all employees
  overwrite:  z.boolean().default(false),
});

export const HrEosSchema = z.object({
  employeeId:    zId,
  terminationDate: zDate,
  reason:        z.enum(['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'DEATH', 'CONTRACT_END']),
  notes:         zNotes,
});

export const HrGosiSchema = z.object({
  period:     zPeriod,
  employeeId: zId.optional(),
});

export const HrPerformanceSchema = z.object({
  employeeId: zId,
  period:     zPeriod,
  kpis:       z.array(z.object({
    name:   z.string().min(2),
    score:  z.number().min(0).max(100),
    weight: z.number().min(0).max(100),
  })).min(1).max(20),
  notes: zNotes,
});

// ── Fiscal Year / Period ──────────────────────────────────────────────────────

export const FiscalYearSchema = z.object({
  year:      zYear,
  startDate: zDate,
  endDate:   zDate,
  name:      z.string().min(2).max(100).optional(),
});

export const ClosePeriodSchema = z.object({
  period:    zPeriod,
  action:    z.enum(['CLOSE', 'LOCK', 'REOPEN']),
  reason:    z.string().min(5).max(500).optional(),
  force:     z.boolean().default(false),
});

export const YearEndInitiateSchema = z.object({
  year:              zYear,
  retainedEarningsAccountId: zId,
  closingDate:       zDate,
  force:             z.boolean().default(false),
});

// ── Budget ────────────────────────────────────────────────────────────────────

export const BudgetSchema = z.object({
  name:          z.string().min(2).max(100),
  year:          zYear,
  type:          z.enum(['OPERATIONAL', 'CAPITAL', 'CASH_FLOW']).default('OPERATIONAL'),
  lines:         z.array(z.object({
    accountId:  zId,
    period:     zPeriod,
    amount:     zAmount,
  })).min(1).max(1000),
  isApproved:    z.boolean().default(false),
});

export const BudgetControlSchema = z.object({
  accountId:   zId,
  period:      zPeriod,
  budgetedAmount: zAmount,
  alertThreshold: z.number().min(0).max(150).default(90), // % of budget
});

// ── AR / Dunning ──────────────────────────────────────────────────────────────

export const DunningRunSchema = z.object({
  customerId: zId.optional(),
  dryRun:     z.boolean().default(false),
  levelId:    zId.optional(),
  sendEmail:  z.boolean().default(true),
});

export const PromiseToPaySchema = z.object({
  openItemId:   zId,
  promisedDate: zDate,
  amount:       zAmount,
  notes:        zNotes,
});

export const CreditNoteSchema = z.object({
  invoiceId: zId,
  reason:    z.enum(['RETURN', 'PRICE_ADJUSTMENT', 'CANCELLATION', 'OTHER']),
  amount:    zAmount,
  notes:     z.string().min(5).max(1000),
});

// ── ZATCA ─────────────────────────────────────────────────────────────────────

export const ZatcaOnboardSchema = z.object({
  otp:             z.string().length(6),
  environment:     z.enum(['sandbox', 'production']).default('sandbox'),
  complianceCheck: z.boolean().default(true),
});

export const ZatcaGenerateSchema = z.object({
  invoiceId:   zId,
  invoiceType: z.enum(['STANDARD', 'SIMPLIFIED']).default('STANDARD'),
  simulate:    z.boolean().default(false),
});

// ── AP ────────────────────────────────────────────────────────────────────────

export const ApCaptureSchema = z.object({
  vendorId:    zId,
  invoiceRef:  z.string().min(1).max(100),
  amount:      zAmount,
  taxAmount:   z.number().finite().nonnegative().default(0),
  invoiceDate: zDate,
  dueDate:     zDate,
  currency:    zCurrency,
  lines:       z.array(z.object({
    accountId: zId,
    amount:    zAmount,
    notes:     zNotes,
  })).min(1).max(200),
});

export const ApMatchSchema = z.object({
  purchaseOrderId: zId.optional(),
  invoiceId:       zId,
  grn:             z.string().optional(),
  tolerancePct:    z.number().min(0).max(10).default(2),
});

// ── Finance ───────────────────────────────────────────────────────────────────

export const FxRevaluationSchema = z.object({
  runDate:     zDate,
  currencies:  z.array(zCurrency).min(1),
  accountIds:  z.array(zId).optional(), // if null → all FX accounts
  dryRun:      z.boolean().default(false),
  postEntries: z.boolean().default(true),
});

export const ConsolidationSchema = z.object({
  parentEntityId:   zId,
  childEntityIds:   z.array(zId).min(1),
  period:           zPeriod,
  eliminationRules: z.array(z.object({
    accountId: zId,
    amount:    zAmountAny,
    notes:     zNotes,
  })).optional(),
});

export const RevenueRecognitionSchema = z.object({
  contractId:   zId,
  recognizeDate: zDate,
  amount:       zAmount,
  method:       z.enum(['STRAIGHT_LINE', 'PERCENTAGE_COMPLETION', 'MILESTONE']),
  notes:        zNotes,
});

export const AllocationSchema = z.object({
  sourceAccountId: zId,
  period:          zPeriod,
  method:          z.enum(['FIXED', 'PERCENTAGE', 'HEADCOUNT', 'REVENUE']),
  targets:         z.array(z.object({
    costCenterId: zId,
    weight:       z.number().min(0).max(100),
  })).min(2).max(50),
  dryRun:          z.boolean().default(false),
});

// ── ECL (Expected Credit Losses) ─────────────────────────────────────────────

export const EclRunSchema = z.object({
  asOfDate:    zDate,
  methodology: z.enum(['IFRS9', 'SIMPLIFIED', 'GENERAL']).default('IFRS9'),
  portfolioId: zId.optional(),
  dryRun:      z.boolean().default(false),
  postEntries: z.boolean().default(true),
});

// ── Payment Runs ──────────────────────────────────────────────────────────────

export const PaymentRunProposeSchema = z.object({
  paymentDate:    zDate,
  vendorIds:      z.array(zId).optional(),
  maxAmount:      zAmount.optional(),
  currency:       zCurrency,
  bankAccountId:  zId,
  dueBefore:      zDate.optional(),
  method:         z.enum(['WIRE', 'SWIFT', 'SADAD', 'ACH', 'CHECK']).default('WIRE'),
});

// ── Multi-Book ────────────────────────────────────────────────────────────────

export const MultiBookAdjustmentSchema = z.object({
  bookId:        zId,
  entryDate:     zDate,
  description:   z.string().min(3).max(500),
  adjustmentType: z.enum(['GAAP_DIFF', 'FX_TRANSLATION', 'ELIMINATION', 'RECLASSIFICATION']),
  lines:         z.array(JournalLineSchema).min(2).max(100),
});
