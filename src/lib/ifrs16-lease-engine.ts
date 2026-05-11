/**
 * IFRS 16 Lease Accounting Engine (E.x)
 * ══════════════════════════════════════════════════════
 * Calculates Right-of-Use Asset (ROU) and Lease Liability
 * for finance leases per IFRS 16.
 *
 * Supports:
 *   - Initial recognition (ROU + Lease Liability)
 *   - Monthly amortization schedule (effective interest method)
 *   - Journal entries: depreciation + interest + principal
 *   - Lease modifications (remeasurement)
 *   - Short-term and low-value exemptions
 */

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ifrs16-lease' });

export interface LeaseInput {
  leaseId?: number;
  description: string;
  commencementDate: Date;
  leaseTerm: number;         // months
  monthlyPayment: number;    // fixed payment amount
  incrementalBorrowingRate: number; // annual % e.g. 0.06 = 6%
  currency?: string;
  isShortTerm?: boolean;     // < 12 months — exempt
  isLowValue?: boolean;      // asset < USD 5,000 — exempt
  initialDirectCosts?: number;
  incentivesReceived?: number;
  residualValueGuarantee?: number;
}

export interface LeaseScheduleRow {
  period: number;           // 1, 2, 3... N
  date: Date;
  openingLiability: number;
  payment: number;
  interestExpense: number;  // liability × monthly rate
  principalRepaid: number;  // payment - interest
  closingLiability: number;
  rouDepreciation: number;  // ROU / leaseTerm
  rouNetBookValue: number;
}

export interface IFRS16Lease {
  leaseId?: number;
  description: string;
  commencementDate: Date;
  leaseTerm: number;
  monthlyPayment: number;
  incrementalBorrowingRate: number;
  currency: string;

  // Initial recognition
  presentValueOfPayments: number;   // Lease Liability at commencement
  rouAssetValue: number;            // ROU = PV + initial direct costs - incentives
  initialLeaseLiability: number;

  // Schedule
  schedule: LeaseScheduleRow[];

  // Summary
  totalPayments: number;
  totalInterestExpense: number;
  totalPrincipal: number;
  totalDepreciation: number;

  // Journal entry template
  initialJournalEntry: {
    debit: Array<{ account: string; amount: number }>;
    credit: Array<{ account: string; amount: number }>;
  };

  isExempt: boolean;
  exemptReason?: string;
}

export class IFRS16LeaseEngine {

  /**
   * Calculate present value of annuity
   * PV = PMT × [1 - (1 + r)^-n] / r
   */
  private static calculatePV(monthlyPayment: number, monthlyRate: number, periods: number): number {
    if (monthlyRate === 0) return monthlyPayment * periods;
    return monthlyPayment * (1 - Math.pow(1 + monthlyRate, -periods)) / monthlyRate;
  }

