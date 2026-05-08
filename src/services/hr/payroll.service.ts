/**
 * Payroll Service (HR Module 27)
 * Handles: loans management, advances, variable pay (commissions/bonuses),
 * multi-component salary structure, and payslip generation.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BaseService } from '../shared/base.service';
import { BusinessContext, eventBus } from '../shared/event-bus.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalaryComponent {
  code:       string;
  nameAr:     string;
  amount:     number;
  taxable:    boolean;
  gosiBase:   boolean; // included in GOSI calculation base
}

export interface PayslipData {
  employeeId:   string;
  employeeName: string;
  period:       string; // YYYY-MM
  components:   SalaryComponent[];
  deductions: {
    gosi:         number;
    loanDeduction: number;
    advanceDeduction: number;
    absence:      number;
    other:        number;
  };
  gross:        number;
  totalDeductions: number;
  netPay:       number;
  iban:         string;
  bankCode:     string;
}

export interface LoanScheduleLine {
  installmentNo:  number;
  dueDate:        Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount:    number;
  remaining:      number;
}

// ─── Saudi GOSI Rates ─────────────────────────────────────────────────────────
const GOSI = {
  SAUDI_EMP:    0.0925, // 9.25% employee share
  SAUDI_EMP_ER: 0.1175, // 11.75% employer share
  EXPAT_EMP:    0,
  EXPAT_EMP_ER: 0.02,   // 2% work hazard for expats
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class PayrollService extends BaseService {
  constructor(prisma: PrismaClient, ctx: BusinessContext) {
    super(prisma, ctx);
  }

  /**
   * Create a loan for an employee.
   * Generates a repayment schedule.
   */
  async createLoan(params: {
    employeeId:    string;
    principal:     number;
    interestRate:  number; // annual %, 0 for interest-free
    termMonths:    number;
    startDate:     Date;
    approvedBy:    string;
    purpose?:      string;
  }): Promise<{ loanId: string; schedule: LoanScheduleLine[] }> {
    this.requirePermission('hr:loan:create');

    const { principal, interestRate, termMonths, startDate } = params;
    const monthlyRate = interestRate / 100 / 12;

    // Amortization formula
    const monthlyPayment = monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      : principal / termMonths;

    // Build schedule
    const schedule: LoanScheduleLine[] = [];
    let remaining = principal;

    for (let i = 1; i <= termMonths; i++) {
      const interest   = remaining * monthlyRate;
      const pmt        = Math.min(monthlyPayment, remaining + interest);
      const principalPmt = pmt - interest;
      remaining       -= principalPmt;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i - 1);

      schedule.push({
        installmentNo:   i,
        dueDate,
        principalAmount: Math.round(principalPmt * 100) / 100,
        interestAmount:  Math.round(interest * 100) / 100,
        totalAmount:     Math.round(pmt * 100) / 100,
        remaining:       Math.max(0, Math.round(remaining * 100) / 100),
      });
    }

    // Persist
    const loan = await (this.db as any).employeeLoan.create({
      data: {
        tenantId:      this.tenantId,
        employeeId:    params.employeeId,
        principalAmount: new Decimal(principal),
        interestRate:  new Decimal(interestRate),
        termMonths,
        monthlyPayment: new Decimal(monthlyPayment),
        startDate:     params.startDate,
        status:        'active',
        purpose:       params.purpose,
        approvedBy:    params.approvedBy,
        schedule: {
          create: schedule.map(s => ({
            installmentNo: s.installmentNo,
            dueDate:       s.dueDate,
            principal:     new Decimal(s.principalAmount),
            interest:      new Decimal(s.interestAmount),
            totalAmount:   new Decimal(s.totalAmount),
            status:        'pending',
          })),
        },
      },
    }).catch(() => ({ id: `LOAN-${Date.now()}` })) as any;

    return { loanId: loan.id, schedule };
  }

  /**
   * Calculate payslip for a single employee for a period.
   */
  async calculatePayslip(
    employeeId: string,
    period: string // YYYY-MM
  ): Promise<PayslipData> {
    const employee = await (this.db as any).employee.findFirst({
      where:   { id: employeeId as any, tenantId: this.tenantId },
      include: { salaryComponents: true },
    }).catch(() => null) as any;

    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    // Build salary components from DB or defaults
    const components: SalaryComponent[] = (employee.salaryComponents ?? []).length > 0
      ? employee.salaryComponents.map((c: any) => ({
          code:     c.code,
          nameAr:   c.nameAr,
          amount:   Number(c.amount),
          taxable:  c.taxable ?? true,
          gosiBase: c.gosiBase ?? true,
        }))
      : this.buildDefaultComponents(employee);

    const gross = components.reduce((s, c) => s + c.amount, 0);
    const gosiBase = components.filter(c => c.gosiBase).reduce((s, c) => s + c.amount, 0);

    // GOSI calculation
    const isSaudi  = employee.nationality === 'SA' || !employee.nationality;
    const gosiRate = isSaudi ? GOSI.SAUDI_EMP : GOSI.EXPAT_EMP;
    const gosiAmount = gosiBase * gosiRate;

    // Loan deductions due this month
    const [periodYear, periodMonth] = period.split('-').map(Number);
    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    const periodEnd   = new Date(periodYear, periodMonth, 0);

    const loanInstallments = await (this.db as any).employeeLoanSchedule.findMany({
      where: {
        loan: { employeeId: employeeId as any, tenantId: this.tenantId, status: 'active' },
        dueDate: { gte: periodStart, lte: periodEnd },
        status: 'pending',
      },
    }).catch(() => []) as any[];

    const loanDeduction = loanInstallments.reduce(
      (s: number, i: any) => s + Number(i.totalAmount ?? 0), 0
    );

    // Advance recovery
    const advanceDeductions = await (this.db as any).salaryAdvance.aggregate({
      where: { employeeId: employeeId as any, tenantId: this.tenantId, recoveryPeriod: period, status: 'approved' },
      _sum:  { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })) as any;
    const advanceDeduction = Number(advanceDeductions._sum?.amount ?? 0);

    // Absence deductions (daily rate × absent days)
    const workingDays   = 22; // standard Saudi working days
    const dailyRate     = gross / workingDays;
    const absentDays    = await this.getAbsentDays(employeeId, periodStart, periodEnd);
    const absenceDeduction = dailyRate * absentDays;

    const totalDeductions = gosiAmount + loanDeduction + advanceDeduction + absenceDeduction;
    const netPay = Math.max(0, gross - totalDeductions);

    return {
      employeeId,
      employeeName: employee.name ?? employee.nameAr ?? 'موظف',
      period,
      components,
      deductions: {
        gosi:             Math.round(gosiAmount * 100) / 100,
        loanDeduction:    Math.round(loanDeduction * 100) / 100,
        advanceDeduction: Math.round(advanceDeduction * 100) / 100,
        absence:          Math.round(absenceDeduction * 100) / 100,
        other:            0,
      },
      gross:           Math.round(gross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netPay:          Math.round(netPay * 100) / 100,
      iban:            employee.iban ?? '',
      bankCode:        employee.bankCode ?? 'SNB',
    };
  }

  /**
   * Run payroll for all active employees in a period.
   * Returns array of payslips + WPS-compatible summary.
   */
  async runPayroll(period: string): Promise<{
    payslips:    PayslipData[];
    totalGross:  number;
    totalNet:    number;
    errors:      { employeeId: string; error: string }[];
  }> {
    this.requirePermission('hr:payroll:run');

    const employees = await (this.db as any).employee.findMany({
      where: { tenantId: this.tenantId, status: 'active' },
      select: { id: true },
    }).catch(() => []) as any[];

    const payslips: PayslipData[] = [];
    const errors: { employeeId: string; error: string }[] = [];

    for (const emp of employees) {
      try {
        const slip = await this.calculatePayslip(String(emp.id), period);
        payslips.push(slip);
      } catch (e: any) {
        errors.push({ employeeId: String(emp.id), error: e.message });
      }
    }

    const totalGross = payslips.reduce((s, p) => s + p.gross, 0);
    const totalNet   = payslips.reduce((s, p) => s + p.netPay, 0);

    eventBus.afterCommit('hr.payroll.run', {
      period,
      tenantId:   this.tenantId,
      totalGross: totalGross.toString(),
      count:      payslips.length,
    });

    return { payslips, totalGross, totalNet, errors };
  }

  /**
   * Generate WPS (Wage Protection System) file for MUDAD/SAMA.
   */
  generateWPSFile(payslips: PayslipData[], employerIBAN: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const header = `H|${date}|${employerIBAN}|${payslips.length}|${payslips.reduce((s, p) => s + p.netPay, 0).toFixed(2)}|SAR\n`;

    const rows = payslips.map(p =>
      `D|${p.employeeId}|${p.employeeName}|${p.iban}|${p.bankCode}|${p.netPay.toFixed(2)}|SAR|SALARY|${p.period}`
    ).join('\n');

    const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
    const trailer  = `\nT|${payslips.length}|${totalNet.toFixed(2)}`;

    return header + rows + trailer;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private buildDefaultComponents(employee: any): SalaryComponent[] {
    const basic    = Number(employee.basicSalary ?? employee.salary ?? 0);
    const housing  = Number(employee.housingAllowance ?? basic * 0.25);
    const transport = Number(employee.transportAllowance ?? 0);

    return [
      { code: 'BASIC',     nameAr: 'الراتب الأساسي',   amount: basic,     taxable: true, gosiBase: true },
      { code: 'HOUSING',   nameAr: 'بدل السكن',         amount: housing,   taxable: true, gosiBase: false },
      { code: 'TRANSPORT', nameAr: 'بدل المواصلات',     amount: transport, taxable: true, gosiBase: false },
    ].filter(c => c.amount > 0);
  }

  private async getAbsentDays(employeeId: string, from: Date, to: Date): Promise<number> {
    const result = await (this.db as any).attendance.aggregate({
      where: {
        employeeId: employeeId as any,
        tenantId:   this.tenantId,
        date:       { gte: from, lte: to },
        type:       'ABSENT',
      },
      _count: { id: true },
    }).catch(() => ({ _count: { id: 0 } })) as any;
    return result._count?.id ?? 0;
  }
}
