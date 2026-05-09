/**
 * Salary Advances Service
 * Short-term advances (different from loans)
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class AdvancesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Issue a salary advance (stored as EmployeeLoan with 1 month payback)
   */
  async issueAdvance(tenantId: string, data: {
    employeeId: number;
    amount: number;
    reason: string;
    recoverMonth: number;
    recoverYear: number;
  }): Promise<number> {
    // Validate: advance ≤ 50% of monthly salary
    const emp = await this.prisma.employee.findFirstOrThrow({
      where: { id: data.employeeId, tenantId },
      select: { salary: true, name: true },
    });
    const maxAdvance = Number(emp.salary) * 0.5;
    if (data.amount > maxAdvance) {
      throw new Error(`Advance (${data.amount}) exceeds 50% of monthly salary (${maxAdvance})`);
    }

    // Store as a 1-month loan
    const loan = await this.prisma.employeeLoan.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        amount: new Decimal(data.amount),
        monthlyDeduction: new Decimal(data.amount), // recover in 1 month
        remainingAmount: new Decimal(data.amount),
        reason: `ADVANCE: ${data.reason}`,
        startDate: new Date(),
        status: 'active',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE',
        tableName: 'salary_advances',
        recordId: String(loan.id),
        details: JSON.stringify({
          employeeId: data.employeeId,
          employeeName: emp.name,
          amount: data.amount,
          recoverMonth: data.recoverMonth,
          recoverYear: data.recoverYear,
          reason: data.reason,
        }),
      },
    });

    return loan.id;
  }

  /**
   * List pending advances for a period
   */
  async getPendingAdvances(tenantId: string): Promise<{
    loanId: number;
    employeeId: number;
    employeeName: string;
    amount: number;
    reason: string | null;
    startDate: Date;
  }[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: {
        tenantId,
        status: 'active',
        reason: { startsWith: 'ADVANCE:' },
      },
      include: { employee: { select: { id: true, name: true } } },
    });

    return loans.map((l) => ({
      loanId: l.id,
      employeeId: l.employee.id,
      employeeName: l.employee.name,
      amount: Number(l.amount),
      reason: l.reason,
      startDate: l.startDate,
    }));
  }

  /**
   * Advances summary for a month
   */
  async getMonthSummary(tenantId: string, year: number, month: number): Promise<{
    totalAdvances: number;
    count: number;
  }> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const advances = await this.prisma.employeeLoan.findMany({
      where: {
        tenantId,
        reason: { startsWith: 'ADVANCE:' },
        startDate: { gte: start, lte: end },
      },
      select: { amount: true },
    });

    return {
      totalAdvances: advances.reduce((s, a) => s + Number(a.amount), 0),
      count: advances.length,
    };
  }
}
