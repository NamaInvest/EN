/**
 * EOS Engine (End of Service / مكافأة نهاية الخدمة)
 * ══════════════════════════════════════════════════════
 * Saudi Labour Law Article 84 calculation
 *
 * Rules:
 *   < 2 years:     No entitlement (unless terminated by employer)
 *   2-5 years:     1/3 of monthly salary × years
 *   5-10 years:    2/3 of monthly salary × years
 *   > 10 years:    Full monthly salary × years
 *
 * Resignation deductions:
 *   < 2 years:  0%
 *   2-5 years:  1/3
 *   5-10 years: 2/3
 *   > 10 years: 100%
 *
 * Dismissal (Article 80): Full entitlement regardless of years
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'eos-engine' });

export type TerminationReason =
  | 'RESIGNATION'        // استقالة
  | 'EMPLOYER_DISMISSAL' // فصل من قبل صاحب العمل
  | 'MUTUAL_AGREEMENT'   // اتفاق مشترك
  | 'CONTRACT_EXPIRY'    // انتهاء عقد
  | 'DEATH'              // وفاة
  | 'DISABILITY';        // عجز

export interface EOSInput {
  employeeId: number;
  terminationDate: Date;
  terminationReason: TerminationReason;
  basicSalary?: number;         // override from DB
  housingAllowance?: number;    // housing included in calculation base per MOHRSD
  includeHousing?: boolean;     // some companies include housing (optional)
}

export interface EOSCalculation {
  employeeId: number;
  employeeName: string;
  joinDate: Date;
  terminationDate: Date;
  terminationReason: TerminationReason;
  yearsOfService: number;
  monthsOfService: number;
  basicSalary: number;
  housingAllowance: number;
  calculationBase: number;   // salary used in calculation
  grossEntitlement: number;  // before deductions
  deductionRate: number;     // 0, 1/3, 2/3, or 1
  deductionAmount: number;
  netEOSAmount: number;
  breakdown: Array<{
    period: string;
    years: number;
    rate: number;
    amount: number;
  }>;
  notes: string[];
  journalEntry: {
    debit:  Array<{ account: string; amount: number }>;
    credit: Array<{ account: string; amount: number }>;
  };
}

export class EOSEngine {

  static async calculate(input: EOSInput): Promise<EOSCalculation> {
    // Load employee
    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: {
        id: true, name: true, startDate: true,
        salary: true, housingAllowance: true,
        transportAllowance: true,
      },
    });

    if (!employee) throw new Error(`موظف رقم ${input.employeeId} غير موجود`);
    if (!employee.startDate) throw new Error('تاريخ المباشرة غير مسجل');

    const joinDate         = new Date(employee.startDate as string);
    const terminationDate  = new Date(input.terminationDate);

    // Total service duration
    const totalMs    = terminationDate.getTime() - joinDate.getTime();
    const totalDays  = totalMs / (1000 * 60 * 60 * 24);
    const totalYears = totalDays / 365.25;
    const totalMonths = totalYears * 12;

    const basicSalary      = input.basicSalary      ?? Number(employee.salary            || 0);
    const housingAllowance = input.housingAllowance ?? Number(employee.housingAllowance  || 0);

    // Calculation base (some companies include housing per internal policy)
    const calcBase = input.includeHousing
      ? basicSalary + housingAllowance
      : basicSalary;

    const notes: string[] = [];
    const breakdown: EOSCalculation['breakdown'] = [];

    // ── Calculate gross entitlement (layered) ──────────────────────────
    let grossEntitlement = 0;

    if (totalYears < 2) {
      notes.push('مدة الخدمة أقل من سنتين');
      if (input.terminationReason === 'EMPLOYER_DISMISSAL' || input.terminationReason === 'DEATH' || input.terminationReason === 'DISABILITY') {
        // Still entitled to prorated amount
        const amount = (calcBase / 12) * totalMonths * (1 / 3);
        grossEntitlement = amount;
        breakdown.push({ period: `أقل من سنتين (${totalYears.toFixed(2)} سنة)`, years: totalYears, rate: 1 / 3, amount });
        notes.push('تم احتساب الاستحقاق بسبب الفصل أو وفاة/عجز');
      }
    } else {
      // Tier 1: First 5 years → 1/3 salary/year
      const tier1Years = Math.min(totalYears, 5);
      if (tier1Years > 0) {
        const amount = calcBase * tier1Years * (1 / 3);
        grossEntitlement += amount;
        breakdown.push({ period: 'السنوات 1-5', years: tier1Years, rate: 1 / 3, amount });
      }

      // Tier 2: Years 5-10 → 2/3 salary/year
      const tier2Years = Math.min(Math.max(totalYears - 5, 0), 5);
      if (tier2Years > 0) {
        const amount = calcBase * tier2Years * (2 / 3);
        grossEntitlement += amount;
        breakdown.push({ period: 'السنوات 6-10', years: tier2Years, rate: 2 / 3, amount });
      }

      // Tier 3: Beyond 10 years → full salary/year
      const tier3Years = Math.max(totalYears - 10, 0);
      if (tier3Years > 0) {
        const amount = calcBase * tier3Years * 1;
        grossEntitlement += amount;
        breakdown.push({ period: 'ما بعد 10 سنوات', years: tier3Years, rate: 1, amount });
      }
    }

    // ── Deduction for resignation ──────────────────────────────────────
    let deductionRate = 0;
    if (input.terminationReason === 'RESIGNATION') {
      if (totalYears < 2)       deductionRate = 1.0;   // No entitlement
      else if (totalYears < 5)  deductionRate = 2 / 3; // Loses 2/3
      else if (totalYears < 10) deductionRate = 1 / 3; // Loses 1/3
      else                      deductionRate = 0;      // Full entitlement
      if (deductionRate > 0) notes.push(`خصم الاستقالة: ${Math.round(deductionRate * 100)}%`);
    }

    const deductionAmount = grossEntitlement * deductionRate;
    const netEOS          = Math.max(0, grossEntitlement - deductionAmount);

    log.info(`EOS: ${employee.name}, ${totalYears.toFixed(2)}yr, ${input.terminationReason}, net=${netEOS.toFixed(2)}`);

    return {
      employeeId:        input.employeeId,
      employeeName:      employee.name,
      joinDate,
      terminationDate,
      terminationReason: input.terminationReason,
      yearsOfService:    Math.round(totalYears * 100) / 100,
      monthsOfService:   Math.round(totalMonths * 10) / 10,
      basicSalary:       Math.round(basicSalary   * 100) / 100,
      housingAllowance:  Math.round(housingAllowance * 100) / 100,
      calculationBase:   Math.round(calcBase * 100) / 100,
      grossEntitlement:  Math.round(grossEntitlement * 100) / 100,
      deductionRate,
      deductionAmount:   Math.round(deductionAmount * 100) / 100,
      netEOSAmount:      Math.round(netEOS * 100) / 100,
      breakdown,
      notes,
      journalEntry: {
        debit:  [{ account: 'مكافأة نهاية الخدمة (مصروف)', amount: Math.round(netEOS * 100) / 100 }],
        credit: [{ account: 'مستحقات مكافأة نهاية الخدمة (التزام)', amount: Math.round(netEOS * 100) / 100 }],
      },
    };
  }

  /** Batch: Calculate EOS liability for all active employees (actuarial estimate) */
  static async calculateProvision(): Promise<{
    totalEmployees: number;
    totalProvision: number;
    byDepartment: Record<string, number>;
    details: Array<{ employeeId: number; name: string; years: number; provision: number }>;
  }> {
    const employees = await prisma.employee.findMany({
      where: { active: true, deletedAt: null },
      select: {
        id: true, name: true, startDate: true,
        salary: true, department: true,
      },
      take: 500,
    }).catch(() => [] as any[]);

    const now = new Date();
    let totalProvision = 0;
    const byDept: Record<string, number> = {};
    const details: Array<{ employeeId: number; name: string; years: number; provision: number }> = [];

    for (const emp of employees as any[]) {
      if (!emp.startDate) continue;
      const yrs = (now.getTime() - new Date(emp.startDate as string).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const basic = Number(emp.salary || 0);
      if (basic <= 0) continue;

      // Simple provision: avg of tiers
      let provision = 0;
      if (yrs >= 2) provision = basic * Math.min(yrs, 5) * (1 / 3);
      if (yrs > 5)  provision += basic * Math.min(yrs - 5, 5) * (2 / 3);
      if (yrs > 10) provision += basic * (yrs - 10) * 1;

      totalProvision += provision;
      const deptKey = String(emp.departmentId || 'unknown');
      byDept[deptKey] = (byDept[deptKey] || 0) + provision;
      details.push({ employeeId: emp.id, name: emp.name, years: Math.round(yrs * 100) / 100, provision: Math.round(provision * 100) / 100 });
    }

    return {
      totalEmployees: employees.length,
      totalProvision: Math.round(totalProvision * 100) / 100,
      byDepartment: byDept,
      details: details.sort((a, b) => b.provision - a.provision),
    };
  }
}
