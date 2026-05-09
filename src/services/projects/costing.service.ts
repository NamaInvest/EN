/**
 * Project Costing Service — EVM using actual schema
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface EVMMetrics {
  projectId: number;
  asOfDate: Date;
  budgetAtCompletion: number;
  plannedValue: number;
  actualCost: number;
  earnedValue: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  percentComplete: number;
  status: 'ON_TRACK' | 'COST_OVERRUN' | 'SCHEDULE_DELAY' | 'CRITICAL';
}

export class ProjectCostingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Earned Value Management metrics
   */
  async getEVM(tenantId: string, projectId: number, asOfDate: Date): Promise<EVMMetrics> {
    const project = await this.prisma.project.findFirstOrThrow({
      where: { id: projectId, tenantId },
    });

    const tasks = await this.prisma.projectTask.findMany({
      where: { projectId, tenantId },
    });

    const budgetLines = await this.prisma.projectBudgetLine.findMany({
      where: { projectId, tenantId },
      select: { planned: true, actual: true },
    });

    const bac = Number(project.budget ?? 0);

    // Planned value — time-based
    const start = project.startDate ?? new Date();
    const end = project.endDate ?? new Date();
    const totalDays = Math.max(1, this.daysBetween(start, end));
    const elapsed = Math.min(this.daysBetween(start, asOfDate), totalDays);
    const pv = bac * (elapsed / totalDays);

    // Actual cost — from budget line actuals
    const ac = budgetLines.reduce((s, b) => s + Number(b.actual ?? 0), 0);

    // % complete — task-based
    const totalTasks = tasks.length || 1;
    const doneTasks = tasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED').length;
    const percentComplete = doneTasks / totalTasks;
    const ev = bac * percentComplete;

    const sv = ev - pv;
    const cv = ev - ac;
    const spi = pv > 0 ? ev / pv : 1;
    const cpi = ac > 0 ? ev / ac : 1;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;

    let status: EVMMetrics['status'] = 'ON_TRACK';
    if (cpi < 0.9 && spi < 0.9) status = 'CRITICAL';
    else if (cpi < 0.95) status = 'COST_OVERRUN';
    else if (spi < 0.95) status = 'SCHEDULE_DELAY';

    return {
      projectId,
      asOfDate,
      budgetAtCompletion: bac,
      plannedValue: Math.round(pv * 100) / 100,
      actualCost: Math.round(ac * 100) / 100,
      earnedValue: Math.round(ev * 100) / 100,
      scheduleVariance: Math.round(sv * 100) / 100,
      costVariance: Math.round(cv * 100) / 100,
      schedulePerformanceIndex: Math.round(spi * 100) / 100,
      costPerformanceIndex: Math.round(cpi * 100) / 100,
      estimateAtCompletion: Math.round(eac * 100) / 100,
      estimateToComplete: Math.round(etc * 100) / 100,
      percentComplete: Math.round(percentComplete * 10000) / 100,
      status,
    };
  }

  /**
   * Budget vs actual breakdown
   */
  async getCostBreakdown(tenantId: string, projectId: number): Promise<{
    lines: { category: string; planned: number; actual: number; variance: number }[];
    totalPlanned: number;
    totalActual: number;
    totalVariance: number;
  }> {
    const budgetLines = await this.prisma.projectBudgetLine.findMany({
      where: { projectId, tenantId },
      select: { category: true, planned: true, actual: true },
    });

    const lines = budgetLines.map((b) => ({
      category: b.category,
      planned: Number(b.planned),
      actual: Number(b.actual),
      variance: Number(b.planned) - Number(b.actual),
    }));

    const totalPlanned = lines.reduce((s, l) => s + l.planned, 0);
    const totalActual = lines.reduce((s, l) => s + l.actual, 0);

    return { lines, totalPlanned, totalActual, totalVariance: totalPlanned - totalActual };
  }

  /**
   * Record time entry
   */
  async recordTimeEntry(tenantId: string, data: {
    projectId: number;
    employeeId: number;
    taskId?: number;
    date: Date;
    hours: number;
    description: string;
    billable: boolean;
  }): Promise<number> {
    const entry = await this.prisma.projectTimeEntry.create({
      data: {
        tenantId,
        projectId: data.projectId,
        employeeId: data.employeeId,
        taskId: data.taskId,
        date: data.date,
        hours: new Decimal(data.hours),
        description: data.description,
        billable: data.billable,
      },
    });
    return entry.id;
  }

  /**
   * Update budget line actual
   */
  async recordActualCost(tenantId: string, budgetLineId: number, amount: number): Promise<void> {
    await this.prisma.projectBudgetLine.update({
      where: { id: budgetLineId },
      data: { actual: { increment: new Decimal(amount) } },
    });
  }

  private daysBetween(a: Date, b: Date): number {
    return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
