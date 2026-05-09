/**
 * Variable Pay Service
 * Bonuses, commissions, overtime, and incentives
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type VariablePayType = 'BONUS' | 'COMMISSION' | 'OVERTIME' | 'INCENTIVE' | 'DEDUCTION' | 'PENALTY';

export interface VariablePayEntry {
  employeeId: number;
  type: VariablePayType;
  amount: number;
  reason: string;
  period: string; // YYYY-MM
}

export interface VariablePayResult {
  employeeId: number;
  employeeName: string;
  additions: number;
  deductions: number;
  net: number;
}

export class VariablePayService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Apply variable pay entries for a period (stored as Salary adjustments)
   */
  async applyVariablePay(tenantId: string, entries: VariablePayEntry[]): Promise<VariablePayResult[]> {
    const grouped = new Map<number, { additions: number; deductions: number }>();

    for (const e of entries) {
      const existing = grouped.get(e.employeeId) ?? { additions: 0, deductions: 0 };
      if (['BONUS', 'COMMISSION', 'OVERTIME', 'INCENTIVE'].includes(e.type)) {
        existing.additions += e.amount;
      } else {
        existing.deductions += e.amount;
      }
      grouped.set(e.employeeId, existing);

      // Log to AuditLog
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: 'CREATE',
          tableName: 'variable_pay',
          details: JSON.stringify({ ...e, appliedAt: new Date() }),
        },
      });
    }

    const results: VariablePayResult[] = [];
    for (const [employeeId, amounts] of grouped) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
        select: { name: true },
      });

      // Update the corresponding Salary record
      const [year, monthStr] = (entries.find((e) => e.employeeId === employeeId)?.period ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`).split('-');
      const month = parseInt(monthStr);

      const salary = await this.prisma.salary.findFirst({
        where: { tenantId, employeeId, year: parseInt(year), month },
      });

      if (salary) {
        await this.prisma.salary.update({
          where: { id: salary.id },
          data: {
            additions: { increment: new Decimal(amounts.additions) },
            deductions: { increment: new Decimal(amounts.deductions) },
            netSalary: { increment: new Decimal(amounts.additions - amounts.deductions) },
          },
        });
      }

      results.push({
        employeeId,
        employeeName: emp?.name ?? 'Unknown',
        additions: amounts.additions,
        deductions: amounts.deductions,
        net: amounts.additions - amounts.deductions,
      });
    }

    return results;
  }

  /**
   * Calculate overtime pay (Saudi Labor Law: 1.5x for overtime)
   */
  calculateOvertimePay(basicSalary: number, overtimeHours: number): number {
    const hourlyRate = basicSalary / 30 / 8; // 30 days, 8 hours/day
    return overtimeHours * hourlyRate * 1.5;
  }

  /**
   * Calculate annual performance bonus
   */
  async calculatePerformanceBonus(tenantId: string, year: number, bonusMultiplier: number = 1): Promise<{
    employeeId: number;
    name: string;
    annualSalary: number;
    bonus: number;
  }[]> {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, active: true, deletedAt: null },
      select: { id: true, name: true, salary: true },
    });

    return employees.map((e) => {
      const annualSalary = Number(e.salary ?? 0) * 12;
      const bonus = annualSalary * (bonusMultiplier / 12); // 1 month = 8.33%
      return { employeeId: e.id, name: e.name, annualSalary, bonus: Math.round(bonus * 100) / 100 };
    });
  }
}
