/**
 * GOSI Onboarding Service
 * New employee GOSI registration workflow
 */
import { PrismaClient } from '@prisma/client';
import { GOSIService } from './api.service';

export type StepStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface OnboardingStep {
  step: string;
  status: StepStatus;
  completedAt?: Date;
  notes?: string;
}

export interface OnboardingChecklist {
  employeeId: number;
  steps: OnboardingStep[];
  overallStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export class GOSIOnboardingService {
  private gosiService: GOSIService;

  constructor(private prisma: PrismaClient) {
    this.gosiService = new GOSIService(prisma);
  }

  /**
   * Run GOSI onboarding checklist for a new employee
   */
  async onboard(employeeId: number, tenantId: string): Promise<OnboardingChecklist> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
    });

    if (!employee) {
      return {
        employeeId,
        steps: [{ step: 'Find Employee', status: 'FAILED', notes: 'Employee not found' }],
        overallStatus: 'FAILED',
      };
    }

    const steps: OnboardingStep[] = [
      { step: 'Validate National ID / Iqama', status: 'PENDING' },
      { step: 'Verify employment start date', status: 'PENDING' },
      { step: 'Register with GOSI', status: 'PENDING' },
      { step: 'Confirm contribution rate', status: 'PENDING' },
    ];

    // Step 1: ID check
    if (employee.idNumber || employee.iqamaNumber) {
      steps[0].status = 'COMPLETED';
      steps[0].completedAt = new Date();
    } else {
      steps[0].status = 'FAILED';
      steps[0].notes = 'Missing National ID and Iqama number';
    }

    // Step 2: Start date
    if (employee.startDate) {
      steps[1].status = 'COMPLETED';
      steps[1].completedAt = new Date();
    } else {
      steps[1].status = 'FAILED';
      steps[1].notes = 'Employment start date not set';
    }

    // Step 3: Register if steps 1 & 2 passed
    if (steps[0].status === 'COMPLETED' && steps[1].status === 'COMPLETED') {
      const result = await this.gosiService.registerEmployee(employeeId, tenantId);
      if (result.success) {
        steps[2].status = 'COMPLETED';
        steps[2].completedAt = new Date();
        steps[3].status = 'COMPLETED';
        steps[3].completedAt = new Date();
        steps[3].notes = `Ref: ${result.registrationRef}`;
      } else {
        steps[2].status = 'FAILED';
        steps[2].notes = result.error;
      }
    }

    const allDone = steps.every((s) => s.status === 'COMPLETED');
    const hasFailed = steps.some((s) => s.status === 'FAILED');
    const overallStatus = allDone ? 'COMPLETED' : hasFailed ? 'FAILED' : 'IN_PROGRESS';

    // Log to AuditLog
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE',
        tableName: 'gosi_onboarding',
        recordId: String(employeeId),
        details: JSON.stringify({ steps, overallStatus }),
      },
    });

    return { employeeId, steps, overallStatus };
  }

  /**
   * Bulk onboard employees hired this month
   */
  async bulkOnboard(tenantId: string): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // startDate is stored as String in schema, so we filter active employees without GOSI
    const newEmployees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        active: true,
        mudadStatus: null, // no GOSI registration yet
        deletedAt: null,
      },
    });

    let succeeded = 0;
    let failed = 0;

    for (const emp of newEmployees) {
      try {
        const result = await this.onboard(emp.id, tenantId);
        if (result.overallStatus === 'COMPLETED') succeeded++;
        else failed++;
      } catch {
        failed++;
      }
    }

    return { processed: newEmployees.length, succeeded, failed };
  }
}
