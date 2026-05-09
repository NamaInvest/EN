/**
 * GOSI Reconciliation Service
 * Match payroll GOSI deductions with GOSI statement
 */
import { PrismaClient } from '@prisma/client';
import { GOSIService } from './api.service';

export interface ReconciliationDiscrepancy {
  employeeId: number;
  employeeName: string;
  period: string;
  payrollAmount: number;
  gosiStatementAmount: number;
  difference: number;
  type: 'OVER_PAYMENT' | 'UNDER_PAYMENT' | 'MISSING';
}

export interface ReconciliationReport {
  period: string;
  totalEmployees: number;
  matched: number;
  discrepancies: ReconciliationDiscrepancy[];
  totalDifference: number;
  status: 'CLEAN' | 'HAS_DISCREPANCIES';
}

export class GOSIReconciliationService {
  private gosiService: GOSIService;

  constructor(private prisma: PrismaClient) {
    this.gosiService = new GOSIService(prisma);
  }

  /**
   * Reconcile payroll GOSI vs external GOSI statement
   */
  async reconcile(tenantId: string, year: number, month: number, gosiStatementData?: {
    employeeIdNumber: string;
    amount: number;
  }[]): Promise<ReconciliationReport> {
    const period = `${year}-${String(month).padStart(2, '0')}`;

    // Get salary records for this period
    const salaries = await this.prisma.salary.findMany({
      where: { tenantId, year, month, deletedAt: null },
      include: {
        employee: {
          select: { id: true, name: true, idNumber: true, iqamaNumber: true, salary: true, housingAllowance: true, nationality: true },
        },
      },
    });

    const discrepancies: ReconciliationDiscrepancy[] = [];

    if (gosiStatementData && gosiStatementData.length > 0) {
      // Build map from GOSI statement
      const gosiMap = new Map(gosiStatementData.map((r) => [r.employeeIdNumber, r.amount]));

      for (const sal of salaries) {
        const emp = sal.employee;
        const idKey = emp.idNumber ?? emp.iqamaNumber ?? '';
        const contribution = this.gosiService.calculateContribution(emp, period);
        const payrollAmount = Number(sal.gosiDeduction ?? 0);
        const gosiAmount = gosiMap.get(idKey) ?? 0;
        const diff = payrollAmount - gosiAmount;

        if (Math.abs(diff) > 1) {
          discrepancies.push({
            employeeId: emp.id,
            employeeName: emp.name,
            period,
            payrollAmount,
            gosiStatementAmount: gosiAmount,
            difference: diff,
            type: gosiAmount === 0 ? 'MISSING' : diff > 0 ? 'OVER_PAYMENT' : 'UNDER_PAYMENT',
          });
        }
        gosiMap.delete(idKey);
      }
    }

    const totalDifference = discrepancies.reduce((s, d) => s + Math.abs(d.difference), 0);

    // Save result to AuditLog
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE',
        tableName: 'gosi_reconciliation',
        details: JSON.stringify({ period, status: discrepancies.length === 0 ? 'CLEAN' : 'HAS_DISCREPANCIES', discrepancies }),
      },
    });

    return {
      period,
      totalEmployees: salaries.length,
      matched: salaries.length - discrepancies.filter((d) => d.type !== 'MISSING').length,
      discrepancies,
      totalDifference,
      status: discrepancies.length === 0 ? 'CLEAN' : 'HAS_DISCREPANCIES',
    };
  }

  /**
   * Generate CSV correction file
   */
  generateCorrectionFile(period: string, discrepancies: ReconciliationDiscrepancy[]): {
    fileName: string;
    content: string;
  } {
    const lines = [
      'EmployeeId,EmployeeName,PayrollAmount,GosiAmount,Difference,Type',
      ...discrepancies.map((d) =>
        `${d.employeeId},"${d.employeeName}",${d.payrollAmount},${d.gosiStatementAmount},${d.difference},${d.type}`
      ),
    ];
    return { fileName: `gosi-correction-${period}.csv`, content: lines.join('\n') };
  }
}
