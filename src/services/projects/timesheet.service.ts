/**
 * Timesheet Service
 * Uses actual ProjectTimeEntry model
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface TimesheetEntry {
  projectId: number;
  taskId?: number;
  employeeId: number;
  date: Date;
  hours: number;
  description?: string;
  billable?: boolean;
}

export interface TimesheetSummary {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  projectBreakdown: { projectId: number; name: string; hours: number; billable: number }[];
}

export class TimesheetService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Submit time entries
   */
  async submitEntries(tenantId: string, entries: TimesheetEntry[]): Promise<number> {
    // Validate no future dates
    const today = new Date();
    if (entries.some((e) => e.date > today)) {
      throw new Error('Cannot log time for future dates');
    }

    const result = await this.prisma.projectTimeEntry.createMany({
      data: entries.map((e) => ({
        tenantId,
        projectId: e.projectId,
        taskId: e.taskId,
        employeeId: e.employeeId,
        date: e.date,
        hours: new Decimal(e.hours),
        description: e.description,
        billable: e.billable ?? true,
        approved: false,
      })),
    });

    return result.count;
  }

  /**
   * Approve time entries for a period
   */
  async approveEntries(tenantId: string, projectId: number, employeeId: number, fromDate: Date, toDate: Date): Promise<number> {
    const result = await this.prisma.projectTimeEntry.updateMany({
      where: {
        tenantId,
        projectId,
        employeeId,
        date: { gte: fromDate, lte: toDate },
        approved: false,
      },
      data: { approved: true },
    });
    return result.count;
  }

  /**
   * Get timesheet summary for an employee and period
   */
  async getSummary(tenantId: string, employeeId: number, fromDate: Date, toDate: Date): Promise<TimesheetSummary> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true, name: true },
    });

    const entries = await this.prisma.projectTimeEntry.findMany({
      where: {
        tenantId,
        employeeId,
        date: { gte: fromDate, lte: toDate },
      },
      include: { project: { select: { id: true, name: true } } },
    });

    const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
    const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + Number(e.hours), 0);

    const projectMap = new Map<number, { name: string; hours: number; billable: number }>();
    for (const e of entries) {
      const key = e.projectId;
      const existing = projectMap.get(key) ?? { name: e.project.name, hours: 0, billable: 0 };
      existing.hours += Number(e.hours);
      if (e.billable) existing.billable += Number(e.hours);
      projectMap.set(key, existing);
    }

    return {
      employeeId,
      employeeName: employee?.name ?? 'Unknown',
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      projectBreakdown: Array.from(projectMap.entries()).map(([projectId, v]) => ({
        projectId,
        name: v.name,
        hours: v.hours,
        billable: v.billable,
      })),
    };
  }

  /**
   * Billing report: billable hours per project
   */
  async getBillingReport(tenantId: string, projectId: number, fromDate: Date, toDate: Date): Promise<{
    projectId: number;
    totalBillableHours: number;
    byEmployee: { employeeId: number; name: string; hours: number; rate: number; amount: number }[];
  }> {
    const entries = await this.prisma.projectTimeEntry.findMany({
      where: {
        tenantId,
        projectId,
        billable: true,
        approved: true,
        date: { gte: fromDate, lte: toDate },
      },
      include: {
        employee: { select: { id: true, name: true } },
        project: {
          include: {
            resources: {
              where: { tenantId },
              select: { employeeId: true, hourlyRate: true },
            },
          },
        },
      },
    });

    const byEmployee = new Map<number, { name: string; hours: number; rate: number; amount: number }>();
    for (const e of entries) {
      if (!e.employeeId || !e.employee) continue;
      const resourceRate = e.project.resources.find((r) => r.employeeId === e.employeeId);
      const rate = Number(resourceRate?.hourlyRate ?? 0);
      const hours = Number(e.hours);
      const existing = byEmployee.get(e.employeeId) ?? { name: e.employee.name, hours: 0, rate, amount: 0 };
      existing.hours += hours;
      existing.amount += hours * rate;
      byEmployee.set(e.employeeId, existing);
    }

    const result = Array.from(byEmployee.entries()).map(([employeeId, v]) => ({ employeeId, ...v }));

    return {
      projectId,
      totalBillableHours: result.reduce((s, r) => s + r.hours, 0),
      byEmployee: result,
    };
  }
}