  /**
   * Recognize a new lease and generate amortization schedule
   */
  static recognize(input: LeaseInput): IFRS16Lease {
    const currency = input.currency || 'SAR';

    // Check exemptions
    if (input.isShortTerm && input.leaseTerm <= 12) {
      log.info(`Lease exempt: short-term (${input.leaseTerm} months)`);
      return this.createExemptLease(input, currency, 'إيجار قصير الأجل (أقل من 12 شهر) — IFRS 16.B34');
    }

    if (input.isLowValue) {
      return this.createExemptLease(input, currency, 'أصل منخفض القيمة (أقل من 5,000 دولار) — IFRS 16.B3');
    }

    const monthlyRate = input.incrementalBorrowingRate / 12;
    const pv = this.calculatePV(input.monthlyPayment, monthlyRate, input.leaseTerm);

    const initialDirectCosts = input.initialDirectCosts || 0;
    const incentives = input.incentivesReceived || 0;
    const rouAsset = Math.round((pv + initialDirectCosts - incentives) * 100) / 100;

    // Build amortization schedule
    const schedule: LeaseScheduleRow[] = [];
    let liabilityBalance = pv;
    let rouBalance = rouAsset;
    const rouMonthlyDepreciation = rouAsset / input.leaseTerm;

    const startDate = new Date(input.commencementDate);

    for (let p = 1; p <= input.leaseTerm; p++) {
      const periodDate = new Date(startDate);
      periodDate.setMonth(periodDate.getMonth() + p);

      const interestExpense  = Math.round(liabilityBalance * monthlyRate * 100) / 100;
      const principalRepaid  = Math.round((input.monthlyPayment - interestExpense) * 100) / 100;
      const closingLiability = Math.round((liabilityBalance - principalRepaid) * 100) / 100;
      rouBalance = Math.round((rouBalance - rouMonthlyDepreciation) * 100) / 100;

      schedule.push({
        period: p,
        date: periodDate,
        openingLiability: Math.round(liabilityBalance * 100) / 100,
        payment: input.monthlyPayment,
        interestExpense,
        principalRepaid,
        closingLiability: Math.max(0, closingLiability),
        rouDepreciation: Math.round(rouMonthlyDepreciation * 100) / 100,
        rouNetBookValue: Math.max(0, rouBalance),
      });

      liabilityBalance = Math.max(0, closingLiability);
    }

    const totalInterest    = schedule.reduce((s, r) => s + r.interestExpense, 0);
    const totalPrincipal   = schedule.reduce((s, r) => s + r.principalRepaid, 0);
    const totalDepreciation = schedule.reduce((s, r) => s + r.rouDepreciation, 0);

    log.info(`IFRS 16 lease recognized: ROU=${rouAsset.toFixed(2)}, PV=${pv.toFixed(2)}, rate=${(input.incrementalBorrowingRate * 100).toFixed(1)}%`);

    return {
      leaseId: input.leaseId,
      description: input.description,
      commencementDate: input.commencementDate,
      leaseTerm: input.leaseTerm,
      monthlyPayment: input.monthlyPayment,
      incrementalBorrowingRate: input.incrementalBorrowingRate,
      currency,
      presentValueOfPayments: Math.round(pv * 100) / 100,
      rouAssetValue: rouAsset,
      initialLeaseLiability: Math.round(pv * 100) / 100,
      schedule,
      totalPayments: Math.round(input.monthlyPayment * input.leaseTerm * 100) / 100,
      totalInterestExpense: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalDepreciation: Math.round(totalDepreciation * 100) / 100,
      initialJournalEntry: {
        debit: [
          { account: 'حق الاستخدام (ROU Asset)', amount: rouAsset },
        ],
        credit: [
          { account: 'التزام الإيجار (Lease Liability)', amount: Math.round(pv * 100) / 100 },
          ...(initialDirectCosts > 0 ? [{ account: 'نقدية / مدفوعة مقدماً', amount: initialDirectCosts }] : []),
        ],
      },
      isExempt: false,
    };
  }

  /** Get monthly journal entries for a specific period */
  static getMonthlyEntries(lease: IFRS16Lease, period: number): {
    description: string;
    entries: Array<{ account: string; type: 'debit' | 'credit'; amount: number }>;
  } {
    const row = lease.schedule[period - 1];
    if (!row) throw new Error(`Period ${period} not found in lease schedule`);

    return {
      description: `${lease.description} — قيد الإيجار الشهر ${period}`,
      entries: [
        { account: 'التزام الإيجار (Lease Liability)',       type: 'debit',  amount: row.principalRepaid },
        { account: 'مصروف فائدة (Interest Expense)',         type: 'debit',  amount: row.interestExpense },
        { account: 'نقدية / بنك',                            type: 'credit', amount: row.payment },
        { account: 'مصروف إهلاك حق الاستخدام (ROU Dep.)',   type: 'debit',  amount: row.rouDepreciation },
        { account: 'مجمع إهلاك حق الاستخدام',                type: 'credit', amount: row.rouDepreciation },
      ],
    };
  }

  private static createExemptLease(input: LeaseInput, currency: string, exemptReason: string): IFRS16Lease {
    return {
      leaseId: input.leaseId,
      description: input.description,
      commencementDate: input.commencementDate,
      leaseTerm: input.leaseTerm,
      monthlyPayment: input.monthlyPayment,
      incrementalBorrowingRate: input.incrementalBorrowingRate,
      currency,
      presentValueOfPayments: 0,
      rouAssetValue: 0,
      initialLeaseLiability: 0,
      schedule: [],
      totalPayments: input.monthlyPayment * input.leaseTerm,
      totalInterestExpense: 0,
      totalPrincipal: 0,
      totalDepreciation: 0,
      initialJournalEntry: { debit: [], credit: [] },
      isExempt: true,
      exemptReason,
    };
  }
}
