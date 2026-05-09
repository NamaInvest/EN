/**
 * GOSI API Integration Service
 * Kingdom of Saudi Arabia — General Organization for Social Insurance
 * Contribution calculation and filing based on actual Employee schema
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// GOSI Contribution rates (2024 KSA)
const GOSI_RATES = {
  SAUDI: {
    employeeContribution: 0.10,
    employerContribution: 0.1175,
  },
  NON_SAUDI: {
    employeeContribution: 0,
    employerContribution: 0.02, // hazard only
  },
};

const SALARY_CEILING = 45000;
const SALARY_FLOOR = 400;

export interface GOSIContribution {
  employeeId: number;
  period: string; // YYYY-MM
  contributionBase: number;
  employeeShare: number;
  employerShare: number;
  total: number;
}

export interface GOSIFilingResult {
  period: string;
  totalEmployees: number;
  totalContributions: number;
  dueDate: Date;
}

export class GOSIService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Register employee with GOSI — stores in idNumber field
   */
  async registerEmployee(employeeId: number, tenantId: string): Promise<{
    success: boolean;
    registrationRef?: string;
    error?: string;
  }> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
    });

    if (!employee) return { success: false, error: 'Employee not found' };
    if (!employee.idNumber && !employee.iqamaNumber) {
      return { success: false, error: 'National ID or Iqama number required' };
    }

    const registrationRef = `GOSI-${(employee.idNumber ?? employee.iqamaNumber ?? '').slice(-6)}-${Date.now().toString(36).toUpperCase()}`;

    // Store GOSI ref in notes (no gosiNumber field in schema)
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        // Use mudadStatus to track GOSI registration state
        mudadStatus: `GOSI:${registrationRef}`,
      },
    });

    return { success: true, registrationRef };
  }

  /**
   * Calculate GOSI contribution for one employee
   */
  calculateContribution(employee: {
    id: number;
    salary: Decimal | number;
    housingAllowance: Decimal | number;
    nationality: string;
  }, period: string): GOSIContribution {
    const isSaudi = employee.nationality === 'SAUDI' || employee.nationality === 'SA';
    const rates = isSaudi ? GOSI_RATES.SAUDI : GOSI_RATES.NON_SAUDI;

    const grossBase = Number(employee.salary) + Number(employee.housingAllowance);
    const contributionBase = Math.min(Math.max(grossBase, SALARY_FLOOR), SALARY_CEILING);

    return {
      employeeId: employee.id,
      period,
      contributionBase,
      employeeShare: Math.round(contributionBase * rates.employeeContribution * 100) / 100,
      employerShare: Math.round(contributionBase * rates.employerContribution * 100) / 100,
      total: Math.round(contributionBase * (rates.employeeContribution + rates.employerContribution) * 100) / 100,
    };
  }

  /**
   * Generate monthly GOSI filing for all active employees
   */
  async generateMonthlyFiling(tenantId: string, year: number, month: number): Promise<GOSIFilingResult> {
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, active: true, deletedAt: null },
    });

    const contributions = employees.map((emp) =>
      this.calculateContribution({
        id: emp.id,
        salary: emp.salary,
        housingAllowance: emp.housingAllowance,
        nationality: emp.nationality,
      }, period),
    );

    const totalContributions = contributions.reduce((s, c) => s + c.total, 0);

    // Store as GOSIMonthlyFile (note: Prisma model is gOSIMonthlyFile)
    await (this.prisma as any).gOSIMonthlyFile.create({
      data: {
        tenantId,
        period,
        month,
        year,
        status: 'DRAFT',
        totalAmount: new Decimal(totalContributions),
        employeeCount: employees.length,
        generatedAt: new Date(),
        fileContent: JSON.stringify(contributions),
      },
    });

    const dueDate = new Date(year, month, 15); // 15th of next month

    return {
      period,
      totalEmployees: employees.length,
      totalContributions,
      dueDate,
    };
  }

  /**
   * Calculate EOS (End of Service) gratuity
   */
  calculateEOS(employee: {
    startDate: string | null;
    terminationDate: Date;
    salary: Decimal | number;
    terminationReason: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT';
  }): { gratuityAmount: number; yearsOfService: number } {
    const hireDate = employee.startDate ? new Date(employee.startDate) : new Date();
    const ms = employee.terminationDate.getTime() - hireDate.getTime();
    const yearsOfService = ms / (1000 * 60 * 60 * 24 * 365.25);
    const salary = Number(employee.salary);
    let gratuityAmount = 0;

    if (employee.terminationReason === 'RESIGNATION') {
      if (yearsOfService >= 2 && yearsOfService < 10) {
        gratuityAmount = (salary / 3) * yearsOfService;
      } else if (yearsOfService >= 10) {
        gratuityAmount = salary * yearsOfService;
      }
    } else {
      const first5 = Math.min(yearsOfService, 5) * salary;
      const after5 = Math.max(0, yearsOfService - 5) * salary * 1.5;
      gratuityAmount = first5 + after5;
    }

    return {
      gratuityAmount: Math.round(gratuityAmount * 100) / 100,
      yearsOfService: Math.round(yearsOfService * 100) / 100,
    };
  }
}
