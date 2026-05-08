/**
 * HR & Payroll Service Layer
 * ──────────────────────────────────────────────────────────
 * Saudi labor law compliant salary calculation
 * GOSI: 9.75% employee + 11.75% employer (capped at 45k)
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry, ACCOUNTS } from '@/lib/auto-journal';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { AppError } from '@/lib/api-handler';

const log = logger.child({ route: 'HRService' });

const GOSI_EMPLOYEE_RATE = 0.0975;
const GOSI_EMPLOYER_RATE = 0.1175;
const GOSI_SALARY_CAP = 45000;

interface SalaryInput {
  employeeId: number;
  month: number;
  year: number;
  basicSalary: number;
  additions?: number;
  deductions?: number;
  notes?: string;
  userId?: number;
}

export class HRService {
  private prisma: PrismaClient;

  constructor(req?: Request) {
    this.prisma = getPrisma(req) as any;
  }

  // ── Salary Calculation ──
  calculatePayslip(basicSalary: number, additions = 0, deductions = 0) {
    const basic = Number(basicSalary) || 0;
    const gosiBase = Math.min(basic, GOSI_SALARY_CAP);
    const gosiEmployee = Math.round(gosiBase * GOSI_EMPLOYEE_RATE * 100) / 100;
    const gosiEmployer = Math.round(gosiBase * GOSI_EMPLOYER_RATE * 100) / 100;
    const grossSalary = basic + Number(additions);
    const netSalary = grossSalary - gosiEmployee - Number(deductions);

    return { basic, grossSalary, gosiEmployee, gosiEmployer, netSalary };
  }

  // ── Create Salary Record ──
  async createSalary(input: SalaryInput) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { id: true, name: true, salary: true },
    });
    if (!employee) throw new AppError('الموظف غير موجود', 404);

    const existing = await this.prisma.salary.findFirst({
      where: { employeeId: input.employeeId, month: input.month, year: input.year },
    });
    if (existing) throw new AppError(`راتب شهر ${input.month}/${input.year} موجود مسبقاً`, 409);

    const calc = this.calculatePayslip(input.basicSalary, input.additions, input.deductions);

    const salary = await this.prisma.salary.create({
      data: {
        employeeId: input.employeeId,
        month: input.month,
        year: input.year,
        basicSalary: calc.basic,
        additions: Number(input.additions) || 0,
        deductions: Number(input.deductions) || 0,
        gosiDeduction: calc.gosiEmployee,
        netSalary: calc.netSalary,
        notes: input.notes,
      },
    });

    // Auto-journal
    try {
      await createJournalEntry({
        description: `راتب ${employee.name} — ${input.month}/${input.year}`,
        reference: `SAL-${salary.id}`,
        lines: [
          { accountCode: ACCOUNTS.SALARIES || '5100', debit: calc.grossSalary, credit: 0 },
          { accountCode: ACCOUNTS.CASH || '1100', debit: 0, credit: calc.netSalary },
          { accountCode: ACCOUNTS.PAYABLES || '2100', debit: 0, credit: calc.gosiEmployee + calc.gosiEmployer },
        ],
        userId: input.userId,
        status: 'posted',
      });
    } catch (e: any) {
      log.warn(`Auto-journal failed for SAL-${salary.id}: ${e.message}`);
    }

    log.info(`Salary created: ${salary.id}`, { employeeId: input.employeeId, net: calc.netSalary });
    return { salary, calculation: calc };
  }

  // ── End of Service Benefits (مكافأة نهاية الخدمة) ──
  calculateEndOfService(basicSalary: number, yearsOfService: number, type: 'resignation' | 'termination' | 'retirement') {
    const dailyRate = basicSalary / 30;
    let benefit = 0;

    if (type === 'termination' || type === 'retirement') {
      benefit = yearsOfService <= 5
        ? (dailyRate * 15) * yearsOfService
        : (dailyRate * 15) * 5 + (dailyRate * 30) * (yearsOfService - 5);
    } else {
      if (yearsOfService < 2) benefit = 0;
      else if (yearsOfService <= 5) benefit = ((dailyRate * 15) * yearsOfService) / 3;
      else if (yearsOfService <= 10) benefit = ((dailyRate * 15) * 5 + (dailyRate * 30) * (yearsOfService - 5)) * 2 / 3;
      else benefit = (dailyRate * 15) * 5 + (dailyRate * 30) * (yearsOfService - 5);
    }
    return Math.round(benefit * 100) / 100;
  }

  // ── Employee Stats ──
  async getEmployeeStats() {
    return cache.getOrSet('hr:employee_stats', 120, async () => {
      const [total, active] = await Promise.all([
        this.prisma.employee.count(),
        this.prisma.employee.count({ where: { active: true } }),
      ]);
      return { total, active, inactive: total - active };
    });
  }

  // ── Payroll Summary ──
  async getPayrollSummary(month: number, year: number) {
    const salaries = await this.prisma.salary.findMany({
      where: { month, year },
      include: { employee: { select: { name: true, department: true } } },
    });

    const totalGross = salaries.reduce((s, r) => s + Number(r.basicSalary || 0) + Number(r.additions || 0), 0);
    const totalDeductions = salaries.reduce((s, r) => s + Number(r.deductions || 0), 0);
    const totalNet = salaries.reduce((s, r) => s + Number(r.netSalary || 0), 0);
    const totalGosi = salaries.reduce((s, r) => s + Number(r.gosiDeduction || 0), 0);

    return { month, year, employeeCount: salaries.length, totalGross, totalDeductions, totalNet, totalGosi, salaries };
  }
}
