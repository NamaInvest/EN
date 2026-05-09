/**
 * Salary Structure Service
 * Decompose employee salary into components using actual Salary + Employee schema
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface SalaryComponents {
  employeeId: number;
  employeeName: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  grossSalary: number;
  gosiBase: number;
}

export interface PayslipData {
  period: string;
  employee: SalaryComponents;
  additions: number;
  deductions: number;
  gosiDeduction: number;
  loanDeduction: number;
  netSalary: number;
  paidDate: Date;
}

export class SalaryStructureService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get salary components for an employee
   */
  async getComponents(tenantId: string, employeeId: number): Promise<SalaryComponents> {
    const emp = await this.prisma.employee.findFirstOrThrow({
      where: { id: employeeId, tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        salary: true,
        housingAllowance: true,
        transportAllowance: true,
        otherAllowance: true,
      },
    });

    const basic = Number(emp.salary ?? 0);
    const housing = Number(emp.housingAllowance ?? 0);
    const transport = Number(emp.transportAllowance ?? 0);
    const other = Number(emp.otherAllowance ?? 0);
    const gross = basic + housing + transport + other;

    // GOSI base = basic + housing (Saudi regulation)
    const gosiBase = Math.min(basic + housing, 45000);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      otherAllowance: other,
      grossSalary: gross,
      gosiBase,
    };
  }

  /**
   * Generate payslip for a specific month
   */
  async getPayslip(tenantId: string, employeeId: number, year: number, month: number): Promise<PayslipData | null> {
    const salary = await this.prisma.salary.findFirst({
      where: { tenantId, employeeId, year, month, deletedAt: null },
      include: { employee: { select: { name: true, salary: true, housingAllowance: true, transportAllowance: true, otherAllowance: true } } },
    });

    if (!salary) return null;

    const components = await this.getComponents(tenantId, employeeId);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      employee: components,
      additions: Number(salary.additions ?? 0),
      deductions: Number(salary.deductions ?? 0),
      gosiDeduction: Number(salary.gosiDeduction ?? 0),
      loanDeduction: Number(salary.loanDeduction ?? 0),
      netSalary: Number(salary.netSalary ?? 0),
      paidDate: salary.paidDate,
    };
  }

  /**
   * Bulk payroll calculation for a month
   */
  async calculateMonthlyPayroll(tenantId: string, year: number, month: number): Promise<{
    employeeCount: number;
    totalGross: number;
    totalNet: number;
    totalGosi: number;
    breakdown: { employeeId: number; name: string; net: number }[];
  }> {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, active: true, deletedAt: null },
    });

    let totalGross = 0;
    let totalNet = 0;
    let totalGosi = 0;
    const breakdown: { employeeId: number; name: string; net: number }[] = [];

    for (const emp of employees) {
      const basic = Number(emp.salary ?? 0);
      const housing = Number(emp.housingAllowance ?? 0);
      const transport = Number(emp.transportAllowance ?? 0);
      const other = Number(emp.otherAllowance ?? 0);
      const gross = basic + housing + transport + other;

      // GOSI: employee share 10%
      const gosiBase = Math.min(basic + housing, 45000);
      const gosiDeduction = emp.nationality === 'SAUDI' || emp.nationality === 'SA'
        ? gosiBase * 0.10
        : 0;

      const net = gross - gosiDeduction;
      totalGross += gross;
      totalNet += net;
      totalGosi += gosiDeduction;
      breakdown.push({ employeeId: emp.id, name: emp.name, net });

      // Upsert salary record
      await this.prisma.salary.upsert({
        where: {
          // Using a combination that should be unique
          id: (await this.prisma.salary.findFirst({ where: { tenantId, employeeId: emp.id, year, month } }))?.id ?? 0,
        },
        create: {
          tenantId,
          employeeId: emp.id,
          year,
          month,
          basicSalary: new Decimal(basic),
          additions: new Decimal(transport + other),
          deductions: new Decimal(0),
          gosiDeduction: new Decimal(gosiDeduction),
          loanDeduction: new Decimal(0),
          netSalary: new Decimal(net),
        },
        update: {
          basicSalary: new Decimal(basic),
          additions: new Decimal(transport + other),
          gosiDeduction: new Decimal(gosiDeduction),
          netSalary: new Decimal(net),
        },
      });
    }

    return { employeeCount: employees.length, totalGross, totalNet, totalGosi, breakdown };
  }
}
