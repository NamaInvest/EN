/**
 * HR Onboarding Service
 * New employee onboarding workflow using Employee + DocumentExpiryAlert
 */
import { PrismaClient } from '@prisma/client';

export interface OnboardingChecklist {
  employeeId: number;
  employeeName: string;
  steps: {
    id: string;
    title: string;
    titleAr: string;
    completed: boolean;
    dueDate?: Date;
  }[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
}

const DEFAULT_STEPS = [
  { id: 'document_collection', title: 'Collect ID/Iqama/Passport', titleAr: 'جمع الوثائق الرسمية' },
  { id: 'contract_signing', title: 'Sign Employment Contract', titleAr: 'توقيع عقد العمل' },
  { id: 'bank_account', title: 'Provide Bank IBAN', titleAr: 'تسجيل رقم الآيبان البنكي' },
  { id: 'gosi_registration', title: 'GOSI Registration', titleAr: 'التسجيل في التأمينات الاجتماعية' },
  { id: 'medical_insurance', title: 'Medical Insurance Enrollment', titleAr: 'التسجيل في التأمين الطبي' },
  { id: 'system_access', title: 'Grant System Access', titleAr: 'منح صلاحيات النظام' },
  { id: 'equipment_issuance', title: 'Issue Equipment/Assets', titleAr: 'تسليم المعدات والأصول' },
  { id: 'orientation', title: 'Attend Orientation', titleAr: 'حضور التوجيه الوظيفي' },
];

export class OnboardingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create onboarding checklist for a new employee
   */
  async createChecklist(tenantId: string, employeeId: number): Promise<OnboardingChecklist> {
    const employee = await this.prisma.employee.findFirstOrThrow({
      where: { id: employeeId, tenantId },
      select: { id: true, name: true, iqamaNumber: true, iban: true, idNumber: true },
    });

    // Determine completed steps based on existing data
    const completedSteps = new Set<string>();
    if (employee.iqamaNumber || employee.idNumber) completedSteps.add('document_collection');
    if (employee.iban) completedSteps.add('bank_account');

    const steps = DEFAULT_STEPS.map((s) => ({
      ...s,
      completed: completedSteps.has(s.id),
    }));

    const result: OnboardingChecklist = {
      employeeId,
      employeeName: employee.name,
      steps,
      completedCount: steps.filter((s) => s.completed).length,
      totalCount: steps.length,
      isComplete: steps.every((s) => s.completed),
    };

    // Log checklist creation
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE',
        tableName: 'employee_onboarding',
        recordId: String(employeeId),
        details: JSON.stringify({ checklist: result, createdAt: new Date() }),
      },
    });

    return result;
  }

  /**
   * Mark a checklist step as completed
   */
  async completeStep(tenantId: string, employeeId: number, stepId: string): Promise<void> {
    // Perform action based on step
    if (stepId === 'gosi_registration') {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: 'UPDATE',
          tableName: 'employee_onboarding',
          recordId: String(employeeId),
          details: JSON.stringify({ step: stepId, completedAt: new Date(), note: 'GOSI registration marked complete' }),
        },
      });
    } else {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          action: 'UPDATE',
          tableName: 'employee_onboarding',
          recordId: String(employeeId),
          details: JSON.stringify({ step: stepId, completedAt: new Date() }),
        },
      });
    }
  }

  /**
   * Setup document expiry alerts for a new hire
   */
  async setupDocumentAlerts(tenantId: string, employeeId: number, docs: {
    documentType: string;
    documentNumber?: string;
    expiryDate: Date;
  }[]): Promise<void> {
    const employee = await this.prisma.employee.findFirstOrThrow({
      where: { id: employeeId, tenantId },
      select: { name: true },
    });

    const today = new Date();

    await this.prisma.documentExpiryAlert.createMany({
      data: docs.map((doc) => {
        const daysRemaining = Math.ceil((doc.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const severity = daysRemaining <= 0 ? 'EXPIRED' : daysRemaining <= 30 ? 'CRITICAL' : daysRemaining <= 90 ? 'WARNING' : 'INFO';

        return {
          tenantId,
          holderType: 'EMPLOYEE',
          holderId: employeeId,
          holderName: employee.name,
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          expiryDate: doc.expiryDate,
          daysRemaining,
          severity,
          status: 'ACTIVE',
        };
      }),
    });
  }

  /**
   * Get employees currently in onboarding
   */
  async getOnboardingEmployees(tenantId: string): Promise<{
    employeeId: number;
    name: string;
    startDate: string | null;
    completedSteps: number;
    totalSteps: number;
  }[]> {
    // New employees in last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const employees = await this.prisma.employee.findMany({
      where: { tenantId, active: true, startDate: { gte: cutoffStr } },
      select: { id: true, name: true, startDate: true, iban: true, iqamaNumber: true, idNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return employees.map((e) => {
      const completedSteps = [e.iban, e.iqamaNumber || e.idNumber].filter(Boolean).length;
      return {
        employeeId: e.id,
        name: e.name,
        startDate: e.startDate,
        completedSteps,
        totalSteps: DEFAULT_STEPS.length,
      };
    });
  }
}
