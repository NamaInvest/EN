/**
 * Payroll Reconciliation Service
 * Match payroll records with bank payments and G/L entries
 */
import { PrismaClient } from '@prisma/client';

export interface ReconciliationRow {
  employeeId: number;
  employeeName: string;
  payrollNet: number;
  bankPayment: number | null;
  difference: number;
  status: 'MATCHED' | 'UNMATCHED' | 'OVER' | 'UNDER';
}

export class PayrollReconciliationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Reconcile payroll for a month vs bank statement
   */
  async reconcile(tenantId: string, year: number, month: number, bankPayments?: {
    employeeIban: string;
    amount: number;
  }[]): Promise<{
    period: string;
    rows: ReconciliationRow[];
    totalPayroll: number;
    totalPaid: number;
    totalDiscrepancy: number;
    status: 'CLEAN' | 'DISCREPANCIES';
  }> {
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const salaries = await this.prisma.salary.findMany({
      where: { tenantId, year, month, deletedAt: null },
      include: { employee: { select: { id: true, name: true, iban: true } } },
    });

    const bankMap = new Map<string, number>();
    if (bankPayments) {
      for (const p of bankPayments) {
        bankMap.set(p.employeeIban, p.amount);
      }
    }

    const rows: ReconciliationRow[] = salaries.map((s) => {
      const net = Number(s.netSalary ?? 0);
      const bankAmt = s.employee.iban ? (bankMap.get(s.employee.iban) ?? null) : null;
      const diff = bankAmt !== null ? net - bankAmt : 0;

      let status: ReconciliationRow['status'] = 'UNMATCHED';
      if (bankAmt !== null) {
        if (Math.abs(diff) < 1) status = 'MATCHED';
        else if (diff > 0) status = 'UNDER';
        else status = 'OVER';
      }

      return {
        employeeId: s.employee.id,
        employeeName: s.employee.name,
        payrollNet: net,
        bankPayment: bankAmt,
        difference: Math.round(diff * 100) / 100,
        status,
      };
    });

    const totalPayroll = rows.reduce((s, r) => s + r.payrollNet, 0);
    const totalPaid = rows.reduce((s, r) => s + (r.bankPayment ?? 0), 0);
    const totalDiscrepancy = rows.reduce((s, r) => s + Math.abs(r.difference), 0);

    return {
      period,
      rows,
      totalPayroll,
      totalPaid,
      totalDiscrepancy,
      status: rows.every((r) => r.status === 'MATCHED') ? 'CLEAN' : 'DISCREPANCIES',
    };
  }

  /**
   * Monthly payroll summary
   */
  async getMonthlySummary(tenantId: string, year: number, month: number): Promise<{
    totalBasic: number;
    totalAdditions: number;
    totalDeductions: number;
    totalGosi: number;
    totalLoans: number;
    totalNet: number;
    headcount: number;
  }> {
    const salaries = await this.prisma.salary.findMany({
      where: { tenantId, year, month, deletedAt: null },
    });

    return {
      totalBasic: salaries.reduce((s, r) => s + Number(r.basicSalary ?? 0), 0),
      totalAdditions: salaries.reduce((s, r) => s + Number(r.additions ?? 0), 0),
      totalDeductions: salaries.reduce((s, r) => s + Number(r.deductions ?? 0), 0),
      totalGosi: salaries.reduce((s, r) => s + Number(r.gosiDeduction ?? 0), 0),
      totalLoans: salaries.reduce((s, r) => s + Number(r.loanDeduction ?? 0), 0),
      totalNet: salaries.reduce((s, r) => s + Number(r.netSalary ?? 0), 0),
      headcount: salaries.length,
    };
  }
}
