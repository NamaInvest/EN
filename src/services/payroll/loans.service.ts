/**
 * Employee Loans Service
 * Manages salary loans and monthly deductions
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class LoansService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Issue a new loan to an employee
   */
  async issueLoan(tenantId: string, data: {
    employeeId: number;
    amount: number;
    monthlyDeduction: number;
    reason?: string;
    startDate: Date;
  }): Promise<number> {
    const loan = await this.prisma.employeeLoan.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        amount: new Decimal(data.amount),
        monthlyDeduction: new Decimal(data.monthlyDeduction),
        remainingAmount: new Decimal(data.amount),
        reason: data.reason,
        startDate: data.startDate,
        status: 'active',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE',
        tableName: 'employee_loans',
        recordId: String(loan.id),
        details: JSON.stringify({ ...data, issuedAt: new Date() }),
      },
    });

    return loan.id;
  }

  /**
   * Process monthly deduction (called during payroll run)
   */
  async processMonthlyDeductions(tenantId: string, year: number, month: number): Promise<{
    processed: number;
    totalDeducted: number;
  }> {
    const activeLoans = await this.prisma.employeeLoan.findMany({
      where: { tenantId, status: 'active' },
    });

    let totalDeducted = 0;

    for (const loan of activeLoans) {
      const deduction = Math.min(Number(loan.monthlyDeduction), Number(loan.remainingAmount));
      const newRemaining = Number(loan.remainingAmount) - deduction;

      await this.prisma.employeeLoan.update({
        where: { id: loan.id },
        data: {
          remainingAmount: new Decimal(Math.max(0, newRemaining)),
          status: newRemaining <= 0 ? 'paid' : 'active',
        },
      });

      // Update salary record
      const salary = await this.prisma.salary.findFirst({
        where: { tenantId, employeeId: loan.employeeId, year, month },
      });

      if (salary) {
        await this.prisma.salary.update({
          where: { id: salary.id },
          data: {
            loanDeduction: { increment: new Decimal(deduction) },
            netSalary: { decrement: new Decimal(deduction) },
          },
        });
      }

      totalDeducted += deduction;
    }

    return { processed: activeLoans.length, totalDeducted };
  }

  /**
   * Get active loans for an employee
   */
  async getEmployeeLoans(tenantId: string, employeeId: number): Promise<{
    id: number;
    amount: number;
    monthlyDeduction: number;
    remainingAmount: number;
    startDate: Date;
    status: string;
    estimatedPayoffMonths: number;
  }[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: { tenantId, employeeId, status: { not: 'paid' } },
      orderBy: { startDate: 'desc' },
    });

    return loans.map((l) => ({
      id: l.id,
      amount: Number(l.amount),
      monthlyDeduction: Number(l.monthlyDeduction),
      remainingAmount: Number(l.remainingAmount),
      startDate: l.startDate,
      status: l.status,
      estimatedPayoffMonths: Number(l.monthlyDeduction) > 0
        ? Math.ceil(Number(l.remainingAmount) / Number(l.monthlyDeduction))
        : 0,
    }));
  }
}
